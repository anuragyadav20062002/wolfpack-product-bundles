---
title: EB Implementation Reference
type: reference
last_updated: 2026-06-12
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

## FPB Rules Configuration

These Rules Configuration notes are scoped to EB Landing Page Bundles, also called FPB in WPB. They must not be treated as confirmed PPB behavior unless separately verified.

Rules in EB FPB control customer selection requirements while building a bundle. A step can use exactly one rule mode at a time: Step Rules or Category Rules.

### Critical Constraint: Step Rules and Category Rules Are Mutually Exclusive

- One step cannot enforce both whole-step constraints and per-category constraints.
- Step Rules apply to the total selected products in the step.
- Category Rules apply independently to categories inside the step.
- Enabling one mode must disable or clear the conflicting mode for that step.

### Step Rules

Step Rules apply to the total number of products selected in a step, regardless of category.

Use Step Rules when the merchant needs a total count for the step, such as selecting any 3 products from the available products.

Supported configuration:
- Range, such as select between 3 and 6 products.
- Exact match, such as select exactly 3 products.

Auto-next behavior:
- EB exposes "Auto next when condition is met" for Step Rules.
- When enabled for an exact-match rule, the storefront advances to the next step as soon as the customer satisfies the condition.
- Example: if the rule requires exactly 3 items, selecting the 3rd item advances automatically.

### Category Rules

Category Rules apply specific constraints to individual categories inside one step.

Prerequisite:
- Category Rules are only available when the current step has multiple categories assigned.
- A single-category step must not expose Category Rules.
- In the WPB configure UI, this must be based on the current draft category list, not only the saved database state. Adding a second unsaved category should show Category Rules immediately; discarding that unsaved category should hide Category Rules again.

Use Category Rules when the merchant needs a specific mix across categories, such as 2 products from Women's and 2 products from Men's.

Supported metrics:
- Quantity: number of selected items.
- Amount: total selected item value.
- Weight: total selected item weight.

Supported conditions:
- Equal to.
- Greater than or equal to.
- Less than or equal to.

Unsupported conditions:
- Strict greater than.
- Strict less than.

Each category's rules are configured independently.

## FPB Step Flow Configuration

These Step Flow notes are scoped to EB Landing Page Bundles, also called FPB in WPB. They must not be treated as confirmed PPB behavior unless separately verified.

EB FPB Step Flow defines the bundle architecture before the merchant configures detailed steps, categories, products, rules, discounts, and design.

### Steps and Categories Hierarchy

These Categories notes are scoped to EB Landing Page Bundles, also called FPB in WPB. They must not be treated as confirmed PPB behavior unless separately verified.

EB FPB organizes products with a strict hierarchy:

```
Step -> Category -> Products
```

Steps are the parent level. Categories are the child level inside a step.

Step behavior:
- A Step is a distinct stage in the bundle-building journey.
- Each Step creates a separate page or view.
- Steps control navigation flow, such as Step 1 -> Step 2 -> Step 3.
- Customers must intentionally move from one step to the next, usually with a Next Step action.
- Use Steps when the bundle should be broken into clear milestones.

Category behavior:
- A Category is a product group displayed within a Step.
- Categories organize products on the same page or view without forcing a reload.
- Customers can browse multiple categories within the same step.
- Use Categories when customers should mix and match items from different collections on the same screen.

Scenario guidance:
- Outfit Builder: use 1 Step named Build Your Look with 2 Categories, such as Shirts and Pants, when customers should choose both on the same screen.
- Gift Box: use 2 Steps when customers should first pick a box and then fill it. Step 1 contains 1 Category for Boxes. Step 2 contains multiple Categories such as Candles, Soaps, and Candy.

### Bundle Strategy and Initialization

The merchant first chooses the bundle experience and flow structure.

Bundle experiences:
- Mix-and-Match Bundle: customers select product variants while satisfying a total quantity requirement.
- Landing Page Bundle Builder: creates a dedicated bundle-building page.
- Product Page Bundle Builder: embeds the builder into the product discovery flow on a standard product page.

