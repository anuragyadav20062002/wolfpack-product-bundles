# Test Spec: EB Evidence UI Clone Rewrite
**Spec ID:** eb-ui-clone-rewrite  **Issue:** eb-ui-clone-rewrite-1  **Created:** 2026-05-26

## Purpose

Define the TDD surface for evidence-backed Admin, persistence, storefront, and cart parity. Tests must be written before implementation code for each slice.

## Test Cases

### Template Mapping

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB Standard | full-page, standard | `FBP_SIDE_FOOTER`, `DEFAULT` | Evidence says Standard is `DEFAULT`. |
| 2 | FPB Classic | full-page, classic | `FBP_SIDE_FOOTER`, `CLASSIC` | |
| 3 | FPB Compact | full-page, compact | `FBP_SIDE_FOOTER`, `COMPACT` | |
| 4 | FPB Horizontal | full-page, horizontal | `FBP_SIDE_FOOTER`, `HORIZONTAL` | |
| 5 | PPB Product List | product-page, product-list | `PDP_INPAGE`, `CASCADE` | |
| 6 | PPB Product Grid | product-page, product-grid | `PDP_INPAGE`, `COGNIVE` | Spelling follows EB evidence. |
| 7 | PPB Horizontal Slots | product-page, horizontal-slots | `PDP_MODAL`, `MODAL` | |
| 8 | PPB Vertical Slots | product-page, vertical-slots | `PDP_MODAL`, `SIMPLIFIED` | |
| 9 | PPB template save runtime rewrite | Product Page Select Template save after bundle product exists | DB fields persist and bundle product metafields receive the same `bundleDesignTemplate`, `bundleDesignPresetId`, and `bundleDesignTemplateData.templateId` | Live Product List save updated DB but storefront app-block config stayed on the previous template. |

### Dependency Gates

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Discount messaging disabled when discount off | `discountEnabled=false` | messaging disabled/hidden | |
| 2 | BQO enabled for quantity rules | quantity rule, non-BXY | BQO enabled | |
| 3 | BQO disabled for amount rules | amount rule, non-BXY | BQO disabled | |
| 4 | BQO disabled for Buy X, get Y | BXY rule | BQO disabled, box selection cleared | |
| 5 | Category rules require multiple categories | one category | category rules hidden | |
| 6 | Step/category rules mutually exclusive | category rules active | step rules disabled | |
| 7 | Step progress text only for step-based bar | simple progress | tier text hidden | |
| 8 | Quantity validation gates max quantity | validation off | max quantity disabled | |
| 9 | Preselected products gate defaults | preselected off | default title/products disabled | |
| 10 | Discount display gates format | display off | format dropdown disabled | |

### Category Contracts

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB direct products category | hydrated product picker objects | `products`, `selectedProducts`, `collectionsData`, `collectionsSelectedData`, `conditions`, `subTitle`, `categoryBanner`, `multiLangData` | Raw save proof `network-806-saveMultipleCategoriesData.request.network-request`. |
| 2 | FPB collection category | hydrated collection picker objects | empty `products`, empty `selectedProducts`, collection objects in `collectionsSelectedData` | Raw save proof preserves collection objects. |
| 3 | PPB direct products category | hydrated product picker objects | `products`, empty `collectionsSelectedData`, category `conditions`, subtitle/banner fields | Raw save proof `network-2729-ppb-step-setup-update.network-request`. |
| 4 | PPB collection category | hydrated collection picker objects | `collectionsSelectedData`, empty `products`, subtitle/banner fields | |
| 5 | PPB variant flags | flags true/false | category-level variant and swatch flags | |
| 6 | Category-first runtime | category-backed products/collections with empty top-level arrays | runtime keeps category data under `categories` and does not copy it into top-level step `products`/`collections` | No compatibility shims. |
| 7 | Runtime category compactness | hydrated Admin product objects with variants/images in `StepCategory.products` | metafield/runtime categories keep product references but strip variant and image payload bloat | Admin save payload remains hydrated; storefront runtime hydrates products through app proxy. |

### FPB Bundle Settings Contracts

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Bundle summary Admin save | Bundle Cart Title and Bundle Cart Subtitle fields | save form appends direct `bundleTextConfig.bundleSummary.{title,subTitle}` | Do not rely on generic `textOverrides` for the persisted contract. |
| 2 | Bundle summary DB/metafield | direct summary JSON in save request | bundle update persists `bundleTextConfig` and metafield sync receives the same direct contract | Evidence reference documents direct text config. |
| 3 | Full Page summary rendering | runtime config with `bundleTextConfig.bundleSummary` | side summary renders configured title and subtitle from the direct contract | Widget fallback strings are only defaults when the direct values are empty. |

