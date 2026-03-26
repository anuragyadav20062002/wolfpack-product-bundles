# Issue: FPB Sidebar Step Tab — Show "0 selected" When Empty

**Issue ID:** sidebar-tab-zero-count-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24

## Overview

In the full-page sidebar layout, step tabs with no selection show a step number + name +
optional quantity hint. They do NOT show a count badge, making the empty state inconsistent
with the selected state which shows "N selected".

The user expects `0 selected` to appear in the count badge even when nothing is selected,
matching the visual pattern of `1 selected`, `2 selected`, etc.

## Root Cause

In `createStepTimeline()`, the `hasSelections` branch always renders `tab-count`, but the
else branch (no selections) rendered `tab-quantity-hint` instead. No `tab-count` was emitted.

## Fix

Replace `tab-quantity-hint` with `tab-count` showing `0 selected` in the empty step branch.
The `quantityHint` variable is removed; step conditions are already enforced at the Next
button and tab click level.

## Progress Log

### 2026-03-24 - Implemented and committed

- ✅ Changed empty-step else branch: replaced `tab-quantity-hint` with `<span class="tab-count">0 selected</span>`
- ✅ Kept `prevStepName` variable (still needed for locked-tab tooltip text)
- ✅ Bumped WIDGET_VERSION: 2.3.5 → 2.3.6 (PATCH)
- ✅ Built widget bundles (FP: 250.5 KB, PP: 152.1 KB)
- ✅ Linted — 0 errors
- Files changed:
  - `app/assets/bundle-widget-full-page.js`
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
  - `scripts/build-widget-bundles.js`

## Phases Checklist

- [x] Replace quantityHint with tab-count in empty step branch
- [x] Bump WIDGET_VERSION + build
- [x] Lint + commit
