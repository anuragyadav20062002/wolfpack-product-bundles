# Test Spec: FPB Compact Design Storefront
**Spec ID:** fpb-compact-design-storefront  **Issue:** [fpb-compact-design-storefront-parity-1]  **Created:** 2026-06-04

## Purpose
Verify the FPB Compact Design storefront template renders the EB-style `FBP_SIDE_FOOTER` + `COMPACT` layout without regressing Standard, Classic, or Horizontal presets.

## Test Cases
### FullPageWidgetTemplateLayout
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Compact desktop layout | `bundle-widget-full-page.js` | COMPACT injects runtime styles for a centered 1536px root, 0.6/0.4 two-column body, 30px column gap, 3-column responsive product grid, capped 352px cards, capped 240px image rows, and 466px+ side panel width | Live EB desktop/wide proof |
| 2 | Compact card controls | `bundle-widget-full-page.js` | COMPACT uses icon CTA mode with 35px square black plus buttons | Matches EB Compact product cards |
| 3 | Compact mobile layout | `bundle-widget-full-page.js` | COMPACT uses the compact mobile summary tray and 2-column 177.5px product card geometry | Live EB mobile proof |
| 4 | Preset isolation | `bundle-widget-full-page.js` | COMPACT runtime selectors remain scoped and do not override STANDARD, CLASSIC, or HORIZONTAL selectors | Prevents preset regression |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Widget source syntax check passes
- [x] Widget assets are rebuilt and minified
