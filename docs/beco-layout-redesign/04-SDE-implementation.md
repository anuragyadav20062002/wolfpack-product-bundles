# SDE Implementation Plan: Beco BYOB Expandable Floating Footer

## Overview

Rewrites `renderFullPageFooter()` in `bundle-widget-full-page.js` to produce a compact sticky
bar + upward-expanding product-list panel (Beco BYOB style). Adds accompanying CSS.
No server changes. `WIDGET_VERSION` bumped 1.6.0 → 1.7.0.

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/assets/fpb-footer-expandable.test.js` | 15 footer behaviours | Pending |

## Phase 1: Tests (Red)

Write all 15 tests first against a stub `renderFullPageFooter()` that does nothing.

Test file: `tests/unit/assets/fpb-footer-expandable.test.js`

Tests:
1. Footer hidden when 0 products selected
2. Footer visible (display: block) when ≥ 1 product selected
3. Thumbnail strip renders up to 3 images
4. Thumbnail strip shows "+N" overflow badge when > 3 selected
5. "X/Y Products" text matches selected/required counts
6. Clicking toggle adds `is-open` to footer
7. Clicking toggle again removes `is-open`
8. Clicking backdrop removes `is-open`
9. Chevron SVG present in toggle button
10. Deal callout visible when discountInfo.hasDiscount = true
11. Deal callout hidden when discountInfo.hasDiscount = false
12. Each panel item shows product name and formatted price × qty
13. Clicking panel remove button calls deselectProduct() with correct productId
14. Discount badge shown when hasDiscount = true and savings > 0
15. Footer stays hidden when layout = 'footer_side'

## Phase 2: Implementation (Green)

### Step 2.1 — Rewrite `renderFullPageFooter()` in `bundle-widget-full-page.js`

Replace entire method body. Extract three helpers:
- `createFooterBar(allSelectedProducts, totalQuantity, finalPrice, totalPrice, discountInfo, currencyInfo, isLastStep, canProceed)` → returns `.footer-bar` div
- `createFooterPanel(allSelectedProducts, currencyInfo, discountInfo, discountMessage)` → returns `.footer-panel` div
- `createFooterPanelItem(item, currencyInfo)` → returns `<li>` for each product

Add `toggleFooterPanel()` method: toggles `is-open` on `this.elements.footer`.

Thumbnail strip: `getAllSelectedProductsData()` already returns array; slice first 3 for strip,
remainder count for overflow badge.

Remove logic in panel item: call `this.deselectProduct(item.productId, item.variantId)` then
re-render via `this.renderFooter()`.

### Step 2.2 — CSS in `bundle-widget-full-page.css`

Add new selectors under a `/* === Beco-Style Expandable Footer === */` comment block:
- `.full-page-footer.beco-style` — fixed positioning, z-index: 1000
- `.footer-bar` — flex row, 72px height, gap, padding
- `.footer-thumbstrip` — flex, items overlap
- `.footer-thumbstrip img` — 36×36, border-radius, object-fit: cover
- `.footer-thumbstrip-overflow` — circular badge
- `.footer-toggle` — text button, flex, gap for chevron
- `.footer-chevron` — transition: transform 200ms
- `.is-open .footer-chevron` — rotate(180deg)
- `.footer-total` — flex col
- `.footer-discount-badge` — pill, green bg
- `.footer-cta-btn` — primary button, full bar height
- `.footer-back-btn` — ghost button, left
- `.footer-panel` — max-height 0 → 60vh transition
- `.is-open .footer-panel` — max-height 60vh, opacity 1
- `.footer-callout-banner` — green bg, white text, padding
- `.footer-panel-list` — no list-style, margin 0, padding 0
- `.footer-panel-item` — flex row, align-center, gap, padding, border-bottom
- `.footer-panel-thumb` — 48×48, object-fit: cover, border-radius 4px
- `.footer-panel-info` — flex col, flex-grow 1
- `.footer-panel-remove` — icon button, muted color

Retain all old selectors (`.footer-progress-section`, `.footer-products-tiles-wrapper`, etc.)
to avoid breaking DCP variable lookups.

### Step 2.3 — Bump WIDGET_VERSION

In `scripts/build-widget-bundles.js`: `'1.6.0'` → `'1.7.0'`

## Build & Verification Checklist

- [ ] 15 new tests pass
- [ ] No regressions in existing tests
- [ ] `npm run build:widgets` — bundled files updated
- [ ] TypeScript clean (no server changes, so N/A)
- [ ] Lint: zero errors on modified JS files
- [ ] Manual: add 2 products, see bar; click toggle, see panel; click trash, see product removed; click backdrop, panel closes

## Rollback Notes

Revert `renderFullPageFooter()` to previous body and remove `.beco-style` CSS block.
Old selectors are never removed so CSS rollback is just the new block removal.
