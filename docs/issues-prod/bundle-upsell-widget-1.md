# Issue: Bundle Upsell Widget — EB Parity (FPB simplify + PPB dynamic preview + embed fixes)
**Issue ID:** bundle-upsell-widget-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 01:00

## Overview
Align WPB FPB and PPB Bundle Widget / Bundle Embed sections with EB competitor parity.

Both routes already have Bundle Widget and Bundle Embed UI + persistence (`bundleUpsellConfig` JSON field on Bundle model). The gaps are targeted UI-only fixes:

### FPB Bundle Widget
- Preview image is static (shows `upsellWidgetImageUrl`). Must switch between `/Upsell-Block.png` and `/Upsell-Button.png` based on radio selection.
- Widget Settings has Image Upload + Widget Title + Widget Description + Widget Button Text. EB FPB has Button Text ONLY — remove the first three.
- Embed card description: "Place app block on the theme" → EB copy.

### PPB Bundle Widget
- Preview image: same dynamic fix (Block/Button image swap).
- Multi Language button: `disabled={!upsellWidgetEnabled}` → remove disabled, add onClick to toggle language mode (same as FPB).
- Embed card description: same EB copy fix.

### PPB Bundle Embed
- Embed card description text minor fix.

## Progress Log

### 2026-06-01 00:00 - Investigation complete
- `bundleUpsellConfig` confirmed as `Json?` field in Prisma schema (line 145).
- `parsePPBBundleVisibility` in PPB parsers.ts writes to DB (line 106).
- FPB `buildBundleUpsellConfig()` includes all fields even after removing UI controls — safe to remove inputs.
- All state variables exist in both routes; removing UI controls won't break persistence.

### 2026-06-01 01:00 - Implementation complete
- FPB route: dynamic preview image (`/Upsell-Block.png` / `/Upsell-Button.png` based on radio).
- FPB route: Widget Settings simplified to Button Text only (removed FilePicker, Widget Title, Widget Description).
- FPB route: embed card description updated to EB copy.
- PPB route: same dynamic preview image fix.
- PPB route: Multi Language button — removed disabled, added onClick opening multi-language modal with widgetTitle/widgetDescription/widgetButtonText fields.
- PPB route: Widget embed card description updated to EB copy.
- PPB route: Bundle Embed placement card restructured with descriptive text + Place Block button.
- ESLint: 0 errors on both files.

## Related Documentation
- `docs/competitor-analysis/eb-fpb-bundle-widget-full.png`
- `docs/competitor-analysis/eb-ppb-mix-match-read.network-response`

## Phases Checklist
- [x] FPB: dynamic preview image (Block/Button swap)
- [x] FPB: remove Image Upload + Widget Title + Widget Description from Widget Settings
- [x] FPB: fix embed card description text
- [x] PPB Widget: dynamic preview image
- [x] PPB Widget: fix Multi Language button (remove disabled + add onClick)
- [x] PPB Widget: fix embed card description text
- [x] PPB Embed: fix embed card description text
- [x] Lint modified files
- [ ] E2E test on Chrome
