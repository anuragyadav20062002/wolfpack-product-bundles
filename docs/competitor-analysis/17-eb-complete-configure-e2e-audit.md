# Easy Bundles Complete Configure E2E Audit

**Date:** 2026-05-25
**Store:** `yash-wolfpack.myshopify.com`
**Evidence root:** `/private/tmp/eb-complete-configure-audit-2026-05-25/`
**Related issue:** `docs/issues-prod/eb-complete-configure-e2e-audit-1.md`
**Status:** Evidence-backed research. No Wolfpack implementation changes.

This document records the fresh Easy Bundles Bundle Configure audit for both Landing Page bundles and Product Page bundles. It is intended as clone-planning input: Admin controls, saved payload fields, storefront effects, dependencies between settings, help content, and template mappings are documented only where backed by current screenshots, network payloads, or storefront runtime captures.

## Evidence Rules

- Screenshots were captured outside the git worktree under the evidence root. They must not be committed.
- Network request and response files in the same folder are the primary source for persisted Admin state.
- Storefront runtime JSON files are the primary source for DOM attributes, globals, and template runtime markers.
- Upload controls were exercised only with a generated 1x1 temporary PNG stored under `/private/tmp`. PPB widget image and PPB Step Config image persisted. FPB Bundle Banner upload persistence was not proven, but its storefront placement container was proven on desktop and mobile.
- Emails and Customize Emails are intentionally excluded from clone scope per user direction on 2026-05-25. No email-template behavior is claimed in this document.
- Repeated text such as `Audit ProductsAudit Products`, values such as `02`, and `allowedQuantity: 1222` are DevTools input/focus artifacts from this live audit. Treat them as proof that the field persists, not as EB defaults.

## Test Bundles

| Bundle type | Name | ID / offer | Storefront |
|---|---|---|---|
| Landing Page / FPB | `WPB Complete Audit Landing 2026-05-25` | `bundleId: "3"`, `offerId: "FBP-3"` | `https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/3?page=addProductsPage1&currentFlow=byob` |
| Product Page / PPB | `WPB Complete Audit Product Page 2026-05-25` | `_id: "6a14806bad4ec4a071161039"`, `offerId: "MIX-519528"` | `https://yash-wolfpack.myshopify.com/products/wpb-complete-audit-product-page-2026-05-25` |

Additional FPB discount and banner-upload checks used the existing research bundle `WPB Research Landing Bundle 2026-05-22`, `bundleId: "2"`, storefront `https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/2?page=addProductsPage1&currentFlow=byob`. Those captures are called out explicitly below and should not be confused with the disposable `bundleId: "3"` flow.

## Shared Admin Model

Both configure pages use a left setup rail and a readiness score. The common rail items are:

- Step Setup
- Discount & Pricing
- Bundle Visibility
- Bundle Settings
- Subscriptions
- Select template

The Product Page bundle create modal explains its purpose as flavour/color selection, one-page experience, and fast additions. Evidence: `ppb-create-product-type-detail.png`. Landing Page creation has its own type detail screenshot: `create-landing-type-detail.png`.

Help content is part of the implementation surface. The step help article says the model is Step -> Category -> Products, and the category help article clarifies that steps are parent pages/navigation while categories are child sections browsed inside a step. Evidence: `fpb-step-how-to-setup-article.png`, `ppb-step-how-to-setup-article.png`, `ppb-categories-how-to-setup-article.png`.

## Core Dependencies

| Dependency | Confirmed behavior | Evidence |
|---|---|---|
| Step rules vs category rules | The UI presents these as mutually exclusive rule modes. Category rules appear only after there is more than one category. | `ppb-admin-step-setup-second-category-category-rules-visible.png`, `ppb-rules-learn-more-article.png` |
| Products tab vs Collections tab | A category can be configured from products or collections. Storefront then renders direct products plus collection products in the same category experience. | `ppb-admin-step-setup-collections-tab.png`, `ppb-step-collection-picker-home-selected.png`, `ppb-storefront-desktop-step-setup-cascade.png` |
| Display variants individually | When enabled, variants render as separate product cards on the storefront. | `network-806-saveMultipleCategoriesData.request.network-request`, `fpb-storefront-desktop-bundle3-category2-variants.png`, `ppb-storefront-desktop-step-setup-cascade.png` |
| Discount Messaging | Requires Discount enabled. Message variables render into remaining-count and success copy on the storefront. | `fpb-admin-discount-messaging-variables-modal.png`, `ppb-storefront-desktop-discount-message-initial.png`, `ppb-storefront-desktop-discount-success-after-two-products.png` |
| Bundle Quantity Options | FPB can enable this only when discount rules are quantity-based. PPB BQO was enabled through keyboard interaction for percentage, fixed-amount, and fixed-bundle-price quantity rules and persisted `boxSelection.isEnabled: true`. BXY clears/disables box selection and uses customer-buys/customer-gets fields instead. | `fpb-admin-discount-bundle-quantity-enabled.png`, `fpb-admin-discount-bqo-disabled-on-amount.png`, `ppb-admin-discount-bqo-enabled-resolved.png`, `network-3475-ppb-discount-bqo-enabled-save.network-request`, `network-3528-ppb-discount-buyxgety-save.network-request` |
| Subscription plans | Subscription setup requires a common selling plan across all bundle products. Individual selling-plan/pre-order selection in FPB blocked bundle subscription retrieval until disabled. | `fpb-admin-subscriptions-blocked-by-individual-selling-plan.png`, `network-1854-validate-selling-plan-groups.network-response`, `ppb-admin-subscriptions-no-common-plan-alert.png`, `network-3185-ppb-validate-selling-plan-groups.network-response` |
| Select template | Template cards write compact design identifiers, then call `modifyBundleFields` to reset `previewTemplateSelectionModalCnt`. | FPB `network-2268/2339/2411/2476-*`, PPB `network-3244/3308/3373/3439-*`, modify requests |
| Upload controls | EB uploads images through `/api/utility/uploadImages`. PPB widget image and PPB step image then persist their returned CloudFront URLs into the bundle update payload. FPB Bundle Banner persistence was not proven because the live Admin upload opened the system file picker, but the storefront placeholder `.gbbAddProductPageBanners` was proven directly after the step subtext and before the product/category body on desktop and mobile. | `network-3559-ppb-widget-upload-image.network-response`, `network-3573-ppb-widget-enabled-save.network-request`, `network-3636-ppb-step-config-upload-image.network-response`, `network-3647-ppb-step-config-upload-save.network-request`, `fpb-storefront-bundle-banner-placement-desktop-followup.json`, `fpb-storefront-bundle-banner-placement-mobile-followup.json` |

## Landing Page Bundle Audit

### Step Setup

Admin controls observed:

- Step Flow card
- Add Step
- Step Setup checkbox
- Step Name
- Categories card
- Add Category
- Products/Collections category tabs
- Add Products
- Display variants as individual products
- Rules Configuration with Learn More
- Step Config upload
- Step Title

Persisted payload:

- Endpoint: `/api/stepsConfiguration/saveMultipleCategoriesData?bundleId=3`
- `productPageKey: "productsData1"`
- `pageType: "MULTIPLE_CATEGORY"`
- `productPageStepText: "Step 1 - Audit Products"`
- `productPageSubtext: "Choose audit products"`
- `displayVariantsAsIndividualProducts: true`
- Two categories were persisted, with product counts `2` and `1`.

Evidence:

