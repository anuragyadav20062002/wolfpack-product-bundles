# Issue: FPB Widget Hides Itself on Storefront
**Issue ID:** fpb-self-hide-bug-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-08
**Last Updated:** 2026-06-08 11:30

## Overview
FPB (Full Page Bundle) widget renders as blank/empty on storefront pages. The widget JS loads, all APIs return 200, the DOM is populated with bundle data — but the widget is invisible.

## Root Cause
In `extensions/bundle-builder/blocks/bundle-full-page.liquid` (lines 133–140), a script runs on DOMContentLoaded that was intended to hide an app-embed duplicate of the FPB widget.

**The bug:** The script queries ALL `.shopify-block.shopify-app-block` elements and hides any that contain `[data-bundle-type="full_page"]`. But the section block itself is also wrapped in a `.shopify-block.shopify-app-block` div (added by Shopify's rendering engine). So the script finds the current section block and sets `style="display: none;"` on it — hiding the widget it just rendered.

**Confirmed by:**
- `document.querySelector('[id*="wolfpack_product_bundles_bundle_full_page"]').getAttribute('style')` → `"display: none;"`
- Setting `el.style.display = ''` in DevTools → widget instantly appears, fully functional

## Fix
Capture `document.currentScript.closest('.shopify-section')` synchronously (before DOMContentLoaded, where `currentScript` becomes null), then skip blocks inside the current section when hiding duplicates.

## Files Modified
- `extensions/bundle-builder/blocks/bundle-full-page.liquid` — lines 133–140

## Progress Log
### 2026-06-08 11:00 - Root Cause Confirmed
- ✅ Navigated to https://wolfpackdemostore.myshopify.com/pages/preview-7th-june
- ✅ Confirmed container has height:0/width:0 despite display:flex
- ✅ Found `style="display: none;"` as inline style on shopify-app-block parent
- ✅ Traced to script in bundle-full-page.liquid lines 133–140
- ✅ Verified fix by removing display:none in DevTools — widget renders fully
- Next: Apply fix to Liquid block

### 2026-06-08 11:30 - Fix Applied
- ✅ Confirmed the app embed (`bundle-app-embed.liquid`) already has: `if (document.querySelector('#bundle-builder-app')) return;` — a guard that prevents any duplication since the section block renders `#bundle-builder-app` server-side (in HTML, always present before JS runs)
- ✅ The hiding script was therefore entirely unnecessary — removed it completely from `bundle-full-page.liquid`
- ✅ No patch needed — the real fix is to delete the harmful script
- Files changed: `extensions/bundle-builder/blocks/bundle-full-page.liquid` (removed lines 133–140)

## Phases Checklist
- [x] Phase 1: Root Cause Investigation ✅
- [x] Phase 2: Fix and Deploy ✅
