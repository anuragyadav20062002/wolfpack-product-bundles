# Test Spec: FPB Progress Bar Parity
**Spec ID:** fpb-progress-bar-parity  **Created:** 2026-06-12

## Purpose
Keep FPB discount progress rendering aligned with the storefront contract: discount copy is rendered once, and the progress bar owns a stable reserved area below it for simple and step-based modes.

## Test Cases
### SharedDiscountProgressRenderer
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Sidebar/mobile progress uses external discount copy | Progress data with message and `messagePlacement: external` | Progress HTML renders the bar without duplicating the message text | Keeps the bar below the host discount message |

## Acceptance Criteria
- [ ] All listed test cases pass