### FPB Add-ons Contracts

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Add-ons Admin save | Add-ons enabled, multi-tier product, amount eligibility, percentage discount, messages | save form appends direct `personalizationData.isPersonalizationEnabled=true` and `addonProducts.type=MULTI_TIER` | Evidence save request is `savePersonalization` with `personalizationData.addonProducts`. |
| 2 | Add-ons DB/metafield | direct personalization JSON in save request | bundle update persists `personalizationData` and bundle metafield sync receives the same direct contract | Email/message-product behavior remains out of scope. |
| 3 | Add-ons bundle UI config | metafield writer receives direct personalization JSON | `$app.bundle_ui_config.personalizationData.addonProducts` matches the saved tiers/messages | Storefront runtime proof uses this top-level object. |
| 4 | Add-ons formatter | DB row has direct personalization JSON | public FPB app-proxy config includes `personalizationData` unchanged | Runtime JSON row requires top-level `personalizationData`. |
| 5 | Add-ons step bridge | runtime `personalizationData.addonProducts` is enabled | Full Page widget creates an add-on step from the direct contract without mutating paid step products | Keeps add-ons separate from normal Step Setup. |
| 6 | Add-ons eligibility messaging | amount-based tier value and selected paid subtotal | locked message replaces `##addonsConditionDiff##`, eligible message replaces discount variables | Evidence has eligible and ineligible templates. |
| 7 | Add-ons tier discount default | Add-ons tier has no explicit discount value | Admin serializer and UI default to `0`, not a free-gift `100` discount | Captured Add-ons evidence uses explicit discount config, not inherited free-gift display state. |
| 8 | Add-ons paid-step isolation | Add-ons section enabled while paid step has products/categories | save payload writes direct `personalizationData` while `stepsData` keeps paid steps non-free-gift | Storefront bridge appends a synthetic add-on step and must not remove the paid step. |
| 9 | Chargeable Add-ons totals | Add-on tier has a discount below 100% | selected add-on price contributes to sidebar/mobile/cart retail totals and is not emitted as a free-gift cart line | Evidence footer total includes the selected paid add-on price. |
| 10 | Add-ons Admin visual markers | Free Gift & Add Ons section enabled | route/CSS use dedicated Add-ons card, header/action, product-selection row, three-column discount row, Tier Rules, and Add Tier button markers | Keeps the Admin parity patch scoped to the Add-ons surface. |

### FPB Admin Shell

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Configure shell title strip | Full Page configure route | route omits Shopify breadcrumb `ui-title-bar`, does not render a duplicate local app title strip, and keeps the Configure Bundle Flow header with readiness and preview actions | Chrome proof shows Shopify supplies the app-name title row after `ui-title-bar` is removed. |

### FPB Messages Contracts

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Messages Admin save | Messages enabled, sender/recipient enabled, mandatory, character limit, selected message product | save form appends direct `personalizationData.giftMessage` with the captured booleans, string limit, and message product object | Email/customize-email behavior stays excluded. |
| 2 | Messages DB/metafield | direct gift-message JSON in save request | bundle update persists `personalizationData.giftMessage` and bundle metafield sync receives the same direct contract | Do not store the contract under generic `textOverrides`. |
| 3 | Messages runtime formatter | DB row has direct gift-message JSON | public FPB app-proxy config includes `personalizationData.giftMessage` unchanged | Runtime proof reads top-level `personalizationData`. |
| 4 | Messages storefront fields | runtime `giftMessage.isGiftMessageEnabled=true` | Full Page widget renders Message heading, From, To, textarea placeholder, and max length from the direct contract | Email recipient and Customize Emails remain out of scope. |
| 5 | Mandatory message validation | required message is empty and Add to Cart is attempted | visible validation text `Please enter a message` appears and cart add is blocked | Captured desktop/mobile validation text. |
| 6 | Message cart line | message product variant exists and message is entered | cart payload includes a message-product line with `_gift_message`, optional `_gift_from`, and optional `_gift_to` properties | Cart proof remains required before green. |

