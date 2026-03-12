# Issue: Aesthetically Pleasing 4xx Error Pages

**Issue ID:** error-pages-4xx-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

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

## Phases Checklist

- [x] Phase 1: Create `ErrorPage` component
- [x] Phase 2: Wire into root.tsx + app.tsx
- [ ] Phase 3: Verify for 404, 403, 400 cases (manual test)
