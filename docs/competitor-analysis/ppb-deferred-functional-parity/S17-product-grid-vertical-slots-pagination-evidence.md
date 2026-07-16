---
schema_version: 1
id: ppb-s17-product-grid-vertical-slots-pagination-evidence
title: PPB S17 Product Grid and Vertical Slots Pagination Evidence
type: parity-evidence
status: active
summary: Documents existing collection-count and no-duplicate proof for Product Grid and Vertical Slots catalog pagination behavior.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-deferred-functional-parity/R09-R10-collection-sources-evidence.md
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-deferred-functional-parity/R09-R10-collection-sources-evidence.md
tags:
  - ppb
  - pagination
  - product-grid
  - vertical-slots
keywords:
  - S17
  - Product Grid
  - Vertical Slots
  - collection pagination
  - duplicate cards
---

# S17 Product Grid and Vertical Slots Pagination Evidence

## Result

S17 is terminal **P** for Product Grid and Vertical Slots.

`R09-R10-collection-sources-evidence.md` directly proves the S17 catalog-count
contract for Product Grid and Vertical Slots:

- EB Step 2 used three manual product IDs plus the `automated-collection`
  collection.
- The collection contained `28` source products.
- EB rendered `24` sellable, unique storefront cards after inventory filtering.
- WPB Step 2 used four manual products plus one Automated Collection.
- The WPB collection also contained `28` source products.
- WPB rendered `22` sellable, unique storefront cards after inventory filtering.
- The rendered-count difference is store inventory, not lost collection
  pagination.
- Product Grid and Vertical Slots both retained a selected mixed-source product
  after cache-cleared hard reload.

The evidence covers both desktop `1280x800` and mobile `390x844` for Product
Grid and Vertical Slots, and records zero duplicate cards, no lost selected
mixed-source product, and no relevant horizontal overflow.

## Matrix update

Promote S17 Product Grid and Vertical Slots to **P**.

Keep S17 Horizontal Slots at **T** until direct collection-count proof exists
for that template. Existing Horizontal Slots evidence covers mixed inventory and
combined stress behavior, but does not isolate the 28-product collection-count
contract required by S17.
