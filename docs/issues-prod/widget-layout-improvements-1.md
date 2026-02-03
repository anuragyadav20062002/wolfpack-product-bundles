# Issue: Widget Layout Improvements - Drawer Height & Footer Carousel

**Issue ID:** widget-layout-improvements-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-01-29
**Last Updated:** 2026-01-29 11:15

## Overview

Two layout improvements needed:

1. **Product Page Drawer Height**: Currently opens to 70vh, should be 80vh
2. **Full Page Footer Products**: Currently shows detailed product cards with title/price, should be a compact image-only carousel

## Changes Required

### 1. Product Page Drawer Height
- File: `extensions/bundle-builder/assets/bundle-widget.css`
- Change `height: 70vh` and `max-height: 70vh` to `80vh`

### 2. Full Page Footer Carousel
- File: `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- File: `app/assets/bundle-widget-full-page.js`
- Make product thumbnails image-only with quantity badge overlay
- Remove title/price text from carousel items
- Make carousel more compact (smaller images, less padding)

## Progress Log

### 2026-01-29 11:00 - Starting Implementation
- Analyzed current implementations
- Product page drawer: lines 468-469 in bundle-widget.css
- Full page footer: uses .footer-products-strip with .footer-product-thumb

### 2026-01-29 11:15 - Completed Implementation
- **Fix 1**: Changed drawer height from 70vh to 80vh in bundle-widget.css
- **Fix 2**: Made footer carousel compact with image-only thumbnails:
  - Updated CSS to show 52x52px images with quantity badge overlay
  - Removed title/price text from carousel items (still visible on hover via title attribute)
  - Added quantity badge on top-right of each thumbnail
  - Remove button on bottom-right
  - More compact strip with better spacing
- Rebuilt widget bundle

## Files Modified

1. `extensions/bundle-builder/assets/bundle-widget.css` - drawer height 70vh → 80vh
2. `extensions/bundle-builder/assets/bundle-widget-full-page.css` - compact carousel styles
3. `app/assets/bundle-widget-full-page.js` - simplified thumb HTML with quantity badge
4. `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` - rebuilt

## Phases Checklist

- [x] Phase 1: Analyze current implementations
- [x] Phase 2: Fix product page drawer height (70vh → 80vh)
- [x] Phase 3: Make footer carousel compact (image-only with quantity)
- [x] Phase 4: Rebuild widget bundle
- [ ] Phase 5: Test changes
