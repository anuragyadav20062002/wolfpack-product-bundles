# Issue: FPB Add-ons Step Language Modal Parity
**Issue ID:** fpb-addons-step-language-modal-parity-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 06:30

## Overview
Track the first Free Gift & Add Ons Multi Language modal, the Add-ons Step rich translation modal, as its own EB parity slice, separate from the compact Add-ons Section and Footer Messaging language modals.

## Progress Log
### 2026-06-05 06:21 - Slice split
- User clarified the first language modal needs its own parity slice.
- Existing implementation already wires the Add-ons Step language action to the rich modal layout.
- Next: move the Add-ons Step rich modal source guard into this issue and leave the existing language modal slice scoped to the two compact modals.

### 2026-06-05 06:28 - First modal verified
- Added the dedicated source guard and test spec for the Add-ons Step rich Multi Language modal.
- Verified in Chrome on the SIT embedded admin route that the first modal opens with Translations, Choose language to edit, Custom Text, Text Settings, Step Name=`Step Text`, Step Title=`Step Subtext`, and `Save and Close`.
- Left `fpb-addons-language-modal-parity-1` scoped to compact Add-ons Section and Footer Messaging modals.

### 2026-06-05 06:30 - Verification complete
- Focused Jest and ESLint passed for the compact and first-modal parity tests.
- Rebuilt graphify after adding the dedicated route-level test.
- Next: commit the dedicated first-modal parity slice.

## Related Documentation
- `docs/issues-prod/fpb-addons-language-modal-parity-1.md`
- `test-spec/fpb-addons-step-language-modal-parity-1.spec.md`

## Phases Checklist
- [x] Phase 1: Dedicated source guard for the first Add-ons language modal
- [x] Phase 2: Chrome verification for the rich Add-ons Step modal
- [x] Phase 3: Lint, graphify, and commit
