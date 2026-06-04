# Issue: Bundle Edit Visibility Modal, Create Tour, and EB Gap Audit
**Issue ID:** bundle-edit-visibility-tour-audit-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 11:47

## Overview
Restore EB-parity behavior for the edit bundle visibility modal when Bundle Visibility is Pending, verify the guided tour overlay for the create bundle workflow, and complete a deeper EB bundle edit/settings comparison focused on unwired or missed settings.

## Progress Log
### 2026-06-04 11:33 - Work started
- User reported the EB-style visibility modal should show once per session on edit bundle load when Bundle Visibility remains `Pending`.
- User also requested create bundle guided-tour verification and a deeper EB edit/settings audit after the modal/tour fixes.
- Initial evidence search found the prior `preview-bundle-gate-1` issue documenting the exact EB modal copy and session-trigger expectation.
- Next steps: inspect current preview gate, edit configure loader/UI wiring, create-flow guided-tour trigger, then add focused tests before implementation.

### 2026-06-04 11:47 - Visibility modal, create-tour contract, and EB settings audit completed
- Added focused TDD coverage for the visibility modal auto-open helper and configure-route source contract.
- Patched `useEnablePreviewGate` so auto-open follows Bundle Visibility Pending state, remains once-per-session by bundle id, and can route the setup CTA into the Bundle Visibility section.
- Patched PPB and FPB configure routes so the modal auto-opens only in edit mode when visibility is pending; create mode is excluded so the guided tour can own first-load create UX.
- Chrome verified on WPB SIT:
  - Optimised FPB edit route did not show the modal.
  - Pending FPB edit route showed the EB copy and actions.
  - `Set Up Visibility` moved the merchant into the Bundle Visibility section.
  - Reloading the same pending route in the same browser session did not show the modal again.
  - `mode=create&first_load=true` on the same pending bundle did not show the visibility modal.
- Verified create-tour source path: create redirect appends `first_load=true` when eligible, configure loaders compute `showFirstLoadTour` from `mode=create&first_load=true`, and both configure routes pass that flag to `BundleGuidedTour`.
- Audited live EB Settings Design, Language, and Controls pages in Chrome and documented confirmed UI/runtime findings in `internal docs/EB Edit Settings Gap Audit 2026-06-04.md`.
- Main gap found: Controls Admin inventory exists in WPB, but runtime promotion is incomplete beyond combined `customCss` and `bundleCartLineMessaging`.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/issues-prod/preview-bundle-gate-1.md`
- `docs/guided-tour-reference.md`

## Phases Checklist
- [x] Phase 1: Root-cause current visibility modal and create-tour wiring
- [x] Phase 2: Add failing tests/specs for missed behavior
- [x] Phase 3: Implement visibility modal/session and guided-tour fixes
- [x] Phase 4: Chrome verification for edit/load and create workflow
- [x] Phase 5: EB edit/settings deep parity audit and gap documentation
- [ ] Phase 6: Commit relevant changes
