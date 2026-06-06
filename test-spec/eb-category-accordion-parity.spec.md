# Test Spec: EB Category Accordion Parity
**Spec ID:** eb-category-accordion-parity  **Issue:** [eb-category-accordion-parity-1]  **Created:** 2026-06-04

## Purpose
Lock FPB and PPB Step Setup category accordion UI to the screenshot-confirmed contract: single visible category input aligned to the bordered Multi Language action, centered Products/Collections tabs, icon-only header actions with tooltips, category rules configured in the Rules Configuration card, full-width Add Category/Add Rule actions, unlabeled Step Rules fields, and touched Polaris web component props avoid invalid values.

## Test Cases
### CategoryAccordionParityContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Screenshot category field row | FPB and PPB route source | Category text input, storefront helper, Multi Language action, Products tab, Collections tab render in the same order with no visible Category Title field | User provided screenshot as objective source of truth. |
| 2 | Category rules in Rules Configuration | FPB and PPB route source | Category rules UI and Add Rule controls exist after the Rules Configuration card boundary, not inside category accordion body | User clarified rule text and controls must leave the category accordion. |
| 3 | No invalid plain Polaris buttons in category body | FPB and PPB category body source | No `variant="plain"` remains inside the category accordion body | Custom buttons are allowed for EB parity. |
| 4 | Category rule persistence wiring | FPB and PPB route source | Rule controls still update `StepCategory[].conditions` and `autoNextStepOnConditionMet` | Keeps Admin-to-storefront contract intact. |
| 5 | Screenshot shared styles | Shared category CSS | Header/body radius, icon-only action button class, tab underline, dark count badge, compact primary button, and hidden field labels exist | Locks visible UI shape from screenshot. |
| 6 | Product and collection helper copy | FPB and PPB route source | Product and collection helper copy renders immediately above the picker buttons | Exact user-provided copy. |
| 7 | FPB and PPB variant checkbox | FPB and PPB route source | Variant checkbox exists outside the category accordion before Rules Configuration; PPB writes `displayVariantsAsIndividualProducts` to every category and FPB keeps `displayVariantsAsIndividual` | Mirrors EB presence for both bundle types. |
| 8 | Full-width add actions | Shared styles and route source | Add Category and Add Rule use the full-width add action style; Add Category is followed by a divider before the variant checkbox | Matches requested layout. |
| 9 | Unlabeled Step Rules fields | FPB and PPB route source | Step Rules Type, Condition, and Value fields use accessible labels only and no visible field labels | User requested labels removed from Step Rules. |

## Acceptance Criteria
- [x] Focused contract tests fail before implementation and pass after.
- [x] Modified route files lint with zero ESLint errors.
- [x] Build completes or any unrelated blocker is documented.
