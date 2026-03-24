# Issue: FPB Page Metafield Cache Not Updated on Bundle Save

**Issue ID:** fpb-metafield-cache-on-save-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-24
**Last Updated:** 2026-03-24

## Overview

`page.metafields.custom.bundle_config` — the JSON blob the FPB widget reads from
`data-bundle-config` on first paint — is only written by "Place Widget Now" and
"Sync Bundle". It is never written on a regular Save.

This means any change the merchant saves (layout switch, pricing rules, step products,
`isFreeGift`, `isDefault`, promo banner, loadingGif…) is invisible on the storefront
until they explicitly click "Sync Bundle". Worse, the widget will never fall through
to the proxy fallback because the stale metafield is present and non-empty.

## Root Cause

`handleSaveBundle` updates three product/variant metafields (for cart transform) but
never calls `writeBundleConfigPageMetafield`. That function is only invoked in
`handleValidateWidgetPlacement` and `handleSyncBundle`.

## Fix

After the existing parallel metafield updates in `handleSaveBundle`, add a non-fatal
call to `writeBundleConfigPageMetafield(admin, updatedBundle.shopifyPageId ?? null, updatedBundle)`.
Only fires when a pageId exists (i.e. bundle has been placed). Non-fatal — a write
failure must not fail the Save response.

## Progress Log

### 2026-03-24 - Implemented and committed

- ✅ Added `writeBundleConfigPageMetafield(admin, updatedBundle.shopifyPageId, updatedBundle)`
  call in `handleSaveBundle` after the parallel metafield block, gated on `shopifyPageId`
  being present. Non-fatal by design (errors are logged inside `writeBundleConfigPageMetafield`
  and never thrown).
- ✅ `writeBundleConfigPageMetafield` was already imported at line 14 — no import changes needed.
- ✅ Linted — 0 errors
- Files changed:
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

## Phases Checklist
- [x] Add `writeBundleConfigPageMetafield` call in `handleSaveBundle`
- [x] Lint + commit
