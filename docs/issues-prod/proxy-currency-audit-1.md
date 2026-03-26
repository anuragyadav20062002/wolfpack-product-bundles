# Issue: Proxy URL, Widget Currency & Cart Transform Currency Audit

**Issue ID:** proxy-currency-audit-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 18:45

## Overview
Full audit of: (1) Shopify App Proxy URL setup and all usages, (2) Widget currency handling vs Shopify recommended approach, (3) Cart Transform currency handling vs Shopify recommended approach.

---

## Audit 1: Shopify App Proxy Usage

### Configuration
- **Proxy path:** `/apps/product-bundles` (prefix=apps, path=product-bundles)
- **Target URL:** `https://wolfpack-product-bundle-app.onrender.com`
- **Defined in:** `shopify.app.toml` lines 37-40

### Routes via App Proxy

| Route | Auth | Status |
|-------|------|--------|
| `GET /api/bundle/:id.json` | Custom HMAC verification | ✅ Correct |
| `GET /api/bundles.json` | `requireAppProxy()` → Shopify SDK | ✅ Correct |
| `GET /api/design-settings/:shop` | None (intentional — public CSS) | ✅ Acceptable |
| `POST /api/widget-error` | None (intentional — telemetry only) | ✅ Acceptable |
| `GET /api/proxy-health` | None (intentional — health check) | ✅ Acceptable |
| `GET /api/storefront-products` | ❌ None — reads `?shop=` directly | 🔴 CRITICAL |
| `GET /api/storefront-collections` | ❌ None — reads `?shop=` directly | 🔴 CRITICAL |

### 🟠 Note: storefront-products + storefront-collections are NOT called via proxy

**File:** `app/routes/api/api.storefront-products.tsx`
**File:** `app/routes/api/api.storefront-collections.tsx`

These routes are called **directly** by the widget using `window.__BUNDLE_APP_URL__` (the raw Render server URL), NOT through the Shopify app proxy. Proxy HMAC verification does not apply here — there is no proxy signature in these requests.

**Actual concern:** Both routes accept `?shop=` from query params and use it to look up the Shopify Storefront API access token from the database. A third party who knows a shop domain could request the storefront token and use it to query published product data.

**Actual risk level:** LOW-MEDIUM. Shopify Storefront API tokens are **intentionally public** — they only grant read access to published storefront data (products, collections, prices). The endpoint already returns 404 for unknown shop domains (shops not in the DB). The worst-case exposure is published product data, which is public by design.

**Potential improvement (non-urgent):** Add a short-lived signed token injected by the Liquid block so only genuine storefront sessions can call these routes. Not a blocker — no sensitive or admin data is exposed.

---

## Audit 2: Widget Currency Handling

**File:** `app/assets/widgets/shared/currency-manager.js`

### What's Correct
- ✅ Uses `window.Shopify.currency.active` as primary customer currency source
- ✅ Uses `window.Shopify.formatMoney()` for display formatting (official API)
- ✅ Falls back gracefully to shop base currency when Markets not active

### Issues Found

| Issue | File | Severity |
|-------|------|----------|
| Assumes all prices in cents without validation | `pricing-calculator.js` lines 44-50 | 🟠 Medium |
| Hard-coded currency symbol map (only 20 currencies) | `currency-manager.js` lines 61-71 | 🟡 Low |
| Rate-based rounding with `Math.round()` can accumulate errors | `currency-manager.js` line 48 | 🟡 Low |
| No validation that exchange rate is a valid number (NaN/Infinity risk) | `currency-manager.js` line 28 | 🟡 Low |

