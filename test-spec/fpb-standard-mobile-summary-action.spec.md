# Test Spec: FPB Standard Mobile Summary Action
**Spec ID:** fpb-standard-mobile-summary-action
**Created:** 2026-06-28

## Purpose

Lock the storefront behavior observed in EB Standard and Classic: a one-step FPB mobile footer remains an add-to-cart action even when the quantity rule is not yet satisfied, Classic keeps the underfilled final CTA clickable so the existing validation toast appears on press, the compact mobile summary can expand before any product is selected, Standard mobile category tabs do not directly swap the expanded product body, and direct default selections count toward cart/discount totals without satisfying exact step-rule navigation.

## Test Cases

### MobileSummaryActionButton

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Last step with unmet conditions | `isLastStep=true`, `isComplete=false`, `conditionlessMobile=false` | Button label is `Add To Cart`; button is disabled | Matches EB P00 mobile baseline where the only step still shows Add To Cart before 4 products are selected. |
| 2 | Classic last step with unmet conditions | `CLASSIC`, `isLastStep=true`, `isComplete=false`, `conditionlessMobile=false` | Button label is `Add To Cart`; button is enabled; click shows the step-condition toast and does not submit cart | Matches EB Classic C08 blocked state: footer press surfaces `Add exactly ... products on this step`. |
| 3 | Non-final step | `isLastStep=false`, no add-on step | Button label is `Next` | Preserves multi-step navigation behavior. |
| 4 | Alternate bottom bar final step with unmet conditions | `isLastStep=true`, `isComplete=false`, `conditionlessMobile=false` | Action state resolves to add-to-cart and disabled | Prevents the same final-step mismatch in the non-summary mobile bar path. |
| 5 | Alternate bottom bar non-final step | `isLastStep=false`, `conditionlessMobile=false` | Action state resolves to next and enabled | Preserves multi-step navigation behavior in the non-summary mobile bar path. |
| 6 | Compact summary empty state toggle | No selected products and collapsed summary tray | Summary tray state changes to expanded and open animation is scheduled | EB allows opening the mobile summary before product selection. |
| 7 | Standard mobile category tab click | `STANDARD`, mobile width, category-backed step | Tab click does not activate a different product body | EB mobile expands categories from the lower row. |
| 8 | Desktop or non-Standard category tab click | Desktop Standard or mobile Compact | Tab click activates the selected category normally | Preserves existing non-target behavior. |
| 9 | Direct default product normalization | EB-style `defaultProductsData` with selected product | Normalized default item contains product id, variant id, title, price, image, quantity | Seeds full-page direct defaults from the durable runtime payload. |
| 10 | Direct default merge | Step product list excludes default product | Default product is merged into step data for totals/cart lookup | Lets a preselected product count for discount/cart totals even when absent from the active step products. |
| 11 | Exact step validation message | Step condition `is = 2`, one manually selected product, one direct default product | Validation returns `Add exactly 2 products on this step` | Matches EB: direct defaults count toward discount/cart, but exact step validation requires explicit step selections. |
| 12 | Step-level auto-next predicate | Step condition quantity reached and `autoNextStepOnConditionMet=true` | Auto-next predicate resolves true | Persists EB's step-rule auto-next behavior independently from category auto-next. |
| 13 | Add-on step after multiple paid steps | Current mobile step is before another paid step and an add-on step exists later | Summary CTA targets the next paid step, not the add-on step | Prevents the visible mobile footer from skipping locked paid steps. |
| 14 | Standard and Classic expanded tray scroll | Expanded compact mobile summary tray for `STANDARD` or `CLASSIC` | Body scroll-lock class is toggled off | Matches EB evidence that expanded Standard/Classic footer remains sticky without locking page scroll. |
| 15 | Timestamped Chrome async subtitle leak | Step `pageTitle` is `Chrome async 08:17:02` | Content subtitle is suppressed | Prevents accidental debug text from rendering in the storefront header. |

## Acceptance Criteria

- [x] The new unit test fails before implementation.
- [x] The new unit test passes after implementation.
- [x] No CSS, class-name, source-order, or visual-placement assertions are added.
