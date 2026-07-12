# Test Spec: Pricing Enable Default Rule
**Spec ID:** pricing-enable-default-rule  **Created:** 2026-07-12

## Purpose
Ensure discount pricing can be enabled from a saved empty-rule state and still presents a configurable current-shape default rule.

## Test Cases
### PricingEnableRules
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Enable pricing with no rules | `enabled=true`, `rules=[]`, `method=percentage_off` | One default percentage rule is returned | Lets configure pages expose rule fields after enabling |
| 2 | Disable pricing with no rules | `enabled=false`, `rules=[]`, `method=percentage_off` | Empty rules remain empty | Does not fabricate inactive rules |
| 3 | Enable pricing with existing rules | `enabled=true`, existing rule array | Existing rules are preserved | Avoids replacing merchant data |

## Acceptance Criteria
- [ ] All listed test cases pass
