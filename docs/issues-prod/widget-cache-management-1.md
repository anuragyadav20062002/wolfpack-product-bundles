# Issue: Widget Asset Cache Management

**Issue ID:** widget-cache-management-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-01
**Last Updated:** 2026-03-01 11:00

## Overview

Ensure widget JS changes are always reflected on the storefront after deployment.
Add version tracking to bundled output so developers can verify which build is live.

## Research Findings (Shopify Docs + Community)

1. `asset_url` Liquid filter automatically appends `?v=HASH` — this IS the CDN cache key.
   Only Shopify's own `v=` param is on the CDN's cache-busting allowlist; custom query
   params (e.g., `?timestamp=`) will NOT bust the CDN cache.

2. `shopify app deploy` creates a new app-version snapshot → Shopify regenerates the
   `v=HASH` for all extension assets → CDN serves fresh files. This is the ONLY way to
   force the CDN to serve updated assets.

3. The `asset_url` calls in both Liquid blocks are already correct per Shopify docs.

4. Propagation delay after `shopify app deploy` is 2-10 minutes (documented/expected).

5. There is no file-level content-hash fingerprinting — versioning is at the app-version
   level (per deploy).

## Root Cause of Confusion

No way to verify in the browser console which widget version is actually running.
If a merchant reports a bug, it's impossible to know whether they are on the latest build.
No documented rule about incrementing version before deploy.

## Files to Modify

- `scripts/build-widget-bundles.js` — Embed version banner + window.__BUNDLE_WIDGET_VERSION__
- `CLAUDE.md` — Add widget versioning rule and deploy workflow

## Progress Log

### 2026-03-01 11:00 - Research complete, implementing
- ✅ Confirmed asset_url is already correctly used in both Liquid blocks
- ✅ Confirmed custom query params don't bust CDN cache
- ✅ Confirmed shopify app deploy is the required mechanism
- Implementing: version constant in build script + CLAUDE.md rule

### 2026-03-01 11:30 - Completed
- ✅ Added WIDGET_VERSION constant to build-widget-bundles.js
- ✅ Bundled output now includes version banner + window.__BUNDLE_WIDGET_VERSION__
- ✅ CLAUDE.md updated with widget versioning rule + console verification instructions

## Phases Checklist

- [x] Phase 1: Research Shopify CDN cache behavior ✅
- [x] Phase 2: Embed version in build script output ✅
- [x] Phase 3: Add CLAUDE.md widget versioning rule ✅
- [x] Phase 4: Commit ✅
