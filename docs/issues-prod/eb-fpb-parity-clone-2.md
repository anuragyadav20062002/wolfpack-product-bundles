# Issue: FPB Configure Page — Parity Fixes Round 2

**Issue ID:** eb-fpb-parity-clone-2
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-20
**Last Updated:** 2026-05-20 12:30

## Overview

Follow-up to `eb-fpb-parity-clone-1` (completed). Four targeted UI fixes for the FPB configure page based on the EB e2e audit and user-confirmed decisions:

1. **Edit Product bug** — clicking "Edit Product" does nothing. Root cause: `shopify.navigate()` sends a `postMessage` with wrong target origin (Cloudflare tunnel URL vs `admin.shopify.com`), causing a silent security error. Fix: `window.open(productUrl, '_blank')`.
2. **⋮ menu — Remove "Replace Product"** — FPB only supports Sync Product; Replace Product is PPB-only. Remove "Replace Product" button from the dropdown.
3. **Bundle Widget nav** — "Bundle Widget" is currently a top-level nav item. Per EB parity, it should be a sub-item nested under "Bundle Visibility" (expands when Bundle Visibility is active or Bundle Widget is active).
4. **Remove "Take your bundle live" card** — Confirmed PPB-only feature (verified on EB PPB configure page). FPB has no widget placement flow, so this card is not applicable.

## Progress Log

### 2026-05-20 12:30 - All 4 changes implemented and E2E verified

- Edit Product: `shopify.navigate()` → `window.open(productUrl, '_blank')` — new tab opens at `admin.shopify.com/store/{shop}/products/{id}` ✅
- Replace Product removed from ⋮ menu; Sync Product is the only remaining item ✅
- Bundle Widget moved to sub-item under Bundle Visibility; sub-nav expands when Bundle Visibility or Bundle Widget is active ✅
- "Take your bundle live" card removed from FPB left sidebar ✅
- ESLint: 0 errors on modified file
- E2E verified in Chrome DevTools (wolfpack-store-test-1, SIT)

### 2026-05-20 12:00 - Issue file created, starting implementation

- Root cause of Edit Product bug confirmed via Chrome DevTools console: `postMessage` origin mismatch
- EB PPB configure page verified: "Take your bundle live" card IS present on PPB, NOT on FPB
- User confirmed: keep ⋮ menu but only "Sync Product"; Bundle Widget as sub-nav under Bundle Visibility
- Files to modify: `route.tsx` in FPB configure route

## Files to Change

- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`

## Phases Checklist

- [x] Fix Edit Product button (`window.open` instead of `shopify.navigate`)
- [x] Remove "Replace Product" from ⋮ menu
- [x] Bundle Widget as sub-item under Bundle Visibility nav
- [x] Remove "Take your bundle live" card
- [x] ESLint 0 errors
- [x] E2E verify in Chrome
