# Issue: PDP DCP Widget Style — Dedicated Pre-Modal Preview Page

**Issue ID:** pdp-widget-style-preview-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-10
**Last Updated:** 2026-04-10 18:30

## Overview

Previously the PDP DCP "Widget Style" section showed empty-state cards *inside the modal bottom-drawer* preview. This was incorrect: in the real widget, empty slot cards (`.bw-slot-card--empty`) appear on the **product page itself** before the modal ever opens, not inside the modal.

Replaced the `.dcp-empty-grid` modal-swap approach with a proper pre-modal product page view that:
1. Shows a mock PDP layout (product image + info column) as a full fixed overlay
2. Renders the bundle slot cards using actual widget classes (`.step-box.bw-slot-card.bw-slot-card--empty`) so CSS variable changes (`--bundle-empty-state-card-bg`, `--bundle-empty-slot-border-style`, etc.) are reflected live
3. Completely hides the modal when this view is active

## Phases Checklist

- [x] Phase 1: Replace empty-grid swap with pre-modal product page view in `api.preview.$type.tsx` ✅

## Progress Log

### 2026-04-10 18:30 - Phase 1 Completed

- ✅ Removed `.dcp-empty-grid` div from `pdpPageHtml` modal body
- ✅ Added `.dcp-pdp-pre-modal-view` div to `pdpPageHtml`:
  - Fixed overlay showing mock PDP layout (image col + info col)
  - 3 `.step-box.bw-slot-card.bw-slot-card--empty` slot cards with plus-icon SVG + step name labels
  - Uses actual widget classes so all CSS variable changes (bg, border colour, text colour, border style) are reflected live
  - `.add-bundle-to-cart` button below the slot cards
- ✅ Added CSS for `.dcp-pdp-pre-modal-view` layout in `pageLayoutCss`:
  - `.dcp-pdp-page-layout` flex row (image col 260×320px + info col)
  - `.dcp-pdp-vendor`, `.dcp-pdp-product-title`, `.dcp-pdp-product-price`, `.dcp-pdp-divider` mock product info
  - `.dcp-pdp-bundle-app .bundle-steps { --step-box-size: 140px }` so 3 cards fit the info column
- ✅ Updated `DCP_SECTION_CHANGE` JS handler:
  - OLD: swapped `.product-grid` ↔ `.dcp-empty-grid` inside the modal
  - NEW: hides `.bundle-builder-modal` entirely + shows `.dcp-pdp-pre-modal-view` when `section === 'widgetStyle'`; restores modal for all other sections
- Files modified: `app/routes/api/api.preview.$type.tsx`
- Commit: (pending)
