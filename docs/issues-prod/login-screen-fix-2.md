# Issue: Fix Login Screen — Server-Side Redirect Breaks Token Exchange

**Issue ID:** login-screen-fix-2
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-01
**Last Updated:** 2026-03-01 18:00

## Overview

Despite the fixes in `login-screen-fix-1`, the login screen still appears inside the
embedded Shopify Admin iframe after reinstalling the app. Multiple attempts to fix the
auth flow have been made. The root issue is the interaction between Remix's parallel
loader execution, Shopify's `unstable_newEmbeddedAuthStrategy` (token-based auth), and
server-side redirects between routes.

## Root Cause (Final Understanding)

With `unstable_newEmbeddedAuthStrategy`, auth is **token-based** — no cookie sessions.
Each request must carry its own token (`id_token` for initial load, `Authorization` header
for subsequent App Bridge fetches). Server-side redirects between routes break this because:

1. `id_token` is one-shot — consumed by the first `authenticate.admin()` call
2. Server redirects (302) are followed by the browser as new HTTP requests
3. The new request has no `id_token` (consumed) and no `Authorization` header (not an App Bridge fetch)
4. `authenticate.admin()` at the redirect target can't authenticate → redirects to auth flow
5. The auth flow redirect target is not frameable → browser shows "refused to connect"

## Fix History

### Attempt 1 — Client-side redirect without layout auth (FAILED)
- Removed `authenticate.admin()` from layout, used `useNavigate` + `useEffect` in app._index
- Failed because: no auth in layout → App Bridge had no session → `{shop: null}` on all requests

### Attempt 2 — Auth in app._index only + server redirect (FAILED)
- Removed auth from layout, put `authenticate.admin()` exclusively in app._index
- app._index did token exchange then `return redirect("/app/dashboard?shop=...&host=...")`
- Failed because: server redirect loses auth context. Dashboard's `authenticate.admin()` gets
  no token → redirects to exit-iframe bounce or auth flow → "refused to connect"
- Render logs confirmed: `GET /app/dashboard → 302 (5.4ms)` — immediate auth failure

### Attempt 3 — Auth in layout + client-side redirect (CURRENT)
- **Restored `authenticate.admin()` in app.tsx layout** — handles token exchange + exit-iframe bounce
- **app._index returns `json(null)`** — NO auth call (avoids parallel race), NO server redirect
- **Client-side `useNavigate` + `useEffect`** in app._index component navigates to /app/dashboard
- Why this should work:
  1. Layout's auth handles the exit-iframe bounce (App Bridge initializes properly)
  2. After bounce + token exchange, Remix renders the page
  3. App Bridge is initialized by the time React renders
  4. useEffect fires → `navigate("/app/dashboard")` → client-side navigation
  5. App Bridge's fetch interceptor adds Authorization header to the data request
  6. Dashboard's `authenticate.admin()` validates the JWT → success
- Key difference from Attempt 1: **auth IS in the layout this time**, so the exit-iframe
  bounce mechanism works and App Bridge initializes with a valid session

## Files Modified

- `app/routes/app/app.tsx` — Restored authenticate.admin() in layout loader
- `app/routes/app/app._index.tsx` — Removed auth + server redirect, added client-side navigate

## Progress Log

### 2026-03-01 14:00 - Attempt 1: Client-side redirect (no layout auth)

- ✅ Analyzed Render logs: confirmed 302 redirect chain
- ✅ Changed to client-side redirect with `useNavigate` + `useEffect`
- ❌ Failed: App Bridge not ready, `{shop: null}` on all subsequent requests

### 2026-03-01 16:00 - Attempt 2: Auth in app._index + server redirect

- ✅ Removed auth from layout to eliminate parallel race
- ✅ app._index does exclusive auth + `return redirect` with preserved params
- ❌ Failed: server redirect loses auth context → "refused to connect"
- Render logs: `GET /app/dashboard → 302 (5.4ms)` — dashboard can't authenticate

### 2026-03-01 18:00 - Attempt 3: Auth in layout + client-side redirect

- ✅ Researched Shopify community forums and GitHub issues
- ✅ Confirmed: server-side redirects between routes are fundamentally broken with token auth
- ✅ Restored authenticate.admin() in layout (handles exit-iframe bounce)
- ✅ app._index returns json(null) + client-side navigate (no parallel race)
- ✅ ESLint: 0 errors
- Next: Deploy to SIT and verify

## References

- [Shopify GitHub Issue #1057](https://github.com/Shopify/shopify-app-js/issues/1057) — Parallel route loading with managed installation
- [Shopify iframe protection docs](https://shopify.dev/docs/apps/build/security/set-up-iframe-protection)
- [Community: Embedded app refused to connect](https://community.shopify.dev/t/embedded-shopify-app-refused-to-connect/13680)

## Phases Checklist

- [x] Diagnose root cause from Render logs
- [x] Attempt 1: client-side redirect without layout auth (failed)
- [x] Attempt 2: auth in app._index + server redirect (failed — "refused to connect")
- [x] Attempt 3: auth in layout + client-side redirect
- [x] Lint and type-check
- [ ] Deploy to SIT and verify
