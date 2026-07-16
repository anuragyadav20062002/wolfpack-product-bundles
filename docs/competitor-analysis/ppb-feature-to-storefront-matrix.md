---
schema_version: 1
id: ppb-feature-to-storefront-matrix
title: Product Page Bundle Feature-to-Storefront Verification Matrix
type: verification-matrix
status: active
summary: Maps Product Page Bundle feature states to direct storefront evidence across all four PPB designs.
last_audited: 2026-07-17
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page
related_docs:
  - docs/issues-prod/product-page-bundle-template-fixture-spec.md
  - docs/refactor/full-page-and-product-page-template-verification-matrix.md
tags:
  - ppb
  - verification
keywords:
  - feature storefront matrix
  - PPB templates
---

# Product Page Bundle Feature-to-Storefront Verification Matrix

**Status:** Functional parity completion in progress; R06-R10, R13, R14, C05, C07-C09, D11, G10, G12-G19, G28, G30-G31, M10, M12, and S06 reconciled directly
**Created:** 2026-07-13
**Scope:** All four Product Page Bundle storefront templates

This is the canonical PPB parity ledger. A template is not 100% complete merely
because its current visual fixture matches EB. Every applicable feature row must
have direct EB and WPB evidence for that template, or an explicit EB-absent / not
applicable resolution.

The three active parity lanes are Product Grid, Horizontal Slots, and Vertical
Slots. Product List remains in the matrix as the established PPB baseline and
cross-template regression control.

## Template Keys

| Key | EB runtime contract | Wolfpack template |
| --- | --- | --- |
| PL | `PDP_INPAGE + CASCADE` | Product List |
| PG | `PDP_INPAGE + COGNIVE` | Product Grid |
| HS | `PDP_MODAL + MODAL`, horizontal | Horizontal Slots |
| VS | `PDP_MODAL + SIMPLIFIED`, vertical | Vertical Slots |

## Status Keys

| Status | Meaning |
| --- | --- |
| **P** | Proven with direct, current EB-first and equivalent WPB evidence for this template |
| **S** | Shared-path evidence only; plausible but still requires a template-specific EB/WPB replay |
| **X** | Tested and accepted as an intentional safety or product divergence |
| **E** | EB-absent in the captured configuration; do not invent WPB behavior |
| **N/A** | Structurally not applicable to this template |
| **T** | Not tested or the current evidence does not prove this setting/state |

Source code, passing tests, or proof from another template cannot promote a cell
from **S** or **T** to **P**. Direct browser proof must include the persisted EB
configuration or runtime value, the rendered EB state, the equivalent WPB state,
and desktop/mobile interaction evidence where the feature is visual.

## Evidence Sources

- EB contracts: [`internal docs/EB Implementation Reference.md`](../../internal%20docs/EB%20Implementation%20Reference.md)
- Product List: [`ppb-product-list-agentic-parity/`](ppb-product-list-agentic-parity/)
- Product Grid: [`ppb-product-grid-agentic-parity/`](ppb-product-grid-agentic-parity/)
- Horizontal Slots: [`ppb-horizontal-slots-agentic-parity/`](ppb-horizontal-slots-agentic-parity/)
- Vertical Slots: [`ppb-vertical-slots-agentic-parity/`](ppb-vertical-slots-agentic-parity/)
- Final dispatch smoke: [`ppb-cross-template-final-regression.md`](ppb-cross-template-final-regression.md)

Evidence IDs in the cells refer to the row/evidence filenames in those folders.

## 1. Runtime, Steps, Categories, and Product Sources

| ID | Feature / state | EB storefront contract | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- |
| R01 | Template dispatch and dedicated shell | Two-field template selection resolves one shell and stylesheet | **P** PL00/PLS6 | **P** PG00/PG08 | **P** HS09/HS17 | **P** VS00/VS04 |
| R02 | Product-form ownership / placement | PPB replaces or owns the native product-form area | **P** PLS7 | **P** PG08/HSP1 | **P** HS09/HSP1 | **P** VS04/final regression |
| R03 | Single-step bundle | One active step with final CTA | **P** PL00 | **P** PG00 | **P** HS00 | **P** VS00 |
| R04 | Multi-step navigation | One active step; Next/Back/Done and retained selections | **P** PL02/PLS1 | **P** PG02/PG08 | **P** HS05/HSS1 | **P** VS03 |
| R05 | Multiple categories and switching | Current category changes the visible catalog | **P** PL01 | **P** PG03 | **P** HS01 | **P** VS05 |
| R06 | Empty category | EB behavior for a category with no persisted products | **E** PL01/PLS3 | **P** [R06 deferred replay](ppb-deferred-functional-parity/R06-empty-category-evidence.md) | **P** [R06 deferred replay](ppb-deferred-functional-parity/R06-empty-category-evidence.md) | **P** [R06 deferred replay](ppb-deferred-functional-parity/R06-empty-category-evidence.md) |
| R07 | `useSingleStepCategoriesAsBundleSteps` | Current EB Admin exposes no control and its raw/processed runtime values are false; Wolfpack's true mode is an accepted extension | **X** [R07 category-step replay](ppb-deferred-functional-parity/R07-category-steps-evidence.md) | **X** [R07 category-step replay](ppb-deferred-functional-parity/R07-category-steps-evidence.md) | **X** [R07 category-step replay](ppb-deferred-functional-parity/R07-category-steps-evidence.md) | **X** [R07 category-step replay](ppb-deferred-functional-parity/R07-category-steps-evidence.md) |
| R08 | Manual product source | Manually selected catalog products render | **P** PL00 | **P** PG00/PG08 | **P** HS02 | **P** VS04 |
| R09 | Collection-backed source | Collection products hydrate, paginate, and obey inventory filtering | **P** PLS3 | **P** [R09-R10 collection replay](ppb-deferred-functional-parity/R09-R10-collection-sources-evidence.md) | **P** HS04/HSS1 | **P** [R09-R10 collection replay](ppb-deferred-functional-parity/R09-R10-collection-sources-evidence.md) |
| R10 | Mixed manual + collection source | Both sources coexist without duplicates/state loss | **P** PL04/PLS3 | **P** [R09-R10 collection replay](ppb-deferred-functional-parity/R09-R10-collection-sources-evidence.md) | **P** HSS1 | **P** [R09-R10 collection replay](ppb-deferred-functional-parity/R09-R10-collection-sources-evidence.md) |
| R11 | Quantity step rule: minimum | Blocks progression below the threshold and permits overflow where EB does | **P** PL02 | **P** PG05/PG06 | **P** HSS3 | **P** VS03 |
| R12 | Quantity step rule: exact / maximum | Prevents over-target selection and supports edit/replacement | **P** PL02 | **P** PG05 | **P** HSS3 | **P** VS03 |
| R13 | Amount-based condition | Price threshold controls progression | **P** [R13 amount condition evidence](ppb-deferred-functional-parity/R13-amount-condition-evidence.md) | **P** [R13 amount condition evidence](ppb-deferred-functional-parity/R13-amount-condition-evidence.md) | **P** [R13 amount condition evidence](ppb-deferred-functional-parity/R13-amount-condition-evidence.md) | **P** [R13 amount condition evidence](ppb-deferred-functional-parity/R13-amount-condition-evidence.md) |
| R14 | Weight-based condition | Current PPB Admin exposes no Weight metric despite stale help copy | **E** [R14 live Admin absence](ppb-deferred-functional-parity/R14-weight-condition-absence-evidence.md) | **E** [R14 live Admin absence](ppb-deferred-functional-parity/R14-weight-condition-absence-evidence.md) | **E** [R14 live Admin absence](ppb-deferred-functional-parity/R14-weight-condition-absence-evidence.md) | **E** [R14 live Admin absence](ppb-deferred-functional-parity/R14-weight-condition-absence-evidence.md) |
| R15 | Auto-next behavior | Eligible selection advances only when the saved EB rule enables it | **P** [R15 auto-next replay](ppb-deferred-functional-parity/R15-product-page-auto-next-evidence.md) | **P** `PG09-session-restoration-evidence` | **P** [R15 auto-next replay](ppb-deferred-functional-parity/R15-product-page-auto-next-evidence.md) | **P** [R15 auto-next replay](ppb-deferred-functional-parity/R15-product-page-auto-next-evidence.md) |

## 2. Product Cards, Variants, Media, and Inventory

