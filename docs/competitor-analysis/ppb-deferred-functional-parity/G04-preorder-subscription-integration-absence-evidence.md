---
schema_version: 1
id: ppb-g04-preorder-subscription-integration-absence-evidence
title: PPB G04 Preorder and Subscription Integration Absence Evidence
type: parity-evidence
status: active
summary: Documents that the current PPB fixture has no EB-executed product-level preorder or selling-plan state to mirror across templates.
last_audited: 2026-07-16
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
  - docs/competitor-analysis/ppb-deferred-functional-parity/G05-subscriptions-no-common-plan-evidence.md
  - internal docs/EB Integrations Reference.md
tags:
  - ppb
  - subscriptions
  - preorder
keywords:
  - G04
  - selling plans
  - preorder
---

# G04 Preorder and Subscription Integration Absence

## Result

Row G04 is terminal **E** for Product List, Product Grid, Horizontal Slots, and Vertical Slots.

The current EB PPB fixture does not expose or execute product-level preorder or selling-plan selection. Because the required product/runtime data is absent before template dispatch, there is no template-specific behavior for WPB to mirror in this matrix pass.

## EB current storefront runtime

Chrome DevTools MCP, cache-cleared hard reload, EB storefront `yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`, desktop `1280x800`.

The current EB runtime exposes Product Grid template metadata and a bundle-level subscription validation failure:

```json
{
  "template": {
    "bundleDesignTemplate": "PDP_INPAGE",
    "bundleDesignTemplateData": {
      "templateId": "COGNIVE"
    }
  },
  "subscriptionBundlesData": {
    "lastValidationResponse": {
      "isValid": false,
      "message": "NO_SELLING_PLAN_GROUPS_FOUND"
    },
    "sellingPlanGroups": []
  }
}
```

The same runtime traversal found no product-level integration data:

```json
{
  "productCount": 10,
  "hasAnySellingPlanAllocations": false,
  "hasAnySellingPlanGroups": false,
  "hasAnyPreorderTruthy": false,
  "visiblePlanText": [],
  "textHit": null,
  "overflowX": 0
}
```

Sample product entries all had null integration data:

```json
{
  "title": "14k Dangling Obsidian Earrings",
  "sellingPlanGroups": null,
  "sellingPlanAllocations": null,
  "isPreorder": null,
  "variants": [
    {
      "id": "gid://shopify/ProductVariant/45038877868228",
      "sellingPlanAllocations": null,
      "isPreorder": null
    }
  ]
}
```

No visible subscription, selling-plan, one-time purchase, delivery-frequency, or preorder controls were present in the storefront DOM.

## WPB baseline check

Chrome DevTools MCP, cache-cleared hard reload, WPB storefront `agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`, desktop `1280x800`.

The WPB baseline fixture is Vertical Slots:

```json
{
  "rootAttrs": {
    "templateType": "PDP_MODAL",
    "preset": "SIMPLIFIED",
    "orientation": "vertical",
    "version": "5.0.189"
  },
  "bundle": {
    "bundleDesignTemplate": "PDP_MODAL",
    "bundleDesignPresetId": "SIMPLIFIED"
  }
}
```

Its app-proxy runtime likewise contains no active product-level preorder or selling-plan data:

```json
{
  "productCount": 16,
  "hasAnySellingPlanAllocations": false,
  "hasAnySellingPlanGroups": false,
  "hasAnyPreorderTruthy": false,
  "visiblePlanText": [],
  "overflowX": 0
}
```

The WPB check is not used to prove EB absence; it confirms the current baseline is not hiding an active WPB-only integration state.

## Matrix resolution

G04 is resolved as **E** across all templates because:

- EB's current bundle-level subscription validation has no common selling plan.
- EB's current product/category runtime has no product-level selling-plan allocations, selling-plan groups, or preorder flags.
- EB renders no buyer-facing plan/preorder selector or copy.
- The missing data is template-independent, so cycling Product List, Product Grid, Horizontal Slots, and Vertical Slots would not create a selling-plan/preorder behavior.

If a future EB fixture supplies Stoq preorder data or Shopify selling-plan allocations on PPB products, that should be tested as a new evidence slice rather than inferred from this absent-state fixture.
