# Issue: Skai Lama Bottom-Sheet Redesign — Product-Page Bundle Widget

**Issue ID:** skai-lama-bottom-sheet-redesign-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 23:30

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

### 2026-03-17 23:30 - Visual Redesign Pass — Skai Lama Pixel-Accurate UI

Applied a second-pass redesign to bring the bottom-sheet widget visually in line with Skai Lama Easy Bundle Builder screenshots.

#### Files modified:
- `extensions/bundle-builder/assets/bundle-widget.css` — replaced entire bottom-sheet CSS section (lines 2492–end)
- `app/assets/bundle-widget-product-page.js` — 4 targeted changes

#### CSS changes (`bundle-widget.css`):
- Panel background changed from `#ffffff` to `rgb(244, 249, 249)` (light teal wash)
- Removed `box-shadow` from panel (Skai Lama has no panel shadow)
- Header changed from `display:flex` row to `position:relative` block layout with absolute-positioned close buttons
- Added `.bw-bs-close-desktop` (SVG × icon, absolute top-right) and `.bw-bs-close-mobile` (SVG chevron-down, absolute top-center) as separate elements
- Tabs changed from horizontal scroll flex to equal-column CSS grid (`repeat(var(--bw-tab-count,3), 1fr)`); tabs now have 2px border, `#ffffff` inactive background
- Added `.bw-bs-choose-title` (24px centered "Choose X" heading below tabs)
- Added `.bw-bs-discount-bar` (16px centered discount/progress message below title)
- Body padding changed to `0 20px` with grid `padding: 16px 0 120px` (leaves room for floating footer)
- Product grid gap increased to 30px; product card scoped styles added for image height (170px), title/price sizing, and ADD button styling
- Footer changed to `position:relative; height:80px; justify-content:center` (pill layout)
- Added `.bw-bs-cart-pill` (white pill, floats `bottom:56px` above nav pill)
- Added `.bw-bs-nav-pill` (navy blue pill, centered, contains PREV/NEXT buttons)
- Added `.bw-bs-nav-btn` (white text, uppercase, flex row with SVG arrows)
- Slot card `.bw-slot-card--empty` changed from `min-height:160px` to fixed `height:200px` with background-image support
- `.bw-slot-card__placeholder` removed; replaced by `.bw-slot-card__plus-icon` (32×32 wrapper div)
- `.bw-slot-card__label` updated to 13px bold with primary button color

#### JS changes (`bundle-widget-product-page.js`):
1. `ensureBottomSheet()` — Rewrote HTML template: separate `.bw-bs-close-desktop` and `.bw-bs-close-mobile` button elements (both have `close-button` class so existing event listener still works); removed tab scroll arrows; added `.bw-bs-choose-title` and `.bw-bs-discount-bar` divs in header; footer now has `.bw-bs-cart-pill` + `.bw-bs-nav-pill` with PREV/NEXT buttons replacing the old total-pill layout
2. `createEmptyStateCard()` bottom-sheet branch — Category image applied as CSS `background-image` instead of `<img>` child; always renders SVG plus-icon overlay (`.bw-slot-card__plus-icon`) in primary button color at 50% opacity; removed `.bw-slot-card__placeholder` span
3. `renderModalTabs()` — Sets `--bw-tab-count` CSS custom property on the tabs container for equal-column grid
4. `attachEventListeners()` — PREV/NEXT buttons now wired to `navigateModal(-1)` / `navigateModal(1)` instead of being hidden; both buttons have class `modal-nav-button prev-button` / `next-button` matching existing JS selectors

#### Build + Lint:
- ✅ `npm run build:widgets` — success (product-page: 138.9 KB, full-page: 222.3 KB)
- ✅ ESLint — 0 errors on modified files
- Next: Commit source + bundled files, then `shopify app deploy`
