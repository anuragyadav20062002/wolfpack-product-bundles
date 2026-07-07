# Test Spec: FPB Discount Display Toggles
**Spec ID:** fpb-discount-display-toggles  **Created:** 2026-07-04

## Purpose
Ensure full-page bundle summary surfaces respect the saved Discount Messaging and Progress Bar display toggles.

## Test Cases
### SummarySurfaces
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Sidebar discount messaging disabled | Pricing enabled, next discount rule, `showDiscountMessaging: false` | Sidebar does not format or render the discount message | Covers Classic C05 desktop parity |
| 2 | Compact mobile progress disabled | Pricing enabled, compact mobile tray, `showDiscountProgressBar: false` | Mobile summary does not request discount progress rendering | Covers Classic C05 mobile parity |
| 3 | Full-page pricing messages disabled | Pricing enabled, `pricing.messages.showDiscountMessaging: false` | Runtime config keeps `showDiscountMessaging` false | Prevents saved Admin toggle from being re-enabled |
| 4 | First discount tier reached with a higher tier remaining | Pricing enabled, quantity rule `1` achieved, quantity rule `6` still locked | Sidebar renders the next rule's progress message and variables | Matches multi-tier adaptive messaging |

## Acceptance Criteria
- [x] All listed test cases pass.
