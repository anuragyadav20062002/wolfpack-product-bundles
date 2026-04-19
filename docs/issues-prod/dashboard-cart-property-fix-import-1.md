# Issue: Dashboard crash — CartPropertyFixContent missing import

**Issue ID:** dashboard-cart-property-fix-import-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-01
**Last Updated:** 2026-04-01 10:30

## Overview
The dashboard route crashed on every load with `ReferenceError: CartPropertyFixContent is not defined`.
The component was used at lines 830 and 1128 of `route.tsx` but the import statement was missing,
causing the server-side render to throw a 410 error and the Shopify admin iframe to show a blank page.

## Progress Log

### 2026-04-01 10:30 - Fixed missing import
- Diagnosed via server logs (ReferenceError in React SSR stack trace)
- Added missing import to `app/routes/app/app.dashboard/route.tsx`
- Verified dashboard loads correctly after Vite HMR rebuild

## Files Changed
- `app/routes/app/app.dashboard/route.tsx` — added import for `CartPropertyFixContent`

## Phases Checklist
- [x] Identify root cause from server logs
- [x] Add missing import
- [x] Verify fix in browser
