# Issue: FPB Add-ons Step Config Controls Parity
**Issue ID:** fpb-addons-step-config-controls-parity-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 10:15

## Overview
Track the Free Gift & Add Ons step icon, Replace button, Step Name field, and Step Title field as their own EB parity slice, separate from Add-ons card padding, language modals, toggles, and tier action buttons.

## Progress Log
### 2026-06-05 06:21 - Slice split
- User clarified Step icon, Replace button, Step Name, and Step Title need their own parity slice.
- Existing implementation already contains the larger gift-box icon/upload control, Replace button sizing, and wider Step Name / Step Title column.
- Next: move dedicated test/spec coverage into this issue and keep broader Add-ons layout tests scoped to cards, toggles, and action buttons.

### 2026-06-05 06:21 - Slice verified
- Added dedicated source-contract test coverage for the Add-ons step config row.
- Verified Chrome Admin row includes Replace, Step Name, and Step Title in the Free Gift & Add Ons section.
- Captured screenshot proof at `/private/tmp/wpb-addons-step-config-controls-slice-2026-06-05.png`.
- Kept broad Add-ons layout issue/test scoped away from these controls.

### 2026-06-05 09:27 - Inline controls correction
- User clarified the gift step icon, Replace button, Step Name, and Step Title/description groups should be inline.
- Reopened this slice to change the row from icon/upload-column plus stacked fields to a single inline control row.
- Next: add RED source-contract coverage, update the route/CSS, then verify in Chrome.

### 2026-06-05 09:42 - Inline grouped correction
- User clarified the gift step icon and Replace button are one group, while Step Name and Step Title are a second group.
- Both groups must be inline, with controls stacked inside each group.
- Next: update the source guard and implementation from four inline controls to two inline stacked groups.

### 2026-06-05 09:49 - Gift icon box height correction
- User clarified the Free Gift step icon box height needs to be increased.
- Next: add source guard for the taller Add-ons icon box and verify the Admin row in Chrome.

### 2026-06-05 10:15 - Placement reference correction
- User provided a reference screenshot for the Free Gift & Add Ons step icon/card placement.
- Target placement: header title/toggle left, Multi Language right, icon box over Replace in a narrow left column, Step Name/Step Title stacked in the remaining right column.
- Next: add RED source-contract coverage for the tighter row placement and update only this first card layout.

### 2026-06-05 10:15 - Placement implemented and verified
- Added source-contract coverage for the reference placement values.
- Updated the Add-ons icon/Replace column to 98px, icon box height to 88px, icon/Replace gap to 6px, text field stack gap to 8px, and row gap to 10px.
- Converted the Add-ons Replace control to a scoped full-width native button because `s-button` rejected `className` in Shopify validation and the reference requires a full-width text-only button face.
- Shopify component validation passed for the remaining Polaris controls in the card.
- Chrome verified the card placement against the provided reference.
- Proof screenshot: `/private/tmp/wpb-addons-step-icon-placement-final-2026-06-05.png`.
- Focused tests passed: `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/fpb-addons-step-config-controls-parity.test.ts tests/unit/routes/fpb-addons-admin-layout.test.ts`.
- TS/TSX lint passed with 0 errors and 979 warnings.
- Graphify rebuild completed and updated `graphify-out/graph.json` plus `graphify-out/GRAPH_REPORT.md`.

## Related Documentation
- `docs/issues-prod/fpb-addons-upload-giftbox-default-1.md`
- `test-spec/fpb-addons-step-config-controls-parity-1.spec.md`

## Phases Checklist
- [x] Phase 1: Inline source guard for icon/Replace and Step Name/Step Title grouped layout
- [x] Phase 2: Chrome verification for the inline Add-ons step config row
- [x] Phase 3: Lint, graphify, and commit-ready status
