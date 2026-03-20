# Issue: Aesthetically Pleasing 4xx Error Pages

**Issue ID:** error-pages-4xx-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-13
**Last Updated:** 2026-03-20

## Overview

Serve a branded, user-friendly error page for 4xx HTTP errors (400, 401, 403, 404, 422, etc.) instead of the default browser or Remix blank error output.

## Approach

- Shared `ErrorPage` component with self-contained styles (no Polaris dependency — Polaris may not be loaded when errors occur outside `/app/*`)
- `root.tsx` ErrorBoundary — outermost catch-all for all routes
- `app.tsx` ErrorBoundary — passes Shopify auth errors to `boundary.error()`, renders custom page for 4xx app errors

## Progress Log

### 2026-03-13 - Starting implementation

- Files to create: `app/components/ErrorPage.tsx`
- Files to modify: `app/root.tsx`, `app/routes/app/app.tsx`

## Progress Log

### 2026-03-13 - Implemented

- ✅ `app/components/ErrorPage.tsx` — self-contained branded error page (no Polaris dependency), shows error code badge, title, description, and CTA buttons
- ✅ `app/root.tsx` — added `ErrorBoundary` as root-level catch-all
- ✅ `app/routes/app/app.tsx` — updated `ErrorBoundary` to show branded page for non-auth 4xx errors; Shopify auth errors (401/403 from `authenticate.admin`) still delegated to `boundary.error()`

## Progress Log

### 2026-03-20 - Bug fix + full redesign

**Bug fixed:** "Go to Dashboard" button was using `<a href="/app">` which triggered a hard
page load. Shopify auth requires `shop` + `host` query params on fresh loads outside the
embedded iframe — without them, `authenticate.admin()` redirects to login.
Fix: replaced `<a>` with a `<button onClick={navigateToDashboard}>` that extracts `shop`
and `host` from `window.location.search` and builds `/app/dashboard?shop=...&host=...`.

**Design revamp:**
- Added dark top bar with Wolfpack logo + app name (always visible, grounding context)
- Removed floating card — full-width layout matching Shopify admin aesthetic
- Three contextual SVG illustrations: server error (5xx), not-found (404), locked (401/403)
- Badge colour updated: 4xx = indigo pill, 5xx = red pill
- Added `hint` text per status code — actionable, non-technical guidance
- Technical `<details>` for server error messages — collapsed by default, cleaner
- "Contact support" link in footer
- Background changed to Shopify-admin neutral (#F6F6F7)

Files: `app/components/ErrorPage.tsx`

## Phases Checklist

- [x] Phase 1: Create `ErrorPage` component
- [x] Phase 2: Wire into root.tsx + app.tsx
- [x] Phase 3: Bug fix — dashboard redirect preserves shop/host params
- [x] Phase 4: Full visual redesign — Shopify-admin-native feel
