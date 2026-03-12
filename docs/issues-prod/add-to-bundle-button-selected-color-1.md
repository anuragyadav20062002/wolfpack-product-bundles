# Issue: "Add to Bundle" Button Selected-State Colour DCP Control

**Issue ID:** add-to-bundle-button-selected-color-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-12
**Last Updated:** 2026-03-12 20:00

## Overview

Allow merchants to customise the background and text colour of the "Add to Bundle" / "Add to Box" button after a product has been selected, via the Design Control Panel. Currently hardcoded to `#10B981` (green).

## Progress Log

### 2026-03-12 18:45 - Starting implementation

- Feature pipeline completed: BR → PO → Architect → SDE plan
- Docs: `docs/add-to-bundle-button-selected-color/`
- Starting Phase 1: types, defaults, CSS generator (TDD)

### 2026-03-12 20:00 - Completed all 4 phases

**Phase 1 — Types + defaults + CSS generator (TDD):**
- ✅ Added `buttonAddedBgColor` + `buttonAddedTextColor` to `app/components/design-control-panel/types.ts`
- ✅ Added defaults `#10B981` / `#FFFFFF` to `PRODUCT_PAGE_DEFAULTS` + `FULL_PAGE_DEFAULTS` in `defaultSettings.ts`
- ✅ Added `--bundle-button-added-bg` + `--bundle-button-added-text` CSS vars to `css-variables-generator.ts`
- ✅ TDD: 7 tests written first (Red), all pass after implementation (Green)

**Phase 2 — CSS files:**
- ✅ `bundle-widget.css` `.product-add-btn.added` → uses `var(--bundle-button-added-bg, #10B981)` + `var(--bundle-button-added-text, #FFFFFF)`
- ✅ `bundle-widget-full-page.css` `.product-add-btn.added` → gradient preserved as fallback when no var set

**Phase 3 — Prisma:**
- ✅ `schema.prisma` `buttonAddedBgColor` + `buttonAddedTextColor` columns with DB defaults
- ✅ Migration `20260312200000_add_button_added_state_colors/migration.sql` created

**Phase 4 — DCP UI:**
- ✅ `AddedButtonStateSettings.tsx` — new settings panel with two ColorPickers
- ✅ `NavigationSidebar.tsx` — "Added State" nav item after "Button" in Product Card section
- ✅ `SettingsPanel.tsx` — `addedButtonState` case wired up
- ✅ `ProductCardPreview.tsx` — `addedButtonStateHTML` + preview block showing before/after buttons
- ✅ ESLint: zero errors (pre-existing warnings only)
- ✅ All 7 unit tests pass

## Related Documentation

- `docs/add-to-bundle-button-selected-color/00-BR.md`
- `docs/add-to-bundle-button-selected-color/02-PO-requirements.md`
- `docs/add-to-bundle-button-selected-color/03-architecture.md`
- `docs/add-to-bundle-button-selected-color/04-SDE-implementation.md`

## Phases Checklist

- [x] Phase 1: Types + defaults + CSS generator (with tests)
- [x] Phase 2: CSS files (widget.css + full-page.css)
- [x] Phase 3: Prisma schema + migration
- [x] Phase 4: DCP UI (settings + preview + navigation)
