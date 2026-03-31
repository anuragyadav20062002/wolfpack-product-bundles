# Issue: Full-Page Bundle Product Page Redirect

**Issue ID:** fpb-product-page-redirect-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-31
**Last Updated:** 2026-03-31 03:00

## Overview

When a full-page bundle is published ("Add to Storefront"), Shopify creates an associated product.
Visiting `/products/{productHandle}` showed the product-page bundle widget instead of redirecting
the customer to the correct `/pages/{pageHandle}` URL.

## Root Cause

The existing JS-based redirect in `bundle-product-page.liquid` is client-side and depends on
`bundleConfig.fullPagePageHandle` being set in the CDN-cached variant metafield. If the metafield
is stale, missing, or not yet propagated, the redirect silently falls through and the widget renders.

## Fix

On every "Add to Storefront" event, create a **Shopify URL redirect** via `urlRedirectCreate`
mutation. Shopify applies URL redirects before theme routing, so `/products/{handle}` reliably
redirects to `/pages/{pageHandle}` at the server level — no JS, no CDN caching dependency.

The JS-based redirect in `bundle-product-page.liquid` remains as a defence-in-depth layer.

## Phases Checklist

- [x] Phase 1: Add `createProductPageRedirect()` helper + wire into both "Add to Storefront" paths ✅

## Progress Log

### 2026-03-31 03:00 - Implemented

- ✅ Added `createProductPageRedirect(admin, productId, pageHandle)` helper in `handlers.server.ts`
  - Gets product handle via `GetProductHandle` GraphQL query
  - Calls `urlRedirectCreate` mutation with `path=/products/{handle}`, `target=/pages/{pageHandle}`
  - Logs warnings on userErrors (duplicate redirect) but never throws
- ✅ Wired into draft-promotion path (lines ~1244-1250) — fire-and-forget
- ✅ Wired into new-page-creation path (lines ~1312-1315) — fire-and-forget
- ✅ ESLint: 0 errors
- Files modified:
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
