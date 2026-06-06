# Issue: Bundle Editor State Service

**Issue ID:** bundle-editor-state-service-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-11
**Last Updated:** 2026-05-11 20:03

## Overview

Design a canonical bundle editor state layer for the edit bundle workflow. The current
code has state helpers, but does not have a single `BundleStateService` that normalizes
loader/API data into a canonical editor state, owns baselines, dirty checks, discard, and
save payload serialization.

## Progress Log

### 2026-05-11 19:37 - Started state-service design assessment

- Created issue file before documenting the state-service design change.
- Audited existing `AppStateService`, bundle hooks, edit routes, and create configure route.
- Ran a parallel explorer to verify whether a canonical bundle state service already exists.
- Next: document options and ask for implementation direction before writing code.

### 2026-05-11 19:37 - Documented design options

- Confirmed there is no canonical `BundleStateService` for edit prepopulation, dirty state, discard, and save serialization.
- Documented the existing partial abstractions and their gaps.
- Added Easy Bundles observations from Chrome page 2 for Bundle Settings / Messages placement.
- Recommended a `useBundleEditorState(loaderData)` hook backed by pure normalizer/serializer functions.
- Files: `docs/edit-bundle-ui-redesign/bundle-editor-state-service-options.md`

### 2026-05-11 19:39 - Added readiness score requirement

- Confirmed the existing `BundleReadinessOverlay` component is currently wired into the create configure route, not the legacy edit route.
- Added edit-flow requirement to keep the readiness score component and add the Easy Bundles-style top score/status treatment in the app body.
- Documented that readiness data should come from the same canonical editor state/readiness model rather than being recalculated in route-local UI.
- Files: `docs/edit-bundle-ui-redesign/bundle-editor-state-service-options.md`, `docs/edit-bundle-ui-redesign/step-setup-image-1-control-map.md`

### 2026-05-11 20:03 - Confirmed readiness interaction

- User confirmed the top readiness score should be a compact header button element with changing status background.
- Clicking the top readiness score opens the existing expandable checklist overlay.
- The existing overlay remains the checklist surface; the top button is a second entry point and status summary.
- Files: `docs/edit-bundle-ui-redesign/bundle-editor-state-service-options.md`, `docs/edit-bundle-ui-redesign/step-setup-image-1-control-map.md`

## Related Documentation

- `docs/edit-bundle-ui-redesign/bundle-editor-state-service-options.md`
- `docs/issues-prod/edit-bundle-ui-redesign-1.md`

## Phases Checklist

- [x] Phase 1: Confirm current state architecture and gaps
- [x] Phase 2: Document design options
- [ ] Phase 3: Choose implementation option with user
- [ ] Phase 4: Implement with tests
- [ ] Phase 5: Verify edit flow in Chrome DevTools
