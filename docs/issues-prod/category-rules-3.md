# Issue: Fix Category Rules — GID Mismatch Between Validator and Widget Selections

**Issue ID:** category-rules-3
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-31
**Last Updated:** 2026-05-31

## Overview

Category rules (shipped in `category-rules-2`) always evaluate as "not satisfied" on the storefront, blocking ATC even when the customer's selections meet the configured rule. Root-cause is a two-part ID mismatch:

1. **GID mismatch in `_collectCategoryProductIds`**: the runtime category products arrive with GID product IDs (`"gid://shopify/Product/9427287703811"`). `_collectCategoryProductIds` stores them raw, so the Set it returns contains GIDs.

2. **Variant-vs-product ID mismatch in `validateStep`**: widget selection keys are numeric **variant** IDs (`"48191691424003"`). After Fix 1, category product IDs become numeric **product** IDs (`"9427287703811"`). Variant ID ≠ product ID → `categoryTotal` is still 0.

Both bugs are confirmed from the live test store DB (category product stored as `{"id": "gid://shopify/Product/9427287703811"}`) and runtime key confirmed at `bundle-product.server.ts:453: categories: formatStepCategoriesForRuntime(step)`.

## Approach

### Fix 1 — `app/assets/widgets/shared/condition-validator.js`
In `_collectCategoryProductIds`, strip the GID prefix so stored IDs are numeric:
```js
const id = String(raw).replace(/^gid:\/\/shopify\/[^/]+\//, '');
```

Expose `_isCategoryRuleMode` as `isCategoryRuleMode` in the public API so widgets can branch without duplicating the check.

### Fix 2 — Both widgets (`bundle-widget-product-page.js`, `bundle-widget-full-page.js`)
In `validateStep`, when `ConditionValidator.isCategoryRuleMode(step)` is true, translate the variant-ID-keyed `currentSelections` to product-ID-keyed before passing to `isStepConditionSatisfied`. Look up each selection key against `stepProductData[stepIndex]` and use `product.parentProductId || product.id`.

## Files Changed

- `app/assets/widgets/shared/condition-validator.js` — GID strip in `_collectCategoryProductIds`, expose `isCategoryRuleMode`
- `app/assets/bundle-widget-product-page.js` — `validateStep` category-mode translation
- `app/assets/bundle-widget-full-page.js` — `validateStep` category-mode translation
- `scripts/build-widget-bundles.js` — `WIDGET_VERSION` bump `2.9.9` → `2.9.10`
- `tests/unit/assets/condition-validator.test.ts` — GID-format regression test

## Tests

New test case added before implementation (TDD):
- Category product with GID id → selection with numeric product id → should match (regression test for Fix 1)

## Phases Checklist

- [x] Phase 1: Create issue file
- [x] Phase 2: Write failing test
- [x] Phase 3: Implement Fix 1 (GID strip + expose `isCategoryRuleMode`)
- [x] Phase 4: Implement Fix 2 (widget `validateStep` translation) for PPB + FPB
- [x] Phase 5: Bump WIDGET_VERSION 2.9.9 → 2.9.10, build
- [x] Phase 6: Fix build corruption — regex literal → `new RegExp()` constructor, rebuild confirmed clean
- [ ] Phase 7: Commit (next: user runs `npm run deploy:sit`)

**Status:** Code complete. Awaiting merchant-driven `npm run deploy:sit`.

## Progress Log

### 2026-05-31 — Build corruption fix
- Discovered `minify-assets.js` `stripLineComment` does not handle regex literals. The end of the GID regex `[^\/]+\/`, `/` delimiter was preceded by `\/` — the scanner saw `//` and stripped the rest of the line.
- Fixed by replacing the regex literal with `new RegExp('^gid://shopify/[^/]+/')` constructor form so the pattern is inside a string and immune to the comment stripper.
- Rebuilt: FPB 307.1 KB, PPB 193.8 KB. Verified line 83 of both bundles correct post-minification.
- 98/98 tests still passing.

### 2026-05-31 — Implementation complete
- Added failing regression test (category-rules-3) in `condition-validator.test.ts`: category product with GID id → numeric product ID selection key. Confirmed Red before fix.
- Fixed `_collectCategoryProductIds` in `condition-validator.js`: strip GID prefix via `.replace(/^gid:\/\/shopify\/[^/]+\//, '')` so stored IDs are numeric. Exposed `_isCategoryRuleMode` as `isCategoryRuleMode` in public API.
- Fixed `validateStep` in both `bundle-widget-product-page.js` (using `findProductBySelectionKey`) and `bundle-widget-full-page.js` (inline `products.find(p => (p.variantId || p.id) === selKey)`): when `ConditionValidator.isCategoryRuleMode(step)` is true, translate variant-ID selection keys → numeric product IDs before passing to `isStepConditionSatisfied`.
- 98/98 condition-validator tests passing. 0 new lint errors.
- Bumped WIDGET_VERSION `2.9.9` → `2.9.10`. Built: FPB 307.1 KB, PPB 193.8 KB. Confirmed `window.__BUNDLE_WIDGET_VERSION__ = '2.9.10'`.

### 2026-05-31 — Starting implementation
- Root-cause confirmed via DB query + code analysis. Two-part fix identified.
- Created issue file. Adding failing tests next.
