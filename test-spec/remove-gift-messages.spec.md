# Test Spec: Remove Gift Messages
**Spec ID:** remove-gift-messages  **Issue:** [remove-gift-messages-1]  **Created:** 2026-06-05

## Purpose
Prove the app no longer exposes or executes gift/message-product messaging while preserving unrelated discount/pricing message templates.

## Test Cases
### Admin Removal
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB setup nav excludes Messages | Configure route source | No `id: "messages"` child nav entry and no `activeSetupSection === "messages"` render branch | Add-ons remains |
| 2 | FPB save excludes giftMessage personalization | Configure route source | No `giftMessageDraft`, `buildGiftMessageConfigFromDraft`, or `personalizationData.giftMessage` serialization | Direct Add-ons stays |

### Storefront Removal
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB widget has no gift-message runtime | Full-page widget source | No gift-message state, render helper, validation helper, or gift-message cart item builder | Pricing messages stay |
| 2 | PPB widget has no gift-message runtime | Product-page widget source | No gift-message state, render helper, mandatory block, or gift-message cart line item | Product-page bundle still carts paid products |

### Styling Removal
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Widget CSS excludes gift-message classes | Widget CSS sources | No `.fpb-gift-message*` or `.bw-gift-message*` classes | Discount/progress styles stay |

## Acceptance Criteria
- [ ] All listed test cases pass.
- [ ] Widget build runs after widget source/style changes.
- [ ] No outbound deploy is run autonomously.
