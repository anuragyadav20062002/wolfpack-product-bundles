# Test Spec: PPB Category-Scoped Variants

**Spec ID:** ppb-category-scoped-variants **Created:** 2026-07-13

## Purpose

Ensure Product Page Bundle category filtering preserves the variants explicitly
configured for that category instead of re-expanding the hydrated parent product
to every storefront variant.

## Test Cases

### ProductPageLayoutShellMethods

| #   | Scenario                             | Input                                                                                                | Expected Output                                                                                               | Notes                    |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1   | Category selects one product variant | Hydrated grouped product has variants `6` and `10`; active category product stores only variant `10` | Filtered product contains only variant `10` and uses it as card identity without mutating the hydrated source | Vertical Slots C09       |
| 2   | Category stores no variant subset    | Hydrated grouped product has variants; active category product has an empty variants array           | All hydrated variants remain available                                                                        | Empty means unrestricted |

## Acceptance Criteria

- [ ] Category-scoped variant IDs filter grouped modal and in-page product data.
- [ ] The surviving variant becomes the card's selected variant identity.
- [ ] Categories without an explicit variant subset retain all hydrated variants.
- [ ] Focused unit tests and direct Chrome DevTools desktop/mobile verification pass.
