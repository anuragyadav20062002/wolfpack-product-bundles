# Issue: Unlisted Bundle API Fix

**Issue ID:** unlisted-bundle-api-fix-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 15:00

## Overview
Bundles set to "Unlisted (Ad Campaigns)" were excluded from the storefront bundle API
(`api.bundle.$bundleId.json`). This meant Stage 2 (API fallback) would return 404 for
unlisted bundles, breaking the widget if the metafield cache (Stage 1) was absent.

The widget's Stage 1 metafield cache masks this in the common case, but fails on:
- First use before any sync has written the metafield
- Post-sync-clear scenarios
- Any situation where `data-bundle-config` is absent or malformed

## Fix
Add `BundleStatus.UNLISTED` to the allowed statuses in `api.bundle.$bundleId.json.tsx`.

The API is protected by App Proxy HMAC verification + shop ownership check + UUID bundle
ID — serving unlisted bundles via the API does not expose them to organic discovery.
This is consistent with Shopify's own definition of UNLISTED: hidden from
search/collections/sitemap but accessible via direct URL.

## Progress Log

### 2026-04-02 15:00 - Applied fix
- ✅ Added `BundleStatus.UNLISTED` to allowed statuses in bundle API query
- ✅ Updated comment to reflect new intent
- ✅ Lint: 0 errors
- ✅ Committed

## Files Changed
- `app/routes/api/api.bundle.$bundleId[.]json.tsx`

## Phases Checklist
- [x] Apply one-line fix
- [x] Lint
- [x] Commit