- Admin screenshots: `fpb-created-step-setup-initial-after-create.png`, `fpb-admin-step-setup-after-save.png`, `fpb-step-product-picker-category1-selected.png`, `fpb-step-product-picker-18k-pedal-ring-selected.png`.
- Network: `network-806-saveMultipleCategoriesData.request.network-request`, `network-806-saveMultipleCategoriesData.response.network-response`.
- Storefront: `fpb-storefront-desktop-bundle3-category2-variants.png`, `fpb-storefront-mobile-bundle3-category2-variants.png`.

Storefront effect:

- The FPB app-proxy page mounted on `/apps/gbb/easybundle/3`.
- `window.gbb` was present in runtime capture, and the HTML/root included `bundle-3 gbbBundle-HTML`.
- Category 2 showed the `18k Pedal Ring` variants as distinct cards after the variant-individual setting was enabled.
- Evidence: `fpb-storefront-runtime-template-standard.json`.

### Add-ons

Admin controls observed:

- Free Gift / Add-ons enable checkbox
- Multi-tier add-on type
- Tier title
- Product picker for add-on product
- Eligibility condition by bundle value
- Add-on discount type and value
- Add-on messaging

Persisted payload:

- Endpoint: `/api/stepsConfiguration/savePersonalization`
- `personalizationData.isPersonalizationEnabled: true`
- `addonProducts.isEnabled: true`
- `addonProducts.type: "MULTI_TIER"`
- Tier product: `14k Dangling Obsidian Earrings`
- Eligibility condition: `type: "AMOUNT"`, `value: 1`, `isValidateEligibilityConditionEnabled: true`
- Discount: `type: "PERCENTAGE"`, `value: 10`
- Add-on messaging includes eligible and ineligible states.

Evidence:

- Admin screenshots: `fpb-admin-free-gift-add-ons-default.png`, `fpb-admin-free-gift-add-ons-enabled.png`, `fpb-admin-free-gift-addons-bundle-value-selected.png`.
- Help screenshot: `fpb-addons-help-article-overlay.png`.
- Network: `network-934-savePersonalization-addonProducts.request.network-request`.
- Storefront: `fpb-storefront-desktop-after-addons-save-ineligible.png`, `fpb-storefront-desktop-addons-eligible.png`, `fpb-storefront-mobile-addons-current-state.png`.
- Runtime: `fpb-storefront-runtime-addons.json`, `fpb-storefront-runtime-addons-mobile-current-state.json`.

Storefront effect:

- Before eligibility, the storefront showed an ineligible add-on message.
- After adding an eligible product, the add-on tier became eligible and displayed the add-on product and discount messaging.
- Mobile proof captured the Add On step/header in the current saved state; eligible/ineligible add-on content was proven on desktop.

### Messages

Admin controls observed for non-email message flow:

- Enable message section
- From
- To
- Message
- Date

Scope exclusion:

- Email fields and Customize Emails are deliberately skipped for clone planning. They were visible in Admin, but no email-template modal or email-notification behavior is documented because the user confirmed that functionality is not being copied.

Evidence:

- Admin screenshots: `fpb-admin-messages-default.png`, `fpb-admin-messages-enabled-options.png`, `fpb-admin-messages-default-current.png`.
- Network: `network-933-savePersonalization.request.network-request`, `network-935-savePersonalization-multiLang.request.network-request`.
- Storefront: `fpb-storefront-desktop-messages-enabled.png`, `fpb-storefront-desktop-message-required-validation.png`, `fpb-storefront-mobile-messages-enabled-validation.png`.
- Runtime: `fpb-storefront-runtime-messages.json`.

Storefront effect:

- The message fields rendered in the personalization flow.
- Required validation fired when attempting to proceed with missing message input. The observed validation text was `Please enter a message`.

### Discount & Pricing

Admin controls observed:

- Discount Type dropdown:
  - Fixed Amount Off
  - Percentage Off
  - Fixed Bundle Price
  - Buy X get Y
- Discount enabled checkbox
- Add rule
- Rule condition type: quantity or amount
- Rule threshold input
- Discount value input
- Discount Messaging
- Show Variables
- Enable multi-language
- Progress Bar
- Simple Bar vs Step-Based Bar
- Bundle Quantity Options
- Box label, box subtext, default star, multi-language modal

Persisted payload:

- Discount-specific request `network-1595-discount-updateFixedBundle.request.network-request` stored:
  - `isDiscountEnabled: true`
  - `discountMode: "PERCENTAGE"`
  - one quantity rule: `value: "2"`, `discountValue: "5"`, `type: "quantity"`
  - `isDiscountProgressBarEnabled: true`
  - `isShowDiscountsEnabled: true`
  - `discountProgressBar.isEnabled: true`
  - `discountProgressBar.type: "STEP"`
  - progress rule text: `title: "2 Pack"`, `subTitle: "Save 5%"`
- Wrapper request `network-1596-stepsConfiguration-update.request.network-request` is separate evidence for the broader bundle config update after the discount edit.

Additional non-percentage proof on FPB `bundleId: "2"`:

- Fixed Amount Off saved through `/api/discount/updateFixedBundle?bundleId=2` with `discountMode: "FIXED"`, `type: "amount"`, a quantity rule, step progress enabled, and success message `Success! Your {{discountValueUnit}}{{discountValue}} discount has been applied to your cart.` Evidence: `network-33-fpb-discount-fixed-amount-save-resolved.network-request`, `fpb-admin-discount-fixed-amount-save-state-resolved.png`.
- Fixed Bundle Price saved with `discountMode: "FIXED_BUNDLE_PRICE"`, `type: "amount"`, rule `value: "2"`, `discountValue: "5"`, step progress `2 Pack / Save ₹5`, and success message `Success! Your bundle is at {{discountValueUnit}}{{discountValue}}.` Evidence: `network-63-fpb-discount-fixed-bundle-price-save-resolved.network-request`, `fpb-admin-discount-fixed-bundle-price-save-state-resolved.png`.
- Buy X get Y saved with `discountMode: "BOGO"` and rule `{ type: "quantity", value: "2", getsQuantity: "1", discountType: "percentage", discountValue: "100", applyDiscountTo: "lowest_priced" }`. Progress text became `Add 3 / 1 Product(s) @ 100% off`, and the storefront initial message became `Add 3 product(s) to get 1 of them at 100% off!`. Evidence: `network-89-fpb-discount-buyxgety-save-resolved.network-request`, `fpb-admin-discount-buyxgety-save-state-resolved.png`, `fpb-storefront-desktop-discount-buyxgety-initial-resolved.png`.

Evidence:

