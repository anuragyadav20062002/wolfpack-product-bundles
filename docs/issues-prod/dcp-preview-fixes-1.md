# Issue: DCP Preview Fixes — Skeleton Height + PDP Badge Parity

**Issue ID:** dcp-preview-fixes-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-09
**Last Updated:** 2026-04-09 21:30

## Overview

Two fixes to the Design Control Panel:

1. **Skeleton Loading preview height mismatch** — The skeleton card preview in the DCP uses
   a hardcoded `height: 200px` instead of the `--bundle-product-card-height` CSS variable,
   so the preview doesn't match actual product card dimensions when merchants have customised
   card height.

2. **PDP DCP free gift badge parity** — After the badge customization work (dcp-badge-customization-1),
   the free gift badge controls were added to the `WidgetStyleSettings` section on PDP. They should
   instead be a dedicated top-level "Product Badges" section, mirroring the FPB DCP pattern.

## Phases Checklist

- [x] Phase 1: Skeleton height fix (`ProductCardPreview.tsx`) ✅
- [x] Phase 2: PDP badge dedicated section (new `PDPBadgeSettings.tsx` + config + wiring) ✅
- [x] Phase 3: Badge preview card + upload help text in badge settings ✅
- [x] Phase 4: PDP DCP — club Empty State under Widget Style + empty state iframe preview ✅

## Progress Log

### 2026-04-09 20:30 - All Phases Completed
- ✅ `ProductCardPreview.tsx`: `.dcp-skeleton-card` height changed from `200px` to `var(--bundle-product-card-height, 200px)` — preview now scales with merchant card height setting
- ✅ `PDPBadgeSettings.tsx`: new component — free gift badge image (FilePicker) + 2×2 position picker
- ✅ `WidgetStyleSettings.tsx`: removed free gift badge block; removed unused FilePicker + InlineColorInput imports
- ✅ `app/lib/dcp-config/types.ts`: added `pdpBadge` to DCPSectionKey + DCPGroupKey
- ✅ `app/lib/dcp-config/pdp.config.ts`: inserted pdpBadge group before productCard using findIndex splice
- ✅ `SettingsPanel.tsx`: import, SECTION_KEYS entry, switch case all wired
- Commit: 73b2fa8

### 2026-04-09 21:00 - Badge Preview + Help Text Added
- ✅ `BadgePreviewCard.tsx` created: mini product card with live badge overlay; shows merchant's image or default text badge (#FFF3CD "Free" / #D1FAE5 "Included") at the selected position
- ✅ `FPBBadgesSettings.tsx`: preview card added above each badge section; help text info box above each FilePicker
- ✅ `PDPBadgeSettings.tsx`: preview card and help text added
- Commit: 1b9aebe

### 2026-04-09 21:30 - Phase 4: Empty State + Widget Style Merge Completed
- ✅ `WidgetStyleSettings.tsx`: absorbed EmptyStateSettings controls — card bg, border color, text color, border style now under "Empty State Cards" sub-heading
- ✅ `pdp.config.ts`: removed `emptyState` from PDP_GENERAL_EXTRAS; description updated
- ✅ `SettingsPanel.tsx`: SECTION_KEYS.widgetStyle extended with 5 empty-state keys (reset works)
- ✅ `api.preview.$type.tsx`: added hidden `.dcp-empty-grid` to PDP modal body; DCP_SECTION_CHANGE 'widgetStyle' swaps product cards ↔ empty-state cards in the iframe preview
- Commit: 0e6bd2b
