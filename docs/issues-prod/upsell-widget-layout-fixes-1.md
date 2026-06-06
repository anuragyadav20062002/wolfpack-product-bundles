# Issue: Upsell Widget UI Layout Fixes
**Issue ID:** upsell-widget-layout-fixes-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 03:30

## Overview
Three layout issues in the Bundle Widget section of the PPB configure route:
1. Offer Upsell Block and Offer Upsell Button preview images have different heights causing layout shift when switching modes
2. Elements below the upsell radio selectors (blue info banner, Display Widget on, Multi Language button) are too crowded — missing top padding/gap
3. Multi Language button in Widget Settings shows only the globe icon with no visible text label

## Progress Log
### 2026-06-01 03:30 - Implementing fixes
- Fix visibilityPreviewFullImage to use fixed height (220px) so both images occupy identical space
- Add upsellWidgetContent CSS class with flex column + gap for the inner opacity wrapper div
- Change Multi Language s-button from plain/icon-only to secondary variant with visible "Multi Language" label

### 2026-06-01 03:45 - Completed
- visibilityPreviewFullImage: height auto → 220px with object-position: top (both images identical space)
- Added .upsellWidgetContent CSS class (flex column, gap 18px) applied to inner opacity wrapper div
- Multi Language s-button: plain/icon-only → secondary variant with globe icon + "Multi Language" label
- Linter: 0 errors

## Phases Checklist
- [x] Fix preview image fixed height
- [x] Add spacing gap for inner content below radio selectors
- [x] Fix Multi Language button to show icon + label
