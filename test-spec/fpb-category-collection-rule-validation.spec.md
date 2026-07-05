# Test Spec: FPB Category Collection Rule Validation
**Spec ID:** fpb-category-collection-rule-validation  **Created:** 2026-07-02

## Purpose
Verify Standard FPB category rules count products loaded from category collections, so add-on/free-gift navigation is not blocked after the visible category rule is satisfied.

## Test Cases
### FullPageCategoryValidation
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Collection product satisfies category amount rule | Category has an amount rule and a collection handle; selected product came from that collection | `validateStep(0)` returns `true` | Prevents Add On step from staying locked while eligibility summary is shown |

## Acceptance Criteria
- [ ] Focused widget unit test passes.
- [ ] Raw widget source syntax check passes after implementation.
