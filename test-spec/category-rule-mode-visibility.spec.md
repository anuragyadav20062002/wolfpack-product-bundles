# Test Spec: Category Rule Mode Visibility
**Spec ID:** category-rule-mode-visibility  **Created:** 2026-06-12

## Purpose
Ensure Step Setup only exposes the Category rules radio option when the current draft category list has more than one category.

## Test Cases
### ControlDependencies
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Saved or draft state has one category | `categoryCount: 1` | `categoryRulesVisible: false` | Single category cannot use category rules |
| 2 | User adds second category in unsaved draft state | `categoryCount: 2` | `categoryRulesVisible: true` | Draft state should show Category rules immediately |
| 3 | User discards unsaved second category | `categoryCount: 1` | `categoryRulesVisible: false` | Discard reverts draft count and hides Category rules |

### ConfigureRoutes
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB Step Setup renders rule mode options | Current `StepCategory` array | Uses shared dependency helper with `categoryCount: stepCategories.length` | Avoid route-local drift |
| 2 | PPB Step Setup renders rule mode options | Current `StepCategory` array | Uses shared dependency helper with `categoryCount: stepCategories.length` | Same behavior as FPB |

## Acceptance Criteria
- [x] FPB and PPB Step Setup hide Category rules when draft category count is 0 or 1.
- [x] FPB and PPB Step Setup show Category rules when a second category exists in unsaved draft state.
- [x] Discarding the unsaved category hides Category rules again.
- [x] Shared control dependency tests pass.
- [x] Route wiring contract tests pass.
