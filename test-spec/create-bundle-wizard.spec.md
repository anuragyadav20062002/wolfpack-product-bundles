# Test Spec: Create Bundle Wizard

**Spec ID:** create-bundle-wizard
**Issue:** [first-load-min-config-tour-1]
**Created:** 2026-05-22

## Purpose
Document the create bundle wizard action behavior, including the first-load guided tour redirect signal that opens the minimum-configuration tour after a merchant creates a bundle.

## Test Cases

### CreateBundleWizardAction

| # | Scenario | Input | Expected Output | Notes |
|---|----------|-------|-----------------|-------|
| 1 | Successful create for first-install-eligible shop | Valid product-page bundle form with `showFirstLoadTour: true` | 302 redirect to `/app/bundles/create/configure/:id?first_load=true` | Ensures first-load tour can open only for eligible new installs |
| 2 | Successful create for ineligible shop | Valid product-page bundle form with `showFirstLoadTour: false` | 302 redirect to `/app/bundles/create/configure/:id` | Ensures existing shops do not receive the first-load query |
| 3 | Missing bundle name | Empty `bundleName` | 400 JSON error | Existing validation path |
| 4 | Subscription limit | Guard returns limit error | 403 JSON error | Existing guard path |
| 5 | Form forwarding | Valid full-page bundle form | `handleCreateBundle` receives original form data | Preserves handler contract |

## Acceptance Criteria
- [x] All listed test cases pass.
- [x] Redirect includes `first_load=true` only when the create handler marks the shop eligible.
