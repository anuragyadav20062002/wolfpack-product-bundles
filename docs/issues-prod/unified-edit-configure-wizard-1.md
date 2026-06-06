# Issue: Unified Edit Configure Wizard

**Issue ID:** unified-edit-configure-wizard-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-05-11
**Last Updated:** 2026-05-11 18:44

## Overview
Route existing bundle edit entry points into the revamped create/configure wizard so create and edit use the same admin workflow.

## Progress Log

### 2026-05-11 18:36 - Started routing alignment
- Created issue file before code changes.
- Added fast-track feature-pipeline requirements and architecture docs.
- Next: add route helper coverage, then replace dashboard and create-wizard completion route targets.

### 2026-05-11 18:44 - Completed unified edit-entry routing
- Added `getBundleWizardConfigurePath()` shared navigation helper.
- Updated dashboard Edit and Clone success navigation to route to `/app/bundles/create/configure/:bundleId`.
- Updated create configure saveAssets/saveTiers redirects and clean final navigation to use the same wizard path.
- Updated create wizard route tests to expect the unified wizard route.
- Verification: focused Jest suite passed.
- Verification: scoped ESLint completed with warnings only.

## Related Documentation
- `docs/unified-edit-configure-wizard/01-requirements.md`
- `docs/unified-edit-configure-wizard/02-architecture.md`
- `docs/issues-prod/create-bundle-flow-defects-1.md`

## Phases Checklist
- [x] Phase 1: Add route helper unit coverage
- [x] Phase 2: Route dashboard Edit and Clone success to create/configure wizard
- [x] Phase 3: Route create wizard completion redirects to create/configure wizard
- [x] Phase 4: Run focused tests and lint
