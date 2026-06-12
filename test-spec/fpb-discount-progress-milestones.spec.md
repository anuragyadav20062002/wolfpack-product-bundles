# Test Spec: FPB Discount Progress Milestones
**Spec ID:** fpb-discount-progress-milestones  **Created:** 2026-06-12

## Purpose
Verify FPB discount progress milestone data exposes real tier labels and discount subtitles for the mobile footer progress bar when merchant-specific tier text is absent.

## Test Cases
### FullPageStepFooterMethods.getDiscountProgressMilestones
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Quantity rule without custom tier text | Quantity threshold 3, percentage discount 10 | Milestone title `3 Pack`, subTitle `Save 10%` | Uses actual pricing rule values |
| 2 | Custom tier text configured | Rule has `tierText` and `tierSubtext` | Configured values are preserved | Merchant copy wins over generated fallback |

## Acceptance Criteria
- [ ] Milestone fallback title uses the quantity threshold as a pack label.
- [ ] Milestone fallback subtitle uses the actual discount value from the pricing rule.
- [ ] Configured merchant tier text still takes precedence.
