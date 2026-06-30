---
title: EB Free Gift Add Ons Behavior Spec
type: reference
last_updated: 2026-06-26
source: live EB Admin/storefront audit of yash-wolfpack bundle 2; internal docs/EB Implementation Reference.md; docs/competitor-analysis/14-eb-addon-upsell-analysis.md; docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md
---

# EB Free Gift Add Ons Behavior Spec

This note captures observed Easy Bundle Builder behavior for the Landing Page Bundle Builder / FPB **Free Gift & Add Ons** section, using `yash-wolfpack.myshopify.com` bundle `WPB Research Landing Bundle 2026-05-22` (`bundleId: "2"`) as the live audit target.

## Evidence Scope

- Admin page: Shopify Admin embedded EB app, `Configure Bundle Flow`, `Free Gift & Add Ons`.
- Storefront page: `https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/2?page=addProductsPage1&currentFlow=byob`.
- Runtime proof captured from `window.gbb` on desktop and mobile.
- Help article opened from `How to setup?`: `[Classic] How to provide additional add-ons with different discounts, like gifts, on bundle builders`, updated `27/05/2026`.
- Temporary captures were written under `/private/tmp`; no Chrome screenshots were committed.

## Admin Controls

The section has two independent feature blocks.

### Add-Ons and Gifting Step

This block controls the existence and labelling of the dedicated storefront `Add On` step.

| Control | Observed current value | Behavior |
|---|---:|---|
| Enable checkbox | checked | Creates the `personalizationPage` navigation step when enabled. This is independent of add-on tiers. |
| Multi Language | button | Opens localization for step name/title. Existing evidence shows this is a rich step-language modal, separate from footer messaging localization. |
| Step icon upload | default `addons_step_new.png`; Upload file / Replace controls | Sets `personalizationData.stepImage`, used as the navigation icon. |
| Step Name | `Add On` | Stored as `personalizationData.personalizeStepText`; rendered in the navigation step. |
| Step Title | empty | Stored as `personalizationData.personalizePageSubtext`; rendered as add-on page subtext/title when populated. |

### Add-Ons with Bundles

This block controls add-on tier products, eligibility, discounts, and footer messaging.

| Control | Observed current value | Behavior |
|---|---:|---|
| Enable checkbox | checked | Enables `personalizationData.addonProducts.isEnabled`. Does not by itself prove step creation; step creation belongs to the gifting-step toggle. |
| How to setup? | button | Opens EB help article in chat/article reader. |
| Multi Language | button | Localizes the add-on section/footer messaging surface. Existing evidence shows this compact modal is separate from the step-language modal. |
| Add on Section title | `Add ON ` | Stored as `addonProducts.title`; rendered above add-on tier messaging in desktop footer/sidebar. |
| Tier name | `Tier 1` | Stored as `tiers[].title`; intended storefront-visible tier label, though the current baseline footer showed the section title and tier message rather than the tier title. |
| Delete | button per tier | Removes the tier. Do not infer minimum-tier behavior without rechecking; current baseline has one tier. |
| Add Products / selected count | `1 Selected` | Stores hydrated selected add-on products in `tiers[].selectedAddonProducts`. |
| Display Variants as Individual Products | unchecked | Stored as `tiers[].displayVariantsAsIndividualProducts_addons: false`. |
| Discount Based on | `Bundle Product Quantity` | Stores `eligibilityCondition.type: "QUANTITY"`. The other visible option is `Bundle Value`, stored as `type: "AMOUNT"` in earlier save evidence. |
| Quantity / Amount | `1` | Stored as `eligibilityCondition.value`. |
| Discount on Add-ons | `100` | Stored as `discount: { type: "PERCENTAGE", value: "100" }`; `0` through `100` are accepted by the visible spinbutton constraints. |
| Tier Rules | empty; `Add Tier Rule` button | Adds per-tier rules. Help says tier-level conditions can require a minimum number of products selected from the add-on step; exact saved nested schema remains evidence-limited. |
| Add Add Ons Tier | button | Adds a new independent tier below existing tiers. |
| Footer Messaging > Show Variables | button | Exposes variables for message templates. |
| Footer Messaging > Multi Language | button | Localizes footer messages. |
| Message when rule not met | `Add {{addonsConditionDiff}} more product(s) to claim {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons` | UI uses `{{...}}`; runtime persisted message used `##...##` placeholders and rendered concrete values. |
| Success Message | `Congrats you are eligible for {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons` | Runtime interpolates discount value and unit. |

