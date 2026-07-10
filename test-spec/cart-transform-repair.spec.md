# Test Spec: Cart Transform Repair Script
**Spec ID:** cart-transform-repair  **Created:** 2026-07-10

## Purpose
Add a narrow app-context repair script that can dry-run or apply `CartTransformService.completeSetup` for installed shops.

## Test Cases
### CartTransformRepair
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Disabled by default | no env flags | mode `disabled`; no shop scan | Prevents accidental prod mutation |
| 2 | Ambiguous flags rejected | dry-run and apply both true | throws | Avoids guessing operator intent |
| 3 | Dry run | dry-run true | scans installed shops; does not call setup | Uses app DB as target source |
| 4 | Apply | apply true | gets app-context Admin and calls setup for each installed shop | Repairs CartTransform and runtime secret |
| 5 | Apply failures | one setup failure | records failure and continues | One bad shop must not block scan |

## Acceptance Criteria
- [x] All listed test cases pass.
- [x] Script uses only `WPB_CART_TRANSFORM_REPAIR_DRY_RUN` and `WPB_CART_TRANSFORM_REPAIR_APPLY`.
- [x] Apply mode excludes uninstalled shops.
