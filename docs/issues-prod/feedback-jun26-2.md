# Issue: Preview Button Visible on All Wizard Steps

**Issue ID:** feedback-jun26-2
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

In the CREATE wizard (`/app/bundles/create/configure/{id}`), the Preview button is rendered only inside `StepSummary` on Step 02 (Configuration). Steps 03 (Pricing), 04 (Assets), and 05 (Pricing Tiers) have no Preview button — merchants would have to leave the page or navigate back to Step 02 to preview.

Also: the existing onPreview handler in the CREATE wizard sets a localStorage flag and shows a toast but **does not actually open the bundle preview**. We need a real handler.

## Approach

1. Add `shop`, `shopifyProductHandle`, `shopifyPageHandle`, `themeEditorUrl` to the loader return.
2. Add a `handleWizardPreview` callback in the component:
   - If `!appEmbedEnabled` and `themeEditorUrl` exists: open the theme editor in a new tab + toast guidance. (The richer modal flow lands in commit #10.)
   - Else for `bundleType === "product_page"`: open `https://{shop}/products/{handle}` if handle known; toast error otherwise.
   - Else for `bundleType === "full_page"`: open `https://{shop}/apps/product-bundles/wpb/{bundle.id}` (the app-proxy route).
3. Render a `<s-button variant="primary" icon="view">Preview</s-button>` next to Back/Next inside the `.wizardFooter` for each of the 4 wizardStep branches. Keep the existing StepSummary Preview button as a secondary entry point on Step 02.

## Files Changed

- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
  - Loader: expose handles + `themeEditorUrl` + `appEmbedEnabled` (already in `readiness`, surface to component scope).
  - Component: `handleWizardPreview` callback + Preview button in each `.wizardFooter` (4 places).

## Tests

- `tests/unit/lib/wizard-preview-url.test.ts` — pure URL-builder function `buildWizardPreviewUrl({ shop, bundleId, bundleType, productHandle, pageHandle })`.
- `tests/unit/routes/create-bundle-wizard-preview-ui-contract.test.ts` — read the route TSX source and assert: (a) all four `<div className={styles.wizardFooter}>` blocks reference `handleWizardPreview` and a "Preview" label, (b) loader return JSON contains `shop`, `themeEditorUrl`.

## Phases Checklist

- [x] Phase 1: Extract `buildWizardPreviewUrl` helper + unit tests
- [x] Phase 2: Add UI contract test asserting Preview button in each of 4 wizardFooter blocks
- [x] Phase 3: Loader changes (add handles + themeEditorUrl) + handler + JSX
- [x] Phase 4: Lint + tests green
- [x] Phase 5: Commit

**Status:** Completed

## Progress Log

### 2026-05-29 — Implementation complete
- Added `app/lib/wizard-preview-url.ts` — pure helper returning a discriminated union (`{kind:"url"} | {kind:"error"}`). 6 unit tests cover FPB app-proxy URL, PPB product URL, missing-handle error path, and shop normalization (https://, trailing slash).
- Updated loader to compute `themeEditorUrl` (same pattern as dashboard) and expose `bundle.shopifyProductHandle` + `bundle.shopifyPageHandle`.
- Added `handleWizardPreview` callback gated on `readiness.appEmbedEnabled`: when disabled it opens `themeEditorUrl` + toasts; when enabled it builds the URL via the helper and opens it.
- Replaced the legacy `onPreview` placeholder in StepSummary so it now calls `handleWizardPreview` (Step 02 sidebar still has its own Preview button — secondary entry point).
- Added a `<s-button variant="secondary" icon="view">Preview</s-button>` next to Back/Next in each of the four wizard footer blocks (wizardStep 1..4).
- UI contract test asserts: loader exposes shop / themeEditorUrl / handles; route imports the helper; handler exists; gated on `appEmbedEnabled`; every `.wizardFooter` block wires Back + Preview + Next; legacy placeholder is gone.
- All 6 helper tests + 6 UI contract tests + 10 prior footer tests green (22/22).

### 2026-05-29 — Starting implementation
- Created issue file. Next: write helper + tests, then wire UI.
