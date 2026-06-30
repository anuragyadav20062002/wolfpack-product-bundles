# Test Spec: FPB Summary Current-Step Removal
**Spec ID:** fpb-summary-current-step-removal  **Created:** 2026-07-01

## Purpose
Match EB summary behavior where a selected product can only be removed while the shopper is on that product's step.

## Test Cases
### SummaryRemovalState
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Current-step product | `currentStepIndex=1`, item `stepIndex=1` | Removal allowed and no blocked toast copy | Desktop sidebar and mobile expanded footer both use this state. |
| 2 | Other-step product | `currentStepIndex=1`, item `stepIndex=0`, step name `Step A` | Removal blocked with `Remove This Product From Step A` | EB shows the trash affordance disabled and toasts this copy on click. |
| 3 | Add-on step product while shopper is elsewhere | `currentStepIndex=0`, item `stepIndex=2`, step name `Add On` | Removal blocked with `Remove This Product From Add On` | Covers add-on/free-gift step generically through the step name. |

## Acceptance Criteria
- [x] Summary removal state is computed from the item's step and current step.
- [x] Blocked removal toast copy uses the target step name.
- [x] Desktop and mobile summary remove handlers share the same removal state.
