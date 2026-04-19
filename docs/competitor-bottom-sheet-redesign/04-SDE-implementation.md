# SDE Implementation Plan: Product-Page Bundle Widget — Bottom-Sheet Redesign

**Feature Name:** skai-lama-bottom-sheet-redesign
**Stage:** 4 — SDE Implementation
**Issue ID:** skai-lama-bottom-sheet-redesign-1
**Date:** 2026-03-17

---

## Overview

Transforms the product-page bundle widget to support a Skai Lama–style bottom-sheet modal UX, gated behind `widgetStyle: 'bottom-sheet'` in `bundle_ui_config`. The `'classic'` accordion is fully preserved for existing merchants.

**Key implementation approach:** The bottom-sheet panel reuses the existing modal's internal DOM structure (`.modal-header`, `.modal-tabs`, `.product-grid`, etc.) so all existing `renderModalProducts()`, `renderModalTabs()`, and tab-arrow logic work without modification. Only the animation, open/close behavior, and auto-progression are new.

---

## Files to Modify / Create

| File | Action | Phase |
|------|--------|-------|
| `tests/unit/assets/bundle-bottom-sheet.test.ts` | Create | 1 |
| `app/assets/bundle-widget-product-page.js` | Modify | 2 |
| `extensions/bundle-builder/assets/bundle-widget.css` | Modify | 3 |
| `app/services/bundles/metafield-sync/types.ts` | Modify | 4 |
| `app/components/design-control-panel/types.ts` | Modify | 4 |
| `app/components/design-control-panel/settings/WidgetStyleSettings.tsx` | Create | 4 |
| `app/components/design-control-panel/settings/SettingsPanel.tsx` | Modify | 4 |
| `app/components/design-control-panel/preview/ProductCardPreview.tsx` | Modify | 5 |
| `scripts/build-widget-bundles.js` | Modify | 6 |

---

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/assets/bundle-bottom-sheet.test.ts` | 3 pure helper functions | Phase 1 |

---

## Phase 1: Tests for Pure Helper Functions

**Tests (Red) — `tests/unit/assets/bundle-bottom-sheet.test.ts`:**

- `findNextIncompleteStep`: given steps array + selectedProducts array + validateFn + starting index → returns next incomplete non-default step index, or -1 if all complete
- `isDefaultStep`: given step with `isDefault: true` → returns true; absent/false → returns false
- `getDiscountBadgeLabel`: given step with `discountBadgeLabel: 'FREE'` → returns 'FREE'; absent → returns null

**Implementation (Green):** Implement as `window.__bsHelpers` on the widget module for testability.

---

## Phase 2: Widget JS Changes

### 2.1 — New standalone helper functions (before `BundleWidgetProductPage` class)

```javascript
function bsFindNextIncompleteStep(steps, selectedProducts, validateFn, fromIndex) {
  for (let i = fromIndex + 1; i < steps.length; i++) {
    if (!steps[i].isDefault && !validateFn(i)) return i;
  }
  return -1;
}
function bsIsDefaultStep(step) { return !!step?.isDefault; }
function bsGetDiscountBadgeLabel(step) { return step?.discountBadgeLabel || null; }
```

### 2.2 — `BundleWidgetProductPage` changes

- `selectBundle()`: set `this.widgetStyle = this.selectedBundle?.widgetStyle ?? 'classic'`
- `initializeDataStructures()`: for default steps, mark them as pre-complete
- `setupDOMElements()`: if bottom-sheet, call `ensureBottomSheet()` instead of `ensureModal()`; store overlay at `this.elements.bsOverlay`
- `ensureBottomSheet()`: creates panel with same inner structure but `.bw-bs-panel` class
- `createEmptyStateCard()`: if bottom-sheet, renders category image + dashed border slot
- `createSelectedProductCard()`: skip × if `step.isDefault`; add discount badge if `step.discountBadgeLabel`
- `openModal()`: if bottom-sheet, add `.bw-bs-panel--open` class instead of `display:block`
- `closeModal()`: if bottom-sheet, remove `.bw-bs-panel--open` class instead of `display:none`
- `updateProductSelection()`: if bottom-sheet, call `_autoProgressBottomSheet(stepIndex)` after update
- `attachEventListeners()`: if bottom-sheet, use `this.elements.bsOverlay` for overlay close; hide nav buttons

### 2.3 — Auto-progression method

```javascript
_autoProgressBottomSheet(stepIndex) {
  if (!this.validateStep(stepIndex)) return;

  const next = bsFindNextIncompleteStep(
    this.selectedBundle.steps,
    this.selectedProducts,
    (i) => this.validateStep(i),
    stepIndex
  );

  if (next === -1) {
    // All complete — close after delay
    setTimeout(() => {
      this._renderBottomSheetTabs(); // refresh tabs with checkmarks
      setTimeout(() => this.closeModal(), 500);
    }, 300);
    this.updateAddToCartButton();
  } else {
    // Advance to next tab
    this._renderBottomSheetTabs();
    setTimeout(() => this._activateBottomSheetTab(next), 300);
  }
}
```

---

## Phase 3: CSS Changes (`bundle-widget.css`)

Add at end of file:
- `.bw-bs-overlay` + `.bw-bs-overlay--open` (position: fixed, full screen, opacity transition)
- `.bw-bs-panel` + `.bw-bs-panel--open` (position: fixed, bottom:0, height transition, border-radius top)
- `.bw-bs-panel .modal-header` tab overrides (using existing `--bundle-header-tab-*` variables)
- `.bundle-slot-card-image` for category image in empty slot
- `.bw-slot-discount-badge` for inline card discount pill

---

## Phase 4: DCP Types + Settings

- `app/services/bundles/metafield-sync/types.ts`: Add `widgetStyle?`, `isDefault?`, `discountBadgeLabel?`, `categoryImageUrl?` to `BundleUiConfig` / `BundleUiStep`
- `app/components/design-control-panel/types.ts`: Add `widgetStyle?`, `bottomSheetOverlayOpacity?`, `bottomSheetAnimationDuration?`, `emptySlotBorderStyle?`, `emptySlotBorderColor?` to `DesignSettings`
- Create `WidgetStyleSettings.tsx`: toggle + conditional sub-controls
- `SettingsPanel.tsx`: add `'widgetStyle'` case

---

## Phase 5: DCP Preview Update

- `ProductCardPreview.tsx`: Add a preview case showing empty slot cards (dashed border + category image placeholder)

---

## Phase 6: Build & Verification

- [ ] All Phase 1 tests pass (`npm test`)
- [ ] No regressions in existing tests
- [ ] `npm run build:widgets` succeeds
- [ ] Widget version bumped (MINOR: 1.x.0 → 1.x+1.0)
- [ ] ESLint: zero errors on modified TS/TSX files
- [ ] Manual test: existing bundle in classic mode unchanged
- [ ] Manual test: bottom-sheet bundle → slot cards visible, modal slides up, auto-progression works

---

## Rollback Notes

`widgetStyle` absent → `'classic'` → zero behavior change for all existing merchants. To rollback, revert widget JS commit — no metafield migration needed.
