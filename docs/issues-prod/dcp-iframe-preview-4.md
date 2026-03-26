# Issue: DCP Storefront Iframe Preview — Sub-Plan 4: FPB Preview URL

**Issue ID:** dcp-iframe-preview-4
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24

## Overview

Wire the FPB DCP modal to show the storefront iframe after save.

The DCP loader queries Shopify Admin GraphQL for the first published page handle, then passes
`https://{shop}/pages/{handle}?view=full-page-bundle` as `previewUrls.fpb` to the component.
A single URL covers both footer and sidebar layouts (layout is widget-level, not URL-level).

## Changes

### 1. `app/routes/app/app.design-control-panel/route.tsx`
- Add `FIRST_PAGE_QUERY` GraphQL query to loader
- Construct `fpbPreviewUrl`
- Return `previewUrls: { pdp: pdpPreviewUrl, fpb: fpbPreviewUrl }` from loader
- Pass `previewUrls.fpb` to FPB `<PreviewPanel>`

## Progress Log

### 2026-03-24 - Implemented and committed

- ✅ Added `FIRST_PAGE_QUERY` to loader alongside existing `FIRST_PRODUCT_QUERY`
- ✅ Added `pageRes` to the `Promise.all` — no extra sequential latency
- ✅ Constructed `fpbPreviewUrl = https://{shop}/pages/{handle}?view=full-page-bundle`
- ✅ Returned `previewUrls: { pdp: pdpPreviewUrl, fpb: fpbPreviewUrl }` from loader
- ✅ Passed `previewUrls.fpb` to FPB `<PreviewPanel>` (was `null`)
- ✅ 0 ESLint errors
- Files changed:
  - `app/routes/app/app.design-control-panel/route.tsx`

## Phases Checklist

- [x] Add Admin GraphQL query for first page to loader
- [x] Return `previewUrls.fpb` from loader
- [x] Pass `previewUrls.fpb` to FPB PreviewPanel
- [x] Lint + commit