- Admin screenshots: `fpb-admin-discount-pricing-default.png`, `fpb-admin-discount-percentage-quantity-rule.png`, `fpb-admin-discount-fixed-amount-rule.png`, `fpb-admin-discount-fixed-bundle-price-rule.png`, `fpb-admin-discount-buyxgety-rule.png`, `fpb-admin-discount-messaging-variables-modal.png`, `fpb-admin-discount-progress-simple-enabled.png`, `fpb-admin-discount-progress-step-based-enabled.png`, `fpb-admin-discount-bundle-quantity-enabled.png`, `fpb-admin-discount-bqo-disabled-on-amount.png`, `fpb-admin-discount-final-saved.png`.
- Network: `network-1595-discount-updateFixedBundle.request.network-request`, `network-1596-stepsConfiguration-update.request.network-request`, `network-1597-saveLanguage-discount.request.network-request`, `network-33-fpb-discount-fixed-amount-save-resolved.network-request`, `network-63-fpb-discount-fixed-bundle-price-save-resolved.network-request`, `network-89-fpb-discount-buyxgety-save-resolved.network-request`.
- Storefront: `fpb-storefront-desktop-discount-bqo-progress.png`, `fpb-storefront-mobile-discount-bqo-progress.png`, `fpb-storefront-desktop-discount-fixed-amount-resolved.png`, `fpb-storefront-mobile-discount-fixed-amount-resolved.png`, `fpb-storefront-desktop-discount-fixed-bundle-price-resolved.png`, `fpb-storefront-desktop-discount-buyxgety-initial-resolved.png`.
- Runtime: `fpb-storefront-runtime-discount.json`, `fpb-storefront-runtime-discount-fixed-amount-resolved.json`, `fpb-storefront-runtime-discount-fixed-amount-mobile-resolved.json`, `fpb-storefront-runtime-discount-fixed-bundle-price-resolved.json`, `fpb-storefront-runtime-discount-buyxgety-initial-resolved.json`.

Dependency details:

- Bundle Quantity Options were enabled only when the active discount rule was quantity-based.
- Switching to an amount rule disabled the Bundle Quantity Options control and retained the UI note that BQO requires quantity-based discount rules.
- BXY replaced the ordinary rule layout with customer-buys/customer-gets fields and did not render the BQO setup in the same way as percentage quantity rules.
- Step-Based progress enabled per-tier text fields and multi-language editing; Simple Bar hid per-rule tier fields.
- Fixed Amount and Fixed Bundle Price kept quantity-rule structure but changed the unit/copy and resulting storefront price messaging.
- BXY changed the rule schema to customer-buys/customer-gets and initial progress messaging. The selected-product success state was captured after selecting three products: EB rendered `Success! You got 1 product(s) at 100% off`, a discounted line at `₹0.00`, the crossed original price, `3 item(s)`, and a discounted total on desktop and mobile.

Storefront effect:

- Discount messaging rendered `Add 1 product(s) to save 5%!` after one item was selected.
- The side/footer summary showed the `Box of 2` and `5% off` quantity option text and the step progress tier `2 Pack / Save 5%`.
- Fixed Amount rendered amount-copy progress such as `Add 2 product(s) to save ₹566.00!` on the bundleId 2 test bundle. The `₹566` value is a DevTools input artifact from the audit, not an EB default.
- Fixed Bundle Price rendered `Add 2 product(s) to get the bundle at ₹5.00` and the `2 Pack / Save ₹5` tier copy.
- BXY rendered `Add 3 product(s) to get 1 of them at 100% off!` and `1 Product(s) @ 100% off` progress copy before product selection.
- After three selected products, BXY rendered `Success! You got 1 product(s) at 100% off`; the free product line showed `₹0.00` against its original `₹99.99`, the footer counted `3 item(s)`, and the total changed from `₹1507.99` to `₹1408.00`. Evidence: `fpb-storefront-desktop-bxy-selected-success-followup.png`, `fpb-storefront-mobile-bxy-selected-success-followup.png`, `fpb-storefront-runtime-bxy-selected-success-followup.json`, `fpb-storefront-runtime-bxy-selected-success-mobile-followup.json`.

### Bundle Visibility And Widget

Admin controls observed:

- App Embed Status / readiness indicators
- Quick setup cards for theme placement
- Bundle link copy field
- Bundle Widget setup
- Product Page Bundle Upsell Widgets checkbox
- Offer Upsell Block vs Offer Upsell Button
- Widget title, description, button text
- Display on all products in bundle
- Display on specific products
- Display on specific collections
- Add browsed product to bundle
- Embed at custom location
- Multi Language single/multiple language modals
- Upload/update image

Help content:

- The visibility quick guide covers Hero Banner, Navigation Menu, Announcement Banner, and Featured Product Card placement in Shopify theme editor/admin. Evidence: `fpb-visibility-quick-guides-article.png`.

Persisted payload:

- Endpoint: `/api/stepsConfiguration/update?bundleId=3`
- `bundleUpsellConfig.isEnabled: true`
- `widgetType: "OFFER_WIDGET"`
- `collectionsSelectedData` included the `Home page` collection.
- `useLinkProductAsDefaultProduct: true`
- `widgetConfiguration.title: "Bundle & Save"`
- `widgetConfiguration.buttonText: "Buy with Bundle"`
- `languageMode: "MULTIPLE"`

Evidence:

- Admin screenshots: `fpb-admin-bundle-visibility-default.png`, `fpb-admin-bundle-widget-default.png`, `fpb-admin-bundle-widget-enabled-block.png`, `fpb-admin-bundle-widget-enabled-default-button.png`, `fpb-admin-bundle-widget-specific-products.png`, `fpb-admin-bundle-widget-specific-product-selected.png`, `fpb-admin-bundle-widget-specific-collections.png`, `fpb-admin-bundle-widget-collection-selected-add-browsed.png`, `fpb-admin-bundle-widget-final-before-save.png`, `fpb-admin-bundle-widget-multilanguage-single-modal.png`, `fpb-admin-bundle-widget-multilanguage-multiple-modal.png`.
- Network: `network-1708-bundle-widget-update.request.network-request`.
- Storefront: `fpb-storefront-desktop-upsell-block-gift-card.png`, `fpb-storefront-mobile-upsell-block-gift-card.png`, `fpb-storefront-desktop-upsell-redirect-with-browsed-product.png`, `fpb-storefront-mobile-upsell-redirect-with-browsed-product.png`.
- Runtime: `fpb-storefront-runtime-upsell-redirect.json`, `fpb-storefront-upsell-block-dom.json`.

Storefront effect:

- A bundle upsell block rendered on the Gift Card product page after selecting the Home page collection.
- With add-browsed-product enabled, clicking the upsell redirected into the bundle with the browsed product context.

### Bundle Settings

Admin controls observed:

- Pre Selected Product
- Product picker for default products
- Enable Quantity Validation
- Product Slots
- Variant Selector
- Show Text on + Button
- Pre-order & Subscription Integration
- Bundle Cart Title
- Bundle Cart Subtitle
- Cart line item discount display
- Discount label and format customization
- Bundle Banner upload
- Bundle Level CSS
- Bundle Status / Draft confirmation

Persisted payload:

- Endpoint: `/api/stepsConfiguration/update?bundleId=3`
- `defaultProductsData.isDefaultProductsEnabled: true`
- Default product: `18k Bloom Earrings`
- `validateQuantityPerProduct.isEnabled: true`
- `isProductSlotsEnabled: true`
- `renderChooseVariantDropdown: false`
- `renderContentInProductATC: true`
- `individualSellingPlanSelection.isEnabled: true`
- `individualSellingPlanSelection.showFor: "OOS_PRODUCTS"`
- `bundleTextConfig.bundleSummary.title` and `subTitle` persisted.
- `discountDisplayOverride.useAppDefaults: false`
- `discountDisplayOverride.format: "percentage_only"`

Evidence:

