# Issue: Widget Performance Improvements Combo

**Issue ID:** widget-performance-combo-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-11
**Last Updated:** 2026-03-11

## Overview
Three performance improvements to the storefront bundle widget load sequence:

1. **CSS cache-buster fix**: Both liquid files use `?v={{ 'now' | date: '%s' }}` which
   generates a new URL every second → browser never caches the design settings CSS →
   every page load hits the app server unnecessarily. Fix: Add ETag + proper cache headers
   to the CSS API and remove the timestamp from liquid links.

2. **Parallel prefetch all steps**: `preloadNextStep()` only loads step N+1 in background.
   For multi-step bundles (3-4 steps) this means each step transition still has latency.
   Fix: Replace with `preloadAllSteps()` that fires off background fetches for ALL
   remaining steps when step 0 renders.

## Files to Modify
- `extensions/bundle-builder/blocks/bundle-full-page.liquid`
- `extensions/bundle-builder/blocks/bundle-product-page.liquid`
- `app/routes/api/api.design-settings.$shopDomain.tsx` (add ETag / If-None-Match)
- `app/assets/bundle-widget-full-page.js` (preloadAllSteps)
- `scripts/build-widget-bundles.js` (bump WIDGET_VERSION)
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuilt output)

## Progress Log

### 2026-03-11 - Completed
- ✅ Removed `?v={{ 'now' | date: '%s' }}` from both liquid files — stable URL now
- ✅ CSS API: added ETag derived from `designSettings.updatedAt`; handles `If-None-Match`
  returning 304 when unchanged; max-age bumped from 300s → 3600s with stale-while-revalidate
- ✅ Replaced `preloadNextStep()` with `preloadAllSteps()` — fires parallel background
  fetches for all steps when step 0 renders; kept `preloadNextStep()` as alias for call sites
- ✅ WIDGET_VERSION bumped 1.2.1 → 1.2.2
- ✅ Full-page widget bundle rebuilt (217.8 KB)
- ✅ ESLint: 0 errors
- Files: bundle-full-page.liquid, bundle-product-page.liquid,
  api.design-settings.$shopDomain.tsx, bundle-widget-full-page.js,
  build-widget-bundles.js, bundle-widget-full-page-bundled.js

## Phases Checklist
- [x] Fix CSS cache-buster in both liquid files
- [x] Add ETag + If-None-Match handling to design-settings CSS API
- [x] Replace preloadNextStep() with preloadAllSteps()
- [x] Bump WIDGET_VERSION, rebuild widget bundles
- [x] Lint + commit
