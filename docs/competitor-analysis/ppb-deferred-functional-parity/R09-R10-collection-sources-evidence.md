---
schema_version: 1
id: ppb-r09-r10-collection-sources-evidence
title: PPB R09-R10 Collection Source Evidence
type: verification-evidence
status: verified
summary: Verifies collection-backed and mixed manual-plus-collection sources in Product Grid and Vertical Slots.
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
  - docs/competitor-analysis/ppb-product-list-agentic-parity/PLS3-collection-reload-evidence.md
  - docs/competitor-analysis/ppb-horizontal-slots-agentic-parity/HSS1-combined-desktop-stress-evidence.md
tags:
  - ppb
  - parity
keywords:
  - collection source
  - mixed source
---

# PPB R09-R10 Collection Source Evidence

## Scope

This replay isolates collection-backed and mixed manual-plus-collection product
sources in Product Grid (`PDP_INPAGE + COGNIVE`) and Vertical Slots
(`PDP_MODAL + SIMPLIFIED`). Browser evidence was collected directly with Chrome
DevTools after clearing Cache Storage and performing an ignore-cache hard reload
before each evidence pass.

Before changing the fixture, the relevant setup guidance was read in full:

- `[Classic] Setting up your first Bundle Builder on Easy Bundles`
- `Structuring Your Bundle: Steps vs. Categories`

The guidance confirms that categories can contain products from multiple source
types within the same step. No additional source or runtime contract was needed.

## Persisted Source Configuration

The live reference fixture's second step contained three manual product IDs and
the `automated-collection` collection. The collection contained 28 source
products; inventory filtering produced 24 sellable, unique storefront cards.

The equivalent agent-store fixture's second step temporarily combined four
manual products with one Automated Collection. Its collection also contained 28
source products; the agent store's inventory state produced 22 sellable, unique
storefront cards. The different rendered totals are expected because the stores
do not have identical sellable inventory.

## Product Grid Replay

At 1280x800 and 390x844, the reference Product Grid rendered 24 unique products
with no duplicate cards. A product present in the mixed source result was
selected, and the same selection remained after a cache-cleared hard reload.
The equivalent Wolfpack Product Grid served widget `5.0.182`, rendered 22 unique
products, and retained the selected mixed-source product after the same reload
sequence.

The Wolfpack desktop cards all measured 253.78125 pixels high, and its mobile
cards all measured 313.5 pixels high. Both stores showed zero product
descriptions, zero selection tick badges, and no relevant horizontal overflow.

## Vertical Slots Replay

The reference fixture was temporarily switched to Vertical Slots. Its Step 2
picker rendered 24 unique mixed-source products at both viewports. Selecting a
product filled the Step 2 slot, and the filled slot remained after a
cache-cleared hard reload.

The equivalent Wolfpack Vertical Slots picker served widget `5.0.182` and
rendered 22 unique mixed-source products at both viewports. The selected product
remained in its filled slot after reload. Wolfpack picker cards were uniformly
417.765625 pixels high on desktop and 329.171875 pixels high on mobile. Product
descriptions, selection tick badges, duplicates, and relevant overflow were all
absent.

## Restoration and Result

The reference fixture was restored to Product Grid and verified at 1280x800
after a final Cache Storage clear and ignore-cache hard reload. The agent-store
fixture was restored to Vertical Slots with its temporary second step disabled.

R09 and R10 are therefore proven for Product Grid and Vertical Slots. Both
templates hydrate collection sources, merge manual and collection products
without duplicate cards, preserve selection state, and apply inventory filtering
without losing the selected mixed-source product. No implementation defect was
found, so this evidence batch changes documentation only.
