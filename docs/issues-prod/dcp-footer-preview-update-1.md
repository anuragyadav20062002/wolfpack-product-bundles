# Issue: DCP Footer Preview - Replicate Actual Storefront Design

**Issue ID:** dcp-footer-preview-update-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 10:15

## Overview
The Bundle Footer preview in the DCP (Design Control Panel) needs to match the actual storefront footer design for both product-page and full-page bundles. The current preview diverges from the storefront in layout structure, product tile representation, and spacing.

## Key Differences to Fix

### Full-Page Footer
1. Storefront has 3 vertically stacked sections: Progress Message → Product Tiles → Navigation
2. Product tiles are proper cards with image (44x44), quantity badge, product name, variant name, and remove button
3. Navigation is: Back | Total (label + prices) | Next — centered horizontally
4. DCP preview shows flat horizontal layout with tiny placeholder squares, no proper tiles

### Product-Page (Modal) Footer
1. Storefront gap between grouped-content items is 8px (DCP has 15px)
2. Storefront buttons use uppercase text (BACK/NEXT)
3. Discount messaging section sits between price pill and buttons
4. Progress bar + details shown below discount text

## Progress Log

### 2026-02-24 10:00 - Starting Implementation
- Rewriting FullPageFooterLayout to match 3-section vertical storefront layout
- Updating ProductPageFooterLayout to match modal footer structure
- Files to modify: `app/components/design-control-panel/preview/BundleFooterPreview.tsx`

### 2026-02-24 10:15 - Completed Implementation
- Rewrote FullPageFooterLayout with 3-section vertical layout: Progress Message → Product Tiles → Back | Total | Next
- Product tiles now show realistic cards with image placeholder, quantity badge, product name, variant, and remove button
- Navigation section matches storefront: Back button | Total (label + strikethrough + final price) | Next button
- Buttons use uppercase text and letter-spacing to match storefront CSS
- Updated ProductPageFooterLayout to match modal footer: gap reduced from 15px to 8px, added discount messaging section between price pill and buttons
- Added footerDiscountTextVisibility prop to ProductPageFooterLayout for discount text preview
- All customisation props preserved and functional
- ESLint: 0 errors, 2 pre-existing warnings
- Files modified: `app/components/design-control-panel/preview/BundleFooterPreview.tsx`

## Phases Checklist
- [x] Phase 1: Rewrite FullPageFooterLayout to match storefront
- [x] Phase 2: Update ProductPageFooterLayout to match modal footer
- [x] Phase 3: Verify all customisation props still work
