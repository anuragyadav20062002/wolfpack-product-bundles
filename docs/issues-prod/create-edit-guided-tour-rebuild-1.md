# Issue: Create Edit Guided Tour Rebuild
**Issue ID:** create-edit-guided-tour-rebuild-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 23:43

## Overview
Re-implement the first-load guided tour for the current create flow. The create flow now opens the selected bundle type's edit/configure screen with `mode=create&first_load=true`, so the tour must be route-aware and target the currently mounted edit-screen sections instead of legacy wizard sections.

## Progress Log
### 2026-06-04 23:42 - Plan and scope
- User requested a plan followed by implementation because the create bundle page design moved from the wizard to the edit bundle screen.
- Feature-pipeline skill file was listed but not present locally; continuing with the required stages manually: requirements, file plan, TDD, implementation, verification.
- Requirements:
  - Preserve `mode=create&first_load=true` as the entry trigger.
  - Keep shop-level first-use dismissal so the tour does not show repeatedly.
  - Tour steps must target edit-screen sections and switch the active edit section before measuring anchors.
  - PPB and FPB tours must work with their own section IDs and mounted `data-tour-target` handles.
  - The readiness step must open/anchor the readiness overlay trigger without fighting the bundle visibility pending modal.
- Implementation plan:
  1. Add a focused test spec and contract tests for route-aware tour step metadata and route wiring.
  2. Rebuild `BundleGuidedTour` internals so each step calls a route hook before target lookup, then retries/scrolls/measures after React mounts the section.
  3. Add `sectionId` metadata to PPB/FPB tour steps and remove obsolete wizard tour assumptions from first-load create paths.
  4. Wire FPB/PPB configure routes with `handleGuidedTourStepChange`.
  5. Run focused tests/lint, graphify rebuild, and commit.

### 2026-06-04 23:43 - Implementation and verification
- Added the focused source-contract test for the create edit-screen guided tour.
- Added route-section metadata to PPB and FPB tour steps and removed the obsolete wizard-only tour step export.
- Rebuilt `BundleGuidedTour` around route-aware step changes, delayed target lookup, smooth scroll, stable target measurement, and highlight cleanup.
- Wired PPB and FPB configure routes so guided-tour steps switch the active edit section before target measurement and only open the readiness overlay for the readiness-score step.
- Removed the stale guided-tour mount from the old wizard configure route so `first_load` is handled by the PPB/FPB edit routes.
- Verification completed:
  - `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/create-edit-guided-tour-contract.test.ts`
  - `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/bundle-edit-visibility-modal-and-tour-contract.test.ts tests/unit/routes/create-bundle-wizard.test.ts`
  - `npx eslint --max-warnings 9999 app/components/bundle-configure/BundleGuidedTour.tsx app/components/bundle-configure/tourSteps.ts 'app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx' 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx' 'app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx' tests/unit/routes/create-edit-guided-tour-contract.test.ts`
  - `npm run build`
- Live Chrome verification against local code was not claimed because no running Shopify dev session was confirmed.

### 2026-06-04 23:44 - Ready for commit
- Scoped commit prepared for the guided-tour rebuild, route wiring, test spec, focused tests, and graph metadata.

## Related Documentation
- `docs/issues-prod/create-flow-edit-screen-1.md`
- `docs/issues-prod/bundle-edit-visibility-tour-audit-1.md`
- `docs/guided-tour-reference.md`

## Phases Checklist
- [x] Phase 1: Add failing contract tests and test spec
- [x] Phase 2: Rebuild route-aware guided tour component
- [x] Phase 3: Wire FPB and PPB edit routes
- [x] Phase 4: Run focused verification
- [x] Phase 5: Commit relevant changes
