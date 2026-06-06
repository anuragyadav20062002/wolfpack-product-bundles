# Issue: FPB Add-ons Multi Language Button Icons
**Issue ID:** fpb-addons-multilanguage-icons-1
**Status:** Completed
**Priority:** Medium
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 05:44

## Overview
Add visible globe icons to the Free Gift & Add Ons Multi Language buttons while preserving the `Multi Language` label and existing modal wiring.

## Progress Log
### 2026-06-05 05:42 - Slice started
- User requested icons on Multi Language buttons.
- Current Add-ons top and section custom buttons are text-only; footer already uses the Polaris `globe` icon.
- Next: add focused test coverage, implement icon markup/CSS for the custom buttons, verify in Jest/lint/Chrome, rebuild graphify, and commit.

### 2026-06-05 05:44 - Icons implemented and verified
- Added decorative Polaris `globe` icons beside the visible `Multi Language` labels on the Add-ons top and section custom buttons.
- Kept the footer Multi Language control on its existing `s-button icon="globe"` pattern.
- Verification completed: focused Jest suite passed, ESLint exited with 0 errors, Chrome screenshot confirmed the icons render beside the labels, and graphify rebuilt successfully.

## Related Documentation
- `docs/issues-prod/fpb-addons-admin-control-parity-2.md`
- `test-spec/fpb-addons-admin-control-parity-2.spec.md`

## Phases Checklist
- [x] Phase 1: RED test for Add-ons Multi Language icon + label
- [x] Phase 2: Implement icon markup and compact button alignment
- [x] Phase 3: Verify in tests, lint, Chrome, graphify, and commit
