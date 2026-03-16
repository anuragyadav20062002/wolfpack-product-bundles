---
name: dcp-bundle-api-504-fix-1
description: Fix 504 gateway timeouts on design-settings and bundle API endpoints
type: project
---

# Issue: Fix 504 Gateway Timeouts on DCP and Bundle API Endpoints

**Issue ID:** dcp-bundle-api-504-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 12:00

## Overview

Two app-proxy endpoints return 504 (gateway timeout) when the Render server / DB connection is cold:
1. `GET /apps/product-bundles/api/design-settings/{shopDomain}?bundleType=full_page` — DCP CSS
2. `GET /apps/product-bundles/api/bundle/{bundleId}.json` — bundle data (blocks widget init)

The 504 causes the full-page bundle widget to fail with:
```
Bundle Widget Error: API request failed: 504
at BundleWidgetFullPage.loadBundleData
```

## Root Cause

Shopify App Proxy has a ≤30 s timeout. Render cold-starts + cold DB connections can exceed this.

## Fix Strategy

1. **Server — design-settings**: Wrap Prisma queries in `Promise.race` with 8 s timeout. On timeout, return default CSS immediately (widget still renders, just without custom styling).
2. **Widget — loadBundleData**: Add one automatic retry after 3 s delay when a 504/503 is received. Gives Render time to warm up.

## Files to Modify
1. `app/routes/api/api.design-settings.$shopDomain.tsx` — add timeout wrapper
2. `app/assets/bundle-widget-full-page.js` — add retry logic in loadBundleData
3. `scripts/build-widget-bundles.js` — version bump (PATCH)

## Phases Checklist

- [x] Phase 1: Server — design-settings timeout ✅
- [x] Phase 2: Widget — loadBundleData retry + version bump + build ✅
- [x] Phase 3: Lint, tests, commit ✅

## Progress Log

### 2026-03-17 12:00 - Planning Complete
- ✅ Identified root cause: cold Render / DB connection exceeds Shopify App Proxy timeout
- ✅ Identified two affected endpoints
- Next: Phase 1 — server-side timeout on design-settings