### FPB Discount Contracts

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Percentage quantity rule save | Discount enabled, Percentage Off, quantity condition `2`, discount value `5` | pricing upsert keeps the quantity rule and default rule messages for progress and success | Save payload and runtime proof show the same quantity threshold and percent value. |
| 2 | Bundle Quantity Options direct contract | quantity rule plus enabled box option `Box of 2` / `5% off` | save writes direct `boxSelection.isEnabled=true`, one rule with `boxQuantity: 2`, label, subtext, default selection, and `validateBoxSelectionQuantity:false` | BQO is available only for quantity rules and never for Buy X, get Y. |
| 3 | Bundle variant runtime config | saved percentage rule and direct box-selection config | `updateBundleProductMetafields` receives top-level `boxSelection` alongside pricing messages and display options | Required for `data-bundle-config` runtime proof. |
| 4 | Step-Based progress labels | progress bar enabled with tier text `2 Pack` and subtext `Save 5%` | Full Page widget renders title/subtitle step markers instead of the simple message row | Simple Bar continues to hide tier text controls. |
| 5 | Box option storefront marker | runtime `boxSelection.isEnabled=true` with one default option | Full Page widget renders an active box option before discount messaging on desktop and mobile side summaries | Live proof requires desktop and mobile screenshots. |
| 6 | Discounted cart line | selected quantity reaches the percentage rule | cart source properties include retail price and discount savings; cart proof shows the public savings property and actual discounted bundle pricing | Cart proof remains required before green. |
| 7 | Message-product auxiliary cart line | discount bundle with non-email message product | message product is added as a separate auxiliary line and does not carry the bundle grouping attribute used by Cart Transform MERGE | Required so message personalization cannot block discount application. |
| 8 | Category-backed active parent product | draft Full Page bundle has products only inside `StepCategory` | save status becomes `active`; parent sync first uses Shopify's current `productUpdate(product: { id, status })` mutation, then falls back to a temporary `requiresComponents=false → ACTIVE → requiresComponents=true` sequence only when Shopify rejects unsupported bundle publications | Required for Cart Transform MERGE to apply against the live parent variant. |
| 9 | Fixed Amount message variables | Fixed Amount Off quantity rule with `discountValue=500` and template `{{discountValueUnit}}{{discountValue}}` | default messages and storefront replacement render the currency symbol before the amount, with no trailing `off` token in the value pair | EB fixed-amount proof uses `Success! Your {{discountValueUnit}}{{discountValue}} discount has been applied to your cart.` |
| 10 | Discount type reset messaging | Configure page switches discount type from a saved percentage rule to Fixed Amount Off | new rule starts with method-specific default messages, and stale global success copy cannot override the per-rule fixed-amount default | Live save payload persisted corrupted stale global success copy. |
| 11 | Sidebar step progress presentation | side-footer summary card with step-based progress | sidebar progress renders plain centered discount text, a slim progress track, and tier title/subtext labels on the white card instead of a dark banner block | Footer progress keeps its existing banner structure. |
| 12 | Standard mobile summary tray | side-footer Standard template on mobile | compact sticky summary tray is visible by default, without modal backdrop/collapsed-only state, and includes discount message, progress, and action button | Matches mobile Standard/fixed-amount evidence before selected-products drawer behavior is marked green. |
| 13 | Standard mobile product-card density | side-footer Standard template on mobile | product cards use compact image/title/price spacing and a square plus CTA; desktop Standard card CTA remains unchanged | Mobile evidence differs from desktop Standard evidence, so scope stays mobile-only. |

