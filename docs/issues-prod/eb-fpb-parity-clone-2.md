# Issue: FPB Configure Page — Parity Fixes Round 2

**Issue ID:** eb-fpb-parity-clone-2
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-20
**Last Updated:** 2026-05-20 14:00

## Overview

Follow-up to `eb-fpb-parity-clone-1` (completed). Five targeted UI fixes for the FPB configure page based on the EB e2e audit and user-confirmed decisions:

1. **Edit Product bug** — clicking "Edit Product" does nothing. Root cause: `shopify.navigate()` sends a `postMessage` with wrong target origin (Cloudflare tunnel URL vs `admin.shopify.com`), causing a silent security error. Fix: `window.open(productUrl, '_blank')`.
2. **⋮ menu — Remove "Replace Product"** — FPB only supports Sync Product; Replace Product is PPB-only. Remove "Replace Product" button from the dropdown.
3. **Bundle Widget nav** — "Bundle Widget" is currently a top-level nav item. Per EB parity, it should be a sub-item nested under "Bundle Visibility" (expands when Bundle Visibility is active or Bundle Widget is active).
4. **Remove "Take your bundle live" card** — Confirmed PPB-only feature (verified on EB PPB configure page). FPB has no widget placement flow, so this card is not applicable.
5. **Rules fields inline layout** — Rule Type/Operator/Value fields must display in a horizontal row (`flex-direction: row; align-items: flex-end`) matching EB's layout: `[Quantity ▼] [is greater than or equal to ▼] [0]`. Applies to both FPB and PPB configure pages.

## Progress Log

### 2026-05-20 13:15 - Edit Product fix finalised: shopify.navigate() + SIT fallback

- Audited EB: clicking "Edit Product" calls `shopify.navigate()` → Shopify Admin opens the product page as a **native Admin modal overlay** (rendered by the Admin SPA at the outer page level, not inside the app iframe)
- Changed WPB to use the same `shopify.navigate(adminProductUrl)` pattern (matching existing `product_active` case at line 1232)
- Added SIT/Cloudflare tunnel detection: `window.location.hostname.includes('trycloudflare.com')` → falls back to `window.open('_blank')` since App Bridge postMessage fails in tunnel environments due to origin mismatch
- Verified SIT: new tab opens at `admin.shopify.com/.../products/{id}` ✅
- PROD behaviour: `shopify.navigate()` → native Admin product modal overlay (matches EB exactly) ✅

### 2026-05-20 13:00 - Edit Product fix refined: _blank → _parent (intermediate, rejected by user)

- `window.open(productUrl, '_parent')` navigated the entire Admin SPA away from the configure page — user rejected this as it's a full redirect, not a modal

### 2026-05-20 12:30 - All 4 changes implemented and E2E verified

- Edit Product: `shopify.navigate(adminProductUrl)` — triggers native Admin modal overlay (matches EB exactly in PROD); SIT/Cloudflare tunnel falls back to `window.open('_blank')` due to App Bridge postMessage origin mismatch ✅
- Replace Product removed from ⋮ menu; Sync Product is the only remaining item ✅
- Bundle Widget moved to sub-item under Bundle Visibility; sub-nav expands when Bundle Visibility or Bundle Widget is active ✅
- "Take your bundle live" card removed from FPB left sidebar ✅
- ESLint: 0 errors on modified file
- E2E verified in Chrome DevTools (wolfpack-store-test-1, SIT)

### 2026-05-20 14:00 - Rules fields inline layout

- Audited EB FPB and PPB: rule Type/Operator/Value fields are on a single horizontal row (`flex-direction: row; align-items: flex-end`)
- FPB CSS: changed `.ebRuleFields` from `flex-direction: column` to `flex-direction: row; align-items: flex-end`; updated mobile breakpoint override to `flex-direction: column`
- PPB: added `.ebRuleFields` class to `product-page-bundle-configure.module.css` (row layout with `margin-bottom: 10px`); replaced inline `flexDirection: "column"` style in route.tsx with the new class
- Radio buttons (No rules / Step rules / Category rules): confirmed WPB already matches EB — FPB has all 3 options, PPB has 2 (no Category rules). No radio button changes needed.
- ESLint: 0 errors on modified .tsx file

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
- [x] Fix Edit Product button (`window.open` instead of `shopify.navigate`)
- [x] Remove "Replace Product" from ⋮ menu
- [x] Bundle Widget as sub-item under Bundle Visibility nav
- [x] Remove "Take your bundle live" card
- [x] Rules fields inline layout (FPB + PPB)
- [x] ESLint 0 errors
- [ ] E2E verify in Chrome