- Admin screenshots: `fpb-admin-bundle-settings-default.png`, `fpb-admin-bundle-settings-preselected-products-modal.png`, `fpb-admin-bundle-settings-preselected-qty-slots-enabled.png`, `fpb-admin-bundle-settings-cart-multilanguage-modal.png`, `fpb-admin-bundle-settings-cart-discount-customize.png`, `fpb-admin-bundle-settings-discount-label-multilanguage-modal.png`, `fpb-admin-bundle-settings-preorder-enabled.png`, `fpb-admin-bundle-settings-preorder-out-of-stock-radio.png`, `fpb-admin-bundle-settings-final-before-save.png`, `fpb-admin-bundle-settings-draft-confirm-modal.png`.
- Network: `network-1769-bundle-settings-update.network-request`, `network-1836-bundle-settings-disable-individual-selling-plan.network-request`.
- Storefront: `fpb-storefront-clean-desktop-bundle-settings.png`, `fpb-storefront-clean-mobile-bundle-settings.png`.
- Runtime/state: `fpb-storefront-runtime-bundle-settings.json`, `fpb-storefront-state-bundle-settings.json`.

Storefront effect:

- Default/preselected product appeared in the bundle summary.
- Product slots and quantity-validation text influenced the summary state.
- The plus button text was rendered as `Add To Box`.
- Hiding the variant selector removed the inline variant dropdown for the selected test setup.

Upload evidence:

- Step Config upload persistence was proven on PPB, where `productsData1.stepImage` saved a returned CloudFront URL. The control shape is shared with FPB Step Config.
- FPB Bundle Banner upload was not completed in the follow-up because the live Admin control opened the operating-system file picker. Earlier transport evidence showed `/api/utility/uploadImages` can accept an image, but no saved banner field was captured. Treat FPB banner persistence as unproven.
- Banner placement is still proven from the storefront DOM. Both desktop and mobile rendered an empty `.gbbAddProductPageBanners` node as child `1` of `.gbbAddProductPageSubtextWrapper`, immediately after `.gbbAddProductPageSubtext` (`Choose your jewelry`) and before the category/product body. With no image configured, the node collapsed to `0 x 0`. Therefore a configured banner belongs below the step subtext/header and above the product/category content on both desktop and mobile; it is not in the side/footer summary.
- Evidence: `network-109-fpb-bundle-banner-desktop-upload-image.network-request`, `network-109-fpb-bundle-banner-desktop-upload-image.network-response`, `network-3647-ppb-step-config-upload-save.network-request`, `fpb-storefront-bundle-banner-placement-desktop-followup.json`, `fpb-storefront-bundle-banner-placement-mobile-followup.json`, `fpb-storefront-bundle-banner-parent-sequence-mobile-followup.json`.

### Subscriptions

Admin controls observed:

- Bundle Subscriptions card
- How to setup?
- Get Subscription Plans

Help content:

- EB requires a Shopify-compatible subscription app plan that includes all products in the bundle.
- The article says EB works with subscription apps except Recharge.
- After valid common plans exist, EB exposes subscription widget settings such as heading, description, widget description, one-time purchase defaults, and recurring discounts.
- Evidence: `fpb-admin-subscriptions-how-to-setup-article.png`, `fpb-admin-subscriptions-learn-more-article.png`.

Persisted/runtime result:

- With individual selling-plan/pre-order active, subscription retrieval was blocked. Evidence: `fpb-admin-subscriptions-blocked-by-individual-selling-plan.png`.
- After disabling individual selling-plan selection, `Get Subscription Plans` called the validation endpoint and returned `NO_SELLING_PLAN_GROUPS_FOUND`.
- Evidence: `network-1854-validate-selling-plan-groups.network-response`, `fpb-admin-subscriptions-no-common-plan-alert.png`.

### FPB Templates

Admin overlay cards:

| Card | Preview asset | Saved fields | Storefront evidence |
|---|---|---|---|
| Standard | `landing-page-template-standard-design.avif` | `bundleDesignTemplate: "FBP_SIDE_FOOTER"`, `bundleDesignPresetId: "DEFAULT"` | `fpb-storefront-desktop-template-standard.png`, `fpb-storefront-mobile-template-standard.png` |
| Classic | `landing-page-template-classic-design.avif` | `bundleDesignTemplate: "FBP_SIDE_FOOTER"`, `bundleDesignPresetId: "CLASSIC"` | `fpb-storefront-desktop-template-classic.png`, `fpb-storefront-mobile-template-classic.png` |
| Compact | `landing-page-template-compact-design.avif` | `bundleDesignTemplate: "FBP_SIDE_FOOTER"`, `bundleDesignPresetId: "COMPACT"` | `fpb-storefront-desktop-template-compact.png`, `fpb-storefront-mobile-template-compact.png` |
| Horizontal | `landing-page-template-horizontal-design.avif` | `bundleDesignTemplate: "FBP_SIDE_FOOTER"`, `bundleDesignPresetId: "HORIZONTAL"` | `fpb-storefront-desktop-template-horizontal.png`, `fpb-storefront-mobile-template-horizontal.png` |

Evidence:

- Admin screenshots: `fpb-admin-template-overlay-standard-selected.png`, `fpb-admin-template-overlay-classic-selected.png`, `fpb-admin-template-overlay-compact-selected.png`, `fpb-admin-template-overlay-horizontal-selected.png`, `fpb-admin-template-overlay-standard-selected-final.png`.
- Save payloads: `network-2268-template-classic-update.network-request`, `network-2339-template-compact-update.network-request`, `network-2411-template-horizontal-update.network-request`, `network-2476-template-standard-update.network-request`.
- Counter reset payloads: `network-2273-template-classic-modify-bundle-fields.network-request`, `network-2343-template-compact-modify-bundle-fields.network-request`, `network-2415-template-horizontal-modify-bundle-fields.network-request`, `network-2480-template-standard-modify-bundle-fields.network-request`.
- Runtime captures: `fpb-storefront-runtime-template-standard.json`, `fpb-storefront-runtime-template-classic.json`, `fpb-storefront-runtime-template-compact.json`, `fpb-storefront-runtime-template-horizontal.json`.

Important clone note:

- Do not create a separate persisted `STANDARD` preset. Standard persisted as `DEFAULT` in the live save request.
- `Customize Colors & Language` routed to global settings/brand configuration, not a per-template editor. Evidence: `fpb-admin-template-customize-colors-language-settings-landing.png`.

## Product Page Bundle Audit

### Create Flow

Admin controls observed:

- Dashboard create flow
- Bundle type selection
- Product Page type detail modal
- Name modal
- Initial Step Setup page

Persisted payload:

- Endpoint: `/api/mixAndMatch/create`
- Initial design fields:
  - `bundleDesignTemplate: "PDP_INPAGE"`
  - `bundleDesignTemplateData.templateId: "CASCADE"`
  - `useSingleStepCategoriesAsBundleSteps` present in the create/update shape
- Parent product:
  - Product ID `8601654886596`
  - Variant GID `gid://shopify/ProductVariant/46183344210116`
  - Handle `wpb-complete-audit-product-page-2026-05-25`

Evidence:

- Screenshots: `ppb-admin-dashboard-before-create.png`, `ppb-create-bundle-type-selection.png`, `ppb-create-product-type-detail.png`, `ppb-create-name-modal-filled.png`, `ppb-admin-step-setup-initial-after-create.png`.
- Network: `network-2508-ppb-create.network-request`, `network-2508-ppb-create.network-response`.

### Step Setup

Admin controls observed:

- Step Flow
- How to setup
- Add Step
- Step Setup checkbox
- Step Name
- Category card clone/delete controls
- Category Name
- Multi Language
- Category Title
- Products/Collections tabs
- Add Products
- Display variants as individual products
- Rules Configuration
- Step rules
- Category rules
- Step Config upload
- Step Title

Help content:

- Step setup: `ppb-step-how-to-setup-article.png`
- Categories: `ppb-categories-how-to-setup-article.png`
- Rules: `ppb-rules-learn-more-article.png`

