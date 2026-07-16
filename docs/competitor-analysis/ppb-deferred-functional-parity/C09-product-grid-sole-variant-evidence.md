---
schema_version: 1
id: ppb-c09-product-grid-sole-variant-evidence
title: PPB C09 Product Grid Sole Variant Evidence
type: parity-evidence
status: active
summary: Documents Product Grid parity for a category-scoped product with one surviving variant.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - app/assets/widgets/product-page
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-product-grid-agentic-parity/PG03-category-and-variant-evidence.md
tags:
  - ppb
  - product-grid
  - variants
keywords:
  - C09
  - Product Grid
  - sole variant
  - 18k Pedal Ring
---

# C09 Product Grid sole variant evidence

## Result

C09 is terminal **P** for Product Grid.

Both EB and Wolfpack Product Grid render the Step 1 Category 2 `18k Pedal Ring`
fixture as one card with the surviving variant identity `10`, no variant
selector, and no leaked sibling variant options.

## EB Product Grid evidence

Chrome DevTools MCP, cache-cleared hard reload, EB storefront
`yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`.

Desktop `1280x800`:

```json
{
  "template": {
    "bodyType": "PDP_INPAGE",
    "bodyId": "COGNIVE"
  },
  "runtime": {
    "offerId": "MIX-156854",
    "bundleDesignTemplate": "PDP_INPAGE",
    "templateId": "COGNIVE",
    "category2": {
      "name": "Category 2Long Label Empty Category",
      "products": [
        {
          "title": "18k Pedal Ring",
          "variants": [
            {
              "id": "gid://shopify/ProductVariant/45038876688580",
              "price": "399.00"
            }
          ]
        }
      ]
    }
  },
  "activeTab": "Category 2Long Label Empty Category",
  "text": "18k Pedal Ring\n₹399\n10\nAdd +",
  "containsOtherVariants": [],
  "selectCount": 0,
  "overflow": {
    "doc": 0,
    "body": 0
  }
}
```

Mobile `390x844x3`:

```json
{
  "template": {
    "bodyType": "PDP_INPAGE",
    "bodyId": "COGNIVE"
  },
  "runtime": {
    "offerId": "MIX-156854",
    "bundleDesignTemplate": "PDP_INPAGE",
    "templateId": "COGNIVE",
    "category2": {
      "name": "Category 2Long Label Empty Category",
      "products": [
        {
          "title": "18k Pedal Ring",
          "variants": [
            {
              "id": "gid://shopify/ProductVariant/45038876688580",
              "price": "399.00"
            }
          ]
        }
      ]
    }
  },
  "activeTab": "Category 2Long Label Empty Category",
  "text": "18k Pedal Ring\n₹399\n10\nAdd +",
  "containsOtherVariants": [],
  "selectCount": 0,
  "overflow": {
    "doc": 0,
    "body": 0
  }
}
```

EB loaded the app-owned storefront endpoints successfully:

- `cart.js?app=gbbMixBundleApp`: `200`
- `/apps/gbb/updateMixAndMatchBundleView`: `200`
- Storefront GraphQL: `200`
- `cart/update.js?app=gbbMixBundleApp`: `200`

The remaining console noise was generic Shopify/theme 404 resource noise and
not tied to the EB app-owned requests above.

## Wolfpack Product Grid evidence

The scoped SIT fixture `cmrf19c8d0000v0xpj8rz2wgh` was temporarily switched from
Vertical Slots to Product Grid:

```json
{
  "bundleDesignTemplate": "PDP_INPAGE",
  "bundleDesignPresetId": "COGNIVE",
  "useSingleStepCategoriesAsBundleSteps": false,
  "step1Category2": {
    "title": "18k Pedal Ring",
    "variants": [
      {
        "id": "gid://shopify/ProductVariant/48720161276163",
        "title": "10",
        "price": "399.00"
      }
    ]
  }
}
```

Chrome DevTools MCP, cache-cleared hard reload, WPB storefront
`agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`.

Desktop `1280x800`, widget `5.0.186`:

```json
{
  "config": {
    "template": "PDP_INPAGE",
    "preset": "COGNIVE",
    "useSingleStepCategoriesAsBundleSteps": false,
    "cat2Products": [
      {
        "title": "18k Pedal Ring",
        "variants": [
          {
            "id": "gid://shopify/ProductVariant/48720161276163",
            "title": "10",
            "price": "399.00"
          }
        ]
      }
    ]
  },
  "clickedCategoryText": "Category 2Long Label Empty Category",
  "text": "18k Pedal Ring\n10\n$399.00\nAdd +",
  "containsOtherVariants": [],
  "selectCount": 0,
  "overflow": {
    "doc": 0,
    "body": 0
  },
  "styleLinks": [
    "bundle-widget-product-page-cognive.css",
    "bundle-widget.css"
  ]
}
```

Mobile `390x844x3`, widget `5.0.186`:

```json
{
  "config": {
    "template": "PDP_INPAGE",
    "preset": "COGNIVE",
    "useSingleStepCategoriesAsBundleSteps": false,
    "cat2Products": [
      {
        "title": "18k Pedal Ring",
        "variants": [
          {
            "id": "gid://shopify/ProductVariant/48720161276163",
            "title": "10",
            "price": "399.00"
          }
        ]
      }
    ]
  },
  "clickedCategoryText": "Category 2Long Label Empty Category",
  "text": "18k Pedal Ring\n10\n$399.00\nAdd +",
  "containsOtherVariants": [],
  "selectCount": 0,
  "overflow": {
    "doc": 0,
    "body": 0
  },
  "styleLinks": [
    "bundle-widget-product-page-cognive.css",
    "bundle-widget.css"
  ]
}
```

Wolfpack app-owned requests returned healthy statuses:

- `/apps/product-bundles/api/language-settings/...`: `200`
- `/apps/product-bundles/api/controls-settings/...`: `200`
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh.json`: `304` on initial load, `200` on explicit no-store verification
- `/apps/product-bundles/api/storefront-products?...`: `200`
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh/view`: `200`

The remaining console noise was generic Shopify/theme 404 resource noise and
not tied to the app-owned requests above.

## Fixture restoration

After the Product Grid pass, the scoped Wolfpack fixture was restored to:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "useSingleStepCategoriesAsBundleSteps": false,
  "step1Category2Products": 0
}
```

A final cache-cleared hard reload of the WPB storefront verified widget
`5.0.186`, `PDP_MODAL + SIMPLIFIED`, no Product Grid DOM, zero Category 2
products in the bundle API response, and zero horizontal overflow.

## Matrix outcome

Promote C09 Product Grid to **P**.