Flow structures:
- Single-Step: customers select items from one interface, optionally using multiple categories or filters. This is used for bulk-buy flows such as a box of 6. Mix-and-match bundles can define required total quantities such as 3, 6, or 9 items.
- Multi-Step: customers proceed through a sequence, such as Step 1 choosing a bag and Step 2 choosing accessories.

Creation flow:
1. Click Create Bundle.
2. Select the template for the chosen experience.
3. Select the design.
4. Enter the bundle name.
5. Click Create.

Backend requirement:
- Creating the bundle automatically creates a virtual parent bundle product.
- The virtual parent product is required for inventory, cart, and checkout behavior.
- Deleting or altering the virtual parent product directly in Shopify outside the app can break the bundle.

### Step and Category Configuration

Step 1 starts with one default category. The merchant must add products to that category.

Supported step/category actions:
- Add additional categories inside a step, such as Savory and Sweet.
- Rename steps directly in the interface.
- Rename categories directly in the interface.
- Add a new blank step with Add Step.
- Clone an existing step to duplicate its structure and settings.

### Product Slots Configuration

Product Slots configuration is scoped to EB Landing Page Bundles, also called FPB in WPB. It is not a PPB configuration surface.

Scope:
- Exposed only in FPB Bundle Settings.
- Applies to empty slots shown in the summary/sidebar area of FPB templates.
- Replaces the default empty slot plus icon with the merchant-uploaded Slot Icon when an FPB template renders empty slots.
- Only applies when rules are based on quantity.
- Does not apply to PPB modal or in-page slot templates.

Asset behavior:
- The uploaded Slot Icon is stored in the merchant's Shopify store assets.
- The practical upload limit is smaller than Shopify's general store asset maximum.
- If no Slot Icon is configured, FPB empty slots fall back to the default plus icon.

### Selection Rules and Blocking Behavior

Rules control valid customer selections and whether customers may proceed or check out.

Step-level rules:
- Apply to the total product count in a step.
- If the customer selection is below the minimum requirement, the Next action is disabled or produces an error.
- Example: Step 1 requires at least 2 products total.

Category-level rules:
- Apply to specific categories inside a step.
- If a category selection does not satisfy its requirement, the customer cannot proceed.
- Example: require exactly 1 product from Category 1 and exactly 1 product from Category 2.

Blocking and skip behavior:
- If a category rule limits selection to exactly 1, adding a second product from that category is blocked.
- If a step rule requires a minimum of 2 products and the customer has selected only 1, moving to the next step is blocked.
- If a customer tries to skip a step with unmet minimum requirements, EB shows an error describing the missing criteria, such as needing one more product.

### Discounts and Pricing in Step Flow

Discounts incentivize higher quantity purchases and can use multiple tiers.

Supported discount types:
- Fixed amount.
- Percentage.
- Fixed price bundle.
- Tier-based offers such as buy 3 at a fixed price and get 1 free, or buy 5 at a fixed price and get 2 free.

Tier behavior:
- Example: if product count is 2, apply 5% off.
- Example: if product count is 4, apply 10% off.
- Example: if product count is 6, apply 15% off.
- Increasing the maximum tier count is scoped to the current bundle and does not alter other live bundles.
- Increasing tier capacity may reduce the total number of bundles available in the merchant account.
- If additional tier fields do not appear after increasing the limit, reloading the bundle editor usually makes them visible.

### Design and Customization

Preview Bundle triggers the design selection flow the first time.

Design flow:
- Choose the layout template for Landing Page or Product Page.
- Customize brand colors, including primary and secondary colors.
- Customize styling such as corners, font sizes, and related visual settings.
- Design settings remain editable after creation.

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
- 2026-07-01 EB Admin Step Setup evidence: opening a category shows `Add Products` and a selected-count chip such as `7 Selected`; EB does not render selected product rows inline in the category accordion. Clicking the chip opens a `Selected Products` modal with draggable product rows, remove buttons, `Close`, and `Add Products`. Evidence lives under `/private/tmp/fpb-standard-agentic-parity/admin-category-selected-products/`.

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

