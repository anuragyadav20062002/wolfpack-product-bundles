# Free Gift Checkout Pricing — Research Conclusion & Implementation Plan

**Date:** 2026-03-24
**Author:** Engineering
**Status:** Approved for Implementation

---

## 1. Problem Statement

A bundle step marked `isFreeGift = true` is visually displayed as **$0** in the widget sidebar
and with a "Free" badge on the product card. However, the **actual checkout price** is wrong:
the free gift item is discounted by the same bundle-level percentage as paid items (e.g. 10%),
not by 100%. The $0 display is a cosmetic lie.

### Root Cause
`PricingCalculator.calculateBundleTotal` includes the free gift item's full retail price in
`totalPrice`. Cart Transform's `calculateDiscountPercentage` similarly computes the discount
on the sum of ALL component lines (paid + free gift), applying a uniform `percentageDecrease`
to the merged bundle. Neither layer distinguishes free-gift cost from paid cost.

---

## 2. Technology Decision: Cart Transform vs Discount Functions

### Research Summary

| Dimension | Cart Transform (MERGE) | Cart Transform (EXPAND) | Discount Functions |
|-----------|---|---|---|
| Per-component $0 pricing | ❌ Not possible | ✅ `fixedPricePerUnit: "0"` per item | ❌ Components not targetable post-MERGE |
| Architecture change needed | Minimal (math only) | Major (invert entire UX flow) | N/A |
| Execution order | Stage 1 | Stage 1 | Stage 2 (after Cart Transform) |
| Works on all Shopify plans | ✅ | ✅ | ✅ |
| Shopify Scripts (deprecated) | EOL June 2026 | — | — |
| Explicit "$0" line at checkout | ❌ (one merged line) | ✅ | ✅ (if lines exist) |

### Why NOT Cart Transform EXPAND

The EXPAND model requires: one bundle-parent SKU in cart → Cart Transform expands it into
components. Our app does the opposite: customers add individual components → Cart Transform
MERGES them. Switching to EXPAND would require:

- A single "bundle variant" that customers add to cart (not individual products)
- A complete rewrite of the widget add-to-cart flow
- A complete rewrite of the Cart Transform function
- New Shopify variant/product per bundle configuration

This is a major product redesign, not a bug fix. **Not recommended.**

### Why NOT Discount Functions

Discount Functions run **after** Cart Transform. By the time they execute, all component lines
are already merged into a single bundle parent line — individual component lines no longer exist
as addressable cart lines. A Discount Function cannot reach inside a merged line to apply 100%
off to one component. Discount Functions only operate on whole cart lines.

The only scenario where Discount Functions would work for free-gift pricing is if the free gift
component line is **not merged** and left as a separate cart line. This creates a dangling item
in the cart that can be independently removed, creating a data integrity problem.

### ✅ Conclusion: Cart Transform MERGE with Adjusted Discount Math

**Keep the existing MERGE architecture. Change the discount percentage calculation to account
for free gift lines.**

The Cart Transform already receives each component line's cost and attributes. When computing
`percentageDecrease` for the merged bundle, we identify which component lines are free gifts
(via `_bundle_step_type: free_gift` attribute), subtract their cost from the "paid" portion,
and compute the effective discount percentage that makes the bundle total equal only the
discounted cost of paid items.

**Result at checkout:** The merged bundle line shows at the correct price (paid items discounted,
free gift effectively $0). The customer sees one bundle line at the right price. No new
extensions, no architectural change.

---

## 3. The Math

### Terminology

```
paidLines      = component lines where attribute(_bundle_step_type) ≠ "free_gift"
freeGiftLines  = component lines where attribute(_bundle_step_type) === "free_gift"
paidTotal      = Σ cost of paidLines  (in presentment currency)
freeGiftTotal  = Σ cost of freeGiftLines
originalTotal  = paidTotal + freeGiftTotal  (current: used for all discount calc)
targetTotal    = what the customer should actually pay
```

### Case 1: `percentage_off` (e.g. 10%)

```
targetTotal = paidTotal × (1 - percentage/100)
effectivePct = (1 - targetTotal / originalTotal) × 100
```

**Example:** T-shirt ₹500 + Jeans ₹800 + Cap (free gift) ₹200, 10% bundle discount

