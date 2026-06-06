# Issue: FPB Add-ons Tier Action Buttons Full Width
**Issue ID:** fpb-addons-tier-action-buttons-full-width-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 10:04

## Overview
Make the Free Gift & Add Ons tier action buttons span the available card width. Add top padding above `Add Tier Rule`; keep `Add Add Ons Tier` full width without changing its click behavior.

## Progress Log
### 2026-06-05 10:04 - Slice started
- User requested `Add Tier Rule` to take the full width and have top padding.
- User requested `Add Add Ons Tier` to take the full width.
- Next: add RED source-contract coverage, implement scoped CSS wrappers, then verify in Chrome.

### 2026-06-05 10:04 - RED test confirmed
- Added source-contract coverage to `tests/unit/routes/fpb-addons-admin-layout.test.ts`.
- Confirmed RED failure: missing `addonsTierRuleAction` wrapper before `Add Tier Rule`.

### 2026-06-05 10:04 - Full-width buttons implemented and verified
- Added scoped wrappers for `Add Tier Rule` and `Add Add Ons Tier`.
- Tried Polaris `s-button` host-width styling first, but Chrome showed the button face stayed content-width.
- Checked Polaris `s-clickable` as the documented escape hatch, but component validation rejected `className` and `style` on this surface.
- Switched only these two controls to a scoped native button fallback so the actual button face spans the card width.
- Added top padding to the `Add Tier Rule` wrapper only.
- Chrome verified both button faces are full width and `Add Tier Rule` has visible top spacing.
- Proof screenshot: `/private/tmp/wpb-addons-tier-buttons-full-width-custom-2026-06-05.png`.

### 2026-06-05 10:04 - Verification complete
- Focused test passed: `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/fpb-addons-admin-layout.test.ts`.
- TS/TSX lint passed with 0 errors and 979 warnings: `npx eslint --max-warnings 9999 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx' tests/unit/routes/fpb-addons-admin-layout.test.ts`.
- Direct CSS ESLint is not supported by this repo config; the initial CSS-included lint command failed with the parser's non-standard extension error.
- Graphify rebuild completed: `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` updated.

## Related Documentation
- `test-spec/fpb-addons-tier-action-buttons-full-width.spec.md`

## Phases Checklist
- [x] Phase 1: RED test for full-width tier action buttons
- [x] Phase 2: Implement scoped button wrappers and spacing
- [x] Phase 3: Chrome verification
- [x] Phase 4: Lint and commit-ready status
