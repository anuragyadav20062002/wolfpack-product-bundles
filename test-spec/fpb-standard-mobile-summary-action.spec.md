# Test Spec: FPB Standard Mobile Summary Action
**Spec ID:** fpb-standard-mobile-summary-action
**Created:** 2026-06-28

## Purpose

Lock the storefront behavior observed in EB Standard: a one-step FPB mobile footer remains an add-to-cart action even when the quantity rule is not yet satisfied, Standard mobile category tabs do not directly swap the expanded product body, and direct default selections count toward cart/discount totals without satisfying exact step-rule navigation.

## Test Cases

### MobileSummaryActionButton

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Last step with unmet conditions | `isLastStep=true`, `isComplete=false`, `conditionlessMobile=false` | Button label is `Add To Cart`; button is disabled | Matches EB P00 mobile baseline where the only step still shows Add To Cart before 4 products are selected. |
| 2 | Non-final step | `isLastStep=false`, no add-on step | Button label is `Next` | Preserves multi-step navigation behavior. |
| 3 | Alternate bottom bar final step with unmet conditions | `isLastStep=true`, `isComplete=false`, `conditionlessMobile=false` | Action state resolves to add-to-cart and disabled | Prevents the same final-step mismatch in the non-summary mobile bar path. |
| 4 | Alternate bottom bar non-final step | `isLastStep=false`, `conditionlessMobile=false` | Action state resolves to next and enabled | Preserves multi-step navigation behavior in the non-summary mobile bar path. |
| 5 | Standard mobile category tab click | `STANDARD`, mobile width, category-backed step | Tab click does not activate a different product body | EB mobile expands categories from the lower row. |
| 6 | Desktop or non-Standard category tab click | Desktop Standard or mobile Compact | Tab click activates the selected category normally | Preserves existing non-target behavior. |
| 7 | Direct default product normalization | EB-style `defaultProductsData` with selected product | Normalized default item contains product id, variant id, title, price, image, quantity | Seeds full-page direct defaults from the durable runtime payload. |
| 8 | Direct default merge | Step product list excludes default product | Default product is merged into step data for totals/cart lookup | Lets a preselected product count for discount/cart totals even when absent from the active step products. |
| 9 | Exact step validation message | Step condition `is = 2`, one manually selected product, one direct default product | Validation returns `Add exactly 2 products on this step` | Matches EB: direct defaults count toward discount/cart, but exact step validation requires explicit step selections. |
| 10 | Step-level auto-next predicate | Step condition quantity reached and `autoNextStepOnConditionMet=true` | Auto-next predicate resolves true | Persists EB's step-rule auto-next behavior independently from category auto-next. |

## Acceptance Criteria

- [x] The new unit test fails before implementation.
- [x] The new unit test passes after implementation.
- [x] No CSS, class-name, source-order, or visual-placement assertions are added.
