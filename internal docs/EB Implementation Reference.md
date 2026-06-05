---
title: EB Implementation Reference
type: reference
last_updated: 2026-05-26
source: docs/competitor-analysis/16-eb-full-data-flow-investigation.md; docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md
---

# EB Implementation Reference

**This is the grounded truth for all EB porting questions.**

When implementing a feature that mirrors EB behaviour — data shapes, admin flows, storefront runtime, cart integration, template IDs, widget settings — look here first. Every fact below was captured directly from live EB Admin/storefront inspection (Chrome DevTools MCP, authenticated `yash-wolfpack` store) and verified against EB's minified widget JS/CSS. No inferences are made; entries without direct evidence are labelled.

**Full evidence record:** `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`

---

## Admin API Endpoints

All requests go to `https://prod.backend.giftbox.giftkart.app` with `?shopName={shop}` query param.

| Operation | Method | Path |
|---|---|---|
| FPB — create bundle | `POST` | `/api/stepsConfiguration/create` |
| FPB — save step categories | `POST` | `/api/stepsConfiguration/saveMultipleCategoriesData?bundleId={id}` |
| FPB — full update (wrapper) | `POST` | `/api/stepsConfiguration/update?bundleId={id}` |
| PPB — create bundle | `POST` | `/api/mixAndMatch/create` |
| PPB — update | `POST` | `/api/mixAndMatch/update?offerId={MIX-XXXXXX}` |

---

## Data Contracts

### FPB Bundle Identifiers

| Field | Type | Notes |
|---|---|---|
| `bundleId` | numeric string | Used in all FPB URLs and step save params |
| `bundleType` | `"FULLPAGE_BUNDLE"` | Set at creation |
| `offerId` (FPB) | `"FBP-{bundleId}"` | Used in cart properties; derived at runtime, not stored separately |

### FPB Step/Category Admin Payload

Sent to `saveMultipleCategoriesData`. The captured Admin save payload preserves hydrated category records; it is not only an ID list.

```json
{
  "productPageKey": "productsData1",
  "productPageStepText": "Step 1 - Jewelry Picks",
  "productPageSubtext": "Choose your jewelry",
  "pageType": "MULTIPLE_CATEGORY",
  "isMultiCategoryTabBasedUIEnabled": true,
  "displayVariantsAsIndividualProducts": true,
  "categories": {
    "category73936": {
      "categoryId": "category73936",
      "title": "Earrings",
      "subTitle": "",
      "categoryImg": "https://d3ks0ngva6go34.cloudfront.net/public/icons/multiple_category_category.png",
      "conditions": [],
      "autoNextStepOnConditionMet": false,
      "products": [
        {
          "productId": "8322626126020",
          "graphqlId": "gid://shopify/Product/8322626126020",
          "handle": "14k-dangling-obsidian-earrings",
          "variants": [{ "variantGraphqlId": "gid://shopify/ProductVariant/45038877868228" }],
          "title": "14k Dangling Obsidian Earrings"
        }
      ],
      "selectedProducts": [],
      "collectionsData": [],
      "collectionsSelectedData": [],
      "categoryBanner": "",
      "multiLangData": {}
    },
    "category54364": {
      "categoryId": "category54364",
      "title": "Collection Category",
      "subTitle": "",
      "conditions": [],
      "autoNextStepOnConditionMet": false,
      "products": [],
      "selectedProducts": [],
      "collectionsData": [],
      "collectionsSelectedData": [
        { "id": "gid://shopify/Collection/309961654468" }
      ],
      "categoryBanner": "",
      "multiLangData": {}
    }
  }
}
```

**Key distinctions:**
- Step key is always `productsData{N}` (1-indexed string, not an array index).
- FPB category save records include `products`, `selectedProducts`, `collectionsData`, and `collectionsSelectedData`; the source tab is inferred from which arrays are populated, not from a persisted `categoryType` field in the captured save.
- Products in the captured Admin save payload are hydrated product objects with product GIDs, handles, variants, images, and titles. The public storefront DTO may be normalized later, but the Admin save proof is hydrated.
- `displayVariantsAsIndividualProducts` is stored at the **category level** in PPB, at the step level in this FPB capture (verify before relying on step-level placement in FPB).

### FPB Full `stepsConfiguration/update` Top-Level Keys

Captured from the 37 KB wrapper update payload:

```
landingPageData, bundleTextConfig, summaryPageData, personalizationData,
boxSelection, bundleDesignTemplate, bundleDesignPresetId,
productsData1, productsData2, readinessScore
```

`productsData2` can exist in DB without being surfaced on the storefront — step becomes live only when navigation links it into the flow.

### FPB Add-ons Personalization Contract

Captured from `network-934-savePersonalization-addonProducts.request.network-request` and `fpb-storefront-runtime-addons.json`.

Save endpoint:

| Operation | Method | Path |
|---|---|---|
| FPB — save Add-ons / personalization | `POST` | `/api/stepsConfiguration/savePersonalization` |

Payload shape:

```json
{
  "personalizationData": {
    "isPersonalizationEnabled": true,
    "personalizeStepText": "Audit Add-ons",
    "personalizePageSubtext": "Pick an optional audit add-on",
    "addonProducts": {
      "isEnabled": true,
      "title": "Optional audit extras",
      "type": "MULTI_TIER",
      "tiers": [
        {
          "tierId": "tier74285",
          "title": "Audit Tier 1",
          "selectedAddonProducts": [
            {
              "graphqlId": "gid://shopify/Product/8322626126020",
              "variants": [
                {
                  "variantGraphqlId": "gid://shopify/ProductVariant/45038877868228",
                  "price": "829.00"
                }
              ]
            }
          ],
          "eligibilityCondition": {
            "type": "AMOUNT",
            "value": 1,
            "isValidateEligibilityConditionEnabled": true
          },
          "discount": {
            "type": "PERCENTAGE",
            "value": 10
          },
          "displayVariantsAsIndividualProducts_addons": false,
          "conditions": []
        }
      ],
      "multiLangData": {},
      "addonsMessaging": {
        "isEnabled": true,
        "tier1": {
          "ineligibleState": "Add product(s) worth at least {{addonsConditionDiff}} {{currencyUnit}} more to claim {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons",
          "eligibleState": "Congrats you are eligible for {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons"
        }
      }
    }
  }
}
```

