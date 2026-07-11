# Test Spec: PPB Product List Category Variant Display
**Spec ID:** ppb-product-list-category-variant-display  **Created:** 2026-07-11

## Purpose

Verify Product Page Bundle Product List follows EB's PPB variant-display contract: `displayVariantsAsIndividualProducts` is evaluated from the active category, not treated as a step-wide Product List setting.

## Test Cases

### ProductPageInpageRenderMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Active category keeps grouped variants | Active category has `displayVariantsAsIndividualProducts: false` and a multi-variant product | One grouped product row renders and the variant selector receives the product variants | PL03 grouped variants |
| 2 | Active category expands variants | Active category has `displayVariantsAsIndividualProducts: true` and a multi-variant product | One row renders per available variant and no grouped variant selector is used | PL03 variants-as-individual |

## Acceptance Criteria
- [ ] Active category controls variants-as-individual behavior.
- [ ] Grouped category keeps multi-variant products grouped.
- [ ] Individual-variant category expands available variants.
- [ ] Focused Jest test passes.
