# Issue: Fix Login Screen — Server-Side Redirect Breaks Token Exchange

**Issue ID:** login-screen-fix-2
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-01
**Last Updated:** 2026-03-01 14:00

## Overview

Despite the fixes in `login-screen-fix-1`, the login screen still appears inside the
embedded Shopify Admin iframe after reinstalling the app. The previous fix removed
`authenticate.admin()` from `app._index.tsx` to prevent a parallel token-exchange race
condition, but replaced it with `throw redirect("/app/dashboard")` — a server-side redirect
that short-circuits the parent layout's token exchange.

## Root Cause

With `unstable_newEmbeddedAuthStrategy`, Remix runs the layout (`app.tsx`) and child
(`app._index.tsx`) loaders **in parallel** via `Promise.all`. The flow was:

1. Shopify iframe opens `/?id_token=...&shop=...`
2. Root `_index` redirects to `/app?id_token=...&shop=...`
3. Remix fires both loaders in parallel:
   - `app.tsx` → `await authenticate.admin(request)` (takes ~200ms for token exchange)
   - `app._index.tsx` → `throw redirect("/app/dashboard")` (resolves **immediately**)
4. `throw redirect()` rejects the promise instantly → `Promise.all` short-circuits
5. Remix sends the 302 before the parent's token exchange completes
6. Browser navigates to `/app/dashboard` — no `id_token`, no `Authorization` header,
   no stored session
7. `authenticate.admin()` fails → redirects to `/auth/login`

With the new embedded auth strategy, there are **no cookie-based sessions** — only
token-based auth via `id_token` (initial) and `Authorization` headers (subsequent requests
via App Bridge). A server-side redirect breaks both mechanisms.

## Fix

Changed `app._index.tsx` from a server-side `throw redirect("/app/dashboard")` to a
**client-side redirect** using `useNavigate` + `useEffect`:

1. Loader returns `json(null)` — does NOT redirect or call `authenticate.admin()`
2. Parent layout's `authenticate.admin()` completes the token exchange and stores session
3. React renders → App Bridge initializes
4. `useEffect` fires `navigate("/app/dashboard", { replace: true })`
5. Client-side navigation uses App Bridge's fetch interceptor (adds `Authorization` header)
6. Dashboard loader's `authenticate.admin()` validates JWT → finds stored session → success

## Files Modified

- `app/routes/app/app._index.tsx` — Replaced `throw redirect()` with client-side navigate

## Progress Log

### 2026-03-01 14:00 - Completed Fix

- ✅ Analyzed Render logs: confirmed 302 redirect chain showing 3.9ms auth failure
- ✅ Identified `throw redirect()` as the cause of Promise.all short-circuit
- ✅ Changed to client-side redirect with `useNavigate` + `useEffect`
- ✅ ESLint: 0 errors
- ✅ TypeScript: no new errors
- Next: Deploy to SIT and verify

## Phases Checklist

- [x] Diagnose root cause from Render logs
- [x] Implement client-side redirect fix
- [x] Lint and type-check
- [x] Commit
- [ ] Deploy to SIT and verify
