# Test Spec: FPB Standard Design Storefront
**Spec ID:** fpb-standard-design-storefront  **Issue:** [fpb-standard-design-storefront-parity-1]  **Created:** 2026-06-04

## Purpose
Verify the FPB Standard Design storefront template renders the app-canonical `FBP_SIDE_FOOTER` + `STANDARD` layout without regressing other FPB presets.

## Test Cases
### FullPageStandardDesignTemplate
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Standard Design template contract | `bundle-widget-full-page.js` and `bundle-widget-full-page.css` | STANDARD preset uses matched product area, category tabs, product cards, sidebar/footer, and mobile behavior | Test values updated after Standard preset canonicalization |
| 2 | Preset isolation | `bundle-widget-full-page.css` | STANDARD rules remain scoped and do not override CLASSIC, COMPACT, or HORIZONTAL selectors | Prevents preset regression |
| 3 | Build output contract | `scripts/build-widget-bundles.js` and generated widget assets | Full-page widget bundle includes Standard Design changes after build | Deployable asset parity |
| 4 | Responsive desktop sizing | 1280px viewport | STANDARD desktop body columns scale to the same target ratio instead of fixed `993px 447px`; product grid uses three container-responsive columns | Captured from live audit |
| 5 | Standard step timeline contract | `bundle-widget-full-page.js` and Standard runtime styles | Timeline uses a centered grid, 40px image nodes, active 4px black border, inactive 2px `rgb(212,213,214)` border, one absolute 6px progress rail, and EB label typography | Captured from reset live EB Standard storefront on 2026-06-05 |
| 6 | Standard step timeline responsive contract | Desktop 1280px and mobile 390px viewports | Timeline is 60% width with `16px/28.8px` labels on desktop, near full width with `12px/21.6px` labels on mobile | The same renderer must support arbitrary step counts |
| 7 | Standard product card/grid contract | `standard-template.js` runtime styles | Desktop card/grid matches EB: 3 responsive columns, 15px gap, 352px cards, 240px image row, 40px title row, 40px action row, 35px icon CTA | Captured from reset live EB Standard storefront on 2026-06-05 |
| 8 | Standard mobile card/grid contract | 390px mobile viewport | Two 177.5px cards with 15px gap, 264px card height, 150px image row, 42px title row, 40px action row, icon-only CTA | Prevents mobile title clipping and text CTA regressions |
| 9 | Standard text-button setting conflict | `Show Text on + Button` enabled | Standard card internals still use EB icon CTA geometry: content wrapper spans the two lower grid rows, title and action rows stay card-width, and CTA remains `35px x 35px` | Captured from post-deploy WPB live storefront on 2026-06-05 |
| 10 | Standard mobile product-grid width | 390px mobile viewport | Root padding is not doubled; product grid is 370px wide with two 177.5px cards and 15px gap | Captured from post-deploy WPB live storefront on 2026-06-05 |
| 11 | Standard expanded variant card title | `displayVariantsAsIndividualProducts` category | Variant cards render the parent product title and variant title as EB-style title lines, while the separate variant badge stays hidden | Captured from live EB Standard Category 2 on 2026-06-05 |
| 12 | Standard category accordion behavior | Category tab click on desktop and mobile | Active category appears as a flat section heading and inactive categories render as full-width flat collapsed rows with a right 20px chevron, not boxed buttons | Captured from live EB Standard desktop/mobile category click states |
| 13 | Standard mobile footer contract | 390px mobile viewport | Footer is an EB sticky `370px x 195.5625px` white tray, with a hidden-overflow `126.5625px` discount area above a `360px x 38px` black `Next • total` button with 5px radius | Captured from live EB Standard mobile footer |
| 14 | Standard desktop summary sidebar contract | 1280px desktop viewport | Right summary uses EB title typography, compact total/button row, 157px x 41px black `Next` button, and 5px radius | Captured from live EB Standard desktop sidebar/footer column |
| 15 | Standard timeline icon opacity and stacking | Desktop and mobile timeline | Step icons stay fully opaque in all states, generic locked/included opacity does not apply, and the rail sits behind an opaque white 40px icon circle without showing through the icon | User-reported post-slice gap |
| 16 | Discount progress bar visual modes | `simple` and `step_based` progress types | Both modes use EB progress colors: empty `#C1E7C5`, filled `#15A524`, stable 6px rounded tracks, and no minimum fake fill when progress is 0 | User-reported post-slice gap |
| 17 | Standard desktop empty summary sidebar | No selected products on desktop | Summary card keeps EB geometry: visible Clear, no WPB tier/add-on blocks, two empty skeleton rows inside the product container, `0 item(s)`, black `Next`, and stable total row | Captured from live EB Standard desktop on 2026-06-05 |
| 18 | Standard timeline add/remove behavior | Add one product, Next, remove product | Adding updates sidebar item/discount count without filling the step rail; Next can change the product view while timeline visual state remains stable for the reset EB bundle; removing returns to skeleton rows and `0 item(s)` | Captured from live EB Standard desktop interactions on 2026-06-05 |
| 19 | Standard deployed empty-sidebar hard-reload regression | Live WPB `3.0.6` reviewed after Cache Storage clear and `ignoreCache` hard reload | Standard desktop sidebar rule beats icon-mode specificity, uses EB `639.766px` height, places count/products/action in fixed grid rows, and renders `0 item(s)` | Captured from Chrome hard-reload review on 2026-06-05 |
| 20 | Standard desktop content/sidebar track parity | Live WPB `3.0.7` reviewed after Cache Storage clear and `ignoreCache` hard reload | Standard sidebar uses EB one-column `324.266px` internal grid and outer `calc(100% - 381.266px) 366.266px` tracks so the layout resolves close to EB `813.938px 366.266px`, not `332.938px 697.266px` | Captured from Chrome hard-reload desktop review on 2026-06-05 |
| 21 | Standard product title overflow parity | Live WPB `3.0.8` and EB reviewed after Cache Storage clear and `ignoreCache` hard reload | Product titles keep EB fixed title rows but use visible overflow so two-line names with `22px` desktop line-height are not clipped by the `40px` title row | User-reported card name cut on 2026-06-05 |
| 22 | Standard mobile product-card overflow parity | Live WPB `3.0.9` and EB reviewed on 390px mobile after Cache Storage clear and `ignoreCache` hard reload | Mobile product cards keep `177.5px x 264px` geometry but use EB-style visible card overflow, while product images keep their own rounded clipping | Captured from mobile-only parity pass on 2026-06-05 |
| 23 | Standard mobile footer sticky parity | Live WPB `3.0.9` and EB reviewed on 390px mobile after Cache Storage clear and `ignoreCache` hard reload | Mobile footer uses EB sticky positioning, `195.5625px` tray height, `126.5625px` hidden-overflow discount area, and unchanged `360px x 38px` button geometry | User identified mobile footer as most critical |