Storefront runtime adds the following app-discount fields under `personalizationData.addonProducts` after save:

```json
{
  "offerId": "Bundle3-ADP-052",
  "discountId": "gid://shopify/DiscountAutomaticNode/2300086780100",
  "discountShopifyResponse": {
    "discountClasses": ["PRODUCT"],
    "status": "ACTIVE",
    "appDiscountType": {
      "functionId": "558ead83-9918-44ff-bba6-b5a9b9de93b9"
    },
    "combinesWith": {
      "orderDiscounts": true,
      "productDiscounts": true,
      "shippingDiscounts": false
    }
  }
}
```

2026-05-26 correction: keep the captured app-discount runtime fields as evidence, but the WPB implementation target for this rewrite is Cart Transform discounting. Do not store Add-ons tier discounts in the static parent `price_adjustment` metafield, because that would affect bundles even when no add-on is selected. Instead, tag selected chargeable add-on cart lines through the existing `_bundle_step_type` attribute, for example `addon:PERCENTAGE:10`, and have Cart Transform include that selected-line discount in the merged parent `price.percentageDecrease` effective percentage. Reusing `_bundle_step_type` avoids increasing the Shopify Function input-query complexity. This row stays partial until Rust transform tests and live cart proof show the combined base discount plus selected Add-ons discount.

### FPB Messages Personalization Contract

Captured from `network-1548-savePersonalization-giftMessage.request.network-request`, `fpb-storefront-runtime-messages.json`, and the desktop/mobile validation screenshots.

Save endpoint:

| Operation | Method | Path |
|---|---|---|
| FPB - save Messages / personalization | `POST` | `/api/stepsConfiguration/savePersonalization` |

Payload shape:

```json
{
  "personalizationData": {
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
        "product": {
          "id": 8600867012804,
          "title": "Message",
          "variants": [
            {
              "id": 46177973534916,
              "option1": "Message",
              "price": "0.00",
              "taxable": false,
              "inventory_policy": "continue"
            }
          ]
        }
      }
    }
  }
}
```

Storefront fields proven in `fpb-storefront-runtime-messages.json`:

- From input: class `gbbGiftMessageV2FromField`, placeholder `From`
- To input: class `gbbGiftMessageV2ToField`, placeholder `To`
- Message textarea: class `gbbGiftMessageV2InputField`, placeholder `Enter a message here...`, `maxLength: 120`
- Required validation text: `Please enter a message`

2026-06-05 email-capture update:

- Fresh Admin audit target: `yash-wolfpack` EB Landing Page bundle `WPB Research Landing Bundle 2026-05-22` (`bundleId: 2`).
- Admin Messages control order observed: `Enable Messages`; message product preview row (`Message`) with `Edit`; `Enable Sender and Recipient Fields`; `Make Gift Message mandatory`; `Enable Message Limit (Characters)` plus `Enter Message Limit`; `Send message through email to the customer`; `Customize your email templates here` plus `Customize Emails`; note text `Please reach out to us if you wish to change the domain from where the emails are sent.`
- Current saved/runtime keys observed on storefront preview: `giftMessage.isGiftMessageEnabled: true`, `giftMessage.isSenderAndRecipientNameEnabled: false`, `giftMessage.giftMessageCharacterLimit: "50"`, `giftMessage.isGiftMessageMandatory: false`, `giftMessage.isVideoMessageEnabled: false`, `giftMessage.isEmailEnabled: false`, `giftMessage.messageProduct.isMessageProductEnabled: true`, `giftMessage.messageProduct.status: "unlisted"`.
- Current Admin email behavior: the email switch rendered visually disabled and was skipped by keyboard tab order; `Customize Emails` rendered visually disabled and clicking it produced no modal or navigation. No recipient email, delivery date, or template editor controls were exposed in Admin after interaction.
- Runtime email classes/properties observed in live storefront functions: email wrapper `gbbEmailAddressHTML`, `gbbEmailAddressWrapper`; label `gbbEmailAddressLabelField`; email input `gbbVideoMsgEmailField` with `type="email"` and placeholder `Enter a recipient email address here...`; delivery info `giftMessageDeliveryInfo`; delivery scheduler `gbbScheduleMessageDeliveryHTML`, `gbbScheduleMessageSendNowContainer`, `gbbScheduleMessageSendLaterContainer`, `gbbScheduleMessageDatePicker`; active delivery option class `gbbActiveMsgDeliveryOptions`; validation error class `gbbEmailValidationError`.
- Cart properties observed in live runtime mapping: message line properties use `Message`, `Recipient Name`, `Sender Name`, `Recipient Email`, `_gbbEmailDeliveryDate`, `_gbbEmailDeliveryOption`, `_videoMsgId`, and `Video Recorded`; `prepareMsgAttributesForCart()` returns `email`, `_gbbEmailDeliveryOption`, and `_gbbEmailDeliveryDate`, and `updateCartV2()` maps those to the cart properties above.
- Help content observed: `Free Gift & Add Ons` exposes `How to setup?`, opening the EB help/chat article `[Classic] How to provide additional add-ons with different discounts, like gifts, on bundle builders`; the article says PDP bundles do not support free gifts directly, Landing Page layout gives more flexibility for free gifts, configure Add-ons under Step Setup, set add-on name/title, create discount tiers, set conditions and add-on products, customize qualification notifications, save, then preview. No visible Messages or email-specific help links were present on the Messages card in this run.
- WPB scope for this slice remains capture-only: Admin + storefront + cart data may collect email/date fields, but no outbound email provider or delivery behavior should be implemented.

