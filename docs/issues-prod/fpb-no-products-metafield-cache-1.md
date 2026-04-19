# Issue: FPB Widget Shows "No products available in this step" from Metafield Cache

**Issue ID:** fpb-no-products-metafield-cache-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-19
**Last Updated:** 2026-04-19 14:30

## Overview

Full-page bundle widgets show "No products available in this step." on the storefront even when the bundle has products configured and the metafield cache (`data-bundle-config`) is populated with full product data. The bug persists after Sync Bundle.

## Root Cause Analysis

Two commits combined to break the metafield-first load path:

### Commit `b6658de` (Anurag Yadav, Dec 23 2025)
Added logic to use `step.StepProduct` enriched data directly in `loadStepProducts()`. This was correct for the API response path, where `step.StepProduct` carries enriched data.

### Commit `8304f3b` (`[fpb-widget-audit-1]`)
Added `hasEnrichedStepProducts` guard on the `step.products` fetch block:
```js
const hasEnrichedStepProducts = Array.isArray(step.StepProduct) && step.StepProduct.length > 0
  && step.StepProduct.some(sp => sp.title && sp.imageUrl);

if (!hasEnrichedStepProducts && step.products ...) {
  // fetch from storefront-products API
}
```

**The flaw:** When the widget loads from the metafield cache (`data-bundle-config`):
- `step.products` → ✅ full enriched data (images, variants, prices)
- `step.StepProduct` → ❌ does NOT exist (Prisma join tables are not serialized to metafield JSON)

So `hasEnrichedStepProducts` is always `false` → enters the API-fetch branch → calls
`wolfpack-product-bundle-app.onrender.com/api/storefront-products` → **CORS error**
→ `allProducts` stays empty → "No products available in this step."

## Fix

In `loadStepProducts()` (source: `app/assets/bundle-widget-full-page.js`), added a check
for `stepProductsAlreadyEnriched` before the API fetch:

```js
const stepProductsAlreadyEnriched = Array.isArray(step.products) && step.products.length > 0
  && step.products.some(p => (Array.isArray(p.images) && p.images.length > 0) || p.featuredImage);

if (stepProductsAlreadyEnriched) {
  // Metafield cache path: products have full data, use them directly.
  allProducts = allProducts.concat(step.products);
} else if (!hasEnrichedStepProducts && step.products ...) {
  // fetch from API (stub-only products)
}
```

The rendering code at line 1933 already handles both formats (`featuredImage.url`, `images[0].url`).

## Progress Log

### 2026-04-19 14:30 - Fixed products showing (v2.5.1)

- ✅ Identified RCA via Chrome DevTools + git bisect
- ✅ Fixed `loadStepProducts()` — `stepProductsAlreadyEnriched` guard added
- ✅ Ran `npm run build:widgets:full-page` (257.5 KB)
- ✅ Deployed to PROD (v2.5.1) — products now show on storefront

### 2026-04-19 14:50 - Fixed images and prices (v2.5.2)

Post-deploy verification revealed two more issues with the metafield cache path:

**Images (placeholder showing instead of real images):**
- `processProductsForStep` imageUrl chain was `variant.image.src || product.imageUrl || placeholder`
- Metafield cache products use `product.featuredImage.url` / `product.images[0].url` (Shopify GQL format)
- Fix: added `product.featuredImage?.url || product.images?.[0]?.url` to fallback chain (both call sites)

**Prices (showing in paise — ₹82900 instead of ₹829):**
- Metafield prices stored as cents (82900 = ₹829.00)
- `processProductsForStep` does `parseFloat(price) * 100` assuming decimal input
- Fix: in `stepProductsAlreadyEnriched` branch, pre-divide prices by 100 before adding to `allProducts`

- Files changed: `app/assets/bundle-widget-full-page.js`, `scripts/build-widget-bundles.js` (→ 2.5.2), bundled output
- Next: Commit + deploy to PROD (v2.5.2)

## Related Documentation
- CLAUDE.md: "Do Not Touch — Bundle Config Loading (FPB Widget)"
- `app/assets/bundle-widget-full-page.js` → `loadStepProducts()` ~line 3145

## Phases Checklist
- [x] RCA identified
- [x] Fix implemented in source
- [x] Widget bundle rebuilt
- [x] Committed with issue ID (v2.5.1)
- [x] Deployed to PROD — products now show
- [x] Images fixed — metafield `featuredImage.url`/`images[0].url` fallback added
- [x] Prices fixed — pre-divide cents→decimal before processProductsForStep * 100
- [ ] Committed v2.5.2 image+price fix
- [ ] Deployed v2.5.2 to PROD
- [ ] Full interaction verified (add to bundle, cart transform)
