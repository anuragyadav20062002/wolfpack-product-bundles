# Test Spec: Create Flow Uses Edit Configure Screen

**Spec ID:** create-flow-edit-screen  **Issue:** [create-flow-edit-screen-1]  **Created:** 2026-06-03

## Purpose
Verify the create bundle route no longer routes merchants into the obsolete create-configure wizard and no longer creates or forwards a description field.

## Test Cases

### CreateBundleEntryAction
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB create for first-install eligible shop | `bundleName`, `bundleType=product_page`, handler returns PPB edit route and `showFirstLoadTour=true` | 302 to `/app/bundles/product-page-bundle/configure/:id?mode=create&first_load=true` | Guided tour signal is preserved |
| 2 | FPB create for ineligible shop | `bundleName`, `bundleType=full_page`, handler returns FPB edit route and `showFirstLoadTour=false` | 302 to `/app/bundles/full-page-bundle/configure/:id?mode=create` | No guided tour query |
| 3 | Handler error | Handler returns 400 | 400 JSON error | Existing error path remains |
| 4 | Subscription limit | Handler returns 403 | 403 JSON error | Existing limit path remains |
| 5 | Description omission | Valid create form | `handleCreateBundle` receives no `description` field and create does not write bundle description | Create UI and payload do not collect description |

## Acceptance Criteria
- [ ] All listed test cases pass.
