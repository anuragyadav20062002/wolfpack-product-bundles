# Issue: Product Page Discount Messaging Fixes

**Issue ID:** product-page-discount-messaging-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 00:00

## Overview
Fix discount messaging display issues in product page bundles:
1. Remove discount message from upper tabs area (modal header) - show only step name
2. Move all messaging between back/next buttons and price box in footer
3. Hide "Add 0 items to get No discount" when no discount is configured
4. Fix "x items" text transparency/visibility issue

## Progress Log

### 2026-02-16 00:00 - Starting Implementation
- Removing discount text from modal header (always show step name)
- Reordering footer: Price → Discount Message → Buttons
- Hiding discount messaging when no discount rules exist
- Fixing bundle-conditions-text color visibility
- Files to modify: bundle-widget-product-page.js, bundle-widget.css, template-manager.js

## Related Documentation
- Screenshots show "Add 0 items to get No discount" in header and footer

### 2026-02-16 00:01 - Completed All Phases
- ✅ Modal header now always shows step name (removed discount text from header)
- ✅ Footer reordered: Price Pill → Discount Messaging → Progress Bar → Buttons
- ✅ Discount messaging hidden when no discount rules configured (no more "Add 0 items to get No discount")
- ✅ Fixed .bundle-conditions-text and .bundle-discount-text visibility with explicit color fallback and font-weight
- ✅ Built product-page widget bundle
- Files modified:
  - app/assets/bundle-widget-product-page.js
  - extensions/bundle-builder/assets/bundle-widget.css
  - extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js

## Phases Checklist
- [x] Phase 1: Remove header discount text, always show step name
- [x] Phase 2: Reorder footer layout (price → messaging → buttons)
- [x] Phase 3: Hide messaging when no discount configured
- [x] Phase 4: Fix conditions text visibility
- [x] Phase 5: Build widgets and test
