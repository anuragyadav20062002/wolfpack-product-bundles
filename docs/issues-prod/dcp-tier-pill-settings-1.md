# Issue: DCP Tier Pill Settings for Full-Page Bundle Widget

**Issue ID:** dcp-tier-pill-settings-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 08:30

## Overview

Add a "Pricing Tiers" section to the Design Control Panel so merchants can style the tier pill bar that was added in `fpb-tier-selection-1`. Also covers any missing DCP settings for the bottom-sheet widget style (product-page).

## Phases Checklist

- [x] Phase 1: Types + defaults + CSS variable generation ✅
- [x] Phase 2: TierPillSettings component + TierPillPreview component ✅
- [x] Phase 3: Wire into SettingsPanel, PreviewPanel, NavigationSidebar ✅
- [x] Phase 4: Build, lint, commit ✅

## Progress Log

### 2026-03-17 08:30 - All Phases Completed

- ✅ `app/components/design-control-panel/types.ts` — Added 11 `tierPill*` fields to `DesignSettings`
- ✅ `app/components/design-control-panel/config/defaultSettings.ts` — Added tier pill defaults to `FULL_PAGE_DEFAULTS`
- ✅ `app/lib/css-generators/css-variables-generator.ts` — Added `--bundle-tier-pill-*` CSS variable emission (11 variables)
- ✅ `app/components/design-control-panel/settings/TierPillSettings.tsx` — New: active/inactive/hover colors, border, radius, height, gap, font settings
- ✅ `app/components/design-control-panel/preview/TierPillPreview.tsx` — New: renders 3 sample pills using real widget class names
- ✅ `app/components/design-control-panel/settings/SettingsPanel.tsx` — Added `tierPills` case
- ✅ `app/components/design-control-panel/preview/PreviewPanel.tsx` — Added `tierPills` section
- ✅ `app/components/design-control-panel/NavigationSidebar.tsx` — Added "Pricing Tier Pills" nav item below Promo Banner
- ✅ `settings/index.ts` + `preview/index.ts` — Exported new components
- ✅ Build: `npm run build:widgets` success (full-page: 227.2 KB, product-page: 139.7 KB)
- ✅ Lint: 0 errors
