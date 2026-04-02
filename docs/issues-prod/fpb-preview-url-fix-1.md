# Issue: FPB Preview Page - shareablePreviewUrl Removed in API 2025-10

**Issue ID:** fpb-preview-url-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 12:30

## Overview
Shopify removed `shareablePreviewUrl` from the `Page` type in Admin API 2025-10.
The FPB preview flow requests this field in `pageCreate` mutation and `getPreviewPageUrl` query,
causing a `userErrors` response: "Field 'shareablePreviewUrl' doesn't exist on type 'Page'".
This surfaces as a toast error when the merchant clicks "Preview on Storefront".

## Root Cause
- `shareablePreviewUrl` was a Shopify-managed preview URL for unpublished (draft) pages
- It no longer exists in API 2025-10 — confirmed via GraphQL schema introspection
- Without it, there is no way to get a preview URL for a draft page

## Fix Strategy
Since `shareablePreviewUrl` is gone, create preview pages as `isPublished: true`.
The preview URL becomes `https://{shop}/pages/{handle}` — a standard public page URL.
The `publishPreviewPage` flow (Place Widget Now) already calls `pageUpdate(isPublished: true)`,
which is idempotent for already-published pages.

## Files Changed
- `app/services/widget-installation/widget-full-page-bundle.server.ts`
- `app/services/widget-installation/types.ts`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

## Progress Log

### 2026-04-02 12:30 - Completed fix
- ✅ Removed `shareablePreviewUrl` from `CREATE_PAGE` mutation return fields
- ✅ Updated `getPreviewPageUrl`: accepts `shopDomain`, queries `handle`, returns constructed URL `https://{shop}.myshopify.com/pages/{handle}`
- ✅ Changed `isPublished: false` → `true` in `handleCreatePreviewPage` (draft pages have no accessible URL in 2025-10)
- ✅ Removed `shareablePreviewUrl` from `FullPageBundleResult` type
- ✅ `createFullPageBundle` now always returns `pageUrl` (no conditional on `isPublished`)
- ✅ Handler returns `shareablePreviewUrl: result.pageUrl` to keep client JSON key unchanged
- ✅ 0 ESLint errors

## Phases Checklist
- [x] Identify root cause via schema introspection
- [x] Apply code fixes
- [x] Lint modified files
- [x] Commit