### Cart Messaging

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Bundle Items on | global setting on | public `Items` property present | |
| 2 | Retail Price on | global setting on | public `Retail Price` property present | |
| 3 | You Save on | global setting on | public `You Save` property present | |
| 4 | All off | settings off | properties omitted | |
| 5 | Direct settings persistence | captured cart-message object | `DesignSettings.bundleCartLineMessaging` direct JSON field | Do not store as unrelated visual setting. |
| 6 | DCP loader merge | saved cart-message object | loaded product-page settings include same object | |
| 7 | Cart transform defaults | no function-owner setting | public `Box`, `Items`, `Retail Price`, `You Save`, and private `_Items` emitted | Runtime default matches all controls on. |
| 8 | Cart transform settings off | function-owner settings disable public fields | public `Items`, `Retail Price`, `You Save` omitted; `Box` and `_Items` retained | Captured global toggles. |
| 9 | Cart transform amount-plus-percent | retail/savings totals | `You Save` uses amount and percent format | Evidence-backed default format. |
| 10 | DCP Product Page subsection | product-page global config | General group includes `cartLineMessaging`; full-page config omits it | Edit Defaults is a PPB global Product Page Layout control. |
| 11 | Product Page Layout visual inventory | observed global bundle settings | seven Bundle Settings rows render in observed order/state as visual-only inventory | Do not persist until each control has storefront proof. |
| 12 | Cart Messaging switch interaction | Product Page Layout Cart Messaging switches | switch activation is handled by React and opens Save/Discard footer | Hidden native checkbox toggles in Chrome did not produce a live save bar. |
| 12 | Compact widget source data | selected bundle lines | one private `_bundle_display_properties` JSON attribute contains box, items, retail price, and You Save formats | Keeps Function input query under Shopify limit. |
| 13 | Compact Function source parsing | `_bundle_display_properties` JSON | public `Box`, `Items`, `Retail Price`, and `You Save` output unchanged | No extra per-field line attributes in Function input. |
| 14 | Full Page cart source line | selected FPB products | cart item properties include public `Box`, `Items`, `Retail Price`, and private `_bundle_display_properties`; `You Save` appears only when discounted | Direct FPB cart proof needs visible line properties without relying on PPB Cart Transform. |
| 14 | Storefront self-heal app-proxy signature | signed app-proxy request | route accepts request and calls CartTransform activation | Live cart proof blocked by `400 Invalid storefront request`. |
| 15 | Category product selected variant merge | `StepCategory.products[].variants` has multiple variants | `component_parents` is written to every cached variant | Live PPB cart selected a non-first variant. |
| 16 | BXY component-parent transform | `component_parents.price_adjustment.method=buy_x_get_y` and quantity threshold met | MERGE operation emits parent variant, 100% price adjustment, and public cart labels | Live selected variant has metafield but cart line stays unmerged. |
| 17 | Cart Transform app-owned metafields | function input query reads component and pricing metafields | every app-owned variant metafield is queried with `namespace: "$app"` and its key | Live transform was active but component lines stayed unmerged, consistent with null input metafields. |
| 18 | Parent selected variant references | `StepCategory.products[].variants` has cached selected variants | parent bundle variant `$app.component_reference` includes every cached variant with aligned quantities | Shopify validates `linesMerge` against parent component references as well as component-line parents. |
| 19 | Unsupported publication active parent sequence | `productUpdate(status: ACTIVE)` returns `does not support bundle products` for an FPB parent | route sync clears parent variant `requiresComponents`, activates product, then restores `requiresComponents` | Live store had ChatGPT auto-publication installed; direct activation and temporary auto-publish disablement both failed. |
| 20 | DCP deep-link hydration | Product Page Cart Messaging Additional Configurations deep link | route imports `PreviewPanel` directly and does not load the preview barrel/raw widget CSS before hydration | Live Chrome showed switch buttons without React hydration keys after barrel-triggered raw CSS 404s. |

### PPB Bundle Settings Contracts

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | No preselected products | no default-products field | `defaultProductsData: {}` | Captured unset save shape. |
| 2 | Preselected products enabled | captured default-products JSON | product GID, numeric ID, handle, variant GID, numeric variant ID, required quantity | |
| 3 | Quantity validation | captured validation JSON | `validateQuantityPerProduct.isEnabled`, `allowedQuantity` | |
| 4 | Selling-plan selection | captured selling-plan JSON | `individualSellingPlanSelection.isEnabled`, `showFor` | |
| 5 | Bundle summary text | captured text-config JSON | `bundleTextConfig.bundleSummary.title`, `subTitle` | |
| 6 | Runtime formatter | DB row with direct JSON fields | public widget DTO includes the same direct fields | |
| 7 | Category-backed save validation | PPB step has `StepCategory.products` and parent product | save/metafield validation treats the bundle as populated | Matches live Product Page picker payload. |
| 8 | Category-backed storefront config | PPB step has `StepCategory.products` | metafield/runtime config emits selectable products for the widget | Storefront proof showed empty `steps[0].products`. |
| 9 | Sync Product preserves category products | PPB Sync Product with `StepCategory.products` | product metafield sync payload keeps products, variants, and collections | Live Sync Product rewrote runtime config empty. |
| 10 | Sync Product selected variants | flattened `products[]` include cached variants | component metafields are written to every cached variant | Same config must support storefront runtime and Cart Transform. |
| 11 | Save-to-metafield direct contracts | Product Page save includes direct Bundle Settings fields | `updateBundleProductMetafields` receives `defaultProductsData`, `validateQuantityPerProduct`, `individualSellingPlanSelection`, and `bundleTextConfig` | Live runtime proof omitted saved fields. |
| 12 | Bundle variant UI config direct contracts | Bundle variant metafield writer receives direct Bundle Settings fields | `$app.bundle_ui_config` includes the same direct contracts for storefront runtime | App block reads this JSON. |
| 13 | Default-products picker direct contract | Shopify product picker selection | Admin serializes `defaultProductsData.products[]` with product ID, GraphQL ID, handle, title, image, one selected/available variant ID pair, price, inventory, and `requiredQuantity: 1` without mutating step products | EB save payload is direct `defaultProductsData` with one selected variant, not a step default. |
| 14 | Product Page direct default-products runtime | Product Page widget receives enabled `defaultProductsData` | Widget seeds selected products, renders default-products title/line, contributes to subtotal/progress/cart, and does not mark EB-style `inventoryQuantity: 0` defaults unavailable unless an explicit availability flag is false | Desktop/mobile proof row requires preselected line and cart proof. |