2026-06-29 P09 paid add-on cart proof: EB adds a selected paid add-on as a separate cart line with line-level discount allocation, not only as parent-bundle metadata. Evidence in `/private/tmp/fpb-standard-agentic-parity/P09-paid-addon-tier/eb-cart-proof-one-paid-cart-after-wait.json` shows the add-on line carrying `Box`, `_addon_product: true`, `_addonTierId`, and `_addon_offer_id`, with original price `82900`, final line price `74610`, `discounts[0].title: "Add On"`, and a `10.0` percentage line-level allocation of `8290`. The parent bundle line remains separate and carries `_EasyBundleId`, `_originalOfferId`, `_addon_offer_id`, and public `Items`. Current cart-page UI proof in `/private/tmp/fpb-standard-agentic-parity/cart-lines-ui/eb-cart-page-current-mobile.png`, `eb-cart-page-current-dom-probe.json`, and `eb-cart-ui-probe.json` shows the Dawn/native discounted-line treatment: regular price, sale price, and `Add On` appear on the add-on line; the parent line does not show `Retail Price` / `You Save` for add-on-only savings. The tested paid-add-on and current base-bundle cart pages did not show a separate bottom `Total Savings` row after `Estimated total`; `/cart.js` still carries the native `total_discount`. WPB Cart Transform source now splits `_bundle_step_type=addon:PERCENTAGE:n` lines out of the parent MERGE, preserves public parent cart-line messaging from `_bundle_display_properties`, and the FPB widget source now excludes selected paid add-ons from parent display metadata so add-on-only savings do not leak into parent `Retail Price` / `You Save`. Exact EB parity for the original/sale price labels requires the Discount Function to own the add-on line discount allocation.

2026-06-29 checkout UI proof: EB checkout does not add a custom app-rendered savings panel under bundle lines. Evidence in `/private/tmp/fpb-standard-agentic-parity/checkout-ui/eb-checkout-reference-current.snapshot.txt` shows the add-on line with native `Box: 1`, native discount rows `Discount code` / `ADD ON (-₹82.90)`, native original/discounted prices, and the parent line with native `Box: 1` plus `Items: 1 x 14k Dangling Obsidian Earrings`. WPB proof in `/private/tmp/fpb-standard-agentic-parity/checkout-ui/wpb-checkout-box-fix-expanded.snapshot.txt` shows the child line leakage removed (`Retail Price` / `You Save` absent) and the checkout UI extension asset loaded from `bundle-checkout-ui`; the extension must render nothing for FPB parity and leave native checkout rows as the display surface.

2026-07-01 checkout UI source correction: the reductions target must read checkout state through the supported Preact hooks from `@shopify/ui-extensions/checkout/preact` (`useCartLines`, `useDiscountAllocations`, and `useTotalAmount`). Direct reads from `globalThis.shopify.lines` / `discountAllocations` are not a reliable source contract for the live extension runtime. Cart-line render targets remain inert for FPB parity; only `purchase.checkout.reductions.render-after` may render the EB-style `TOTAL SAVINGS` row when native discount allocations or readable bundle savings attributes are present.

2026-07-01 Standard sidebar behavior proof: EB shows the add-on title/message section in the desktop summary sidebar only while the shopper is on paid product steps. On the add-on step, that section is absent and the sidebar contains the normal selected-product summary, total, and cart action. EB also gates summary product removal by current step: products selected from other steps show a disabled trash affordance, and clicking it toasts `Remove This Product From <Step Name>`. Selected Standard product cards use a black `2px` outline with `border: 0`, preserving card dimensions. Current evidence is in `/private/tmp/fpb-standard-agentic-parity/addon-summary-sidebar-current/` and `/private/tmp/fpb-standard-agentic-parity/selected-card-border/`.

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
- Help content observed: `Free Gift & Add Ons` exposes `How to setup?`, opening the EB help/chat article `[Classic] How to provide additional add-ons with different discounts, like gifts, on bundle builders`; the article says PDP bundles do not support free gifts directly, Landing Page layout gives more flexibility for free gifts, configure Add-ons under Step Setup, set add-on name/title, create discount tiers, set conditions and add-on products, customize qualification notifications, save, then preview. Fresh 2026-06-21 parity correction: the `Add-Ons and Gifting Step` card and `Add-Ons with Bundles` card have separate toggles. The gifting-step toggle creates the storefront `Add On` navigation step by itself. The Add-Ons with Bundles toggle attaches selected add-on products, thresholds, discounts, tier rules, and footer messages to that step; its tiers must not be treated as the only reason the `Add On` step exists. EB setup supports multiple tiers, for example `3 products = 20% off add-ons` and `6 products = free add-on`, so runtime tier evaluation must consider all tiers and select the highest eligible tier instead of hardcoding tier 1. No visible Messages or email-specific help links were present on the Messages card in this run.
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

