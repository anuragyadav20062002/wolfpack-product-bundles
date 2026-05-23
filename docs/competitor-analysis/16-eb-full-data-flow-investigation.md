# EB Full Data-Flow Investigation

**Date:** 2026-05-22  
**Store:** `yash-wolfpack.myshopify.com`  
**Method:** Authenticated EB Admin configuration plus live storefront inspection with Chrome DevTools MCP  
**Issue:** `eb-full-data-flow-investigation-1`

## Executive Summary

Two fresh EB bundles were created and rendered on their intended storefront surfaces:

| Bundle type | Test artifact | EB identifier | Storefront surface |
|---|---|---:|---|
| Full-page / landing | `WPB Research Landing Bundle 2026-05-22` | `bundleId: "2"` | `/apps/gbb/easybundle/2?page=addProductsPage1&currentFlow=byob` |
| Product page | `WPB Research Product Page Bundle 2026-05-22` | `offerId: "MIX-894502"` | `/products/wpb-research-product-page-bundle-2026-05-22` |

The important finding is that EB preserves a category-first shape end to end. Both Admin save payloads serialize each step as `productsData1`, with a `categories` object keyed by stable category IDs. Direct products and collection-backed categories remain distinct arrays inside each category instead of being flattened before reaching the storefront.

This supports a Wolfpack target where our public widget DTO keeps `steps[].categories[]` and maps directly from our existing `StepCategory` model, while keeping our current FPB transport and theme-extension insertion model unchanged.

## Configuration Evidence

### Shared Catalog Selections

Direct products used in both bundles:

| Product | Product GID | Numeric product ID | Variant GID | Numeric variant ID |
|---|---|---:|---|---:|
| `14k Dangling Obsidian Earrings` | `gid://shopify/Product/8322626126020` | `8322626126020` | `gid://shopify/ProductVariant/45038877868228` | `45038877868228` |
| `14k Dangling Pendant Earrings` | `gid://shopify/Product/8322626191556` | `8322626191556` | `gid://shopify/ProductVariant/45038877933764` | `45038877933764` |

Collection-backed category used in both bundles:

| Collection | Collection GID | Handle | Observed product count |
|---|---|---|---:|
| `Automated Collection` | `gid://shopify/Collection/309961654468` | `automated-collection` | `29` |

### Full-Page Bundle Admin Flow

Creation endpoint:

```http
POST https://prod.backend.giftbox.giftkart.app/api/stepsConfiguration/create?shopName=yash-wolfpack.myshopify.com
```

Creation payload:

```json
{
  "bundleName": "WPB Research Landing Bundle 2026-05-22",
  "bundleType": "FULLPAGE_BUNDLE",
  "bundleChecklistStatus": "NOT_STARTED",
  "bundleChecklist": {
    "publishBundle": false,
    "reviewDefaultLanguageText": false,
    "changeBundleColors": false
  },
  "isStepAdded": false,
  "bundleDesignTemplate": "FBP_SIDE_FOOTER"
}
```

Primary category save endpoint:

```http
POST https://prod.backend.giftbox.giftkart.app/api/stepsConfiguration/saveMultipleCategoriesData?shopName=yash-wolfpack.myshopify.com&bundleId=2
```

Observed step/category shape after keyboard/a11y follow-up:

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
      "title": "Category 1",
      "products": [{ "id": "gid://shopify/Product/8322626126020" }],
      "collectionsData": [],
      "collectionsSelectedData": [],
      "conditions": [],
      "multiLangData": {}
    },
    "category54364": {
      "categoryId": "category54364",
      "title": "Category 2",
      "products": [],
      "collectionsSelectedData": [{ "id": "gid://shopify/Collection/309961654468" }],
      "conditions": [],
      "multiLangData": {}
    }
  }
}
```

Wrapper update endpoint:

```http
POST https://prod.backend.giftbox.giftkart.app/api/stepsConfiguration/update?shopName=yash-wolfpack.myshopify.com&bundleId=2
```

Notable wrapper fields: `defaultProductsData`, `bundleTextConfig.bundleSummary`, `renderChooseVariantDropdown: true`, `boxSelection`, and `readinessScore: 35`.

### Product-Page Bundle Admin Flow

Creation endpoint:

```http
POST https://prod.backend.giftbox.giftkart.app/api/mixAndMatch/create?shopName=yash-wolfpack.myshopify.com
```

Creation payload:

```json
{
  "bundleName": "WPB Research Product Page Bundle 2026-05-22",
  "uploadedImageSrc": "",
  "bundlePrice": 0,
  "bundleDesignTemplate": "PDP_INPAGE",
  "bundleDesignTemplateData": { "templateId": "CASCADE" },
  "useSingleStepCategoriesAsBundleSteps": false
}
```

Update endpoint:

```http
POST https://prod.backend.giftbox.giftkart.app/api/mixAndMatch/update?shopName=yash-wolfpack.myshopify.com&offerId=MIX-894502
```

Observed step/category shape:

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
        { "type": "amount", "condition": "greaterThanOrEqualTo", "value": "01000" }
      ]
    },
    "categories": {
      "category69520": {
        "categoryId": "category69520",
        "title": "Featured products",
        "name": "Category 1Direct Product Category",
        "categoryRank": 1,
        "products": [{ "id": "gid://shopify/Product/8322626126020" }],
        "collectionsSelectedData": [],
        "displayVariantsAsIndividualProducts": false,
        "displayVariantsAsSwatches": false
      },
      "category19687": {
        "categoryId": "category19687",
        "name": "Category 2",
        "categoryRank": 2,
        "products": [],
        "collectionsSelectedData": [{ "id": "gid://shopify/Collection/309961654468" }],
        "displayVariantsAsIndividualProducts": false,
        "displayVariantsAsSwatches": false
      }
    }
  }
}
```

PPB stores variant display flags per category. FPB stored `displayVariantsAsIndividualProducts` at the step payload level in this capture.

The EB Admin iframe did not reliably accept direct pointer clicks on several controls, but the same controls were reachable through the accessibility tree and keyboard focus. In the PPB editor, Tab navigation plus Space selected `Step rules`, exposed `Add Rule`, and saved populated quantity and amount rules through the `mixAndMatch/update` endpoint.

Discounts were configured from the `Discount & Pricing` section through the a11y-exposed controls. EB saved both the full admin configuration and a compact storefront metafield mirror:

```json
{
  "discountConfiguration": {
    "isDiscountEnabled": true,
    "discountMode": "PERCENTAGE",
    "rules": [
      { "value": "2", "discountValue": "5", "type": "quantity" },
      { "value": "21500", "discountValue": "510", "type": "amount" }
    ],
    "isShowDiscountsEnabled": true,
    "discountTextBody": {
      "percentageAndFixed": {
        "rule1": { "text": "Add {{discountConditionDiff}} product(s) to save {{discountValue}}{{discountValueUnit}}!" },
        "rule2": { "text": "Congrats! Spend {{discountUnit}}{{discountConditionDiff}} more to get {{discountValue}}{{discountValueUnit}} off on your order." }
      }
    },
    "discountTextForSuccess": {
      "value": "Success! Your {{discountValue}}{{discountValueUnit}} discount has been applied to your cart."
    }
  },
  "metafieldData": {
    "discount": {
      "rules": [
        { "value": "2", "discountValue": "5", "type": "quantity" },
        { "value": "21500", "discountValue": "510", "type": "amount" }
      ],
      "discountMode": "PERCENTAGE"
    }
  }
}
```

The second discount rule values are intentionally recorded as observed. EB's embedded number fields appended to existing defaults during the a11y fill, and the save payload is still useful because it proves the serialized rule shape: threshold `value`, discount amount `discountValue`, and basis `type`.

Default/preselected products were configured from `Bundle Settings`. Direct UID clicks on the toggle timed out, but keyboard focus reached `Pre Selected Product`; Space enabled it, the Shopify product resource picker selected `14k Dangling Obsidian Earrings`, and EB saved:

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

The product picker network flow used Shopify Admin GraphQL resource picker operations, including `ProductResourcePicker` for search and `ProductAndVariantResourcePicker` for the selected product/variant IDs.

## Storefront Runtime Evidence

### Full-Page Bundle

Rendered URL:

```text
https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/2?page=addProductsPage1&currentFlow=byob
```

Observed globals:

- `window.easybundles_ext_data`
- `window.easybundle_user_ext_data`
- `gbbExt`, `gbbExtEmbed`, `gbbExtUtils`

Sensitive note: `easybundle_user_ext_data` includes storefront and Mantle token fields. The values were present in the browser but are intentionally not copied into this document.

Important DOM attributes:

```html
<html class="js bundle-2 gbbBundle-HTML">
<div id="gbbBundle"
     class="gbbPageBody gbbMinimilisticLayout gbbProductsCardLayoutV2 bundle-2"
     data-template-id="FBP_SIDE_FOOTER"
     data-is-last-page="true">
```

Category and product attributes:

```text
categoryid="category73936"
categoryid="category54364"
productid="8322626126020" firstvariantid="45038877868228"
productid="8322626191556" firstvariantid="45038877933764"
```

Network inventory:

| Request | Purpose |
|---|---|
| `GET /apps/gbb/easybundle/2` | App-proxy full-page document |
| `GET https://d1712zxri13o2p.cloudfront.net/full-page-bundle/production/active/easy-bundle-full-page-min.js` | Full-page renderer JS |
| `GET https://d1712zxri13o2p.cloudfront.net/full-page-bundle/production/active/easy-bundle-full-page-min.css` | Full-page renderer CSS |
| `GET /cart.js` | Cart state |
| `POST /apps/gbb/updateFullPageBundleView` | Bundle view tracking |
| `POST /api/2025-04/graphql.json` | Storefront API product and collection hydration |
| `POST /cart/update.js` | Cart/app state mutation after renderer init |

The Storefront API product query requested product GIDs and returned product title, handle, description, images/media, options, tags, total inventory, price ranges, selling plan groups, variants, selected options, compare-at price, availability, and variant images. The collection-backed category triggered a later Storefront API product hydration call for collection product GIDs.

### Product-Page Bundle

Rendered URL:

```text
https://yash-wolfpack.myshopify.com/products/wpb-research-product-page-bundle-2026-05-22
```

Observed globals:

- `window.easybundles_ext_data`
- `window.easybundle_user_ext_data`
- `GbbMixState`
- `gbbMix`
- `gbbMixUtils`
- `gbbMixCascadeProductsWrapperRef`
- `gbbExt`, `gbbExtEmbed`, `gbbExtUtils`