Scope gate: Emails and Customize Emails are out of scope for the clone rewrite. The EB runtime proof includes recipient-email and delivery-date UI when `isEmailEnabled: true`, but the implementation slice only copies the non-email sender/recipient/message behavior. Do not mark the Messages row green until WPB Admin/save/runtime/desktop/mobile/cart proof is captured and the excluded email fields are explicitly accounted for in the manifest.

### PPB Bundle Identifiers

| Field | Type | Notes |
|---|---|---|
| `offerId` | `"MIX-{6-digit-number}"` | Used in all PPB URLs and cart properties |
| `bundleDesignTemplate` | `"PDP_INPAGE" \| "PDP_MODAL"` | Set at creation |
| `bundleDesignTemplateData.templateId` | string | Visual preset within the layout mode |

### PPB Step/Category Admin Payload

Sent to `mixAndMatch/update`. The captured Admin update payload preserves hydrated category records and category rule arrays.

```json
{
  "offerId": "MIX-894502",
  "bundleDesignTemplate": "PDP_INPAGE",
  "bundleDesignTemplateData": { "templateId": "CASCADE" },
  "useSingleStepCategoriesAsBundleSteps": false,
  "productsData1": {
    "productPageKey": "productsData1",
    "productPageStepText": "Step 1 - Product Picks",
    "productPageSubtext": "Build from products",
    "conditions": {
      "isEnabled": true,
      "rules": [
        { "type": "quantity", "condition": "greaterThanOrEqualTo", "value": "02" },
        { "type": "amount",   "condition": "greaterThanOrEqualTo", "value": "01000" }
      ]
    },
    "categories": {
      "category69520": {
        "categoryId": "category69520",
        "conditions": [
          { "type": "quantity", "condition": "greaterThanOrEqualTo", "value": "01" }
        ],
        "autoNextStepOnConditionMet": false,
        "title": "Featured products",
        "subTitle": "",
        "name": "Category 1 Direct Product Category",
        "categoryRank": 1,
        "products": [{
          "id": "gid://shopify/Product/8322626126020",
          "productId": "8322626126020",
          "graphqlId": "gid://shopify/Product/8322626126020",
          "handle": "14k-dangling-obsidian-earrings",
          "variants": [{ "variantGraphqlId": "gid://shopify/ProductVariant/45038877868228" }],
          "title": "14k Dangling Obsidian Earrings"
        }],
        "collectionsData": [],
        "collectionsSelectedData": [],
        "categoryBanner": "",
        "displayVariantsAsIndividualProducts": false,
        "displayVariantsAsSwatches": false,
        "multiLangData": {}
      },
      "category19687": {
        "categoryId": "category19687",
        "conditions": [],
        "autoNextStepOnConditionMet": false,
        "name": "Category 2",
        "subTitle": "",
        "categoryRank": 2,
        "products": [],
        "collectionsData": [],
        "collectionsSelectedData": [{ "id": "gid://shopify/Collection/309961654468" }],
        "categoryBanner": "",
        "displayVariantsAsIndividualProducts": false,
        "displayVariantsAsSwatches": false,
        "multiLangData": {}
      }
    }
  }
}
```

**PPB vs FPB category shape differences:**
- Both captured FPB and PPB category saves use `products`, `collectionsData`, and `collectionsSelectedData` arrays with hydrated product/collection objects from the picker.
- FPB additionally preserves a `selectedProducts` array in the captured category object; it was empty in the step-setup proof.
- PPB stores `displayVariantsAsIndividualProducts` and `displayVariantsAsSwatches` per **category** — confirmed at category level

### Discount Configuration Shape (PPB — applies to FPB too)

```json
{
  "discountConfiguration": {
    "isDiscountEnabled": true,
    "discountMode": "PERCENTAGE",
    "rules": [
      { "value": "2",     "discountValue": "5",   "type": "quantity" },
      { "value": "21500", "discountValue": "510",  "type": "amount"   }
    ],
    "isShowDiscountsEnabled": true,
    "discountTextBody": {
      "percentageAndFixed": {
        "rule1": { "text": "Add {{discountConditionDiff}} product(s) to save {{discountValue}}{{discountValueUnit}}!" },
        "rule2": { "text": "Congrats! Spend {{discountUnit}}{{discountConditionDiff}} more to get {{discountValue}}{{discountValueUnit}} off." }
      }
    },
    "discountTextForSuccess": {
      "value": "Success! Your {{discountValue}}{{discountValueUnit}} discount has been applied to your cart."
    }
  },
  "metafieldData": {
    "discount": {
      "rules": [
        { "value": "2",     "discountValue": "5",   "type": "quantity" },
        { "value": "21500", "discountValue": "510",  "type": "amount"   }
      ],
      "discountMode": "PERCENTAGE"
    }
  }
}
```

### Discount & Pricing — Admin UI

The display-option and rule-field observations below were rechecked in the live PPB configure flow on 2026-05-25. Verify FPB visually before treating the layout as identical there.

**Discount Type dropdown options (top-level `discountMode`):**
- `"Fixed Amount Off"` → `discountMode: "FIXED_AMOUNT"`
- `"Percentage Off"` → `discountMode: "PERCENTAGE"`
- `"Fixed Bundle Price"` → `discountMode: "FIXED_BUNDLE_PRICE"`
- `"Buy X, get Y"` → `discountMode: "BXY_OFFER"` (inferred; not confirmed from API payload)

**Rule fields for Percentage Off / Fixed Amount Off:**

| Field | UI Label | Notes |
|---|---|---|
| `rule.type` | "Discount on" (quantity / amount) | Condition type |
| `rule.value` | "is greater than or equal to" | Quantity count or currency-prefixed amount threshold |
| `rule.discountValue` (Percentage Off) | "Percentage Off" | Percentage-suffixed value |
| `rule.discountValue` (Fixed Amount Off) | "Fixed Amount Off" | Currency-prefixed value |

**Rule fields for Fixed Bundle Price:**

| Field | UI Label | Notes |
|---|---|---|
| `rule.value` | "Number of Products in Bundle" | Product-count condition |
| `rule.discountValue` | "Price" | Currency-prefixed price input |

