# Issue: Homepage login form shown when navigating from admin sidebar

**Issue ID:** homepage-login-redirect-2
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 20:00

## Overview
Clicking "Wolfpack: Product Bundles" in the Shopify admin sidebar navigates to the
app's root URL which shows an awkward login form instead of the dashboard.

## Root Cause
Two routes contributed:
1. Root `/` route (`routes/root/_index/route.tsx`) — only redirected to `/app` when
   `shop` query param was present. When Shopify Admin navigates via App Bridge, the
   param may not be included. The client-side `useEffect` iframe detection was too
   slow, rendering the login form first.
2. App index `/app` route (`routes/app/app._index.tsx`) — rendered a "Welcome" landing
   page with "Create My Bundles Now" button instead of redirecting to dashboard.

## Fix
1. Root route: Added server-side checks for `host` and `id_token` params, plus
   `sec-fetch-dest: iframe` header detection for embedded context.
2. App index route: Replaced landing page with server-side redirect to `/app/dashboard`.
   The metafield sync still runs before redirecting.

## Files Changed
- `app/routes/root/_index/route.tsx` — Added embedded detection + redirect
- `app/routes/app/app._index.tsx` — Replaced landing page with redirect to dashboard

## Phases Checklist
- [x] Investigate root cause
- [x] Fix root route loader
- [x] Fix app index route
- [x] Lint
- [x] Commit
