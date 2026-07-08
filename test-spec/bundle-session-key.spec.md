# Test Spec: Bundle Session Key
**Spec ID:** bundle-session-key  **Created:** 2026-07-08

## Purpose
Ensure runtime bundle instance grouping keys are long enough to avoid accidental same-cart grouping collisions while remaining cart-property safe.

## Test Cases
### BundleSessionKey
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product-page widget generates session key | Call `generateBundleSessionKey()` | 12 uppercase alphanumeric characters | Key is an instance grouping suffix, not a secret |
| 2 | Full-page widget generates session key | Call `generateBundleSessionKey()` | 12 uppercase alphanumeric characters | Matches product-page contract |
| 3 | SDK cart payload carries long session key | Build SDK cart items | `_wolfpackProductBundle:OfferId` matches `{offerId}_{12-char-key}_{index}` | Keeps EB-style grouping shape |

## Acceptance Criteria
- [x] All listed test cases pass