### Liquid Injection (Both Blocks)
`bundle-full-page.liquid` lines 283-294 (and `bundle-product-page.liquid` lines 406-417):
```liquid
window.shopCurrency = {{ shop.currency | json }};
window.shopMoneyFormat = {{ shop.money_format | json }};
window.shopifyMultiCurrency = {
  shopBaseCurrency: {{ shop.currency | json }},
  customerCurrency: null,
  exchangeRate: 1,
  isMultiCurrencyEnabled: false
};
```
`customerCurrency` and `exchangeRate` are hardcoded to `null` and `1` — multi-currency is not actively injected from Liquid. The widget falls back to `window.Shopify.currency.active` in the browser (JS), which is correct per Shopify's recommended approach for storefronts with Markets.

**Overall: Widget currency is acceptable.** The medium issue (cents assumption) is worth noting but unlikely to cause visible bugs since the Storefront API consistently returns cents in our pipeline.

---

## Audit 3: Cart Transform Currency Handling

**File:** `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`

### 🔴 Critical: Mixed Units Bug in `fixed_amount_off` Discount

Cart line prices arrive as **decimals** (e.g., `85.50` EUR) from Shopify's cart API.
The `price_adjustment.value` for `fixed_amount_off` is stored in **cents** (e.g., `1000` = €10.00).

The discount calculation at lines 221-226 divides `value / 100` (converting cents to decimal) then divides by `originalTotal` (already in decimals). This is correct for single-currency but the concern is that `originalTotal` aggregates across multiple decimal prices without any currency guard.

**Example:**
```
originalTotal = 85.50 (decimal EUR, from cart)
value = 1000 (cents = €10.00)
amountOff = 1000 / 100 = 10.0
discountPct = (10.0 / 85.50) * 100 = 11.7%  ← CORRECT
```

After re-checking: the `value / 100` conversion normalises cents to decimals before comparison — this is actually **correct math**. The earlier concern about off-by-100 was a false positive from the audit script.

**Actual cart transform currency issues:**

| Issue | Severity | Description |
|-------|----------|-------------|
| No explicit currency field in CartTransformInput | 🟠 Medium | Assumes all cart prices already in customer's presentment currency — true per Shopify spec but not validated |
| `cart-transform-currency-utils.ts` exists but unused | 🟡 Low | Dead code with hard-coded approximate exchange rates |
| MERGE rounding: `Math.round(originalTotal * 100)` | 🟡 Low | Precision loss if originalTotal has more than 2 decimal places |
| Component pricing stored in cents but no currency label | 🟡 Low | If cart comes in multi-currency, component pricing metafield is still in shop base currency cents |

### Unused Currency Utils
`extensions/bundle-cart-transform-ts/src/cart-transform-currency-utils.ts` contains hard-coded exchange rates (`USD: 1.0`, `INR: 83.0`, `EUR: 0.85`, etc.) and helper functions that are **never imported or called** in `cart_transform_run.ts`. These are dead code and should be deleted.

### Cart Transform's Actual Multi-Currency Behaviour
Shopify's Cart Transform API always provides prices in the customer's **presentment currency** (the currency they see). The MERGE discount percentage is calculated against those presentment prices — so the discount is currency-agnostic by design. This means the cart transform works correctly for multi-currency without any explicit currency handling.

---

## Priority of Fixes

| # | Fix | Severity | Effort |
|---|-----|----------|--------|
| 1 | Delete dead `cart-transform-currency-utils.ts` (hard-coded rates, never used) | 🟡 Low | Trivial |
| 2 | Add NaN guard to exchange rate in `currency-manager.js` | 🟡 Low | Trivial |
| 3 | Add `assert` comment to `pricing-calculator.js` about cents assumption | 🟡 Low | Trivial |
| 4 | Signed token for storefront-products/storefront-collections (non-urgent) | 🟠 Medium | High |

---

## Phases Checklist
- [x] Phase 1: Audit all proxy routes
- [x] Phase 2: Audit widget currency handling
- [x] Phase 3: Audit cart transform currency handling
- [ ] Phase 4: Fix HMAC on storefront-products + storefront-collections
- [ ] Phase 5: Delete dead currency utils, add guards
