# Issue: Web Pixel Attribution Fix

**Issue ID:** web-pixel-attribution-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-12
**Last Updated:** 2026-03-12 18:00

## Overview

Two critical bugs discovered by auditing the Wolfpack UTM web pixel against Shopify's Web Pixels API documentation. Both bugs cause silent data loss — every `checkout_completed` attribution POST has been failing since the pixel was deployed.

## Bugs

### Bug 1: Wrong fetch URL (404 on every checkout)

The pixel calls:
```
${appServerUrl}/apps/product-bundles/api/attribution
```
But the Remix route `api.attribution.tsx` handles `/api/attribution`.

The `/apps/product-bundles` prefix is what Shopify's App Proxy **strips** when forwarding requests from `store.myshopify.com/apps/product-bundles/...` to the server. When the pixel calls the server **directly**, the prefix must NOT be included.

Fix: change URL to `${appServerUrl}/api/attribution`

### Bug 2: No CORS headers (browser blocks every response)

The web pixel sandbox runs in an isolated iframe with an opaque (`null`) origin. The `fetch()` call from the pixel to `wolfpack-product-bundle-app.onrender.com` is cross-origin. The attribution route returns no `Access-Control-Allow-Origin` header, so the browser CORS enforcement blocks the response on every request.

Fix: add `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Headers: Content-Type` to all responses, plus handle OPTIONS preflight.

## Progress Log

### 2026-03-12 18:00 - Implementing fixes

Files to change:
- `extensions/wolfpack-utm-pixel/src/index.ts` — fix URL
- `app/routes/api/api.attribution.tsx` — add CORS headers + OPTIONS handler

After fixing, requires `shopify app deploy` to push updated pixel source to Shopify.

## Related Documentation
- https://shopify.dev/docs/api/web-pixels-api
- https://shopify.dev/docs/apps/build/marketing-analytics/build-web-pixels

## Phases Checklist
- [x] Fix fetch URL in pixel source
- [x] Add CORS headers to attribution route
- [x] ESLint check — 0 errors
- [x] Commit
- [ ] Deploy via shopify app deploy (manual step required)
