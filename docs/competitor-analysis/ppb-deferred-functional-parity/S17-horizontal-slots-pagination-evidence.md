---
schema_version: 1
id: ppb-s17-horizontal-slots-pagination-evidence
title: PPB S17 Horizontal Slots Pagination Evidence
type: evidence
status: verified
summary: Verifies Horizontal Slots collection-count pagination behavior with current EB and WPB desktop and mobile storefront evidence.
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
  - docs/competitor-analysis/ppb-deferred-functional-parity/S17-product-grid-vertical-slots-pagination-evidence.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/R09-R10-collection-sources-evidence.md
tags:
  - ppb
  - horizontal-slots
  - pagination
keywords:
  - S17
  - Horizontal Slots pagination
  - collection count
---

# S17 Horizontal Slots Pagination Evidence

S17 is terminal **P** for Horizontal Slots.

## EB reference evidence

Fixture: `yash-wolfpack.myshopify.com`, offer `MIX-156854`, product
`WPB PPB Product List Parity 2026-07-11`.

Before replay, EB Step 2 retained the same collection-backed source already
used by the R09-R10/S17 pagination evidence:

- Step 2 Category 1 had three manual products.
- Step 2 Category 1 selected `Automated Collection`.
- The collection source reported `productsCount: 28` and
  `productsAutomaticallySortedCount: 28`.

The template was temporarily switched through EB Admin from Product Grid to
Horizontal Slots. The save response returned HTTP 200 and persisted:

```json
{
  "offerId": "MIX-156854",
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignTemplateData": { "templateId": "MODAL" }
}
```

After clearing Cache Storage and hard reloading with `ignoreCache: true`, the
storefront reported:

```json
{
  "bodyAttrs": {
    "gbbmix-template-id": "MODAL",
    "gbbmix-template-type": "PDP_MODAL"
  },
  "desktop": {
    "viewport": "1280x800",
    "currentStep": "Step 2",
    "selectedCategory": "Category 1",
    "itemCount": 24,
    "uniqueTitleCount": 22
  },
  "mobile": {
    "viewport": "390x844x3",
    "currentStep": "Step 2",
    "selectedCategory": "Category 1",
    "itemCount": 24,
    "uniqueTitleCount": 22
  }
}
```

The EB fixture was restored after the pass. A final hard reload reported:

```json
{
  "gbbmix-template-id": "COGNIVE",
  "gbbmix-template-type": "PDP_INPAGE"
}
```

## WPB mirror evidence

Fixture: `agent-5sfidg3m.myshopify.com`, bundle
`cmrf19c8d0000v0xpj8rz2wgh`, product `PPB Modal Shared Card Test`.

The SIT fixture was backed up from Prisma before mutation:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "steps": [
    { "position": 1, "enabled": true },
    { "position": 2, "enabled": false }
  ]
}
```

Step 2 Category 1 contained four manual products and the selected
`Automated Collection` source:

```json
{
  "id": "gid://shopify/Collection/471889903875",
  "title": "Automated Collection",
  "handle": "automated-collection"
}
```

For the replay only, the fixture was switched to
`PDP_MODAL + MODAL` and Step 2 was enabled. After clearing Cache Storage and
hard reloading with `ignoreCache: true`, the storefront bundle JSON and DOM
reported:

```json
{
  "bodyAttrs": {
    "wpbmix-template-id": "MODAL",
    "wpbmix-template-type": "PDP_MODAL"
  },
  "api": {
    "bundleDesignTemplate": "PDP_MODAL",
    "bundleDesignPresetId": "MODAL",
    "step2Enabled": true,
    "step2Collection": "automated-collection"
  },
  "desktop": {
    "viewport": "1280x800",
    "currentStep": "Step 2",
    "cardCount": 22,
    "uniqueTitleCount": 20
  },
  "mobile": {
    "viewport": "390x844x3",
    "currentStep": "Step 2",
    "cardCount": 22,
    "uniqueTitleCount": 20
  }
}
```

The WPB rendered count differs from EB because the shops have different
sellable inventory and fixture products. The S17 contract is the collection
count/pagination path: the collection-backed Step 2 source hydrated into the
Horizontal Slots picker without a truncated first page or lost manual source.

The WPB fixture was restored after the replay and re-read from Prisma as:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "steps": [
    { "position": 1, "enabled": true },
    { "position": 2, "enabled": false }
  ]
}
```

## Matrix impact

Promote S17 Horizontal Slots to **P**.
