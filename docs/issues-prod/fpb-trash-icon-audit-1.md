# Issue: FPB Trash Icon Audit — DOM Safety & UX Consistency

**Issue ID:** fpb-trash-icon-audit-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24 19:45

## Overview

Audit of trash icon / remove product implementation in the FPB widget for both footer layouts
(sidebar `footer_side` and floating footer `footer_bottom`).

No stale listener accumulation exists — both layouts wipe their container with `innerHTML = ''`
on every re-render, detaching all old nodes and their listeners.

Three issues identified and fixed:

1. **Missing null guard on `removeBtn`** in `_createFooterPanel` (line 2166) — `querySelector`
   result used without null check before `.addEventListener`. Low risk in practice but throws
   if the innerHTML fails to include the button.

2. **Sidebar remove has no undo toast** — footer shows `ToastManager.showWithUndo` on trash
   click; sidebar silently removes with no recovery path. UX inconsistency.

3. **Sidebar stepIndex fallback is dead and misleading** — `item.stepIndex ?? this.currentStepIndex`
   on the sidebar remove handler. `getAllSelectedProductsData()` always populates `stepIndex`
   so the fallback never fires; if it ever did, it would silently operate on the wrong step.

## Files Modified

- `app/assets/bundle-widget-full-page.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (build output)

## Progress Log

### 2026-03-24 19:15 - Starting fixes

### 2026-03-24 19:45 - All phases completed

- ✅ Phase 1: Fixed all three issues in `app/assets/bundle-widget-full-page.js`
  - Added `if (!removeBtn) return;` null guard before `.addEventListener` in `_createFooterPanel` (~line 2166)
  - Replaced sidebar click handler with undo toast matching footer pattern (~lines 1128–1138)
  - Removed dead `?? this.currentStepIndex` fallback; now uses `item.stepIndex` directly (line 1129)
- ✅ Phase 2: Built widgets — `npm run build:widgets` succeeded (250.1 KB output)
- ✅ Phase 3: Committed

## Phases Checklist
- [x] Phase 1: Fix null guard + sidebar handler in JS source
- [x] Phase 2: Build widgets
- [x] Phase 3: Lint + commit