Persisted payload:

- Endpoint: `/api/mixAndMatch/update?shopName=yash-wolfpack.myshopify.com&offerId=MIX-519528`
- `bundleDesignTemplate: "PDP_INPAGE"`
- `bundleDesignTemplateData.templateId: "CASCADE"`
- `useSingleStepCategoriesAsBundleSteps: false`
- `productsData1.productPageStepText: "Step 1 - PPB Audit"`
- `productsData1.productPageSubtext: "Build audit bundle"`
- Step rules persisted in `productsData1.conditions.rules` but `conditions.isEnabled: false` after switching to category rules.
- Category 1:
  - `title: "Pick audit items"`
  - product count `2`
  - category rule `quantity >= "01"`
  - `displayVariantsAsIndividualProducts: true`
  - `displayVariantsAsSwatches: false`
- Category 2:
  - `title: "More audit items"`
  - product count `1`
  - no conditions
- `discountConfiguration: null`
- `boxSelection.isEnabled: false`
- Step Config image upload later persisted `productsData1.stepImage: "https://d3ks0ngva6go34.cloudfront.net/giftBox/yash-wolfpack.myshopify.com/1779733427094.png"` through the same update endpoint after `/api/utility/uploadImages` returned 200.

Evidence:

- Admin screenshots: `ppb-admin-step-setup-products-selected.png`, `ppb-admin-step-setup-collections-tab.png`, `ppb-step-collection-picker-home-selected.png`, `ppb-admin-step-setup-second-category-category-rules-visible.png`, `ppb-admin-step-rules-selected.png`, `ppb-admin-step-rules-quantity-rule.png`, `ppb-admin-category-rules-expanded.png`, `ppb-admin-category-rules-quantity-rule.png`, `ppb-admin-step-setup-after-save.png`, `ppb-admin-step-config-upload-replace-state-resolved.png`.
- Network: `network-2729-ppb-step-setup-update.network-request`, `network-2729-ppb-step-setup-update.network-response`, `network-3636-ppb-step-config-upload-image.network-request`, `network-3636-ppb-step-config-upload-image.network-response`, `network-3647-ppb-step-config-upload-save.network-request`, `network-3647-ppb-step-config-upload-save.network-response`.
- Storefront: `ppb-storefront-desktop-step-setup-cascade.png`, `ppb-storefront-mobile-step-setup-cascade.png`.
- Runtime/DOM: `ppb-storefront-runtime-step-setup-cascade.json`, `ppb-storefront-dom-step-setup-cascade.json`.

Storefront effect:

- The product page mounted EB as an in-page Product List/CASCADE bundle.
- Body attributes included `gbbmix-template-id: "CASCADE"` and `gbbmix-template-type: "PDP_INPAGE"`.
- The wrapper carried `offer-id: "MIX-519528"`, `parent-product-id: "8601654886596"`, `current-step-id: "productsData1"`, and `use-single-step-categories-as-steps: "false"`.
- Direct products, individual variants, and collection products rendered in the same bundle interface.

### Discount & Pricing

Admin controls observed:

- Discount Type dropdown:
  - Fixed Amount Off
  - Percentage Off
  - Fixed Bundle Price
  - Buy X get Y
- Discount enable checkbox
- Quantity rule threshold
- Percentage discount value
- Discount Messaging
- Enable multi-language
- Show Variables
- Amount-rule state
- Bundle Quantity Options state

Persisted payload:

- Endpoint: `/api/mixAndMatch/update?offerId=MIX-519528`
- Percentage quantity + BQO saved `discountConfiguration.discountMode: "PERCENTAGE"`, rule `value: "2"`, `discountValue: "5"`, `type: "quantity"`, and `boxSelection.isEnabled: true` with `Box of 2 / 5% off`. Evidence: `network-3475-ppb-discount-bqo-enabled-save.network-request`.
- Fixed Amount saved `discountMode: "FIXED"`, rule `value: "2"`, `discountValue: "5"`, `type: "quantity"`, and `boxSelection.isEnabled: true` with `boxSubtext: "₹5 off"`. Evidence: `network-3495-ppb-discount-fixed-amount-save.network-request`.
- Fixed Bundle Price saved `discountMode: "FIXED_BUNDLE_PRICE"`, rule `value: "2"`, `discountValue: "5"`, `type: "quantity"`, and success copy `Success! Your bundle is at {{discountValueUnit}}{{discountValue}}.` Evidence: `network-3514-ppb-discount-fixed-bundle-price-save.network-request`.
- Buy X get Y saved `discountMode: "BOGO"` with rule `{ type: "quantity", value: "2", getsQuantity: "1", discountType: "percentage", discountValue: "100", applyDiscountTo: "lowest_priced" }`. BXY saved `boxSelection.isEnabled: false` and empty `boxSelection.rules`, proving box options are not active for this mode. Evidence: `network-3528-ppb-discount-buyxgety-save.network-request`.

Evidence:

- Admin screenshots: `ppb-admin-discount-default.png`, `ppb-admin-discount-percentage-quantity-rule.png`, `ppb-admin-discount-enabled-quantity-progress-messaging.png`, `ppb-admin-discount-quantity-rule-bqo-still-disabled-before-save.png`, `ppb-admin-discount-amount-rule-bqo-disabled.png`, `ppb-admin-discount-bqo-enabled-resolved.png`, `ppb-admin-discount-fixed-amount-save-state-resolved.png`, `ppb-admin-discount-fixed-bundle-price-save-state-resolved.png`, `ppb-admin-discount-buyxgety-save-state-resolved.png`.
- Network: `network-2758-ppb-discount-quantity-rule-save.network-request`, `network-2777-ppb-discount-quantity-rule-resave.network-request`, `network-3475-ppb-discount-bqo-enabled-save.network-request`, `network-3495-ppb-discount-fixed-amount-save.network-request`, `network-3514-ppb-discount-fixed-bundle-price-save.network-request`, `network-3528-ppb-discount-buyxgety-save.network-request`.
- Storefront: `ppb-storefront-desktop-discount-message-initial.png`, `ppb-storefront-desktop-discount-success-after-two-products.png`, `ppb-storefront-mobile-discount-success-after-two-products.png`, `ppb-storefront-desktop-bqo-enabled-resolved.png`, `ppb-storefront-mobile-bqo-enabled-resolved.png`, `ppb-storefront-desktop-discount-fixed-amount-resolved.png`, `ppb-storefront-desktop-discount-fixed-bundle-price-resolved.png`, `ppb-storefront-desktop-discount-buyxgety-success-resolved.png`, `ppb-storefront-mobile-discount-buyxgety-success-resolved.png`.
- Runtime: `ppb-storefront-runtime-discount.json`, `ppb-storefront-runtime-discount-after-two-products.json`, `ppb-storefront-runtime-bqo-enabled-resolved.json`, `ppb-storefront-runtime-bqo-enabled-mobile-resolved.json`, `ppb-storefront-runtime-discount-fixed-amount-resolved.json`, `ppb-storefront-runtime-discount-fixed-bundle-price-resolved.json`, `ppb-storefront-runtime-discount-buyxgety-success-resolved.json`, `ppb-storefront-runtime-discount-buyxgety-mobile-resolved.json`.

Storefront effect:

