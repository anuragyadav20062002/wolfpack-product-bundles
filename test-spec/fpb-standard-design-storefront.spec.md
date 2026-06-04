# Test Spec: FPB Standard Design Storefront
**Spec ID:** fpb-standard-design-storefront  **Issue:** [fpb-template-deep-parity-audit-1]  **Created:** 2026-06-04

## Purpose
Verify the FPB Standard Design storefront template renders EB-style `FBP_SIDE_FOOTER` + `DEFAULT` layout without regressing other FPB presets.

## Test Cases
### FullPageStandardDesignTemplate
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Standard Design template contract | `bundle-widget-full-page.js` and `bundle-widget-full-page.css` | DEFAULT preset uses EB-matched product area, category tabs, product cards, sidebar/footer, and mobile behavior | Test values updated from live EB inspection |
| 2 | Preset isolation | `bundle-widget-full-page.css` | DEFAULT rules remain scoped and do not override CLASSIC, COMPACT, or HORIZONTAL selectors | Prevents preset regression |
| 3 | Build output contract | `scripts/build-widget-bundles.js` and generated widget assets | Full-page widget bundle includes Standard Design changes after build | Deployable asset parity |
| 4 | Responsive desktop sizing | 1280px viewport | DEFAULT desktop body columns scale to the same EB ratio instead of fixed `993px 447px`; product grid uses three container-responsive columns | Captured from live EB deep audit |

## Acceptance Criteria
- [x] Focused Jest contract test fails before implementation and passes after.
- [x] Raw full-page widget syntax check passes.
- [x] Widget assets are rebuilt and CSS assets remain under Shopify size limits.
