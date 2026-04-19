# Issue: FPB Collection-Only Bundles Skip `component_parents` Metafield → Cart Transform Fails

**Issue ID:** fpb-collection-metafield-missing-1
**Status:** Bug A Fixed — Awaiting Deploy + Backfill
**Priority:** 🔴 High (production merchant blocked)
**Created:** 2026-04-16
**Last Updated:** 2026-04-16

## Reporter

Merchant: Pearletti (`pearletti.myshopify.com`)
Bundle: "Buy 3 at 499" (`cmo125jbh0000mg3g4sebu84l`)
Storefront page: https://pearletti.myshopify.com/pages/buy-3-at-499
Admin: https://admin.shopify.com/store/pearletti/apps/wolfpack-product-bundles-4/app/bundles/full-page-bundle/configure/cmo125jbh0000mg3g4sebu84l

## Symptoms (Reported)

1. Cart transform was failing
2. Discount was not being applied
3. Parent product was not shown in cart or checkout
4. Cloning a sidebar (`footer_side`) FPB bundle produces a floating (`footer_bottom`) layout

## Replication (Confirmed via Chrome DevTools — Widget v2.4.10)

1. Cleared cart on storefront.
2. Added 3 items via the bundle widget (₹299 + ₹399 + ₹329).
3. Inspected `/cart.js`:
   - 3 separate line items (no merge)
   - All share `_bundle_id: 3fed35bc-effd-4ccf-ac80-0672ea131920`
   - `total_price: 102700` (₹1027.00) — no discount
   - No parent "Buy 3 at 499" line
   - `final_price === price` for every line (no per-line discount)

The widget's pricing pill correctly previewed `₹1027 → ₹499`, proving the widget knows the rule but the cart transform cannot enforce it.

## Bundle Configuration (from `data-bundle-config` on storefront)

```json
{
  "id": "cmo125jbh0000mg3g4sebu84l",
  "name": "Buy 3 at 499",
  "fullPageLayout": "footer_side",          // sidebar layout
  "shopifyProductId": "gid://shopify/Product/15026590581108",
  "pricing": {
    "enabled": true,
    "method": "fixed_bundle_price",
    "rules": [
      { "condition": { "type": "quantity", "value": 3, "operator": "gte" }, "discount": { "value": 49900, "method": "fixed_bundle_price" } },
      { "condition": { "type": "quantity", "value": 5, "operator": "gte" }, "discount": { "value": 79900, "method": "fixed_bundle_price" } }
    ]
  },
  "steps": [{
    "name": "Step 1",
    "minQuantity": 1, "maxQuantity": 1,
    "conditionType": "quantity",
    "conditionOperator": "greater_than_or_equal_to", "conditionValue": 3,
    "conditionOperator2": "less_than_or_equal_to",  "conditionValue2": 5,
    "products": [],          // ← EMPTY
    "StepProduct": [],       // ← EMPTY
    "collections": [{        // ← ONLY collection ref
      "id": "gid://shopify/Collection/636288991604",
      "handle": "buy-any-3-at-499",
      "title": "Buy Any 3 @ ₹499",
      "productsCount": 51
    }]
  }]
}
```

---

## Root Cause Analysis

### Bug A — Collection-only bundles never write `component_parents` metafield (PRIMARY)

`updateComponentProductMetafields()` in `app/services/bundles/metafield-sync/operations/component-product.server.ts:62-110` iterates each step and looks for component variants in **two places only**:

```ts
for (const step of bundleConfig.steps) {
  if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
    // ... write metafield to each variant
  } else if (step.products && Array.isArray(step.products) && step.products.length > 0) {
    // ... fallback to product-id list
  }
  // ← step.collections is NEVER read
}
```

For Pearletti's bundle both `step.StepProduct` and `step.products` are empty (the merchant only added a Collection). The loop iterates over nothing, `componentVariantIds` stays empty, and the metafield-update loop at line 189 runs zero times. **No `component_parents` metafield is ever written to any variant in the collection.**

At checkout, the cart transform (`extensions/bundle-cart-transform-ts/src/cart_transform_run.ts:418-433`) groups the cart lines by `_bundle_id`, then looks for `component_parents` on each grouped line:

```ts
let componentParentsValue: string | undefined;
for (const l of bundleComponentLines) {
  const val = l.merchandise.component_parents?.value;
  if (val) { componentParentsValue = val; break; }
}
if (!componentParentsValue) {
  Logger.warn('No component_parents metafield in bundle group', { phase: 'merge', bundleId });
  continue;   // ← MERGE SKIPPED
}
```

With no metafield on any variant, MERGE is skipped → the 3 lines remain unmerged → no parent line, no discount, no bundle title at checkout.

This produces **all three** symptoms reported by the merchant.

### Bug B — Clone drops `fullPageLayout`, falls back to schema default (SECONDARY)

`handleCloneBundle()` in `app/routes/app/app.dashboard/handlers/handlers.server.ts:259-269`:

```ts
const clonedBundle = await db.bundle.create({
  data: {
    name: clonedBundleName,
    description: originalBundle.description,
    shopId: session.shop,
    bundleType: originalBundle.bundleType,
    status: BundleStatus.DRAFT,
    shopifyProductId: shopifyProductId,
    templateName: originalBundle.templateName,
    // ← fullPageLayout is NOT copied
  },
});
```

Schema default at `prisma/schema.prisma:103` is `@default(footer_bottom)` (Floating). So every clone of a sidebar (`footer_side`) bundle resets to Floating (`footer_bottom`).

Other fields likely also lost in clone (audit needed): `redirectStrategy`, `tierConfig`, `discountEnabled`, `pricingTiers`, `productHandle/pageHandle` (these last two are correctly regenerated).