**Classic C05 storefront note (2026-07-04):** In the verified Classic fixed-amount quantity fixture, EB Admin had Bundle Quantity Options enabled (`Box of 2` / `₹5 off`) while Progress Bar and Discount Messaging were disabled. Cache-bypassed EB desktop and mobile storefront proof kept the box selector visible, hid `gbbDiscountComponent`, and rendered no discount-progress/message copy; only the step timeline progress remained visible. Treat Bundle Quantity Options as separate from Progress Bar/Discount Messaging display toggles.

**Classic C05 fixed bundle price storefront/cart note (2026-07-04):** After EB Admin saved `Fixed Bundle Price` through `/api/discount/updateFixedBundle`, the current Classic storefront still kept the existing Bundle Quantity Options label/subtext (`Box of 2` / `₹5 off`). With two products selected, the Classic desktop sidebar and mobile footer showed the raw selected-products total (`₹1158.00`) and did not render the fixed bundle price as a separate final summary total. Fresh cart proof for the same Classic fixed-price path posted two component items, then checkout/cart showed one `Daily Essentials` parent line at the raw selected-products total (`₹1158.00`) with no native discount allocation, no `You Save` cart-line property, and no fixed final price. Treat this fixture's Classic fixed-bundle-price value as display-only for summary/cart presentation, not as a cart-price override.
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
- Widget placement for upsell surfaces can be completed through Shopify theme editor app blocks; template choice and block position affect where those widget surfaces appear.
- Product Page Bundle Builder placement is different from merchant-dragged upsell blocks: 2026-06-11 Theme Editor evidence showed the PPB widget rendering while the native **Buy buttons** block was selected. Treat PPB as a Buy buttons/product-form replacement or override, not as a separate merchant-positioned block under Buy buttons.

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

2026-07-04 Classic parity guidance: EB Standard and Classic both use the same
`FBP_SIDE_FOOTER` wrapper classes (`gbbMinimilisticLayout` and
`gbbProductsCardLayoutV2`) and differ through `gbb-bundle-design-preset-id`.
Wolfpack Classic should therefore reuse shared FPB side-footer structure unless
live EB proof shows a Classic-only content or presentation difference.

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

### FPB Standard Variant Selector UI

For Standard Design (`FBP_SIDE_FOOTER` + `DEFAULT_FBP`), grouped variant products render an inline `Choose Options` dropdown on desktop when variants are not displayed as individual products.

Observed desktop behavior:
- The selected row uses the EB Standard card dropdown style: one row tall, `1.5px` light border, `5px` radius, Assistant text, and option rows with product images where available.
- Long option lists use a short scrolling dropdown viewport with a `max-height` transition when opening and closing.
- The dropdown paints above later product cards in the grid when expanded.
- The scrollbar is a narrow WebKit scrollbar: `3px` width, transparent scrollbar background, `#f1f1f1` track, and `#f6f6f6` thumb.

