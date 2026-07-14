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
| 4 | Seed messages for enabled pricing | seeded percentage rule with no messages | Rule message defaults include EB-style progress and success copy | Prevents storefront fallback copy |
| 5 | Preserve merchant messages | existing rule message map | Existing progress/success strings are returned unchanged | Avoids replacing merchant data |
| 6 | Later percentage/fixed tier defaults | `ruleIndex=1` | Default copy starts with `Congrats! Add {{discountConditionDiff}} more product(s)` | Matches EB Product List tier behavior |

## Acceptance Criteria
- [ ] All listed test cases pass