```
paidTotal      = 1300
freeGiftTotal  = 200
originalTotal  = 1500
targetTotal    = 1300 × 0.90 = 1170
effectivePct   = (1 - 1170/1500) × 100 = 22.0%
mergedTotal    = 1500 × (1 - 0.22) = 1170  ✓
```

Without free-gift adjustment (current): customer pays 1500 × 0.90 = 1350 (cap costs ₹18, not free).

### Case 2: `fixed_amount_off` (e.g. ₹100 off)

```
amountOff   = (value_cents / 100) × presentmentRate       # existing conversion
targetTotal = max(0, paidTotal - amountOff)               # clamp: prevents negative price
effectivePct = (1 - targetTotal / originalTotal) × 100
             = (amountOff + freeGiftTotal) / originalTotal × 100  [when amountOff ≤ paidTotal]
```

Note: when `amountOff > paidTotal`, `targetTotal = 0` and `effectivePct = 100%` — the
customer pays nothing. This matches the spirit of the discount (large amount-off fully
covers all paid items) and is consistent with the `Math.max(0, ...)` clamp in code.

### Case 3: `fixed_bundle_price` (e.g. ₹999)

**⚠️ This case does require a change** — the current code charges the customer exactly
`fixedPrice` even when `fixedPrice > paidTotal`, which means the customer pays more than
the paid items' retail total (the "free" gift is being charged for).

The fix caps the customer's payment at `paidTotal`:

```
fixedPrice  = (value_cents / 100) × presentmentRate
targetTotal = min(fixedPrice, paidTotal)
effectivePct = (1 - targetTotal / originalTotal) × 100
```

Sub-cases:

| Condition | targetTotal | Customer pays | Free gift |
|---|---|---|---|
| fixedPrice ≤ paidTotal (normal) | fixedPrice | fixedPrice | Free ✓ |
| fixedPrice > paidTotal (edge) | paidTotal | paidTotal (full list, no discount) | Free ✓ |
| fixedPrice ≥ originalTotal (extreme) | paidTotal | paidTotal | Free ✓ |

The `min(fixedPrice, paidTotal)` guard ensures the free gift is always free regardless of
how the merchant set the fixed price. Without it, a merchant who sets fixedPrice = ₹1400
on a bundle where paidTotal = ₹1300 and freeGiftTotal = ₹200 would charge the customer
₹100 for the gift they were promised for free.

### Condition Check Adjustment

Amount-based conditions (e.g. "spend ₹1000 to unlock") and quantity-based conditions should
check only the **paid** items, not the free gift. Free gift items should not contribute to
unlocking a paid-item discount.

```
// Before:
conditionValue = conditions.value (applies to originalTotal or totalQuantity)

// After:
if conditions.type === 'amount':  check paidTotal >= conditionValue (not originalTotal)
if conditions.type === 'quantity': check paidQuantity >= conditionValue (not totalQuantity)
```

---

## 4. Widget Pricing Display Fix

### Current Problem

`PricingCalculator.calculateBundleTotal` includes the free gift item's price in `totalPrice`.
The widget's "Add Bundle to Cart" button and modal footer show a price that includes the free
gift at full cost (before bundle discount), only partially discounting it. The display should
show: (paid items discounted) + (free gift at $0).

### Required Change

Add an optional `steps` parameter to `calculateBundleTotal`. When provided, skip steps where
`step.isFreeGift === true` when summing `totalPrice`. This gives the widget the correct basis
for calculating and displaying the final price.

```js
// pricing-calculator.js
static calculateBundleTotal(selectedProducts, stepProductData, steps = null) {
  // existing logic...
  selectedProducts.forEach((stepSelections, stepIndex) => {
    const step = steps?.[stepIndex];
    if (step?.isFreeGift) return; // ← new: skip free gift steps
    // ... rest of existing accumulation logic
  });
}
```

Call sites in both widgets pass `this.selectedBundle.steps` as the third argument:
```js
// PDP widget updateAddToCartButton (line ~1193):
const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
  this.selectedProducts,
  this.stepProductData,
  this.selectedBundle?.steps   // ← add
);
```