Important DOM attributes:

```html
<div class="gbbMixPageWrapper gbbMixProductPageWrapperV2"
     template-id="CASCADE"
     template-type="PDP_INPAGE"
     offer-id="MIX-894502">
```

Step, category, and product attributes:

```text
data-step-id="productsData1"
data-step-number="1"
data-category-id="category69520"
data-category-id="category19687"
data-product-id="8322626126020" data-current-selected-variant-id="45038877868228"
data-product-id="8322626191556" data-current-selected-variant-id="45038877933764"
```

Network inventory:

| Request | Purpose |
|---|---|
| `GET /products/wpb-research-product-page-bundle-2026-05-22` | Shopify product page document |
| `GET .../assets/easy-bundle-min.js` | Shared extension runtime |
| `GET .../assets/easy-bundle-product-page-min.js` | Product-page renderer |
| `GET /cart.js?app=gbbMixBundleApp` | Cart state with EB app marker |
| `POST /apps/gbb/updateMixAndMatchBundleView` | Bundle view tracking |
| `POST /api/2025-04/graphql.json` | Storefront API parent product, direct products, and collection products |
| `POST /cart/update.js?app=gbbMixBundleApp` | Cart/app state mutation after renderer init |

The PPB renderer made a Storefront API `nodes(ids: ...)` query for the parent bundle product, a `nodes(ids: ...)` query for direct products, and a `node(id: Collection)` query for the collection-backed category. The collection query requested `products(first: 24, after: null)` plus product, media, image, selling plan, and variant connections.

## Implementation-Facing Target Shape

### Persisted In Wolfpack DB

Keep the existing StepCategory concept as a first-class model rather than flattening category membership into step products.

Minimum persisted fields for an EB-aligned public shape:

| Entity | Fields |
|---|---|
| Bundle | `id`, `bundleType`, `name`, `status`, `designTemplate`, parent product/variant GIDs where applicable |
| Step | stable step key like `productsData1`, rank, title, subtitle, image, condition settings, enabled flags |
| StepCategory | stable category ID, step ID, rank, title/name/subtitle, image/banner, condition settings, display flags, multilingual text |
| Category product membership | category ID, product GID, numeric product ID, selected variant GIDs, rank, default/preselected flag |
| Category collection membership | category ID, collection GID, handle, rank, selected collection metadata |
| Product cache | product GID, numeric ID, handle, title, images, variants, selected options, prices, compare-at prices, availability, inventory, selling plans |
| Default/preselected product membership | product GID, numeric product ID, selected variant GID, required quantity, title label |
| Discount rules | enabled flag, mode, ordered rules with threshold value, discount value, basis type, merchant message templates |

Do not add backwards-compatibility fallbacks from old JSON blobs. New category fields should be direct fields or clean relational records, with sync handling stale storefront data.

### Serialized To Storefront

The public DTO should keep a category-first step shape:

```ts
type PublicBundleConfig = {
  bundleId: string;
  bundleType: "full_page" | "product_page";
  templateId: string;
  parentProduct?: {
    gid: string;
    numericId: string;
    handle: string;
    variantGid: string;
    variantNumericId: string;
  };
  steps: Array<{
    key: `productsData${number}`;
    rank: number;
    title: string;
    subtitle: string;
    categories: Record<string, {
      categoryId: string;
      rank: number;
      title: string;
      subtitle: string;
      products: Array<PublicCategoryProduct>;
      collectionsData: Array<PublicCategoryCollection>;
      displayVariantsAsIndividualProducts: boolean;
      displayVariantsAsSwatches: boolean;
      conditions: Array<PublicCondition>;
      multiLangData: Record<string, unknown>;
    }>;
    conditions: Array<PublicCondition>;
  }>;
};
```

For direct category products, serialize product identity and the selected/default variant identity. For collection-backed categories, serialize the collection GID/handle and either include a hydrated product window in the server payload or let the widget hydrate products through our existing server-side config route. The key point is that collection products remain attached to the category that sourced them.

### DOM Attributes That Initialize The Widget

Use neutral Wolfpack attribute names but carry the same information EB relies on:

```html
<div data-wpb-bundle-id="..."
     data-wpb-bundle-type="full_page"
     data-wpb-template-id="..."
     data-wpb-config-source="metafield">
</div>
```

Within rendered markup:

```text
data-wpb-step-id="productsData1"
data-wpb-step-rank="1"
data-wpb-category-id="{stable category id}"
data-wpb-category-rank="{rank}"
data-wpb-product-id="{numeric product id}"
data-wpb-product-gid="{Shopify product GID}"
data-wpb-current-variant-id="{numeric variant id}"
data-wpb-current-variant-gid="{Shopify variant GID}"
```

### Widget Runtime Derivations

The widget should derive these at runtime, not persist them as separate sources of truth:

- active step/category
- current selected variant for each rendered product card
- selected quantities and selected bundle lines
- whether a default/preselected product contributes to selected quantities, subtotal, and discount progress
- subtotal, compare-at subtotal, and progress toward discount/condition rules
- collection product pagination state
- UI-only states such as drawer open/closed, loading, disabled buttons, and scroll indicators

### Transport And Theme Extension Plan

Keep our current transport and insertion model:

- FPB route remains `/apps/product-bundles/wpb/:bundleId`.
- Config remains injected into storefront HTML through a JSON/data attribute or JSON script payload.
- The metafield-first FPB loading order remains unchanged: storefront metafield config first, proxy fallback second.
- Product-page and embed surfaces remain Shopify theme app extension app blocks/app embeds.
- Do not switch architecture just because EB performs client-side Storefront API hydration; Wolfpack can keep server-prepared config and selectively hydrate where it improves freshness.

Shopify documentation alignment:

- Theme app extensions expose app blocks, app embed blocks, assets, and snippets through the theme editor and Shopify CDN. See Shopify's theme app extension overview and configuration docs: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions and https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
- JSON metafields in Liquid should be accessed through the metafield `value` object, such as `product.metafields.namespace.key.value`. See https://shopify.dev/docs/api/liquid/objects/metafield
- Storefront product and collection hydration should use Shopify GIDs and GraphQL connections for products, collections, variants, media, and selling plans. See https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections

## Phase 2 — Extended Configuration (2026-05-22 session 2)

### FPB Two-Level Template System

The full `stepsConfiguration/update` save payload confirmed a two-level template system:

| Field | Role | Observed values |
|---|---|---|
| `bundleDesignTemplate` | Layout archetype (structural) | `"FBP_SIDE_FOOTER"` |
| `bundleDesignPresetId` | Visual style preset | `"CLASSIC"` (after selecting Classic Design in the template modal) |

The template selection modal in EB Admin opens as an App Bridge Overlay. Selecting a preset (e.g. Classic Design) sets `bundleDesignPresetId` in the wrapper `stepsConfiguration/update` payload; the `bundleDesignTemplate` layout type is set at bundle creation and does not change in that flow.

PPB uses a parallel two-level system:

| Field | Role | Observed values |
|---|---|---|
| `bundleDesignTemplate` | Layout archetype | `"PDP_INPAGE"` |
| `bundleDesignTemplateData.templateId` | Visual style preset | `"CASCADE"` |

### FPB Full Update Payload Shape

The full `stepsConfiguration/update` body includes these top-level keys (from the 37 KB capture):

```
landingPageData, bundleTextConfig, summaryPageData, personalizationData,
boxSelection, bundleDesignTemplate, bundleDesignPresetId,
productsData1, productsData2, readinessScore
```

`productsData2` is present in the admin payload but the storefront navigation loaded only one step (`navigationItems: [{id: "addProductsPage1"}]`, `isLastPage: true`). This means `productsData2` can exist in the database without being surfaced in storefront navigation until it is explicitly linked in the step flow.

### PPB `boxSelection` Shape

