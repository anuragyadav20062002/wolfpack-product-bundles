# Issue: Cache-Busting for Widget API + Page Layout UI Fix

**Issue ID:** cache-bust-layout-ui-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-01
**Last Updated:** 2026-03-01 15:00

## Overview

Two fixes:
1. Storefront widget changes (e.g. footer layout switch) not reflected immediately due to
   aggressive cache headers (`max-age=300, s-maxage=600`) on the bundle API endpoint.
2. Page Layout selector cards in full-page configure route have cramped padding/margins
   and undersized SVG illustrations.

## Progress Log

### 2026-03-01 15:00 - Completed Both Fixes

#### Cache Strategy Fix
- Reverted `?v=${Date.now()}` (defeated caching entirely, excessive server load)
- Reduced API cache headers from `max-age=300, s-maxage=600` (5min/10min) to
  `max-age=10, s-maxage=30, stale-while-revalidate=300` (10s/30s + 5min SWR)
- Changes now appear within ~30s; CDN still absorbs traffic efficiently
- `stale-while-revalidate` means visitors never see slow responses — CDN serves
  stale data instantly while fetching fresh data in the background

#### Page Layout UI Fix
- Increased card padding from `12px` to `20px 16px`
- Increased border radius from `8px` to `12px`
- Increased SVG illustrations from `120x80` to `140x96`
- Increased gap between cards from `300` to `400`
- Increased gap between SVG and text from `200` to `300`
- Changed title text variant from `bodySm` to `bodyMd` for better hierarchy
- Rebuilt widget bundle

### Files Modified
- `app/assets/bundle-widget-full-page.js` — Cache-busting query param on API URL
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — Rebuilt bundle
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — Layout card UI improvements

## Phases Checklist
- [x] Add cache-busting to widget API fetch
- [x] Fix Page Layout card padding/margins
- [x] Rebuild widget bundle
- [x] Lint
- [x] Commit
