# Test Spec: Bundle Edit Visibility Modal and Create Guided Tour
**Spec ID:** bundle-edit-visibility-tour-audit  **Issue:** [bundle-edit-visibility-tour-audit-1]  **Created:** 2026-06-04

## Purpose
Ensure the EB-style visibility modal opens once per browser session on edit configure pages only when Bundle Visibility is pending, while create-mode guided tours remain unblocked by the visibility modal.

## Test Cases
### `useEnablePreviewGate`
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Pending visibility and modal not shown this session | `shouldAutoShowOnMount(true, false)` | `true` | Trigger is status pending, not app embed state |
| 2 | Visibility not pending | `shouldAutoShowOnMount(false, false)` | `false` | No modal when section is optimised |
| 3 | Already shown this session | `shouldAutoShowOnMount(true, true)` | `false` | Session-only once-per-bundle behavior |

### Configure Routes
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 4 | PPB edit page pending status | PPB route source | `autoShowOnMount: configureMode === "edit" && isBundleVisibilityPending` | Modal follows status badge |
| 5 | FPB edit page pending status | FPB route source | `autoShowOnMount: configureMode === "edit" && isBundleVisibilityPending` | Modal follows status badge |
| 6 | Setup CTA from modal | Configure route source | `onSetupVisibility` calls `setActiveSection("bundle_visibility")` | Merchant lands on Bundle Visibility section |
| 7 | Create guided tour remains active | Configure route source | `BundleGuidedTour` enabled by `loaderData.showFirstLoadTour === true` and modal excludes create mode | Tour and visibility modal do not compete |

## Acceptance Criteria
- [x] Focused hook and route contract tests pass
- [x] Chrome edit flow shows modal once per session for Pending visibility
- [x] Chrome create route with `mode=create&first_load=true` does not show the edit visibility modal; source contract keeps `BundleGuidedTour` enabled from loader data