The discount rules are still applied to `totalPrice` (paid items only). The resulting
`discountInfo.finalPrice` is what the customer pays for paid items. The free gift is
shown separately as $0 in the UI (already done cosmetically in FPB sidebar).

---

## 5. Implementation Plan

### Phase 1 — Cart Transform: Read Free Gift Attribute

**File:** `extensions/bundle-cart-transform-ts/src/cart-transform-input.graphql`

Add `stepType` to the cart line query:

```graphql
lines {
  id
  quantity
  cost {
    amountPerQuantity { amount currencyCode }
    totalAmount { amount currencyCode }
  }
  merchandise {
    ... on ProductVariant {
      id
      product { id title }
    }
  }
  bundleId:    attribute(key: "_bundle_id")    { value }
  bundleName:  attribute(key: "_bundle_name")  { value }
  stepType:    attribute(key: "_bundle_step_type") { value }   # ← NEW
}
```

**File:** `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`

1. Add helper to check if a line is a free gift:
```typescript
function isFreeGiftLine(line: CartTransformInput['cart']['lines'][number]): boolean {
  return line.stepType?.value === 'free_gift';
}
```

2. In the bundle processing loop, split `originalTotal` into `paidTotal` and `freeGiftTotal`:
```typescript
let paidTotal = 0;
let freeGiftTotal = 0;
let paidQuantity = 0;
let totalQuantity = 0;

for (const l of bundleComponentLines) {
  const lineTotal = safeParseFloat(l.cost.totalAmount.amount);
  totalQuantity += l.quantity;
  if (isFreeGiftLine(l)) {
    freeGiftTotal += lineTotal;
  } else {
    paidTotal += lineTotal;
    paidQuantity += l.quantity;
  }
}
const originalTotal = paidTotal + freeGiftTotal;
```

3. Update `calculateDiscountPercentage` signature and logic:
```typescript
function calculateDiscountPercentage(
  priceAdjustment: PriceAdjustmentConfig,
  paidTotal: number,         // ← was: originalTotal
  originalTotal: number,     // ← NEW: paidTotal + freeGiftTotal
  totalQuantity: number,
  paidQuantity: number,      // ← NEW: excludes free gift items
  presentmentCurrencyRate: number
): number {
  // Condition check: use paidTotal for amount conditions, paidQuantity for quantity
  if (conditions) {
    const actualValue = conditions.type === 'amount' ? paidTotal : paidQuantity;
    // ... same condition logic ...
  }

  let targetPrice = 0;
  switch (method) {
    case 'percentage_off':
      targetPrice = paidTotal * (1 - value / 100);
      break;
    case 'fixed_amount_off': {
      const amountOff = (value / 100) * presentmentCurrencyRate;
      targetPrice = Math.max(0, paidTotal - amountOff);
      break;
    }
    case 'fixed_bundle_price': {
      // fixedBundlePrice is what the customer pays total (covers paid items only, gift is free)
      const fixedPrice = (value / 100) * presentmentCurrencyRate;
      targetPrice = Math.min(fixedPrice, paidTotal);
      break;
    }
  }

  if (originalTotal <= 0) return 0;
  const result = (1 - targetPrice / originalTotal) * 100;
  return Number.isFinite(result) ? Math.max(0, Math.min(100, result)) : 0;
}
```

4. Update the call site to pass the new parameters.

5. Round `effectivePct` to 4 decimal places before passing to Shopify's `percentageDecrease`
   field to avoid penny-level over/undercharges from floating-point repeating decimals:
   ```typescript
   const rounded = Math.round(result * 10000) / 10000;
   return Number.isFinite(rounded) ? Math.max(0, Math.min(100, rounded)) : 0;
   ```
   Example without rounding: paidTotal=1000, originalTotal=1100, 10% off → 18.181818...%
   Applied to 1100 this would round differently than `targetTotal = 900` in different JS
   engines. Rounding to 4dp gives 18.1818%, and 1100×(1-0.181818) = 900.0002 — close
   enough that Shopify's own rounding will resolve to ₹900 correctly.