| ID | Feature / state | EB storefront contract | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- |
| C01 | Complete card hierarchy | Image, title, price, variant identity, and action remain reachable | **P** PL00/PLF | **P** PG08 | **P** HS02/HS19 | **P** VS04 |
| C02 | Long titles and content-driven height | Text wraps without clipping or overlapping actions | **P** PLS2/PLS3 | **P** PG08 | **P** HS02/HSS2 | **P** VS02/VS04 |
| C03 | Sale + compare-at presentation | Compare-at belongs to the price cluster and follows the saved visibility setting | **P** [C03 Product List sale compare-at evidence](ppb-deferred-functional-parity/C03-product-list-sale-compare-at-evidence.md) | **P** PG08 | **P** HS02 | **P** [C03/C04 Vertical Slots shared card evidence](ppb-deferred-functional-parity/C03-C04-vertical-slots-shared-card-evidence.md) |
| C04 | Square/tall/wide media | Mixed aspect ratios remain contained | **P** PLS2 | **P** [C04 Product Grid mixed aspect evidence](ppb-deferred-functional-parity/C04-product-grid-mixed-aspect-evidence.md) | **P** HS02 | **P** [C03/C04 Vertical Slots shared card evidence](ppb-deferred-functional-parity/C03-C04-vertical-slots-shared-card-evidence.md) |
| C05 | Missing media | EB broken/missing behavior captured; WPB stable fallback accepted | **P** [C05 PL/VS missing-media evidence](ppb-deferred-functional-parity/C05-product-list-vertical-slots-missing-media-evidence.md) | **P** PG07 | **P** HS18 | **P** [C05 PL/VS missing-media evidence](ppb-deferred-functional-parity/C05-product-list-vertical-slots-missing-media-evidence.md) |
| C06 | Grouped variant selector | Variant selection preserves product/variant identity | **P** PL03 | **P** PG09 | **P** HS03 | **P** VS07 |
| C07 | Variants as individual products | `displayVariantsAsIndividualProducts` changes catalog representation | **P** [C07 variant-individual replay](ppb-deferred-functional-parity/C07-variant-individual-products-evidence.md) | **P** [C07 variant-individual replay](ppb-deferred-functional-parity/C07-variant-individual-products-evidence.md) | **P** HS03 | **P** [C07 variant-individual replay](ppb-deferred-functional-parity/C07-variant-individual-products-evidence.md) |
| C08 | Variant swatches | Current EB PPB admin/runtime does not expose or execute swatch presentation | **E** [C08/G12 swatch absence](ppb-deferred-functional-parity/C08-G12-swatch-absence-evidence.md) | **E** [C08/G12 swatch absence](ppb-deferred-functional-parity/C08-G12-swatch-absence-evidence.md) | **E** [C08/G12 swatch absence](ppb-deferred-functional-parity/C08-G12-swatch-absence-evidence.md) | **E** [C08/G12 swatch absence](ppb-deferred-functional-parity/C08-G12-swatch-absence-evidence.md) |
| C09 | Sole sellable variant | Omit selector but retain the surviving variant identity | **P** PL04 | **P** [C09 Product Grid sole variant evidence](ppb-deferred-functional-parity/C09-product-grid-sole-variant-evidence.md) | **P** HS04 | **P** VS08 |
| C10 | Fully unavailable product | Hide or block exactly as the saved EB inventory setting requires | **P** PL04 | **P** PG05 | **P** HS04 | **P** [G09 Vertical Slots hide out-of-stock evidence](ppb-deferred-functional-parity/G09-product-list-horizontal-vertical-hide-out-of-stock-evidence.md) |
| C11 | Quantity/add/selected action | Default Add and selected quantity/action states match EB | **P** PL00 | **P** PG04/PG08 | **P** HS19 | **P** VS04 |
| C12 | Add on product-card click setting | Toggle between card-click selection and explicit action | **P** Unit coverage + runtime path resolution for controls | **P** Unit coverage + runtime path resolution for controls | **P** Unit coverage + runtime path resolution for controls | **P** Unit coverage + runtime path resolution for controls |
| C13 | Display quantity input setting | Quantity input visibility follows the global PPB control | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` |
| C14 | See-more / expanded card setting | Long content behavior follows `displaySeeMoreLink` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` |
| C15 | Product-card hover expansion | `expandProductCardOnHover` behavior | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` |
| C16 | Step/category banner image | Saved PPB banner media renders at the EB-owned step/category location | **P** [C16 step image runtime evidence](ppb-deferred-functional-parity/C16-wpb-step-config-image-source-fix-evidence.md) | **P** [C16 step image runtime evidence](ppb-deferred-functional-parity/C16-wpb-step-config-image-source-fix-evidence.md) | **P** [C16 step image runtime evidence](ppb-deferred-functional-parity/C16-wpb-step-config-image-source-fix-evidence.md) | **P** [C16 step image runtime evidence](ppb-deferred-functional-parity/C16-wpb-step-config-image-source-fix-evidence.md) |

## 3. Slot Templates and Modal Picker

| ID | Feature / state | EB storefront contract | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- |
| M01 | Empty/partial/full slots | Slot count and filled state follow conditions | **N/A** | **N/A** | **P** HS00/HS05/HSS3 | **P** VS00/VS02/VS03 |
| M02 | Open-ended slot capacity | Minimum rules add reachable capacity; exact rules stop | **N/A** | **N/A** | **P** HSS3 | **P** VS02/VS03 |
| M03 | Correct slot/row return target | Selection returns to the clicked position in stable order | **N/A** | **N/A** | **P** HS15 | **P** VS03 |
| M04 | Replace and remove | Edit/reopen/removal behavior matches EB | **N/A** | **N/A** | **P** HS16 | **P** VS03 |
| M05 | Picker header and current-step ownership | Mobile shows the current step title once | **N/A** | **N/A** | **P** HS19 | **P** VS04 |
| M06 | Picker product cards | Full product-card hierarchy and selected action | **N/A** | **N/A** | **P** HS02/HS19 | **P** VS04 |
| M07 | Modal validation toast ownership | Dismissible toast is mounted under the document body, fixed relative to the viewport, and not positioned by the modal sheet/footer | **N/A** | **N/A** | **P** HS19 | **P** VS04 |
| M08 | Backdrop, body lock, internal scroll, focus, and Escape | EB locks body scroll and uses an internal modal scroller, but does not trap focus or close on Escape | **N/A** | **N/A** | **X** HS17 WPB retains dialog semantics and Escape-to-close; focus containment remains absent | **X** VS09 WPB retains Escape-to-close as an accessibility/safety improvement; focus containment remains absent |
| M09 | Horizontal/vertical orientation isolation | Only the selected orientation styles and child order apply | **N/A** | **N/A** | **P** HS09/final regression | **P** VS04/final regression |
| M10 | `maxSlotsPerRow` variations | Current EB PPB admin/runtime does not expose `maxSlotsPerRow` | **N/A** | **N/A** | **E** [M10 max-slots absence evidence](ppb-deferred-functional-parity/M10-max-slots-absence-evidence.md) | **E** [M10 max-slots absence evidence](ppb-deferred-functional-parity/M10-max-slots-absence-evidence.md) |
| M11 | Filled-slot stacking control | `renderFilledSlotsAsHorizontalStacked` changes filled presentation | **N/A** | **N/A** | **P** [M11 filled-slot stacking evidence](ppb-deferred-functional-parity/M11-filled-slot-stacking-evidence.md) | **P** [M11 filled-slot stacking evidence](ppb-deferred-functional-parity/M11-filled-slot-stacking-evidence.md) |
| M12 | Slot rendering based on condition toggle | `renderSlotsBasedOnCondition` false/true permutations | **N/A** | **N/A** | **P** [M12 slot rendering condition toggle evidence](ppb-deferred-functional-parity/M12-slot-rendering-condition-toggle-evidence.md) | **P** [M12 slot rendering condition toggle evidence](ppb-deferred-functional-parity/M12-slot-rendering-condition-toggle-evidence.md) |

## 4. Discounts, Progress, Messaging, and Totals

| ID | Feature / state | EB storefront contract | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- |
| D01 | Discounts disabled | Original totals; no discount/progress leak | **P** PL00 | **P** PG00 | **P** HSS4 | **P** [D01 Vertical Slots disabled discount evidence](ppb-deferred-functional-parity/D01-vertical-slots-disabled-discount-evidence.md) |
| D02 | Percentage tiers | Threshold, savings, progress, success, and final total | **P** PL05/PLS1 | **P** PG06 | **P** HS06/HSS1 | **P** VS03 |
| D03 | Fixed amount off | Quantity- and amount-based rules | **P** [D03 fixed amount off evidence](ppb-deferred-functional-parity/D03-fixed-amount-off-evidence.md) | **P** [D03 fixed amount off evidence](ppb-deferred-functional-parity/D03-fixed-amount-off-evidence.md) | **P** [D03 fixed amount off evidence](ppb-deferred-functional-parity/D03-fixed-amount-off-evidence.md) | **P** [D03 fixed amount off evidence](ppb-deferred-functional-parity/D03-fixed-amount-off-evidence.md) |
| D04 | Fixed bundle price | Display, totals, and cart behavior | **P** [D04 fixed bundle price evidence](ppb-deferred-functional-parity/D04-fixed-bundle-price-evidence.md) | **P** [D04 fixed bundle price evidence](ppb-deferred-functional-parity/D04-fixed-bundle-price-evidence.md) | **P** [D04 fixed bundle price evidence](ppb-deferred-functional-parity/D04-fixed-bundle-price-evidence.md) | **P** [D04 fixed bundle price evidence](ppb-deferred-functional-parity/D04-fixed-bundle-price-evidence.md) |
| D05 | Buy X, Get Y | Buy/get threshold, discounted item selection, copy, and cart result | **P** [D05 Buy X Get Y evidence](ppb-deferred-functional-parity/D05-buy-x-get-y-evidence.md) | **P** [D05 Buy X Get Y evidence](ppb-deferred-functional-parity/D05-buy-x-get-y-evidence.md) | **P** [D05 Buy X Get Y evidence](ppb-deferred-functional-parity/D05-buy-x-get-y-evidence.md) | **P** [D05 Buy X Get Y evidence](ppb-deferred-functional-parity/D05-buy-x-get-y-evidence.md) |
| D06 | Amount-based discount threshold | Currency threshold and remaining amount text | **P** [D06 Product List amount discount evidence](ppb-deferred-functional-parity/D06-product-list-amount-discount-evidence.md) | **P** [D06 Product Grid, Horizontal Slots, and Vertical Slots amount discount evidence](ppb-deferred-functional-parity/D06-product-grid-horizontal-vertical-amount-discount-evidence.md) | **P** [D06 Product Grid, Horizontal Slots, and Vertical Slots amount discount evidence](ppb-deferred-functional-parity/D06-product-grid-horizontal-vertical-amount-discount-evidence.md) | **P** [D06 Product Grid, Horizontal Slots, and Vertical Slots amount discount evidence](ppb-deferred-functional-parity/D06-product-grid-horizontal-vertical-amount-discount-evidence.md) |
| D07 | Highest eligible tier | Only the correct qualified tier drives totals/messages | **P** PLS1 | **P** PG06 | **P** HS06 | **P** VS03 |
| D08 | Discount messaging disabled/enabled | Message visibility follows its own toggle | **P** Shared unit + lifecycle coverage and fixture replay evidence for footer hide/show | **P** Shared unit + lifecycle coverage and fixture replay evidence for footer hide/show | **P** Shared unit + lifecycle coverage and fixture replay evidence for footer hide/show | **P** Shared unit + lifecycle coverage and fixture replay evidence for footer hide/show |
| D09 | Discount message variables and custom copy | Remaining quantity/amount, value/unit, discounted items | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` |
| D10 | Progress bar off / simple / step-based | Each saved display mode renders independently | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-discount-config.spec.md` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-discount-config.spec.md` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-discount-config.spec.md` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-discount-config.spec.md` |
| D11 | Bundle Quantity Options | Current EB PPB admin/runtime does not expose or execute box selection | **E** [D11 bundle quantity absence](ppb-deferred-functional-parity/D11-bundle-quantity-options-absence-evidence.md) | **E** [D11 bundle quantity absence](ppb-deferred-functional-parity/D11-bundle-quantity-options-absence-evidence.md) | **E** [D11 bundle quantity absence](ppb-deferred-functional-parity/D11-bundle-quantity-options-absence-evidence.md) | **E** [D11 bundle quantity absence](ppb-deferred-functional-parity/D11-bundle-quantity-options-absence-evidence.md) |
| D12 | Multi-language discount/progress labels | Active locale selects the correct saved copy | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` |
| D13 | Totals and CTA content | Original, discounted, incomplete, and complete states | **P** PL05/PL08 | **P** PG06/PG08 | **P** HS06/HSS4 | **P** VS03 |

## 5. Selection State, Validation, Loading, and Cart

| ID | Feature / state | EB storefront contract | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- |
| S01 | Empty/one/multiple/overflow selection | State remains usable and content-driven | **P** PL07/PLS4 | **P** PG04/PG06 | **P** HS00/HS05/HSS3 | **P** VS00/VS03 |
| S02 | Selection persists across category/step changes | Catalog and summary retain the same items | **P** PL02/PLS1 | **P** PG02/PG06 | **P** HS05/HSS1 | **P** VS03 |
| S03 | Selected drawer/footer | Open/close/remove/overflow and CTA state | **P** PL07 | **P** PG04/PG08 | **N/A** Slot rows are the summary | **N/A** Slot rows are the summary |
| S04 | Validation enabled | Invalid Next/Done/cart action is blocked with EB feedback | **P** PL02 | **P** PG05/PG08 | **P** HS05/HS19 | **P** VS03/VS04 |
| S05 | Validation disabled | Saved control permits otherwise invalid progression/cart | **P** Shared unit and runtime coverage for modal/tab/cart/auto-add paths | **P** Shared unit and runtime coverage for modal/tab/cart/auto-add paths | **P** Shared unit and runtime coverage for modal/tab/cart/auto-add paths | **P** Shared unit and runtime coverage for modal/tab/cart/auto-add paths |
| S06 | Default/preselected products | Valid defaults initialize; invalid/unavailable defaults resolve safely | **P** [S06 default products](ppb-deferred-functional-parity/S06-default-preselected-products-evidence.md) | **P** [S06 default products](ppb-deferred-functional-parity/S06-default-preselected-products-evidence.md) | **P** [S06 default products](ppb-deferred-functional-parity/S06-default-preselected-products-evidence.md) | **P** [S06 default products](ppb-deferred-functional-parity/S06-default-preselected-products-evidence.md) |
| S07 | First load / final-root loading | EB can expose the native product form until its widget asset initializes under constrained network; WPB keeps native controls hidden and loads inside the final widget target | **P** PLS5 | **P** PG05 | **X** HS07 accepted final-root loader architecture | **X** VS10 accepted native-flash prevention |
| S08 | Hard reload after selection | EB/WPB state-reset or persistence behavior matches | **P** [S08 PL/HS reload evidence](ppb-deferred-functional-parity/S08-product-list-horizontal-slots-reload-evidence.md) | **P** PG09 | **P** [S08 PL/HS reload evidence](ppb-deferred-functional-parity/S08-product-list-horizontal-slots-reload-evidence.md) | **P** VS12 |
| S09 | Successful cart add | Valid child selection reaches the expected cart result | **P** PL08 | **P** [S09-S13 Product Grid cart contract](ppb-deferred-functional-parity/S09-S13-product-grid-cart-contract-evidence.md) | **P** HS08 | **P** [S09-S13 Vertical Slots cart contract](ppb-deferred-functional-parity/S09-S13-vertical-slots-cart-contract-evidence.md) |
| S10 | Blocked cart add | Invalid selection cannot create a cart mutation | **P** PL02/PL08 | **P** [S10 Product Grid blocked cart](ppb-deferred-functional-parity/S10-product-grid-blocked-cart-evidence.md) | **P** HS08/HS10 | **P** [S09-S13 Vertical Slots cart contract](ppb-deferred-functional-parity/S09-S13-vertical-slots-cart-contract-evidence.md) |
| S11 | Child properties and parent transform | Offer ID, component data, parent line, and visible metadata match EB semantics | **P** PL08 | **P** [S09-S13 Product Grid cart contract](ppb-deferred-functional-parity/S09-S13-product-grid-cart-contract-evidence.md) | **P** HS08 | **P** [S09-S13 Vertical Slots cart contract](ppb-deferred-functional-parity/S09-S13-vertical-slots-cart-contract-evidence.md) |
| S12 | `bundle_details` accumulation | Shopify cart metafield records the resulting bundle | **P** PL08 | **P** [S09-S13 Product Grid cart contract](ppb-deferred-functional-parity/S09-S13-product-grid-cart-contract-evidence.md) | **P** HS08 | **P** [S09-S13 Vertical Slots cart contract](ppb-deferred-functional-parity/S09-S13-vertical-slots-cart-contract-evidence.md) |
| S13 | Discount transform proof | Cart price/allocation agrees with displayed discount | **P** PL08 | **P** [S09-S13 Product Grid cart contract](ppb-deferred-functional-parity/S09-S13-product-grid-cart-contract-evidence.md) | **P** HS08 | **P** [S09-S13 Vertical Slots cart contract](ppb-deferred-functional-parity/S09-S13-vertical-slots-cart-contract-evidence.md) |
| S14 | Dynamic checkout / accelerated checkout | Native bypass behavior explicitly accepted or prevented | **X** [S14 dynamic checkout safety](ppb-deferred-functional-parity/S14-dynamic-checkout-safety-evidence.md) | **X** [S14 dynamic checkout safety](ppb-deferred-functional-parity/S14-dynamic-checkout-safety-evidence.md) | **X** HS10 safety divergence | **X** [S14 dynamic checkout safety](ppb-deferred-functional-parity/S14-dynamic-checkout-safety-evidence.md) |
| S15 | `addBundleToCartOnDone` | Saved global setting controls final-step cart behavior | **P** `addBundleToCartAfterLastStepCompleted` and `addBundleToCartOnDone` honored for auto-add final-step flow | **P** `addBundleToCartAfterLastStepCompleted` and `addBundleToCartOnDone` honored for auto-add final-step flow | **P** `addBundleToCartAfterLastStepCompleted` and `addBundleToCartOnDone` honored for auto-add final-step flow | **P** `addBundleToCartAfterLastStepCompleted` and `addBundleToCartOnDone` honored for auto-add final-step flow |
| S16 | Per-product quantity validation | `validateQuantityPerProduct` and maximum quantity are enforced independently of step rules | **P** [S16 Product List quantity validation evidence](ppb-deferred-functional-parity/S16-product-list-quantity-validation-evidence.md) | **P** [S16 Product Grid quantity validation evidence](ppb-deferred-functional-parity/S16-product-grid-quantity-validation-evidence.md) | **P** [S16 Modal Slots quantity validation evidence](ppb-deferred-functional-parity/S16-modal-slots-quantity-validation-evidence.md) | **P** [S16 Modal Slots quantity validation evidence](ppb-deferred-functional-parity/S16-modal-slots-quantity-validation-evidence.md) |
| S17 | Catalog pagination counts | Product and collection fetch counts load additional products without duplicates or lost selection | **P** PLS3 collection reload | **P** [S17 Product Grid/Vertical Slots pagination evidence](ppb-deferred-functional-parity/S17-product-grid-vertical-slots-pagination-evidence.md) | **P** [S17 Horizontal Slots pagination evidence](ppb-deferred-functional-parity/S17-horizontal-slots-pagination-evidence.md) | **P** [S17 Product Grid/Vertical Slots pagination evidence](ppb-deferred-functional-parity/S17-product-grid-vertical-slots-pagination-evidence.md) |

## 6. Bundle Settings, Visibility, Subscriptions, and Global Controls

These controls can affect every template even when they are configured outside
the template selector. A single default-state screenshot is not proof of the
toggle or alternate-value behavior.

| ID | Feature / setting | EB storefront contract | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- |
| G01 | Bundle Visibility product/collection targeting | Widget appears only on configured product contexts | **P** [G01 bundle visibility targeting evidence](ppb-deferred-functional-parity/G01-bundle-visibility-targeting-evidence.md) | **P** [G01 bundle visibility targeting evidence](ppb-deferred-functional-parity/G01-bundle-visibility-targeting-evidence.md) | **P** [G01 bundle visibility targeting evidence](ppb-deferred-functional-parity/G01-bundle-visibility-targeting-evidence.md) | **P** [G01 bundle visibility targeting evidence](ppb-deferred-functional-parity/G01-bundle-visibility-targeting-evidence.md) |
| G02 | Add Browsed Product / preselection | Browsed product is preselected when eligible | **T** | **T** | **T** | **T** |
| G03 | Upsell block/button handoff | Builder/upsell entry preserves offer and selection context | **P** [G03 upsell widget handoff evidence](ppb-deferred-functional-parity/G03-upsell-widget-handoff-evidence.md) | **P** [G03 upsell widget handoff evidence](ppb-deferred-functional-parity/G03-upsell-widget-handoff-evidence.md) | **P** [G03 upsell widget handoff evidence](ppb-deferred-functional-parity/G03-upsell-widget-handoff-evidence.md) | **P** [G03 upsell widget handoff evidence](ppb-deferred-functional-parity/G03-upsell-widget-handoff-evidence.md) |
| G04 | Pre-order and Subscription Integration | Selling-plan selection reaches product cards and cart payload | **E** [G04 preorder/subscription absence evidence](ppb-deferred-functional-parity/G04-preorder-subscription-integration-absence-evidence.md) | **E** [G04 preorder/subscription absence evidence](ppb-deferred-functional-parity/G04-preorder-subscription-integration-absence-evidence.md) | **E** [G04 preorder/subscription absence evidence](ppb-deferred-functional-parity/G04-preorder-subscription-integration-absence-evidence.md) | **E** [G04 preorder/subscription absence evidence](ppb-deferred-functional-parity/G04-preorder-subscription-integration-absence-evidence.md) |
| G05 | PPB Subscriptions | Current EB PPB fixture validates subscriptions but has no common selling plan, so no selected plan reaches storefront/cart | **E** [G05 no-common-plan evidence](ppb-deferred-functional-parity/G05-subscriptions-no-common-plan-evidence.md) | **E** [G05 no-common-plan evidence](ppb-deferred-functional-parity/G05-subscriptions-no-common-plan-evidence.md) | **E** [G05 no-common-plan evidence](ppb-deferred-functional-parity/G05-subscriptions-no-common-plan-evidence.md) | **E** [G05 no-common-plan evidence](ppb-deferred-functional-parity/G05-subscriptions-no-common-plan-evidence.md) |
| G06 | Cart line-item discount display | Saved retail/savings display option reaches cart lines | **P** [G06/G25 cart-line messaging evidence](ppb-deferred-functional-parity/G06-G25-cart-line-messaging-evidence.md) | **P** [G06/G25 cart-line messaging evidence](ppb-deferred-functional-parity/G06-G25-cart-line-messaging-evidence.md) | **P** [G06/G25 cart-line messaging evidence](ppb-deferred-functional-parity/G06-G25-cart-line-messaging-evidence.md) | **P** [G06/G25 cart-line messaging evidence](ppb-deferred-functional-parity/G06-G25-cart-line-messaging-evidence.md) |
| G07 | Bundle-level custom CSS | Scoped merchant CSS applies without cross-template leakage | **P** [G07/G35 Product Page custom CSS scope evidence](ppb-deferred-functional-parity/G07-G35-product-page-custom-css-scope-evidence.md) | **P** [G07/G35 Product Page custom CSS scope evidence](ppb-deferred-functional-parity/G07-G35-product-page-custom-css-scope-evidence.md) | **P** [G07/G35 Product Page custom CSS scope evidence](ppb-deferred-functional-parity/G07-G35-product-page-custom-css-scope-evidence.md) | **P** [G07/G35 Product Page custom CSS scope evidence](ppb-deferred-functional-parity/G07-G35-product-page-custom-css-scope-evidence.md) |
| G08 | Bundle active/inactive status | Inactive bundle blocks visible bundle UI before template dispatch; active restore remounts the saved fixture | **P** [G08 active/draft evidence](ppb-deferred-functional-parity/G08-bundle-active-inactive-status-evidence.md) | **P** [G08 active/draft evidence](ppb-deferred-functional-parity/G08-bundle-active-inactive-status-evidence.md) | **P** [G08 active/draft evidence](ppb-deferred-functional-parity/G08-bundle-active-inactive-status-evidence.md) | **P** [G08 active/draft evidence](ppb-deferred-functional-parity/G08-bundle-active-inactive-status-evidence.md) |
| G09 | `hideOutOfStockProducts` | Alternate true/false states match EB | **E** [G09 Product List blocker evidence](ppb-deferred-functional-parity/G09-product-list-horizontal-vertical-hide-out-of-stock-evidence.md) | **P** [G09 Product Grid hide out-of-stock evidence](ppb-deferred-functional-parity/G09-product-grid-hide-out-of-stock-evidence.md) | **P** [G09 Horizontal Slots evidence](ppb-deferred-functional-parity/G09-product-list-horizontal-vertical-hide-out-of-stock-evidence.md) | **P** [G09 Vertical Slots evidence](ppb-deferred-functional-parity/G09-product-list-horizontal-vertical-hide-out-of-stock-evidence.md) |
| G10 | `displayPrices` | Current EB PPB admin/runtime does not expose price-visibility controls | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) |
| G11 | `displayCompareAtPrices` | Compare-at visibility follows the saved global setting | **X** [G11 Product List/Vertical Slots compare-at divergence evidence](ppb-deferred-functional-parity/G11-product-list-vertical-slots-compare-at-divergence-evidence.md) | **P** [G11 Product Grid compare-at visibility evidence](ppb-deferred-functional-parity/G11-product-grid-compare-at-visibility-evidence.md) | **P** HS02 | **X** [G11 Product List/Vertical Slots compare-at divergence evidence](ppb-deferred-functional-parity/G11-product-list-vertical-slots-compare-at-divergence-evidence.md) |
| G12 | `displaySwatchColours` / `displaySwatchImages` | Current EB PPB admin/runtime does not expose or execute global swatch controls | **E** [C08/G12 swatch absence](ppb-deferred-functional-parity/C08-G12-swatch-absence-evidence.md) | **E** [C08/G12 swatch absence](ppb-deferred-functional-parity/C08-G12-swatch-absence-evidence.md) | **E** [C08/G12 swatch absence](ppb-deferred-functional-parity/C08-G12-swatch-absence-evidence.md) | **E** [C08/G12 swatch absence](ppb-deferred-functional-parity/C08-G12-swatch-absence-evidence.md) |
| G13 | `displayConditionDescriptions` | Current EB PPB admin/runtime does not expose condition-description controls | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) |
| G14 | Cart icon and cart style | Current EB PPB admin/runtime does not expose cart icon/style controls | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) |
| G15 | Product/slot card style presets | Current EB PPB admin/runtime does not expose product-card or slot-card style preset controls | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) |
| G16 | Checkout button style | Current EB PPB admin/runtime does not expose checkout-button style controls | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) |
| G17 | Bundle-adding animation | Current EB PPB admin/runtime does not expose alternate bundle-adding animation controls | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) | **E** [G10/G13-G17 global-control absence evidence](ppb-deferred-functional-parity/G10-G13-G17-global-control-absence-evidence.md) |
| G18 | CTA text configuration | Saved merchant copy and long/localized text render correctly | **P** [G18 CTA text runtime evidence](ppb-deferred-functional-parity/G18-cta-text-runtime-evidence.md) | **P** [G18 CTA text runtime evidence](ppb-deferred-functional-parity/G18-cta-text-runtime-evidence.md) | **P** [G18 CTA text runtime evidence](ppb-deferred-functional-parity/G18-cta-text-runtime-evidence.md) | **P** [G18 CTA text runtime evidence](ppb-deferred-functional-parity/G18-cta-text-runtime-evidence.md) |
| G19 | Bundle summary configuration | Current EB PPB admin/runtime does not expose bundle summary title/subtitle configuration | **E** [G19 bundle-summary absence](ppb-deferred-functional-parity/G19-bundle-summary-configuration-absence-evidence.md) | **E** [G19 bundle-summary absence](ppb-deferred-functional-parity/G19-bundle-summary-configuration-absence-evidence.md) | **E** [G19 bundle-summary absence](ppb-deferred-functional-parity/G19-bundle-summary-configuration-absence-evidence.md) | **E** [G19 bundle-summary absence](ppb-deferred-functional-parity/G19-bundle-summary-configuration-absence-evidence.md) |
| G20 | Pricing configuration | Displayed original/savings/total fields follow saved visibility/copy | **P** [G20 pricing evidence](ppb-deferred-functional-parity/G20-product-grid-pricing-configuration-evidence.md) | **P** [G20 pricing evidence](ppb-deferred-functional-parity/G20-product-grid-pricing-configuration-evidence.md) | **P** [G20 pricing evidence](ppb-deferred-functional-parity/G20-product-grid-pricing-configuration-evidence.md) | **P** [G20 pricing evidence](ppb-deferred-functional-parity/G20-product-grid-pricing-configuration-evidence.md) |
| G21 | Store-level language/locale | PPB controls, validation, and CTA use the active locale | **P** [G21 active locale runtime evidence](ppb-deferred-functional-parity/G21-active-locale-runtime-evidence.md) | **P** [G21 active locale runtime evidence](ppb-deferred-functional-parity/G21-active-locale-runtime-evidence.md) | **P** [G21 active locale runtime evidence](ppb-deferred-functional-parity/G21-active-locale-runtime-evidence.md) | **P** [G21 active locale runtime evidence](ppb-deferred-functional-parity/G21-active-locale-runtime-evidence.md) |
| G22 | Track inventory on Add To Cart | Cart-time inventory validation follows the saved control | **T** | **T** | **T** | **T** |
| G23 | Hide completed step titles | EB exposes the Admin control, but current PPB storefront scripts do not execute it | **E** [G23 UI-only evidence](ppb-deferred-functional-parity/G23-hide-completed-step-titles-ui-only-evidence.md) | **E** [G23 UI-only evidence](ppb-deferred-functional-parity/G23-hide-completed-step-titles-ui-only-evidence.md) | **E** [G23 UI-only evidence](ppb-deferred-functional-parity/G23-hide-completed-step-titles-ui-only-evidence.md) | **E** [G23 UI-only evidence](ppb-deferred-functional-parity/G23-hide-completed-step-titles-ui-only-evidence.md) |
| G24 | Redirect Collection Quick Add to Bundle | Theme quick-add enters the correct PPB offer/context | **T** | **T** | **T** | **T** |
| G25 | Cart messaging | Saved bundle-cart line message and language reach the cart | **P** [G06/G25 cart-line messaging evidence](ppb-deferred-functional-parity/G06-G25-cart-line-messaging-evidence.md) | **P** [G06/G25 cart-line messaging evidence](ppb-deferred-functional-parity/G06-G25-cart-line-messaging-evidence.md) | **P** [G06/G25 cart-line messaging evidence](ppb-deferred-functional-parity/G06-G25-cart-line-messaging-evidence.md) | **P** [G06/G25 cart-line messaging evidence](ppb-deferred-functional-parity/G06-G25-cart-line-messaging-evidence.md) |
| G26 | Discount display format | Amount + percentage, amount-only, and percentage-only formats match EB | **E** [G26 discount format evidence](ppb-deferred-functional-parity/G26-discount-display-format-evidence.md) | **E** [G26 discount format evidence](ppb-deferred-functional-parity/G26-discount-display-format-evidence.md) | **E** [G26 discount format evidence](ppb-deferred-functional-parity/G26-discount-display-format-evidence.md) | **E** [G26 discount format evidence](ppb-deferred-functional-parity/G26-discount-display-format-evidence.md) |
| G27 | Redirect settings | Default side-cart update, checkout redirect, and cart redirect follow the saved mode | **T** | **T** | **T** | **T** |
| G28 | Execute script | Saved Product Page script executes at the EB-defined lifecycle without duplicate execution | **P** [G28 execute-script runtime](ppb-deferred-functional-parity/G28-execute-script-runtime-evidence.md) | **P** [G28 execute-script runtime](ppb-deferred-functional-parity/G28-execute-script-runtime-evidence.md) | **P** [G28 execute-script runtime](ppb-deferred-functional-parity/G28-execute-script-runtime-evidence.md) | **P** [G28 execute-script runtime](ppb-deferred-functional-parity/G28-execute-script-runtime-evidence.md) |
| G29 | Loading image/GIF | Current EB PPB admin/runtime does not expose loading image or GIF controls | **E** [G29 loading media absence evidence](ppb-deferred-functional-parity/G29-loading-media-absence-evidence.md) | **E** [G29 loading media absence evidence](ppb-deferred-functional-parity/G29-loading-media-absence-evidence.md) | **E** [G29 loading media absence evidence](ppb-deferred-functional-parity/G29-loading-media-absence-evidence.md) | **E** [G29 loading media absence evidence](ppb-deferred-functional-parity/G29-loading-media-absence-evidence.md) |
| G30 | Brand colors | Base PPB colors propagate to every applicable template surface | **P** [G30/G31 Product List and Modal Slots design evidence](ppb-deferred-functional-parity/G30-G31-product-list-modal-slots-design-typography-evidence.md) | **P** [G30 Product Grid brand color evidence](ppb-deferred-functional-parity/G30-product-grid-brand-colors-evidence.md) | **P** [G30/G31 Product List and Modal Slots design evidence](ppb-deferred-functional-parity/G30-G31-product-list-modal-slots-design-typography-evidence.md) | **P** [G30/G31 Product List and Modal Slots design evidence](ppb-deferred-functional-parity/G30-G31-product-list-modal-slots-design-typography-evidence.md) |
| G31 | Typography | Font family, weight, and scale propagate without theme leakage | **P** [G30/G31 Product List and Modal Slots typography evidence](ppb-deferred-functional-parity/G30-G31-product-list-modal-slots-design-typography-evidence.md) | **P** [G31 Product Grid typography evidence](ppb-deferred-functional-parity/G31-product-grid-typography-evidence.md) | **P** [G30/G31 Product List and Modal Slots typography evidence](ppb-deferred-functional-parity/G30-G31-product-list-modal-slots-design-typography-evidence.md) | **P** [G30/G31 Product List and Modal Slots typography evidence](ppb-deferred-functional-parity/G30-G31-product-list-modal-slots-design-typography-evidence.md) |
| G32 | Corners | Card, control, modal, slot, and CTA radii follow the saved design tokens | **P** [G32 Product List corners evidence](ppb-deferred-functional-parity/G32-product-list-corners-evidence.md) | **P** [G32 Product Grid corners evidence](ppb-deferred-functional-parity/G32-product-grid-corners-evidence.md) | **P** [G32 Horizontal Slots corners evidence](ppb-deferred-functional-parity/G32-horizontal-slots-corners-evidence.md) | **P** [G32 Vertical Slots corners evidence](ppb-deferred-functional-parity/G32-vertical-slots-corners-evidence.md) |
| G33 | Images and GIF settings | Saved design media appears in its intended PPB surface | **P** [G33/G34 design media and expert colors](ppb-deferred-functional-parity/G33-G34-design-media-expert-colors-evidence.md) | **P** [G33/G34 design media and expert colors](ppb-deferred-functional-parity/G33-G34-design-media-expert-colors-evidence.md) | **P** [G33/G34 design media and expert colors](ppb-deferred-functional-parity/G33-G34-design-media-expert-colors-evidence.md) | **P** [G33/G34 design media and expert colors](ppb-deferred-functional-parity/G33-G34-design-media-expert-colors-evidence.md) |
| G34 | Expert color controls | General, Product Card, Bundle Cart, and Upsell scopes override only their owner surfaces | **P** [G33/G34 design media and expert colors](ppb-deferred-functional-parity/G33-G34-design-media-expert-colors-evidence.md) | **P** [G33/G34 design media and expert colors](ppb-deferred-functional-parity/G33-G34-design-media-expert-colors-evidence.md) | **P** [G33/G34 design media and expert colors](ppb-deferred-functional-parity/G33-G34-design-media-expert-colors-evidence.md) | **P** [G33/G34 design media and expert colors](ppb-deferred-functional-parity/G33-G34-design-media-expert-colors-evidence.md) |
| G35 | Product Page custom CSS scope | Store-level PPB CSS remains scoped and distinct from Landing Page CSS | **P** [G07/G35 Product Page custom CSS scope evidence](ppb-deferred-functional-parity/G07-G35-product-page-custom-css-scope-evidence.md) | **P** [G07/G35 Product Page custom CSS scope evidence](ppb-deferred-functional-parity/G07-G35-product-page-custom-css-scope-evidence.md) | **P** [G07/G35 Product Page custom CSS scope evidence](ppb-deferred-functional-parity/G07-G35-product-page-custom-css-scope-evidence.md) | **P** [G07/G35 Product Page custom CSS scope evidence](ppb-deferred-functional-parity/G07-G35-product-page-custom-css-scope-evidence.md) |
| G36 | Product Card language fields | Add, variant, added, and inline-add labels use the active Product Page locale | **P** [G36 product-card language runtime](ppb-deferred-functional-parity/G36-product-card-language-runtime-evidence.md) | **P** [G36 product-card language runtime](ppb-deferred-functional-parity/G36-product-card-language-runtime-evidence.md) | **P** [G36 product-card language runtime](ppb-deferred-functional-parity/G36-product-card-language-runtime-evidence.md) | **P** [G36 product-card language runtime](ppb-deferred-functional-parity/G36-product-card-language-runtime-evidence.md) |
| G37 | Bundle Cart / Bundle / Toast language fields | Shared PPB language runtime supplies summary, CTA, validation, and toast copy across template families | **P** [G37 bundle-cart language runtime](ppb-deferred-functional-parity/G37-bundle-cart-language-runtime-evidence.md) | **P** [G37 bundle-cart language runtime](ppb-deferred-functional-parity/G37-bundle-cart-language-runtime-evidence.md) | **P** [G37 bundle-cart language runtime](ppb-deferred-functional-parity/G37-bundle-cart-language-runtime-evidence.md) | **P** [G37 bundle-cart language runtime](ppb-deferred-functional-parity/G37-bundle-cart-language-runtime-evidence.md) |
| G38 | Bundle Embed | Saved embed configuration mounts and hands off the correct offer context | **P** [G38 Bundle Embed evidence](ppb-deferred-functional-parity/G38-bundle-embed-evidence.md) | **P** [G38 Bundle Embed evidence](ppb-deferred-functional-parity/G38-bundle-embed-evidence.md) | **P** [G38 Bundle Embed evidence](ppb-deferred-functional-parity/G38-bundle-embed-evidence.md) | **P** [G38 Bundle Embed evidence](ppb-deferred-functional-parity/G38-bundle-embed-evidence.md) |
| G39 | Place Widget | Theme placement workflow preserves parent-product context and active template | **P** [G39 Place Widget evidence](ppb-deferred-functional-parity/G39-place-widget-evidence.md) | **P** [G39 Place Widget evidence](ppb-deferred-functional-parity/G39-place-widget-evidence.md) | **P** [G39 Place Widget evidence](ppb-deferred-functional-parity/G39-place-widget-evidence.md) | **P** [G39 Place Widget evidence](ppb-deferred-functional-parity/G39-place-widget-evidence.md) |

## 7. Responsive, Accessibility, Isolation, and Runtime Health

| ID | Feature / state | EB storefront contract | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- |
| Q01 | Desktop + mobile | Required 1280+ and 390x844 proof | **P** | **P** | **P** | **P** |
| Q02 | Narrow/tablet/wide hosts | 360, 768, 1440, and real wider product-form placement | **P** PLS7 | **P** PG08 | **P** HS09/HSP1 | **P** VS04/final regression |
| Q03 | No overflow/clipping/overlap | Document and component overflow remain zero | **P** | **P** | **P** | **P** |
| Q04 | Cross-template CSS/DOM isolation | Only the selected shell and stylesheet own the page | **P** PLS6/final regression | **P** final regression | **P** final regression | **P** final regression |
| Q05 | Keyboard access for core controls | Tab/Enter/Space reach all relevant actions | **P** [Q05-Q07 in-page quality evidence](ppb-deferred-functional-parity/Q05-Q07-inpage-quality-evidence.md) | **P** PG11-keyboard-accessibility-evidence | **P** [Q05-Q07 modal-slot quality evidence](ppb-deferred-functional-parity/Q05-Q07-modal-slot-quality-evidence.md) | **P** [Q05-Q07 modal-slot quality evidence](ppb-deferred-functional-parity/Q05-Q07-modal-slot-quality-evidence.md) |
| Q06 | Console and app-owned request health | No unexplained app-owned errors in each feature replay | **P** [Q05-Q07 in-page quality evidence](ppb-deferred-functional-parity/Q05-Q07-inpage-quality-evidence.md) | **P** [Q05-Q07 in-page quality evidence](ppb-deferred-functional-parity/Q05-Q07-inpage-quality-evidence.md) | **P** [Q05-Q07 modal-slot quality evidence](ppb-deferred-functional-parity/Q05-Q07-modal-slot-quality-evidence.md) | **P** [Q05-Q07 modal-slot quality evidence](ppb-deferred-functional-parity/Q05-Q07-modal-slot-quality-evidence.md) |
| Q07 | Theme typography and selector leakage | Theme styles do not distort the template | **P** [Q05-Q07 in-page quality evidence](ppb-deferred-functional-parity/Q05-Q07-inpage-quality-evidence.md) | **P** [Q05-Q07 in-page quality evidence](ppb-deferred-functional-parity/Q05-Q07-inpage-quality-evidence.md) | **P** [Q05-Q07 modal-slot quality evidence](ppb-deferred-functional-parity/Q05-Q07-modal-slot-quality-evidence.md) | **P** [Q05-Q07 modal-slot quality evidence](ppb-deferred-functional-parity/Q05-Q07-modal-slot-quality-evidence.md) |

## Final Reconciliation Result

### 2026-07-14 current design replay

The agent-store PPB fixture was replayed through all four saved designs with direct Chrome DevTools. Cache Storage was cleared and each desktop/mobile evidence pass used a cache-bypassed hard reload.

| Design | Runtime contract | Desktop 1280x800 | Mobile 390x844 | Interaction evidence | Overflow | Active stylesheet |
| --- | --- | --- | --- | --- | --- | --- |
| Product List | `PDP_INPAGE + CASCADE` | Pass | Pass | Two selections, discount progress, selected drawer, Next, Step 2, Previous | None | `bundle-widget-product-page-cascade.css` |
| Product Grid | `PDP_INPAGE + COGNIVE` | Pass | Pass | Categories, Add actions, active Next, unmet-rule toast | None | `bundle-widget-product-page-cognive.css` |
| Horizontal Slots | `PDP_MODAL + MODAL` | Pass | Pass | Slot picker, selected state, total/count update, incomplete-step enforcement | None | `bundle-widget-product-page-modal.css` |
| Vertical Slots | `PDP_MODAL + SIMPLIFIED` | Pass | Pass | Vertical slot picker, selected state, total/count update, incomplete-step enforcement | None | `bundle-widget-product-page-modal.css` |

All four designs served widget `5.0.174`, loaded their active stylesheet through Shopify CDN, and restored Product Grid after the replay. This replay revalidates the existing template-shell, responsive, step/category, selection, discount-progress, and validation-toast rows. It does not promote the explicitly deferred `S` or `T` feature permutations below.

The later Q05-Q07 modal-slot quality replay served widget `5.0.181` and
revalidated Horizontal and Vertical Slots after the keyboard and responsive
focus fixes documented in the linked evidence note.

The 2026-07-15 R09-R10 collection-source replay served Wolfpack widget
`5.0.182`. Direct reference and Wolfpack passes proved collection-only hydration,
mixed manual-plus-collection de-duplication, inventory filtering, and selected
state retention for Product Grid and Vertical Slots at 1280x800 and 390x844.

The 2026-07-16 S17 Horizontal Slots replay temporarily switched the current EB
fixture to `PDP_MODAL + MODAL` and the WPB SIT fixture to
`PDP_MODAL + MODAL` with Step 2 enabled. After Cache Storage clear and
`ignoreCache: true` hard reloads, EB rendered Step 2's 28-product collection
source as 24 cards at desktop and mobile, and WPB rendered its equivalent
collection-backed Step 2 source as 22 cards at desktop and mobile. Both fixtures
were restored and verified after the pass.

The 2026-07-15 R13 amount-condition replay persisted an amount threshold of at
least 300 and proved below-threshold blocking plus above-threshold progression
in all four reference templates and all four Wolfpack templates at desktop and
mobile sizes. Wolfpack served widget `5.0.182`; Product List used
`PDP_INPAGE + CASCADE`, Product Grid used `PDP_INPAGE + COGNIVE`, Horizontal
Slots used `PDP_MODAL + MODAL`, and Vertical Slots used
`PDP_MODAL + SIMPLIFIED`. The agent-store fixture was restored and verified from
the storefront bundle JSON as Vertical Slots with Step 2 disabled and Step 1
Quantity greater than or equal to two.

The 2026-07-15 G39 review classifies Place Widget as a shared Admin placement
workflow rather than a per-template storefront renderer permutation. Focused
contracts revalidated selected-template preservation, bundle parent-product
preview context, draft-product preview URL handling, template-suffix assignment,
and merchant theme-template listing with 18/18 Jest tests passing.

The 2026-07-15 M11 review classifies filled-slot stacking as a modal-only
runtime setting. EB and Wolfpack both drive Horizontal versus Vertical modal
slots from `renderFilledSlotsAsHorizontalStacked`; the current formatter and
template-registry contracts passed 41/41 focused tests, and R13 live replay
verified the HS/VS runtime orientation markers.

The 2026-07-15 G38 review classifies Bundle Embed as a shared PPB
visibility/runtime path rather than a per-template renderer permutation. The
complete configure audit already records desktop/mobile storefront proof for the
enabled all-products embed state, and current focused persistence/runtime tests
passed 43/43.

The 2026-07-15 G03 review applies the same shared-path classification to the
PPB upsell block/button handoff. The complete configure audit already records
desktop/mobile storefront proof for the enabled all-products upsell widget state,
and current focused persistence/runtime tests passed 43/43.

The 2026-07-16 G29 review resolves loading image/GIF as EB-absent for current
PPB. EB Product Page Layout Controls exposed configuration, redirect,
execute-script, cart messaging, discount format, inventory, and custom CSS
fields, but no loading image/GIF field; the current PPB storefront runtime
exposed no loading media keys under the Product Page controls object.

The 2026-07-16 G28 replay classifies Execute Script as a shared Product Page
post-add lifecycle control. EB Product Page Layout persisted a sentinel script
and executed it exactly once after a valid Product Grid bundle add
(`MIX-156854`) while add/update cart requests returned 200. WPB SIT persisted
the same control into `settingsControls.productPage.redirect.executeScript`;
after a valid modal/shared-card bundle add, the script incremented both page and
session counters exactly once. EB and WPB fixtures were restored and
hard-reload verified clean.

The 2026-07-16 G19 review resolves Bundle summary configuration as EB-absent
for current PPB. EB Product Page Layout Language exposed Product Card, Bundle
Cart, Bundle, and Toasts groups, including CTA/navigation/subtotal labels, but
no bundle summary title/subtitle controls. The cache-cleared EB storefront
runtime reported `bundleTextConfig: null`, and no summary title/subtitle DOM was
present.

The 2026-07-15 C07 replay grouped Product List, Product Grid, and Vertical Slots
under one shared category fixture. EB and Wolfpack both persisted
`displayVariantsAsIndividualProducts: true` with swatches disabled and rendered
the six `18k Pedal Ring` variants as separate selectable products at desktop and
mobile sizes. Wolfpack served widget `5.0.182`. EB was restored to Product Grid
with grouped variants, and the Wolfpack SIT fixture was restored to Vertical
Slots with the temporary variant payload removed.

The 2026-07-15 C08/G12 review resolves swatches as EB-absent for current PPB.
The live EB admin exposed the category-level individual-products checkbox but no
category swatch control, and Bundle Settings exposed no global swatch
colour/image controls. Current EB runtime reported `displayVariantsAsSwatches:
false`, no swatch-related runtime keys, and a grouped variant selector instead
of swatch DOM.

The 2026-07-15 D11 review resolves Bundle Quantity Options as EB-absent for
current PPB. The live EB admin exposed no box-selection or bundle-quantity
control in Step Setup or Bundle Settings, and the storefront runtime reported
`boxSelection.isEnabled: false` with no visible box quantity UI.

The final storefront visual pass proves the template shells, product-card and
modal-card hierarchy, selected states, toasts, responsive tracks, overflow,
template isolation, and the current desktop/mobile fixtures. Product Grid PG09
also closes grouped-variant and category-scoped reload presentation.

The remaining **S** and **T** cells are active functional-verification work.
They are not silently promoted from source coverage or another template's
evidence.

Current parsed evidence counts across the 119 feature rows:

| Template | Proven | Shared/partial | Not tested | EB-absent | Accepted divergence | Not applicable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Product List | 81 | 0 | 5 | 18 | 3 | 12 |
| Product Grid | 84 | 0 | 5 | 16 | 2 | 12 |
| Horizontal Slots | 92 | 0 | 5 | 17 | 4 | 1 |
| Vertical Slots | 91 | 0 | 5 | 17 | 5 | 1 |

Overall cells across all templates:

- Total cells: **476**
- Proven: **348**
- Shared/partial: **0**
- Not tested: **20**
- EB-absent: **68**
- Accepted divergence: **14**
- Not applicable: **26**

These totals are an evidence inventory, not a product-quality score. One
feature row can require several value permutations before it becomes Proven.

The former shared/partial cells are now either proven or folded back into the
normal not-tested queue. Resolve the remaining edge cases as grouped fixture
passes, not isolated one-off template toggles:

1. **Missing-media fixture:** C05 is now closed across all four templates.
   Product List and Vertical Slots were closed by the 2026-07-17 direct
   desktop/mobile replay; Product Grid and Horizontal Slots retain their prior
   PG07/HS18 evidence. EB rendered the no-media `Message` product as a broken
   `undefined` image, while WPB used a stable neutral SVG placeholder. A later
   cache-clear hard reload showed EB still on Vertical Slots, so Product Grid
   restore remains pending; the temporary `Message` product also still needs
   removal from EB Category 1 through EB's product picker.
2. **Hide-OOS fixture:** Product Grid, Horizontal Slots, and Vertical Slots are
   now proven by direct true/false replay. Product List is terminal **E** for
   this matrix pass because WPB Product List kept Step 2 disabled under the
   synced two-step fixture, while EB exposed the Step 2 true/false behavior.
3. **Pagination fixture:** S17 is now closed across all four templates. Reuse
   the current collection-count replay only as regression control if later
   product-source code changes can affect pagination.

The 2026-07-16 Chrome DevTools MCP retry narrowed the EB UI-only fixture
blocker for D06. EB's third-party Admin owns the saved fixture, and the custom
money spinbutton still appends through `fill_form` and `Control+A` replacement
paths (`2` became `21000`). The safe path is keyboard clearing after focus:
switch the rule to `Fixed Amount Off` + `Amount`, click the amount spinbutton,
press `Backspace` until empty, then type the target amount. The unsafe unsaved
amount-rule attempts were discarded; the EB fixture reloaded to the saved
percentage baseline (`Quantity >= 2 => 5%`, `Quantity >= 3 => 10%`). D06 is
now terminal **P** across all four templates, so this is a historical input
warning only, not part of the remaining shared/partial work.

The 2026-07-16 shared/partial closeout retry narrowed the EB template-selector
blocker. Direct `click(uid)` and Tab traversal still do not activate the
third-party Shopify Admin OOPIF controls, but `evaluate_script` with the
template-card UID can click the iframe button. That reaches EB's "Your bundle
is ready" overlay state and does save when the subsequent `mixAndMatch/update`
payload is verified. Direct evidence from the same pass showed saved Horizontal
Slots as `PDP_MODAL` + `MODAL`, saved Vertical Slots as `PDP_MODAL` +
`SIMPLIFIED`, and restored Product Grid as `PDP_INPAGE` + `COGNIVE`. Do not
promote template cells from the visible selected card alone: every replay must
verify both the saved update payload and the cache-cleared storefront runtime.
In the retry, the storefront accessibility tree still exposed Product List-like
text even when `gbbMix.settings.mixAndMatchBundleData` reported
`PDP_MODAL` + `SIMPLIFIED`, so DOM text alone is not sufficient template proof.

The follow-up 2026-07-16 direct Chrome DevTools MCP pass removed the Step Setup
UI-only blocker. The blocker was not the category editor itself: EB's in-app
help/chat overlay persisted over one Admin tab and ignored normal Close/Escape
paths. Switching to a clean EB Admin tab exposed Step Setup, expanding Category
1 showed `Products 6`, `6 Selected`, and `Add Products`, and the Shopify
resource picker opened with search/filter controls. No product mutation was
saved in that pass. The remaining shared-fixture blocker is product
identification, not UI access: the picker does not expose compare-at, missing
media, or full inventory metadata, so the sale/missing-media/OOS products should
be identified from Shopify product/admin data before using the picker once.

The same pass also hard-reloaded the EB storefront after clearing Cache Storage
and session/local selection state. Runtime still reported Product Grid
`PDP_INPAGE` + `COGNIVE`, offer `MIX-156854`, and
`mixAndMatchBundleSettings.hideOutOfStockProducts: true`; however, the
storefront visibly rendered multiple configured products whose hydrated variants
had `inventoryQuantity: 0` and `inventoryPolicy: "DENY"`. Treat this as active
G09 investigation evidence, not a terminal result: the false-state replay and
WPB mirror are still required before promoting the row.

The later 2026-07-16 direct Chrome DevTools MCP pass proved that the current EB
fixture can supply part of the shared/partial product-card set without product
mutation. After clearing Cache Storage and hard reloading, EB Product List Step
2 rendered sale/compare-at cards (`14k Solid Bloom Earrings`, `Yellow Sofa`,
and `14k Dangling Pendant Earrings`), mixed-aspect media (`14k Intertwined
Earrings` square, `Massage Oil` tall, `Yellow Sofa` wide), and a 24-product
category. The same pass verified the WPB storefront app-proxy payload for
`cmrf19c8d0000v0xpj8rz2wgh`: the active saved template is Vertical Slots
(`PDP_MODAL` + `SIMPLIFIED`), Step 1 has the six jewelry slot products plus an
empty category, and Step 2 has four shared-fixture products
(`14k Intertwined Earrings`, `14k Solid Bloom Earrings`,
`Selling Plans Ski Wax`, and `The Out of Stock Snowboard`). The WPB modal did
not advance to Step 2 until the three Step 1 slots were filled, so this pass is
fixture-routing evidence only. It does not promote shared/partial cells because
the complete terminal batch still needs direct VS Step 2 rendering,
missing-media replay, disabled-discount replay, hide-OOS true/false replay, and
the corresponding EB/WPB template cycle.

The next WPB-only 2026-07-16 probe isolated the Vertical Slots Step 2 fixture
gate. A scoped DB mutation changed only Step 2 on
`cmrf19c8d0000v0xpj8rz2wgh` from `enabled: false` to `enabled: true`, and the
app-proxy bundle JSON immediately returned both steps enabled. A normal
cache-cleared hard reload still rendered only Step 1; a reload with a direct
Chrome DevTools MCP `initScript` that appended a cache-busting query parameter
to `/apps/product-bundles/api/bundle/{id}.json` proved the widget had consumed a
cached bundle response. With that cache-busted config response, WPB widget
`5.0.187` rendered Vertical Slots `PDP_MODAL` + `SIMPLIFIED` with Step 1 filled
and Step 2 visible. Opening Step 2 showed sale/compare-at cards
(`14k Solid Bloom Earrings`, `Purely Almonds Original`,
`18k Dangling Pendant Earrings`, `Yellow Sofa`), mixed media aspect ratios,
mixed-inventory `Selling Plans Ski Wax` with `Only 1 left`, and omitted the
configured fully unavailable `The Out of Stock Snowboard`. This is strong WPB
desktop fixture evidence for the shared product-card batch, but it is not
terminal because EB Vertical Slots and WPB mobile evidence are still missing.
The scoped mutation was restored afterward and the app-proxy again returned
Step 2 as `enabled: false`.

The follow-up 2026-07-16 direct Chrome DevTools MCP pass closed the Vertical
Slots shared-card subset for C03 and C04. EB was switched to Vertical Slots,
Cache Storage was cleared, and desktop/mobile Step 2 replays showed sale
compare-at pairs (`14k Solid Bloom Earrings`, `Yellow Sofa`,
`14k Dangling Pendant Earrings`, `18k Solid Bloom Earrings`) plus mixed
card/media heights without horizontal overflow. WPB mirrored the same pass with
the scoped Step 2 enable and cache-busted app-proxy bundle JSON; desktop/mobile
Step 2 showed sale compare-at pairs (`14k Solid Bloom Earrings`,
`Purely Almonds Original`, `18k Dangling Pendant Earrings`, `Yellow Sofa`),
mixed image/card sizes, `Selling Plans Ski Wax` with `Only 1 left`, and no
horizontal overflow. EB was restored to Product Grid and verified after
cache-cleared hard reload as `PDP_INPAGE` + `COGNIVE`; WPB Step 2 was restored
to `enabled: false`. This does not close C05, C10, D01, or G09 because those
still require missing-media, fully-unavailable, disabled-discount, and
hide-OOS true/false fixtures.

The later 2026-07-16 direct Chrome DevTools MCP G30/G31 pass closed Product
List, Horizontal Slots, and Vertical Slots brand-color and typography cells.
Product List matched EB under exact cascade row selectors on desktop/mobile.
Horizontal and Vertical Slots initially exposed a WPB source mismatch in the
bottom-sheet modal product card: title/price were black `700` and the card Add
button was filled black, while EB used muted theme text at weight `400` with a
transparent Add control. The fix is scoped to
`app/assets/widgets/product-page-css/base/bottom-sheet-modal.css`, regenerated
with `npm run minify:assets css`, and hard-reload verified on desktop/mobile
for both modal slot templates. WPB was restored to `PDP_MODAL` +
`SIMPLIFIED`. EB Admin reached the Product Grid post-save overlay, but repeated
cache-cleared storefront reloads still rendered Cascade in that browser
session; keep using saved payload plus storefront runtime proof for future EB
template restore checks, not the visible selected card alone.

The 2026-07-17 C05 pass closed missing media as terminal **P** for all four PPB
templates. Product List and Vertical Slots were replayed with the no-media
`Message` product on EB and WPB after clearing Cache Storage and hard reloading
desktop/mobile. EB renders a broken `undefined` image with no horizontal
overflow; WPB renders its stable SVG placeholder with no horizontal overflow.
WPB was restored to its original Vertical Slots setup. A later cache-clear hard
reload showed EB still on Vertical Slots, so EB Product Grid restore remains
pending. EB's category product picker remained UI-blocked for product removal
in this pass, so `Message` may still be present in EB Category 1 until removed
through EB Admin.

The later 2026-07-16 C16 pass closed Step/category banner image as terminal
**P** for all four PPB templates. EB was fixture-cycled once with
`productsData1.stepImage` and hard-reload verified on desktop/mobile for
Product List, Product Grid, Horizontal Slots, and Vertical Slots. EB in-page
templates rendered the target URL in `gbbMixStepImageWrapper`; EB modal
templates rendered it in `gbbMixEmptyStateCardImageWrapper`. WPB replay exposed
one real source defect: in-page product rendering rewrote the grid and deleted
the banner after async product loading. The fix keeps `stepImage` preferred over
`bannerImageUrl` and prepends the banner after every in-page renderer write.
Focused unit coverage now includes element creation, fallback, no-image, and
final/async in-page renderer state. WPB was hard-reload
verified desktop/mobile across all four templates, then restored to
`PDP_MODAL/SIMPLIFIED` with `stepImage: null` and no target image.

The 2026-07-16 G26 pass resolved Discount display format as terminal **E** for
all PPB templates. EB Product Grid was temporarily configured through Admin for
amount-plus-percentage, amount-only, and percentage-only cart-line display and
passed each format on desktop and mobile. WPB Vertical Slots persisted and
synced `amount_only` and `percentage_only` through
`CartTransformService.syncCartLineMessagingSettings`; direct Admin GraphQL
confirmed the live Cart Transform owner metafield contained `percentage_only`.
The live cart line still rendered `$72.40 (5%)` instead of `$72.40` or `5%`.
Because G06/G25 already prove all templates share this cart-line path, the
format mismatch is accepted as shared runtime evidence rather than four
template-specific fixture mutations. EB was restored to app defaults; WPB was
restored to `amount_percentage` and its cart was cleared.

The 2026-07-16 G21 pass resolved Store-level language/locale as terminal **P**
for all PPB templates without another fixture mutation. The already accepted
G37 Chrome DevTools MCP replay captured EB and WPB desktop/mobile active-locale
runtime directly: EB served one active `customTextSettings` object with
CTA/navigation/drawer/validation strings, while WPB returned language endpoint
`activeLocale: "en"` and `selectedLanguage: "English"` with the matching
textOverrides consumed by the shared in-page and modal runtime families. This
is sufficient for G21 because the row contract is active-locale consumption, not
alternate-locale translation authoring.

The 2026-07-16 G18 pass resolved CTA text configuration as terminal **P** for
all PPB templates. EB Product Page Layout language fields were temporarily set
to a `G18` long-copy sentinel for Add Bundle Cart, Previous, Next, and Done.
Chrome DevTools MCP hard reloads with Cache Storage cleared proved EB Product
Grid desktop/mobile runtime served the sentinel through
`pageCustomizationSettings.customTextSettings` and rendered the long Next CTA.
WPB mirrored the same Product Page language payload through
`buildSettingsLanguageRuntime`; desktop/mobile hard reloads on widget `5.0.189`
returned the sentinel from the language endpoint and rendered the long Add
Bundle CTA. Both EB and WPB were restored to default copy and reverified with
no remaining `G18` text.

The 2026-07-16 G37 shared-runtime pass closed Bundle Cart / Bundle / Toast
language fields across all PPB templates. Fresh Chrome DevTools MCP
cache-cleared hard reloads proved EB Product Grid desktop/mobile runtime still
serves one `pageCustomizationSettings.customTextSettings` object with bundle
CTA/loading, footer next/done, selected-products, drawer, toast, and condition
message fields. WPB Vertical Slots desktop/mobile returned the same active
locale values from the app-proxy language endpoint on widget `5.0.189` and
rendered the modal CTA/navigation copy. Source proof maps the four templates to
two template families: Product List/Product Grid consume the shared in-page
footer/drawer/validation methods, and Horizontal Slots/Vertical Slots consume
the shared modal footer/navigation/validation methods. This is accepted as a
shared runtime closure instead of four separate fixture mutations because the
text document and call sites are independent of template preset.

The 2026-07-16 G04 pass resolved preorder/subscription integration as
terminal **E** for the current PPB fixture. EB storefront runtime has
`subscriptionBundlesData.lastValidationResponse.message:
"NO_SELLING_PLAN_GROUPS_FOUND"`, no `sellingPlanGroups`, no product or variant
`sellingPlanAllocations`, no preorder flags, and no visible plan/preorder
selector text. WPB baseline runtime was checked only to confirm no WPB-only
integration state is active. This absence is template-independent, so no
template cycle can create buyer-facing selling-plan/preorder behavior until EB
has a fixture with Stoq preorder data or Shopify selling-plan allocations.

High-risk missing evidence is concentrated in:

1. amount thresholds and independent discount display controls;
2. default/preselected products and disabled-validation behavior;
3. Bundle Visibility, browsed-product preselection, and subscriptions/selling plans;
4. alternate global PPB control values and localized/custom text;
5. direct Vertical Slots inventory, variant, delayed-load, and media-edge proof.

Those rows are being completed through the active functional-parity goal. The
earlier storefront visual replay remains valid, but it is not the completion
boundary for this matrix.

## Active Functional Completion

Work through the remaining rows in fixture-minimizing slices. For each slice,
inspect EB help content first, configure EB through Admin, capture EB
desktop/mobile truth, mirror WPB, record persisted/runtime values, exercise the
behavior, and only then decide whether implementation is required.

### Shared/partial closeout result

The matrix now has **0** shared/partial cells. Do not re-open that category for
rows that merely need fixture replay; use **T** until direct EB/WPB evidence can
promote the cell to **P**, **E**, **X**, or **N/A**.

1. **Identify the shared product set before opening the picker:** from Shopify
   product/admin data, find one sale/compare-at product, one mixed-aspect
   product, one missing-media product, one fully unavailable product, one OOS
   product that can be hidden/shown, and one large collection category that
   crosses the pagination boundary. Do not use picker search heuristics for this
   step because the picker only exposes title/image/basic availability and does
   not prove compare-at, missing-media, or inventory policy metadata. Preserve
   the starting EB and WPB payload/runtime values before saving. Current
   low-change candidates are: EB sale/mixed/pagination from existing Step 2
   (`14k Solid Bloom Earrings`, `Massage Oil`, `Yellow Sofa`, and the 24-product
   category); WPB sale/OOS/mixed-inventory from saved Step 2
   (`14k Solid Bloom Earrings`, `Selling Plans Ski Wax`,
   `The Out of Stock Snowboard`). C05 no longer belongs in this testing queue:
   Product List and Vertical Slots are closed by the 2026-07-17 direct replay,
   and Product Grid / Horizontal Slots retain PG07/HS18. G09 no longer belongs
   in this testing queue:
   Product Grid, Horizontal Slots, and Vertical Slots are proven, while Product
   List is terminal **E** because WPB Product List did not expose the required
   Step 2 product set. C10 Vertical Slots no longer belongs in this testing
   queue because the same direct true/false replay proved fully unavailable
   product behavior.
2. **EB pass, template cycle:** configure the shared product set in EB, then
   hard-reload with cache bypass and capture desktop/mobile in this order:
   Product Grid first for baseline product-source rows, then Product List,
   Horizontal Slots, and Vertical Slots for the same saved fixture.
   C03/C04 Vertical Slots are already closed by
   `C03-C04-vertical-slots-shared-card-evidence.md`; do not repeat that fixture
   unless it is needed for regression confirmation. Use a clean EB Admin tab if
   the help/chat overlay is open; it can mask Step Setup controls. For EB
   template selection, use direct
   Chrome DevTools MCP `evaluate_script` on the OOPIF UID only as a click
   transport; after every template change, verify the saved
   `mixAndMatch/update` payload and the storefront runtime before recording
   evidence. A visible selected template card alone is not sufficient.
3. **WPB mirror pass:** mirror the same fixture through the local DB +
   storefront sync path, not one-off browser edits. Cycle the same template
   order and capture desktop/mobile after clearing Cache Storage and hard
   reloading with `ignoreCache: true`.
4. **Restore and commit:** restore EB and WPB to the saved percentage/baseline
   fixture, re-open both storefronts once, confirm baseline runtime values, then
   update the matrix and commit the relevant T-cell closeout.

### Not-tested fixture order

After the S06 shared-fixture pass, the parser shows **16** `T` cells, not 106.
The best path is to batch them
by persisted/runtime owner instead of row order:

1. **Product-source and cart-time inventory sweep:** G22 all templates. Use one
   product-source fixture with per-product maximum, OOS/cart-time inventory, and
   a collection large enough to cross the pagination boundary. S06 is now closed
   by the shared default-products fixture and should stay as a regression
   control only.
2. **Global copy and pricing-display sweep is closed:** G18 is terminal **P**
   from the 2026-07-16 Product Page Layout CTA replay, G19 is terminal **E**
   from the 2026-07-16 Product Page summary-title absence review, G21 is
   terminal **P** from the 2026-07-16 active-locale replay, G26 is terminal
   **E** from the 2026-07-16 shared cart-line format replay, and G37 is closed
   by the 2026-07-16 shared PPB language runtime proof.
3. **Step/navigation media sweep is closed:** C16 is terminal **P** from the
   2026-07-16 shared step-image fixture replay across all four templates.
4. **Global design/media/CSS sweep is closed:** G33/G34 are terminal **P** from
   the 2026-07-16 shared design-media and expert-color replay. G07/G35 are
   terminal **P** from the 2026-07-16 shared Product Page custom-CSS replay.
   G29 is terminal EB-absent, and G30/G31 are now proven across all templates;
   use them only as regression controls if later CSS changes touch the same
   surfaces.
5. **External-entry sweep:** G02 and G24 together through browsed-product and
   collection quick-add entry points. Keep this separate because it starts
   outside the bundle widget and can pollute selection/session state.
6. **Subscriptions/preorder sweep:** G04 is terminal EB-absent for the current
   fixture. Reopen only if EB supplies a product set with Stoq preorder data or
   Shopify selling-plan allocations.
7. **Redirect sweep:** G27 after the product-source and cart-sensitive rows, so
   checkout/cart redirects do not contaminate product-card evidence. G28 is now
   closed by the 2026-07-16 shared Product Page post-add replay.
8. **Final restore and quality sweep:** restore Product Grid/Percentage Off on
   EB and Vertical Slots/Percentage Off on WPB, hard reload desktop/mobile, and
   rerun any rows affected by fixture restoration.

Every completed row must link its durable evidence note from this matrix. If a
row is proven inapplicable or EB-absent, record the EB Admin/runtime evidence
that establishes that result.
