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

## Gaps And Blockers

The a11y/keyboard follow-up closed the earlier PPB blockers for quantity/amount step rules, discount rules, and default/preselected products. Phase 2 closed storefront globals, cart add payloads, and JS runtime state. Remaining limits:

- Multiple-step storefront navigation: `productsData2` exists in the FPB admin payload but the storefront only rendered one nav item (`isLastPage: true`). The step transition DOM and JS state change were not captured.
- Alternative template IDs: only `FBP_SIDE_FOOTER` + `CLASSIC` (FPB) and `PDP_INPAGE` + `CASCADE` (PPB) were observed. Other layout/preset enum values were not enumerated.
- Collection pagination beyond 24: confirmed the limit (29 products in test collection), but the "Load More" click and its Storefront API cursor query were not executed.
- `displayVariantsAsIndividualProducts: true` DOM rendering: both test products have only one variant, so no visual difference was observable. A multi-variant product would be needed to observe individual variant cards or swatches.
- Screenshots were not committed, per repo rule. Browser snapshots and network evidence were inspected live through Chrome DevTools.

These remaining limits do not change the main data-shape conclusion: categories are stable first-class step children, direct products and selected collections are separately represented under each category, product/collection hydration preserves Shopify GIDs plus numeric storefront IDs, and both FPB and PPB use the same `_easyBundle:OfferId` + `bundle_details` metafield cart pattern.