### PPB Bundle Settings Admin

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Setup rail order | product-page configure | Step Setup, Discount & Pricing, Bundle Visibility, Bundle Settings, Subscriptions, Select Template | Captured PPB Bundle Settings and Subscriptions screenshots. |
| 2 | Edit Defaults route | cart line display card | `/app/design-control-panel?modal=product_page&section=cartLineMessaging` | Global Product Page Layout Additional Configurations. |
| 3 | Subscription validation shell | Subscriptions section | Bundle Subscriptions, How to setup?, Get Subscription Plans, no-common-plan alert state | Common selling-plan validation. |
| 4 | Bundle Settings heading toggles | Pre Selected Product, Quantity Validation, Subscription Integration cards | toggles sit inline beside section headings instead of pinned to the far right | Captured Bundle Settings evidence. |
| 5 | Pre Selected Product disabled state | preselected toggle off | no extra helper copy, no Multi Language button, no `Not set` badge, Browse Products disabled | Captured disabled/default state. |

### PPB Bundle Visibility Admin

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Widget direct config serialization | Product Page Bundle Widget enabled with block/button, title, description, button text, image, display targeting, and browsed-product toggle | Admin save submits current-state `bundleUpsellConfig.widgetConfiguration` with `type:"OFFER_WIDGET"`, image/title/description/buttonText, displayConfiguration, and `useLinkProductAsDefaultProduct` | Current route resubmits the previously loaded config instead of current controls. |
| 2 | Bundle Embed direct config serialization | Product Page Bundle Embed enabled with title, subtitle, targeting, and browsed-product toggle | Admin save submits current-state `bundleUpsellConfig.upsellConfiguration` with `isEnabled`, title, subTitle, displayConfiguration, and `useLinkProductAsDefaultProduct` | EB persists Widget and Embed branches in one direct object. |
| 3 | Bundle Visibility save/metafield sync | Product Page save carries a direct `bundleUpsellConfig` object | DB update and bundle-product metafield sync receive the exact direct object | Storefront runtime reads this direct contract. |

### PPB Product Sync

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Current productUpdate mutation | Product Page save/status sync for an unlisted bundle product | Admin GraphQL call uses `productUpdate(product: ProductUpdateInput!)` with variables under `product`, including `descriptionHtml` and the ACTIVE→UNLISTED sequence | Shopify current docs mark `input: ProductInput` deprecated; stale product descriptions blocked the Horizontal Slots visual fixture. |
| 2 | Empty status boundary validation | Product Page save payload with `bundleStatus=""` | Save returns a 400 validation error before Prisma update; the Admin selector must submit one of the direct `BundleStatus` values | Live unlisted refresh proof posted an empty status value and Prisma rejected it as HTTP 500. |
| 3 | Save syncs generated product title | Product Page save changes the bundle name and has a linked Shopify product | Product sync sends the saved bundle name as `product.title` in the current `productUpdate(product: ProductUpdateInput!)` call | Horizontal Slots reference product title is part of the page fixture, and stale generated product titles block visual parity. |
| 4 | Create generated product with media | Product Page Sync Product creates a missing Shopify product | `productCreate(product: ProductCreateInput!, media: [CreateMediaInput!])` is called with a generated placeholder image from the app public URL | Current create path uses deprecated `input: ProductInput` and no media, producing the generic bundle image gap. |
| 5 | Hard reset generated product media | Product Page hard Sync Bundle recreates the Shopify product | recreate uses `productCreate(product: ProductCreateInput!, media: [CreateMediaInput!])` with the generated placeholder image | Existing products need the same direct create contract after a destructive sync. |
| 6 | Manual bundle product update uses current mutation | Shared update-bundle-product action receives title and image URL | `productUpdate(product: ProductUpdateInput!, media: [CreateMediaInput!])` carries title and optional image media in one current mutation | The old `productUpdate(input: ProductInput!)` path is deprecated and misses the current media argument. |
| 7 | Admin product card current media | Configure loader fetches a linked generated bundle product | loader queries `featuredMedia`/`media` and Admin state derives the image URL from current Shopify media shape | Storefront media can be fixed while Admin still displays a generic icon unless the loader requests media. |
| 8 | Generated product stale media cleanup | Product Page generated product has one placeholder media and stale historical media | sync keeps one placeholder media reference and removes stale media product references via `fileUpdate.referencesToRemove` | Reference product page shows one parent media tile; WPB rendered a second historical product media tile. |
| 9 | Generated product metadata normalization | Product Page create/recreate/save sync for a generated bundle product | product create/update uses saved bundle-name handle, `shop.name` as vendor, `productType: "product"`, empty generated-media alt, and persists the actual Shopify handle back to `Bundle.shopifyProductHandle` | Public product JSON proof showed handle/vendor/product data mismatch after title/media cleanup. |
| 10 | Sync Product always rewrites runtime metafields | Product Page Sync Product for a linked bundle with no enabled pricing | component and bundle-product metafield sync receive the current config with `pricing: null` and the returned Shopify product handle | Manual product metadata proof had fresh product JSON but stale app-block runtime config. |