6. Update `_bundle_total_retail_cents`, `_bundle_total_price_cents`, `_bundle_total_savings_cents`
   attributes on the merged line. Use these values:
   ```
   _bundle_total_retail_cents  = round(originalTotal * 100)  # full retail incl. free gift
   _bundle_total_price_cents   = round(targetTotal * 100)    # what customer actually pays
   _bundle_total_savings_cents = round((originalTotal - targetTotal) * 100)  # total saving
   ```
   `originalTotal` is the right retail basis — it shows the full value the customer is
   receiving (including the free gift), making the savings figure meaningful.

**Rebuild:**
```bash
cd extensions/bundle-cart-transform-ts && npm run build
```

### Phase 2 — Widget: Correct Pricing Display

**File:** `app/assets/widgets/shared/pricing-calculator.js`

- Add optional `steps` param to `calculateBundleTotal`; skip free-gift steps when summing

**File:** `app/assets/bundle-widget-product-page.js`

- Pass `this.selectedBundle?.steps` to `calculateBundleTotal` in `updateAddToCartButton`,
  `updateModalTotals`, and any other call sites

**File:** `app/assets/bundle-widget-full-page.js`

- Same change at all `calculateBundleTotal` call sites (sidebar total, footer total, mobile total)

**Rebuild:**
```bash
npm run build:widgets
```

### Phase 3 — FPB Widget: Add `_bundle_step_type` Property for FPB

**File:** `app/assets/bundle-widget-full-page.js`

