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

### 2026-04-19 14:30 - Fixed and built

- ✅ Identified RCA via Chrome DevTools + git bisect
- ✅ Fixed `loadStepProducts()` in `app/assets/bundle-widget-full-page.js`
- ✅ Ran `npm run build:widgets:full-page` (257.5 KB output)
- Files changed:
  - `app/assets/bundle-widget-full-page.js` (source)
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (built)
- Next: Commit + deploy to PROD

## Related Documentation
- CLAUDE.md: "Do Not Touch — Bundle Config Loading (FPB Widget)"
- `app/assets/bundle-widget-full-page.js` → `loadStepProducts()` ~line 3145

## Phases Checklist
- [x] RCA identified
- [x] Fix implemented in source
- [x] Widget bundle rebuilt
- [ ] Committed with issue ID
- [ ] Deployed to PROD via `npm run deploy:prod`
- [ ] Verified on live storefront (`yash-wolfpack.myshopify.com/pages/fp-6th`)