## Acceptance Criteria
- [x] Focused Jest contract test fails before implementation and passes after.
- [x] Raw full-page widget syntax check passes.
- [x] Widget assets are rebuilt and CSS assets remain under Shopify size limits.
- [x] Standard step timeline source-contract test fails before implementation and passes after.
- [x] Standard product card/grid source-contract test fails before implementation and passes after.
- [x] Standard text-button setting conflict source-contract test fails before implementation and passes after.
- [x] Standard mobile product-grid width source-contract test fails before implementation and passes after.
- [x] Standard expanded variant card source-contract test fails before implementation and passes after.
- [x] Standard category accordion source-contract test fails before implementation and passes after.
- [x] Standard mobile footer source-contract test fails before implementation and passes after.
- [x] Standard desktop sidebar source-contract test fails before implementation and passes after.
- [x] Standard timeline opaque icon source-contract test fails before implementation and passes after.
- [x] Simple and step-based progress bar source-contract test fails before implementation and passes after.
- [x] Standard desktop empty summary sidebar source-contract test fails before implementation and passes after.
- [x] Standard timeline add/remove behavior source-contract test fails before implementation and passes after.
- [x] Standard deployed empty-sidebar hard-reload regression source-contract test fails before implementation and passes after.
- [x] Standard desktop content/sidebar track parity source-contract test fails before implementation and passes after.
- [x] Standard mobile product-card overflow source-contract test fails before implementation and passes after.
- [x] Standard mobile footer sticky source-contract test fails before implementation and passes after.
