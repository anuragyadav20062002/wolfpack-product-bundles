# Issue: Variant Selection in Footer + Promo Banner DCP Integration

**Issue ID:** variant-footer-promo-banner-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-01
**Last Updated:** 2026-02-02 01:00

## Overview
Multiple issues with bundle widgets:
1. **Footer Discount Not Updating for Variants**: When selecting different variants of the same product in full-page bundles, the footer discount message doesn't update correctly.
2. **Product Page Bundle Variant Cards**: Need to implement different product cards for variant products treated as separate products in product page bundles.
3. **Promo Banner Theme Editor Settings**: Add theme editor settings to customize the promo banner text in full-page bundles.

## Progress Log

### 2026-02-01 00:00 - Initial Implementation (Phase 1)
- Fixed `getAllSelectedProductsData()` function variant lookup
- Fixed promo banner to display with DCP settings
- Added CSS for banner variants

### 2026-02-02 01:00 - Additional Fixes (Phase 2)
- **Fixed footer discount calculation**: Updated `PricingCalculator.calculateBundleTotal()` in `bundle-widget-components.js` to search within nested variants array when direct match fails. Now correctly handles non-default variant selection when `displayVariantsAsIndividual` is false.
- **Fixed product-page variant expansion**: Updated `processProductsForStep()` in `bundle-widget-product-page.js` to preserve parent product data (`parentProductId`, `parentTitle`, `variants`, `options`, `images`, `description`) when expanding variants. This matches the full-page behavior.
- **Added promo banner theme editor settings**:
  - Added new settings in `bundle-full-page.liquid` schema:
    - `show_promo_banner` (checkbox)
    - `promo_banner_subtitle` (text)
    - `promo_banner_tagline` (text)
    - `promo_banner_note` (text)
  - Added data attributes to container element
  - Updated `createPromoBanner()` to use theme settings instead of hardcoded text

## Files Modified

### 2026-02-02 01:00
- `app/assets/bundle-widget-components.js` - Updated `calculateBundleTotal()` to handle nested variant lookup
- `app/assets/bundle-widget-full-page.js` - Added promo banner config parsing and usage
- `app/assets/bundle-widget-product-page.js` - Updated `processProductsForStep()` to preserve parent data
- `extensions/bundle-builder/blocks/bundle-full-page.liquid` - Added promo banner theme editor settings
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` - Rebuilt
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` - Rebuilt

## Phases Checklist
- [x] Phase 1: Fix variant selection in getAllSelectedProductsData (2026-02-01)
- [x] Phase 2: Fix promo banner to display with DCP settings (2026-02-01)
- [x] Phase 3: Fix footer discount calculation for nested variants (2026-02-02)
- [x] Phase 4: Fix product-page variant expansion to preserve parent data (2026-02-02)
- [x] Phase 5: Add promo banner theme editor settings (2026-02-02)
- [x] Phase 6: Build widgets and commit (2026-02-02)

## Related Documentation
- CLAUDE.md - Build process for widgets
- https://shopify.dev/docs/themes/architecture/settings
