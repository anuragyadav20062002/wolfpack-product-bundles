# Issue: Session Breaking on Navigation

**Issue ID:** session-navigation-fix-1
**Status:** Completed
**Priority:** High
**Created:** 2026-01-19
**Last Updated:** 2026-01-19 12:15

## Overview

Users are experiencing session breakage when navigating back and forth in the app. The app forces users to a login screen where they need to enter their store URL. This is caused by incorrect use of `window.open(url, '_top')` which navigates the entire Shopify admin frame away from the embedded app, destroying the iframe and its session context.

## Root Cause

In Shopify embedded apps, the app runs inside an iframe within the Shopify admin. Using `window.open(url, '_top')` navigates the entire parent window (Shopify admin) to a new URL, destroying the app's iframe. When users navigate back via browser history, the session token that was tied to the iframe context is lost, forcing re-authentication.

## Affected Files

1. `app/routes/app.onboarding.tsx` - line 97
2. `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx` - lines 3168, 3332, 3448, 3546
3. `app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx` - line 3241

## Solution

Replace `window.open(url, '_top')` with `window.open(url, '_blank')` for external admin URLs (theme editor). This:
- Opens the theme editor in a new tab
- Preserves the app's session in the original tab
- Provides better UX (users can switch between tabs)
- No session loss when returning to the app

## Progress Log

### 2026-01-19 12:00 - Starting Fix Implementation
- Identified 6 instances of problematic `window.open(url, '_top')` navigation
- All instances are for opening the Shopify theme editor
- Creating fixes to use `_blank` target instead
- Files to modify:
  - app/routes/app.onboarding.tsx
  - app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx
  - app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx

### 2026-01-19 12:15 - Completed All Fixes
- Fixed `app/routes/app.onboarding.tsx` (1 location)
  - Changed `handleOpenThemeEditor` to use `_blank` instead of `_top`
- Fixed `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx` (4 locations)
  - Line 3168: Widget installation link after page creation
  - Line 3332: Theme editor link in `handlePageSelection`
  - Line 3448: "View in Theme Editor" button
  - Line 3546: "Configure Widget" button
- Fixed `app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx` (1 location)
  - Line 3241: "View in Theme Editor" button
- Verified no remaining `_top` navigation calls in app routes
- Updated comments to explain why `_blank` is correct (preserves session)

## Related Documentation

- Shopify App Bridge documentation
- Embedded app session handling best practices

## Phases Checklist

- [x] Identify root cause
- [x] Document affected files
- [x] Fix app.onboarding.tsx
- [x] Fix app.bundles.full-page-bundle.configure.$bundleId.tsx (4 locations)
- [x] Fix app.bundles.product-page-bundle.configure.$bundleId.tsx
- [x] Verify no remaining `_top` navigation calls
- [x] Commit changes

## Summary of Changes

| File | Location | Change |
|------|----------|--------|
| app.onboarding.tsx | line 97 | `_top` -> `_blank` |
| app.bundles.full-page-bundle.configure.$bundleId.tsx | line 3168 | `_top` -> `_blank` |
| app.bundles.full-page-bundle.configure.$bundleId.tsx | line 3332 | `_top` -> `_blank` |
| app.bundles.full-page-bundle.configure.$bundleId.tsx | line 3448 | `_top` -> `_blank` |
| app.bundles.full-page-bundle.configure.$bundleId.tsx | line 3546 | `_top` -> `_blank` |
| app.bundles.product-page-bundle.configure.$bundleId.tsx | line 3241 | `_top` -> `_blank` |
