# Test Spec: FPB Classic Mobile Additional Offers Pill
**Spec ID:** fpb-classic-mobile-additional-offers-pill  **Created:** 2026-07-06

## Purpose
Verify the Classic mobile summary count pill only enters the additional-offers pulse state when add-on tiers are mixed: at least one tier is eligible and at least one tier remains locked.

## Test Cases
### ClassicMobileAdditionalOffersPulse
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Mixed add-on tiers on a paid step | Classic preset, current paid step, one eligible add-on tier and one locked tier | Pulse state is enabled with the EB-observed message | Matches EB one-selected state |
| 2 | No remaining locked add-on tiers | Classic preset, all add-on tiers eligible | Pulse state is disabled | Matches EB two-selected state |
| 3 | Add-on step itself | Classic preset, current step is the add-on step, mixed tier state | Pulse state is disabled | EB shows this only before the add-on offer surface |
| 4 | Non-Classic preset | Standard preset with mixed tier state | Pulse state is disabled | Keeps the change Classic-scoped |

## Acceptance Criteria
- [ ] All listed test cases pass
