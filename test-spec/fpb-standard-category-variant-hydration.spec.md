---
schema_version: 1
id: fpb-standard-category-variant-hydration
title: FPB Standard Category Variant Hydration Test Spec
type: test-spec
status: active
summary: Verifies category hydration, variant expansion, ordering, and unavailable-variant filtering for FPB storefront product grids.
last_audited: 2026-07-22
owners:
  - storefront
domains:
  - bundles
systems:
  - full-page-bundle-widget
source_paths:
  - app/assets/widgets/full-page/methods/product-processing-methods.js
  - app/assets/widgets/full-page/methods/product-grid-methods.js
  - tests/unit/assets/fpb-standard-variant-availability.test.ts
  - tests/unit/assets/bundle-widget-full-page-category-hydration.test.ts
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - fpb
  - storefront
  - variants
keywords:
  - category hydration
  - individual variants
  - unavailable variants
---

# Test Spec: FPB Standard Category Variant Hydration
**Spec ID:** fpb-standard-category-variant-hydration  **Created:** 2026-06-29

## Purpose
Verify that FPB category-tab storefront product hydration preserves collection-backed category products, expands variant cards when the FPB step-level variant display setting is enabled, and orders active category products before attached collection products.

## Test Cases

### FullPageWidgetCategoryHydration
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Category entries include manual products and collections | Step with one manual category and one collection category | Entries include product IDs and collection handles | Data contract only |
| 2 | Step-level variant display applies to category tabs | Active category flag false, step flag true | Variant expansion decision is true | Matches current FPB Admin save shape |
| 3 | Variant display stays off when all flags are false | Active category flag false, step flag false | Variant expansion decision is false | Regression guard |
| 4 | Collection product variants expand into cards | Product with two variants and compare-at price | Two variant-card records with parent product IDs | Data behavior only |
| 5 | Active category order is preserved | Active category with manual products and one collection | Manual products render first in category order, then collection products in collection order | Data behavior only |
| 6 | Duplicate step/category grouped product availability | Step product copy marks every variant available; category product copy marks one variant unavailable | Merged step product variants preserve the category unavailable flag | Prevents unavailable grouped choices from rendering |
| 7 | Individual variant expansion receives stale saved availability for a Storefront-unavailable variant | Saved product marks all variants available; runtime inventory marks one variant unavailable; another is sellable tracked zero-stock while tracking is disabled | Runtime-unavailable variant is omitted; the other two variants remain | Keeps Storefront sellability separate from optional inventory validation |
| 8 | An already-expanded individual card becomes unavailable after runtime inventory hydration | Expanded card is saved as available; runtime inventory for its variant reports `available=false` | Card is omitted from the rendered product list | Covers the final live storefront expansion branch |
| 9 | Tracked zero-stock individual or grouped product | Inventory tracking enabled; Shopify reports quantity zero without backorders | Product or variant is omitted | Matches the EB inventory help and live FPB fixture |
| 10 | Missing product media | Product and variant have no usable media URL | Normalized card data uses the self-contained widget placeholder | Avoids external placeholder requests |
| 11 | Numeric card ID with GID-backed live inventory | Card action passes a numeric variant ID while hydrated step data and Storefront inventory use the Shopify GID | Inventory lookup resolves the same canonical variant and returns the one-unit limit | Prevents the quantity clamp from silently treating tracked stock as unlimited |

## Acceptance Criteria
- [x] All listed test cases pass.
