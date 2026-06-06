# FPB Add-ons and Messages Email Capture EB Parity Design

## Scope
This spec covers Full Page / Landing Page bundles only.

The goal is to make the FPB Admin sections `Free Gift & Add Ons` and `Messages` match EB visually and behaviorally, then prove the same saved config reaches the storefront. Email is in scope as capture behavior only: the app must collect recipient email/date/message data and preserve it in the storefront/cart data path, but it must not send outbound email until a delivery provider is chosen.

## Business Requirement
Merchants configuring Landing Page bundles need EB-compatible controls for add-ons, footer add-on messaging, gift messages, and email capture. The controls must behave like intentional configuration, not auto-save UI. Every toggle, field, product picker, tier change, and email capture option must dirty the contextual SaveBar, save through the existing configure action, and discard cleanly.

## Product Requirements
- `Free Gift & Add Ons` renders EB's three-card structure:
  - `Add-Ons and Gifting Step`
  - `Add-Ons with Bundles`
  - `Footer Messaging`
- `Messages` renders EB's message product and message option controls, including email capture controls.
- Email capture includes recipient email and delivery/date-related storefront capture where EB evidence supports it.
- `Customize Emails` is represented as EB parity UI/capture state only. It must not imply real outbound delivery.
- SaveBar opens on every control change in both sections.
- Save stores direct `personalizationData` for FPB.
- Discard restores the last saved Add-ons and Messages state.
- Storefront reads `personalizationData.addonProducts` and `personalizationData.giftMessage`.
- Storefront message validation blocks add-to-cart when required message/email data is missing.
- Cart payload includes message, sender, recipient, recipient email, and email/date capture properties when configured and entered.

## Architecture
The FPB configure route remains the Admin source of truth. It will continue building a `FormData` payload in `handleSave()`, but the draft shape must expand so `giftMessage.isEmailEnabled` and capture fields serialize directly under `personalizationData.giftMessage`.

The server persistence boundary remains the existing `saveBundle` handler and bundle metafield sync. No legacy field fallback or compatibility shim will be added. The storefront widget continues to read direct `personalizationData` from the bundle config and renders add-on/message UI from that contract.

## Data Contract
Add-ons save shape follows EB's direct structure:

```json
{
  "personalizationData": {
    "isPersonalizationEnabled": true,
    "personalizeStepText": "Add On",
    "personalizePageSubtext": "",
    "stepImage": null,
    "addonProducts": {
      "isEnabled": true,
      "title": "Add ON",
      "type": "MULTI_TIER",
      "tiers": [],
      "multiLangData": {},
      "addonsMessaging": {
        "isEnabled": true,
        "tier1": {
          "ineligibleState": "",
          "eligibleState": ""
        }
      }
    }
  }
}
```

Messages save shape follows EB's direct structure plus email capture flags:

```json
{
  "giftMessage": {
    "isGiftMessageEnabled": true,
    "isSenderAndRecipientNameEnabled": true,
    "giftMessageCharacterLimit": "120",
    "isGiftMessageMandatory": true,
    "isVideoMessageEnabled": false,
    "isEmailEnabled": true,
    "messageProduct": {
      "isMessageProductEnabled": true,
      "status": "unlisted",
      "product": null
    }
  }
}
```

The storefront cart message line may include private properties for:
- `_gift_message`
- `_gift_from`
- `_gift_to`
- `_gift_recipient_email`
- `_gift_delivery_date`

Property names will be finalized against fresh EB evidence before implementation.

## Admin UI
Use Polaris web components first. Custom HTML/CSS is allowed only for EB-specific switch/card treatment that Polaris cannot reproduce closely enough.

The `Free Gift & Add Ons` section keeps EB's card order and control grouping. The `Add-Ons with Bundles` toggle must use the same dirty/save semantics as every other control. Tier add/delete, selected products, variant display, discount basis, eligibility value, discount value, tier rules, and footer message fields all mark dirty.

The `Messages` section includes:
- Enable Messages toggle.
- Message product preview row with resource picker edit action.
- Sender and recipient fields toggle.
- Mandatory message toggle.
- Message character limit toggle and field.
- Send message through email toggle.
- Recipient email/date capture controls for storefront behavior.
- Customize Emails visual entry, stored only as capture metadata if EB evidence reveals a safe static contract.

## Storefront Behavior
The FPB widget renders add-ons from `personalizationData.addonProducts` and message UI from `personalizationData.giftMessage`.

When email is enabled, the message UI also captures recipient email and delivery/date-related values. Required validation must show EB-matched validation text and block add-to-cart if the enabled required inputs are empty or invalid.

When the shopper adds the bundle to cart, the message product line includes the entered message capture properties. No network call sends email.

## Testing
TDD is required.

Create `test-spec/fpb-addons-messages-email-capture-parity.spec.md`.

Automated coverage:
- Admin contract tests for section labels, EB card markers, switch/control wiring, and SaveBar dirty dependencies.
- Route/save tests for `personalizationData.giftMessage.isEmailEnabled`.
- Metafield/config tests proving direct `personalizationData` is emitted.
- Widget tests for email capture rendering, validation, and cart properties.

Manual verification:
- Chrome DevTools EB audit before implementation for current Add-ons and Messages email controls.
- Chrome DevTools WPB Admin screenshot comparison after implementation.
- Chrome DevTools WPB storefront desktop and mobile validation.
- Direct saved payload or DB/metafield proof after save.

## Non-Goals
- No outbound email delivery.
- No delivery provider selection.
- No email template editor beyond safe EB-static capture UI.
- No PPB changes.
- No unrelated Admin route refactor.
- No backwards compatibility shims.

## Open Risks
- Existing EB documentation only captured email UI/runtime as previously excluded scope. Fresh EB Chrome evidence is required before implementing exact email field/property names.
- FPB route file is large, so implementation should avoid broad rewrites and may extract small helpers only if needed to make TDD possible.
- Widget JS/CSS changes require widget build and asset minification checks.