**Rule fields for Buy X, Get Y (`discountMode: "BXY_OFFER"`):**

| Field | UI Label | Default | Notes |
|---|---|---|---|
| `customerBuys` | "Minimum quantity of items" | 2 | Condition threshold — total items needed in cart |
| `customerGets` | "Quantity" | 1 | Items receiving the discount |
| `discountValue` | "Discount value" | 100 | Numeric value |
| `discountType` | "Discount type" | `"% off"` | `"% off"` or `"₹ off"` |
| `applyDiscountTo` | "Apply Discount to" | `"The lowest priced items"` | `"The lowest priced items"` or `"The latest added items"` |

UI note: "Customer must add the quantity of items specified above to their cart" appears as help text under Customer gets.

**BXY rule note:** The Discount Messaging section shows a banner: "Discount messaging displays the Total Quantity to Claim Offer (Buy + Get) to ensure customers add their rewards to the cart" — meaning `{{discountConditionDiff}}` is based on Buy + Get total. The banner remains rendered when Discount Messaging is switched off.

### Discount Display Options — Bundle Quantity Options

**Section layout:**
- Not rendered for Buy X, Get Y.
- Non-BXY states show the toggle, "Multi Language" action, and note: "Note: Bundle Quantity Options can only be enabled when discount rules are based on quantity."
- When enabled for quantity-based rules, each rule renders "Box Label" and "Box Subtext" fields plus a "Make this rule default" star action.

**"Multi Language" button:**

Opens modal "Customize Text for Multiple Languages":
- "Select Language" dropdown
- Per-rule card: "Rule #1" → Box Label textbox | Box Subtext textbox
- "Save and close" button

### Discount Display Options — Progress Bar

**Section layout:**
- Toggle: `isShowDiscountsEnabled` / Progress Bar on/off
- "Multi Language" button: **disabled** when Simple Bar selected; **enabled** when Step-Based Bar selected
- Radio group: `"Simple Bar"` | `"Step-Based Bar"`
- When Simple Bar is selected, no per-rule tier-text fields appear.

**When Step-Based Bar is selected, per-rule fields appear:**
```
Rule #1
  Tier Text:    "Add 3"                   ← auto-computed: customerBuys + customerGets = total
  Tier Subtext: "1 Product(s) @ 100% off" ← auto-computed: customerGets + discountValue + discountType
```
These are merchant-editable text fields (not fixed computed values).

**Progress Bar "Multi Language" button (enabled only with Step-Based Bar):**

Opens modal "Customize Text for Multiple Languages":
- "Select Language" dropdown (same 38 languages as Discount Messaging)
- Per-rule card: "Rule #1" → Tier Text textbox | Tier Subtext textbox (side by side)
- "Save and close" button

This modal allows translating per-rule tier labels into any of the 38 supported languages.

### Discount Display Options — Discount Messaging

**Section layout:**
- Toggle: `discountMessagingEnabled`
- "Enable multi-language" checkbox (top right of section)
- "Edit how discount messages appear above the subtotal."
- When enabled with multi-language selected: language dropdown ("English" default, 38 total) + "Active languages" chip(s)
- When enabled: "Show Variables" button + one "Discount Text" textbox per rule
- After all rule cards: one shared "Success Message" textbox
- When messaging is disabled: message fields hide and the multi-language checkbox is disabled; the BXY informational banner still renders when BXY is selected

**38 supported languages** (from dropdown, confirmed via a11y tree):
English, Arabic, Bulgarian (BG), Catalan, Chinese (CN), Chinese (TW), Croatian, Czech, Danish, Dutch, Estonian, Finnish, French, Georgian, German, Greek, Hebrew, Hungarian, Indonesian, Italian, Japanese, Korean, Latvian, Lithuanian, Norwegian Bokmål, Polish, Portuguese (BR), Portuguese (PT), Romanian, Russian, Slovak (SK), Slovenian (SI), Spanish, Swedish, Thai, Turkish, Vietnamese, Norwegian

**Default discount message texts by discount type:**

Percentage Off:
- Rule 1 Discount Text: `"Add {{discountConditionDiff}} product(s) to save {{discountValue}}{{discountValueUnit}}!"`
- Success Message: `"Success! Your {{discountValue}}{{discountValueUnit}} discount has been applied to your cart."`

Buy X, Get Y:
- Rule 1 Discount Text: `"Add {{discountConditionDiff}} product(s) to get {{discountedItems}} of them at {{discountValue}}{{discountValueUnit}} off!"`
- Rule 2+ Discount Text: `"Add {{discountConditionDiff}} more to get {{discountedItems}} product(s) at {{discountValue}}{{discountValueUnit}} off!"`
- Success Message: `"Success! You got {{discountedItems}} product(s) at {{discountValue}}{{discountValueUnit}} off"`

**Template variables confirmed:**
- `{{discountConditionDiff}}` — remaining quantity/amount to add to unlock discount
- `{{discountUnit}}` — currency symbol for amount-based rules
- `{{discountValue}}` — numerical discount reward value
- `{{discountValueUnit}}` — symbol for discount reward (% or currency)
- `{{discountedItems}}` — quantity of items discounted/given free in BXY

`metafieldData.discount` is the compact storefront mirror written to the product metafield. The main `discountConfiguration` lives in the admin DB only.

### Bundle Visibility — Product Page Widget and Embed

Public Skai Lama help articles corroborate the captured Bundle Visibility behavior:

- Product Page Bundle Upsell Widgets are enabled from the bundle edit surface, then the merchant chooses Offer Upsell Block or Offer Upsell Button.
- Default widget visibility is all product pages for items currently included in the bundle.
- Manual product or collection selections override the default visibility.
- The Add Browsed Product option preselects the product the shopper was viewing before clicking the widget/redirect.
- Widget placement is completed through the Shopify theme editor app block; template choice and block position affect where the widget appears.
- Product Page Bundle Builder embed placement is also through a product-page app block in the Shopify theme editor.

