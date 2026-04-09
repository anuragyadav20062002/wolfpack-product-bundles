# Issue: DCP Preview Floating Footer Discount Parity for Full-Page Bundles

**Issue ID:** dcp-fpb-footer-discount-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-04-09
**Last Updated:** 2026-04-09 12:15

## Overview
The floating footer in the DCP preview for full-page bundles when discount is enabled does not
match the actual storefront widget implementation. Need to make the DCP preview footer
consistent with what customers see on the storefront.

## Progress Log

### 2026-04-09 09:00 - Starting Phase 1
- Investigating DCP preview footer vs storefront widget footer with discount enabled
- Identifying layout/style discrepancies

### 2026-04-09 12:05 - Phase 1 & 2 Complete — Discrepancies Identified

Code analysis of `BundleFooterPreview.tsx` (FullPageFooterLayout) vs actual widget HTML
in `api.preview.$type.tsx` (fpbFloatingHtml) and widget CSS.

**Actual storefront widget structure (compact bar):**
```
[ img img img ] | 3/3 Products ▼      |  [ Next ]
                 | Total: $89.97 $71.98 20%OFF |
```
- `footer-callout-banner`: green banner at top (🎉 You unlocked 20% off!)
- `footer-thumbstrip`: 3 overlapping circular thumbnails (40px, border 2px white)
- `footer-centre`: stacked column — toggle text "3/3 Products ▼" + total-area (label + prices)
- `footer-cta-btn`: single Next CTA button (no Back button)

**DCP preview structure (wrong — large card):**
- Large card (minWidth 520px) with 3 sections:
  - Success banner OR progress text ("Add 1 more item to get 10% off")
  - Scrollable product tiles (with remove button, qty badge)
  - Back button | Total + prices | Next button

**Key discrepancies:**
1. DCP has a Back button — actual widget footer has NO back button
2. DCP shows large scrollable product tiles — widget shows compact overlapping thumb images
3. DCP shows "progress" text in center — widget has no in-bar progress text
4. Center layout: DCP shows Back/Next buttons on sides — widget stacks toggle + total in center column
5. Discount badge in widget is inline with total prices — DCP puts badge next to prices correctly but layout is wrong overall

### 2026-04-09 12:15 - Phase 3: Fix Implemented

- ✅ Rewrote `FullPageFooterLayout` in `BundleFooterPreview.tsx` (lines 80-247)
- ✅ Replaced large card with compact bar matching actual `position: fixed` floating widget
- ✅ Changes:
  - Removed "Back" button (actual widget has no back button in floating footer)
  - Removed large scrollable product tiles section
  - Added overlapping circular thumbstrip (matching `.footer-thumbstrip`)
  - Center column: "3/3 Products ▼" toggle text + total prices inline (matching `.footer-centre`)
  - Single "Next" CTA button on right (matching `.footer-cta-btn`)
  - Callout banner at top when `showSuccessBanner=true` (matching `.footer-callout-banner`)
  - Discount badge (20% OFF pill) inline with prices when `footerDiscountTextVisibility=true`
- ✅ Lint: 0 errors
- Files Modified: `app/components/design-control-panel/preview/BundleFooterPreview.tsx`
- Next: verify in dev server via Chrome DevTools

## Phases Checklist
- [x] Phase 1: Screenshot and compare DCP preview footer vs storefront footer (discount enabled) ✅
- [x] Phase 2: Identify specific discrepancies in markup/styles ✅
- [x] Phase 3: Update DCP preview footer to match storefront implementation ✅
- [ ] Phase 4: Test and verify parity via Chrome DevTools