Runtime proof captured from Chrome on 2026-06-25 also exposed an EB Admin input quirk: using the accessibility `fill_form` path against `Discount on Add-ons` can append digits and persist leading-zero strings such as `"010"` or `"0100"`. The storefront renders those strings literally in message interpolation (`010%`, `0100%`). The safe UI restore path was to use the native spinbutton keyboard behavior: ArrowDown from max `100` normalized the field to clean `99`, then ArrowUp produced `value="100"` and `valuetext="100"` before saving from the top Shopify save bar.

Chrome verification on 2026-06-26 also showed that disabling `Add-Ons and Gifting Step` opens a confirmation dialog titled `Disable Personalization Step` with text `This will also disable Messages. Are you sure you want to disable?`. Confirming that dialog leaves both the gifting-step checkbox and the `Add-Ons with Bundles` checkbox unchecked in Admin. The inverse unsaved state can be reached by enabling `Add-Ons with Bundles` while the gifting step is still off, but restoring the baseline requires turning the gifting-step checkbox back on and saving from the top Shopify savebar.

## Saved Data Contract

Save endpoint from previous network proof:

```text
POST https://prod.backend.giftbox.giftkart.app/api/stepsConfiguration/savePersonalization?shopName=yash-wolfpack.myshopify.com
```

Current live runtime shape:

```json
{
  "personalizationData": {
    "isPersonalizationEnabled": true,
    "personalizeStepText": "Add On",
    "personalizePageSubtext": "",
    "stepImage": "https://d3ks0ngva6go34.cloudfront.net/public/addons_step_new.png",
    "multiLangData": {},
    "addonProducts": {
      "isEnabled": true,
      "title": "Add ON ",
      "type": "MULTI_TIER",
      "tiers": [
        {
          "tierId": "tier31726",
          "title": "Tier 1",
          "selectedAddonProducts": [
            {
              "graphqlId": "gid://shopify/Product/8322626126020",
              "handle": "14k-dangling-obsidian-earrings",
              "title": "14k Dangling Obsidian Earrings",
              "variants": [
                {
                  "variantGraphqlId": "gid://shopify/ProductVariant/45038877868228",
                  "price": "829.00"
                }
              ]
            }
          ],
          "eligibilityCondition": {
            "type": "QUANTITY",
            "value": 1,
            "isValidateEligibilityConditionEnabled": true
          },
          "discount": {
            "type": "PERCENTAGE",
            "value": "100"
          },
          "displayVariantsAsIndividualProducts_addons": false,
          "conditions": []
        }
      ],
      "multiLangData": {},
      "addonsMessaging": {
        "isEnabled": true,
        "tier1": {
          "ineligibleState": "Add ##addonsConditionDiff## more product(s) to claim ##addonsDiscountValue####addonsDiscountValueUnit## off on Add ons",
          "eligibleState": "Congrats you are eligible for ##addonsDiscountValue####addonsDiscountValueUnit## off on Add ons"
        }
      },
      "offerId": "Bundle2-ADP-668",
      "discountId": "gid://shopify/DiscountAutomaticNode/2345591210180"
    }
  }
}
```

