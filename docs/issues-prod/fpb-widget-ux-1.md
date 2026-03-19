# Issue: FPB Widget UX Improvements

**Issue ID:** fpb-widget-ux-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 05:00

## Overview

Incremental UX improvements to the full-page bundle storefront widget.

## Progress Log

### 2026-03-20 05:00 - Auto-advance to next step on condition met

Previously: shoppers had to manually click "Next" after filling a step's condition.
Now: when `updateProductSelection()` detects the current step just became complete
(via `isStepCompleted()`), it schedules a 400ms delayed advance to the next step.

Behaviour details:
- Only fires on additions (quantity > 0), never on removals
- Re-checks condition inside the timeout — safe if user removes during delay
- `_autoAdvancePending` flag prevents double-scheduling on rapid taps
- Skips on the last step (no step to advance to)
- Skips if next step is locked (e.g. free gift not yet unlocked)
- Works for both footer-bottom and footer-side layouts via `reRenderFullPage()`

Files: `app/assets/bundle-widget-full-page.js`, widget rebuilt to v2.2.3

## Phases Checklist

- [x] Phase 1: Auto-advance on step condition met (v2.2.3)