Reference URLs:

- `https://help.skailama.com/en/article/setting-up-an-upsell-bundle-button-or-a-block-on-product-pages-for-bundles-1w2m8i7/`
- `https://help.skailama.com/en/article/going-live-with-a-product-page-bundle-builder-ifuxvi/`

### Default/Preselected Products Shape

```json
{
  "defaultProductsData": {
    "isDefaultProductsEnabled": true,
    "defaultProductsTitle": "Preselected picks",
    "products": [
      {
        "productId": "8322626126020",
        "graphqlId": "gid://shopify/Product/8322626126020",
        "handle": "14k-dangling-obsidian-earrings",
        "title": "14k Dangling Obsidian Earrings",
        "variants": [
          {
            "variantId": "45038877868228",
            "variantGraphqlId": "gid://shopify/ProductVariant/45038877868228",
            "inventoryQuantity": 0,
            "price": "829.00"
          }
        ],
        "hasOnlyDefaultVariant": true,
        "requiredQuantity": 1
      }
    ]
  }
}
```

---

## Template System

### FPB Templates (Two-Field System)

`bundleDesignTemplate` is **always `FBP_SIDE_FOOTER`** for all four FPB presets — confirmed via CSS attribute selectors in `easy-bundle-full-page-min.css` and `insertWrapperIntoBody` logic in `easy-bundle-full-page-min.js`. The preset is selected via `bundleDesignPresetId`.

| Display Name | `bundleDesignTemplate` | `bundleDesignPresetId` | Body CSS class added |
|---|---|---|---|
| Standard Design | `FBP_SIDE_FOOTER` | `DEFAULT_FBP` | `gbbMinimilisticLayout` + `gbbProductsCardLayoutV2` |
| Classic Design | `FBP_SIDE_FOOTER` | `CLASSIC` | `gbbMinimilisticLayout` + `gbbProductsCardLayoutV2` |
| Compact Design | `FBP_SIDE_FOOTER` | `COMPACT` | `gbbMinimilisticLayout` + `gbbProductsCardLayoutV2` |
| Horizontal Design | `FBP_SIDE_FOOTER` | `HORIZONTAL` | `gbbMinimilisticLayout` + `gbbProductsCardLayoutV2` |

Rendering logic applies `DEFAULT_FBP`/`CLASSIC`/`COMPACT`/`HORIZONTAL` via the body attribute `gbb-bundle-design-preset-id="{presetId}"` — CSS scopes design differences under that selector. Older captured notes used `DEFAULT` for Standard Design, but a 2026-06-05 live reset of `WPB Research Landing Bundle 2026-05-22` confirmed EB storefront runtime now exposes Standard Design as `stepsConfigurationData.bundleDesignPresetId: "DEFAULT_FBP"` and body attribute `gbb-bundle-design-preset-id="DEFAULT_FBP"`.

### PPB Templates (Two-Field System)

| Display Name | `bundleDesignTemplate` | `templateId` | Storefront module |
|---|---|---|---|
| Product List | `PDP_INPAGE` | `CASCADE` | `gbbMix.templates.CASCADE.init()` |
| Product Grid | `PDP_INPAGE` | `COGNIVE` | `gbbMix.templates.COGNIVE` (lightweight override) |
| Horizontal Slots | `PDP_MODAL` | `MODAL` | `gbbMix.gbbMixAndMatchBundle.initialize()` |
| Vertical Slots | `PDP_MODAL` | `SIMPLIFIED` | same as MODAL (admin-only label; CSS-class differentiated) |

`PDP_INPAGE` vs `PDP_MODAL` is a binary dispatch: inpage uses `gbbMix.templates`, modal uses `gbbMix.gbbMixAndMatchBundle`. `SIMPLIFIED` has zero occurrences in widget JS — its visual differentiation from `MODAL` is driven by `renderFilledSlotsAsHorizontalStacked` → CSS class `gbbMixProductPageCategoriesWrapperHStacked` / `VStacked`.

---

## Storefront Runtime

### FPB Global Namespace

| Global | Purpose |
|---|---|
| `window.gbb` | Main FPB state + function container |
| `window.gbb.settings.stepsConfigurationData` | Inline-embedded bundle config (all steps, categories, product IDs, template IDs, box selection, text config) — primary source of truth on load |
| `window.gbb.state` | Widget runtime state (current step, navigation items, selected items) |
| `window.gbb.gbbBoxSelection` | Box-selection module (`.state` + `.f` sub-namespaces) |
| `window.easybundles_ext_data` | Storefront data blob with 6 top-level keys (see below) |
| `window.easybundle_user_ext_data` | User-level tokens — **never copy to docs** |

`stepsConfigurationData` is embedded as a JSON script in the app-proxy HTML response — not fetched asynchronously. Products are ID-only in this payload; widget fetches full product data via Storefront API `nodes(ids:[...])` on init.

**FPB DOM attributes:**

```html
<html class="js bundle-{id} gbbBundle-HTML">
<div id="gbbBundle"
     class="gbbPageBody gbbMinimilisticLayout gbbProductsCardLayoutV2"
     data-template-id="FBP_SIDE_FOOTER"
     data-is-last-page="true | false">
```

Body attribute: `gbb-bundle-design-preset-id="{DEFAULT_FBP | CLASSIC | COMPACT | HORIZONTAL}"`

Per-product attributes: `productid="{numericId}"` `firstvariantid="{numericVariantId}"`

Per-category attribute: `categoryid="{categoryId}"`

### PPB Global Namespace

| Global | Purpose |
|---|---|
| `window.gbbMix` | Main PPB widget container |
| `window.gbbMix.gbbMixAndMatchBundle.state` | PPB runtime state (offerId, selectedProducts, categories, cartData, pagination counts) |
| `window.gbbMix.settings.pageCustomizationSettings.mixAndMatchBundleSettings` | Processed store-level PPB settings (25+ fields) |
| `window.GbbMixState` | Alias / secondary state accessor |