Earlier saved-payload evidence confirmed the same structure with `type: "AMOUNT"`, `value: 1`, and `discount.value: 10` for a partial percentage tier. Runtime adds app-discount fields such as `offerId`, `discountId`, and `discountShopifyResponse`; Admin save payloads do not need to send those generated fields.

Live saved-payload evidence from the 2026-06-25 restore pass confirmed the `origin=addonProducts` save body shape:

```json
{
  "shopName": "yash-wolfpack.myshopify.com",
  "personalizationData": {
    "isPersonalizationEnabled": true,
    "addonProducts": {
      "isEnabled": true,
      "title": "Add ON ",
      "type": "MULTI_TIER",
      "tiers": [
        {
          "tierId": "tier31726",
          "eligibilityCondition": {
            "type": "QUANTITY",
            "value": 1,
            "isValidateEligibilityConditionEnabled": true
          },
          "discount": {
            "type": "PERCENTAGE",
            "value": "100"
          },
          "displayVariantsAsIndividualProducts_addons": false,
          "conditions": []
        }
      ]
    }
  }
}
```

## Storefront Runtime Behavior

- The gifting-step toggle creates a navigation item with id `personalizationPage`; current rendered label is `Add On`.
- With `Add-Ons and Gifting Step` enabled and `Add-Ons with Bundles` disabled, storefront still renders the `Add On` navigation item, but does not render the add-on section title, tier eligibility message, or success message in the paid-step footer.
- With both toggles disabled, storefront removes the `Add On` navigation item and all add-on section/eligibility/success messaging; the normal bundle discount footer remains.
- After restoring both toggles to enabled and saving, a hard refresh restored `Add On` navigation plus `Add ON` and `Add 1 more product(s) to claim 100% off on Add ons` in the paid-step footer.
- The add-ons tier system renders footer/sidebar messaging on the paid step before the user enters the add-on step.
- With zero selected paid products, the current baseline rendered `Add ON` plus `Add 1 more product(s) to claim 100% off on Add ons`.
- After selecting two paid products, EB set `window.gbb.gbbAddonProducts.state.eligibleTierForAddons` to `tier31726` and rendered `Congrats you are eligible for 100% off on Add ons`.
- Variable interpolation uses the active eligible/ineligible tier: `##addonsConditionDiff##`, `##addonsDiscountValue##`, and `##addonsDiscountValueUnit##` rendered as `1`, `100`, and `%` in the current baseline.
- Existing paid-step/category rules still gate progression. In the current baseline, trying to click `Next` after selecting two Category 1 products stayed on `addProductsPage1` and showed `Category 2 : Add at least 2 products on this step`; add-on eligibility did not bypass paid-step validation.
- Add-ons are optional at the messaging layer: being eligible changed footer state but did not automatically add the add-on product to `giftBoxCartData.items`. The shopper must continue to `personalizationPage` and click the add-on product.
- The current research bundle has two paid product steps before add-ons. After satisfying Category 1 and Category 2 rules on `addProductsPage1`, `Next` advances to `addProductsPage2`; a second `Next` advances to `personalizationPage`.
- On `personalizationPage`, EB renders the active eligible tier heading (`Tier 1`) and the selected add-on products. With the temporary `10%` test config, the add-on card showed original `₹829.00`, discounted `₹746.10`, and a `10% off` ribbon. With restored baseline `100%`, the cart line became free.
- Adding an add-on inserts a normal `giftBoxCartData.items` line with `properties._boxProduct: "addonProduct"`, `_addon_product: true`, `_addonTierId: "tier31726"`, and `_uniqueGbbItemKey: "{variantId}_pageId:addonProduct"`. Runtime price reflects the add-on discount; for `10%`, price was `74610` and compare/original price was `82900`.
- On cart submit, EB created two Shopify cart lines in the tested flow:
  - the add-on product as its own line, with `properties._addon_product: true`, `_addonTierId: "tier31726"`, and `_addon_offer_id: "Bundle2-ADP-668_1"`;
  - the parent bundle line, with `_EasyBundleId: "FBP-2"`, `_originalOfferId`, `Items`, `Retail Price`, `You Save`, and `_addon_offer_id: "Bundle2-ADP-668_1$Q:4$P:2156"`.
