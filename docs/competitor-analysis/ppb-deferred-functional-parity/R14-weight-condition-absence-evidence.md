---
schema_version: 1
id: ppb-r14-weight-condition-absence-evidence
title: PPB R14 Weight Condition Absence Evidence
type: verification-evidence
status: verified
summary: Records that the current reference PPB Admin does not expose a weight-based condition despite stale help copy.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/shared/condition-validator.js
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - parity
keywords:
  - weight condition
  - category rules
---

# PPB R14 Weight Condition Absence Evidence

## Current Admin Evidence

The live PPB Rules Configuration help article was read in full before opening
Category Rules. The article lists Quantity, Amount, and Weight as possible
category metrics.

The current PPB Admin does not match that article. On a step with two categories,
switching from Step Rules to Category Rules and adding a Category 1 rule exposed
exactly two metric options:

- Quantity
- Amount

The surrounding live UI states, `Create Rules based on amount or quantity of
products added on this category.` No Weight option was present in the selector.

## Resolution

Because merchants cannot persist a PPB weight condition through the current
reference Admin, there is no valid reference storefront permutation to replay
per template. R14 is classified as EB-absent for Product List, Product Grid,
Horizontal Slots, and Vertical Slots. Wolfpack's shared weight-aware validator
is not removed by this evidence, but it cannot be called PPB parity proof.

The unsaved Category Rules experiment was discarded through the Admin discard
confirmation. The reference fixture returned to its saved Step Rules state with
Quantity greater than or equal to two; no storefront mutation was persisted.
