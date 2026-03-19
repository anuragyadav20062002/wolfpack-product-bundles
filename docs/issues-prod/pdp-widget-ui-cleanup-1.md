# Issue: PDP Widget — Remove Savings Badge + Fix ATC Button Price

**Issue ID:** pdp-widget-ui-cleanup-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 03:30

## Overview
Two UI issues on the PDP product-page widget:
1. Savings badge (`.bundle-discount-pill`) — green "88% off" pill floating top-right of widget. Merchant did not request this. Remove entirely.
2. ATC button shows both original price (struck through) AND final price. Only the final discounted price should be shown, inline in the button label.

## Progress Log

### 2026-03-20 01:00 - Completed badges + button fix
- Removed `updateDiscountPill()` method and all call sites from `bundle-widget-product-page.js`
- Replaced button `innerHTML` (with strike + final spans) with simple `textContent = "Add Bundle to Cart • {finalPrice}"`
- Removed `.bundle-discount-pill` CSS block from `bundle-widget.css`
- Widget version bumped 2.1.0 → 2.2.0, rebuilt product-page bundle
- Files: `app/assets/bundle-widget-product-page.js`, `extensions/bundle-builder/assets/bundle-widget.css`, `scripts/build-widget-bundles.js`

### 2026-03-20 03:30 - Completely removed bundle header from PDP widget
- User requested full removal of the bundle title box (white box showing bundle name, duplicating Shopify product title)
- Removed `show_bundle_title` block setting from `bundle-product-page.liquid`
- Removed `data-show-title` data attribute from widget container in Liquid
- Removed `{% if show_bundle_title %}` header div block from Liquid template
- Removed `showTitle` from config parsing in widget JS
- Removed `header` element from `this.elements`, removed `createHeader()`, removed `renderHeader()`, removed `renderHeader()` call in `renderUI()`
- Widget version bumped 2.2.1 → 2.2.2, rebuilt product-page bundle
- Files: `extensions/bundle-builder/blocks/bundle-product-page.liquid`, `app/assets/bundle-widget-product-page.js`, `scripts/build-widget-bundles.js`, `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`

## Phases Checklist
- [x] Phase 1: Remove savings badge JS + CSS
- [x] Phase 2: Fix ATC button to show only final price
- [x] Phase 3: Back/Next buttons never disabled — toast fires on invalid navigation
- [x] Phase 4: Remove empty white header box — Liquid default changed to false, renderHeader() now populates title text when shown (2.2.1)
- [x] Phase 5: Completely remove bundle title/header from PDP widget (2.2.2)