```json
{
  "boxSelection": {
    "isEnabled": false,
    "validateBoxSelectionQuantity": false,
    "rules": [
      {
        "ruleId": "134",
        "boxQuantity": 2,
        "boxLabel": "Box of 2",
        "boxSubtext": "5% off",
        "isDefaultSelected": true
      }
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

`validateBoxSelectionQuantity: false` disables strict box-size enforcement. `isDefaultSelected: true` pre-selects the first box tier on load.

### `displayVariantsAsIndividualProducts` Field Placement

Both FPB and PPB store this flag at the **category level**, not the step level:

```json
{
  "productsData1": {
    "categories": {
      "category69520": {
        "displayVariantsAsIndividualProducts": true,
        "displayVariantsAsSwatches": false
      }
    }
  }
}
```

Visual impact is only observable for products that have more than one variant. The two test products used in this investigation have `hasOnlyDefaultVariant: true`, so the DOM renders identically regardless of the flag value.

---

## Phase 2 — Extended Storefront Evidence (2026-05-22 session 2)

### `window.easybundles_ext_data` Full Shape

Six top-level keys, delivered inline in the storefront document (no async API call):

| Key | Content |
|---|---|
| `userData` | Shop-level settings: `shopName`, `countryCode`, `currency`, `currencyInfo`, `customSettings`, `storefrontAccessToken` (redacted), `multipleCurrenciesInfo` |
| `languageData` | All merchant-customizable UI copy strings for every FPB page (landing, navigation, product, gift box, personalize, review, conditions, general, sort, modals) and PPB (`mixAndMatchTextData`) |
| `pageCustomizationData` | DCP color, typography, and layout settings for product cards, cart footer, navigation banner, landing page, and summary block |
| `bundleLinkData` | Array of FPB bundles: `bundleId`, `bundleName`, `parentProductShopifyData`, `parentProductVariantId`, `bundleImg`, `collectionsForBundleLink`, `bundleUpsellConfig` |
| `bundleUpsellData` | PPB upsell widget configuration |
| `mixAndMatchData` | Array of all PPB bundles with full config: `offerId`, `bundleDesignTemplate`, `bundleDesignTemplateData`, `productsData1`, `discountConfiguration`, `boxSelection`, `metafieldData`, `defaultProductsData`, `useSingleStepCategoriesAsBundleSteps`, `readinessScore` |

Notable `userData.customSettings` fields:

```json
{
  "bundleCartRepresentationObj": {
    "type": "OVERWRITE_LINE_ITEM",
    "overwriteLineItemObj": { "renderItemsNameAsProperty": false }
  },
  "removeStandaloneParentProductInCart": { "isEnabled": true, "afterRemovalScript": "" },
  "bundleCartLineMessaging": {
    "isEnabled": true,
    "showBundleContains": true,
    "showOriginalPrice": true,
    "discountDisplay": { "isEnabled": true, "format": "amount_percentage" }
  },
  "enableStoreFrontGQLAPI": true,
  "isConsolidatedDesignEnabled": true
}
```

### FPB JS Runtime State (`window.gbb.state`)

Key fields observed after adding one product to the bundle:

```json
{
  "offerId": "FBP-2",
  "bundleId": "2",
  "bundleName": "WPB Research Landing Bundle 2026-05-22",
  "currentPageId": "addProductsPage1",
  "isLastPage": true,
  "navigationItems": [
    {
      "id": "addProductsPage1",
      "rank": 2,
      "text": "Step 1 - Jewelry Picks",
      "isActive": true,
      "isCompleted": false,
      "isNavBarItem": true
    }
  ],
  "giftBoxCartData": {
    "boxId": "box1",
    "boxName": "Box - 1",
    "items": [
      {
        "id": 45038877868228,
        "quantity": 1,
        "properties": {
          "_boxProduct": "addProductsPage1",
          "Bundle": "WPB Research Landing Bundle 2026-05-22",
          "Box": "1",
          "_uniqueGbbItemKey": "45038877868228_pageId:addProductsPage1_categoryId:category73936",
          "_Category": "category73936",
          "_CategoryName": "Category 1"
        },
        "variantId": 45038877868228,
        "title": "14k Dangling Obsidian Earrings",
        "price": 82900
      }
    ],
    "boxQuantity": 1,
    "isBoxActive": true,
    "total_price": 82900,
    "discountValue": null,
    "item_count": 1
  }
}
```

FPB `offerId` format: `FBP-{bundleId}`. Widget keyed as `window.gbb`.

### FPB Cart Add Flow

```
1. POST /cart/add.js          → JSON, adds component items
2. POST /api/2025-04/graphql.json  → GetCartMetafield (reads existing bundle_details)
3. POST /api/2025-04/graphql.json  → cartMetafieldsSet (writes bundle_details)
4. POST /cart/update.js        → note= (clears cart note)
5. [redirect to /checkouts/...]
```

`/cart/add.js` request body:

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

`_easyBundle:OfferId` format: `{offerId}_{sessionKey}_{itemIndex}` where `sessionKey` is a short random string making each add-to-cart event unique.

`cartMetafieldsSet` merges display properties into a single `bundle_details` cart metafield. Key is `{offerId}_{sessionKey}` (no item index):

```json
{
  "key": "bundle_details",
  "value": "{\"FBP-2_K6C\":{\"displayProperties\":{\"Items\":\"1 x 14k Dangling Obsidian Earrings\"}}}"
}
```

### PPB JS Runtime State (`window.gbbMix.gbbMixAndMatchBundle.state`)

Key fields:

```json
{
  "offerId": "MIX-894502",
  "bundleName": "WPB Research Product Page Bundle 2026-05-22",
  "initFlow": "SDK",
  "useSingleStepCategoriesAsBundleSteps": false,
  "selectedProductsViewState": "VERTICALLY_STACKED",
  "productToFetchCnt": 24,
  "collectionProductsToFetchCnt": 24,
  "allProductsPaginationCnt": 24,
  "currSelectedCategory": "category69520",
  "categoriesTitleAndIdArr": ["(Array len=2)"],
  "categories": { "category69520": {...}, "category19687": {...} },
  "validateQuantityPerProduct": { "isEnabled": false, "allowedQuantity": 1 },
  "cartData": {
    "selectedCategoriesProducts": { "category69520": [], "category19687": [] },
    "items": [],
    "item_count": 0,
    "total_price": 0,
    "discounted_price": 0
  }
}
```

PPB widget keyed as `window.gbbMix`. `initFlow: "SDK"` — initialized through the EB storefront SDK, not the jQuery-based FPB widget.

Collection pagination limit: `productToFetchCnt: 24` / `collectionProductsToFetchCnt: 24`. The test collection had 29 products, confirming pagination is needed beyond 24. The Storefront API query uses `products(first: 24, after: null)` with a cursor-based `after` variable.

### PPB Cart Add Flow

```
1. POST /apps/gbb/updateMixAndMatchBundleView  → bundle view tracking
2. GET  /cart.js?app=gbbMixBundleApp            → pre-add cart state
3. POST /api/2025-04/graphql.json               → GetCartMetafield
4. POST /api/2025-04/graphql.json               → cartMetafieldsSet
5. POST /cart/add                               → multipart/form-data, adds component items
```

`/cart/add` request fields (multipart/form-data):

```
items[0][id]                              = 45038877868228   (component variant ID)
items[0][quantity]                        = 1
items[0][properties][Box]                 = 1
items[0][properties][_easyBundle:OfferId] = MIX-894502_K1K_1
items[0][properties][_easyBundle:prodQty] = 1
```

`/cart/add` response (Cart Transform converts component line to parent product line):

```json
{
  "items": [
    {
      "id": 46171733524676,
      "variant_id": 46171733524676,
      "product_id": 8598542123204,
      "title": "WPB Research Product Page Bundle 2026-05-22",
      "quantity": 1,
      "properties": {
        "_EasyBundleId": "MIX-894502",
        "_Items": "",
        "_originalOfferId": "MIX-894502_K1K",
        "Box": "1",
        "Items": "1 x 14k Dangling Obsidian Earrings"
      }
    }
  ]
}
```

The Cart Transform OVERWRITE_LINE_ITEM operation replaces the component item with the parent bundle product variant. `_originalOfferId` carries the `{offerId}_{sessionKey}` (no item index). `Items` is a human-readable display string.

`cartMetafieldsSet` accumulates all bundles in one JSON object keyed by `{offerId}_{sessionKey}`:

```json
{
  "FBP-2_K6C":    { "displayProperties": { "Items": "1 x 14k Dangling Obsidian Earrings" } },
  "MIX-894502_K1K": { "displayProperties": { "Items": "1 x 14k Dangling Obsidian Earrings" } }
}
```

### FPB vs PPB Cart Add Comparison

| Aspect | FPB | PPB |
|---|---|---|
| Endpoint | `POST /cart/add.js` | `POST /cart/add` |
| Content-Type | `application/json` | `multipart/form-data` |
| Items added | component items only | component items only |
| Cart Transform operation | EXPAND / MERGE | OVERWRITE_LINE_ITEM |
| Cart representation | varies by setting | parent bundle line item |
| Parent line `_originalOfferId` | n/a (FPB uses `_easyBundle:OfferId` per item) | `{offerId}_{sessionKey}` |
| `bundle_details` metafield key | `{offerId}_{sessionKey}` | `{offerId}_{sessionKey}` |

Both bundle types:
1. Add **component items** with `_easyBundle:OfferId: "{offerId}_{sessionKey}_{itemIndex}"`.
2. Read and write the `bundle_details` cart metafield via Storefront API.
3. Use the same `{offerId}_{sessionKey}` (without item index) as the metafield key.

---

## Phase 3 — Multi-step Navigation and Collection Pagination

### Multi-step Navigation DOM Architecture

The FPB step navigator lives inside `.gbbNavigationItemsContainer`. Each step renders as a `gbbNavigationItem` div with the `id` attribute set to the step's page ID (e.g., `addProductsPage1`).

**Step 1 active (initial load):**

```html
<div class="gbbNavigationItemsContainer">

  <!-- Active step -->
  <div class="gbbNavigationItem" id="addProductsPage1">
    <div class="gbbNavigationStepImgContainer gbbNavigationStepImgContainerActive"
         style="border: 4px solid rgb(0, 0, 0);">
      <img class="gbbNavigationImage" src="...Deafult+Image.png">
    </div>
    <div class="gbbNavigationTitleContainer">
      <p class="gbbNavigationTitle">Step 1 - Jewelry Picks</p>
    </div>
  </div>

  <!-- Upcoming step -->
  <div class="gbbNavigationItem" id="addProductsPage2">
    <div class="gbbNavigationStepImgContainer">
      <!-- No Active class, no border -->
      <img class="gbbNavigationImage" src="...">
    </div>
    <div class="gbbNavigationTitleContainer">
      <p class="gbbNavigationTitle">Multiple Categories</p>
    </div>
  </div>

  <!-- Progress bar line between step icons -->
  <div class="gbbStepsProgressBarContainer" style="width: 425px; left: 212px;">
    <div class="gbbStepsProgressBar" style="background: rgb(204, 204, 204);">
      <div class="gbbStepsProgressBarFilled"
           style="background: rgb(30, 30, 30); width: 0px;">
      </div>
    </div>
  </div>

</div>
```

**After advancing to Step 2:**

- URL changes: `?page=addProductsPage1` → `?page=addProductsPage2` (full page navigation, not SPA state swap)
- Step 1 nav icon: `gbbNavigationStepImgContainerActive` class is removed; icon container gets `background-color: rgb(0, 0, 0)` (filled black) and a `gbbtickMark` SVG checkmark replaces the step image
- Step 2 nav icon: gains `gbbNavigationStepImgContainerActive` class and `border: 4px solid rgb(0, 0, 0)`
- Progress bar fill: `width: 0px` → `width: 429.695px` (the full span between step 1 and step 2 icons)

Step 1 completed DOM (inside `#addProductsPage1`):
```html
<div class="gbbNavigationStepImgContainer"
     style="background-color: rgb(0, 0, 0);">
  <div class="gbbtickMark">
    <svg><!-- checkmark path --></svg>
  </div>
</div>
```

### JS State Changes (Step 1 → Step 2)

`window.gbb.state` before and after clicking "Next":

| Field | Step 1 | Step 2 |
|---|---|---|
| `currentPageId` | `"addProductsPage1"` | `"addProductsPage2"` |
| `isLastPage` | `false` | `true` |
| `navigationItems[0].isActive` | `true` | `false` |
| `navigationItems[1].isActive` | `false` | `true` |

### Footer Transitions

| Step position | Footer contents |
|---|---|
| Intermediate step | `gbbFooterNextButton` with text "Next" |
| Last step (`isLastPage: true`) | `gbbFooterBackButton` (back arrow) + `gbbFooterNextButton` with text "Add To Cart" |

EB reuses the `gbbFooterNextButton` class for both step navigation and the final Add To Cart action. The distinction is purely text content + `isLastPage` JS state.

The back button (`gbbFooterBackButton`) appears only on Step 2+. On Step 1 the footer shows only the "Next" button.

---

### Collection Pagination Architecture

