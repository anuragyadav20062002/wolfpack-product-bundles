# Issue: PPB Template Container Responsive Regression
**Issue ID:** ppb-template-container-responsive-regression-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 04:35

## Overview
Remove fixed-width regressions from PPB Product List and Horizontal Slots storefront templates so all PPB templates respond to their storefront container width.

## Progress Log
### 2026-06-04 04:27 - Start container responsive regression
- User observation: all PPB template types should be container responsive.
- Root-cause scan found Product List still caps add-to-cart and dynamic checkout controls at `max-width:345px`.
- Root-cause scan found Horizontal Slots still sets several root, section, grid, add-to-cart, and dynamic checkout widths to `345px`.
- Next: add a failing source-contract test, remove fixed-width caps while preserving EB narrow-column visual proportions, rebuild assets, and verify.

### 2026-06-04 04:29 - Add failing responsive contract test
- Added Jest source-contract coverage for Product List and Horizontal Slots wider-container behavior.
- Confirmed the test fails on the current CSS because Product List still has `max-width:345px` and Horizontal Slots still uses fixed `345px` wrappers/grid/buttons.
- Next: remove fixed-width caps and use container-relative grid/button widths.

### 2026-06-04 04:32 - Remove Product List and Horizontal Slots fixed-width caps
- Updated Product List `CASCADE` controls so add-to-cart and dynamic checkout use the container width instead of `max-width:345px`.
- Updated Product Page in-page wrapper max-width so Product List can expand in wider product-page placements.
- Updated Horizontal Slots `PDP_MODAL` wrappers, steps, sections, grid, add-to-cart, and dynamic checkout to use container-relative widths on desktop/wide placements.
- Kept mobile media rules viewport-constrained to avoid small-screen overflow.
- Bumped `WIDGET_VERSION` to `2.9.62`.
- Verification: `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand` passed.

### 2026-06-04 04:35 - Build and verify responsive regression assets
- Ran raw JS syntax checks for the product-page widget and all product-page template modules.
- Ran `npm run build:widgets` and rebuilt storefront JS assets with version `2.9.62`.
- Ran `npm run minify:assets css`; product-page CSS output is 83.5 KB and under Shopify's app-block asset limit.
- Ran ESLint on modified JS/TS files with `--max-warnings 9999`; result was 0 errors.
- Rebuilt graphify code graph.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/issues-prod/ppb-horizontal-slots-storefront-parity-1.md`
- `docs/issues-prod/ppb-product-grid-storefront-parity-1.md`

## Phases Checklist
- [x] Phase 1: Add failing responsive regression test for Product List and Horizontal Slots.
- [x] Phase 2: Remove fixed-width storefront caps from Product List and Horizontal Slots.
- [x] Phase 3: Build/minify modified storefront assets and verify.
