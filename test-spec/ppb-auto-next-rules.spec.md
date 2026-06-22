# Test Spec: PPB Auto-Next Rule Decision
**Spec ID:** ppb-auto-next-rules  **Created:** 2026-06-19

## Purpose
The Product Page Bundle (PPB) bottom-sheet widget was auto-advancing to the
next step on every successful product selection, regardless of whether the
merchant had enabled the "Auto Next When rule is met" toggle on the category
rule. This violated merchant intent: when the toggle is off, the user must
click "Next" manually.

This spec covers the pure decision helper `shouldAutoAdvanceProductPageStep`
that gates `_autoProgressBottomSheet`. The helper mirrors
`shouldAutoAdvanceFullPageStep` (FPB) so both widgets share the same opt-in
contract.

## Test Cases

### shouldAutoAdvanceProductPageStep
| # | Scenario | Input | Expected Output | Notes |
|---|----------|-------|-----------------|-------|
| 1 | Step-rule mode (no categories) | `{ quantity: 1, step: { conditionType, conditionOperator, conditionValue } }` | `false` | Auto-next opt-in is only modelled on category rules (matches FPB). |
| 2 | Category-rule mode, flag off  | `{ quantity: 1, step: { categories: [{ conditions: [...], autoNextStepOnConditionMet: false }] } }` | `false` | Merchant explicitly opted out — must not advance. |
| 3 | Category-rule mode, flag on   | `{ quantity: 1, step: { categories: [{ conditions: [...], autoNextStepOnConditionMet: true  }] } }` | `true`  | Merchant opted in — should advance. |
| 4 | Removal (quantity === 0)      | `{ quantity: 0, step: { categories: [{ conditions: [...], autoNextStepOnConditionMet: true  }] } }` | `false` | Decreasing quantity must never auto-advance — prevents jumpy UX. |
| 5 | Mixed category flags, selected product belongs to opted-out category | `{ quantity: 1, productId: "101", step: { categories: [{ products: [{ id: "101" }], autoNextStepOnConditionMet: false }, { products: [{ id: "202" }], autoNextStepOnConditionMet: true }] } }` | `false` | Auto-next is scoped to the category that contains the selected product. |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] `_autoProgressBottomSheet` is only invoked from `updateProductSelection`
      when this helper returns `true`
- [ ] PPB widget bundle is rebuilt and `WIDGET_VERSION` bumped (PATCH) so
      storefronts pick up the change after deploy