PPB is entirely separate from FPB — `window.gbb` does **not** exist on PPB storefront pages.

### `window.easybundles_ext_data` Top-Level Structure (FPB)

```json
{
  "userData":             { ... },
  "languageData":         { ... },
  "pageCustomizationData": {
    "mixAndMatchData":    { ... }
  },
  "bundleLinkData":       { ... },
  "bundleUpsellData":     { ... },
  "mixAndMatchData":      { ... }
}
```

`pageCustomizationData.mixAndMatchData` mirrors `mixAndMatchBundleSettings` (store-level PPB settings, present on FPB page too).

### PPB Runtime State Key Fields

```json
{
  "offerId": "MIX-894502",
  "initFlow": "SDK",
  "useSingleStepCategoriesAsBundleSteps": false,
  "selectedProductsViewState": "VERTICALLY_STACKED",
  "productToFetchCnt": 24,
  "collectionProductsToFetchCnt": 24,
  "allProductsPaginationCnt": 24,
  "currSelectedCategory": "category69520",
  "validateQuantityPerProduct": { "isEnabled": false, "allowedQuantity": 1 },
  "cartData": {
    "selectedCategoriesProducts": { "category69520": [], "category19687": [] },
    "items": [], "item_count": 0, "total_price": 0, "discounted_price": 0
  }
}
```

### `mixAndMatchBundleSettings` Full Schema (25+ fields)

This is the store-level global PPB config object. Captured from `gbbMix.settings.pageCustomizationSettings.mixAndMatchBundleSettings`:

```json
{
  "hideOutOfStockProducts":                  true,
  "addBundleToCartOnDone":                   false,
  "renderSlotsBasedOnCondition":             true,
  "renderFilledSlotsAsHorizontalStacked":    false,
  "addToBundleOnProductCardClick":           true,
  "useSingleStepCategoriesAsBundleSteps":    false,
  "validateConditionsBeforeAddToCart":       true,
  "maxSlotsPerRow":                          3,
  "displayConditionDescriptions":            true,
  "expandProductCardOnHover":                false,
  "displayPrices":                           true,
  "displayCompareAtPrices":                  false,
  "displayQuantityInput":                    false,
  "displaySeeMoreLink":                      true,
  "displaySwatchColours":                    false,
  "displaySwatchImages":                     false,
  "bundleAddingAnimation":                   "SLIDE",
  "cartIconType":                            "ICON",
  "cartStyle":                               "DEFAULT",
  "productCardStyle":                        "CARD_V2",
  "slotCardStyle":                           "CARD_V1",
  "checkoutButtonStyle":                     "DEFAULT",
  "bundleCtaTextConfig":                     { ... },
  "bundleSummaryConfig":                     { ... },
  "pricingConfig":                           { ... }
}
```

Admin location: Settings → Controls → Product Page Layout section.

`useSingleStepCategoriesAsBundleSteps` when `true`: each category within a single PPB step renders as a discrete navigable step (Next/Prev navigation), rather than showing all categories simultaneously as tabs.

---

## Cart Integration

### FPB Cart Add Flow

```
1. POST /cart/add.js                      → JSON body; adds component items
2. POST /api/2025-04/graphql.json         → GetCartMetafield (reads existing bundle_details)
3. POST /api/2025-04/graphql.json         → cartMetafieldsSet (writes/merges bundle_details)
4. POST /cart/update.js                   → clears cart note
5. redirect to /checkouts/...
```

`/cart/add.js` body:

```json
{
  "items": [
    {
      "id": 45038877868228,
      "quantity": 1,
      "properties": {
        "Box": "1",
        "_bundleName": "WPB Research Landing Bundle 2026-05-22",
        "_easyBundle:prodQty": 1,
        "_easyBundle:OfferId": "FBP-2_K6C_1"
      }
    }
  ]
}
```

### PPB Cart Add Flow

```
1. POST /apps/gbb/updateMixAndMatchBundleView  → view tracking
2. GET  /cart.js?app=gbbMixBundleApp           → pre-add cart state
3. POST /api/2025-04/graphql.json              → GetCartMetafield
4. POST /api/2025-04/graphql.json              → cartMetafieldsSet
5. POST /cart/add                              → multipart/form-data; adds component items
```

`/cart/add` fields:

```
items[0][id]                              = 45038877868228
items[0][quantity]                        = 1
items[0][properties][Box]                 = 1
items[0][properties][_easyBundle:OfferId] = MIX-894502_K1K_1
items[0][properties][_easyBundle:prodQty] = 1
```

