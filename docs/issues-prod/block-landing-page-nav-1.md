# Issue: Block Navigation Back to Landing Page for Authenticated Users

**Issue ID:** block-landing-page-nav-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 12:00

## Overview
When a user navigates to the homepage (`/`) from the dashboard or any `/app/*` route, they see an awkward Shopify login screen asking for their storefront URL. Since the app runs embedded in Shopify Admin, users who reach `/` are already authenticated and should be redirected back to `/app`.

## Root Cause
The landing page at `app/routes/root/_index/route.tsx` only checks for a `shop` query parameter to redirect. When users navigate back (browser back, direct URL, or client-side routing), there's no `shop` param, so they see the login form.

## Fix
Detect embedded iframe context on the landing page and redirect to `/app`. Shopify App Bridge on the `/app` route will handle re-authentication via session tokens.

## Progress Log

### 2026-02-24 12:00 - Starting Implementation
- Adding iframe detection to landing page to redirect embedded users to `/app`
- File to modify: `app/routes/root/_index/route.tsx`

### 2026-02-24 12:10 - Completed Implementation
- Added `useEffect` with iframe detection: `window.self !== window.top`
- When embedded in Shopify Admin iframe, `window.location.replace("/app")` redirects to the app where App Bridge handles auth via session tokens
- Cross-origin catch also triggers redirect (iframe security restriction = we're embedded)
- Non-embedded access (direct URL) still shows the login form as before
- ESLint: 0 errors, 0 warnings
- File modified: `app/routes/root/_index/route.tsx`

## Phases Checklist
- [x] Phase 1: Add client-side iframe detection + redirect on landing page
- [x] Phase 2: Verify embedded app flow works correctly
