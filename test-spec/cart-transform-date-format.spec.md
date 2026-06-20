# Test Spec: Cart Transform Date Format
**Spec ID:** cart-transform-date-format  **Created:** 2026-06-21

## Purpose
Prevent server/client hydration drift from locale-dependent cart transform bundle dates.

## Test Cases
### formatCartTransformDate
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Deterministic date display | `2026-06-05T18:30:00.000Z` | `6/5/2026` | Uses fixed locale and UTC timezone |
| 2 | Missing date | `null` | empty string | Keeps table cell blank |
| 3 | Invalid date | `not-a-date` | empty string | Avoids rendering invalid dates |

## Acceptance Criteria
- [ ] All listed test cases pass
