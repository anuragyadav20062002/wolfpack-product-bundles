# Phase 2 Competitive Parity — Implementation Plan

**Created:** 2026-04-26  
**Based on:** `docs/competitor-analysis/13-wolfpack-gap-analysis-phases.md` + live EB crawl + codebase audit  
**Status:** Planning complete — ready for SDE

---

## Scope

Phase 2 covers the following items from the gap analysis, refined by codebase audit and competitor research:

| # | Item | Status |
|---|------|--------|
| 2.1 | Language / Text Overrides (per-bundle, English + multi-language) | Planned |
| 2.6 | Analytics Date Comparison UI | ✅ **Done** (`analytics-compare-ui-1`) |
| 2.7 | Integrations Hub (documentation + functional research) | Planned |

Items **descoped or deferred to their own plans:**
- 2.2 Bundle Templates / Layout Picker → own plan
- 2.3 Add-on Products / Upsell Step → own plan
- 2.4 Bundle Settings Extended → own plan
- 2.5 DCP Expert Colors → **DESCOPED** (we already have 200+ CSS variables, exceeds EB)
- 2.8 Named Contact / Support → own plan

---

## 2.6 Analytics Date Comparison — DONE

Committed in `[analytics-compare-ui-1]`. No further work needed.

What shipped:
- "Compare" toggle button next to date range picker (defaults ON)
- "vs [prev period dates]" pill shows comparison window label
- All delta badges (Bundle Revenue, Orders, AOV, % Revenue, Views, UTM cards) gated by toggle
- `prevFrom`/`prevTo` returned from loader so dates are human-readable

---

## 2.1 Language / Text Overrides

### What EB has

30+ overridable string fields, organized by section in a dedicated "Language" tab on each bundle.
Multilanguage (35+ locales) is a paid feature. English-only text overrides are available on all plans.

EB's fields by section:
- **Cart & Checkout:** "Bundle Contains Label", "Bundle Original Price Label", "You Save" label
- **Product Card:** Add Product button text
- **Bundle Cart:** Next button, Add to Cart button, Total label, View Cart Products, Discount Badge suffix, Cart inclusion title
- **Bundle General:** No Products Available, Choose Options, Load More, Preparing Bundle, Redirecting, Added, Add, Review, Select Bundle Products
- **Popups:** modal/overlay strings
- **Toasts:** toast notification messages
- **Addons / Messages:** free gift section labels, dynamic messaging

### What we have

Two overridable strings in `BundleUiMessaging`:
- `progressTemplate` — discount progress message (e.g., "Add {conditionText} to get {discountText}")
- `successTemplate` — success message (e.g., "Congratulations! You got {discountText}!")

One global override via DCP: `buttonAddToCartText` (store-wide, not per-bundle).

### Widget string audit — all hardcoded user-visible strings

From auditing both widget JS files:

**Full-Page Widget (`bundle-widget-full-page.js`):**
| String | Context |
|--------|---------|
| `"Add to bundle"` | Product card add button (global DCP override exists) |
| `"Added"` | Product card after add |
| `"Next"` | Footer next step button |
| `"Back"` | Footer back step button |
| `"Add to cart"` | Footer final add-to-cart button |
| `"Total"` | Footer total label |
| `"View selected products"` | Sidebar view products toggle |
| `"No products available"` | Empty step state |
| `"Choose options"` | Variant selector prompt |
| `"Load more"` | Pagination in search |
| `"Preparing bundle..."` | Loading overlay |
| `"Redirecting..."` | Checkout redirect overlay |
| `"Review"` | Final step review button |
| `"Select bundle products"` | Step instruction fallback |
| `"You save"` | Discount display |
| `"Free"` | Free gift badge |
| `"Items"` | Cart inclusion count suffix |

**Product-Page Widget (`bundle-widget-product-page.js`):**
Same core strings, plus:
| String | Context |
|--------|---------|
| `"Add to bundle"` | Product card |
| `"Added"` | After product add |
| `"Complete bundle"` | Final CTA (bottom sheet) |
| `"Your bundle"` | Bottom sheet / sidebar title |

**Priority tier (implement first):**
1. Add button text — highest merchant-facing visibility
2. Next / Back / Add to Cart — footer navigation (critical flow)
3. Total label — pricing display
4. No products available — error state
5. Added state text — immediate feedback
6. You save — discount emphasis

**Lower priority (phase 2b or i18n phase):**
- Loading/redirecting overlays, Load more, Review, Choose options

### Architecture

#### Per-bundle Messages Tab (bundle editor)

Text overrides live in the **bundle editor** as a new "Messages" section, not in DCP. This matches EB and means each bundle can have its own label set (e.g., a gift bundle says "Add to box" while a supplement bundle says "Add to bundle").

**Data model — add to `Bundle`:**
```prisma
textOverrides Json? // { addButton, addedText, nextButton, backButton, addToCartButton, totalLabel, noProductsLabel, youSaveLabel, itemsLabel }
```

