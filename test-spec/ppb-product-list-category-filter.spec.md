# Test Spec: PPB Product List Category Filter
**Spec ID:** ppb-product-list-category-filter  **Created:** 2026-07-11

## Purpose

Verify Product Page Bundle Product List keeps EB-style category behavior at the data-flow level: multi-category Product List fixtures preserve category switching, active category filtering, and empty category handling without visual/source-grep tests.

## Test Cases

### ProductPageLayoutShellMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Active category filters products | Two categories with distinct products and active index set to second category | Only products in the active category remain | PL01 category switching |
| 2 | Empty manual category | Active category has no products and no collections | No products are rendered for that category | PL01 empty category |
| 3 | Collection-backed category without direct ids | Active category has selected collection metadata and no direct product ids | Products are preserved for collection hydration/display | PL01 collection-backed categories |

## Acceptance Criteria
- [ ] Active category index controls Product List filtering.
- [ ] Empty manual categories produce an empty product list.
- [ ] Collection-backed categories do not drop hydrated products.
- [ ] Focused Jest test passes.
