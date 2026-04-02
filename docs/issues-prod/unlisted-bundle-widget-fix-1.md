# Issue: Unlisted Bundle Widget & Theme Template API Bugs

**Issue ID:** unlisted-bundle-widget-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 14:20

## Overview
Two bugs blocking FPB bundles with Unlisted status from rendering:

### Bug 1: Widget rejects unlisted bundles
`BundleDataManager.selectBundle` filters by `bundle.status === 'active'` — unlisted bundles
have `status: 'unlisted'` so they are silently dropped, `selectedBundle` is null, and the
widget shows "No active bundles found for this product."

### Bug 2: `createFullPageBundle` calls `themeFilesUpsert`
`createFullPageBundle` still calls `ensureBundlePageTemplate` at Step 0, which writes
`templates/page.full-page-bundle.json` via `themeFilesUpsert`. This:
- Fails on SIT with "Access denied for themeFilesUpsert field"
- Disqualifies the app from the Built For Shopify badge (BFS)
- Is unnecessary — FPB pages are served via URL redirect, the template never renders

## Fixes
- **Bug 1**: Accept `'unlisted'` alongside `'active'` in `selectBundle` status filter
- **Bug 2**: Remove `ensureBundlePageTemplate` call + import from `createFullPageBundle`

## Progress Log

### 2026-04-02 14:20 - Completed
- ✅ Bug 1: Added `|| bundle.status === 'unlisted'` to `selectBundle` filter in `bundle-data-manager.js`
- ✅ Bug 2: Removed `ensureBundlePageTemplate` call + import from `createFullPageBundle`; replaced with explanatory comment
- ✅ Rebuilt widget bundles (`npm run build:widgets`)
- ✅ Lint: 0 errors
- ✅ Committed

## Files to Change
- `app/assets/widgets/shared/bundle-data-manager.js`
- `app/services/widget-installation/widget-full-page-bundle.server.ts`

## Phases Checklist
- [x] Fix selectBundle status filter
- [x] Remove ensureBundlePageTemplate call
- [x] Rebuild widget bundles
- [x] Lint
- [x] Commit
