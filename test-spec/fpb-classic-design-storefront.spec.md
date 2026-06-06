# Test Spec: FPB Classic Design Storefront
**Spec ID:** fpb-classic-design-storefront  **Issue:** [fpb-classic-desktop-parity-2], [fpb-classic-mobile-parity-3]  **Created:** 2026-06-04

## Purpose
Verify the FPB Classic Design storefront template renders EB-style `FBP_SIDE_FOOTER` + `CLASSIC` layout without regressing Standard, Compact, or Horizontal presets.

## Test Cases
### FullPageClassicDesignTemplate
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Classic Design template contract | `bundle-widget-full-page.js` and generated runtime styles | CLASSIC preset uses EB-matched product area, pill category tabs, product cards, sidebar/footer, and mobile behavior | Test values must come from live EB inspection |
| 2 | Preset isolation | `bundle-widget-full-page.js` | CLASSIC runtime styles remain scoped and do not override DEFAULT, COMPACT, or HORIZONTAL selectors | Prevents preset regression |
| 3 | Build output contract | `scripts/build-widget-bundles.js` and generated widget assets | Full-page widget bundle includes Classic Design changes after build | Deployable asset parity |
| 4 | Desktop card geometry | `classic-template.js` runtime CSS | Classic product card content stays inside the measured EB 4-column card and uses the 35px icon add button | Prevents product text/action overflow |
| 5 | Desktop sidebar behavior | `renderSidePanel()` with CLASSIC preset | Classic uses the EB-style desktop sidebar branch, keeps the four-row summary grid, updates selected rows on add, and restores empty slots on remove | Matches EB sidebar state transitions |
| 6 | Mobile card and grid geometry | `classic-template.js` runtime CSS at max-width 767px | Classic mobile uses EB's 370px rail, two 177.5px columns, 177.5×263 cards, `150px 41px 40px` rows, and static 35px add CTA | Prevents compact inherited mobile card overflow |
| 7 | Mobile expandable footer geometry | `bundle-widget-full-page.js` and Classic runtime CSS | Classic mobile summary tray receives a preset class and expanded state uses EB's 361.5px footer with 168.906px bundle list and 38px action row | Matches EB count-badge expansion behavior |

## Acceptance Criteria
- [x] Focused Jest contract test fails before implementation and passes after.
- [x] Raw full-page widget syntax check passes.
- [x] Widget assets are rebuilt and CSS assets remain under Shopify size limits.
- [x] Chrome desktop hard reload confirms `3.0.14`, Classic preset, add/remove sidebar behavior, and empty-slot restoration.
- [ ] Chrome mobile hard reload confirms updated widget version, Classic preset, EB-matched grid/card geometry, and collapsed/expanded footer behavior.