EB does **not** use cursor-based `collection { products(first: N, after: cursor) }` Storefront API queries for pagination.

**Actual pattern:**

1. All collection product IDs are pre-fetched into the widget's internal state on category first render
2. Products are hydrated from Storefront API in batches of 24 via `nodes(ids: [...])` — the same query shape used for direct product hydration
3. The client tracks the full product list in `gbbAddProductsPage.state.dataForInfiniteScroll.allProductsData` (array; accumulates across batches)
4. `gbbAddProductsPage.state.fetchCountPerBatch` = `24` (batch size constant)
5. `gbbAddProductsPage.state.fetchBatchStartIndex` advances by 24 after each "Load More" click
6. The "Load More" button has class `gbbLoadMoreProductsButton`. Clicking it calls `fetchNextProductsBatch()`, which takes the next batch of IDs from the pre-known list and fires new `nodes(ids: [...])` calls

**Observed for `Automated Collection` (29 products):**

| Event | Storefront API call | IDs fetched |
|---|---|---:|
| Category tab activated (initial) | `nodes(ids: [2 direct product IDs])` | 2 |
| Load More click — batch 1 | `nodes(ids: [18 product IDs])` | 18 |
| Load More click — batch 2 (parallel) | `nodes(ids: [9 product IDs])` | 9 |

When the remaining batch is smaller than 24, EB may split it across multiple parallel `nodes()` calls (observed: 18 + 9 = 27, not a clean 24+5). The split point appears to be an internal chunk limit, not a Shopify API constraint.

No cursor variables (`after: $cursor`), no `pageInfo { hasNextPage endCursor }`, and no `collection(handle: ...)` query were observed in any network call during pagination.

---

## Gaps And Blockers

Phase 3 closed multi-step navigation DOM, JS state transitions, and collection pagination. Phase 4 closed template enumeration, FPB preset CSS confirmation, and variant display DOM rendering. Phase 5 confirmed PPB template dispatch architecture. Phases 6 and 7 captured the complete FPB and PPB template CSS from static analysis. **Eight gaps remain unconfirmed** — see the "Confirmed Gaps" section at the end of this document for exact reproduction steps for each.

Fully resolved:
- FPB non-classic preset IDs (`STANDARD`, `COMPACT`, `HORIZONTAL`) — confirmed via CSS scoping inside `.gbbMinimilisticLayout`; all four presets use `bundleDesignTemplate: "FBP_SIDE_FOOTER"`
- FPB template CSS — all four preset rules extracted (Phase 6)
- PPB template CSS — CASCADE base, COGNIVE, MODAL, SIMPLIFIED all extracted (Phase 7)
- PPB template dispatch — binary `PDP_INPAGE` vs `PDP_MODAL` confirmed (Phase 5)
- Screenshots were not committed, per repo rule

These remaining gaps do not change the main data-shape conclusion: categories are stable first-class step children, direct products and selected collections are separately represented under each category, product/collection hydration preserves Shopify GIDs plus numeric storefront IDs, both FPB and PPB use the same `_easyBundle:OfferId` + `bundle_details` metafield cart pattern, and the multi-step FPB uses URL-based page navigation with checkmark-completed step indicators.

---

## Phase 4 — Template Enumeration and Variant Display DOM

### PPB Template Table (Complete)

All 4 PPB templates enumerated via `POST /api/mixAndMatch/update` interception on `WPB Research Product Page Bundle 2026-05-22` (offerId: `MIX-894502`). The two-field shape:

```json
{
  "bundleDesignTemplate": "PDP_INPAGE | PDP_MODAL",
  "bundleDesignTemplateData": {
    "templateId": "CASCADE | MODAL | COGNIVE | SIMPLIFIED"
  }
}
```

| Display Name | `bundleDesignTemplate` | `templateId` |
|---|---|---|
| Product List | `PDP_INPAGE` | `CASCADE` |
| Product Grid | `PDP_INPAGE` | `COGNIVE` |
| Horizontal Slots | `PDP_MODAL` | `MODAL` |
| Vertical Slots | `PDP_MODAL` | `SIMPLIFIED` |

The outer `bundleDesignTemplate` controls the modal/inline distinction. The `templateId` inside `bundleDesignTemplateData` selects the card layout preset within that mode. PPB has no separate `bundleDesignPresetId` field.

---

### FPB Template Architecture (Two-Field System)

FPB uses two separate fields to identify a template, not one:

| Field | Location | Role |
|---|---|---|
| `bundleDesignTemplate` | `stepsConfigurationData.bundleDesignTemplate` | High-level layout class selector |
| `bundleDesignPresetId` | `stepsConfigurationData.bundleDesignPresetId` | Fine-grained preset variant within that layout |

**Confirmed values** (all four entries confirmed via CSS + JS source analysis of `easy-bundle-full-page-min.js` and `easy-bundle-full-page-min.css`):

| Display Name | `bundleDesignTemplate` | `bundleDesignPresetId` |
|---|---|---|
| Classic Design | `FBP_SIDE_FOOTER` | `CLASSIC` ✅ |
| Standard Design | `FBP_SIDE_FOOTER` | `STANDARD` ✅ |
| Compact Design | `FBP_SIDE_FOOTER` | `COMPACT` ✅ |
| Horizontal Design | `FBP_SIDE_FOOTER` | `HORIZONTAL` ✅ |

**Confirmation method — `insertWrapperIntoBody` rendering logic (from `easy-bundle-full-page-min.js`):**

```javascript
if (e in DESIGN_TEMPLATE_CONFIGS) {
  [DESIGN_TEMPLATE_CONFIGS[e].value, "gbbProductsCardLayoutV2"]
    .forEach(t => gbb.$(".gbbPageBody").addClass(t));
  gbb.$(".gbbPageBody").attr("data-template-id", e);   // e = bundleDesignTemplate
}
gbb.$("body").attr("gbb-bundle-design-preset-id", a);  // a = bundleDesignPresetId
```

For `FBP_SIDE_FOOTER`, `DESIGN_TEMPLATE_CONFIGS["FBP_SIDE_FOOTER"].value = "gbbMinimilisticLayout"`, so `.gbbPageBody` receives both `gbbMinimilisticLayout` and `gbbProductsCardLayoutV2`.

**Confirmation via CSS — preset-scoped rules in `easy-bundle-full-page-min.css`:**

```css
body[gbb-bundle-design-preset-id="CLASSIC"]    { .gbbMinimilisticLayout { /* tab border-radius */ } }
body[gbb-bundle-design-preset-id="COMPACT"]    { .gbbMinimilisticLayout { /* single-column grid */ } }
body[gbb-bundle-design-preset-id="HORIZONTAL"] { .gbbMinimilisticLayout { /* 2-column product row */ } }
```

`COMPACT` and `HORIZONTAL` scope their overrides inside `.gbbMinimilisticLayout`. Since `gbbMinimilisticLayout` is **only applied when `bundleDesignTemplate === "FBP_SIDE_FOOTER"`**, all four presets must use `FBP_SIDE_FOOTER`. `STANDARD` has no CSS overrides — it is the default `.gbbMinimilisticLayout` appearance. `BUILD_FROM_SCRATCH_NEWPRODUCTCARD` is a legacy layout key (present in `DESIGN_TEMPLATE_CONFIGS` for backwards compatibility) not used by any current design preset.

**FPB widget `DESIGN_TEMPLATE_CONFIGS` constant** (from `easy-bundle-full-page-min.js`):

```javascript
const DESIGN_TEMPLATE_CONFIGS = {
  BUILD_FROM_SCRATCH_NEWPRODUCTCARD: { value: "gbbProductsCardLayoutV2" },
  FBP_SIDE_FOOTER:                   { value: "gbbMinimilisticLayout" }
};
```

**DOM rendering logic** (`insertWrapperIntoBody`):

```javascript
// 1. If bundleDesignTemplate is in DESIGN_TEMPLATE_CONFIGS, add CSS classes
if (bundleDesignTemplate in DESIGN_TEMPLATE_CONFIGS) {
  [DESIGN_TEMPLATE_CONFIGS[bundleDesignTemplate].value, "gbbProductsCardLayoutV2"]
    .forEach(cls => $(".gbbPageBody").addClass(cls));
  $(".gbbPageBody").attr("data-template-id", bundleDesignTemplate);
}

// 2. Apply bundleDesignPresetId as a body attribute (drives CSS for non-classic presets)
$("body").attr("gbb-bundle-design-preset-id", bundleDesignPresetId);
```

**Observed DOM for Classic Design (FBP_SIDE_FOOTER / CLASSIC):**

```html
<body gbb-bundle-design-preset-id="CLASSIC">
  <div class="gbbPageBody gbbMinimilisticLayout gbbProductsCardLayoutV2 bundle-2"
       data-template-id="FBP_SIDE_FOOTER"
       id="gbbBundle"
       ...>
```

For non-classic FPB designs, `body` still gets `gbb-bundle-design-preset-id` set to the preset value, and `gbbMinimilisticLayout` would NOT be added (only `gbbProductsCardLayoutV2`). CSS keyed on `[gbb-bundle-design-preset-id]` drives the visual differentiation.

**FPB template save mechanism**: The "Select template" overlay in the EB Admin does NOT fire a separate backend save request in the observable CDP network panel context. The `modifyBundleFields` call that fires when clicking "Next" only resets the `previewTemplateSelectionModalCnt` counter. The actual template save mechanism is confirmed to operate outside the main CDP context (likely via Shopify App Bridge cross-iframe postMessage). This was confirmed across multiple click attempts.

---

### PPB `displayVariantsAsIndividualProducts: true` DOM Rendering

**Setting:** When `displayVariantsAsIndividualProducts: true` is set on a PPB category, each variant of a multi-variant product is rendered as a completely independent product card.

**JS state representation**: The `state.categories[categoryId].allProducts` array is pre-flattened by the widget — each entry represents a single variant:

```json
// Multi-variant product (Yellow Sofa — 3 variants) becomes 3 separate entries:
[
  { "id": 8322634088644, "title": "Yellow Sofa", "variantCount": 1, "variantTitles": ["Yellow Sofa - 2 Seater"] },
  { "id": 8322634088644, "title": "Yellow Sofa", "variantCount": 1, "variantTitles": ["Yellow Sofa - 3 seater"] },
  { "id": 8322634088644, "title": "Yellow Sofa", "variantCount": 1, "variantTitles": ["Yellow Sofa - 4 seater"] }
]
```

