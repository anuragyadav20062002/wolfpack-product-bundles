# Issue: DCP PDP — Overlapping Card Border setting between Empty State and Widget Style

**Issue ID:** dcp-empty-slot-border-overlap-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24 18:55

## Overview

In the DCP for product page bundles, "Empty State" and "Widget Style" both showed a border
setting that appeared to control the same element.

Root cause:
1. `emptySlotBorderColor` in Widget Style was dead — the widget CSS uses `--bundle-empty-state-card-border`
   for empty slot border color (same variable as Empty State). It generated no CSS variable and had no effect.
2. `emptySlotBorderStyle` in Widget Style should have generated `--bundle-empty-slot-border-style`
   (referenced in bundle-widget.css line 2829) but was missing from the CSS variables generator.

## Fix

- Removed the "Empty slot border color" color picker from `WidgetStyleSettings.tsx` — color is
  shared with Empty State → Card Border Color by design
- Added clarifying subtitle to the remaining style toggle explaining the shared color
- Added `--bundle-empty-slot-border-style` to `css-variables-generator.ts` so the dashed/solid
  toggle in Widget Style now actually applies to empty slot cards in the storefront

## Progress Log

### 2026-03-24 18:55 - Completed

- ✅ Removed `emptySlotBorderColor` InlineColorInput from `WidgetStyleSettings.tsx`
- ✅ Added subtitle under "Empty Slot Card Border Style" heading
- ✅ Added `--bundle-empty-slot-border-style` emission to `css-variables-generator.ts` (line ~150)
- ✅ Linted — 0 errors

## Phases Checklist
- [x] Phase 1: Remove dead color picker from Widget Style
- [x] Phase 2: Fix CSS variables generator to emit --bundle-empty-slot-border-style
- [x] Phase 3: Lint + commit
