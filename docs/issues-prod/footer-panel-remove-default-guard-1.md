# Issue: Footer Panel Trash Icon Shown for Default (Mandatory) Items

**Issue ID:** footer-panel-remove-default-guard-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24 (non-critical fixes applied)

## Overview

An audit of the floating footer trash-icon remove flow found that the core
remove functionality works correctly — clicking the trash icon removes the product,
re-renders the footer, restores the product card to unselected state, and shows an
undo toast with a 5-second window.

However, `_createFooterPanel` renders a trash icon for every item in
`allSelectedProducts` without filtering out `isDefault` items. Default steps are
merchant-configured mandatory products that should always stay in the bundle. The
sidebar layout correctly guards against this with `if (!item.isDefault)` before
rendering the remove button. The footer panel is missing this same guard, allowing
customers to accidentally remove mandatory items via the footer trash icon.

## Root Cause

`_createFooterPanel` (line ~2154) iterates all selected products and renders a
trash icon + event listener for each, with no check on `item.isDefault`. Contrast
with the sidebar's `renderSidePanel` (line ~1135) which gates the remove button:

```js
// Sidebar — correct:
if (!item.isDefault) {
  const removeBtn = document.createElement('button');
  // ...
}

// Footer panel — MISSING guard:
allSelectedProducts.forEach(item => {
  li.innerHTML = `...
    <button class="footer-panel-remove" ...>  // shown for ALL items
  `;
```

## Fix

Move the trash button HTML and its event listener inside an `if (!item.isDefault)`
guard in `_createFooterPanel`, matching the sidebar behaviour.

## Non-Critical Findings (from audit)

### Finding 1 — Dead code: `createFooterProductTiles`

`createFooterProductTiles` (~line 2289) was a fully-built alternative footer tile
component with its own remove handler. It was never called anywhere in the codebase.
Deleted in full.

### Finding 2 — `_refreshSiblingDimState` wrong-step DOM update

`_refreshSiblingDimState(stepIndex)` queried
`this.container.querySelector('.product-grid .product-card')` which always finds the
currently visible step's grid. When a product is removed via the footer panel while the
user is viewing a different step, the method would apply the wrong step's capacity check
to the visible grid's cards.

Fix: added `if (stepIndex !== this.currentStepIndex) return;` as the first guard.
When the user navigates to the affected step, `createFullPageProductGrid` renders the
correct dim state from scratch.

## Progress Log

### 2026-03-24 - Implementing fix

- File: `app/assets/bundle-widget-full-page.js`
- Change: wrap trash button + remove listener in `if (!item.isDefault)`
- Rebuild widget bundles after change

### 2026-03-24 - Non-critical fixes applied

- Finding 1: Deleted dead `createFooterProductTiles` method entirely
- Finding 2: Added `if (stepIndex !== this.currentStepIndex) return;` guard to
  `_refreshSiblingDimState` to prevent wrong-step DOM mutation on cross-step removes
- Rebuilt FPB bundle: 247.0 KB

## Phases Checklist
- [x] Add `isDefault` guard in `_createFooterPanel`
- [x] Delete dead `createFooterProductTiles` method
- [x] Fix `_refreshSiblingDimState` cross-step guard
- [x] Rebuild widget bundles (FPB: 247.0 KB)
- [ ] Verify default items show no trash icon in footer panel (manual, post-deploy)