Note: `id` is the **parent product ID** (same across all variants of the same product). `variantCount` is always `1` because the widget flattens into individual variant rows. The variant title becomes the card subtitle.

**DOM structure per variant card** (from live Category 2 snapshot on WPB Research PPB):

```html
<!-- Each variant = its own gbbMixCascadeProductWrapper -->
<div class="gbbMixCascadeProductWrapper"
     data-product-id="8322634088644"
     data-current-selected-variant-id="45038899691716"
     data-product-quantity="0"
     data-is-preorder="false">

  <div class="gbbMixCascadeProductLeftSection">
    <div class="gbbMixCascadeProductImageWrapper">
      <img class="gbbMixCascadeProductImage" src="..." />
    </div>
    <div class="gbbMixCascadeProductsDetailsWrapper">
      <div class="gbbMixCascadeProductTitle">Yellow Sofa</div>
      <div class="gbbMixCascadeProductsPriceWrapper">
        <div class="gbbMixCascadeProductsPrice">₹99.99</div>
        <div class="gbbMixCascadeProductCompareAtPrice">₹150</div>
      </div>
      <!-- Variant subtitle — unique per card, absent when displayVariantsAsIndividualProducts is false -->
      <div class="gbbMixCascadeCurrentVariantTitle">2 Seater</div>
    </div>
  </div>

  <div class="gbbMixCascadeProductRightSection">
    <div class="gbbMixCascadeProductBtnWrapper">
      <div class="gbbMixCascadeAddBtn" data-is-event-registered="REGISTERED">Add +</div>
    </div>
  </div>
</div>
```

**Key differentiators vs `displayVariantsAsIndividualProducts: false`**:

| Field | `true` | `false` |
|---|---|---|
| Cards per multi-variant product | One card **per variant** | One card **per product** |
| `data-product-id` | Parent product ID (repeated for each variant of the same product) | Parent product ID (unique per card) |
| `data-current-selected-variant-id` | Variant-specific ID | Either default variant or user-selected variant |
| `gbbMixCascadeCurrentVariantTitle` | Present — shows variant title | Absent |
| Variant selector | None (no dropdown/swatches) | Likely present (not observed — no multi-variant products with `false` in test data) |

**Observed example: Yellow Sofa (3 variants) in Category 2:**

| Card | `data-product-id` | `data-current-selected-variant-id` | Variant subtitle |
|---|---|---|---|
| Card 1 | `8322634088644` | `45038899691716` | "2 Seater" |
| Card 2 | `8322634088644` | `45038899724484` | "3 seater" |
| Card 3 | `8322634088644` | `45038899757252` | "4 seater" |

---

## Phase 5 — PPB Template Rendering Architecture (Static Analysis)

**Method:** `curl` + Python grep on `easy-bundle-product-page-min.js` (518,931 bytes, Shopify CDN) and `easy-bundle-min.css` (7,609 bytes, Shopify CDN). Same technique used to confirm FPB template architecture in Phase 4.

### PPB Template Dispatch (Binary Split)

The widget makes a single binary dispatch based on `bundleDesignTemplate`:

```javascript
"PDP_INPAGE" === gbbMix.state.template.type
  ? gbbMix.templates.CASCADE.init(t)           // Product List / Product Grid
  : gbbMix.gbbMixAndMatchBundle.initialize(t, e) // Horizontal Slots / Vertical Slots
```

- **`PDP_INPAGE`** → dedicated cascade template system (`gbbMix.templates.CASCADE`)
- **`PDP_MODAL`** → base mix-and-match bundle renderer (`gbbMix.gbbMixAndMatchBundle`)

### PPB Body Attribute Assignment

Template state is written to body attributes immediately after bundle data loads:

```javascript
gbbMix.state.template = {
  id:   a?.bundleDesignTemplateData?.templateId ?? "MODAL",
  type: a.bundleDesignTemplate ?? "PDP_MODAL"
};
document.body.setAttribute("gbbmix-template-id",   gbbMix.state.template.id);
document.body.setAttribute("gbbmix-template-type",  gbbMix.state.template.type);
gbbMix.gbbMixAndMatchBundle.f.setPageAttributes({
  "template-id":   gbbMix.state.template.id,
  "template-type": gbbMix.state.template.type
});
```

Default fallbacks: `id: "MODAL"`, `type: "PDP_MODAL"`.

### PPB Template Objects in Widget JS

`gbbMix.templates` only defines two named objects:

| Template object | Presence | Role |
|---|---|---|
| `gbbMix.templates.CASCADE` | Full object — state, init, initialise, f, registerCustomEvents, insertIntoDOM | Drives both Product List and Product Grid rendering via PDP_INPAGE path |
| `gbbMix.templates.COGNIVE` | Lightweight override — single `reArrangeBodyWrapperPosition` function | Repositions `.gbbMixCascadeBodyWrapper` after the selected step for grid layout |
| `gbbMix.templates.MODAL` | **Not present** — handled directly by `gbbMix.gbbMixAndMatchBundle` | — |
| `gbbMix.templates.SIMPLIFIED` | **Not present** — `SIMPLIFIED` has zero occurrences in widget JS | — |

**COGNIVE rendering**: Uses the same `CASCADE` rendering path. `reArrangeBodyWrapperPosition` runs on step selection to move `.gbbMixCascadeBodyWrapper` after the currently selected `.gbbMixCascadeStep`, creating an in-page expanded grid view rather than a top-level list.

```javascript
// COGNIVE reArrangeBodyWrapperPosition (from gbbMix.templates.COGNIVE.f):
if ("COGNIVE" !== gbbMix.state.template.id || !hasMultipleSteps) return;
const stepEl = stepsWrapper.querySelector(`.gbbMixCascadeStep[data-step-id='${currentStepId}']`);
stepEl?.after(bodyWrapper);
gbbMix.utility.rerunAnimation(bodyWrapper, "gbbMixSlide");
```

### Horizontal Slots vs Vertical Slots (MODAL vs SIMPLIFIED)

Both use `PDP_MODAL` and `gbbMix.gbbMixAndMatchBundle`. The visual difference is NOT driven by `templateId` in the widget — instead it is driven by the `renderFilledSlotsAsHorizontalStacked` bundle setting:

```javascript
getSelectedProductsViewType: function() {
  // Bundle-level override takes precedence over page customization setting
  const bundleLevel = gbbMix.settings.mixAndMatchBundleData.renderFilledSlotsAsHorizontalStacked;
  const pageLevel   = gbbMix.settings.pageCustomizationSettings
                        .mixAndMatchBundleSettings.renderFilledSlotsAsHorizontalStacked;
  return (bundleLevel ?? pageLevel) ? "HORIZONTALLY_STACKED" : "VERTICALLY_STACKED";
}
```

The result is stored in `gbbMix.gbbMixAndMatchBundle.state.selectedProductsViewState` and applied as a CSS class:

```javascript
// In prepareIndividualCategorySelectionUI:
"HORIZONTALLY_STACKED" === selectedProductsViewState
  ? categoriesWrapper.classList.add("gbbMixProductPageCategoriesWrapperHStacked")
  : categoriesWrapper.classList.add("gbbMixProductPageCategoriesWrapperVStacked");
```

**Key implication**: `templateId: "SIMPLIFIED"` is an admin-side enum value only. The widget JS does not reference `SIMPLIFIED` at all (0 occurrences). The storefront rendering difference between "Horizontal Slots" and "Vertical Slots" is fully determined by `renderFilledSlotsAsHorizontalStacked`, not by `gbbmix-template-id`.

### PPB CSS Architecture

`easy-bundle-min.css` (7,609 bytes) contains only cart/upsell shared styles (`gbbRemoveCartItemConfirmation*`, `gbbCartPage*`, `gbbExtBundle*`, `gbbOfferWidget*`). It has **zero** template-specific selectors — no `[gbbmix-template-id]`, no `[gbbmix-template-type]`, no template class names.

Template visual differentiation in PPB is driven entirely by JS-applied CSS classes:
- `gbbMixProductPageCategoriesWrapperHStacked` — horizontal filled-slots layout
- `gbbMixProductPageCategoriesWrapperVStacked` — vertical filled-slots layout
- `gbbMixCascadeStepsWrapper` / `gbbMixCascadeBodyWrapper` — PDP_INPAGE cascade layout

This contrasts with FPB, which uses body attribute selectors (`body[gbb-bundle-design-preset-id="COMPACT"]`) in its CSS for preset differentiation.

### PPB Template Architecture Summary

| Display Name | `bundleDesignTemplate` | `templateId` | Dispatch path | Visual key |
|---|---|---|---|---|
| Product List | `PDP_INPAGE` | `CASCADE` | `gbbMix.templates.CASCADE.init()` | Flat step list, cascade body |
| Product Grid | `PDP_INPAGE` | `COGNIVE` | `gbbMix.templates.CASCADE.init()` + COGNIVE override | Body repositioned after selected step |
| Horizontal Slots | `PDP_MODAL` | `MODAL` | `gbbMix.gbbMixAndMatchBundle.initialize()` | `renderFilledSlotsAsHorizontalStacked: true` → `gbbMixProductPageCategoriesWrapperHStacked` |
| Vertical Slots | `PDP_MODAL` | `SIMPLIFIED` | `gbbMix.gbbMixAndMatchBundle.initialize()` | `renderFilledSlotsAsHorizontalStacked: false` → `gbbMixProductPageCategoriesWrapperVStacked` |

---

## Phase 6 — FPB Template CSS (Static Analysis)

**Source:** `easy-bundle-full-page-min.css` (250,382 bytes, CloudFront CDN: `https://d1712zxri13o2p.cloudfront.net/full-page-bundle/production/active/easy-bundle-full-page-min.css`)

**Method:** `curl` + Python brace-counting extraction of each full rule block.

FPB CSS uses nested CSS (CSS Nesting Level 3). All template preset rules scope their overrides inside `.gbbMinimilisticLayout`, confirming that `bundleDesignTemplate = "FBP_SIDE_FOOTER"` (which adds that class) is required for all four presets. CSS custom properties (DCP variables) use the `--gbb-*` namespace.

### STANDARD Design — base `.gbbMinimilisticLayout`

**No `body[gbb-bundle-design-preset-id]` override.** STANDARD is the default layout: cards render in a vertical grid, footer is a sticky sidebar, and category tabs are plain underlined text links. All other presets override ON TOP of this base.

Key base layout rules:

