# Issue: DCP Badge Customization + Reset Confirmation UI

**Issue ID:** dcp-badge-customization-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-09
**Last Updated:** 2026-04-09 19:00

## Overview

Two improvements to the Design Control Panel:

1. **Badge customization for FPB product cards** — Free gift and "Included" badges should be
   configurable in the DCP for full-page bundles: position (top-left / top-right / bottom-left /
   bottom-right) and custom image upload. Free gift badge position also exposed in PDP DCP
   (image upload already exists there). Included badge is FPB-only.

2. **Reset confirmation UI fix** — The "Reset to defaults" confirmation text + buttons are
   crammed into a flex row that wraps badly in the narrow settings panel. Replace with a clean
   stacked confirmation card.

## Progress Log

### 2026-04-09 18:00 - Implementation Started
- Files to modify: prisma/schema.prisma, state.types.ts, dcp types.ts, defaultSettings.ts,
  mergeSettings.ts, handlers.server.ts, css-variables-generator.ts, bundle-widget-full-page.css,
  bundle-widget-full-page.js, dcp-config/types.ts, fpb.config.ts, SettingsPanel.tsx,
  WidgetStyleSettings.tsx
- Files to create: FPBBadgesSettings.tsx

## Progress Log

### 2026-04-09 19:00 - All Phases Completed
- ✅ Reset confirmation UI replaced: stacked card layout with red bg, message, Cancel + Yes buttons — no more cramped flex row
- ✅ Prisma: added `freeGiftBadgePosition`, `includedBadgeUrl`, `includedBadgePosition` fields; migration 20260409180000 created + applied
- ✅ state.types.ts, dcp types.ts, defaultSettings.ts (both PDP + FPB), mergeSettings.ts updated
- ✅ handlers.server.ts GENERAL_KEYS extended with 3 new fields
- ✅ CSS generator: `buildBadgePositionVars()` helper emits 4 position variables per badge; `--bundle-included-badge-url` added
- ✅ Widget CSS: `.fpb-free-badge` and `.fpb-included-badge` use CSS variables for positioning; `.fpb-included-badge-img` added
- ✅ Widget JS: included badge checks `--bundle-included-badge-url` and renders `<img>` if set
- ✅ DCP config: `fpbBadges` group added to fpb.config.ts; DCPSectionKey + DCPGroupKey types extended
- ✅ `FPBBadgesSettings.tsx` created: free gift + included badge sections, each with FilePicker + 2×2 grid position picker
- ✅ `WidgetStyleSettings.tsx` updated: free gift badge position picker added (PDP DCP)
- ✅ SettingsPanel: import, SECTION_KEYS, switch case all wired
- ✅ Build: 257.1 KB FPB bundle, CSS 96,310 B (under 100 KB limit), 0 lint errors
- Files Modified: 14 files, 1 file created (FPBBadgesSettings.tsx), 1 migration file created

## Phases Checklist
- [x] Phase 1: Reset confirmation UI fix ✅
- [x] Phase 2: Prisma + types + defaults + merge + handlers ✅
- [x] Phase 3: CSS generator + widget CSS + widget JS ✅
- [x] Phase 4: DCP config + UI components ✅
- [x] Phase 5: Build + lint + commit ✅
