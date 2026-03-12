# Issue: Theme Editor UX Fixes

**Issue ID:** theme-editor-ux-fixes-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-12
**Last Updated:** 2026-03-13 10:00

## Overview

Two theme editor UX issues:
1. **Wrong product in theme editor** — "Open in Theme Editor" button takes merchant to a random/default product instead of the configured bundle product.
2. **Widget block position** — Bundle widget is currently a section-type block (appears as a standalone section below the product). Changing it to an app block allows embedding *inside* the product section (under the title/price area).

## Root Cause

**Issue 1:** Theme editor URL is missing the `previewPath` query parameter. Without it, Shopify opens the editor on a default product (usually the most recently viewed or a demo product). The correct parameter is `previewPath=/products/{productHandle}`.

**Issue 2:** The liquid schema has `"target": "section"` making it a standalone section. App blocks (without `"target": "section"`) can be embedded within existing sections that declare `"type": "@app"` support (all modern Shopify themes support this in their product section).

## Progress Log

### 2026-03-12 18:31 - Starting implementation

- Files to change:
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — add `previewPath` to secondary action URL and `handlePageSelection` URL
  - `extensions/bundle-builder/blocks/bundle-product-page.liquid` — remove `"target": "section"` to enable app block embedding
  - `extensions/bundle-builder/shopify.extension.toml` — confirm toml target stays `all`
- Expected outcome: Theme editor opens on the correct bundle product; widget can be placed inside the product section near the title

### 2026-03-12 18:35 - Completed implementation

- ✅ Added `previewPath=/products/{productHandle}` to secondary action URL
- ✅ Added `previewPath=/products/{productHandle}` to `handlePageSelection` URL
- ✅ Changed deep link `target` from `newAppsSection` to `mainSection` (both URLs)
- ✅ Removed `"target": "section"` from liquid schema — block is now an app block
- Files modified:
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
  - `extensions/bundle-builder/blocks/bundle-product-page.liquid`
- Next: shopify app deploy required for liquid schema change to take effect

### 2026-03-13 10:00 - Fix: Save shopifyProductHandle to DB + correct deep link target

- Root cause identified: save handler only wrote `shopifyProductId` to DB, never `shopifyProductHandle`. When `bundleProduct` GraphQL fetch fails at loader time, `bundle.shopifyProductHandle` fallback was also null → `previewPath` param was empty → theme editor opened on wrong product
- ✅ `handlers.server.ts` — now also selects and saves `shopifyProductHandle` alongside `shopifyProductId`
- ✅ `route.tsx` — changed deep link from `target=mainSection` to `target=newAppsSection` (correct for section-type blocks with `"target": "section"`)
- Files modified:
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

### 2026-03-12 20:15 - Fix: Restore required `target` field in liquid schema

- ❌ Removing `"target": "section"` caused Shopify deploy validation error: "missing required key 'target'"
- `target` is a required field in Shopify block schemas — it cannot be omitted
- ✅ Restored `"target": "section"` in `bundle-product-page.liquid`
- The `target=mainSection` deep link still attempts to place the block in the main product section for themes that support `@app` blocks (e.g. Dawn), which is the desired behaviour

## Phases Checklist

- [x] Phase 1: Fix previewPath in theme editor URLs
- [x] Phase 2: Keep block as section-type (target required by Shopify), use mainSection deep link
- [x] Phase 3: Fix — also changed deep link to `target=newAppsSection` (correct for section-type blocks); also save `shopifyProductHandle` to DB in save handler so previewPath fallback is always populated
- [ ] Phase 4: Deploy with shopify app deploy
