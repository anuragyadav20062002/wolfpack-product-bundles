# Issue: Default CSS Overrides for Bundle Widgets

**Issue ID:** default-css-overrides-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 00:00

## Overview
Add default CSS overrides to both full-page and product-page bundle widgets for consistent storefront styling. These include orange add button, larger product titles, dark quantity controls, bigger footer total label, wider footer tiles wrapper, and 2-col mobile grid.

## Requirements
1. `.product-add-btn` - background: #FF9000
2. `.product-title` - font-size: 20px, font-weight: 600, margin-bottom: -14px, letter-spacing: 0.2px, line-height: 1.4, min-height: calc(1.4em * 2)
3. `.inline-quantity-controls` - background: #5f5d5d
4. `.footer-total-section .total-label` - font-size: 20px, font-weight: 550
5. `.footer-products-tiles-wrapper` - gap: 16px, padding: 10px 44px, max-width: 850px
6. `@media (max-width: 768px) .full-page-product-grid` - grid-template-columns: 1fr 1fr

## Progress Log

### 2026-02-16 00:00 - Starting Implementation
- Adding default CSS overrides to both CSS files
- Files to modify:
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css`
  - `extensions/bundle-builder/assets/bundle-widget.css`

### 2026-02-16 00:01 - Revised Implementation (no !important, baked into defaults)
- ✅ Updated DCP defaults in `defaultSettings.ts`:
  - `buttonBgColor`: `#000000`/`#7132FF` → `#FF9000` (both product_page & full_page)
  - `buttonHoverBgColor`: → `#E68200` (both)
  - `productCardFontSize`: `16`/`18` → `20` (both)
  - `productCardFontWeight`: `400`/`500` → `600` (both)
  - `quantitySelectorBgColor`: `#000000`/`#7132FF` → `#5f5d5d` (both)
- ✅ Updated CSS variable fallbacks in `css-variables-generator.ts`:
  - `--bundle-button-bg` fallback: `#FF9000`
  - `--bundle-product-card-font-size` fallback: `20px`
  - `--bundle-product-card-font-weight` fallback: `600`
  - `--bundle-quantity-selector-bg` fallback: `#5f5d5d`
- ✅ Updated base CSS rules in `bundle-widget-full-page.css`:
  - `.product-add-btn` background fallback → `#FF9000`
  - `.product-title` — font-size: 20px, font-weight: 600, margin-bottom: -14px, letter-spacing: 0.2px, line-height: 1.4
  - `.inline-quantity-controls` background fallback → `#5f5d5d`
  - `.footer-total-section .total-label` — font-size: 20px, font-weight: 550
  - `.footer-products-tiles-wrapper` — gap: 16px, padding: 10px 44px, max-width: 850px
  - `.full-page-product-grid` — 2-col default on mobile
  - Removed duplicate overrides section
- ✅ Updated base CSS rules in `bundle-widget.css`:
  - `.product-card .product-title` and `.modal-body .product-card .product-title` aligned
  - `.modal-body .product-card .product-add-btn` background fallback → `#FF9000`
  - Cleaned up overrides section (no !important)
- Files modified:
  - `app/components/design-control-panel/config/defaultSettings.ts`
  - `app/lib/css-generators/css-variables-generator.ts`
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css`
  - `extensions/bundle-builder/assets/bundle-widget.css`

## Related Documentation
- Full-page CSS: `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- Product-page CSS: `extensions/bundle-builder/assets/bundle-widget.css`

## Phases Checklist
- [x] Add overrides to full-page CSS
- [x] Update overrides in product-page CSS
- [ ] Commit changes