```css
.gbbMinimilisticLayout {
  max-width: 1536px;
  margin: 0 auto;

  /* Product card grid */
  .gbbProductItem {
    gap: 8px;
    border-radius: var(--gbb-side-footer-corner-border-radius);
    border: none;
    outline: 2px solid #f1f2f3;
    grid-template-rows: 3fr 0.5fr 0.5fr;   /* image : text : action */
  }

  .gbbProductActionContainer {
    grid-template-columns: 0.6fr .4fr;
    grid-template-rows: 1fr;
  }

  /* Category nav: plain tab underline, not pill */
  .gbbCategoryTabContainer {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 5px;
    align-items: center;
    cursor: pointer;
    padding: 10px;
  }
  .gbbCategoryTabContainer[data-is-active="true"] {
    border-bottom: 2px solid var(--gbb-category-tab-active-text-color);
  }

  /* Desktop: sidebar footer + 3-col product grid */
  .gbbMultipleCategoryBodyContainer {
    display: grid;
    grid-template-columns: 1fr .45fr;
    gap: 15px;
  }

  /* Box selection: 3 cols by default, 2 cols for 2 or 4 rules */
  .gbbBoxSelectionWrapper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    text-align: center;
  }
  .gbbBoxSelectionWrapper[data-total-rules="2"],
  .gbbBoxSelectionWrapper[data-total-rules="4"] { grid-template-columns: repeat(2, 1fr); }
  .gbbBoxSelectionWrapper[data-total-rules="1"] { grid-template-columns: repeat(1, 1fr); }

  /* Footer: sticky right panel on desktop */
  @media (min-width: 800px) {
    .gbbPageFooterHTML {
      width: 100%;
      height: fit-content;
      padding: 20px;
      border-radius: var(--gbb-side-footer-corner-border-radius);
      position: sticky;
      top: 10%;
      border: 1px solid #E3E3E3;
    }
    .gbbProductsItemsContainer { grid-template-columns: repeat(3, 1fr); }
  }

  /* 3-col on 1192px+, 2-col on 800–1024px, 3-col on 1192px+ */
  @media (min-width: 1192px) { .gbbProductsItemsContainer { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 800px) and (max-width: 1024px) {
    .gbbProductsItemsContainer { grid-template-columns: repeat(2, 1fr); }
    .gbbMultipleCategoryBodyContainer { grid-template-columns: 1fr .7fr; }
  }
  @media (max-width: 768px) { .gbbMultipleCategoryBodyContainer { grid-template-columns: 1fr; } }
}
```

---

### CLASSIC Design

**Selector:** `body[gbb-bundle-design-preset-id="CLASSIC"] { .gbbMinimilisticLayout { … } }`

Key differences vs STANDARD: category tabs are pill-shaped with border-radius 99px; inactive tabs use `--gbb-tab-inactive-bg-color`; footer slot thumbnails are 80×80px; product grid switches to 4-col on desktop; box selection has a border and rounded corners.

```css
body[gbb-bundle-design-preset-id="CLASSIC"] {
  .gbbMinimilisticLayout {
    /* Category tabs: pill shape */
    .gbbCategoryTabContainer {
      border: 2px solid var(--gbb-category-tab-active-text-color);
      border-radius: 99px;
      grid-template-columns: 1fr;
      padding: 4px 22px;
      background-color: var(--gbb-tab-inactive-bg-color);
    }
    .gbbCategoryTabContainer .gbbCategoryTabTitle { color: var(--gbb-tab-inactive-text-color); }
    .gbbCategoryTabContainer[data-is-active="true"] {
      background-color: var(--gbb-tab-active-bg-color);
    }
    .gbbCategoryTabContainer[data-is-active="true"] .gbbCategoryTabTitle {
      color: var(--gbb-tab-active-text-color);
    }
    .gbbMultipleCategoryTabsContainer { gap: 8px; }

    /* Remove borders from structural sections */
    .gbbMultipleCategoryHeaderContainer,
    .gbbProductTitleOnly,
    .gbbPageFooterHTML,
    .gbbSlotFooterProductImageContainer { border: none; }

    /* Product title: centered */
    .gbbProductTitleOnly { text-align: center; }
    .gbbProductATCWithContentWrapper .gbbProductItemPricesContainer { place-content: center; }

    /* Slot footer: empty slot dashed border */
    .gbbSlotFooterProductContainerEmpty {
      background-color: transparent;
      border-radius: 0px;
      color: var(--gbb-cart-footer-next-button-color);
      border: 2px dashed;
    }
    .gbbSlotFooterProductImageContainer { height: 80px; }

    /* Box selection: bordered rounded container */
    .gbbBoxSelectionWrapper {
      padding: 8px;
      border: 2px solid var(--gbb-box-selection-active-bg-color);
      border-radius: var(--gbb-product-card-border-radius);
    }

    .gbbSlotFooterProductQuantity {
      background: var(--gbb-cart-footer-next-button-color);
      color: var(--gbb-cart-footer-next-button-text-color);
    }

    @media (min-width: 769px) {
      .gbbMultipleCategoryTabsContainer { justify-content: center; }
      .gbbMultipleCategoryBody, .gbbPersonalizePageHTML { max-width: 95%; }
      /* 4-col product grid on desktop */
      .gbbProductsItemsContainer { grid-template-columns: repeat(4, 1fr); }
      .gbbSlotFooterProductsContainer {
        grid-template-columns: repeat(auto-fit, minmax(80px, 80px));
      }
      .gbbSlotFooterProductContainer { height: 80px; width: 80px; }
    }
    @media (max-width: 768px) {
      .gbbCategoryTabContainer { padding: 4px 14px; }
    }
  }
}
```

---

### COMPACT Design

**Selector:** `body[gbb-bundle-design-preset-id="COMPACT"] { .gbbMinimilisticLayout { … } }`

Key differences vs STANDARD: tabs use an inverted color scheme (active BG color as inactive BG, active text as inactive text); box selection tiers are pill-shaped with a "subtext badge" pinned to the top-right; desktop layout switches to a 60/40 content/sidebar split; slot thumbnails are larger (120×120px with 20px border-radius).

```css
body[gbb-bundle-design-preset-id="COMPACT"] {
  .gbbMinimilisticLayout {
    /* Category tabs: inverted pills */
    .gbbCategoryTabContainer {
      border: 2px solid var(--gbb-tab-active-bg-color);
      grid-template-columns: 1fr;
      padding: 4px 22px;
      background-color: var(--gbb-tab-active-text-color); /* inverted: active text color as bg */
      border-radius: 99px;
    }
    .gbbCategoryTabContainer .gbbCategoryTabTitle { color: var(--gbb-tab-active-bg-color); }
    .gbbCategoryTabContainer[data-is-active="true"] {
      background-color: var(--gbb-tab-active-bg-color);
    }
    .gbbCategoryTabContainer[data-is-active="true"] .gbbCategoryTabTitle {
      color: var(--gbb-tab-active-text-color);
    }
    .gbbMultipleCategoryTabsContainer { gap: 8px; }

    .gbbMultipleCategoryHeaderContainer,
    .gbbProductTitleOnly,
    .gbbPageFooterHTML,
    .gbbSlotFooterProductImageContainer { border: none; }

    /* Box selection: outlined pill tiers */
    .gbbBoxSelectionWrapper { padding: 8px; }
    .gbbBoxSelectionItem,
    .gbbBoxSelectionItem.gbbBoxSelectionItemActive { outline: none; border: 2px solid; }
    .gbbBoxSelectionItem {
      padding: 10px 0px;
      position: relative;
      background-color: var(--gbb-box-selection-active-text-color);
      color: var(--gbb-box-selection-active-bg-color);
    }
    .gbbBoxSelectionItem.gbbBoxSelectionItemActive {
      background-color: var(--gbb-box-selection-active-bg-color);
      color: var(--gbb-box-selection-active-text-color);
    }
    /* Subtext badge: pinned top-right */
    .gbbBoxSelectionSubtext {
      position: absolute;
      top: 80%;
      right: 0px;
      padding: 4px 12px;
      border-radius: 99px;
      border: 1px solid var(--gbb-box-selection-active-bg-color);
      font-size: 10px;
      color: var(--gbb-box-selection-active-bg-color);
      background: var(--gbb-box-selection-active-text-color);
    }

    .gbbSlotFooterProductContainerEmpty {
      background-color: transparent;
      border: 2px dashed var(--gbb-cart-footer-next-button-color);
    }

    @media (min-width: 769px) {
      /* 60/40 body split */
      .gbbMultipleCategoryBodyContainer, .gbbPersonalizePageBodyWrapper {
        grid-template-columns: .6fr .4fr;
        gap: 30px;
      }
      /* Large slot thumbnails */
      .gbbSlotFooterProductsContainer {
        grid-template-columns: repeat(auto-fit, minmax(120px, 120px));
      }
      .gbbSlotFooterProductImageContainer,
      .gbbSlotFooterProductContainer { height: 120px; width: 120px; border-radius: 20px; }
      .gbbBoxSelectionItem { padding: 12px 24px; }
      .gbbBoxSelectionWrapper[data-total-rules="4"] { grid-template-columns: repeat(4, 1fr); }
    }
  }
}
```

---

### HORIZONTAL Design

**Selector:** `body[gbb-bundle-design-preset-id="HORIZONTAL"] { .gbbMinimilisticLayout { … } }`

Key differences vs STANDARD: each product card uses a horizontal 2-column layout (image left spanning full height, text/action stacked on the right); desktop product grid drops to 2-col; footer action area switches to 1-col stacked; no pill tabs (inherits STANDARD underline style).

