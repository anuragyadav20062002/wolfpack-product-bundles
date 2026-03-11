# Issue: DCP Discount Text & Progress Bar Preview Fix

**Issue ID:** dcp-discount-progress-fix-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-11
**Last Updated:** 2026-03-11

## Overview
The `footerDiscountProgress` preview in the Design Control Panel for product page bundles
shows a progress bar (track + fill + "2 / 4 items" count) that no longer exists in the
actual product-page widget. The widget had its progress bar removed by design — it now uses
a single `<div class="footer-discount-text">` element that toggles between a progress
message and a success message. The DCP preview must match the real widget.

## Root Cause
`BundleFooterPreview.tsx` (lines 649–760) has a dedicated `footerDiscountProgress` +
`BundleType.PRODUCT_PAGE` branch that was written when the widget still had a progress bar.
After the progress bar was removed from the widget, this preview branch was never updated.

## Files to Modify
- `app/components/design-control-panel/preview/BundleFooterPreview.tsx`

## Progress Log

### 2026-03-11 - Completed
- ✅ Removed progress bar track, fill, and "X / Y items" details from preview
- ✅ Preview now shows: progress state text + "— when qualified —" divider + success message
- ✅ Both states are visible simultaneously so merchant can style both
- ✅ ESLint: 0 errors
- Files: `app/components/design-control-panel/preview/BundleFooterPreview.tsx`

## Phases Checklist
- [x] Remove progress bar from PRODUCT_PAGE footerDiscountProgress preview
- [x] Keep discount text + success message preview
- [x] Lint + commit
