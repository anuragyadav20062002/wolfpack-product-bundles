# Issue: PDP Widget — Wrong Placement & Wrong Product in Theme Editor

**Issue ID:** pdp-widget-placement-theme-editor-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-24
**Last Updated:** 2026-03-24

## Overview

Two bugs in the "Add to Storefront" flow for PDP bundles:

**Bug 1 — Wrong destination after install**
After a successful install, the app opens the storefront product page
(`onlineStorePreviewUrl`) instead of the Theme Editor. Merchants cannot see
or verify where the widget landed. If the widget is misplaced they have no
visual feedback without manually navigating to the Theme Editor.

**Bug 2 — Wrong block placement in template**
`buildProductBundleTemplate()` appends a brand-new `apps` section at the end
of `product.product-page-bundle.json`. This places the widget below Related
Products, Share, Description — anywhere but after Buy Buttons where merchants
expect it. The correct placement is inside the `main-product` section,
immediately after the `buy-buttons` block (fallback: after `title`).

## Root Cause

**Bug 1:** `installFetcher` success handler (route.tsx ~line 647) opens
`bundleProduct.onlineStorePreviewUrl`, not the Admin Theme Editor URL.

**Bug 2:** `appendBundleWidgetSection()` always adds a new top-level
`bundle_widget` `apps` section and pushes it onto `template.order`. It never
touches the existing `main-product` section's `blocks` / `block_order`.

## Fix Plan

**Fix 1:** In the `installFetcher` success handler, replace the
`open(productUrl)` call with an `open(themeEditorUrl)` call where:
  `themeEditorUrl = https://{shop}/admin/themes/current/editor?previewPath=%2Fproducts%2F{handle}&template=product.product-page-bundle`
  (`previewPath` value is URL-encoded; `template` is the Shopify alternate-template name)

**Fix 2:** Replace `buildProductBundleTemplate` with logic that:
1. Scans ALL sections for the first one containing a `buy-buttons` block
2. Falls back to finding the first section with a `title` block
3. Injects `wolfpack_bundle` block into that section's `blocks`
4. Inserts `wolfpack_bundle` key into `block_order` right after the anchor key
5. Falls back to a top-level `apps` section only if neither anchor is found
   (does NOT use section `type` — theme authors name sections differently)

## Progress Log

### 2026-03-24 - Implemented and committed

- ✅ Fix 1 (block placement): Replaced `appendBundleWidgetSection` call in
  `buildProductBundleTemplate` with logic that scans ALL sections for `buy-buttons`
  block first, then `title` block, and injects after the anchor. Added
  `findSectionAndBlockKey()` helper. Removed section-type detection entirely.
  Retains `apps`-section fallback when neither anchor is found.
- ✅ Fix 2 (theme editor redirect): Changed `installFetcher` success handler from
  `open(onlineStorePreviewUrl)` to `open(themeEditorUrl)` where:
  `themeEditorUrl = https://{shop}/admin/themes/current/editor?previewPath=/products/{handle}&template=product.product-page-bundle`
  Error fallback also opens Theme Editor (with previewPath but no custom template).
- ✅ Updated toast messages to reflect "Opening Theme Editor" instead of "Opening product page".
- ✅ Linted — 0 errors
- Files changed:
  - `app/services/widget-installation/widget-theme-template.server.ts`
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`

## Phases Checklist

- [x] Fix block placement in `buildProductBundleTemplate`
- [x] Fix success handler to open theme editor with correct product
- [x] Lint + commit
