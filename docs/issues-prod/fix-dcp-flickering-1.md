# Issue: Fix DCP Save Bar Flickering and Footer Settings Sync

**Issue ID:** fix-dcp-flickering-1
**Status:** Completed
**Priority:** High
**Created:** 2026-01-26
**Last Updated:** 2026-01-26 10:30

## Overview

Multiple issues with the Design Control Panel (DCP):
1. Save bar flickering when changing settings sequentially
2. Bundle Footer settings not syncing properly (only Total Pill Background Color works)
3. Strikethrough Price Color save bar flickering

## Root Cause Analysis

### Issue 1: Save Bar Flickering
The `ColorPicker` component uses `useState(value)` for local state, but doesn't sync with prop changes:
- `useState(value)` only sets initial value, doesn't update when prop changes
- When user changes settings rapidly, local state can become stale
- This causes inconsistent dirty checking and save bar flickering

**Location:** `app/components/design-control-panel/common/ColorPicker.tsx`

### Issue 2: Footer Settings Not Syncing
The CSS variables were generated correctly, but the widget CSS was using hardcoded styles:
- `.modal-footer` used `background: linear-gradient(...)` instead of `var(--bundle-footer-bg)`
- `.full-page-footer` used `--bundle-footer-background-color` instead of `--bundle-footer-bg`

**Location:** `extensions/bundle-builder/assets/bundle-widget.css`

## Progress Log

### 2026-01-26 10:00 - Starting Investigation
- Analyzed codebase structure
- Identified root causes
- Created fix plan

### 2026-01-26 10:20 - Implemented Fixes
- Fixed ColorPicker component to sync localValue with value prop using useEffect
- Added debouncing to save bar visibility in DCP to prevent rapid show/hide cycles
- Fixed .modal-footer background to use CSS variable instead of hardcoded gradient
- Fixed .full-page-footer to use correct CSS variable name (--bundle-footer-bg)

## Phases Checklist

- [x] Phase 1: Fix ColorPicker prop sync issue
- [x] Phase 2: Add debouncing to save bar visibility
- [x] Phase 3: Verify footer settings sync
- [x] Phase 4: Test all changes

## Related Documentation

- `CLAUDE.md` - Development guidelines
- `app/hooks/useDesignControlPanelState.ts` - State management
- `app/routes/app.design-control-panel.tsx` - Main DCP component

## Files Modified

1. `app/components/design-control-panel/common/ColorPicker.tsx` - Added useEffect to sync local state with prop
2. `app/routes/app.design-control-panel.tsx` - Added debouncing to save bar visibility
3. `extensions/bundle-builder/assets/bundle-widget.css` - Fixed hardcoded CSS to use variables