No new Prisma model needed — a JSON column on Bundle is the right approach (sparse, extensible).

**Widget reads:** `bundle.textOverrides` from the formatted bundle config (already passed via metafield). Widget merges overrides with built-in defaults at render time.

**Admin UI:** New "Messages" accordion section in both FPB and PDP bundle editor routes. Simple text fields using Polaris `TextField`. No new route needed — extend existing configure routes.

#### Multi-language (Shopify Markets)

Shopify Markets exposes the storefront locale via `Shopify.locale` (e.g., `"en"`, `"fr"`, `"de"`).

**Architecture for multi-language:**
```prisma
textOverridesByLocale Json? // { "en": { addButton: "Add to bundle" }, "fr": { addButton: "Ajouter" } }
```

Widget reads locale at init, checks `textOverridesByLocale[Shopify.locale]`, falls back to `textOverrides` (English), then falls back to built-in defaults.

**Admin UI for multi-language:** Language selector dropdown in the Messages tab. Merchant picks a language, fills fields for that locale. Uses Shopify's `/admin/api/graphql` shop locales query to populate the language list.

### Files to change

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `textOverrides Json?` and `textOverridesByLocale Json?` to Bundle |
| `prisma/migrations/...` | SQL migration: `ALTER TABLE "Bundle" ADD COLUMN "textOverrides" JSONB; ADD COLUMN "textOverridesByLocale" JSONB;` |
| `app/lib/bundle-formatter.server.ts` | Include `textOverrides` and `textOverridesByLocale` in `FormattedBundle` |
| `app/services/bundles/metafield-sync/types.ts` | Add fields to `BundleUiConfig` interface |
| `app/services/bundles/metafield-sync/bundle-config-metafield.server.ts` | Include overrides when writing metafield |
| `app/assets/bundle-widget-full-page.js` | `_resolveText(key)` helper — reads locale → textOverridesByLocale → textOverrides → default |
| `app/assets/bundle-widget-product-page.js` | Same `_resolveText(key)` helper |
| `app/routes/app/app.bundles.full-page.configure.$bundleId/route.tsx` | Add Messages section to editor |
| `app/routes/app/app.bundles.product-page.configure.$bundleId/route.tsx` | Same |
| `app/routes/app/app.bundles.full-page.configure.$bundleId/handlers/handlers.server.ts` | Read + save textOverrides / textOverridesByLocale |
| `app/routes/app/app.bundles.product-page.configure.$bundleId/handlers/handlers.server.ts` | Same |
| `app/routes/api/api.bundle.$bundleId.json.tsx` (proxy) | No change needed — passes through formatted bundle |

### Acceptance criteria

- [ ] Merchant can override the 8 priority strings per bundle in the editor Messages tab
- [ ] Overrides save and persist correctly
- [ ] Widget renders overridden text instead of defaults
- [ ] Merchant can select a second language and fill overrides for that locale
- [ ] Widget reads `Shopify.locale`, applies correct locale overrides, falls back gracefully
- [ ] No widget JS rebuild needed to add new string keys (JSON-driven)
- [ ] Widget build (`npm run build:widgets`) run after JS changes
- [ ] Prisma migration created and documented

### Questions before SDE
- None — architecture is clear. Proceed to SDE.

---

## 2.7 Integrations Hub

### What EB has

A `/integrations` route — documentation hub only. Each integration card has:
- App name + logo
- One-line description of what it enables
- "View Setup" button → external guide URL

10 integrations across 5 categories: Pre-orders, Subscriptions, Reviews, Page Builders, Checkout.

No live API integrations in EB — it's purely a docs/marketing page. The subscription integrations shown in the hub match the Subscriptions panel in the editor (same 3 apps).

### Functional integration research findings

| Integration | What merchants want | Functional integration scope | API stability | Complexity | Priority |
|-------------|--------------------|-----------------------------|---------------|------------|----------|
| **Recharge** | Subscription bundles (recurring orders) | Sync bundle selections to Recharge subscription + cart transform for recurring line items | Public GraphQL API, very stable | High | 🔴 Phase 3 |
| **Judge.me** | Star ratings on bundle product cards | Fetch review aggregates (rating + count) per product via public REST API, render in widget | Public REST API, stable | Low | 🟡 Phase 2 functional |
| **Klaviyo** | Bundle discount codes in email flows | Shopify Discount API + Klaviyo profile property sync on bundle add-to-cart | Both stable | Medium | 🟡 Phase 2 functional |
| **PageFly** | Embed bundle widget in custom pages | App Block targeting — already works via Shopify App Blocks | No API needed | Low | 🟢 Doc only |
| **Yotpo** | Reviews on bundle products | Lower demand than Judge.me; similar API approach | Stable | Low | Defer |

### Phase 2 scope — what to build

