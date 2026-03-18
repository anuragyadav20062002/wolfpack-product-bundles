# Issue: FPB Widget — Bundle API Returns 404 on Storefront

**Issue ID:** fpb-widget-api-404-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 01:30

## Overview
Full-page bundle widget shows "Bundle Widget Error: API request failed: 404" on the storefront
immediately after a bundle page is created. Server logs confirm bundle creation succeeded.

Root cause: `authenticate.public.appProxy(request)` has a known incompatibility with
`unstable_newEmbeddedAuthStrategy: true` in `shopify.server.ts`. The function throws or redirects
unexpectedly for app proxy requests, causing the loader to fail before even querying the DB.
The `design-settings` route works because it avoids `authenticate.public.appProxy`.

## Progress Log

### 2026-03-20 01:30 - Completed
- Replaced `authenticate.public.appProxy(request)` with lightweight HMAC verification
- `verifyAppProxyRequest(url)` verifies the Shopify App Proxy HMAC signature using
  `SHOPIFY_API_SECRET` — equivalent security, no dependency on the auth strategy
- Returns verified `shop` domain from `?shop=` query param (Shopify always adds this)
- If HMAC verification fails → returns 400 (unauthorized)
- Removed unused `authenticate` import
- Files: `app/routes/api/api.bundle.$bundleId[.]json.tsx`

## Phases Checklist
- [x] Phase 1: Replace authenticate.public.appProxy with HMAC verification
- [x] Phase 2: Lint, commit