### PPB Select Template Admin

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | App-owned Select Template dialog | Product Page Select Template open/select/close path | route renders an accessible React-controlled `role="dialog"` overlay for template selection and does not wrap the Select Template surface in `s-modal` | Live embedded Admin proof showed native modal close/select flakiness. |

### PPB Discount Admin

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | BXY reward controls row | Product Page Discount & Pricing with Buy X, get Y | Discount value, Discount type, and Apply Discount to share a single three-column row | Captured Admin evidence shows these controls horizontally grouped. |
| 2 | Product Page edit canvas alignment | Product Page configure shell | left-aligned wider canvas, not centered narrow canvas | Captured Admin evidence starts the setup rail near the app content edge. |
| 3 | Product Page shell header | Product Page configure shell | Shopify app title row plus Configure Bundle Flow header, readiness score, and preview action; no duplicate bundle-name title row or top placement warning | Bundle Settings evidence shows the default-position shell header. |
| 4 | Product Page BQO direct persistence | Percentage quantity rule with Bundle Quantity Options enabled | save derives and persists top-level `boxSelection` with rule quantity, label, subtext, default state, and `validateBoxSelectionQuantity:false` | EB persists direct box-selection data; BXY must clear this contract. |
| 5 | Product Page discount message persistence | Discount Messaging, success copy, tier text, and locale maps | save stores success message, tier text maps, display options, and `ruleMessagesByLocale` in `BundlePricing` | Required for Admin reload and storefront runtime parity. |
| 6 | Product Page display-options hydration | saved `BundlePricing.displayOptions` | route hydrates BQO/progress state from `bundle.pricing.displayOptions`, not a stale `bundlePricing` alias | Existing source drops saved BQO UI state on reload. |

### PPB Place Widget

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Bundle product recommendation without custom template | bundle product handle, theme-app-extension template service result | Theme Editor template handle resolves to `product`, with `previewPath=/products/{handle}` | Shopify rejected fake `product.{handle}` template in live proof. |
| 2 | Product-specific template if explicitly real | template asset `templates/product.custom.json` | Theme Editor template handle stays `product.custom` | Do not break real merchant-created templates. |
| 3 | API ensure-product-template response | product handle and bundle ID | returns default product template path, not fake product-specific path | The app does not create theme template files. |
| 4 | Deep-link builder for default product template | app key, block handle, shop, template, bundle ID | Theme Editor URL includes `template=product`, `addAppBlockId`, `target=newAppsSection`, `bundleId`, and encoded preview path | Used by the pre-opened tab flow so popup blockers do not swallow the editor. |

