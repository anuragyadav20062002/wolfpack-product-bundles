# Test Spec: PPB Auto-Next Rule Decision
**Spec ID:** ppb-auto-next-rules  **Created:** 2026-06-19

## Purpose
The Product Page Bundle (PPB) bottom-sheet widget previously modelled auto-next
through category toggles only. The feature now also mirrors full-page step-level
auto-next when step conditions are present and the step-level toggle is
explicitly enabled.

This spec covers the pure decision helper `shouldAutoAdvanceProductPageStep`
that gates `_autoProgressBottomSheet`. The helper mirrors
`shouldAutoAdvanceFullPageStep` (FPB) so both widgets share the same opt-in
contract.

## Test Cases

### shouldAutoAdvanceProductPageStep
| # | Scenario | Input | Expected Output | Notes |
|---|----------|-------|-----------------|-------|
| 1 | Step-rule mode without auto-next enabled | `{ quantity: 1, step: { conditionType, conditionOperator, conditionValue } }` | `false` | Missing `autoNextStepOnConditionMet` keeps step-rule mode from auto-advancing. |
| 2 | Step-rule mode with auto-next enabled | `{ quantity: 1, step: { conditionType, conditionOperator, conditionValue, autoNextStepOnConditionMet: true } }` | `true` | Step-level opt-in is now honored for non-category rule flows. |
| 3 | Category-rule mode, flag off  | `{ quantity: 1, step: { categories: [{ conditions: [...], autoNextStepOnConditionMet: false }] } }` | `false` | Merchant explicitly opted out — must not advance. |
| 4 | Category-rule mode, flag on   | `{ quantity: 1, step: { categories: [{ conditions: [...], autoNextStepOnConditionMet: true  }] } }` | `true`  | Merchant opted in — should advance. |
| 5 | Removal (quantity === 0)      | `{ quantity: 0, step: { conditionValue: 1, conditionType: 'quantity', conditionOperator: 'greater_than_or_equal_to', autoNextStepOnConditionMet: true, categories: [{ conditions: [...], autoNextStepOnConditionMet: true }] } }` | `false` | Decreasing quantity must never auto-advance — prevents jumpy UX. |
| 6 | Mixed category flags, selected product belongs to opted-out category | `{ quantity: 1, productId: "101", step: { categories: [{ products: [{ id: "101" }], autoNextStepOnConditionMet: false }, { products: [{ id: "202" }], autoNextStepOnConditionMet: true }] } }` | `false` | Auto-next is scoped to the category that contains the selected product. |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] `_autoProgressBottomSheet` is only invoked from `updateProductSelection`
      when this helper returns `true`
- [ ] PPB widget bundle is rebuilt and `WIDGET_VERSION` bumped (PATCH) so
      storefronts pick up the change after deploy
