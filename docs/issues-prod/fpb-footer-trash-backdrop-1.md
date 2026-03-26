# Issue: FPB Floating Footer Trash Icon Intercepted by Backdrop

**Issue ID:** fpb-footer-trash-backdrop-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 16:45

## Overview

Clicking the trash icon in the floating footer's expanded product list collapses the footer instead of removing the product.

## Root Cause

`.full-page-footer.floating-card` has `position: fixed; z-index: 1000` — it creates a stacking context. Within that context, `.footer-backdrop` has `z-index: 999`. Non-positioned children (`.footer-panel`, `.footer-bar`) are at the default layer 0. CSS stacking order paints positioned elements with positive z-index AFTER non-positioned blocks, so the backdrop (z-index 999) is painted on top of the panel and bar — intercepting all pointer events before they reach the trash buttons or the toggle.

## Fix

- Set `.footer-backdrop { z-index: 0 }` (was 999)
- Add `position: relative; z-index: 1` to `.footer-panel` and `.footer-bar`

Panel/bar at z-index 1 > backdrop at z-index 0 → panel and bar are clickable. The backdrop still covers the page area outside the footer (which is at z-index < 1000 in the root stacking context).

## Phases Checklist
- [x] Phase 1: Fix z-index in bundle-widget-full-page.css

## Progress Log

### 2026-03-26 17:00 - Completed
- ✅ Changed `.footer-backdrop { z-index: 999 }` → `z-index: 0`
- ✅ Added `position: relative; z-index: 1` to `.footer-panel` and `.footer-bar`
- Panel and bar now sit above the backdrop (z-index 1 > 0) within the footer's stacking context. Backdrop still covers page content (product grid etc.) which is below the footer's root z-index of 1000.

### 2026-03-26 16:45 - Starting implementation
- File: `extensions/bundle-builder/assets/bundle-widget-full-page.css`
