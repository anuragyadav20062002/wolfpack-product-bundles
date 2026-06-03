# Issue: Create Flow Uses Edit Configure Screen
**Issue ID:** create-flow-edit-screen-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-03
**Last Updated:** 2026-06-04 00:07

## Overview
Scrap the bundle creation wizard page and flow after type selection. Keep the `/app/bundles/create` entry screen for choosing Product Page vs Full Page bundle, collect only the bundle name in a modal, create the bundle, then open the existing edit/configure screen in create mode. The create mode must trigger the first-install guided tour only for eligible first-time merchants creating their first bundle.

## Progress Log
### 2026-06-03 23:26 - Requirements and architecture
- Captured the requested create-flow replacement scope.
- Confirmed prior docs still route creates into the old create-configure wizard and must be superseded.
- Next: implement the create entry route, redirect into existing FPB/PPB configure pages with create-mode/first-load signal, and e2e test in Chrome.

### 2026-06-03 23:44 - Create flow implementation
- Replaced the create route UI with type-card selection and a bundle-name-only modal.
- Removed description forwarding from the create route and removed generated description text from the create handler.
- Updated create redirects to use the existing FPB/PPB configure routes with `mode=create`.
- Added first-load guided tour enablement to the existing FPB/PPB configure routes.
- Updated app navigation docs and TDD specs.

### 2026-06-04 00:07 - Validation and Chrome e2e
- Unit tests passed: `npx jest tests/unit/routes/create-bundle-wizard.test.ts tests/unit/lib/bundle-navigation.test.ts --runInBand`.
- Lint passed with warnings only: `npx eslint --max-warnings 9999 ...` on modified TS/TSX files.
- Build passed: `npm run build`.
- Chrome e2e PPB passed: type selection -> name-only modal -> save -> existing Product Page configure route with `mode=create`.
- Chrome e2e FPB passed: type selection -> name-only modal -> save -> existing Full Page configure route with `mode=create`.
- Forced `first_load=true` on the created FPB configure route opened the guided tour overlay on the existing edit/configure screen.

## Related Documentation
- `docs/create-flow-edit-screen/01-requirements.md`
- `docs/create-flow-edit-screen/02-architecture.md`
- `docs/first-load-min-config-tour/01-requirements.md`
- `docs/first-load-min-config-tour/02-architecture.md`

## Phases Checklist
- [x] Phase 1: Requirements and architecture
- [x] Phase 2: Create entry UI replacement
- [x] Phase 3: Existing configure screen create-mode redirect
- [x] Phase 4: Remove/supersede old wizard flow references
- [x] Phase 5: Automated checks and Chrome e2e
