---
schema_version: 1
id: ppb-d11-bundle-quantity-options-absence-evidence
title: PPB D11 Bundle Quantity Options Absence Evidence
type: evidence
status: active
summary: Direct EB evidence that Product Page Bundle does not expose or execute Bundle Quantity Options.
last_audited: 2026-07-15
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
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - discounts
keywords:
  - Bundle Quantity Options
  - boxSelection
  - D11
---

# PPB D11 Bundle Quantity Options Absence Evidence

## Scope

This pass resolves D11 across all four Product Page Bundle template columns.

The result is EB-absent. No Wolfpack replay is required because the EB Product
Page Bundle configure flow does not expose a Bundle Quantity Options control and
the storefront runtime does not execute box selection.

## EB Admin evidence

The live EB PPB configure flow was inspected through Chrome DevTools MCP on
2026-07-15.

Step Setup exposed:

- step/category setup
- quantity/amount step rules
- product and collection sources
- category-level variant-individual control

Bundle Settings exposed:

- Pre Selected Product
- Enable Quantity Validation
- Pre-order & Subscription Integration
- Cart line item discount display
- Bundle Level CSS
- Bundle Status

No loaded PPB admin surface exposed:

- Bundle Quantity Options
- Box Selection
- `boxSelection`
- box quantity rules
- any equivalent PPB quantity-tier selector outside the normal discount rules.

## EB storefront runtime evidence

The EB Product Page Bundle storefront was selected, Cache Storage was cleared,
and the page was hard reloaded with `ignoreCache: true`.

Runtime extraction returned:

```json
{
  "template": "PDP_INPAGE",
  "templateId": "COGNIVE",
  "boxSelection": {
    "rules": [
      {
        "ruleId": "564",
        "boxQuantity": 2,
        "boxLabel": "Box of 2",
        "boxSubtext": "5% off",
        "isDefaultSelected": true
      },
      {
        "ruleId": "915",
        "boxQuantity": 3,
        "boxLabel": "Box of 2",
        "boxSubtext": "5% off",
        "isDefaultSelected": false
      }
    ],
    "isEnabled": false,
    "validateBoxSelectionQuantity": false,
    "textConfig": {
      "isEnabled": false,
      "boxConditionSuccessText": "All Set! (You can add more items)",
      "boxConditionInitialText": "Select upto {{quantityDifference}} Items",
      "boxConditionInProgressText": "{{quantityDifference}} Items to Go"
    }
  },
  "boxTextVisible": false,
  "viewport": { "w": 1280, "h": 800, "dpr": 1 }
}
```

The persisted object exists as inert stale/default data, but PPB runtime reports
`isEnabled: false` and renders no box quantity UI. This matches the existing PL06
classification and applies to the shared PPB runtime path across Product List,
Product Grid, Horizontal Slots, and Vertical Slots.

## Matrix outcome

D11 is EB-absent for Product List, Product Grid, Horizontal Slots, and Vertical
Slots.
