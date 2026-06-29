# Test Spec: FPB Standard Category Variant Hydration
**Spec ID:** fpb-standard-category-variant-hydration  **Created:** 2026-06-29

## Purpose
Verify that FPB category-tab storefront product hydration preserves collection-backed category products and expands variant cards when the FPB step-level variant display setting is enabled.

## Test Cases

### FullPageWidgetCategoryHydration
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Category entries include manual products and collections | Step with one manual category and one collection category | Entries include product IDs and collection handles | Data contract only |
| 2 | Step-level variant display applies to category tabs | Active category flag false, step flag true | Variant expansion decision is true | Matches current FPB Admin save shape |
| 3 | Variant display stays off when all flags are false | Active category flag false, step flag false | Variant expansion decision is false | Regression guard |
| 4 | Collection product variants expand into cards | Product with two variants and compare-at price | Two variant-card records with parent product IDs | Data behavior only |

## Acceptance Criteria
- [x] All listed test cases pass.
