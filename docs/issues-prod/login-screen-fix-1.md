# Issue: Fix Login Screen Appearing Inside Embedded App

**Issue ID:** login-screen-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-28
**Last Updated:** 2026-03-01 10:00

## Overview

Merchants are shown a "Log in" form (asking for shop domain) inside the Shopify Admin
embedded app window when:
1. They install the app for the first time
2. They click the "Wolfpack: Product Bundles" link in the Shopify Admin sidebar navigation

The login screen should never appear inside the embedded context — authentication is
handled automatically by Shopify App Bridge via token exchange.

## Root Cause Analysis

### Bug 1: Parallel loader race condition (PRIMARY)

`app.tsx` (layout route) and `app._index.tsx` both call `authenticate.admin(request)` in
**parallel** on every `/app` navigation. With `unstable_newEmbeddedAuthStrategy`, both
loaders attempt to perform token exchange using the same `id_token` simultaneously.
Token exchange is one-shot — the second exchange attempt fails and the library falls back
to redirecting to `/auth/login` without the shop params, causing the login form to render.

**Fix:** Remove `authenticate.admin()` from `app._index.tsx` entirely. The layout route
(`app.tsx`) already handles authentication. `app._index.tsx` just needs to redirect.

### Bug 2: No embedded context guard in login route

`auth.login/route.tsx` loader calls `login(request)` which returns `LoginErrors` (rather
than throwing a redirect) when there is no `shop` query param in the URL. This causes the
login form to render inside the embedded iframe — the merchant sees a text field asking
for their shop domain inside the Shopify Admin.

**Fix:** Add an early redirect in the login loader: when `shop`, `host`, or `id_token`
params are present, redirect to `/app?${params}` so App Bridge can perform token exchange.

### Bug 3: Dashboard BillingService not guarded

`app.dashboard/route.tsx` calls `BillingService.getSubscriptionInfo(session.shop)` with
no try-catch. On fresh install, if `afterAuth` hasn't completed creating the shop record
yet (or if the DB query fails), the entire dashboard loader throws an unhandled error.

**Fix:** Wrap `BillingService.getSubscriptionInfo()` in try-catch; return `null` on error
so the dashboard still renders (upgrade banner is hidden gracefully).

### Bug 4: Metafield sync in index route runs during race window

The `$app:serverUrl` metafield sync in `app._index.tsx` runs on every app load. This is
correct semantically (keep the URL fresh) but it requires an authenticated `admin` object
which comes from the `authenticate.admin()` call being removed in Fix 1.

**Fix:** Move the `$app:serverUrl` sync to the `afterAuth` hook in `shopify.server.ts`.
The server URL (`process.env.SHOPIFY_APP_URL`) is a static deploy-time value; syncing it
once on install/re-install is sufficient.

## Files to Modify

- `app/routes/app/app._index.tsx` — Remove authenticate.admin(), remove metafield sync, pure redirect
- `app/routes/auth/auth.login/route.tsx` — Add embedded context redirect guard
- `app/routes/app/app.dashboard/route.tsx` — Wrap BillingService call in try-catch
- `app/shopify.server.ts` — Add $app:serverUrl metafield sync to afterAuth hook

## Progress Log

### 2026-02-28 10:00 - Investigation Complete, Starting Fixes
- ✅ Confirmed parallel loader race condition (app.tsx + app._index.tsx both call authenticate.admin())
- ✅ Confirmed login route has no embedded context guard
- ✅ Confirmed BillingService.getSubscriptionInfo() is uncaught in dashboard loader
- ✅ Identified metafield sync dependency on removed authenticate.admin() call
- Will modify: app._index.tsx, auth.login/route.tsx, app.dashboard/route.tsx, shopify.server.ts
- Next: Implement fixes

## Progress Log

### 2026-02-28 10:30 - All Phases Completed
- ✅ `app/routes/app/app._index.tsx`
  - Removed `authenticate.admin()` call — eliminates parallel token-exchange race condition
  - Removed metafield sync (moved to afterAuth)
  - Now a pure redirect to `/app/dashboard`
- ✅ `app/shopify.server.ts`
  - Added `$app:serverUrl` metafield sync block inside `afterAuth` hook
  - Runs once on install/re-install (same semantics, no race condition)
- ✅ `app/routes/auth/auth.login/route.tsx`
  - Added embedded context guard at top of loader
  - Redirects to `/app?${params}` when `shop`, `host`, or `id_token` present in URL
  - Prevents login form from ever rendering inside the embedded Admin iframe
- ✅ `app/routes/app/app.dashboard/route.tsx`
  - Wrapped `BillingService.getSubscriptionInfo()` in try-catch
  - Dashboard renders without upgrade banner on error (graceful degradation)
### 2026-03-01 10:00 - Re-applied after branch reset
- Branch was reset/force-pushed; previous fixes were lost
- Re-applied all four fixes identically
- Next: Commit

## Phases Checklist

- [x] Phase 1: Remove authenticate.admin() from app._index.tsx + pure redirect ✅
- [x] Phase 2: Move $app:serverUrl sync to afterAuth hook in shopify.server.ts ✅
- [x] Phase 3: Add embedded context guard to auth.login/route.tsx ✅
- [x] Phase 4: Wrap BillingService call in try-catch in app.dashboard/route.tsx ✅
- [x] Phase 5: Commit ✅
