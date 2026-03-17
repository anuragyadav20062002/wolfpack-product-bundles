# Issue: Beco BYOB Expandable Floating Footer

**Issue ID:** beco-layout-redesign-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 21:30

## Overview

Replace the current stacked multi-section floating footer on full-page bundles with a compact
Beco-style sticky bar (72px) that expands upward on tap to show the selected product list with
remove actions and a deal-unlock callout banner.

## Related Documentation
- docs/beco-layout-redesign/00-BR.md
- docs/beco-layout-redesign/02-PO-requirements.md
- docs/beco-layout-redesign/03-architecture.md
- docs/beco-layout-redesign/04-SDE-implementation.md

## Phases Checklist

- [x] Phase 1: Write 22 tests (Red → Green) ✅
- [x] Phase 2: Implement new footer JS + CSS (Green) ✅
- [x] Phase 3: Build widgets + verify ✅

## Progress Log

### 2026-03-17 21:30 - Planning Complete

- ✅ Visited Beco BYOB live: https://www.letsbeco.com/pages/BYOB_13May/
- ✅ Inspected DevTools: footer HTML structure, CSS classes, expand/collapse behaviour
- ✅ Completed feature pipeline: BR → PO → Architect → SDE plan
- ✅ Created issue file

### 2026-03-17 22:00 - All Phases Completed

- ✅ 22 tests written and passing (`tests/unit/assets/fpb-footer-expandable.test.ts`)
- ✅ `renderFullPageFooter()` rewritten in `app/assets/bundle-widget-full-page.js`
- ✅ Added `_createBecoPanel()` — upward-expanding product list with trash remove
- ✅ Added `_createBecoBar()` — compact bar: back | thumbstrip | toggle | total | CTA
- ✅ CSS added to `extensions/bundle-builder/assets/bundle-widget-full-page.css` (Beco-style section)
- ✅ `WIDGET_VERSION` bumped 1.6.0 → 1.7.0 in `scripts/build-widget-bundles.js`
- ✅ `bundle-widget-full-page-bundled.js` rebuilt (232.4 KB)
- ✅ 532 total tests pass — zero regressions
- ✅ Zero ESLint errors

**Files Modified:**
- `app/assets/bundle-widget-full-page.js` (~160 lines replaced + 2 new methods)
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` (~250 lines added)
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuilt)
- `scripts/build-widget-bundles.js` (version bump)
