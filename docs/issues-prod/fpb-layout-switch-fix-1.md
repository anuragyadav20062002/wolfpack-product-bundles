# Issue: Full-Page Bundle Layout Switch Not Reflecting on Storefront

**Issue ID:** fpb-layout-switch-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-31
**Last Updated:** 2026-03-31 01:00

## Overview

Switching between "Floating Footer" (`footer_bottom`) and "Sidebar" (`footer_side`) layouts in the full-page bundle configure page does not reflect on the storefront. In previous versions the switch appeared (with a delay); in the current version it never appears.

## Root Cause Analysis

Two compounding bugs:

**Bug 1 — Server (handlers.server.ts)**
`writeBundleConfigPageMetafield` is nested inside `if (updatedBundle.shopifyProductId)`. Full-page bundles that do not have a linked redirect product (`shopifyProductId = null`) never get their `custom:bundle_config` page metafield updated when layout changes are saved. Layout is permanently stuck.

**Bug 2 — Widget (bundle-widget-full-page.js) — PRIMARY CAUSE**
The cache-first strategy added for zero-latency first paint reads `data-bundle-config` from the Liquid-injected HTML attribute (which is embedded in CDN-cached page HTML). If this attribute contains valid JSON, the proxy API is **never called**. When the merchant saves a layout change:
- The page metafield IS updated (for bundles with shopifyProductId)
- BUT Shopify CDN continues serving the old page HTML (with old `data-bundle-config`) for minutes-to-hours
- The widget reads the stale layout from the old attribute on every page load
- Layout never changes → "not working at all" in current version

Previous versions always fetched from the proxy API (no metafield cache). Layout appeared after the DB-propagation delay (the "not immediately" the user mentioned).

## Fix Plan

**Fix 1 — Server**: Move `writeBundleConfigPageMetafield` call OUTSIDE the `if (shopifyProductId)` block so the page metafield is ALWAYS updated on save, regardless of whether a redirect product exists.

**Fix 2 — Widget**: After initial render with cached config, schedule a non-blocking background API fetch. If the returned `fullPageLayout` differs from the cached value, update `this.selectedBundle` and re-render the steps container. This bypasses the CDN cache and ensures layout is always consistent within seconds of page load.

## Phases Checklist

- [x] Phase 1: Server fix — move page metafield write outside shopifyProductId guard ✅
- [x] Phase 2: Widget fix — background layout refresh after cached first render ✅
- [x] Phase 3: Build widget bundle (bump version to 2.4.2) + lint + commit ✅

## Progress Log

### 2026-03-31 00:00 - Analysis Complete, Starting Implementation

- Root cause identified: CDN-cached `data-bundle-config` never refreshed after layout change
- Two-part fix: server-side metafield write guard + widget background refresh
- Files to modify:
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - `app/assets/bundle-widget-full-page.js`
  - `scripts/build-widget-bundles.js` (version bump)
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuild output)

### 2026-03-31 01:00 - All Phases Completed

- ✅ Phase 1 — Server fix:
  - Moved `writeBundleConfigPageMetafield` outside `if (shopifyProductId)` guard in `handlers.server.ts`
  - Page metafield now updated on every save regardless of whether a redirect product exists
- ✅ Phase 2 — Widget fix:
  - Added `_scheduleLayoutRefresh()` async method to `BundleWidgetFullPage` class
  - Called fire-and-forget from `init()` after `hideLoadingOverlay()`, skips in theme editor
  - Method checks if cached data was used; if so, fetches fresh layout from proxy API
  - On layout mismatch, updates `this.selectedBundle.fullPageLayout` and calls `renderSteps()`
  - All errors silently swallowed — never blocks the render path
  - Files modified:
    - `app/assets/bundle-widget-full-page.js` (~line 180-190, ~line 4340-4395)
- ✅ Phase 3 — Build + lint + commit:
  - `WIDGET_VERSION` bumped to `2.4.2` in `scripts/build-widget-bundles.js`
  - `npm run build:widgets` — full-page: 252.3 KB, product-page: 152.0 KB
  - CSS file sizes verified (full-page: 96061 B, all under 100,000 B limit)
  - ESLint: 0 errors on modified files (pre-existing warnings only)

**Status:** Ready for deploy via `npm run deploy:prod`

## Related Documentation

- `docs/fpb-preview-before-storefront/` — recent FPB feature context
- CLAUDE.md — Bundle Config Loading section (two-stage load strategy)
