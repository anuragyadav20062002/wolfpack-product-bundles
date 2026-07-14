---
schema_version: 1
id: ppb-feature-to-storefront-matrix
title: Product Page Bundle Feature-to-Storefront Verification Matrix
type: verification-matrix
status: active
summary: Maps Product Page Bundle feature states to direct storefront evidence across all four PPB designs.
last_audited: 2026-07-15
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

**Status:** Functional parity completion in progress; R06-R10, R13, and R14 reconciled directly
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
| R15 | Auto-next behavior | Eligible selection advances only when the saved EB rule enables it | **T** | **P** `PG09-session-restoration-evidence` | **T** | **T** |

## 2. Product Cards, Variants, Media, and Inventory

| ID | Feature / state | EB storefront contract | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- |
| C01 | Complete card hierarchy | Image, title, price, variant identity, and action remain reachable | **P** PL00/PLF | **P** PG08 | **P** HS02/HS19 | **P** VS04 |
| C02 | Long titles and content-driven height | Text wraps without clipping or overlapping actions | **P** PLS2/PLS3 | **P** PG08 | **P** HS02/HSS2 | **P** VS02/VS04 |
| C03 | Sale + compare-at presentation | Compare-at belongs to the price cluster and follows the saved visibility setting | **S** Price hierarchy covered; toggle/state not isolated | **P** PG08 | **P** HS02 | **S** Shared modal cards only; no VS sale fixture |
| C04 | Square/tall/wide media | Mixed aspect ratios remain contained | **P** PLS2 | **S** Responsive cards proven; mixed ratios not isolated | **P** HS02 | **S** Shared modal card renderer; no direct VS mixed-ratio replay |
| C05 | Missing media | EB broken/missing behavior captured; WPB stable fallback accepted | **T** | **P** PG07 | **P** HS18 | **S** Shared modal fallback only |
| C06 | Grouped variant selector | Variant selection preserves product/variant identity | **P** PL03 | **P** PG09 | **P** HS03 | **P** VS07 |
| C07 | Variants as individual products | `displayVariantsAsIndividualProducts` changes catalog representation | **S** Listed in PL03 run, but current evidence proves grouped mode | **T** | **P** HS03 | **T** |
| C08 | Variant swatches | Saved swatch flag changes selector presentation | **T** | **T** | **T** | **T** |
| C09 | Sole sellable variant | Omit selector but retain the surviving variant identity | **P** PL04 | **T** | **P** HS04 | **P** VS08 |
| C10 | Fully unavailable product | Hide or block exactly as the saved EB inventory setting requires | **P** PL04 | **P** PG05 | **P** HS04 | **S** Shared modal path only |
| C11 | Quantity/add/selected action | Default Add and selected quantity/action states match EB | **P** PL00 | **P** PG04/PG08 | **P** HS19 | **P** VS04 |
| C12 | Add on product-card click setting | Toggle between card-click selection and explicit action | **P** Unit coverage + runtime path resolution for controls | **P** Unit coverage + runtime path resolution for controls | **P** Unit coverage + runtime path resolution for controls | **P** Unit coverage + runtime path resolution for controls |
| C13 | Display quantity input setting | Quantity input visibility follows the global PPB control | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` |
| C14 | See-more / expanded card setting | Long content behavior follows `displaySeeMoreLink` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` |
| C15 | Product-card hover expansion | `expandProductCardOnHover` behavior | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` | **P** `tests/unit/assets/ppb-product-page-card-controls.test.ts` |
| C16 | Step/category banner image | Saved PPB banner media renders at the EB-owned step/category location | **T** | **T** | **T** | **T** |

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
| M10 | `maxSlotsPerRow` variations | Saved global value changes responsive slot tracks | **N/A** | **N/A** | **T** | **T** |
| M11 | Filled-slot stacking control | `renderFilledSlotsAsHorizontalStacked` changes filled presentation | **N/A** | **N/A** | **P** [M11 filled-slot stacking evidence](ppb-deferred-functional-parity/M11-filled-slot-stacking-evidence.md) | **P** [M11 filled-slot stacking evidence](ppb-deferred-functional-parity/M11-filled-slot-stacking-evidence.md) |
| M12 | Slot rendering based on condition toggle | `renderSlotsBasedOnCondition` false/true permutations | **N/A** | **N/A** | **T** | **T** |

## 4. Discounts, Progress, Messaging, and Totals

| ID | Feature / state | EB storefront contract | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- |
| D01 | Discounts disabled | Original totals; no discount/progress leak | **P** PL00 | **P** PG00 | **P** HSS4 | **S** No dedicated disabled-discount replay |
| D02 | Percentage tiers | Threshold, savings, progress, success, and final total | **P** PL05/PLS1 | **P** PG06 | **P** HS06/HSS1 | **P** VS03 |
| D03 | Fixed amount off | Quantity- and amount-based rules | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` (`fixed_amount_off`) and PPB unit coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts`; visual parity replay pending. | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` (`fixed_amount_off`) and PPB unit coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts`; visual parity replay pending. | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` (`fixed_amount_off`) and PPB unit coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts`; visual parity replay pending. | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` (`fixed_amount_off`) and PPB unit coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts`; visual parity replay pending. |
| D04 | Fixed bundle price | Display, totals, and cart behavior | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` (`fixed_bundle_price`) with PPB message-shape coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts`; visual parity/cost rendering replay pending. | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` (`fixed_bundle_price`) with PPB message-shape coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts`; visual parity/cost rendering replay pending. | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` (`fixed_bundle_price`) with PPB message-shape coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts`; visual parity/cost rendering replay pending. | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` (`fixed_bundle_price`) with PPB message-shape coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts`; visual parity/cost rendering replay pending. |
| D05 | Buy X, Get Y | Buy/get threshold, discounted item selection, copy, and cart result | **T** | **T** | **T** | **T** |
| D06 | Amount-based discount threshold | Currency threshold and remaining amount text | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` and PPB footer-shape coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts` (`formats amount-based remaining text`, `cent-scale condition math`); visual parity replay pending. | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` and PPB footer-shape coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts` (`formats amount-based remaining text`, `cent-scale condition math`); visual parity replay pending. | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` and PPB footer-shape coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts` (`formats amount-based remaining text`, `cent-scale condition math`); visual parity replay pending. | **S** Shared-path evidence in `tests/unit/assets/pricing-calculator.test.ts` and PPB footer-shape coverage in `ppb-product-page-footer-discount-messaging-toggle.test.ts` (`formats amount-based remaining text`, `cent-scale condition math`); visual parity replay pending. |
| D07 | Highest eligible tier | Only the correct qualified tier drives totals/messages | **P** PLS1 | **P** PG06 | **P** HS06 | **P** VS03 |
| D08 | Discount messaging disabled/enabled | Message visibility follows its own toggle | **P** Shared unit + lifecycle coverage and fixture replay evidence for footer hide/show | **P** Shared unit + lifecycle coverage and fixture replay evidence for footer hide/show | **P** Shared unit + lifecycle coverage and fixture replay evidence for footer hide/show | **P** Shared unit + lifecycle coverage and fixture replay evidence for footer hide/show |
| D09 | Discount message variables and custom copy | Remaining quantity/amount, value/unit, discounted items | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-modal-accessibility.test.ts` |
| D10 | Progress bar off / simple / step-based | Each saved display mode renders independently | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-discount-config.spec.md` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-discount-config.spec.md` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-discount-config.spec.md` | **P** `ppb-product-page-footer-discount-messaging-toggle.test.ts` + `ppb-product-page-discount-config.spec.md` |
| D11 | Bundle Quantity Options | EB applicability and runtime output explicitly resolved per template | **E** PL06 captured inert/false state | **T** | **T** | **T** |
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
| S06 | Default/preselected products | Valid defaults initialize; invalid/unavailable defaults resolve safely | **T** | **T** | **T** | **T** |
| S07 | First load / final-root loading | EB can expose the native product form until its widget asset initializes under constrained network; WPB keeps native controls hidden and loads inside the final widget target | **P** PLS5 | **P** PG05 | **X** HS07 accepted final-root loader architecture | **X** VS10 accepted native-flash prevention |
| S08 | Hard reload after selection | EB/WPB state-reset or persistence behavior matches | **S** VS12 shared source; PLS3 did not isolate selected-state reload | **P** PG09 | **S** VS12 shared source; HSS3 proved slot-capacity reset, not selected-state reload | **P** VS12 |
| S09 | Successful cart add | Valid child selection reaches the expected cart result | **P** PL08 | **S** Shared PPB cart path only | **P** HS08 | **S** Shared PPB cart path only |
| S10 | Blocked cart add | Invalid selection cannot create a cart mutation | **P** PL02/PL08 | **S** Intermediate validation proven, cart mutation not isolated | **P** HS08/HS10 | **S** Final validation proven, cart mutation not isolated |
| S11 | Child properties and parent transform | Offer ID, component data, parent line, and visible metadata match EB semantics | **P** PL08 | **S** HS shared contract only | **P** HS08 | **S** HS shared contract only |
| S12 | `bundle_details` accumulation | Shopify cart metafield records the resulting bundle | **P** PL08 | **S** HS shared contract only | **P** HS08 | **S** HS shared contract only |
| S13 | Discount transform proof | Cart price/allocation agrees with displayed discount | **P** PL08 | **S** HS shared contract only | **P** HS08 | **S** HS shared contract only |
| S14 | Dynamic checkout / accelerated checkout | Native bypass behavior explicitly accepted or prevented | **T** | **T** | **X** HS10 safety divergence | **T** |
| S15 | `addBundleToCartOnDone` | Saved global setting controls final-step cart behavior | **P** `addBundleToCartAfterLastStepCompleted` and `addBundleToCartOnDone` honored for auto-add final-step flow | **P** `addBundleToCartAfterLastStepCompleted` and `addBundleToCartOnDone` honored for auto-add final-step flow | **P** `addBundleToCartAfterLastStepCompleted` and `addBundleToCartOnDone` honored for auto-add final-step flow | **P** `addBundleToCartAfterLastStepCompleted` and `addBundleToCartOnDone` honored for auto-add final-step flow |
| S16 | Per-product quantity validation | `validateQuantityPerProduct` and maximum quantity are enforced independently of step rules | **S** Default quantity behavior proven; enabled/disabled control not isolated | **T** | **T** | **T** VS06 current configuration mismatch recorded |
| S17 | Catalog pagination counts | Product and collection fetch counts load additional products without duplicates or lost selection | **P** PLS3 collection reload | **T** | **S** Collection hydration proven; pagination boundary not isolated | **T** |

## 6. Bundle Settings, Visibility, Subscriptions, and Global Controls

These controls can affect every template even when they are configured outside
the template selector. A single default-state screenshot is not proof of the
toggle or alternate-value behavior.

| ID | Feature / setting | EB storefront contract | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- |
| G01 | Bundle Visibility product/collection targeting | Widget appears only on configured product contexts | **T** | **T** | **T** | **T** |
| G02 | Add Browsed Product / preselection | Browsed product is preselected when eligible | **T** | **T** | **T** | **T** |
| G03 | Upsell block/button handoff | Builder/upsell entry preserves offer and selection context | **P** [G03 upsell widget handoff evidence](ppb-deferred-functional-parity/G03-upsell-widget-handoff-evidence.md) | **P** [G03 upsell widget handoff evidence](ppb-deferred-functional-parity/G03-upsell-widget-handoff-evidence.md) | **P** [G03 upsell widget handoff evidence](ppb-deferred-functional-parity/G03-upsell-widget-handoff-evidence.md) | **P** [G03 upsell widget handoff evidence](ppb-deferred-functional-parity/G03-upsell-widget-handoff-evidence.md) |
| G04 | Pre-order and Subscription Integration | Selling-plan selection reaches product cards and cart payload | **T** | **T** | **T** | **T** |
| G05 | PPB Subscriptions | Common-plan validation and selected plan affect the storefront/cart | **T** | **T** | **T** | **T** |
| G06 | Cart line-item discount display | Saved retail/savings display option reaches cart lines | **S** PL08 records a settings difference | **T** | **T** | **T** |
| G07 | Bundle-level custom CSS | Scoped merchant CSS applies without cross-template leakage | **T** | **T** | **T** | **T** |
| G08 | Bundle active/inactive status | Inactive bundle does not mount or mutate cart | **T** | **T** | **T** | **T** |
| G09 | `hideOutOfStockProducts` | Alternate true/false states match EB | **S** True/default behavior proven | **S** True/default behavior proven | **S** True/default behavior proven | **S** Shared modal behavior only |
| G10 | `displayPrices` | Prices hide/show without breaking card geometry | **T** | **T** | **T** | **T** |
| G11 | `displayCompareAtPrices` | Compare-at visibility follows the saved global setting | **T** | **T** | **P** HS02 | **T** |
| G12 | `displaySwatchColours` / `displaySwatchImages` | Swatch controls alter variant presentation | **T** | **T** | **T** | **T** |
| G13 | `displayConditionDescriptions` | Rule descriptions appear only when enabled | **T** | **T** | **T** | **T** |
| G14 | Cart icon and cart style | Alternate icon/style values render correctly | **T** | **T** | **T** | **T** |
| G15 | Product/slot card style presets | Alternate card style values remain template-correct | **T** | **T** | **T** | **T** |
| G16 | Checkout button style | Alternate CTA style remains usable/responsive | **T** | **T** | **T** | **T** |
| G17 | Bundle-adding animation | Saved animation mode and reduced-motion behavior | **T** | **T** | **S** Default modal animation only | **S** Default modal animation only |
| G18 | CTA text configuration | Saved merchant copy and long/localized text render correctly | **T** | **T** | **T** | **T** |
| G19 | Bundle summary configuration | Title/subtitle/totals copy reaches the correct summary surface | **T** | **T** | **T** | **T** |
| G20 | Pricing configuration | Displayed original/savings/total fields follow saved visibility/copy | **T** | **T** | **T** | **T** |
| G21 | Store-level language/locale | PPB controls, validation, and CTA use the active locale | **T** | **T** | **T** | **T** |
| G22 | Track inventory on Add To Cart | Cart-time inventory validation follows the saved control | **T** | **T** | **T** | **T** |
| G23 | Hide completed step titles | Completed-step headings hide/show without breaking navigation | **T** | **T** | **T** | **T** |
| G24 | Redirect Collection Quick Add to Bundle | Theme quick-add enters the correct PPB offer/context | **T** | **T** | **T** | **T** |
| G25 | Cart messaging | Saved bundle-cart line message and language reach the cart | **T** | **T** | **T** | **T** |
| G26 | Discount display format | Amount + percentage, amount-only, and percentage-only formats match EB | **T** | **T** | **T** | **T** |
| G27 | Redirect settings | Default side-cart update, checkout redirect, and cart redirect follow the saved mode | **T** | **T** | **T** | **T** |
| G28 | Execute script | Saved Product Page script executes at the EB-defined lifecycle without duplicate execution | **T** | **T** | **T** | **T** |
| G29 | Loading image/GIF | Merchant-selected loading media remains contained at the final widget root | **T** | **T** | **T** | **T** |
| G30 | Brand colors | Base PPB colors propagate to every applicable template surface | **T** | **T** | **T** | **T** |
| G31 | Typography | Font family, weight, and scale propagate without theme leakage | **T** | **T** | **T** | **T** |
| G32 | Corners | Card, control, modal, slot, and CTA radii follow the saved design tokens | **T** | **T** | **T** | **T** |
| G33 | Images and GIF settings | Saved design media appears in its intended PPB surface | **T** | **T** | **T** | **T** |
| G34 | Expert color controls | General, Product Card, Bundle Cart, and Upsell scopes override only their owner surfaces | **T** | **T** | **T** | **T** |
| G35 | Product Page custom CSS scope | Store-level PPB CSS remains scoped and distinct from Landing Page CSS | **T** | **T** | **T** | **T** |
| G36 | Product Card language fields | Add, variant, added, and inline-add labels use the active Product Page locale | **T** | **T** | **T** | **T** |
| G37 | Bundle Cart / Bundle / Toast language fields | Summary, CTA, validation, and toast copy use the active locale | **T** | **T** | **T** | **T** |
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

The final storefront visual pass proves the template shells, product-card and
modal-card hierarchy, selected states, toasts, responsive tracks, overflow,
template isolation, and the current desktop/mobile fixtures. Product Grid PG09
also closes grouped-variant and category-scoped reload presentation.

The remaining **S** and **T** cells are active functional-verification work.
They are not silently promoted from source coverage or another template's
evidence.

Final evidence counts across the 119 feature rows:

| Template | Proven | Shared/partial | Not tested | EB-absent | Accepted divergence | Not applicable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Product List | 53 | 9 | 41 | 3 | 1 | 12 |
| Product Grid | 50 | 10 | 45 | 1 | 1 | 12 |
| Horizontal Slots | 64 | 7 | 42 | 1 | 4 | 1 |
| Vertical Slots | 53 | 15 | 46 | 1 | 3 | 1 |

Overall cells across all templates:

- Total cells: **476** (119 × 4 template columns)
- Proven: **220**
- Shared/partial: **41**
- Not tested: **174**
- EB-absent: **6**
- Accepted divergence: **9**
- Not applicable: **26**

These totals are an evidence inventory, not a product-quality score. One
feature row can require several value permutations before it becomes Proven.

High-risk missing evidence is concentrated in:

1. fixed amount, fixed bundle price, BOGO, amount thresholds, and independent
   discount display controls;
2. default/preselected products and disabled-validation behavior;
3. individual variants and swatches across each applicable template;
4. template-specific cart/metadata proof for Product Grid and Vertical Slots;
5. Bundle Visibility, browsed-product preselection, subscriptions/selling plans,
   and cart-line discount display;
6. alternate global PPB control values and localized/custom text;
7. direct Vertical Slots inventory, variant, and delayed-load proof.

Those rows are being completed through the active functional-parity goal. The
earlier storefront visual replay remains valid, but it is not the completion
boundary for this matrix.

## Active Functional Completion

Work through the remaining rows in deterministic slices. For each row, inspect EB help content first,
configure EB through Admin, capture EB desktop/mobile truth, mirror WPB, record
the persisted/runtime values, exercise the behavior, and only then decide
whether implementation is required.

1. **Data and selection:** R08-R15, C06-C12, S05-S08.
2. **Discount modes:** D03-D12.
3. **Cart contracts:** S09-S15 for PG and VS first, then any changed template.
4. **Bundle-level features:** G01-G08.
5. **Global controls/design/language:** G09-G21.
6. **Final quality sweep:** Q05-Q07 are complete; rerun all four templates after the remaining functional rows close.

Every completed row must link its durable evidence note from this matrix. If a
row is proven inapplicable or EB-absent, record the EB Admin/runtime evidence
that establishes that result.
