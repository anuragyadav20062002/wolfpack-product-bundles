---
schema_version: 1
id: ppb-s06-default-preselected-products-evidence
title: PPB S06 Default and Preselected Products Evidence
type: parity-evidence
status: active
summary: Documents S06 default/preselected product initialization across all Product Page Bundle templates with one shared fixture.
last_audited: 2026-07-17
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md
tags:
  - ppb
  - default-products
  - preselected-products
keywords:
  - S06
  - defaultProductsData
  - preselected product
---

# S06 Default and Preselected Products

## Result

Row S06 is terminal **P** across Product List, Product Grid, Horizontal Slots,
and Vertical Slots.

One shared fixture was used to reduce EB/WPB fixture churn:

- EB offer: `MIX-156854`
- EB product: `WPB PPB Product List Parity 2026-07-11`
- WPB bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Default product: `14k Dangling Obsidian Earrings`
- Required quantity: `1`

The pass proves that saved defaults initialize visibly in each template family,
contribute to the initial selected/default-products summary, and do not create
positive horizontal overflow on desktop or mobile hard reloads. EB's saved
default variant reported `inventoryQuantity: 0` with `inventoryPolicy: "DENY"`;
that unavailable-inventory default still initialized safely in EB instead of
breaking the storefront. A separate deleted/stale-ID corruption was not injected
because EB exposes this state only through product picker UI, not as a direct
merchant control.

## EB Admin fixture blocker and workaround

The earlier EB UI-only blocker was not data-model related. The relevant EB
controls were inside Shopify Admin's cross-origin app iframe, and some row/action
buttons had no accessible label. Direct clicks often reported success while not
routing or not toggling the control.

The working path was:

1. Use Chrome DevTools MCP against the EB Admin page.
2. Open/reload the EB app iframe session directly enough for the iframe
   accessibility tree to expose the bundle list and configure controls.
3. Use keyboard focus and `Space` for checkboxes when direct click/fill timed
   out.
4. Verify saves from `mixAndMatch/update` responses rather than visible UI state
   alone.

## Template evidence

| Template | EB saved/runtime template | WPB saved/runtime template | Desktop proof | Mobile proof |
| --- | --- | --- | --- | --- |
| Product List | `PDP_INPAGE / CASCADE` | `PDP_INPAGE / CASCADE` | EB and WPB hard reloads showed `Default products`, `14k Dangling Obsidian Earrings x 1`, progress text, and no positive overflow. | EB and WPB hard reloads showed the same default line and no positive overflow at `390x844x3`. |
| Product Grid | `PDP_INPAGE / COGNIVE` | `PDP_INPAGE / COGNIVE` | EB and WPB hard reloads showed `Default products`, the default product at quantity `1`, progress text, and no positive overflow. | EB and WPB hard reloads showed the same default state and no positive overflow at `390x844x3`. |
| Horizontal Slots | `PDP_MODAL / MODAL` | `PDP_MODAL / CLASSIC` | EB rendered the default product plus modal add controls; WPB rendered the filled first slot plus default-products summary. Both had no positive overflow. | EB and WPB rendered the same default state at `390x844x3` with no positive overflow. |
| Vertical Slots | `PDP_MODAL / SIMPLIFIED` | `PDP_MODAL / SIMPLIFIED` | EB and WPB rendered the default product in the slot/default-products state, with progress/CTA state intact and no positive overflow. | EB and WPB rendered the same default state at `390x844x3` with no positive overflow. |

## Persisted fixture values

EB save responses confirmed:

```json
{
  "defaultProductsData": {
    "isDefaultProductsEnabled": true,
    "defaultProductsTitle": "Default products",
    "products": [
      {
        "productId": "8322626126020",
        "graphqlId": "gid://shopify/Product/8322626126020",
        "title": "14k Dangling Obsidian Earrings",
        "requiredQuantity": 1,
        "variants": [
          {
            "variantId": "45038877868228",
            "variantGraphqlId": "gid://shopify/ProductVariant/45038877868228",
            "inventoryQuantity": 0,
            "inventoryPolicy": "DENY",
            "price": "829.00"
          }
        ]
      }
    ]
  }
}
```

WPB was mirrored with:

```json
{
  "defaultProductsData": {
    "isDefaultProductsEnabled": true,
    "defaultProductsTitle": "Default products",
    "products": [
      {
        "productId": "9506413773059",
        "graphqlId": "gid://shopify/Product/9506413773059",
        "handle": "14k-dangling-obsidian-earrings",
        "title": "14k Dangling Obsidian Earrings",
        "requiredQuantity": 1,
        "variants": [
          {
            "variantId": "48720141091075",
            "variantGraphqlId": "gid://shopify/ProductVariant/48720141091075",
            "price": "829.00"
          }
        ]
      }
    ]
  }
}
```

All WPB storefront checks ran on widget version `5.0.189`.

## Restore

EB was restored and verified by `mixAndMatch/update` response:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignTemplateData": {
    "templateId": "SIMPLIFIED"
  },
  "defaultProductsData": {
    "isDefaultProductsEnabled": false
  }
}
```

WPB was restored through the local DB mirror path:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "defaultProductsData": {}
}
```