```css
body[gbb-bundle-design-preset-id="HORIZONTAL"] {
  .gbbMinimilisticLayout {
    /* Product card: image left, content right */
    .gbbProductItem {
      grid-template-columns: .3fr .7fr;
      grid-template-rows: .2fr auto .2fr;
    }
    .gbbProductImageContainer {
      grid-column: 1;
      grid-row: 1 / span 3;             /* image spans all 3 rows */
    }
    .gbbProductTextContainer  { grid-column: 2; grid-row: 1; align-self: start; }
    .gbbProductDynamicContentContainer { grid-column: 2; grid-row: 2; }
    .gbbProductActionContainer { grid-column: 2; grid-row: 3; }

    .gbbProductImageContainerImg,
    .gbbProductImageContainer { min-height: 140px; max-height: 140px; }
    .gbbProductImageContainer img { object-fit: contain !important; }

    /* With variant dropdown: add a 4th row */
    .gbbProductItem:has(.gbbVariantDropdownWrapper) {
      grid-template-rows: .2fr auto .2fr .2fr;
      .gbbProductImageContainer { grid-row: 1 / span 4; }
      .gbbVariantDropdownWrapper { grid-column: 2; grid-row: 3; align-self: end; }
      .gbbProductActionContainer { grid-row: 4; }
    }

    /* Footer: list rows separated by horizontal lines */
    .gbbFooterProductsContainer {
      gap: 0px;
      grid-template-rows: max-content;
    }
    .gbbFooterProductsContainer > * {
      padding: 10px 0px;
      border-bottom: 1px solid #E3E3E3;
    }

    /* Slot thumbnails: 90×90px */
    .gbbSlotFooterProductsContainer {
      grid-template-columns: repeat(auto-fit, minmax(90px, 90px));
    }
    .gbbSlotFooterProductImageContainer,
    .gbbSlotFooterProductContainer { height: 90px; width: 90px; }

    .gbbFooterActionContainer {
      grid-template-columns: 1fr;   /* stacked, not side-by-side */
      row-gap: 15px;
    }
    .gbbFooterTotalValueContainer { justify-self: end; }

    .gbbSlotFooterProductContainerEmpty {
      background-color: transparent;
      border: 2px dashed var(--gbb-cart-footer-next-button-color);
    }

    /* Desktop: 65/35 body split, 2-col product grid */
    @media (min-width: 769px) {
      .gbbMultipleCategoryBodyContainer, .gbbPersonalizePageBodyWrapper {
        grid-template-columns: .65fr .35fr;
      }
      .gbbFooterTotalContainer { grid-template-columns: 1fr 1fr; }
      .gbbProductsItemsContainer { grid-template-columns: repeat(2, 1fr); }
    }

    /* Mobile: 1-col product list, shorter image */
    @media (max-width: 768px) {
      .gbbProductsItemsContainer { grid-template-columns: 1fr; }
      .gbbProductImageContainerImg,
      .gbbProductImageContainer { min-height: 120px; max-height: 120px; }
    }
  }
}
```

---

## Phase 7 — PPB Template CSS (Static Analysis)

**Source:** `mixAndMatchBundle.css` (131,220 bytes, CloudFront CDN: `https://d1712zxri13o2p.cloudfront.net/product-page-bundle/production/active/mixAndMatchBundle.css`)

**Method:** `curl` + Python brace-counting extraction. This file is the primary PPB stylesheet — `easy-bundle-min.css` (7,609 bytes) only contains shared cart/upsell styles and has zero template-specific selectors.

PPB CSS uses two scoping mechanisms:
1. `body[gbbmix-template-id="COGNIVE"|"SIMPLIFIED"]` — template-specific rule blocks
2. `body[gbb-mix-consolidated-design="true"]` — the "consolidated design" token mapping that bridges DCP variables to widget-internal CSS custom properties

CASCADE (Product List) and MODAL (Horizontal Slots) have NO `body[gbbmix-template-id]` override blocks — they render using the base stylesheet without scoped overrides.

---

### CSS Custom Properties — PPB `:root` Defaults

PPB defines defaults for all DCP-facing variables at `:root`. Merchants override these through DCP settings.

```css
:root {
  /* Product card */
  --product-card-bg-color: #FFFFFF;
  --product-card-border-radius: 12px;
  --product-card-image-border-radius: 5px;
  --product-card-image-fit: cover;
  --product-card-title-color: #1E1E1E;
  --product-card-title-font: 16px;
  --product-card-title-weight: 600;
  --product-card-price-color: #000000;
  --product-card-button-bg-color: #000000;
  --product-card-button-text-color: #FFFFFF;
  --product-card-button-border-radius: 5px;
  --product-card-quantity-border-radius: 6px;
  --product-card-variant-selector-font-size: 12px;

  /* Category tabs */
  --tabs-active-bg-color: #1E1E1E;
  --tabs-active-text-color: #FFFFFF;
  --tabs-inactive-bg-color: #F4F9F9;
  --tabs-inactive-text-color: #1E1E1E;
  --tabs-border-radius: 8px;

  /* Footer */
  --footer-bg-color: #1E1E1ECC;
  --footer-final-price-color: #000;
  --footer-next-btn-bg-color: #FFF;
  --footer-next-btn-text-color: #000;
  --footer-buttons-border-radius: 10px;

  /* Empty state slot card */
  --empty-state-card-bg-color: #FFFFFF;
  --empty-state-card-border-color: #000;
  --empty-state-card-border-style: dashed;
  --empty-state-card-text-color: #3e3e3e;

  /* Cart drawer */
  --drawer-bg-color: #F4F9F9;
  --drawer-border-radius: 15px 15px 0 0;

  /* Discount progress bar */
  --footer-discount-progress-bar-empty-color: #C1E7C5;
  --footer-discount-progress-bar-filled-color: #15A524;

  /* CASCADE-specific */
  --cascade-product-card-btn-radius: 100px;
  --cascade-product-card-image-border-radius: 6px;
  --cascade-atc-button-border-radius: 6px;
  --cascade-atc-button-font-size: 18px;
  --cascade-footer-bg-color: transparent;
  --cascade-footer-bg-color-mobile: #ffffff;
  --cascade-box-active-border-color: var(--product-card-button-bg-color);
  --cascade-box-inactive-border-color: #e9e9e9;
  --cascade-box-inactive-bg-color: #fff;
  --cascade-box-active-discount-text-color: #00b67a;
}
```

---

### Consolidated Design Token Bridge

When `body[gbb-mix-consolidated-design="true"]` is set (all current EB bundles use this), EB maps DCP variables to widget-internal CSS properties:

```css
body[gbb-mix-consolidated-design="true"] {
  /* Color tokens */
  --gbbMix-primary-color: var(--add-bundle-btn-bg-color);
  --gbbMix-primary-button-text-color: var(--add-bundle-btn-text-color);
  --gbbMix-primary-text-color: var(--product-card-price-color);
  --gbbMix-secondary-color: var(--tabs-inactive-bg-color);
  --gbbMix-cart-text-color: var(--footer-text-color);
  --gbbMix-cart-bg-color: var(--footer-bg-color);

  /* Corner tokens */
  --gbbMix-button-border-radius: var(--add-bundle-btn-border-radius);
  --gbbMix-card-border-radius: var(--product-card-border-radius);
  --gbbMix-card-image-border-radius: var(--product-card-image-border-radius);

  /* Typography tokens */
  --gbbMix-primary-font-size: var(--product-card-title-font, 16px);
  --gbbMix-primary-font-weight: var(--product-card-title-weight);
  --gbbMix-secondary-font-size: var(--header-discount-text-font, 14px);
  --gbbMix-body-font-size: var(--product-card-variant-selector-font-size, 14px);
  --gbbMix-image-fit: var(--product-card-image-fit);
}

/* PDP_INPAGE reduces font sizes by 2px (smaller in-page variant) */
body[gbb-mix-consolidated-design="true"][gbbmix-template-type="PDP_INPAGE"] {
  --gbbMix-primary-font-size: calc(var(--product-card-title-font, 16px) - 2px);
  --gbbMix-secondary-font-size: calc(var(--header-discount-text-font, 14px) - 2px);
  --gbbMix-body-font-size: calc(var(--product-card-variant-selector-font-size, 14px) - 2px);
}
```

---

### CASCADE (Product List) — base layout, no template-id overrides

`body[gbbmix-template-id="CASCADE"]` has **no rule block** in the CSS. CASCADE is the default `PDP_INPAGE` rendering — all base `.gbbMixCascade*` CSS applies without scoped overrides. The widget renders a vertical product list within each category, with a side cart drawer on desktop.

---

### COGNIVE (Product Grid)

**Selector:** `body[gbbmix-template-id="COGNIVE"] { … }`

Key differences vs CASCADE: categories render vertically instead of as horizontal tabs; product cards switch to a 3-col grid layout (2-col on mobile); images fill a 1:1 aspect ratio; text is centered; body wrapper is repositioned after selected step (driven by JS `reArrangeBodyWrapperPosition`).

```css
body[gbbmix-template-id="COGNIVE"] {
  /* Category nav: vertical stack instead of horizontal tabs */
  .gbbMixCascadeStepsWrapper { padding-bottom: 20px; }
  .gbbMixCascadeStepsWrapper .gbbMixCascadeStepsContainer { display: flex; }
  .gbbMixCascadeStepsContainer {
    flex-direction: column;
    flex-wrap: nowrap;
    height: auto !important;
    align-items: flex-start;
  }
  .gbbMixCascadeStepsDivider { display: none; }
  .gbbMixCascadeStep {
    width: 100%;
    border-bottom: 1px solid var(--gbbMix-primary-color, #000);
    padding-bottom: 15px;
  }

  /* Product card: stacked column, centered */
  .gbbMixCascadeProductWrapper {
    grid-template-columns: 1fr;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  .gbbMixCascadeProductLeftSection {
    grid-template-columns: 1fr;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
  }
  .gbbMixCascadeProductRightSection {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  /* Product grid: 3 columns desktop, 2 columns mobile */
  .gbbMixCascadeProductsWrapper {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 15px;
    padding-inline: 8px;
  }
  .gbbMixCascadeProductImageWrapper {
    width: 100%;
    height: 100%;
    object-fit: var(--gbbMix-image-fit, "cover");
    aspect-ratio: 1/1;
  }

  /* Centered text */
  .gbbMixCascadeProductTitle {
    text-align: center !important;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-all;
    white-space: wrap;
  }
  .gbbMixCascadeCurrentVariantTitle {
    white-space: wrap;
    text-align: center;
    word-wrap: break-word;
  }
  .gbbMixCascadeProductsPriceWrapper {
    word-wrap: break-word;
    justify-content: center;
  }

  /* Full-width action buttons */
  .gbbMixCascadeProductBtnWrapper, .gbbMixCascadeAddBtn,
  .gbbMixCascadeQuantityWrapper, .gbbMixCascadeVariantSelectionWrapper,
  .gbbMixCascadeVariantSelectionWrapper select { width: 100%; }

  /* Body wrapper: inserted after selected step by JS */
  .gbbMixCascadeBodyWrapper { margin-top: 0px; width: 100%; }

  /* Category tabs: horizontal flex (not grid tabs) */
  .gbbMixCascadeCategoryTabsWrapper {
    grid-template-columns: repeat(auto);
    display: flex;
  }
  .gbbMixCascadeCategoryTab { padding: 8px 10px; }

  @media only screen and (max-width: 768px) {
    .gbbMixCogniveProductsWrapper { grid-template-columns: 1fr 1fr; }
  }
}
```