In `addBundleToCart()`, add `_bundle_step_type` to free gift component properties (currently
the FPB widget doesn't set this — only the PDP widget does):

```js
// In addBundleToCart, when building cartItems for each step:
if (step?.isFreeGift) properties['_bundle_step_type'] = 'free_gift';
if (step?.isDefault) properties['_bundle_step_type'] = 'default';
```

This ensures the Cart Transform can identify free gift lines from FPB bundles.

### Phase 4 — Admin UI (Polaris)

**File:** `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`

In the step configuration panel where `isFreeGift` is toggled, add a contextual explanation
banner that shows when `isFreeGift === true`.

#### Existing UI (approximate):
```tsx
<Checkbox
  label="Free Gift Step"
  checked={step.isFreeGift}
  onChange={...}
/>
{step.isFreeGift && (
  <TextField label="Gift name" value={step.freeGiftName} ... />
)}
```

#### New UI with explanation:
```tsx
<Checkbox
  label="Free Gift Step"
  helpText="Products in this step will be added to the bundle at $0 — automatically free at checkout."
  checked={step.isFreeGift}
  onChange={...}
/>

{step.isFreeGift && (
  <BlockStack gap="300">
    <TextField
      label="Gift name (shown in promo text)"
      placeholder="e.g. cap, greeting card, tote bag"
      helpText={`Used in the promo message: "Get a ${step.freeGiftName || 'gift'} absolutely free!"`}
      value={step.freeGiftName || ''}
      onChange={...}
    />
    <Banner tone="info">
      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" fontWeight="semibold">
          How free gift pricing works at checkout
        </Text>
        <List type="bullet">
          <List.Item>
            Products from this step are added to cart at their full price, then the
            bundle discount is automatically adjusted so the customer pays $0 for them.
          </List.Item>
          <List.Item>
            The "Add to Cart" button total and sidebar only show the price for paid steps —
            the free gift cost is not included.
          </List.Item>
          <List.Item>
            The checkout line item shows the entire bundle at the correct total
            (paid items discounted + free gift at $0).
          </List.Item>
        </List>
      </BlockStack>
    </Banner>
  </BlockStack>
)}
```

**Note:** Also add a similar UI to the PDP bundle configure route if it supports free gift steps.

### Phase 5 — Tests

**File:** `tests/unit/extensions/cart-transform-run.test.ts`

Add test cases:
1. Bundle with one free gift step — `percentage_off` — verify effectivePct > bundle %; customer
   pays only discounted paid-item total, not discounted (paid+gift) total
2. Bundle with one free gift step — `fixed_amount_off` — verify customer pays `paidTotal - amountOff`;
   also test `amountOff > paidTotal` sub-case: customer pays $0, effectivePct = 100%
3. Bundle with one free gift step — `fixed_bundle_price`:
   - Sub-case A: `fixedPrice ≤ paidTotal` — customer pays `fixedPrice` (same as no-free-gift bundle)
   - Sub-case B: `fixedPrice > paidTotal` — customer pays `paidTotal` (overcharge guard fires)
4. Bundle with only free gift steps (edge case) — test all three discount methods; all should
   produce effectivePct = 100% and customer pays $0
5. Bundle with quantity condition — free gift quantity excluded from condition check; verify
   condition fails when only the free gift fills the quantity threshold
6. Bundle with amount condition — free gift cost excluded from condition check; verify
   condition fails when only the free gift's price meets the amount threshold
7. Free gift total exceeds paid total (e.g. paidTotal=100, freeGiftTotal=900) — for `percentage_off`,
   effectivePct clamps to 100% (not >100%) and customer pays ≤0 → 0

**File:** `tests/unit/assets/pricing-calculator.test.ts`

Add test cases:
1. `calculateBundleTotal` with `steps` — free gift step skipped from total
2. `calculateBundleTotal` without `steps` — backward-compatible (same as before)
3. `calculateDiscount` on paid-only total with free gift in bundle — correct `finalPrice`

---

## 6. Files to Change

| File | Change | Phase |
|------|--------|-------|
| `extensions/bundle-cart-transform-ts/src/cart-transform-input.graphql` | Add `stepType` attribute query | 1 |
| `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts` | Split paid/freeGift totals; adjust `calculateDiscountPercentage` | 1 |
| `app/assets/widgets/shared/pricing-calculator.js` | Add optional `steps` param to `calculateBundleTotal` | 2 |
| `app/assets/bundle-widget-product-page.js` | Pass `steps` to `calculateBundleTotal` | 2 |
| `app/assets/bundle-widget-full-page.js` | Pass `steps` to `calculateBundleTotal`; add `_bundle_step_type` to cart properties | 2+3 |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Add `Banner` + `List` explanation when `isFreeGift` is enabled | 4 |
| `tests/unit/extensions/cart-transform-run.test.ts` | 7 new test cases | 5 |
| `tests/unit/assets/pricing-calculator.test.ts` | 3 new test cases | 5 |

**Not changed:**
- Database schema — `isFreeGift` column already exists
- Bundle formatter — already passes `isFreeGift` through to widget payload
- Widget visual display — $0 badge and "Free" label are already correct; this makes checkout match

---

## 7. Backward Compatibility

The `calculateBundleTotal(selectedProducts, stepProductData)` signature gains an optional third
parameter `steps`. When `steps` is null/undefined, behaviour is unchanged (free gift prices
included as before). This ensures no regression in PDP bundles that don't have free gift steps.

The Cart Transform change is not backward-compatible at the pricing level — bundles with free
gift steps will now compute a higher effective discount percentage. This is the intended
correction. Merchants using `percentage_off` or `fixed_amount_off` with free gift steps will
see the correct (lower) customer price.

Merchants using `fixed_bundle_price` see no change **when `fixedPrice ≤ paidTotal`** (the
normal case). When `fixedPrice > paidTotal` (merchant inadvertently set a fixed price higher
than the paid items' retail total), the customer will now pay `paidTotal` instead of
`fixedPrice` — an overcharge is prevented. This edge case is unlikely in practice but the
behavior change should be noted.

No sync required for existing bundles — the change takes effect immediately on the next cart
transform invocation. No metafield migration needed.

---

## 8. Validation After Deploy

```
shopify app deploy  (after implementing all phases)
```

Then verify on test stores:

1. Add a bundle with a free gift step to cart
2. In browser DevTools, confirm `window.__BUNDLE_WIDGET_VERSION__` matches deployed version
3. Go to checkout — confirm the bundle line item total = paid_items × (1 - discount%) and does
   NOT include the free gift's retail price
4. Confirm the widget's "Add to Cart" button shows the same amount as checkout
5. Test all three discount methods: `percentage_off`, `fixed_amount_off`, `fixed_bundle_price`

---

## 9. Out of Scope

- Making free gift items show as explicit "$0" line items at Shopify checkout (would require EXPAND architecture overhaul — separate project if desired)
- Discount Function integration (not needed; adds complexity without benefit)
- Shopify's native BxGy discount type (not compatible with bundle component tracking)
- Cart line-level enforcement of free gift unlock (server-side validation) — the widget gate is sufficient; Cart Transform doesn't need to validate unlock state