- For a partial `10%` add-on discount, Shopify cart JSON showed the add-on line at `price: 82900`, `discounted_price: 74610`, `line_price: 74610`, `total_discount: 8290`, and line-level discount title `Add ON `.
- For a `0%` add-on discount, Shopify cart JSON showed the add-on line at full price with no discount allocation: `price: 82900`, `discounted_price: 82900`, `line_price: 82900`, `total_discount: 0`, `discounts: []`, and empty `line_level_discount_allocations`. The add-on line properties still included `_addon_product: true`, `_addonTierId: "tier31726"`, and `_addon_offer_id: "Bundle2-ADP-668_1"`.
- For the restored `100%` add-on discount, Shopify cart JSON showed the add-on line at `price: 82900`, `discounted_price: 0`, `line_price: 0`, `total_discount: 82900`, and line-level discount title `Add ON `.
- With `Discount Based on` set to `Bundle Value`, EB changes the threshold field label from `Quantity` to `Amount`, prefixes it with the shop currency symbol, and changes the default ineligible template to `Add product(s) worth at least {{addonsConditionDiff}} {{currencyUnit}} more to claim {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons`. Storefront locked state rendered `Add product(s) worth at least 1.00 ₹ more to claim 010% off on Add ons` for the temporary `10%` test after the field had been saved with a leading zero; after one paid product was selected, the eligible message rendered `Congrats you are eligible for 010% off on Add ons`.
- Under the amount-based `10%` test, direct navigation to `personalizationPage` after paid selections rendered the add-on tier card with original `₹829.00`, discounted `₹746.10`, and `010% off` because of the leading-zero persistence noted above. The price math still used a 10% discount.
- Desktop footer/sidebar shows the add-on title and ineligible/eligible message in `.gbbAddonsMessagingContainer`.
- The desktop add-on title/message section is removed once the shopper is on the add-on step itself; the add-on step shows tier products and the normal bundle summary only.
- Summary product removal is step-local in the tested EB Standard flow. Products from other steps keep a disabled-looking trash affordance; clicking it shows `Remove This Product From <Step Name>` instead of removing the item. Add-on/free-gift removal should follow the same step-name rule.
- Mobile baseline at `390x844` retained the `Add On` navigation label in runtime state and the DOM contained `.gbbAddonsMessagingContainer` with `Add ON Add 1 more product(s) to claim 100% off on Add ons`. The compressed visible footer text prioritized `Add 2 product(s) to save 5%! Next • ₹0.00 0`, so add-on-message visibility is template-sensitive on mobile.

## Scenario Matrix

