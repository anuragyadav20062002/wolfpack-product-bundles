# Issue: FPB Add-ons Step Config Controls Parity
**Issue ID:** fpb-addons-step-config-controls-parity-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 06:21

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

## Related Documentation
- `docs/issues-prod/fpb-addons-upload-giftbox-default-1.md`
- `test-spec/fpb-addons-step-config-controls-parity-1.spec.md`

## Phases Checklist
- [x] Phase 1: Dedicated source guard for Step icon, Replace button, Step Name, and Step Title layout
- [x] Phase 2: Chrome verification for the Add-ons step config row
- [x] Phase 3: Lint, graphify, and commit-ready status
