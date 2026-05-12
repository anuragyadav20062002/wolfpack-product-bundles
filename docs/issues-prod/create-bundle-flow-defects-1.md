# Issue: Create Bundle Flow Defects

**Issue ID:** create-bundle-flow-defects-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-11
**Last Updated:** 2026-05-11 18:44

## Overview
Fix defects found during Chrome DevTools QA of the revamped Create Bundle workflow before starting the Edit Bundle workflow migration.

Confirmed issues include lost Step 04 category filters after wizard completion, unreliable Step Setup rule creation, Polaris Web Components accessibility warnings, and mobile layout issues in the wizard.

## Progress Log

### 2026-05-11 13:54 - Starting defect remediation
- Created the issue file before code changes per repository workflow.
- Confirmed this is a bug-fix/debugging task, so the feature pipeline is not required.
- Next: add failing coverage for the create wizard step DB ID handoff and filter persistence path.

### 2026-05-11 14:01 - Fixed Step 02 to Step 04 persistence handoff
- Added route action coverage for generated BundleStep DB IDs returned by `saveConfig`.
- Added route action coverage for selected collection persistence on created steps.
- Updated the create configure action to return `{ tempId, dbId }` mappings after step create/update.
- Updated the create wizard client state to merge returned DB IDs before later wizard steps submit per-step settings.
- Persisted selected step collections from Step 02 so category filters have the collection context required by the widget.
- Aligned the create-flow filter editor with the collection-backed filter shape used by edit flows and the FPB widget.
- Removed the unsupported create-flow "Pre-select all products on this step" control because it had no backing persistence/widget behavior.
- Added scoped accessibility-label fixes for create-flow Polaris web components and improved mobile stepper overflow behavior.
- Verification: `npx jest tests/unit/routes/create-bundle-configure-action.test.ts --runInBand --coverage=false`.

### 2026-05-11 14:13 - Fixed Step Setup rule state reliability and verified targeted checks
- Refactored Step Setup rule add/remove/update handlers to use functional `setSteps` updates keyed by the active step index, avoiding stale `currentStep` closures during wizard interactions.
- Kept the Add Rule control on Polaris Web Components (`s-button`) after confirming the rule state path works with keyboard activation in Chrome DevTools.
- Re-ran targeted create configure action coverage; all tests passed.
- Re-ran scoped ESLint for the touched TypeScript files with the repository warning threshold; command completed with warnings only.
- Chrome DevTools note: a forced reload of the embedded admin tab triggered a Cloudflare Turnstile challenge, so remaining live pointer verification needs a fresh authenticated app tab.

### 2026-05-11 18:36 - Started dirty-navigation optimization
- User requested faster Next behavior by skipping save operations when the current wizard page is unchanged.
- Added fast-track feature-pipeline docs for the scoped create wizard dirty-navigation optimization.
- Edit-flow routing shift noted for the next phase: edit entry should open the same configure wizard for a uniform create/edit experience.
- Next: add focused tests for clean-vs-dirty Next behavior, then implement page payload baselines in the create configure route.

### 2026-05-11 18:44 - Completed dirty-navigation optimization
- Added payload snapshot helpers and submit-decision coverage for create wizard dirty navigation.
- Added page-scoped baselines for Configuration, Pricing, Assets, and Pricing Tiers.
- Updated Next behavior so clean pages advance immediately while dirty pages keep the existing save-then-advance behavior.
- Preserved the first Configuration save when steps do not yet have DB IDs.
- Verification: `npx jest tests/unit/lib/bundle-navigation.test.ts tests/unit/routes/create-bundle-configure-action.test.ts tests/unit/routes/create-bundle-wizard.test.ts --runInBand --coverage=false`.
- Verification: `npx eslint --max-warnings 9999 app/lib/bundle-navigation.ts app/routes/app/app.dashboard/route.tsx 'app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx' tests/unit/lib/bundle-navigation.test.ts tests/unit/routes/create-bundle-configure-action.test.ts tests/unit/routes/create-bundle-wizard.test.ts` completed with warnings only.

## Related Documentation
- `CLAUDE.md`
- `docs/issues-prod/create-bundle-wizard-1.md`
- `docs/issues-prod/figma-ui-alignment-1.md`

## Phases Checklist
- [x] Phase 1: Add failing tests for confirmed create wizard persistence defects
- [x] Phase 2: Fix Step 02 save response/client state so later wizard steps retain DB step IDs
- [x] Phase 3: Fix Step Setup rule creation reliability
- [x] Phase 4: Reduce Polaris Web Components warnings and hydration mismatch where scoped to create flow
- [ ] Phase 5: Verify in Chrome DevTools and run lint/tests
- [x] Phase 6: Add dirty-navigation optimization for unchanged wizard pages
