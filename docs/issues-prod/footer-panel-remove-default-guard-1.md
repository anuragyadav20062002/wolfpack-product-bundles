# Issue: Footer Panel Trash Icon Shown for Default (Mandatory) Items

**Issue ID:** footer-panel-remove-default-guard-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24

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

## Progress Log

### 2026-03-24 - Implementing fix

- File: `app/assets/bundle-widget-full-page.js`
- Change: wrap trash button + remove listener in `if (!item.isDefault)`
- Rebuild widget bundles after change

## Phases Checklist
- [x] Add `isDefault` guard in `_createFooterPanel`
- [x] Rebuild widget bundles (FPB: 249.6 KB)
- [ ] Verify default items show no trash icon in footer panel (manual, post-deploy)
