# Test Spec: PPB Template Layout Parity
**Spec ID:** ppb-template-layout-parity
**Issue:** [ppb-fresh-template-parity-1]
**Created:** 2026-06-04

## Purpose
Verify fresh PPB storefront templates match EB Product Page Bundle layout behavior across desktop and mobile for Product List, Product Grid, Horizontal Slots, and Vertical Slots.

## Test Cases
### Product Page Template Layout
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product List desktop | 1280px viewport, `PDP_INPAGE` + `CASCADE`, fresh multi-category PPB | Product list, category navigation, and footer/sidebar geometry align to measured EB Product List output | Requires live EB metric capture |
| 2 | Product Grid desktop | 1280px viewport, `PDP_INPAGE` + `COGNIVE`, fresh multi-category PPB | Product grid cards, spacing, and responsive container sizing align to measured EB Product Grid output | Verified at 425.66px widget container: two 197.33px columns, no horizontal overflow |
| 3 | Horizontal Slots desktop | 1280px viewport, `PDP_MODAL` + `MODAL`, fresh multi-category PPB | Modal trigger, filled slot row, product picker layout, and footer action geometry align to measured EB Horizontal Slots output | Slot orientation is runtime-setting-sensitive |
| 4 | Vertical Slots desktop | 1280px viewport, `PDP_MODAL` + `SIMPLIFIED`, fresh multi-category PPB | Modal trigger, filled slot stack, product picker layout, and footer action geometry align to measured EB Vertical Slots output | EB notes say template ID alone is not the only visual driver |
| 5 | Mobile layout | Mobile viewport, every supported PPB template | Template remains container responsive, does not overflow horizontally, and preserves EB mobile card/slot/action geometry | COGNIVE verified at 390px emulation: two 163.5px columns, no horizontal overflow |
| 6 | Product and variant imagery | Fresh PPB with multi-variant products | Variant-expanded cards use correct product/variant images and do not show placeholder boxes when product imagery exists | Known recurring storefront gap |

## Acceptance Criteria
- [x] Chrome desktop measurements for WPB align with EB within documented tolerance.
- [x] Chrome mobile smoke pass shows no horizontal overflow for the changed COGNIVE template.
- [x] PPB raw JS source and generated extension JS are unchanged; no JS rebuild required.
- [x] Product-page CSS source and minified extension CSS are rebuilt.
- [x] Relevant lint/build checks pass before commit.
