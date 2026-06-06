# Issue: FPB Pending Preview Standard Template
**Issue ID:** fpb-pending-preview-standard-template-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-06 06:36

## Overview
FPB storefront preview can render an old floating-bar layout when Bundle Visibility is still Pending. Pending preview uses a generated Shopify page and cached `data-bundle-config`; default Standard Design bundles must serialize explicit template fields so the widget uses the current Standard template instead of stale/fallback rendering.

## Progress Log
### 2026-06-05 21:40 - Investigation
- Traced Pending preview to `handleCreatePreviewPage()` and `refreshFullPageBundlePageBody()`.
- Found the preview page body uses `formatBundleForWidget()` for `data-bundle-config`.
- Found the widget accepts cached full-page config only when both `bundleDesignTemplate` and `bundleDesignPresetId` exist.
- Next: add regression coverage for FPB default Standard preview config and make formatter defaults explicit.

### 2026-06-05 21:46 - Fixed and Verified
- Added formatter and preview-page regression tests for default FPB bundles with empty design fields.
- Updated `formatBundleForWidget()` to emit Standard Design defaults for full-page bundles only.
- Added internal docs note for the FPB preview cache contract.
- Verified focused formatter, preview, config-contract, and bundle-product metafield tests pass.

### 2026-06-05 21:44 - Clarified Pending Preview Behavior
- Merchant preview must work while Bundle Visibility is Pending; Pending should only keep the bundle hidden from shopper discovery/listing surfaces.
- Found FPB configure and dashboard preview actions are wrapped by the visibility/theme app embed gate before the preview page creation/open action runs.
- Next: add route/source regression coverage, then bypass the visibility gate for merchant preview actions without removing the Pending setup modal/nudge.

### 2026-06-05 21:44 - Preview Gate Fixed
- Added route contract coverage proving FPB configure and dashboard Preview actions run directly instead of being blocked by the Pending visibility gate.
- Updated FPB configure Preview to create/open the full-page preview before applying the theme-app-embed gate; product-page preview still uses the gate.
- Updated dashboard Preview with the same FPB bypass so Pending FPB rows can create/open merchant previews.
- Verified focused preview/gate tests, lint on touched route/test files, graph rebuild, and `git diff --check`.
- Chrome Admin page was hard reloaded, but the embedded app iframe stayed `about:blank`, so live click-through verification could not be completed in that tab.

### 2026-06-06 06:36 - Commit Prep
- Rechecked the pending-preview diff and kept this batch scoped to Standard Design formatter defaults, full-page merchant preview bypass, preview regressions, issue/spec docs, and the FPB preview cache note.
- Confirmed raw capture artifacts remain unstaged.
- Next: run focused Jest, lint touched files, staged whitespace checks, then commit this batch.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `app/services/widget-installation/widget-full-page-bundle.server.ts`
- `app/lib/bundle-formatter.server.ts`

## Phases Checklist
- [x] Phase 1: Root cause investigation
- [x] Phase 2: Regression test
- [x] Phase 3: Formatter fix
- [x] Phase 4: Verification