**Phase 2a — Integrations Hub route (documentation):**
A new `/app/integrations` Remix route with cards for all researched integrations. Matches EB's approach. Static — no backend. Includes "Request Integration" link (Typeform or email).

**Phase 2b — Judge.me functional integration:**
Judge.me has a free public REST API endpoint: `https://judge.me/api/v1/reviews?api_token={token}&shop_domain={domain}` that returns product reviews. The widget can fetch aggregated rating data and render star badges on product cards.

Implementation:
1. New settings toggle in bundle editor: "Show Judge.me reviews" (boolean, stored in `textOverrides` or a dedicated `integrations Json?` field on Bundle)
2. API proxy route: `GET /apps/product-bundles/api/integrations/judgeme?shop={shop}` — fetches ratings from Judge.me API, caches in Redis/DB for 1 hour
3. Widget: if Judge.me enabled in bundle config, fetches ratings on init and renders star badges on product cards

**Phase 2c — App Block documentation (PageFly/GemPages):**
Our existing Shopify App Blocks already work with PageFly/GemPages — merchants just need to know. Add a setup guide card in the integrations hub.

### Architecture

#### New route

```
app/routes/app/app.integrations.tsx    ← new static route
```

Navigation: Add "Integrations" link to the Shopify app nav (`<NavMenu>` in `app/routes/app/app.tsx`).

#### Judge.me proxy (if building functional integration)

```
app/routes/api/api.integrations.judgeme.tsx    ← cached proxy
```

Caching strategy: store rating data in `ShopSettings` or a new `IntegrationCache` model with TTL. Don't hit Judge.me API on every widget load.

#### Bundle model change (for Judge.me toggle)

```prisma
integrations Json? // { judgeMeEnabled: boolean, judgeMeApiToken: string }
```

### Integrations hub categories and cards

**Subscriptions**
- Recharge — "Enable recurring subscription bundles" — View Setup (links to guide) + "Coming soon" badge
- Skio — "Add subscription selling plans to bundles" — View Setup
- Appstle — "Subscribe-and-save options on bundles" — View Setup

**Reviews**
- Judge.me — "Show star ratings on bundle product cards" — Enable button (functional) or View Setup

**Page Builders**
- PageFly — "Embed bundles on custom landing pages via App Block" — View Setup
- GemPages — Same

**Pre-orders**
- Stoq — "Pre-order out-of-stock bundle products" — View Setup

**Request Integration CTA**
- "Don't see your app? Request an integration →" (mailto or Typeform)

### Files to change

| File | Change |
|------|--------|
| `app/routes/app/app.integrations.tsx` | New static route — integration cards grid |
| `app/routes/app/app.tsx` | Add Integrations nav link in `<NavMenu>` |
| `docs/app-nav-map/APP_NAVIGATION_MAP.md` | Add `/app/integrations` route |
| `app/routes/api/api.integrations.judgeme.tsx` | (Phase 2b) Judge.me proxy with caching |
| `prisma/schema.prisma` | (Phase 2b) Add `integrations Json?` to Bundle |
| `app/assets/bundle-widget-full-page.js` | (Phase 2b) Fetch + render Judge.me star badges |
| `app/assets/bundle-widget-product-page.js` | (Phase 2b) Same |

### Acceptance criteria

- [ ] `/app/integrations` route renders integration cards by category
- [ ] Each card has app name, description, View Setup link or Enable button
- [ ] "Request Integration" CTA present
- [ ] Integrations link in app sidebar nav
- [ ] APP_NAVIGATION_MAP.md updated
- [ ] (Phase 2b) Judge.me toggle in bundle editor
- [ ] (Phase 2b) Star ratings visible on product cards when enabled
- [ ] (Phase 2b) Judge.me API calls cached — not called on every widget load

### Questions before SDE

1. Do you want to build the Judge.me functional integration now, or just the documentation hub first?
2. Do you have a Judge.me account / API token for the test store?
3. For the "Request Integration" CTA — do you want a Typeform/Tally link, a mailto, or an in-app text field that saves to DB?

---

## Execution Order

```
Phase 2 execution sequence:

[DONE] 2.6  Analytics Compare UI
[NEXT] 2.7a Integrations Hub (docs only) — 1 day, no backend
[THEN] 2.1a Text Overrides — English only, per-bundle Messages tab
[THEN] 2.1b Multi-language — Shopify Markets locale detection + per-locale overrides
[THEN] 2.7b Judge.me functional integration (if approved)
```

The integrations hub comes first because it's a static route with no DB changes — fastest visible win. Text overrides require a Prisma migration and widget rebuild so they take longer.

---

## Issues to create when starting each item

| Item | Issue ID |
|------|----------|
| 2.7a Integrations Hub | `integrations-hub-1` |
| 2.1a Text Overrides (English) | `bundle-text-overrides-1` |
| 2.1b Multi-language | `bundle-multilanguage-1` |
| 2.7b Judge.me | `judgeme-integration-1` |
