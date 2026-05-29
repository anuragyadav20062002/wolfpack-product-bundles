# Test Spec: Discount Rule Row Layout

**Spec ID:** discount-rule-row  **Issue:** [feedback-jun26-4]  **Created:** 2026-05-29

## Purpose

Lock in the CSS grid contract for the discount rule body row in the FPB and PPB configure pages so the three dropdowns (Discount on / threshold / discount value) stay side-by-side at typical admin widths and don't regress to vertical stacking.

## Test Cases

### CSS contract — `app/styles/routes/bundle-configure-shared.module.css`

| # | Scenario | Assertion |
|---|---|---|
| 1 | `.discountFieldsRow` is a 3-col grid | Rule contains `display: grid` AND `grid-template-columns: 1fr 1fr 1fr` |
| 2 | `.discountFieldsRow` aligns fields to baseline | Rule contains `align-items: end` |
| 3 | `.discountFieldsRow` has a gap | Rule contains `gap: 8px` (or larger) |
| 4 | `.discountFieldsRowPair` is a 2-col grid for FIXED_BUNDLE_PRICE | Rule contains `display: grid` AND `grid-template-columns: 1fr 1fr` |
| 5 | Both rows collapse to single column on narrow viewports | A `@media (max-width: 700px)` rule sets `grid-template-columns: 1fr` for both classes |

### JSX usage — FPB + PPB configure routes

| # | Scenario | Assertion |
|---|---|---|
| 6 | FPB FIXED_BUNDLE_PRICE branch uses `.discountFieldsRowPair` | Source slice within the `DiscountMethod.FIXED_BUNDLE_PRICE` ternary contains `discountFieldsRowPair` |
| 7 | FPB PERCENTAGE_OFF / FIXED_AMOUNT_OFF branch uses `.discountFieldsRow` | Source slice within the else branch contains `discountFieldsRow` |
| 8 | PPB FIXED_BUNDLE_PRICE branch uses `.discountFieldsRowPair` | Same as #6 for PPB |
| 9 | PPB PERCENTAGE_OFF / FIXED_AMOUNT_OFF branch uses `.discountFieldsRow` | Same as #7 for PPB |
| 10 | No `<s-stack direction="inline"` remains inside the FPB discount rule body | The discount block does not contain `direction="inline"` |
| 11 | No `<s-stack direction="inline"` remains inside the PPB discount rule body | Same as #10 for PPB |

## Acceptance Criteria

- [ ] All 11 test cases pass
- [ ] No ESLint errors introduced
- [ ] Visual confirmation at desktop width (≥ 1024px): three dropdowns inline; at mobile (≤ 700px): stacked
