---
schema_version: 1
id: ppb-category-scoped-variants-keyed-categories
title: PPB Category Scoped Variants Keyed Categories
type: test-spec
status: active
summary: Verifies PPB category-scoped variant filtering works when runtime categories are keyed by category id.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page/methods/layout-shell-methods.js
  - tests/unit/assets/ppb-category-scoped-variants.test.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - category-filtering
  - variants
keywords:
  - C09
  - keyed categories
  - category scoped variants
---

# Test Spec: PPB Category Scoped Variants Keyed Categories
**Spec ID:** ppb-category-scoped-variants-keyed-categories  **Created:** 2026-07-15

## Purpose

Prevent Product Page Bundle in-page/Product Grid rendering from ignoring category-scoped variant subsets when `step.categories` arrives as an object keyed by category id instead of an array.

## Test Cases

### ProductPageLayoutShellMethods

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Keyed category with one configured variant | `step.categories = { category38661: { products: [{ variants: [variant 1002] }] } }` and hydrated product with variants 1001/1002 | Filtered result contains only variant 1002 and promotes it to card identity | Mirrors live EB Product Grid C09 shape where a category stores one Pedal Ring variant |

## Acceptance Criteria

- [x] Test fails before implementation.
- [x] Test passes after implementation.
- [x] Widget source syntax check passes.
- [x] Widget bundle is rebuilt.