- Initial message: `Add 2 product(s) to save 5%!`
- After one selected product, the remaining count decreased.
- After two selected products, the success message rendered and CTA showed a discounted price with `5% off`.
- With BQO enabled, storefront rendered the selectable `Box of 2 / 5% off` option and success copy `Success! Your 5% discount has been applied to your cart.` on desktop and mobile.
- Fixed Amount rendered `₹5 off`, changed the CTA from `₹978` to `₹973`, and used success copy `Success! Your ₹5 discount has been applied to your cart.`
- Fixed Bundle Price rendered a `₹5` bundle total, original `₹978`, `99% off`, and success copy `Success! Your bundle is at ₹5.`
- BXY rendered one selected line at `100% off` and `₹0`, retained product total `₹978` from original `₹1377`, and showed success copy `Success! You got 1 product(s) at 100% off` on desktop and mobile.

### Bundle Visibility, Widget, And Embed

Admin controls observed:

- App Embed Status card
- Hero Banner quick setup
- Navigation Menu quick setup
- Announcement Banner quick setup
- Featured Product Card quick setup
- Bundle link textbox and Copy Link
- Bundle Widget setup
- Product Page Bundle Upsell Widgets checkbox
- Offer Upsell Block
- Offer Upsell Button
- Widget Settings
- Multi language
- Upload/Update Image
- Widget Title
- Widget Description
- Widget Button Text
- Display Widget on all products in bundle
- Specific products
- Specific collections
- Add browsed product to bundle
- Embed Upsell Block at custom location
- Bundle Embed setup
- Embed Bundle Builder on Product Pages checkbox
- Embed title and subtitle
- Display bundle on all products/specific products/specific collections
- Add browsed product to bundle
- Place app block / Place Block

Help content:

- The visibility article gives Shopify setup instructions for Hero Banner, Navigation Menu, Announcement Banner, and Featured Product Card. Evidence: `ppb-visibility-quick-guides-article.png`.

Persisted payload:

- Widget save `network-3573-ppb-widget-enabled-save.network-request` stored `bundleUpsellConfig.widgetConfiguration.isEnabled: true`, `type: "OFFER_WIDGET"`, uploaded `imageUrl: "https://d3ks0ngva6go34.cloudfront.net/giftBox/yash-wolfpack.myshopify.com/1779732971808.png"`, `title: "Bundle & Save"`, `buttonText: "Buy With Bundle"`, `displayConfiguration.showOnAllBundleProducts: true`, and `useLinkProductAsDefaultProduct: false`.
- Embed save `network-3598-ppb-bundle-embed-enabled-save.network-request` stored `bundleUpsellConfig.upsellConfiguration.isEnabled: true`, title `Build Your Bundle & Save More`, `displayConfiguration.showOnAllBundleProducts: true`, and `useLinkProductAsDefaultProduct: false`.

Evidence:

- Admin screenshots: `ppb-admin-bundle-visibility-default.png`, `ppb-admin-bundle-widget-default.png`, `ppb-admin-bundle-embed-default.png`, `ppb-admin-bundle-widget-enabled-via-keyboard-resolved.png`, `ppb-admin-bundle-widget-upload-after-update-image-resolved.png`, `ppb-admin-bundle-widget-enabled-saved-resolved.png`, `ppb-admin-bundle-embed-enabled-via-keyboard-resolved.png`, `ppb-admin-bundle-embed-enabled-saved-resolved.png`.
- Network: `network-3559-ppb-widget-upload-image.network-request`, `network-3559-ppb-widget-upload-image.network-response`, `network-3573-ppb-widget-enabled-save.network-request`, `network-3573-ppb-widget-enabled-save.network-response`, `network-3598-ppb-bundle-embed-enabled-save.network-request`, `network-3598-ppb-bundle-embed-enabled-save.network-response`.
- Storefront: `ppb-storefront-desktop-widget-on-bundle-product-resolved.png`, `ppb-storefront-mobile-widget-on-bundle-product-resolved.png`, `ppb-storefront-desktop-embed-and-widget-enabled-resolved.png`, `ppb-storefront-mobile-embed-and-widget-enabled-resolved.png`.
- Runtime: `ppb-storefront-runtime-widget-on-bundle-product-resolved.json`, `ppb-storefront-runtime-widget-on-bundle-product-mobile-resolved.json`, `ppb-storefront-runtime-embed-and-widget-enabled-resolved.json`, `ppb-storefront-runtime-embed-and-widget-enabled-mobile-resolved.json`.

Storefront effect:

- The Product Page Bundle Upsell Widget rendered on a bundle product page with title `Bundle & Save`, the uploaded CloudFront image, and CTA `Buy With Bundle` on desktop and mobile.
- After Bundle Embed was enabled, the product page rendered the embedded bundle builder with title `Build Your Bundle & Save More`, current category text `Pick audit items`, current products, and the active BXY discount message. The widget also remained present.
- The widget proof page also showed a second `DefaultUpsell` widget from another active EB configuration on the same product. Treat that duplicate as coexistence evidence, not as part of this PPB bundle's saved fields.

### Bundle Settings

Admin controls observed:

- Bundle Settings default page
- Pre Selected Product
- Quantity Validation
- Maximum allowed quantity
- Individual selling plan / pre-order
- Cart line item display controls
- Bundle Level CSS
- Bundle Status
- Cart line item discount display
- Edit Defaults route to global Product Page Layout
- Global settings:
  - Hide Out Of Stock Products
  - Track inventory on Add To Cart beta
  - Add bundle to cart after last step completed
  - Display empty state boxes based on bundle condition
  - Hide Step Titles in completed state
  - Add to cart when product card is clicked
  - Redirect Collection Page Quick Add to Bundle
  - Cart Messaging
  - Bundle Items
  - Original Bundle Price
  - Discount Display
  - Discount format dropdown
  - Redirect Settings: side cart update, checkout, cart
  - Execute Script textarea

Persisted payload:

- Endpoint: `/api/mixAndMatch/update?offerId=MIX-519528`
- Initial quantity-validation save had `defaultProductsData: {}`.
- Follow-up Pre Selected Product save stored `defaultProductsData.isDefaultProductsEnabled: true`, `defaultProductsTitle: "Preselected audit products"`, and one default product:
  - `productId: "8322625700036"`
  - `graphqlId: "gid://shopify/Product/8322625700036"`
  - `handle: "18k-bloom-earrings"`
  - `variantId: "45038876459204"`
  - `variantGraphqlId: "gid://shopify/ProductVariant/45038876459204"`
  - `requiredQuantity: 1`
- `validateQuantityPerProduct.isEnabled: true`
- `validateQuantityPerProduct.allowedQuantity: 1`
- `individualSellingPlanSelection.isEnabled: false`
- `individualSellingPlanSelection.showFor: "ALL_PRODUCTS"`
- `bundleStatus: "ACTIVE"`
- Evidence: `network-3620-ppb-bundle-settings-quantity-validation-save.network-request`, `network-3716-ppb-bundle-settings-preselected-save-followup.network-request`.

Global Edit Defaults payload:

