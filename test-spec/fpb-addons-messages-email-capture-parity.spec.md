# Test Spec: FPB Add-ons and Messages Email Capture Parity
**Spec ID:** fpb-addons-messages-email-capture-parity  **Issue:** [fpb-addons-messages-email-capture-parity-1]  **Created:** 2026-06-05

## Purpose
Prove the missing FPB Admin and storefront email-capture behavior for Add-ons and Messages is represented by RED tests before implementation. Email capture is stored only; no outbound email is sent.

Fresh EB evidence says the Admin email toggle is visible but disabled/non-focusable, `Customize Emails` is visible but disabled and opens no modal, runtime email fields use EB's `gbb*` class names, and cart properties preserve recipient email and delivery choices.

## Test Cases
### AdminParity
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Messages section exposes EB email capture controls | Route source | Source contains email toggle, disabled/non-focusable markers, and Customize Emails entry | Missing Admin email-capture markers only |
| 2 | Customize Emails remains static capture UI | Route source | Source contains disabled Customize Emails affordance and no modal/open handler | EB click produced no modal |

### Storefront
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Widget renders EB email capture fields | Email-enabled giftMessage | Source contains `gbbEmailAddressHTML`, `gbbEmailAddressWrapper`, `gbbVideoMsgEmailField`, `gbbEmailAddressLabelField`, `giftMessageDeliveryInfo`, `gbbScheduleMessageDeliveryHTML`, `gbbScheduleMessageSendNowContainer`, `gbbScheduleMessageSendLaterContainer`, `gbbScheduleMessageDatePicker`, and `gbbEmailValidationError` | Exact names from EB evidence |
| 2 | Required validation blocks missing email | Email enabled + required state | `validateGiftMessageEmailBeforeCart` rejects empty/invalid recipient email and shows `gbbEmailValidationError` | No cart add |
| 3 | Cart line includes captured email values | Shopper enters message/email/date | Gift-message item properties include `Message`, `Recipient Name`, `Sender Name`, `Recipient Email`, `_gbbEmailDeliveryDate`, and `_gbbEmailDeliveryOption` | No outbound email |

## Acceptance Criteria
- [ ] All listed unit tests pass.
- [ ] Direct `personalizationData.giftMessage.isEmailEnabled` save/metafield passthrough is verified during the focused green pass using the existing direct JSON contract.
- [ ] FPB raw widget JS passes `node --check`.
- [ ] Widget build succeeds after version bump.
- [ ] Chrome verifies EB/WPB Admin parity.
- [ ] Chrome verifies WPB storefront desktop and mobile capture behavior.
- [ ] No outbound email provider, delivery job, or send endpoint is added.
