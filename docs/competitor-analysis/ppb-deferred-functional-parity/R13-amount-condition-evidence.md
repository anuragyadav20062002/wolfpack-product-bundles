---
schema_version: 1
id: ppb-r13-amount-condition-evidence
title: PPB R13 Amount Condition Evidence
type: verification-evidence
status: verified
summary: Verifies amount-based progression rules across reference and Wolfpack Product Page Bundle templates.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - parity
keywords:
  - amount condition
  - category rules
  - R13
---

# PPB R13 Amount Condition Evidence

## Reference replay

The reference PPB fixture was persisted with a Category 1 amount condition of at
least 300. Direct Chrome DevTools replay covered all four reference templates at
desktop and mobile sizes. Each pass proved the same behavior:

- below the threshold, forward progression stayed blocked;
- after selecting the qualifying `$829.00` product, forward progression became
  available;
- the selected item and running total persisted when advancing to the empty
  second category.

The reference fixture was restored to its saved Product Grid state with Step
Rules set to Quantity greater than or equal to two.

## Wolfpack replay

The Wolfpack agent-store fixture `cmrf19c8d0000v0xpj8rz2wgh` was temporarily
persisted with Step 2 disabled and a Category 1 amount condition:

```json
[
  {
    "type": "amount",
    "condition": "greaterThanOrEqualTo",
    "value": "300"
  }
]
```

Each Wolfpack pass cleared Cache Storage, hard reloaded the storefront, and
verified the live bundle JSON before interaction. All passes served widget
`5.0.182`, used the expected template runtime contract, and showed no
app-owned failed requests. The recurring console noise was limited to the known
non-app 404 and Shopify/browser form-field issue.

| Template | Runtime contract | Viewports | Stylesheet | Below threshold | Above threshold |
| --- | --- | --- | --- | --- | --- |
| Product List | `PDP_INPAGE + CASCADE` | 1280×800, 390×844 | `bundle-widget-product-page-cascade.css` | In-page `Next` remained disabled at `$0.00`. | Selecting `14k Dangling Obsidian Earrings` changed the CTA to `Next • $829.00` and enabled progression. |
| Product Grid | `PDP_INPAGE + COGNIVE` | 1280×800, 390×844 | `bundle-widget-product-page-cognive.css` | Direct `Next` and Category 2 attempts did not advance at `$0.00`. | Selecting the `$829.00` product allowed Category 2 navigation; the selected drawer and total persisted. |
| Horizontal Slots | `PDP_MODAL + MODAL` | 1280×800, 390×844 | `bundle-widget-product-page-modal.css` | The modal stayed on Category 1 at `$0.00`; no forward progression occurred. | Selecting the `$829.00` product enabled modal `Next` and advanced to the empty second category with the selected count and total retained. |
| Vertical Slots | `PDP_MODAL + SIMPLIFIED` | 1280×800, 390×844 | `bundle-widget-product-page-modal.css` | Page and modal CTAs stayed blocked at `$0.00`. | Selecting the `$829.00` product enabled the modal path and advanced to the empty second category with the selected count and total retained. |

## Fixture restore

After the replay, the Wolfpack fixture was restored and verified from the
storefront bundle JSON:

- template: `PDP_MODAL`
- preset: `SIMPLIFIED`
- slot orientation: `vertical`
- Step 2: disabled
- Step 1 rule: `conditionType: "quantity"`,
  `conditionOperator: "greater_than_or_equal_to"`, `conditionValue: 2`

The Shopify Admin save banner remained stale after the final save request, but
the app-owned save request returned 200 and the storefront API returned the
restored persisted configuration.
