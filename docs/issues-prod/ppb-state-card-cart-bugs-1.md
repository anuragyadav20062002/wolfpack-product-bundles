# Issue: PPB State Cards & Cart Bugs

**Issue ID:** ppb-state-card-cart-bugs-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-23
**Last Updated:** 2026-03-23 12:00

## Overview
Three interrelated bugs in the Product Page Bundle (PPB) widget caused by the deployed
bundled JS file missing `expandProductsByVariant()` calls in `renderProductPageLayout()`
and `buildCartItems()`.

### Bug 1: Wrong pricing in cart
Only 1 product gets added to cart instead of all 3 selected bundle products. The
`buildCartItems()` method looks up variant IDs in raw `stepProductData` (which stores
products with their default variant ID). When a user selects a non-default variant,
the lookup fails silently and that product is skipped.

### Bug 2: Only 1 state card shown after completing all steps
`renderProductPageLayout()` similarly looks up selected variant IDs in raw
`stepProductData`. Only step 0's default variant matches; steps 1 and 2 fail silently
with no card appended.

### Bug 3: Stale pricing in modal after removing state card product
This is a downstream consequence of Bug 2. Since only 1 state card renders, removing
it clears step 0 but leaves steps 1 and 2 selections intact (invisible). Reopening the
modal shows the remaining selections in the pricing pill.

## Root Cause
The **source code** (`app/assets/bundle-widget-product-page.js`) already contains the
fixes — both `renderProductPageLayout()` and `buildCartItems()` call
`expandProductsByVariant()`. The **local bundled file** also has these fixes. But the
**deployed CDN version** (Shopify extension) does NOT — it was never redeployed after
the fix was applied.

Additionally, the `WIDGET_VERSION` was not bumped when the fix was added, so the CDN
version and local version both show `2.3.0` despite different code.

## Fix
1. Bump `WIDGET_VERSION` to `2.3.1` (bug fix)
2. Rebuild widget bundles
3. Deploy to Shopify

## Progress Log

### 2026-03-23 12:00 - Investigation Complete
- Verified all 3 bugs on live store (parth-boss.myshopify.com)
- Traced root cause to missing `expandProductsByVariant()` calls in deployed bundled JS
- Confirmed local source and bundled files already have the fix
- CDN version (v2.3.0) is stale — needs redeploy with version bump

### 2026-03-23 12:00 - Applying Fix
- Bumping WIDGET_VERSION to 2.3.1
- Rebuilding widget bundles
- Files changed: scripts/build-widget-bundles.js, extensions/bundle-builder/assets/

## Phases Checklist
- [x] Phase 1: Reproduce and verify all 3 bugs
- [x] Phase 2: Identify root cause
- [x] Phase 3: Bump version (2.3.0 → 2.3.1), rebuild bundles
- [ ] Phase 4: Deploy to Shopify (manual — `shopify app deploy`)
