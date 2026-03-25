# Issue: UX Gap Fixes — Batch 2

**Issue ID:** ux-gap-fixes-batch2-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 12:00

## Overview

Batch 2 of UX gap fixes. Covers configure page polish and dashboard preview tooltip:
- GAP-05: Preview button tooltip fires on disabled state (dashboard)
- GAP-06: Sync Bundle disabled → toast with explanation (both configure routes)
- GAP-09: Max 4 discount rules inline message (both configure routes)
- GAP-10: Tooltip on Discount Messaging checkbox label (both configure routes)
- GAP-12: Tooltip on "Storefront" badge (both configure routes)
- GAP-13: Remove "APPEARS DURING" chips (both configure routes)
- GAP-14: Inline GIF preview below FilePicker (both configure routes)

## Phases Checklist
- [x] GAP-05: Dashboard preview button span wrapper
- [x] GAP-06: Sync Bundle toast on dirty click
- [x] GAP-09: Max rules inline message
- [x] GAP-10: Discount Messaging tooltip
- [x] GAP-12: Storefront badge tooltip
- [x] GAP-13: Remove APPEARS DURING chips
- [x] GAP-14: GIF preview img

## Progress Log

### 2026-03-26 12:00 - All changes complete
- ✅ GAP-05: Wrapped disabled preview button in `<span style="display:inline-flex">` so Tooltip fires on hover
- ✅ GAP-06: Removed `disabled` from Sync Bundle secondaryAction; added guard in `onAction` showing toast "Save your changes before syncing" when dirty — both configure routes
- ✅ GAP-09: Replaced hidden "Add rule" button with inline text "Maximum 4 discount rules reached" — both configure routes
- ✅ GAP-10: Wrapped Discount Messaging `Checkbox` in `Tooltip` explaining what it does — both configure routes; added `Tooltip` to Polaris imports
- ✅ GAP-12: Wrapped Storefront `Badge` in `Tooltip` explaining it affects storefront — both configure routes
- ✅ GAP-13: Removed APPEARS DURING `BlockStack` with 3 info badges — both configure routes
- ✅ GAP-14: Added `{loadingGif && <img ...>}` preview block below FilePicker — both configure routes
