# Test Spec: Create Edit Guided Tour
**Spec ID:** create-edit-guided-tour  **Issue:** [create-edit-guided-tour-rebuild-1]  **Created:** 2026-06-04

## Purpose
Verify the first-load guided tour works on the current edit/configure screens opened by the create flow, instead of depending on obsolete wizard screen anchors.

## Test Cases
### CreateEditGuidedTourContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB first-load create tour | PPB configure route with `mode=create&first_load=true` | Route passes `PPB_TOUR_STEPS`, `enabled={loaderData.showFirstLoadTour === true}`, and `onStepChange={handleGuidedTourStepChange}` | Section switching happens before anchor lookup |
| 2 | FPB first-load create tour | FPB configure route with `mode=create&first_load=true` | Route passes `FPB_TOUR_STEPS`, `enabled={loaderData.showFirstLoadTour === true}`, and `onStepChange={handleGuidedTourStepChange}` | Section switching happens before anchor lookup |
| 3 | Step metadata | `tourSteps.ts` | Every PPB/FPB step includes `sectionId` matching the edit screen section that mounts its `data-tour-target` | No legacy wizard dependency for create flow |
| 4 | Rebuilt tour measurement | `BundleGuidedTour.tsx` | Component calls `onStepChange(step, currentStep)` before resolving the target, retries target lookup, scrolls into view, waits for stable rect, and cleans highlighted styles | Prevents missing-target and jitter regressions |
| 5 | Readiness step | PPB/FPB route source | `handleGuidedTourStepChange` opens readiness only when `step.targetSection === "fpb-readiness-score"` | Readiness target exists outside active section panels |

## Acceptance Criteria
- [x] All listed contract tests pass
- [x] Focused ESLint passes on touched files
- [x] Guided tour component no longer depends on wizard-only target metadata for current create flow
