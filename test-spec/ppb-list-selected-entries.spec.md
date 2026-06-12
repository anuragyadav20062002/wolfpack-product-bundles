# Test Spec: PPB List Selected Entries
**Spec ID:** ppb-list-selected-entries  **Issue:** waived  **Created:** 2026-06-11

## Purpose
Move PPB List/Cascade selected-entry traversal to a shared selector before replacing the drawer renderer.

## Test Cases
### SharedSelector
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Selected entries with product data | State with selected products and step product data | Entries include matching product | Used by Cascade drawer |
| 2 | Variant expansion hook | Nested products requiring expansion | Expander is used per step | Matches current Cascade behavior |
| 3 | Missing product | Selected variant not found | Entry skipped | Preserves current behavior |

### CascadeIntegration
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Source integration | Cascade source | Imports and calls shared selector | Avoids heavy widget import in test |

## Acceptance Criteria
- [x] All listed test cases pass
- [ ] Existing PPB live fixture still renders
- [x] No visual change expected