- `Edit Defaults` opens `/brandConfig?layout=productPage&section=unifiedAdditionalConfig`, which is global Product Page Layout configuration, not a per-bundle configure subpage.
- The `Bundle Items` switch maps to `customSettings.bundleCartLineMessaging.showBundleContains`.
- Saving the off-state posted `showBundleContains: false` while preserving `showOriginalPrice: true` and `discountDisplay.isEnabled: true`.
- Restoring the on-state posted `showBundleContains: true` with the same surrounding cart-message settings.
- The `Original Bundle Price` switch maps to `customSettings.bundleCartLineMessaging.showOriginalPrice`.
- The `Discount Display` switch maps to `customSettings.bundleCartLineMessaging.discountDisplay.isEnabled`. When `Discount Display` was switched off, the `Discount format` dropdown disappeared from Admin; when switched back on, it reappeared with the prior `amount_percentage` value.
- Saving Original Bundle Price off plus Discount Display off posted `showOriginalPrice: false` and `discountDisplay.isEnabled: false`. Restoring them posted `showOriginalPrice: true` and `discountDisplay.isEnabled: true`.
- Evidence: `network-3889-ppb-global-edit-defaults-updategeneralsettings-bundle-items-off-followup.network-request`, `network-3911-ppb-global-edit-defaults-updategeneralsettings-bundle-items-on-restore-followup.network-request`, `network-3933-ppb-global-edit-defaults-original-price-discount-display-off-followup.network-request`, `network-3957-ppb-global-edit-defaults-original-price-discount-display-on-restore-followup.network-request`.

Evidence:

- Admin screenshots: `ppb-admin-bundle-settings-default.png`, `ppb-admin-bundle-settings-quantity-validation-enabled-resolved.png`, `ppb-admin-bundle-settings-preselected-default-followup.png`, `ppb-admin-bundle-settings-preselected-enabled-followup.png`, `ppb-global-product-page-layout-additional-config-from-edit-defaults.png`, `ppb-global-edit-defaults-product-layout-default-followup.png`, `ppb-global-edit-defaults-bundle-items-off-unsaved-followup.png`, `ppb-global-edit-defaults-bundle-items-on-unsaved-restore-followup.png`, `ppb-global-edit-defaults-original-price-discount-display-off-unsaved-followup.png`, `ppb-global-edit-defaults-original-price-discount-display-on-unsaved-restore-followup.png`.
- Network: `network-3620-ppb-bundle-settings-quantity-validation-save.network-request`, `network-3620-ppb-bundle-settings-quantity-validation-save.network-response`, `network-3716-ppb-bundle-settings-preselected-save-followup.network-request`, `network-3716-ppb-bundle-settings-preselected-save-followup.network-response`, `network-3889-ppb-global-edit-defaults-updategeneralsettings-bundle-items-off-followup.network-request`, `network-3911-ppb-global-edit-defaults-updategeneralsettings-bundle-items-on-restore-followup.network-request`, `network-3933-ppb-global-edit-defaults-original-price-discount-display-off-followup.network-request`, `network-3957-ppb-global-edit-defaults-original-price-discount-display-on-restore-followup.network-request`.
- Storefront: `ppb-storefront-desktop-quantity-validation-after-product-selected-resolved.png`, `ppb-storefront-mobile-quantity-validation-after-product-selected-resolved.png`, `ppb-storefront-desktop-preselected-product-followup.png`, `ppb-storefront-mobile-preselected-product-followup.png`, `ppb-storefront-cart-page-bundle-items-off-followup.png`, `ppb-storefront-cart-page-bundle-items-on-followup.png`, `ppb-storefront-cart-page-original-price-discount-display-off-followup.png`.
- Runtime/cart JSON: `ppb-storefront-runtime-quantity-validation-selected-resolved.json`, `ppb-storefront-runtime-quantity-validation-selected-mobile-resolved.json`, `ppb-storefront-runtime-preselected-product-followup.json`, `ppb-storefront-runtime-preselected-product-mobile-followup.json`, `ppb-storefront-cart-json-bundle-items-off-followup.json`, `ppb-storefront-cart-json-bundle-items-on-followup.json`, `ppb-storefront-cart-json-original-price-discount-display-off-followup.json`.

Storefront relationship:

- Quantity Validation enables the Maximum allowed quantity input in Admin. With allowed quantity `1`, selecting `18k Bloom Earrings` changed the product card from `Add +` to `Added x1` and the selected-products list showed `18k Bloom Earrings x 1` on desktop and mobile.
- Pre Selected Product enables `defaultProductsData`; after saving, the product page rendered the configured title `Preselected audit products` and the preselected line `18k Bloom Earrings x 1` with price `₹579` on desktop and mobile. The preselected item contributed to the bundle price and BXY progress state.
- Global cart-message controls under Edit Defaults affect cart-line public properties, not the in-product builder summary:
  - With `showBundleContains: false`, adding the bundle produced a cart line with `_EasyBundleId`, `_Items: ""`, `Box`, `Retail Price`, and `You Save`, but no public `Items` property and no `Items:` row on the cart page. With `showBundleContains: true` restored, the cart line included `Items: "1 x 18k Bloom Earrings, 1 x 18k Bloom Earrings, 1 x 18k Pedal Ring - 6 (6)"`, and the cart page rendered the `Items:` row.
  - With `showOriginalPrice: false` and `discountDisplay.isEnabled: false`, the cart line retained `Box` and `Items` but omitted public `Retail Price` and `You Save`; the cart page showed `Box:` and `Items:` only. Restoring both switches brought the saved payload back to `showOriginalPrice: true` and `discountDisplay.isEnabled: true`.
- Individual selling-plan/pre-order selection was blocked while the current bundle had BXY active. The Admin alert said individual selling plans cannot be enabled while a bundle-level subscription or BXGY discount is active.
- Other Edit Defaults controls on the page were inventoried but not individually toggled for storefront proof in this follow-up.

### Subscriptions

Admin controls observed:

- Bundle Subscriptions
- How to setup?
- Get Subscription Plans

Help content:

- EB requires every product in the bundle to share the same subscription plan.
- The subscription article says the flow works with all subscription apps except Recharge.
- If common plans exist, EB exposes subscription widget settings such as heading, description, one-time purchase option, default selection, and recurring discounts.
- Evidence: `ppb-admin-subscriptions-how-to-setup-article.png`.

Validation result:

- `GET /api/mixAndMatch/syncSellingPlanGroups?shopName=yash-wolfpack.myshopify.com&offerId=MIX-519528`
- Response: `data.isValid: false`, `message: "NO_SELLING_PLAN_GROUPS_FOUND"`.
- Alert text explained that all bundle products must be part of the same subscription plan.

Evidence:

- Admin screenshots: `ppb-admin-subscriptions-default.png`, `ppb-admin-subscriptions-no-common-plan-alert.png`.
- Network: `network-3185-ppb-validate-selling-plan-groups.network-request`, `network-3185-ppb-validate-selling-plan-groups.network-response`.

### PPB Templates

Admin overlay cards:

| Card | Preview asset | Saved fields | Storefront runtime attrs | Evidence |
|---|---|---|---|---|
| Product List | `ListViewTemplate.avif` | `bundleDesignTemplate: "PDP_INPAGE"`, `bundleDesignTemplateData.templateId: "CASCADE"` | `gbbmix-template-id="CASCADE"`, `gbbmix-template-type="PDP_INPAGE"` | `network-3439-ppb-template-product-list-final-update.network-request`, `ppb-storefront-runtime-template-product-list-cascade-final.json` |
| Product Grid | `GridViewTemplate.avif` | `bundleDesignTemplate: "PDP_INPAGE"`, `bundleDesignTemplateData.templateId: "COGNIVE"` | `gbbmix-template-id="COGNIVE"`, `gbbmix-template-type="PDP_INPAGE"` | `network-3244-ppb-template-product-grid-update.network-request`, `ppb-storefront-runtime-template-product-grid-cognive.json` |
| Horizontal Slots | `SlotsHorizontalTemplate.avif` | `bundleDesignTemplate: "PDP_MODAL"`, `bundleDesignTemplateData.templateId: "MODAL"` | `gbbmix-template-id="MODAL"`, `gbbmix-template-type="PDP_MODAL"` | `network-3308-ppb-template-horizontal-slots-update.network-request`, `ppb-storefront-runtime-template-horizontal-slots-modal.json` |
| Vertical Slots | `SlotsVerticalTemplate.avif` | `bundleDesignTemplate: "PDP_MODAL"`, `bundleDesignTemplateData.templateId: "SIMPLIFIED"` | `gbbmix-template-id="SIMPLIFIED"`, `gbbmix-template-type="PDP_MODAL"` | `network-3373-ppb-template-vertical-slots-update.network-request`, `ppb-storefront-runtime-template-vertical-slots-simplified.json` |

