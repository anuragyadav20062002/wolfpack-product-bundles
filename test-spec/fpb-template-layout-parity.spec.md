# Test Spec: FPB Template Layout Parity
**Spec ID:** fpb-template-layout-parity  
**Issue:** [fpb-fresh-template-parity-1]  
**Created:** 2026-06-04

## Purpose
Verify fresh FPB storefront templates match EB landing-page layout behavior across desktop and mobile, starting with the shared sidebar layout contract used by Standard, Classic, Compact, and Horizontal presets.

## Test Cases
### Sidebar Layout Fill
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Desktop sidebar layout content column | 1280px viewport, FPB `HORIZONTAL` preset, multi-step bundle with categories | `.sidebar-content` fills the first grid column; product grid width is within 5% of EB's corresponding content column | EB measured `767px` content column at 1280px viewport for Horizontal |
| 2 | Desktop sidebar panel column | 1280px viewport, FPB `HORIZONTAL` preset | Sidebar panel occupies the second grid column and aligns with the content column top | EB measured `413px` sidebar column at 1280px viewport |
| 3 | Desktop product cards | 1280px viewport, FPB `HORIZONTAL` preset | Horizontal product cards render in two columns and use product imagery instead of placeholders when product-level imagery exists | EB cards render two columns and product image uses `object-fit: cover` |
| 4 | Mobile layout | 390px viewport, each FPB preset | Mobile layout remains single-column with mobile summary behavior and no horizontal overflow | Required regression pass after desktop layout fix |
| 5 | Mobile side-footer product cards | DevTools mobile viewport, Standard/Classic/Compact presets | Product grid uses EB mobile lane (`x=10`, `w=465` at 500px rendered viewport), cards are `225x245`, product images are `209x150` | EB Compact mobile reference measured from live storefront |
| 6 | Horizontal mobile lane | DevTools mobile viewport, Horizontal preset | Product grid and one-column cards use EB-width mobile lane and no runtime style block is injected | Horizontal runtime styles were moved to static CSS |

## Acceptance Criteria
- [x] Chrome desktop measurements for WPB align with EB within the documented tolerance.
- [x] Chrome mobile smoke pass shows no horizontal overflow.
- [x] Raw FPB CSS source and minified extension CSS are rebuilt.
- [x] Relevant lint/build checks pass before commit.
