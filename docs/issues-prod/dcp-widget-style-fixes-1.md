# Issue: DCP Widget Style Preview + Free Gift Badge Upload Fix

**Issue ID:** dcp-widget-style-fixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 05:00

## Overview
Two bugs in the PDP DCP → General → Widget Style section:
1. Preview layout broken — `width: 100%` inside `inline-block` previewWrapper has no containing block, so slot cards and bottom sheet don't size correctly and text overflows.
2. Free gift badge upload not working — hidden `<input type="file">` is outside the portal dialog; programmatic `.click()` across portal boundary is blocked by some browsers as an untrusted event.

## Progress Log

### 2026-03-20 05:00 - Starting fixes
- Fix 1: Set explicit width (520px) on widgetStyle preview outer div in ProductCardPreview.tsx
- Fix 2: Move `<input type="file">` from main render tree into the portal dialog, adjacent to the Upload button

## Phases Checklist
- [x] Fix 1: Preview width (ProductCardPreview.tsx)
- [x] Fix 2: File input inside portal (FilePicker.tsx)

## Related Documentation
- `docs/issues-prod/dcp-bugs-audit-1.md`
