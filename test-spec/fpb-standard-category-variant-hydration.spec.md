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

## Acceptance Criteria
- [x] All listed test cases pass.
