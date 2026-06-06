# Test Spec: FPB Bundle Settings Admin Parity
**Spec ID:** fpb-bundle-settings-admin-parity  **Issue:** [fpb-bundle-settings-admin-parity-1]  **Created:** 2026-06-05

## Purpose
Lock the EB-observed FPB Bundle Settings Admin surface and direct configuration save contract before parity implementation.

## Test Cases
### BundleSettingsSurface
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | EB selling-plan warning and control are present | FPB configure route source | Bundle Settings section includes EB warning and Pre-order & Subscription Integration | Live EB audit 2026-06-05 |
| 2 | WPB-only redirect control is not exposed | FPB configure route source | Bundle Settings section does not contain Redirect to checkout after adding to cart | EB FPB section does not show this control |

### BundleSettingsSaveContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Individual selling plan config saves through FPB | `individualSellingPlanSelection` form data | DB update and bundle product metafield sync receive the same direct config | Mirrors EB direct Bundle Settings config |
| 2 | Quantity validation and product slots keep existing contract | Existing direct settings form data | Metafield sync still receives `validateQuantityPerProduct` and `productSlotsEnabled` | Regression guard |

## Acceptance Criteria
- [x] Surface contract tests fail before implementation and pass after implementation
- [x] Save contract tests fail before implementation and pass after implementation
- [x] Focused route tests pass
- [x] Modified files pass ESLint
- [x] Chrome Admin E2E verifies the Bundle Settings section after hard reload
