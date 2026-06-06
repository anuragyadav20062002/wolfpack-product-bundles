# Issue: Dashboard Edit Bundle Button Opens Wrong Page

**Issue ID:** dashboard-edit-bundle-routing-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-18
**Last Updated:** 2026-05-18 18:30

## Overview

Clicking the "Edit" action button on any bundle in the dashboard was opening the bundle creation wizard instead of the edit/configure page. The bug was in `handleEditBundle` — it used `getBundleWizardConfigurePath` (which routes to `/app/bundles/create/configure/${bundleId}`) for all bundles, regardless of type.

The correct edit routes are:
- FPB: `/app/bundles/full-page-bundle/configure/${bundleId}`
- PPB: `/app/bundles/product-page-bundle/configure/${bundleId}`

The dashboard loader already fetches `bundleType` for each bundle, so no data-fetching change was needed.

## Progress Log

### 2026-05-18 18:30 - Fixed

- Added `getBundleEditPath(bundleId, bundleType)` to `app/lib/bundle-navigation.ts`
- Updated `handleEditBundle` in `app/routes/app/app.dashboard/route.tsx` to call `getBundleEditPath` instead of `getBundleWizardConfigurePath`
- 889 unit tests passing, 0 ESLint errors

## Files Changed
- Modified: `app/lib/bundle-navigation.ts`
- Modified: `app/routes/app/app.dashboard/route.tsx`

## Phases Checklist
- [x] Fix `handleEditBundle` to navigate to type-specific edit URL
- [x] All tests pass