### Bug C — Persistent "Loading" image after content loaded (UI nit, low pri)

The storefront snapshot still shows `image "Loading"` (uid=1_31) at the top of the bundle widget after products have rendered. The loading overlay's hide step is leaving the `<img>` in the DOM. Worth investigating but not blocking the merchant.

---

## Proposed Solutions

### Bug A — Three options, ranked

**Option 1 — Code fix in `updateComponentProductMetafields` (CORRECT, recommended)**

Add a third branch that resolves `step.collections` → product list → first-variant-per-product (or all variants), and pushes them into `componentReferences`/`componentQuantities`:

```ts
} else if (step.collections?.length > 0) {
  // Resolve all products in each collection via Admin API
  for (const collection of step.collections) {
    const productIds = await fetchAllProductsInCollection(admin, collection.id);
    for (const pid of productIds) {
      productIdMap.push({
        productId: pid,
        stepMinQuantity: step.minQuantity || 1,
        source: 'collection',
      });
    }
  }
}
```

The downstream batch-fetch (line 113) already handles a list of `productId`s via `batchGetFirstVariants`. Watch the 64KB `component_parents` metafield ceiling (`checkMetafieldSize` at line 181) — Pearletti's collection has 51 products, well under the limit; collections >~500 products may trip it.

The matching write side `updateBundleProductMetafields()` should be audited for the same gap.

**Option 2 — Merchant workaround (temporary unblock)**

Tell the merchant to switch from "Collections" tab to "Products" tab and add the 51 products individually, then Save. This populates `StepProduct` and the existing code path writes the metafield. Then re-Save / "Sync Bundle" to write the metafield. **This loses the dynamic-collection benefit** (new products tagged `bundle499` won't auto-join the bundle). Recommend only as immediate stopgap.

**Option 3 — Backfill script after Option 1 ships**

`scripts/bulk-sync-bundles.ts` already exists and walks every bundle; once Option 1 is merged, run it for `pearletti.myshopify.com` to write the metafield to the 51 collection variants without requiring the merchant to re-save.

### Bug B — Clone fix

Add the missing fields to the `db.bundle.create` payload in `handleCloneBundle`:

```ts
data: {
  ...,
  fullPageLayout: originalBundle.fullPageLayout,
  redirectStrategy: originalBundle.redirectStrategy,
  tierConfig: originalBundle.tierConfig,
  discountEnabled: originalBundle.discountEnabled,
  // (audit Bundle model for any other config columns)
}
```

A test should assert clone preserves `fullPageLayout`. The same gap may exist in `app/routes/app/app.bundles.cart-transform.tsx:138` clone path — audit both.

### Bug C — Loading overlay

Investigate `app/assets/bundle-widget-full-page.js` loading-overlay hide path; ensure the `Loading` image is removed (or `display:none`) once products render.

---

## Phases Checklist

- [x] Reproduce on live storefront (Chrome DevTools)
- [x] Identify cart-transform failure mode (no `component_parents` → MERGE skipped)
- [x] Trace metafield write path → confirm `step.collections` is not handled
- [x] Identify clone bug (missing `fullPageLayout` in payload)
- [x] Implement Option 1 (collection-aware `updateComponentProductMetafields`)
- [ ] Add unit test for collection-only bundle metafield write
- [ ] Implement Bug B fix (clone preserves layout)
- [ ] Add regression test asserting cloned bundle has same `fullPageLayout`
- [ ] Deploy fix to PROD (`npm run deploy:prod`)
- [ ] Run `bulk-sync-bundles.ts` for Pearletti to backfill metafields
- [ ] Verify on storefront: 3 items merge, discount applied, parent line shown
- [ ] Investigate Bug C (loading overlay residue)

## Progress Log

### 2026-04-16 — Bug A Fix Applied

**File modified:** `app/services/bundles/metafield-sync/operations/component-product.server.ts`

Added a collection-resolution block after the existing `StepProduct` / `products` if-else inside the `for (const step of bundleConfig.steps)` loop. The new block:

1. Reads `step.collections` (JSON array of `{ id, handle, title }`).
2. For each collection, calls Admin API `query getCollectionProductIds($handle: String!) { collection(handle: $handle) { products(first: 250) { edges { node { id } } } } }`.
3. Pushes each resolved product ID into the existing `productIdMap` (skipping duplicates already added via `StepProduct` / `products`).
4. Downstream `batchGetFirstVariants` then resolves first-variant-per-product, and the existing metafield-write loop writes `component_parents` to each variant.

This mirrors the established pattern in `bundle-product.server.ts:91-146` (which already handles `step.collections` correctly for the parent-variant metafields). Lint passed with 0 errors (83 pre-existing `any`-typed warnings, all in code paths not introduced by this change).

**Caveats:**
- First variant per product only (matches `bundle-product.server.ts` behaviour). If a merchant needs all variants of a collection product included, they must add the product explicitly via the Products tab.
- 250-product cap per collection on the Admin API page. Collections with >250 products will need pagination — out of scope for this fix; flag if a merchant hits it.
- 64KB `component_parents` metafield ceiling still applies; Pearletti's 51 products are well within.

**Next:** Deploy and run `bulk-sync-bundles.ts` for `pearletti.myshopify.com` to backfill the 51 collection variants.

## Related Documentation

- `internal docs/Architecture/Cart Transform Function.md`
- `internal docs/Features/Pricing Pipeline.md`
- `docs/issues-prod/ppb-state-card-cart-bugs-1.md` (Bug 4 — same MERGE-failure symptom for PPB)
- `docs/issues-prod/cart-transform-audit-1.md`
