# Issue: Dashboard Preview Button Fix (Edit Routing Unchanged)

**Issue ID:** feedback-jun26-5
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

From `Feedbacks June 2026.pdf`: "Preview bundle not working from main admin screen".

Per user clarification (round 2), Edit-button routing stays unchanged (current `getBundleEditPath` keeps pointing at the FPB/PPB sidebar configure page). The only fix in this commit is the **Preview button on the dashboard**.

Today's behavior:
- FPB: button enabled because `previewHandle: bundle.id`. Clicking opens `/apps/product-bundles/wpb/{bundle.id}` (app proxy route — renders fine even when the merchant hasn't published a Shopify Page, since the proxy serves its own HTML).
- PPB: button **disabled** when `shopifyProductHandle` is null. If backfill failed in the loader, merchant has no way to preview.
- For FPB bundles where the merchant hasn't run "Place Widget" yet, the proxy URL works but is unbranded — the merchant might expect to see the bundle on a Shopify Page if one exists.

Fix:
- For PPB without `shopifyProductHandle`: keep button enabled, but on click show a clear toast: "Save and place the bundle on a product first to preview it."
- For FPB: optionally trigger `createPreviewPage` action (same as FPB configure does at line 209) so a Shopify Page is created in the background. Pure proxy URL stays as the immediate `window.open` target so the merchant sees the bundle right away.

## Approach

1. Extract a pure helper `decideDashboardPreviewAction(bundle, shop)` that returns one of:
   - `{ kind: "open_url"; url: string }` — open straight away
   - `{ kind: "create_page_then_open"; url: string }` — open the proxy URL now AND trigger background createPreviewPage so the merchant has a Shopify Page next time
   - `{ kind: "error"; toast: string }` — show toast, do nothing
2. Add `handleCreatePreviewPage` intent to the dashboard action (mirror FPB configure's action wiring).
3. Wire `handlePreviewBundle` in the dashboard component to call the helper, dispatch the action for the create-page case, and toast for the error case. Drop the `disabled` prop on the Preview button so PPB merchants can at least see the toast guidance.

## Files Changed

- `app/lib/dashboard-preview-action.ts` (new) — pure helper + types.
- `app/routes/app/app.dashboard/route.tsx` — action: wire createPreviewPage intent; component: replace handlePreviewBundle body + drop `disabled` on button; render `disabled` only when helper returns `{ kind: "error" }` with a permanent reason.
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` — re-export `handleCreatePreviewPage` from FPB handlers (or import directly inside route).

## Tests

- `tests/unit/lib/dashboard-preview-action.test.ts` — cover all branches.

## Phases Checklist

- [x] Phase 1: Failing test for `decideDashboardPreviewAction`
- [x] Phase 2: Implement helper
- [x] Phase 3: Wire dashboard action + component, drop button disabled state
- [x] Phase 4: Tests + lint green
- [x] Phase 5: Commit

**Status:** Completed

## Progress Log

### 2026-05-29 — Implementation complete
- Added pure helper `app/lib/dashboard-preview-action.ts` returning a 3-branch discriminated union (`open_url` / `create_page_then_open` / `error`). 5 unit tests cover FPB w/ page, FPB w/o page, PPB w/ handle, PPB w/o handle, shop normalization.
- Added `createPreviewPage` intent to the dashboard action; reuses `handleCreatePreviewPage` imported from the FPB configure handlers.
- Replaced dashboard `handlePreviewBundle` body: calls helper, dispatches createPreviewPage action when FPB has no Shopify Page (fire-and-forget — proxy URL opens immediately), shows toast when PPB has no product handle.
- Dropped the `disabled` prop on the Preview button so PPB merchants at least see the toast guidance instead of a dead button.
- Edit routing unchanged per round-2 user clarification.

### 2026-05-29 — Starting implementation
- Created issue file. Helper test first.