---

### MODAL (Horizontal Slots) — base layout, no template-id overrides

`body[gbbmix-template-id="MODAL"]` has **no rule block** in the CSS. MODAL is the default `PDP_MODAL` rendering. The slot layout is controlled by the class applied to `.gbbMixProductPageCategoriesWrapper`:

```css
.gbbMixProductPageCategoriesWrapper {
  width: 100%;
  display: grid;
}

/* Horizontal Slots: categories laid out side by side (3-col selected product grid) */
.gbbMixProductPageCategoriesWrapperHStacked {
  grid-template-columns: 1fr;
  column-gap: 16px;
  row-gap: 20px;
}
.gbbMixProductPageCategoriesWrapperHStacked
  .gbbMixProductPageCategoryWrapper
  .gbbMixProductPageCategoryTitle {
  font-size: var(--exp-category-card-hstack-title-font-size);
  line-height: 16px;
}
.gbbMixProductPageCategoriesWrapperHStacked
  .gbbMixProductPageCategoryWrapper
  .gbbMixProductPageCategorySelectedProductsWrapper,
.gbbMixProductsHorizontalLayout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* Each category column: subgrid rows for title + slot grid alignment */
.gbbMixProductPageCategoriesWrapper .gbbMixProductPageCategoryWrapper {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: subgrid;
  grid-row: span 2;
  gap: 10px;
}
```

---

### SIMPLIFIED (Vertical Slots)

**Selector:** `body[gbbmix-template-id="SIMPLIFIED"] { … }`

Key differences vs MODAL: selected product slots render in a single vertical column (`grid-template-columns: 1fr`); each selected product card is a compact horizontal row (image left 50×50px, title+variant+remove right); empty slot cards are short rows (min-height 60px) with icon and text side-by-side; skeleton loading cards are also 1-col.

```css
/* Vertical Slots slot grid: 1 column */
.gbbMixProductPageCategoriesWrapperVStacked {
  grid-template-columns: 1fr;
  gap: 26px;
}
.gbbMixProductPageCategoriesWrapperVStacked
  .gbbMixProductPageCategoryWrapper
  .gbbMixProductPageCategorySelectedProductsWrapper {
  display: grid;
  grid-template-columns: 1fr;    /* 1 slot per row */
}

body[gbbmix-template-id="SIMPLIFIED"] {
  /* Empty state card: short horizontal row */
  .gbbMixEmptyStateCardWrapper { grid-template-columns: 1fr; }
  .gbbMixEmptyStateCard .gbbMixEmptyStatCardAndTextWrapper {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 10px;
    flex-direction: row-reverse;   /* icon on right, text on left */
  }
  .gbbMixEmptyStateCard { min-height: 60px; }

  /* Selected product card: compact horizontal row */
  .gbbMixSelectedProductCard {
    min-height: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .gbbMixSelectedProductCard .gbbMixSelectedProductCardTitleAndVariantTitleWrapper {
    text-align: left;
    width: 100%;
  }
  .gbbMixSelectedProductCard .gbbMixSelectedProductCardImageWrapper {
    min-width: 50px;
    width: 50px;
    height: 50px;
  }
  /* Remove button inline (not absolute-positioned) */
  .gbbMixSelectedProductCard .gbbMixProductPageCategorySelectedPrtoductIconWrapper {
    position: static;
    order: 5;
  }
  /* Discount badge inline */
  .gbbMixSelectedProductCard .gbbMixSelectedProductCardDiscountBadge {
    position: static;
    white-space: nowrap;
  }

  /* Loading skeleton: 1-col rows */
  .gbbMixSkeletonsCardWrapper { grid-template-columns: 1fr; }
  .gbbMixSkeletonsCardWrapper .gbbMixSkeletonWrapper { height: 60px; }

  @media (max-width: 768px) {
    .gbbMixProductPageCategoriesWrapper .gbbMixProductPageCategoryWrapper
      .gbbMixProductPageCategorySelectedProductsWrapper .gbbMixEmptyStateCard { min-height: 60px; }
    .gbbMixProductPageCategoriesWrapper .gbbMixProductPageCategoryWrapper
      .gbbMixProductPageCategorySelectedProductsWrapper .gbbMixSelectedProductCard { min-height: 60px; }
  }
}
```

---

## Confirmed Gaps — Features Without Captured Evidence

This section records features that exist in EB but were not observable during the investigation. **No WPB implementation should be built from assumptions for these items.** Each gap requires either a new capture session or an explicit design decision before implementation.

### Gap 1 — Multi-step FPB Cart Add Payload (unconfirmed)

**What's known:** Single-step FPB cart add sends all selected component items in one `POST /cart/add.js` (JSON) call with `_easyBundle:OfferId: "FBP-{bundleId}_{sessionKey}_{itemIndex}"` per line.

**What's unknown:** For a multi-step FPB bundle (multiple `productsDataN` steps), the cart accumulation pattern is unconfirmed:
- Are items from all steps sent in a single `POST /cart/add.js` call (most likely), or does each step trigger a separate call?
- Does `_boxProduct` item property change per step (it was `"addProductsPage1"` in the single-step capture)?
- Does the `bundle_details` cart metafield shape change for multi-step?

**To confirm:** Create a 2-step FPB on `yash-wolfpack`, add products on both steps, click Add To Cart, and capture the `/cart/add.js` network payload.

---

### Gap 2 — FPB Box Selection Enforcement Logic (JS, unconfirmed)

**What's known:** `boxSelection.rules[].boxQuantity` sets the target quantity for each tier. `boxSelection.isEnabled: false` disables quantity enforcement. CSS rules for `gbbBoxSelectionItem`, `gbbBoxSelectionItemActive`, and `gbbBoxSelectionItemActive` are captured.

**What's unknown:** How the widget enforces box quantity in the storefront:
- What disables the "Next" / "Add to Cart" button (CSS class added to `gbbFooterNextButton`? `disabled` attribute? `pointer-events: none`?)?
- What triggers the condition toast (`gbbConditionNotificationToast` / `gbbConditionNotificationActive`)?
- How `currSelectedBoxQuantity` in `gbbMix.templates.CASCADE.state` is tracked and compared to `boxQuantity`.
- Whether incomplete box selection blocks per-step or per-bundle.

**To confirm:** Enable `boxSelection` on a test FPB or PPB, add fewer products than required, and inspect the ATC button state + JS state + toast behavior via Chrome DevTools.

---

### Gap 3 — FPB Storefront Config Runtime Shape (unconfirmed)

**What's known:** `window.easybundles_ext_data.bundleLinkData` carries FPB bundle config inline in the proxy page document. The admin-side save shape is fully documented.

**What's unknown:** The exact server-serialized shape of `bundleLinkData[].stepsConfigurationData` at runtime — whether EB's server denormalizes product GIDs into inline product objects (pre-hydrated) or only includes IDs and lets the widget call Storefront API separately. The live storefront was not captured for `stepsConfigurationData` specifically.

**To confirm:** On `yash-wolfpack`, load a FPB bundle page, run `JSON.stringify(window.easybundles_ext_data.bundleLinkData[0], null, 2)` in DevTools and record the full output (omit token fields).

---

### Gap 4 — PPB COGNIVE Live DOM (unconfirmed)

**What's known:** CSS rules (`body[gbbmix-template-id="COGNIVE"]`) and JS `reArrangeBodyWrapperPosition` function are both fully captured. The grid layout (3-col desktop, 2-col mobile) and vertical step stacking are confirmed from CSS.

**What's unknown:** Live DOM structure when COGNIVE is rendered — what the step containers look like, how `.gbbMixCascadeBodyWrapper` appears after step selection, and what `gbbMixCogniveProductsWrapper` renders.

**To confirm:** Change `WPB Research Product Page Bundle 2026-05-22` template to "Product Grid" in EB admin, load the storefront, take a DOM snapshot.

---

### Gap 5 — PPB MODAL and SIMPLIFIED Live DOM (unconfirmed)

**What's known:** CSS rules for `gbbMixProductPageCategoriesWrapperHStacked` (MODAL) and `body[gbbmix-template-id="SIMPLIFIED"]` + `gbbMixProductPageCategoriesWrapperVStacked` are captured. The `rearrangeCategoriesToHorizontalLayout` JS function is documented.

**What's unknown:** Live DOM for either the MODAL (Horizontal Slots) or SIMPLIFIED (Vertical Slots) templates — specifically what `gbbMixProductPageCategoryWrapper`, `gbbMixSelectedProductCard`, and `gbbMixEmptyStateCard` look like in context.

**To confirm:** Load `WPB Research Product Page Bundle 2026-05-22` with template set to "Horizontal Slots" or "Vertical Slots" and capture `take_snapshot()`.

---

### Gap 6 — PPB `useSingleStepCategoriesAsBundleSteps: true` (unconfirmed)

**What's known:** The flag exists in PPB creation and update payloads (observed as `false` in all captures). The `gbbMixAndMatchBundle.state.useSingleStepCategoriesAsBundleSteps` JS field exists.

**What's unknown:** What changes in the storefront rendering when `true` — whether step navigation appears, how categories map to steps, what the admin UI looks like in this mode.

**To confirm:** Create or modify a PPB bundle with `useSingleStepCategoriesAsBundleSteps: true` and capture both admin and storefront behavior.

---

### Gap 7 — FPB `productsData2` Storefront Shape (unconfirmed)

**What's known:** The admin update payload includes `productsData2` in the 37KB captured shape. `navigationItems` with two entries was observed in a different capture. The step navigation DOM is documented for two steps.

**What's unknown:** Whether `window.easybundles_ext_data.bundleLinkData[].stepsConfigurationData` includes the full `productsData2` category+product data when a second step is configured and published, or only includes published/active steps.

**To confirm:** Publish a 2-step FPB and capture the full `stepsConfigurationData` structure from `window.easybundles_ext_data`.

---

### Gap 8 — FPB `bundleTextConfig` Full Shape (unconfirmed)

**What's known:** `bundleTextConfig.bundleSummary` is listed as a top-level key in the `stepsConfiguration/update` payload. `languageData` in `window.easybundles_ext_data` carries merchant-customizable UI copy strings.

**What's unknown:** The full `bundleTextConfig` field structure — what sub-keys exist beyond `bundleSummary` and which strings are DCP-managed vs admin-saved vs defaults.

**To confirm:** In the EB admin FPB editor, open the "Bundle Text" or "Customize Text" section and capture the save payload for any text override.
