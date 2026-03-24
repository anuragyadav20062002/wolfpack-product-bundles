# Issue: DCP Storefront Iframe Preview — Sub-Plan 3: PDP Preview URL

**Issue ID:** dcp-iframe-preview-3
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24

## Overview

Wire the PDP DCP modal to show the storefront iframe after save.

The DCP loader queries Shopify Admin GraphQL for the first published product handle, then passes
`https://{shop}/products/{handle}?view=product-page-bundle` as `previewUrls.pdp` to the component.
The `product.product-page-bundle` template (added in Sub-Plan 2) ensures the bundle widget block is
always present regardless of bundle configuration.

## Changes

### 1. `app/routes/app/app.design-control-panel/route.tsx`
- Loader: destructure `admin` from `authenticate.admin(request)`
- Add `FIRST_PRODUCT_QUERY` GraphQL query
- Construct `pdpPreviewUrl`
- Return `previewUrls: { pdp: pdpPreviewUrl, fpb: null }` from loader
- Pass `previewUrls.pdp` to PDP `<PreviewPanel>`

## Progress Log

### 2026-03-24 - Implemented and committed

- ✅ Destructured `admin` from `authenticate.admin(request)` in loader
- ✅ Added `FIRST_PRODUCT_QUERY` — queries first active product handle via Admin GraphQL
- ✅ Parallelised the three loader awaits with `Promise.all` (no extra latency)
- ✅ Constructed `pdpPreviewUrl = https://{shop}/products/{handle}?view=product-page-bundle`
- ✅ Returned `previewUrls: { pdp: pdpPreviewUrl, fpb: null }` from loader
- ✅ Destructured `previewUrls` in the component
- ✅ Passed `previewUrls.pdp` to PDP `<PreviewPanel>` (was `null`)
- ✅ 0 ESLint errors
- Files changed:
  - `app/routes/app/app.design-control-panel/route.tsx`

## Phases Checklist

- [x] Add Admin GraphQL query for first product to loader
- [x] Return `previewUrls.pdp` from loader
- [x] Pass `previewUrls.pdp` to PDP PreviewPanel
- [x] Lint + commit
