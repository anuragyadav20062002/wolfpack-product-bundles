# Test Spec: FPB Classic Design Storefront
**Spec ID:** fpb-classic-design-storefront  **Issue:** [fpb-classic-design-storefront-parity-1]  **Created:** 2026-06-04

## Purpose
Verify the FPB Classic Design storefront template renders EB-style `FBP_SIDE_FOOTER` + `CLASSIC` layout without regressing Standard, Compact, or Horizontal presets.

## Test Cases
### FullPageClassicDesignTemplate
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Classic Design template contract | `bundle-widget-full-page.js` and generated runtime styles | CLASSIC preset uses EB-matched product area, pill category tabs, product cards, sidebar/footer, and mobile behavior | Test values must come from live EB inspection |
| 2 | Preset isolation | `bundle-widget-full-page.js` | CLASSIC runtime styles remain scoped and do not override DEFAULT, COMPACT, or HORIZONTAL selectors | Prevents preset regression |
| 3 | Build output contract | `scripts/build-widget-bundles.js` and generated widget assets | Full-page widget bundle includes Classic Design changes after build | Deployable asset parity |

## Acceptance Criteria
- [x] Focused Jest contract test fails before implementation and passes after.
- [x] Raw full-page widget syntax check passes.
- [x] Widget assets are rebuilt and CSS assets remain under Shopify size limits.