Evidence: `/private/tmp/fpb-standard-agentic-parity/variant-selector-dropdown-clipping/eb-long-dropdown-reference.json` and `eb-scrollbar-pseudo-reference.json`.

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
        "_wolfpackProductBundle:prodQty": 1,
        "_wolfpackProductBundle:OfferId": "FBP-2_K6C_1"
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
items[0][properties][_wolfpackProductBundle:OfferId] = MIX-894502_K1K_1
items[0][properties][_wolfpackProductBundle:prodQty] = 1
```

PPB Cart Transform responds with OVERWRITE_LINE_ITEM — the `/cart/add` response already contains the parent bundle line item (Cart Transform fires synchronously in Shopify's pipeline).

### `_wolfpackProductBundle:OfferId` Format

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

2026-07-03 Classic C04 gotcha, strengthened 2026-07-04: the EB Admin Bundle Settings surface can show the visible "Enable Quantity Validation" checkbox as checked while the cache-bypassed storefront still emits `boxSelection.validateBoxSelectionQuantity: false` and `gbbBoxSelection.state.validateBoxSelectionQuantity: false`. This remained true after disabling `Pre Selected Product`, changing the Step Rule to exact quantity `2`, and confirming Discount & Pricing only exposed Bundle Quantity Options with `Box of 2` / `₹5 off`. Treat the storefront runtime/config value as authoritative for parity and blocking proof; do not infer validation behavior from the Admin checkbox alone. Evidence: `/private/tmp/fpb-classic-agentic-parity/C04-slots-box-validation/eb-admin-c04-recheck-initial-20260703.txt`, `eb-c04-validation-recheck-desktop-runtime-20260703.json`, `eb-admin-c04-validation-reconfigured-20260704.txt`, `eb-c04-validation-desktop-runtime-before-next-20260704.json`, and `eb-c04-validation-mobile-expanded-runtime-20260704.json`.

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

Completed step: `gbbNavigationStepImgContainerActive` class removed; icon container gets `background-color: rgb(0, 0, 0)` and a centered white tick (`gbbtickMark` in EB DOM). Current desktop/mobile evidence in `/private/tmp/fpb-standard-agentic-parity/step-timeline-completed-tick/` confirms EB applies this only to completed past steps; the active step remains a white circle with a black border and image, and locked future steps keep the inactive image treatment.

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

## Checkout Integration Discount-Code Handoff

Captured from the EB checkout/side-cart functions article on 2026-07-02:

- EB lists post-add callbacks for checkout and cart apps. Article-listed entries are Theme cart drawer, GoKwik, Shopflo, Zecpay, Rebuy, Shiprocket/Fastrr, Monster cart, Upcart, and Kaching Cart.
- Checkout handoff examples include GoKwik `window.gokwikSdk.initCheckout(merchantInfo);`, Shopflo `window.Shopflo.openCheckout()`, Zecpay `zecpeCheckFunctionAndCall("handleOcc")`, and Shiprocket/Fastrr `shiprocketCheckoutBuyCartHandler()`.
- Side-cart/cart-refresh examples include Rebuy `Cart.getCart()`, Upcart `window.upcartOpenCart()`, and Kaching Cart `kachingCartApi.openCart()` plus `kachingCartApi.refreshCart()`. Theme cart drawer and Monster cart use EB-owned helper code in the article; WPB implements those as WPB-owned cart refresh/open callbacks rather than depending on competitor-owned globals.
- For some checkout apps EB persists the generated discount code into `sessionStorage` and the `discount_code` cookie before invoking the checkout app.
- When the checkout handoff bypasses the native Shopify checkout path where Cart Transform grouping is applied, WPB uses the Discount Function to recreate the bundle price modification through a generated Shopify app discount code.
- WPB-generated checkout-integration codes are created only for GoKwik, Shopflo, Zecpay, and Shiprocket/Fastrr. They use the `WPB-` prefix, one use, `PRODUCT` discount class, and a 30 minute expiry. The EB help article did not reveal a precise TTL, so 30 minutes is the documented default until live network/Admin discount evidence proves another value.
- Theme cart drawer, Rebuy, Monster cart, Upcart, and Kaching Cart do not create discount codes through the app-proxy endpoint because they keep the customer in a cart drawer/cart refresh flow.
- The automatic add-on discount path remains add-on-only. When a generated `WPB-` code is entered, the automatic branch suppresses add-on candidates so the code-triggered branch can apply base bundle and add-on savings without double discounting.
