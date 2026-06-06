# Issue: Parent Product Status Stale Sync
**Issue ID:** parent-product-status-stale-sync-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-06 06:42

## Overview
FPB configure can show a stale Parent Product Status badge after the linked Shopify product status changes. Chrome verification showed the `testing` FPB configure tab displaying `Draft` while the exact Shopify product and bundle database row were `Active`; a full route reload corrected the badge to `Active`.

## Progress Log
### 2026-06-05 21:54 - Investigation
- Checked Chrome Admin tabs for FPB configure routes.
- Verified bundle `cmpznom360001v0wqjqm3cv3a` shows `Parent Product Status Active` and DB `status=active`.
- Verified bundle `cmq13ieip0000v0lnf3o8kjyt` initially showed stale `Parent Product Status Draft`.
- Confirmed linked Shopify product `gid://shopify/Product/9470159487235` is `Active`.
- Confirmed DB bundle `cmq13ieip0000v0lnf3o8kjyt` has `status=active`.
- Full reload corrected the WPB badge to `Active`, confirming stale client state.
- Next: add regression coverage and sync loaded parent product data into configure state on loader revalidation.

### 2026-06-05 21:57 - Regression Fix
- Added regression coverage in `tests/unit/routes/parent-product-status-ui.test.ts`.
- Updated `app/hooks/useBundleConfigurationState.ts` to sync `loadedBundleProduct` into local bundle product/status/title/image state when loader data changes.
- Updated the discard baseline for parent product status after loader revalidation without marking the form dirty.
- Verified targeted Jest regression passes.

### 2026-06-05 22:01 - Chrome Verification
- Opened a fresh Shopify Admin route for `cmq13ieip0000v0lnf3o8kjyt`.
- Verified the configure page loads and displays `Parent Product Status Active`.
- Noted a transient React Fast Refresh hook-order error in the stale tab after adding a new hook; a fresh route load cleared it.

### 2026-06-06 06:39 - Commit Prep
- Rechecked the parent status sync diff and kept this batch scoped to `useBundleConfigurationState`, its route contract test, and issue/spec docs.
- Confirmed no dirty image assets are present before staging.
- Next: run the focused regression, lint touched files, staged whitespace check, then commit this batch.

### 2026-06-06 06:42 - Graph Refresh Commit Prep
- Commit hooks rebuilt `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json` after the batched code commits.
- Stripped trailing whitespace from the generated report before staging.
- Next: stage and commit only the graph outputs plus this issue-log entry.

## Related Documentation
- `app/hooks/useBundleConfigurationState.ts`
- `tests/unit/routes/parent-product-status-ui.test.ts`

## Phases Checklist
- [x] Phase 1: Reproduce and identify stale state source
- [x] Phase 2: Add regression test
- [x] Phase 3: Implement loaded product state sync
- [x] Phase 4: Verify in tests and Chrome
