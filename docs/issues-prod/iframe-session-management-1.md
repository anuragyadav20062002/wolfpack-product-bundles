# Issue: iFrame Session Management — Login Screen Flash During Navigation

**Issue ID:** iframe-session-management-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-28
**Last Updated:** 2026-02-28 22:00

## Overview
Login screen appears when navigating between pages in the embedded Shopify app (iframe). Root cause: production TOML missing `use_legacy_install_flow = false` which prevents Shopify managed installation from working properly with the `unstable_newEmbeddedAuthStrategy` token exchange flow. Additionally, the root route renders a login form before client-side iframe detection kicks in, and the auth login route has no protection against embedded app requests.

## Root Causes
1. **Production TOML missing `use_legacy_install_flow = false`** — Without this, Shopify may fall back to legacy OAuth authorization code grant flow which does full-page redirects during auth token refresh
2. **Root route (`/`) flashes login form in iframe** — Client-side `useEffect` iframe detection runs AFTER first paint, so the login form HTML is visible for a frame before redirect
3. **Auth login route has no embedded context guard** — If an embedded user lands on `/auth/login`, the login form renders instead of redirecting to `/app`

## Fix Plan
1. Add `use_legacy_install_flow = false` to production `shopify.app.toml`
2. Fix root route loader to redirect embedded users server-side (check `Sec-Fetch-Dest`, `shop`/`host` params, and `id_token`)
3. Add embedded context guard to `auth.login/route.tsx` loader
4. Remove client-side iframe detection hack (server-side handles it)

## Progress Log

### 2026-02-28 22:00 - Starting Fix
Files to modify:
- `shopify.app.toml` — add `use_legacy_install_flow = false`
- `app/routes/root/_index/route.tsx` — improve server-side redirect for embedded context
- `app/routes/auth/auth.login/route.tsx` — add embedded context guard

### 2026-02-28 22:15 - Completed Fix
- Added `use_legacy_install_flow = false` to production `shopify.app.toml`
- Fixed root route: removed client-side `useEffect` iframe hack, added `embedded=1` param check server-side
- Added embedded context guard to `auth.login/route.tsx` loader (checks `shop`/`host`/`id_token` params and `sec-fetch-dest` header)
- ESLint: 0 errors, 1 warning (pre-existing)

Files modified:
- `shopify.app.toml`
- `app/routes/root/_index/route.tsx`
- `app/routes/auth/auth.login/route.tsx`

## Phases Checklist
- [x] Add `use_legacy_install_flow = false` to production TOML
- [x] Fix root route to not flash login form in embedded context
- [x] Add embedded guard to auth login route
- [x] Lint modified files
