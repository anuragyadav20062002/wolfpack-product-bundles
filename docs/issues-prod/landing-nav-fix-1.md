# Issue: Landing Page Flash + navigate(-1) Login Screen Bug

**Issue ID:** landing-nav-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-11
**Last Updated:** 2026-03-11

## Overview
Two related navigation regressions introduced by the landing page commit:

### 1. Login screen when navigating back from Analytics / Billing
`app.attribution.tsx` and `app.billing.tsx` both use `navigate(-1)` for their
back buttons. `navigate(-1)` walks back in browser history — inside Shopify's
embedded iframe, the previous history entry is often an auth/login URL rather
than an app route, so the user ends up on the login screen.

### 2. Landing page flashing on Analytics (and other routes) first visit
The new landing page (`app._index.tsx`) renders immediately on the server (SSR).
When Shopify's auth flow redirects to `/app` as an intermediate step (with
`shop`, `host`, or `id_token` in the URL), the purple gradient landing page
HTML is served and briefly visible before the client navigates to the actual
destination. Previously the index route rendered `null`, so this bounce was
invisible.

## Root Causes
- `navigate(-1)` — relies on unpredictable browser history in an embedded iframe
- SSR landing page — rendered even during Shopify's auth bounce through `/app`

## Fix

### navigate(-1) → explicit routes
- `app.attribution.tsx`: both `navigate(-1)` → `navigate("/app/dashboard")`
- `app.billing.tsx`: `navigate(-1)` → `navigate("/app/dashboard")`

### Landing page deferred to client
- `showLanding` state starts `false` on both server and client → server renders `null`
- `useEffect` runs on mount and inspects `window.location.search`:
  - `id_token` / `host` / `shop` params present → auth bounce → redirect to dashboard
  - No auth params → intentional navigation to `/app` → flip `showLanding = true`
- Also fixed landing page footer "Contact Support" → Crisp chat (was mailto)

## Files Modified
- `app/routes/app/app._index.tsx`
- `app/routes/app/app.attribution.tsx`
- `app/routes/app/app.billing.tsx`

## Phases Checklist
- [x] Fix navigate(-1) in attribution (both instances)
- [x] Fix navigate(-1) in billing
- [x] Defer landing page render until client confirms no auth params
- [x] Fix Contact Support → Crisp in landing footer
- [x] Lint + commit