PPB Cart Transform responds with OVERWRITE_LINE_ITEM — the `/cart/add` response already contains the parent bundle line item (Cart Transform fires synchronously in Shopify's pipeline).

### `_easyBundle:OfferId` Format

```
FBP  → "FBP-{bundleId}_{sessionKey}_{itemIndex}"
PPB  → "MIX-{offerId}_{sessionKey}_{itemIndex}"
```

`sessionKey` is a short random string (3–4 chars) generated per add-to-cart event, making duplicate bundle adds distinguishable in cart.

### `bundle_details` Cart Metafield

Both FPB and PPB write a `bundle_details` cart metafield via Storefront API after every add-to-cart:

```json
{
  "key": "bundle_details",
  "value": "{\"FBP-2_K6C\":{\"displayProperties\":{\"Items\":\"1 x 14k Dangling Obsidian Earrings\"}}}"
}
```

Metafield key per bundle add: `{offerId}_{sessionKey}` (without item index). Multiple add-to-cart events accumulate entries under separate keys within the same metafield JSON blob.

### FPB vs PPB Cart Add Comparison

| Aspect | FPB | PPB |
|---|---|---|
| Endpoint | `POST /cart/add.js` | `POST /cart/add` |
| Content-Type | `application/json` | `multipart/form-data` |
| Cart Transform operation | EXPAND / MERGE | OVERWRITE_LINE_ITEM |
| Step data in cart | Not present (client-only) | Not present |
| `bundle_details` key format | `{offerId}_{sessionKey}` | `{offerId}_{sessionKey}` |

Step information (`_boxProduct`, `_Category`, `_CategoryName`) is tracked client-side only — it is **never sent** to `/cart/add.js`.

---

## Widget Features

### Box Selection (FPB only)

Admin: FPB configure → Bundle Settings → "Bundle Quantity Options" checkbox (= `isEnabled`) + "Enable Quantity Validation" sub-checkbox (= `validateBoxSelectionQuantity`).

`gbbBoxSelection.state` runtime schema:

```json
{
  "isEnabled": true,
  "rules": [
    {
      "ruleId": "652",
      "boxQuantity": 3,
      "boxLabel": "Box of 3",
      "boxSubtext": "15% off",
      "isDefaultSelected": true
    }
  ],
  "activeRule": { "ruleId": "652", "boxQuantity": 3, ... },
  "highestQuantityRule": { ... },
  "blackListedPages": ["personalizationPage"],
  "autoProceedToNextRule": true,
  "validateBoxSelectionQuantity": false,
  "isAutoDecrementAllowed": true
}
```

`boxSelection` admin save shape (with `textConfig`):

```json
{
  "boxSelection": {
    "isEnabled": false,
    "validateBoxSelectionQuantity": false,
    "rules": [
      { "ruleId": "134", "boxQuantity": 2, "boxLabel": "Box of 2", "boxSubtext": "5% off", "isDefaultSelected": true }
    ],
    "textConfig": {
      "isEnabled": false,
      "boxConditionSuccessText": "All Set! (You can add more items)",
      "boxConditionInitialText": "Select upto {{quantityDifference}} Items",
      "boxConditionInProgressText": "{{quantityDifference}} Items to Go"
    }
  }
}
```

**ATC enforcement logic (`validateBoxSelectionOnCheckout`, decompiled):**

```javascript
function validateBoxSelectionOnCheckout() {
  const { activeRule, validateBoxSelectionQuantity } = gbb.gbbBoxSelection.state;
  if (!validateBoxSelectionQuantity) return true; // never blocked when validation disabled
  const { items_quantity } = gbb.gbbBoxSelection.f.getFilteredCartItemsForBoxSelection();
  return items_quantity == activeRule?.boxQuantity; // exact match required
}
```

When `validateBoxSelectionQuantity: false` (the default), the ATC button is **never blocked** regardless of how many items are selected.

**ATC button DOM:** A `div.gbbFooterNextButton` (not a native `<button>`). Enforcement is CSS-class-based — `.gbbBoxSelectionMaxQtyLimitReached` is added to `.gbbPageBody` when max is reached. The button never gets a native `disabled` attribute.

**Box tier selector DOM:**

```html
<div class="gbbBoxSelectionWrapper" data-total-rules="1" data-active-rule-id="652">
  <div class="gbbBoxSelectionItem gbbBoxSelectionItemActive"
       data-box-quantity="3"
       data-rule-id="652"
       data-is-active="true">
    Box of 3
  </div>
</div>
```

### Bundle Text Config (FPB)

`bundleTextConfig` has exactly **one sub-key** with exactly **two string fields**:

```json
{
  "bundleTextConfig": {
    "bundleSummary": {
      "title": "Your Bundle",
      "subTitle": "Review your bundle"
    }
  }
}
```

Admin controls: FPB configure → Bundle Settings tab → Bundle Cart section → "Bundle Cart Title" and "Bundle Cart Subtitle" textboxes.

Storage: inline in the `gbb-settings-data` script element in the app-proxy HTML (per-bundle, not global settings).

**Note:** The FPB "Messages" nav section is a separate gift messaging feature (virtual gift product, sender/recipient fields, email templates) and is unrelated to `bundleTextConfig`.

### Collection Pagination Architecture

EB does **not** use cursor-based Storefront API pagination (`collection { products(first: N, after: cursor) }`). All product IDs for a collection are pre-fetched; product data is hydrated in batches of 24 via `nodes(ids:[...])`.

Client state: `gbbAddProductsPage.state.dataForInfiniteScroll.allProductsData`, `fetchCountPerBatch: 24`, `fetchBatchStartIndex` tracks position.

A 29-product collection triggers two parallel `nodes()` calls: 24 products + 5 products.

**Implication for Wolfpack:** we can use either approach (pre-fetch all IDs server-side, or cursor-paginate). EB's choice is client-side batching; Wolfpack should decide based on our existing server-prepared config strategy.

### `displayVariantsAsIndividualProducts`

When `true` for a category, each variant of a multi-variant product renders as its own product card:

```html
<div class="gbbMixCascadeProductWrapper" data-current-selected-variant-id="{variantId}">
  <div class="gbbMixCascadeCurrentVariantTitle">{variantTitle}</div>
</div>
```

Parent product ID is repeated across all variant cards. For products with `hasOnlyDefaultVariant: true`, the DOM is identical regardless of the flag value.

Storage: per-category field in both FPB and PPB (`displayVariantsAsIndividualProducts`, `displayVariantsAsSwatches`).

### Multi-step FPB Navigation

Steps are keyed `addProductsPage{N}`. Advancing to the next step is a **full page navigation** (`?page=addProductsPage{N}`), not an SPA state swap.

Completed step: `gbbNavigationStepImgContainerActive` class removed; icon container gets `background-color: rgb(0, 0, 0)` and a `gbbtickMark` SVG checkmark.

Active step: `gbbNavigationStepImgContainerActive` class + `border: 4px solid`.

Progress bar: `div.gbbStepsProgressBarFilled` width transitions from `0px` to full span between icons.

Last-step footer: "Next" button (`gbbFooterNextButton`) becomes "Add To Cart" on the final step.

JS state transition (Step 1 → Step 2): `currentPageId: "addProductsPage1"` → `"addProductsPage2"`, `isLastPage: false` → `true`.

---

## Wolfpack Implementation Targets

### DB Model Alignment

| EB field | Wolfpack model | Notes |
|---|---|---|
| `productsData{N}` | `Step` | Keep stable step key; rank is N |
| `categories.{categoryId}` | `StepCategory` | Stable ID as primary key |
| `category.products[].graphqlId` | `CategoryProduct.productGid` | Admin save payload preserves hydrated picker objects; DB/storage may normalize GIDs for app ownership |
| `category.collectionsSelectedData[].id` | `CategoryCollection.collectionGid` | Admin save payload preserves hydrated collection objects; DB/storage may normalize GIDs for app ownership |
| `displayVariantsAsIndividualProducts` | `StepCategory.displayVariantsAsIndividualProducts` | Per-category boolean |
| `displayVariantsAsSwatches` | `StepCategory.displayVariantsAsSwatches` | Per-category boolean |
| `conditions.rules[]` | `StepCondition[]` | Per-step or per-category |
| `discountConfiguration` | `Bundle.discountConfig` | Admin-only; compact version → metafield |
| `defaultProductsData` | `BundleDefaultProduct[]` | Per-bundle preselected product list |
| `boxSelection` | `Bundle.boxSelection` | FPB-only; nullable |
| `bundleTextConfig.bundleSummary` | `Bundle.cartTitle / Bundle.cartSubtitle` | Two string fields only |

Do NOT add backwards-compatibility shims. New fields get direct DB columns with sensible defaults.

### Storefront DTO Shape

The public DTO should preserve the category-first step shape EB uses:

```ts
type PublicBundleConfig = {
  bundleId: string;
  bundleType: "full_page" | "product_page";
  templateId: string;
  steps: Array<{
    key: `productsData${number}`;
    rank: number;
    title: string;
    subtitle: string;
    categories: Record<string, {
      categoryId: string;
      rank: number;
      title: string;
      products: Array<{ gid: string; numericId: string; variants: Variant[] }>;
      collectionsData: Array<{ gid: string; handle: string }>;
      displayVariantsAsIndividualProducts: boolean;
      displayVariantsAsSwatches: boolean;
      conditions: Condition[];
    }>;
    conditions: Condition[];
  }>;
};
```

### Transport Model

Keep existing Wolfpack transport — do **not** switch to EB's client-side-hydration-only approach:

- FPB: app-proxy route; config injected into HTML via `data-bundle-config` attribute (metafield) or JSON script; proxy fallback if metafield absent
- PPB: theme app extension block on product page; config from product metafield
- Selective Storefront API hydration where freshness matters (e.g., live inventory for displayed products)

### Shopify Bundle Product Activation Gotcha

For Cart Transform `LinesMerge` proof, the bundle parent product must be `ACTIVE`. On 2026-05-26, the test store rejected the current Admin GraphQL status mutation (`productUpdate(product: { id, status: ACTIVE })`) for a parent variant with `requiresComponents: true` when the ChatGPT / Agentic publication was installed:

```json
[
  {
    "field": ["resourcePublications", "channelId"],
    "message": "Resource publications channel ChatGPT does not support bundle products"
  },
  {
    "field": ["publications", "0", "channelId"],
    "message": "Channel ChatGPT does not support bundle products"
  }
]
```

Read-only introspection on the same store confirmed `productChangeStatus` is not available and the current schema exposes `productUpdate(product: ProductUpdateInput)`. The product had no resource publications and all publications (`Online Store`, `ChatGPT`, `Point of Sale`, `Shop`) were unpublished, so the failure is triggered by Shopify's managed publication validation rather than by an app-supplied publication input.

Follow-up proof on 2026-05-26:

- `productSet(identifier: { id }, input: { status: ACTIVE })` fails with the same unsupported ChatGPT bundle-publication validation.
- Temporarily setting the ChatGPT publication `autoPublish=false` through `publicationUpdate` also does not bypass `productUpdate`; Shopify still validates the installed publication list.
- A product-scoped sequence works for the proof bundle: set the parent variant `requiresComponents=false`, update the product to `ACTIVE`, then set the same parent variant back to `requiresComponents=true`.
- Proof file: `/private/tmp/wpb-fpb-parent-requirescomponents-activation-sequence-2026-05-26.json`.
- After this sequence and the cached-variant parent reference fix, live cart proof `/private/tmp/wpb-fpb-standard-addon-combined-cart-after-active-parent-2026-05-26.json` shows Shopify rendering one parent bundle line at `$663.00` with public `Items`, `Retail Price`, and `You Save` properties.

Related Shopify Developer Community thread: https://community.shopify.dev/t/productupdate-fails-for-bundle-products-when-store-has-agentic-storefronts-enabled-microsoft-copilot-does-not-support-bundle-products/34620. The reported current workaround is to disable Direct Checkout for the incompatible agentic channel globally; no per-product API exclusion was identified in the current schema.

---

## Source Evidence

All facts in this document were captured live from `yash-wolfpack.myshopify.com` during a Chrome DevTools MCP investigation session on 2026-05-22/23.

**Primary evidence record:** `docs/competitor-analysis/16-eb-full-data-flow-investigation.md` (2548 lines, 9 phases, all 8 originally identified gaps resolved).

**Issue tracker:** `docs/issues-prod/eb-full-data-flow-investigation-1.md`

## Settings > Additional Configurations > Inventory Tracking Help Evidence

Captured from the EB in-app `Know More` article on 2026-06-01 while auditing Settings parity.

- The `Track inventory on Add To Cart (in beta)` toggle is configured under Settings > Additional Configurations.
- The toggle applies globally to all bundles.
- Shopify product-level `Track Quantity` must be enabled for each child product for inventory tracking to work correctly.
- Products with zero inventory are not shown in the bundle.
- Digital products should have inventory set to `0 or below` so EB can recognize them as digital.
- If `Track Quantity` is not enabled, the product can still appear in the bundle builder, but customers cannot add it to cart when it is out of stock.
- If Shopify `Allow out-of-stock` is enabled and inventory is above 0, EB may not identify the product as digital, which can restrict add-to-cart behavior.
