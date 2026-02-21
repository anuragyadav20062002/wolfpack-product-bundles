# Issue: Promo Banner API Fields Missing from Bundle JSON Endpoint

**Issue ID:** promo-banner-api-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-21
**Last Updated:** 2026-02-21 02:05

## Overview

`promoBannerBgImage` and `promoBannerBgImageCrop` are correctly saved to the database
and queried in the bundle API endpoint, but they are NOT included in the `formattedBundle`
response object. As a result the widget never receives the image URL and the promo banner
background image never renders on the storefront.

## Progress Log

### 2026-02-21 02:00 - Starting Fix

- Root cause: `api.bundle.$bundleId[.]json.tsx` lines 380–505 build `formattedBundle`
  but omit `promoBannerBgImage` and `promoBannerBgImageCrop`
- The Prisma `findFirst` query (line 162) implicitly selects all scalar fields so the
  data IS present on `bundle` — it just needs to be mapped to the response object
- Fix: add both fields to `formattedBundle` (after `shopifyProductId`, before `steps`)

Files to modify:
- `app/routes/api/api.bundle.$bundleId[.]json.tsx`

### 2026-02-21 02:05 - Fix Applied and Committed

- ✅ Added `promoBannerBgImage: bundle.promoBannerBgImage ?? null` to `formattedBundle`
- ✅ Added `promoBannerBgImageCrop: bundle.promoBannerBgImageCrop ?? null` to `formattedBundle`
- ✅ 0 ESLint errors (109 pre-existing warnings)
- Files modified: `app/routes/api/api.bundle.$bundleId[.]json.tsx`

## Phases Checklist

- [x] Fix: add `promoBannerBgImage` + `promoBannerBgImageCrop` to `formattedBundle`
- [x] Lint modified file
- [x] Commit
