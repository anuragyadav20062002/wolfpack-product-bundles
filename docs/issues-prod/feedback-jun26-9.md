# Issue: Preview Opens Live Bundle After Embed

**Issue ID:** feedback-jun26-9
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

From `Feedbacks June 2026.pdf`: "once bundle is embed and preview bundle click then it should show live bundle and not preview link bundle".

When the theme app extension is enabled AND the bundle is Active/Unlisted, Preview should open the **live** storefront URL (the page the customer would see). Today's behavior:

- FPB configure always opens the app-proxy URL (`/apps/product-bundles/wpb/{id}`) regardless of whether a Shopify Page has been published.
- PPB configure prefers Shopify's `bundleProduct.onlineStorePreviewUrl` (a draft preview URL with a token), even when the bundle is Active and would render at the live `/products/{handle}` URL.
- Dashboard already uses live-style URLs (the helper introduced in #5).

## Approach

Extend the `decideDashboardPreviewAction` helper (from #5) to accept `appEmbedEnabled` + `bundleStatus`. New rule for FPB: when embed enabled AND status ∈ {active, unlisted} AND `shopifyPageHandle` is set, prefer `https://{shop}/pages/{handle}` over the proxy URL.

For PPB configure (which has its own bespoke 4-method URL construction), add a new pure helper `pickPpbPreviewUrl` that takes `{ appEmbedEnabled, bundleStatus, bundleProduct, productHandle, shop }` and returns the right URL. When embed enabled + active/unlisted, skip Method 1 (preview URL) and use the live handle-based URL instead.

## Files Changed

- `app/lib/dashboard-preview-action.ts` — extend signature with `appEmbedEnabled` + `bundleStatus`; new FPB branch that returns Shopify Page URL when conditions met.
- `app/lib/ppb-preview-url.ts` (new) — pure helper for PPB configure URL selection.
- `app/routes/app/app.dashboard/route.tsx` — pass new args into helper.
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — use new helper in `handlePreviewBundle`.
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — call extended helper when conditions for live URL are met; otherwise keep existing proxy URL flow.

## Tests

- Extend `tests/unit/lib/dashboard-preview-action.test.ts` with new cases:
  - FPB embed enabled + status active + pageHandle present → live page URL
  - FPB embed enabled + status active + no pageHandle → existing proxy URL behavior
  - FPB embed disabled + status active → existing proxy URL behavior
  - FPB embed enabled + status draft → existing proxy URL behavior
- New `tests/unit/lib/ppb-preview-url.test.ts` covering PPB branches.

## Phases Checklist

- [x] Phase 1: Extend helper + add new helper, failing tests
- [x] Phase 2: Update test fixtures + ensure existing tests still pass
- [x] Phase 3: Wire callers
- [x] Phase 4: Lint + tests green
- [x] Phase 5: Commit

**Status:** Completed

## Progress Log

### 2026-05-29 — Implementation complete
- Extended `decideDashboardPreviewAction` (from #5) with optional `appEmbedEnabled` + `bundleStatus`. When both indicate live eligibility (embed on AND status in {active, unlisted}) AND `shopifyPageHandle` is set, FPB Preview returns the Shopify Page URL (`/pages/{handle}`) instead of the app-proxy URL.
- Added a new pure helper `app/lib/ppb-preview-url.ts` with `pickPpbPreviewUrl`. PPB callers pass `{ appEmbedEnabled, bundleStatus, bundleProduct, productHandle, shop }` and get back the right URL. When live eligible, it skips `bundleProduct.onlineStorePreviewUrl` and prefers the live storefront URL.
- Wired the new helper into PPB configure `handlePreviewBundle` (replaced the 4-method bespoke construction with a single helper call + admin fallback).
- Wired the extended `decideDashboardPreviewAction` into the dashboard so the FPB Page URL preference applies there too.
- Patched FPB configure `handlePreviewBundle` to compute the same live-eligibility check inline (didn't refactor to the shared helper because the FPB branch has a unique createPreviewPage fork that the helper doesn't model).
- 7 new tests for `pickPpbPreviewUrl` + 6 new test cases for `decideDashboardPreviewAction`. 18 total passing. TSC clean.

### 2026-05-29 — Starting implementation
- Created issue file. Test extension + new helper next.