| Scenario | Admin input | Expected / observed storefront behavior | Payload/runtime shape | Evidence notes |
|---|---|---|---|---|
| Current baseline | Gifting step ON; Add-ons with Bundles ON; one quantity tier; threshold `1`; discount `100%`; one selected product | `Add On` nav step exists. Before paid selection, ineligible message says add 1 product. After paid quantity reaches threshold, success message appears. On the add-on step, the add-on can be selected and submits as a free add-on line. | `isPersonalizationEnabled: true`; `addonProducts.isEnabled: true`; one `QUANTITY` tier; `discount.value: "100"`; cart add-on line has `_addon_product`, `_addonTierId`, `_addon_offer_id`. | Live audited end-to-end 2026-06-25; Admin restored and hard-refreshed storefront again 2026-06-26. |
| Both toggles off | Gifting step OFF; Add-ons with Bundles OFF | Removes the synthetic `Add On` step and add-on footer messaging. Normal bundle footer still renders `Add 2 product(s) to save 5%!`. | Admin snapshot after save showed both checkboxes unchecked. Storefront DOM proof: `addOnNav: false`, `addOnSectionTitle: false`, `addOnEligibilityMessage: false`, `normalBundleFooter: true`. | Saved from top Shopify savebar and verified after hard storefront refresh on 2026-06-26. |
| Only gifting step enabled | Gifting step ON; Add-ons with Bundles OFF | `Add On` navigation step exists without `Add ON` section title, add-on eligibility message, or success message. Normal bundle footer remains. | Admin snapshot after save showed gifting checked and Add-Ons with Bundles unchecked. Storefront DOM proof: `addOnNav: true`, `addOnSectionTitle: false`, `addOnEligibilityMessage: false`, `normalBundleFooter: true`. | Saved from top Shopify savebar and verified after hard storefront refresh on 2026-06-26. |
| Only add-ons with bundles enabled | Gifting step OFF; Add-ons with Bundles ON | Unsaved Admin state can be reached by enabling Add-Ons with Bundles while gifting remains off. Disabling gifting via confirmation turned both toggles off before save, so this was not persisted as an independent storefront state in the 2026-06-26 pass. It must not create the storefront `Add On` step by itself. | Expected `isPersonalizationEnabled: false`; `addonProducts.isEnabled: true` only if EB accepts the save. Current Admin UI may coerce this to both-off when disabling the gifting step. | Treat as an implementation edge case from previous reference plus the 2026-06-26 Admin dependency proof; recheck if exact persisted inverse state is required. |
| Amount eligibility | Discount Based on `Bundle Value`; value `1`; discount `10%` | Ineligible message uses remaining money amount and currency unit; eligible message appears once paid subtotal qualifies. Add-on step renders discounted add-on card after paid selection. | `eligibilityCondition.type: "AMOUNT"`; `discount.value` saved as `"010"` in this pass due Admin input quirk; price math still reflected 10%. | Live audited on storefront 2026-06-25; restored afterward. |
| Quantity eligibility | Discount Based on `Bundle Product Quantity`; value `1`; discount `100%` | Eligibility computed from selected paid bundle item count, not add-on product count. Eligibility can be true while paid-step Category rules still block navigation. | `eligibilityCondition.type: "QUANTITY"`. | Live audited 2026-06-25. |
| Multiple tiers | Two or more independent tiers, e.g. 3 products = 20%, 6 products = free | Runtime must evaluate all tiers and select the highest eligible tier. | `addonProducts.type: "MULTI_TIER"`; multiple `tiers[]`. | Help article explicitly describes 3-product and 6-product tiers; previous reference says do not hardcode tier 1. |
| No selected add-on products | Add-ons enabled; tier has no products | Tier messaging can still be configured, but no add-on product cards should render when the tier becomes available. | `selectedAddonProducts: []`. | Not re-saved in this pass; required edge case for WPB implementation. |
| Multiple selected add-on products | Tier product picker has multiple products | Eligible add-on step should render all selected products for that tier. | `selectedAddonProducts` contains hydrated product objects. | Existing product-picker shape supports arrays; not re-saved in this pass. |
| Variant display off | `displayVariantsAsIndividualProducts_addons: false` | Product card renders as product-level card unless variant selection is required. | Tier flag false. | Current baseline. |
| Variant display on | `displayVariantsAsIndividualProducts_addons: true` | Variants should render as individual add-on cards. | Tier flag true. | Existing FPB product-step variant proof exists; add-on-specific proof remains to capture before pixel work. |
| Tier Rules absent | `conditions: []` | Eligibility uses main `eligibilityCondition` only. | Empty `conditions` array. | Current baseline. |
| Tier Rules present | Add Tier Rule configured | Additional tier-scoped conditions must be evaluated with the tier. | Non-empty `conditions`. | Help confirms tier conditions; exact schema unproven. |
| Discount `0%` | Discount on Add-ons `0` | Eligible message interpolates `0%`; add-on remains full price; Shopify cart add-on line has no discount allocations. | `discount.value: "0"`; add-on cart line `discounted_price: 82900`, `line_price: 82900`, `total_discount: 0`, `discounts: []`. | Temporarily saved and audited end-to-end 2026-06-25, then restored. |
| Discount `10%` | Discount on Add-ons `10` | Eligible message says `10% off`; add-on step card shows original and discounted price; Shopify cart line receives a 10% line-level discount. | `discount.value: "10"`; add-on runtime price `74610`, compare/original `82900`; cart `total_discount: 8290`. | Temporarily saved and audited 2026-06-25, then restored. |
| Discount `100%` | Discount on Add-ons `100` | Eligible message says `100% off`; add-on step card can be selected; Shopify cart add-on line is discounted to free. | `discount.value: "100"`; cart add-on line `discounted_price: 0`, `line_price: 0`, `total_discount: 82900`. | Live audited end-to-end 2026-06-25 after restoration. |
| Custom footer messages | Merchant edits ineligible/success strings | Runtime interpolates variables and preserves merchant copy. | `addonsMessaging.tierN` entries. | Existing payload and current runtime prove interpolation. |
| Translated footer messages | Multi Language edited | Active locale should select translated message. | `addonProducts.multiLangData` / message-level localization. | Modal presence proven; translated runtime not re-saved in this pass. |