### Widget Invariants

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB data-bundle-config present | valid config attribute | no proxy fetch needed | Preserve load order. |
| 2 | FPB config malformed | malformed config attribute | proxy fallback used | Existing retry remains. |
| 3 | 503/504 fallback | proxy 503/504 | single retry after 3s | |
| 4 | Template markers | each template config | expected class/DOM marker | Desktop/mobile class tests. |
| 5 | PPB storefront product hydration | Shopify storefront origin with stale app URL metafield | `/apps/product-bundles/api/storefront-products` base | Avoid stale tunnel failures. |
| 6 | PPB app-domain preview hydration | app/preview origin | direct app origin or configured app URL base | Preserve preview/dev contexts. |
| 7 | PPB parent product with unavailable first variant | product has first variant unavailable and later variant available | parent product card uses first available variant | Live storefront selected product hydration proof. |
| 8 | Loading overlay hide fallback | hide called when no transitionend fires or overlay is already opacity zero | overlay is removed or hidden from accessibility tree | Live Product Page proof still exposed invisible loading image. |
| 9 | Widget init error handler | async init rejects in Product Page or Full Page widget | constructor catch delegates to the existing error UI method | Live proof exposed a missing `showError` method. |
| 10 | PPB quantity validation max per product | `validateQuantityPerProduct.isEnabled=true`, `allowedQuantity=1`, selected product quantity already 1 | Product Page widget disables/rejects further increases for the same selected product | Live proof created a second filled slot. |
| 11 | PPB direct default products | `defaultProductsData.isDefaultProductsEnabled=true` with one default product | Product Page widget renders the default-products title and product line before selected products, includes the default variant in cart items, and uses explicit availability flags instead of zero inventory alone | Captured runtime selected text starts with the configured title and line. |
| 12 | PPB category hydration | step has `categories[].products` or `categories[].collectionsSelectedData` with empty top-level products/collections | Product Page widget fetches products and collection handles from category fields | Raw save proof can place collection source only inside category data. |
| 13 | FPB category hydration | step has `categories[].products` or `categories[].collectionsSelectedData` with empty top-level products/collections | Full Page widget fetches category products/collections and keeps `data-bundle-config` before proxy fallback | Storefront load-order invariant must not change. |
| 14 | FPB app-proxy category include | public FPB proxy loader receives a bundle with ordered `StepCategory` rows | `formatBundleForWidget` receives steps including `StepCategory` so app-proxy `data-bundle-config` keeps category products | Live app-proxy route rendered zero products from a category-backed bundle. |
| 15 | FPB storefront app-proxy API base | Full Page widget runs on a shop-domain app-proxy page | product and collection hydration fetches use `/apps/product-bundles/api/...`, not shop-root `/api/...` | Live product hydration requested shop-root `/api/storefront-products` and got 404. |
| 16 | PPB product-form placement | Product Page widget block is injected outside the product form column | widget relocates the existing `#bundle-builder-app` after the product add-to-cart form before rendering slots/buttons | Horizontal Slots proof rendered below recommendations instead of in the product form column. |
| 17 | PPB native price hiding | Product Page widget initializes on a bundle product page | widget hides the native product price element in the product form column before rendering PPB controls | EB runtime hides native product page price for PPB bundle products. |
| 18 | FPB product-card CTA text | Full Page product card unselected state | product add button renders `Add To Box` instead of a circular plus-only affordance | Captured FPB template evidence shows rectangular card CTAs with this text. |
| 19 | FPB Horizontal mobile card compactness | `FBP_SIDE_FOOTER + HORIZONTAL` on mobile | horizontal product cards use a short image-left/text-right layout with rectangular CTA | Live WPB proof showed the card still too tall after the first Horizontal layout patch. |
| 20 | FPB direct Add-ons runtime | `personalizationData.addonProducts.isEnabled=true` | Full Page widget derives a non-blocking add-on step from the direct personalization contract and renders the add-on product/tier messaging | Add-ons row is blocked from green until Admin/save/desktop/mobile/cart proof all pass. |
| 21 | FPB Standard side-footer content structure | `FBP_SIDE_FOOTER + DEFAULT` fixed-amount evidence row with category-backed step | Widget renders direct bundle summary title/subtitle in the content area, omits the search box, category tabs do not include synthetic `All`, first category is active by default, and active category label renders above the product grid | Theme chrome stays a separate blocked app-proxy architecture row. |
| 22 | FPB category variant-card gating | category-backed Full Page step with `displayVariantsAsIndividualProducts=false` | Product grid uses the active category flag and does not expand multi-variant products into separate cards unless that flag or the non-category step flag is enabled | Evidence says variants render as separate product cards only when the display-variants control is enabled. |
| 23 | FPB parent card first available variant | configured product has an unavailable first variant and a later available variant | Full Page parent-card rendering keeps the product and seeds the card/selector from the first available variant | Live proof showed 6 configured products but only 5 rendered cards. |
| 24 | FPB saved step subtext | category-backed Full Page step has `pageTitle="Choose your jewelry"` | Main content renders the saved step subtext below the timeline/banner area instead of the side-summary title/subtitle | Live fixture persisted `pageTitle` but storefront body omitted it. |
| 25 | FPB inactive category rows | Full Page step has two category entries and the first is active | Product grid renders the active category products followed by a collapsed row for the inactive category | Evidence body shows Category 2 after the active Category 1 products. |
| 26 | FPB add-on side-panel title | direct `personalizationData.addonProducts.title="Add ON"` with an ineligible tier message | Full Page side panel renders an add-on heading before the tier message | Live runtime had the title in config but rendered only the message. |
| 27 | FPB multiple-category timeline item | paid Full Page step has more than one category plus a direct Add-ons step | Timeline renders `Step 1 - Jewelry Picks`, a synthetic `Multiple Categories` item, and `Add On` in that order | Live reference measurement shows the middle label and WPB measurement omitted it. |
| 28 | FPB category tab pill styling | fixed-amount Standard page with two categories on desktop/mobile | Category tabs render title-case black/white pills with `2px` black borders, `99px` radius, compact padding, no uppercase transform, and mobile left alignment | Live measurement shows WPB still using centered cyan/gray uppercase tabs. |
| 29 | FPB available variant with zero quantity | Storefront API product variant has `available=true`, `quantityAvailable=0`, and `currentlyNotInStock=false` | Full Page widget treats the variant as sellable/unlimited for selection and does not render an out-of-stock card state from zero quantity alone | Live WPB fixed-amount fixture blocked every visible product even though the product API response included sellable variants. |
| 30 | FPB selected Standard product card density | fixed-amount Standard selected state with two cards on desktop/mobile | Product grid/card/image/title/price/action dimensions match the measured selected reference cards without the green WPB selected-card border | Live selected metrics show WPB desktop cards too tall and mobile cards too small. |
| 31 | FPB Standard desktop side-panel density | fixed-amount Standard selected desktop state | Side panel uses the measured `366px` width, `20px` padding, `326px` inner column, `5px` gap, no border, `10px` radius, category-title row alignment, and reference-height body | Live WPB metrics show the panel too high, too narrow, bordered, and short. |
| 32 | FPB Standard mobile compact footer density | fixed-amount Standard selected mobile state | Compact mobile summary uses the measured `370px x 196px` sticky footer, `5px` padding, centered black quantity badge, `126px` discount block, `58px` action row, and `38px` black button | Live WPB metrics show the tray too short, full viewport width, no quantity badge, and compressed action button. |
| 33 | FPB Add-ons Cart Transform discount | fixed-amount Standard bundle has two paid products plus one selected chargeable Add-ons product with a 10% add-on tier discount | Widget emits explicit add-on step/discount data without increasing the function input query, cart display savings include base plus add-on discount, and Cart Transform `linesMerge.price.percentageDecrease` reflects the combined effective discount across the grouped lines | User clarified the discount must be applied by Cart Transform; do not add a separate discount extension. |
| 34 | PPB Modal Slots empty state and button stack | `PDP_MODAL + MODAL` with no selected/default products | Product Page widget marks modal-slot DOM, renders a section title above a 3-column slot row, labels the empty first slot `Product 1`, styles the disabled bundle button gray, and renders the black buy-now visual below it | Live same-fixture proof showed the slot too narrow/tinted, mislabeled with the step name, and missing the black buy-now row. |
| 35 | PPB percentage threshold runtime persistence | Product Page save submits percentage quantity rule with `conditionValue=2` | Bundle-product metafield sync receives a flat pricing rule with `conditionType="quantity"`, `conditionValue=2`, and `discountValue=5` | Post-fix Admin save and storefront runtime proof keep the saved threshold as `2`. |
| 36 | PPB Horizontal Slots measured geometry | `PDP_MODAL + MODAL` empty state in desktop and mobile storefront viewports | Product Page CSS uses desktop `345px` slot/action width with three `104.328px` columns and mobile `360px` slot/action width with three `110.66px` columns | Post-SIT `2.9.4` proof matches the measured wrappers/gaps, with browser-rounded columns. |
| 37 | PPB Step Title pageTitle persistence | Product Page save submits `stepsData[0].pageTitle="Build audit bundle"` | DB step create writes `pageTitle`, response includes the value, bundle-product metafield runtime config preserves it, and the Product Page modal-slot header renders it on desktop/mobile | Post-fix route, metafield, and deployed widget `2.9.5` proof show `pageTitle` persisted in response/runtime and rendered as `Build audit bundle`. |
| 38 | PPB Horizontal Slots empty includes spacing | `PDP_MODAL + MODAL` app-block includes an empty `.bundle-includes` child | Empty `.bundle-includes` is hidden for Product Page modal-slot templates so the slot grid to Add Bundle button gap matches the EB reference button stack | Post-fix deployed widget `2.9.6` proof shows the empty element hidden and the grid-to-button gap reduced from `57px` to `14px` on desktop/mobile. |

## Acceptance Criteria

- [ ] RED tests are committed or staged before implementation code for each slice.
- [ ] All listed unit tests pass.
- [ ] Integration tests prove Admin payload to DB/metafield output for changed contracts.
- [ ] Widget tests prove template markers and load invariants.
- [ ] Chrome evidence rows are updated only after live proof is captured.
