# Issue: Bundle Upsell Widget — EB Parity (FPB simplify + PPB dynamic preview + embed fixes)
**Issue ID:** bundle-upsell-widget-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 02:30

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

### 2026-06-01 02:30 - Round 2 fixes (UX polish)
- Preview image: both FPB + PPB now render full-width img filling entire visibilityPreviewFrame (removed product mockup grid)
- Multi Language buttons: all instances changed to `<s-button variant="plain" icon="globe">` (FPB bundle_widget, PPB bundle_widget, PPB bundle_embed)
- FPB bundle_widget Multi Language: now opens modal with widgetButtonText field (was incorrectly toggling languageMode)
- Disabled state: panel body grays out (opacity 0.4 + pointerEvents none) when toggle is off (FPB bundle_widget, PPB bundle_widget, PPB bundle_embed)
- Discard fix: added useRef baselines for all upsell widget + bundle embed state; refs updated on save success; state reset in handleDiscard (both FPB + PPB routes)
- Modal contents: confirmed already match EB exactly (no changes needed)
- CSS: added .visibilityPreviewFullImage class to both CSS modules

## Phases Checklist
- [x] FPB: dynamic preview image (Block/Button swap)
- [x] FPB: remove Image Upload + Widget Title + Widget Description from Widget Settings
- [x] FPB: fix embed card description text
- [x] PPB Widget: dynamic preview image
- [x] PPB Widget: fix Multi Language button (remove disabled + add onClick)
- [x] PPB Widget: fix embed card description text
- [x] PPB Embed: fix embed card description text
- [x] FPB + PPB: preview image fills entire frame (remove product mockup grid)
- [x] FPB + PPB + PPB Embed: Multi Language button → globe icon s-button
- [x] FPB + PPB + PPB Embed: disabled state (gray out panel when toggle off)
- [x] FPB + PPB: discard button resets upsell widget + embed state
- [x] Multi Language modal contents match EB (confirmed, no change needed)
- [x] Lint modified files
- [ ] E2E test on Chrome
