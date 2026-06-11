# Test Spec: FPB Auto Next Rules
**Spec ID:** fpb-auto-next-rules  **Created:** 2026-06-12

## Purpose

Verify FPB storefront auto-next behavior follows the EB rule model: step rules gate completion but do not auto-advance, while category rules may auto-advance only when the category explicitly enables auto-next.

## Test Cases

### FullPageSelectionNavigation
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Step rule is satisfied after selection | Step has `conditionType`, `conditionOperator`, `conditionValue`; selected quantity is positive | Auto-next decision is `false` | Step rules have no EB auto-next option |
| 2 | Category rule is satisfied but auto-next disabled | Category has `conditions`, `autoNextStepOnConditionMet = false`; selected quantity is positive | Auto-next decision is `false` | Honors category checkbox off |
| 3 | Category rule is satisfied and auto-next enabled | Category has `conditions`, `autoNextStepOnConditionMet = true`; selected quantity is positive | Auto-next decision is `true` | Honors category checkbox on |
| 4 | Product was removed | Category has auto-next enabled; selected quantity is zero | Auto-next decision is `false` | Removals never auto-advance |

## Acceptance Criteria

- [ ] All listed test cases pass.
- [ ] Step-rule FPB storefront selections do not auto-next.
- [ ] Category-rule FPB storefront selections auto-next only when `autoNextStepOnConditionMet` is true.