## Replication Requirements

- Model `Add-Ons and Gifting Step` and `Add-Ons with Bundles` as separate toggles. Do not derive step existence solely from tier data.
- Preserve the direct personalization contract under `personalizationData`; do not backfill from legacy fields.
- Store add-on tiers as an array, not a single hardcoded tier. Runtime tier selection must consider every tier and choose the highest eligible tier when multiple thresholds pass.
- Support both `QUANTITY` and `AMOUNT` eligibility.
- Keep discount values as percentages for observed EB add-ons; `0`, partial percentages, and `100` are all meaningful.
- Normalize numeric Admin inputs before persisting. EB itself can persist string values with leading zeros if the field is manipulated poorly; storefront message interpolation renders those leading zeros literally even when discount math still behaves numerically.
- Treat add-ons as optional until merchant rules prove otherwise. Eligibility unlocks the offer and messaging; it does not auto-add an add-on.
- Paid step/category validation remains authoritative. Add-on eligibility must not bypass unmet paid-step rules.
- Hide add-on eligibility/sidebar summary messaging on the add-on step; show it only while the shopper is still on paid product steps before the add-on offer surface.
- Gate summary item removal by current step. Do not remove a selected product from a different step; show `Remove This Product From <Step Name>` instead.
- Use the active tier for variable interpolation in footer/sidebar messages.
- Keep add-on products separate from normal paid step products in runtime and cart semantics. Runtime marks add-ons with `_boxProduct: "addonProduct"`; Shopify cart marks them with `_addon_product: true`, `_addonTierId`, and `_addon_offer_id`.
- Implement add-on discounts as line-level Shopify discounts against the separate add-on line. The parent bundle line keeps the paid bundle contents and includes `_addon_offer_id` tying the paid bundle to the add-on offer.
- Recheck mobile eligible/ineligible add-on message placement when implementing UI; current mobile proof shows runtime and DOM message state, but compressed footer visibility differs from desktop.

## Help Article Facts

The EB help article says:

- PDP bundles do not support free gifts directly; landing page layouts provide more flexibility for free gifts.
- Configure add-ons from the bundle editor by editing the bundle, going to Step Setup / Add-ons, enabling add-ons, and entering a name/title for the add-on step.
- Create discount tiers with conditions and offers, for example 3 selected main-bundle products = 20% off add-ons, and 6 selected products = free add-on.
- Each tier can have necessary conditions, selected add-on products, and customized notification messages.
- Save and preview; when the customer adds the required number of items, the matching add-on offer becomes available.
