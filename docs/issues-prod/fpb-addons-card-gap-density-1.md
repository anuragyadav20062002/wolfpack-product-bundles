# Issue: FPB Add-ons Card Gap Density
**Issue ID:** fpb-addons-card-gap-density-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 10:12

## Overview
Reduce the vertical gaps between the three cards in the Free Gift & Add Ons section: Add-Ons and Gifting Step, Add-Ons with Bundles, and Footer Messaging.

## Progress Log
### 2026-06-05 10:12 - Slice started
- User requested the gaps between the three Free Gift & Add Ons cards be reduced.
- Found the three cards are wrapped by an Add-ons-only `s-stack` using `gap="base"`.
- Next: add RED source-contract coverage, tighten the Add-ons stack gap only, then verify in Chrome.

### 2026-06-05 10:12 - RED test confirmed
- Added focused source-contract coverage in `tests/unit/routes/fpb-addons-admin-layout.test.ts`.
- Confirmed RED failure: wrapper source still contained `gap="base"` instead of `gap="small-100"`.

### 2026-06-05 10:12 - Gap reduced and verified
- Changed only the Free Gift & Add Ons three-card wrapper from `gap="base"` to `gap="small-100"`.
- Shopify Polaris component validation passed for `s-stack direction="block" gap="small-100"`.
- Chrome verified the card spacing is visibly tighter.
- Proof screenshot: `/private/tmp/wpb-addons-card-gap-density-2026-06-05.png`.

### 2026-06-05 10:12 - Final verification
- Focused test passed: `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/fpb-addons-admin-layout.test.ts`.
- TS/TSX lint passed with 0 errors and 979 warnings: `npx eslint --max-warnings 9999 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx' tests/unit/routes/fpb-addons-admin-layout.test.ts`.
- Graphify rebuild completed and updated `graphify-out/graph.json` plus `graphify-out/GRAPH_REPORT.md`.

## Related Documentation
- `test-spec/fpb-addons-card-gap-density.spec.md`

## Phases Checklist
- [x] Phase 1: RED test for reduced Add-ons card stack gap
- [x] Phase 2: Implement scoped gap reduction
- [x] Phase 3: Chrome verification
- [x] Phase 4: Lint and commit-ready status
