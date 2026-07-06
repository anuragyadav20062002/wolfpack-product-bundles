# Test Spec: FPB Mobile Additional Offers Pulse
**Spec ID:** fpb-mobile-additional-offers-pulse  **Created:** 2026-07-06

## Purpose
Verify the mobile summary footer uses the same additional-offers pulse trigger for Standard and Classic when add-on tiers are mixed between eligible and locked states.

## Test Cases
### MobileSummaryAdditionalOffersPulse
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Classic paid step has one eligible add-on tier and one locked tier | `designPreset: CLASSIC`, current paid step, mixed `addonStates` | `shouldPulse: true`, message `Additional offers to be unlocked` | Matches EB Classic mobile footer state |
| 2 | Standard paid step has one eligible add-on tier and one locked tier | `designPreset: STANDARD`, current paid step, mixed `addonStates` | `shouldPulse: true` | User requested same logic for Standard |
| 3 | All tiers are eligible | `designPreset: CLASSIC`, all `addonStates.isEligible: true` | `shouldPulse: false` | No additional locked offer remains |
| 4 | Current step is the add-on/free-gift step | `currentStepIndex` points to `isFreeGift: true` step | `shouldPulse: false` | Pulse only appears before the add-on step |
| 5 | Non-Standard/Classic preset | `designPreset: COMPACT`, mixed `addonStates` | `shouldPulse: false` | Scope remains Standard and Classic only |

## Acceptance Criteria
- [x] Focused unit test covers the Standard and Classic trigger contract.
- [x] The mobile badge phase update preserves the existing summary tray node.
- [x] Browser proof confirms Classic and Standard badge styling transitions smoothly.
