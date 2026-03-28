# Issue: Floating Footer for Product-Page Bundle Widget (Classic Modal)

**Issue ID:** floating-footer-product-page-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-28
**Last Updated:** 2026-03-28 12:00

## Overview
Replace the full-width sticky footer in the classic modal with a compact floating pill footer. Move discount messaging to the modal header area below tabs.

## Progress Log

### 2026-03-28 12:00 - Starting Implementation
- Restructure modal HTML: floating pill footer, discount messaging in header
- Restyle CSS: remove old footer, add floating pill styles
- Bump WIDGET_VERSION to 2.4.0
- Files to modify: bundle-widget-product-page.js, bundle-widget.css, build-widget-bundles.js

### 2026-03-28 12:05 - Completed All Phases
- ✅ Restructured modal HTML: moved discount messaging to header, replaced footer with floating cart pill + nav pill
- ✅ Updated updateModalDiscountMessaging() to check both `.modal-footer-discount-messaging` and `.modal-header-discount-messaging`
- ✅ Replaced all footer CSS with floating pill design (transparent bg, cart pill + nav pill)
- ✅ Cleaned up 768px and 480px mobile overrides, added compact pill styles for small screens
- ✅ Bumped WIDGET_VERSION from 2.3.6 to 2.4.0
- ✅ Built widgets successfully, CSS under 100KB limit
- Files modified: bundle-widget-product-page.js, bundle-widget.css, build-widget-bundles.js, bundled output files

## Phases Checklist
- [x] Phase 1: Restructure modal HTML in ensureModal()
- [x] Phase 2: Update updateModalDiscountMessaging() selector
- [x] Phase 3: Restyle CSS for floating footer
- [x] Phase 4: Clean up mobile overrides
- [x] Phase 5: Bump widget version
- [x] Phase 6: Build & verify
