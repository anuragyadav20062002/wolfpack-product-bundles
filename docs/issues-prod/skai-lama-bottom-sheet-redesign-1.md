# Issue: Skai Lama Bottom-Sheet Redesign — Product-Page Bundle Widget

**Issue ID:** skai-lama-bottom-sheet-redesign-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 22:00

## Overview

Transform the product-page bundle widget from a vertical accordion to a Skai Lama–style bottom-sheet modal UX with auto-step progression, empty slot cards, and discount badges. Gated behind `widgetStyle: 'bottom-sheet'` — classic mode fully preserved for existing merchants.

## Feature Pipeline Docs
- `docs/skai-lama-bottom-sheet-redesign/00-BR.md`
- `docs/skai-lama-bottom-sheet-redesign/02-PO-requirements.md`
- `docs/skai-lama-bottom-sheet-redesign/03-architecture.md`
- `docs/skai-lama-bottom-sheet-redesign/04-SDE-implementation.md`

## Phases Checklist

- [x] Phase 1: Tests for pure helper functions ✅ Completed
- [x] Phase 2: Widget JS — BottomSheetModal + slot cards + auto-progression ✅ Completed
- [x] Phase 3: Widget CSS — bottom-sheet panel + slot card styles ✅ Completed
- [x] Phase 4: DCP types + WidgetStyleSettings component ✅ Completed
- [x] Phase 5: DCP preview update ✅ Completed
- [x] Phase 6: Build + lint + commit ✅ Completed

## Progress Log

### 2026-03-17 18:00 - Planning Complete, Starting Phase 1
- ✅ Feature pipeline complete (BR → PO → Architecture → SDE plan)
- ✅ Skai Lama analysis: `docs/skai-lama-analysis/findings.md` (19 screenshots)
- ✅ Architecture: BottomSheetModal reuses existing modal DOM structure; `widgetStyle` gates behavior; 3 net-new CSS variables only
- Will modify: `app/assets/bundle-widget-product-page.js`, `extensions/bundle-builder/assets/bundle-widget.css`, DCP types + settings + preview
- Next: Phase 1 — write failing tests for helper functions

### 2026-03-17 22:00 - All Phases Completed

**Total Commits:** 1 (this commit)
**Lines Added:** ~650 (widget JS ~295, CSS ~170, tests ~140, DCP ~50, preview ~75)
**Files Created:** 4 (`bundle-bottom-sheet.test.ts`, `WidgetStyleSettings.tsx`, issue file, SDE plan)
**Files Modified:** 7

#### Phase 1 — Tests ✅
- ✅ `tests/unit/assets/bundle-bottom-sheet.test.ts` (18 tests, all pass)
- Tests: `bsFindNextIncompleteStep` (7), `bsIsDefaultStep` (5), `bsGetDiscountBadgeLabel` (6)

#### Phase 2 — Widget JS ✅
- ✅ `app/assets/bundle-widget-product-page.js` — added helper functions + `window.__bsHelpers`, `ensureBottomSheet()`, `_autoProgressBottomSheet()`, `_createBottomSheetOverlay()`, slot card rendering, openModal/closeModal branching, Escape key handling
- ✅ `scripts/build-widget-bundles.js` — version bumped 1.4.1 → 1.5.0 (MINOR: new feature)

#### Phase 3 — Widget CSS ✅
- ✅ `extensions/bundle-builder/assets/bundle-widget.css` — ~170 lines: `.bw-bs-overlay`, `.bw-bs-panel` (slide-up 0→765px), responsive product grid (5-col → 3-col → 2-col), `.bw-slot-card--empty` (dashed border), `.bw-slot-card--filled` (solid border), `.bw-slot-discount-badge`

#### Phase 4 — DCP Types + Settings ✅
- ✅ `app/components/design-control-panel/types.ts` — added `widgetStyle?`, `bottomSheetOverlayOpacity?`, `bottomSheetAnimationDuration?`, `emptySlotBorderStyle?`, `emptySlotBorderColor?`
- ✅ `app/services/bundles/metafield-sync/types.ts` — added `widgetStyle?` to `BundleUiConfig`; `isDefault?`, `defaultVariantId?`, `discountBadgeLabel?`, `categoryImageUrl?` to `BundleUiStep`
- ✅ `app/components/design-control-panel/settings/WidgetStyleSettings.tsx` — new DCP settings component
- ✅ `app/components/design-control-panel/settings/SettingsPanel.tsx` — added `widgetStyle` case

#### Phase 5 — DCP Preview ✅
- ✅ `app/components/design-control-panel/preview/ProductCardPreview.tsx` — added `widgetStyle` sub-section showing empty/filled slot cards with discount badge

#### Phase 6 — Build + Lint ✅
- ✅ `npm run build:widgets` — success (product-page bundle: 136.5 KB, full-page: 222.3 KB)
- ✅ ESLint — 0 errors, 3 pre-existing warnings only
- ✅ Jest — 18/18 tests pass
- ✅ `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` (rebuilt)
- ✅ `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuilt)

#### Key Achievements:
- ✅ Backward-compatible: `widgetStyle` absent = `'classic'`, zero change for existing merchants
- ✅ Bottom-sheet modal reuses all existing modal rendering code (no duplication)
- ✅ Auto-step progression: advances to next incomplete step (300ms), closes when all done (500ms)
- ✅ Default steps: pre-filled from `defaultVariantId`, no × remove button, not in modal tabs
- ✅ Discount badges: shown on filled inline cards when `discountBadgeLabel` set
- ✅ DCP controls: overlay opacity, animation duration, border style/color — all CSS-variable-driven
- ✅ 3 net-new CSS variables only; ~10 existing variables reused

**Status:** Ready for testing and review