Evidence:

- Admin screenshots: `ppb-admin-template-overlay-product-list-selected.png`, `ppb-admin-template-overlay-product-grid-selected.png`, `ppb-admin-template-overlay-horizontal-slots-selected.png`, `ppb-admin-template-overlay-vertical-slots-selected.png`, `ppb-admin-template-overlay-product-list-selected-final.png`.
- Desktop screenshots: `ppb-storefront-desktop-step-setup-cascade.png`, `ppb-storefront-desktop-template-product-grid-cognive.png`, `ppb-storefront-desktop-template-horizontal-slots-modal.png`, `ppb-storefront-desktop-template-vertical-slots-simplified.png`, `ppb-storefront-desktop-template-product-list-cascade-final.png`.
- Mobile screenshots: `ppb-storefront-mobile-step-setup-cascade.png`, `ppb-storefront-mobile-template-product-grid-cognive.png`, `ppb-storefront-mobile-template-horizontal-slots-modal.png`, `ppb-storefront-mobile-template-vertical-slots-simplified.png`.
- Modify-counter requests: `network-3249-ppb-template-product-grid-modify-bundle-fields.network-request`, `network-3313-ppb-template-horizontal-slots-modify-bundle-fields.network-request`, `network-3378-ppb-template-vertical-slots-modify-bundle-fields.network-request`, `network-3441-ppb-template-product-list-final-modify-bundle-fields.network-request`.

Important clone notes:

- PPB templates do not use `bundleDesignPresetId`.
- Product List and Product Grid are in-page variants (`PDP_INPAGE`).
- Horizontal Slots and Vertical Slots are modal/product-page-slot variants (`PDP_MODAL`).
- Vertical Slots runtime includes `gbbMixProductPageCategoriesWrapperVStacked`, confirming the stacked vertical category layout marker. Evidence: `ppb-storefront-runtime-template-vertical-slots-simplified.json`.
- Horizontal Slots runtime body attrs were conclusive, but the wrapper selector captured the native price element in the runtime helper. Use the screenshots and body attrs for the template mapping, not that wrapper selector.
- `Customize Colors & Language` is visible in the template overlay. The overlay itself is hosted under `/brandConfig`, but the PPB button click did not become interactive in this pass; treat PPB customization routing as evidence-limited rather than fully verified.

## Storefront Runtime Split

| Surface | Runtime namespace | Primary route | Template markers |
|---|---|---|---|
| FPB / Landing Page | `window.gbb` | App proxy `/apps/gbb/easybundle/{bundleId}` | Root/html classes include `gbbBundle-HTML`, `bundle-{id}` and FPB template rendering classes. |
| PPB / Product Page | `window.gbbMix` and `window.easybundles_ext_data` | Product detail page | Body attrs `gbbmix-template-id`, `gbbmix-template-type`, `gbb-mix-consolidated-design`; wrapper attrs include `offer-id`, `parent-product-id`, current step metadata. |

Evidence:

- FPB runtime: `fpb-storefront-runtime-template-standard.json`, `fpb-storefront-runtime-bundle-settings.json`.
- PPB runtime: `ppb-storefront-runtime-step-setup-cascade.json`, `ppb-storefront-runtime-template-product-list-cascade-final.json`.

## Open Gaps And Non-Assumptions

- Emails and Customize Emails are excluded from this clone-planning scope by user direction. Do not treat them as unresolved clone requirements.
- PPB upload controls are resolved for widget image and Step Config image persistence. FPB Bundle Banner upload persistence remains unproven because the live control opened the operating-system file picker, but the desktop/mobile storefront placement container is proven.
- FPB Fixed Amount Off, Fixed Bundle Price, and Buy X get Y now have save payloads and storefront initial/progress proof. FPB BXY selected-product success state is resolved with desktop and mobile proof. PPB BXY has desktop and mobile selected-product success proof.
- FPB Add-ons have desktop eligible/ineligible proof and mobile Add On step/header proof; mobile eligible/ineligible add-on content was not captured.
- PPB Bundle Quantity Options are resolved for percentage, fixed-amount, and fixed-bundle-price quantity rules. BXY intentionally disables/clears box selection in the saved payload.
- PPB Widget and Bundle Embed non-default persistence and storefront rendering are resolved for enabled/all-products states. Specific-products/specific-collections display targeting remains inventoried but not separately re-saved in the resolved pass.
- PPB per-bundle Quantity Validation and Pre Selected Product persistence/storefront states are resolved. Global Product Page Layout controls from `Edit Defaults` were inventoried, and the cart-message controls `Bundle Items`, `Original Bundle Price`, and `Discount Display` were proven end-to-end against storefront cart-line rendering. The remaining global controls were not individually toggled for storefront proof.
- PPB `Customize Colors & Language` button routing is evidence-limited because the click was not verified, despite the overlay being hosted under `/brandConfig`.
- PPB template Product Grid appears as an in-page `COGNIVE` template, but this pass did not decompile the external EB JS to prove whether it has a separate renderer or branches inside the CASCADE renderer. The live runtime attrs and screenshots are the evidence for clone mapping.
- Some Admin screenshots show duplicated audit text due repeated field interaction. Persisted duplicate text should not be treated as EB default copy.

## Clone Planning Summary

1. Model FPB and PPB separately. FPB persists numeric `bundleId` and uses app-proxy landing pages. PPB persists `offerId: MIX-*` and renders on the parent product page.
2. Keep Step -> Category -> Products/Collections as the core data model. Add category rules only after multiple categories exist and maintain mutual exclusivity with step rules.
3. Implement Discount & Pricing as a dependency graph, not independent controls. Discount enabled gates messaging/progress; rule type controls quantity/amount copy; BQO depends on quantity rules; BXY has a different rule layout.
4. Implement subscriptions as a validation flow against common selling plans across all products, with explicit no-common-plan error messaging.
5. Implement PPB widget/embed as two separate upsell config branches: widget configuration for product-page upsell widgets and embed configuration for in-page bundle builder placement. Both share display targeting controls and add-browsed-product options.
6. Implement image upload as a two-step flow: `/api/utility/uploadImages` returns an image URL, then the relevant bundle update persists that URL in the widget, step, or banner field.
7. Implement template mapping exactly:
   - FPB: `FBP_SIDE_FOOTER + DEFAULT|CLASSIC|COMPACT|HORIZONTAL`
   - PPB: `PDP_INPAGE + CASCADE|COGNIVE`, `PDP_MODAL + MODAL|SIMPLIFIED`
8. Treat global design/color/language customization as a shared Brand Config route rather than as per-template configuration.
9. Preserve screenshot/network/runtime evidence as the source of truth for this audit; unresolved controls require follow-up live investigation before implementation.
