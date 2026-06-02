# Test Spec: PPB In-page Category Tabs Runtime Contract
**Spec ID:** ppb-inpage-category-tabs  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Ensure Product Page Bundle in-page templates follow EB's category-tab storefront behavior by rendering tabs from `step.categories` and filtering visible products by active category.

## Test Cases
### ProductPageWidget
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Category tab renderer exists | Raw widget JS | Widget has `_createInpageCategoryTabs` and `activeInpageCategoryIndexes` | EB CASCADE/COGNIVE show category tabs |
| 2 | Labels come from consumed category data | Raw widget JS | Widget uses category title/name and only falls back to `Category n` when labels are absent | Avoids fabricated merchant copy when DTO contains labels |
| 3 | Active category filters products | Raw widget JS | Widget filters expanded products by category product IDs | Prevents all categories rendering at once |
| 4 | EB visual tab state exists | Raw widget CSS | Active tab uses black background and white text | Matches EB active pill behavior |

## Acceptance Criteria
- [ ] Product-page widget source exposes category tabs for PPB in-page templates.
- [ ] Product-page widget source tracks the active category per step.
- [ ] Product-page widget source filters products by active category product IDs.
- [ ] Product-page widget CSS includes EB-style active/inactive tab states.
