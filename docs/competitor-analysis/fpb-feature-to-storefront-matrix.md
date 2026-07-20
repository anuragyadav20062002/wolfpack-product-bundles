---
schema_version: 1
id: fpb-feature-to-storefront-matrix
title: Full Page Bundle Feature-to-Storefront Verification Matrix
type: verification-matrix
status: active
summary: Groups FPB storefront parity features into fixture-efficient evidence sweeps across all four designs.
last_audited: 2026-07-20
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
  - competitor-analysis
systems:
  - full-page-bundle-widget
source_paths:
  - app/assets/widgets/full-page
  - app/assets/widgets/full-page-css
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/fpb-standard-agentic-parity/SPEC.md
  - docs/competitor-analysis/fpb-classic-agentic-parity/SPEC.md
  - docs/competitor-analysis/fpb-compact-horizontal-agentic-parity/SPEC.md
  - docs/refactor/full-page-and-product-page-template-verification-matrix.md
tags:
  - fpb
  - parity
  - verification
keywords:
  - FPB feature matrix
  - fixture groups
  - storefront parity
---

# Full Page Bundle Feature-to-Storefront Verification Matrix

This is the canonical FPB parity ledger for Standard, Classic, Compact, and
Horizontal. It follows the PPB evidence model, but adds fixture groups so a
single controlled fixture mutation can close many related feature rows before
the four designs are cycled.

The matrix is storefront-first. Admin is used only to create, persist, inspect,
and restore fixtures. Easy Bundles (EB) is the shopper-behavior and presentation
source of truth. Wolfpack Product Bundles (WPB) is the target.

## Template Keys

| Key | EB persisted preset | WPB persisted preset | Display name |
| --- | --- | --- | --- |
| ST | `DEFAULT_FBP` | `STANDARD` | Standard Design |
| CL | `CLASSIC` | `CLASSIC` | Classic Design |
| CO | `COMPACT` | `COMPACT` | Compact Design |
| HO | `HORIZONTAL` | `HORIZONTAL` | Horizontal Design |

All four use `bundleDesignTemplate: "FBP_SIDE_FOOTER"`. A template cell can be
proven only after its persisted preset, rendered root, and active preset CSS
asset agree.

## Status Keys

| Status | Meaning |
| --- | --- |
| **P** | Proven by current direct EB-first and equivalent WPB browser evidence for that design |
| **S** | Historical or shared-path evidence exists, but a current design-specific replay is still required |
| **X** | Directly tested and accepted as an intentional safety or product divergence |
| **E** | EB does not expose or execute the feature in the captured configuration; do not invent it |
| **N/A** | Structurally not applicable |
| **T** | Not tested with sufficient direct evidence |

Passing tests, source inspection, or proof from another design cannot promote a
cell from **S** or **T** to **P**. Existing Standard and Classic evidence is
initially **S** where the final template verification matrix still requires a
current replay. Compact and Horizontal cells are **P** only where the current
`5.0.192` dev-extension replay directly proved the row.

## Fixture-Minimizing Strategy

### Master rich fixture `F0`

Create one EB fixture and one WPB mirror with the same shopper-visible shape:

- Step 1 has three categories: a manual edge-product category, a large
  collection-backed category with one intentional manual duplicate, and a true
  empty category.
- Step 2 has one category, an exact quantity rule, auto-next, and a valid
  default product/variant.
- Step 3 is the add-on/gifting step and reuses already selected catalog items
  where EB permits it.
- The shared product set contains: no-variant, grouped multi-variant,
  unavailable variant, sale/compare-at, long title, missing media, square/tall/
  wide media, low stock, fully unavailable, and cart-time inventory candidates.
- Baseline rules use Step 1 quantity minimum `2` and Step 2 exact quantity `1`.
- Baseline discounts use percentage tiers at `2` and `3` items.
- Product Slots, custom slot icon, summary title/subtitle, step banner, long CTA
  copy, and add-on personalization are configured once.

Before any sweep, save complete EB and WPB persisted/runtime snapshots. After
each sweep, restore `F0` and prove the restored values with one cache-cleared
hard reload. Never rebuild the catalog between sweeps unless a row genuinely
requires a different Shopify product.

Measured competitor geometry is evidence, not an implementation value. Template
shells must inherit the Shopify host/container width. Card, grid, summary, and
tray geometry must be intrinsic and content-driven. Do not encode captured
viewport widths, store-specific maximum widths, or introduce `clamp()` rules
for this parity work.

### Fixture groups

| Group | Mutation owner | Minimal fixture change | Primary rows closed together |
| --- | --- | --- | --- |
| `F0` | Structure and template | Build the rich fixture once; then change only the preset | Shell, steps, categories, sources, base cards, timeline, summary, responsive baseline |
| `F1` | Product representation and inventory | Toggle variant representation, compare-at visibility, and OOS/inventory controls; keep products unchanged | Variants, media, stock, card states, collection hydration |
| `F2` | Rules and navigation | Change only rule mode/operator/value and auto-next; keep steps/categories/products unchanged | No rule, min, max, exact, amount, weight, category rules, blocking, auto-next |
| `F3` | Discounts and progress | Change only discount type, tiers, and display toggles | Disabled, percentage, fixed amount, fixed price, buy-X-get-Y, progress, messages, totals |
| `F4` | Defaults, slots, and box selection | Toggle defaults, Product Slots, slot icon, and Bundle Quantity Options | Empty/partial/full summary, invalid defaults, custom slots, box validation and tier switching |
| `F5` | Add-ons, gifts, and personalization | Toggle the existing Step 3/tier configuration only | Disabled, paid add-on, free gift, highest tier, add-on messages, fields, email capture |
| `F6` | Text, design, and media | Change only language/design settings and media | Long/localized copy, colors, typography, corners, banners, loading media, custom CSS |
| `F7` | Cart, redirect, and integration | Change only cart-time/global controls; reuse qualified selections | Blocked/success cart, properties, `bundle_details`, transform, inventory recheck, redirects, script |
| `F8` | Quality and isolation | No merchant fixture mutation; cycle presets and viewports | Responsive placement, keyboard, loading, CSS isolation, console/network health, reload persistence |

### Efficient execution rule

For each group: capture EB once, cycle ST → CL → CO → HO without changing the
feature fixture, restore EB, mirror the group once in WPB, cycle the same four
designs, restore WPB, then update all rows covered by that group together. Do
not execute row-by-row Admin mutations.

## 1. Runtime, Structure, Categories, and Sources

| ID | Group | Feature / state | EB storefront contract | ST | CL | CO | HO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R01 | F0 | Template dispatch and dedicated shell | Persisted preset resolves one root and only the matching preset stylesheet | **P** F0-191 | **P** F0-191 | **P** F0-191 | **P** F0-191 |
| R02 | F0 | Public FPB placement | Signed app-proxy page mounts the builder inside the active theme | **P** F0-191 | **P** F0-191 | **P** F0-191 | **P** F0-191 |
| R03 | F0 | Single-step bundle | One shopper stage with the final cart action | **S** | **S** | **S** | **S** |
| R04 | F0 | Multi-step bundle | One active step; Next/Back retain selections | **S** | **S** | **S** | **P** C04 |
| R05 | F0 | Add-on/gifting step | Product steps hand off to the configured add-on stage | **S** | **S** | **S** | **P** C06 |
| R06 | F0 | Multiple categories | Category navigation changes the visible catalog without losing state | **S** | **S** | **P** C01 | **P** C01 |
| R07 | F0 | Long category labels | Labels wrap or scroll within their owner without page overflow | **S** | **S** | **P** C01 | **P** C01 |
| R08 | F0 | True empty category | EB hide/empty-state behavior is mirrored; no fabricated products | **S** | **S** | **P** C01 | **P** C01 |
| R09 | F0 | Manual product source | Persisted manual products hydrate and render | **S** | **S** | **P** C01 | **P** C01 |
| R10 | F0 | Collection-backed source | Collection products hydrate by batch, paginate, and filter correctly | **S** | **S** | **P** C01 | **P** C01 |
| R11 | F0 | Mixed manual + collection | Both sources coexist without duplicates or state loss | **S** | **S** | **P** C01 | **P** C01 |
| R12 | F0 | Cloned step | Cloned structure remains independent and ordered | **S** | **S** | **T** | **T** |
| R13 | F0 | Disabled step | Disabled Admin steps never render or block progression | **T** | **T** | **T** | **T** |
| R14 | F0 | Step timeline | Current, completed, and future states match EB | **S** | **S** | **S** | **S** |
| R15 | F6 | Step/category banner media | Saved desktop/mobile media renders at the EB-owned stage | **S** | **S** | **T** | **T** |
| R16 | F8 | First load and cache-bypassed reload | No wrong-preset flash; restored fixture renders identically | **S** | **S** | **P** C08 | **P** C08 |

## 2. Product Cards, Variants, Media, and Inventory

| ID | Group | Feature / state | EB storefront contract | ST | CL | CO | HO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C01 | F0 | Complete card hierarchy | Image, title, price, variant identity, and action remain reachable | **S** | **S** | **P** C02 | **P** C02 |
| C02 | F0 | Long title and content-driven height | Content wraps without clipping or card/action overlap | **S** | **S** | **P** C02 | **P** C02 |
| C03 | F1 | Sale and compare-at price | Price cluster and visibility follow the saved setting | **S** | **S** | **P** C02 | **P** C02 |
| C04 | F1 | Square, tall, and wide media | Mixed aspect ratios remain contained | **S** | **S** | **T** | **T** |
| C05 | F1 | Missing media | EB behavior is recorded; WPB uses a stable accepted fallback if different | **S** | **S** | **T** | **T** |
| C06 | F1 | Grouped variant selector | Option selection preserves product and variant identity | **S** | **P** C03 | **T** | **T** |
| C07 | F1 | Variants as individual products | The saved toggle changes catalog representation | **S** | **P** C03 | **P** C02 | **P** C02 |
| C08 | F1 | Unavailable variant | Unavailable values are hidden or disabled exactly as EB | **S** | **P** C03 | **P** C02 | **P** C02 |
| C09 | F1 | Sole sellable variant | Selector is omitted while surviving identity remains visible | **T** | **T** | **T** | **T** |
| C10 | F1 | Fully unavailable product | Hide/block behavior follows saved inventory controls | **S** | **S** | **P** C02 | **P** C02 |
| C11 | F1 | Low-stock presentation | Remaining inventory copy and selection limit match EB | **T** | **T** | **T** | **T** |
| C12 | F1 | Add, selected, quantity, and remove states | State transitions are stable and reversible | **S** | **S** | **P** C03 | **P** C03 |
| C13 | F1 | Maximum per-product quantity | Add/quantity controls enforce the configured limit | **T** | **T** | **T** | **T** |
| C14 | F1 | Hover and keyboard card activation | Hover never causes layout growth; keyboard uses the same state path | **S** | **S** | **P** S03 | **P** S03 |
| C15 | F1 | Collection pagination and dedupe | Large categories cross the batch boundary without duplicates | **S** | **S** | **T** | **T** |

## 3. Rules, Validation, and Navigation

Step Rules and Category Rules are mutually exclusive. Category Rules require
multiple categories in the current step. `F2` must mutate one rule owner at a
time and restore the `F0` minimum/exact baseline after every permutation.

| ID | Group | Feature / state | EB storefront contract | ST | CL | CO | HO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N01 | F2 | No rule | Selection remains open-ended and progression follows EB | **S** | **S** | **T** | **T** |
| N02 | F2 | Step quantity minimum | Below-min blocks; threshold permits progression and overflow where EB permits it | **S** | **S** | **S** | **P** C04 |
| N03 | F2 | Step quantity exact | Over-target selection is prevented; edit/replacement remains possible | **S** | **S** | **S** | **P** C04 |
| N04 | F2 | Step quantity maximum | Maximum is enforced without corrupting selected state | **S** | **S** | **S** | **P** C04 |
| N05 | F2 | Step amount rule | Selected price controls eligibility and remaining-amount feedback | **S** | **S** | **T** | **T** |
| N06 | F2 | Step weight rule | Selected variant weight controls eligibility when current FPB Admin exposes it | **S** | **S** | **T** | **T** |
| N07 | F2 | Category quantity rule | Each category validates independently | **S** | **S** | **T** | **T** |
| N08 | F2 | Category amount rule | Category subtotal controls its own eligibility | **P** P04 | **S** | **T** | **T** |
| N09 | F2 | Category weight rule | Category weight controls its own eligibility when exposed | **S** | **S** | **T** | **T** |
| N10 | F2 | Auto-next enabled/disabled | Only the saved eligible exact rule advances automatically | **S** | **P** C02 | **S** | **P** C04 |
| N11 | F2 | Invalid Next/Back/cart feedback | Action remains usable enough to explain the unmet rule | **S** | **S** | **S** | **P** C04 |
| N12 | F2 | Validation disabled | Saved control permits otherwise invalid progression/cart without stale errors | **T** | **T** | **T** | **T** |

## 4. Summary, Product Slots, Mobile Tray, and Box Selection

| ID | Group | Feature / state | EB storefront contract | ST | CL | CO | HO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M01 | F0 | Desktop empty summary | Title, count, slots/rows, totals, and action render coherently | **S** | **S** | **S** | **P** C07 |
| M02 | F0 | Desktop partial/full summary | Selected order, quantities, images/text, totals, and removal stay synchronized | **S** | **S** | **S** | **P** C07 |
| M03 | F4 | Product Slots disabled | Summary uses the EB text/row branch | **P** P03 | **S** | **T** | **T** |
| M04 | F4 | Product Slots enabled | Summary uses empty/filled image slots based on quantity rules | **P** P03 | **S** | **S** | **S** |
| M05 | F4 | Custom slot icon | Merchant slot icon replaces the default plus only where applicable | **S** | **S** | **T** | **T** |
| M06 | F4 | Empty/partial/complete slot states | Slot count and fill state follow the saved condition | **S** | **S** | **S** | **S** |
| M07 | F0 | Mobile tray collapsed | Count, CTA, price, and qualification remain readable | **S** | **S** | **P** F0-CO-191 | **P** C07 |
| M08 | F0 | Mobile tray expanded | Selected rows/slots, remove actions, messages, and totals remain reachable | **S** | **S** | **S** F0-CO-191 | **P** C07 |
| M09 | F8 | Tray scroll and background behavior | Sticky/expanded behavior matches EB without viewport overflow | **S** | **S** | **P** S02 | **P** S02 |
| M10 | F4 | Bundle Quantity Options disabled/enabled | Box/tier selection appears only when saved and changes the active target | **S** | **S** | **T** | **T** |
| M11 | F4 | Box underfill/exact/overfill | Add and cart actions enforce the selected box quantity | **S** | **S** | **T** | **T** |
| M12 | F4 | Box/tier switch with existing selections | EB-prescribed selection retention/reset and totals are mirrored | **T** | **T** | **T** | **T** |

## 5. Discounts, Progress, Messaging, and Totals

| ID | Group | Feature / state | EB storefront contract | ST | CL | CO | HO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D01 | F3 | Discounts disabled | Original totals render with no progress/message leak | **S** | **S** | **T** | **T** |
| D02 | F3 | Percentage tiers | Threshold, savings, progress, success, and final total match EB | **S** | **S** | **S** | **S** |
| D03 | F3 | Fixed amount off | Quantity/amount threshold and totals match EB | **S** | **S** | **T** | **T** |
| D04 | F3 | Fixed bundle price | Display, totals, and cart result match EB | **P** P04 | **S** | **T** | **T** |
| D05 | F3 | Buy X, Get Y | Buy/get threshold, discounted-item choice, copy, and cart result match EB | **S** | **S** | **T** | **T** |
| D06 | F3 | Amount-based discount threshold | Currency threshold and remaining amount text match EB | **S** | **S** | **T** | **T** |
| D07 | F3 | Highest eligible tier | Only the highest qualified tier drives totals and messages | **S** | **S** | **S** | **S** |
| D08 | F3 | Progress off/simple/step-based | Each saved presentation mode renders independently | **S** | **S** | **T** | **T** |
| D09 | F3 | Discount messaging off/on | Message visibility follows its own saved control | **S** | **S** | **T** | **T** |
| D10 | F3 | Variables and custom copy | Remaining quantity/amount, value/unit, and discounted-item variables resolve | **S** | **S** | **T** | **T** |
| D11 | F3 | Inline/additional-offer badge | Qualification pill/banner appears and settles at the EB-owned surface | **S** | **S** | **T** | **T** |
| D12 | F3 | Original/savings/total fields | Visibility, order, currency, and values follow saved pricing settings | **S** | **S** | **S** | **S** |
| D13 | F6 | Multi-language discount/progress labels | Active locale selects the correct saved labels without fallback copy | **S** | **S** | **T** | **T** |

## 6. Add-Ons, Free Gifts, and Personalization

| ID | Group | Feature / state | EB storefront contract | ST | CL | CO | HO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A01 | F5 | Add-ons disabled | No add-on stage, tier, or message leaks into the shopper flow | **S** | **S** | **T** | **T** |
| A02 | F5 | Gifting step only | Gifting stage appears in the configured sequence | **P** P08 | **S** | **S** | **P** C06 |
| A03 | F5 | Paid add-on tier | Eligible shopper can add the paid add-on at the configured price | **P** P09 | **S** | **T** | **P** C06 |
| A04 | F5 | Free/100% add-on tier | Eligible item becomes free at the configured threshold | **P** P10 | **S** | **T** | **P** C06 |
| A05 | F5 | Multiple eligible tiers | Highest eligible tier wins without duplicate gifts | **P** P10 | **S** | **T** | **T** |
| A06 | F5 | Qualification and de-qualification | Add/remove immediately updates eligibility, copy, and totals | **S** | **S** | **T** | **T** |
| A07 | F5 | Add-on product variants | Variant identity and price survive add/remove and cart add | **S** | **S** | **T** | **T** |
| A08 | F5 | Add-on step navigation | Back/Next preserves core selections and add-on state | **S** | **S** | **S** | **P** C06 |
| A09 | F5 | Free-gift/sidebar presentation | Gift appears at the EB-owned summary/footer position | **S** | **S** | **T** | **T** |
| A10 | F5 | Personalization fields | Configured field types, required validation, and values reach cart metadata | **P** P08 | **S** | **T** | **T** |
| A11 | F5 | Shopper messages | Configured message controls render, validate, and persist | **P** P08 | **S** | **T** | **T** |
| A12 | F5 | Email capture | Optional/required behavior and captured value match EB | **S** | **S** | **T** | **T** |
| A13 | F5 | Add-on custom copy/locales | Active locale controls add-on/gift labels and validation | **S** | **S** | **T** | **T** |
| A14 | F7 | Add-on cart pricing and metadata | Paid/free pricing, offer IDs, and line properties survive checkout | **P** P09/P10 | **P** C08 | **T** | **T** |
| A15 | F5 | Sidebar add-on/upsell slot | Configured upsell appears only at the EB-owned summary stage and does not displace core selections | **S** | **S** | **T** | **T** |

## 7. Selection State, Cart, Redirects, and Integration

| ID | Group | Feature / state | EB storefront contract | ST | CL | CO | HO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | F0 | Empty/one/multiple/overflow selection | State remains usable and content-driven | **S** | **S** | **P** C03 | **P** C03 |
| S02 | F0 | Selection across category/step changes | Catalog and summary retain identical item identity | **S** | **P** C02 | **S** | **P** C04 |
| S03 | F4 | Valid default product/variant | Valid defaults initialize once and synchronize summary/card state | **S** | **S** | **S** | **S** |
| S04 | F4 | Invalid/unavailable default | Invalid defaults are ignored or recovered without blocking load | **S** | **S** | **T** | **T** |
| S05 | F8 | Reload/session persistence | EB-defined selections persist/reset after hard reload exactly as captured | **S** | **S** | **P** C08 | **P** C08 |
| S06 | F7 | Blocked Add to Cart | Invalid bundle shows EB feedback and sends no cart request | **S** | **P** C08 | **S** | **S** |
| S07 | F7 | Successful Add to Cart | Qualified bundle reaches cart/checkout once | **S** | **P** C08 | **P** C09 | **P** C09 |
| S08 | F7 | Cart line properties | Bundle, step, category, variant, personalization, and add-on identity are correct | **S** | **P** C08 | **P** C09 | **P** C09 |
| S09 | F7 | `bundle_details` cart metafield | Existing values merge and the current offer entry is complete | **S** | **P** C08 | **P** C09 | **P** C09 |
| S10 | F7 | Discount transform result | Cart/checkout prices and savings match the qualified storefront state | **S** | **S** | **P** C09 | **P** C09 |
| S11 | F7 | Track inventory on Add to Cart | Cart-time inventory recheck follows the saved control | **S** | **S** | **T** | **T** |
| S12 | F7 | Redirect mode | Side-cart/default, cart, and checkout outcomes follow the saved mode | **T** | **T** | **T** | **T** |
| S13 | F7 | Execute script lifecycle | Saved Landing Page script runs once at the EB-defined lifecycle | **T** | **T** | **T** | **T** |

## 8. Text, Design, Storefront Controls, and Media

| ID | Group | Feature / state | EB storefront contract | ST | CL | CO | HO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G01 | F6 | Bundle summary title/subtitle | Saved copy renders in sidebar/mobile tray without fallback text | **P** F0-191 | **P** F0-191 | **P** F0-191 | **P** F0-191 |
| G02 | F6 | CTA and navigation copy | Add/Next/Back/Done/cart text uses saved long/localized copy | **S** | **S** | **T** | **T** |
| G03 | F6 | Product-card copy | Add, selected, variant, quantity, remove, and sold-out labels use active locale | **S** | **S** | **T** | **T** |
| G04 | F6 | Store-level language/locale | All shared and preset surfaces consume one active locale consistently | **S** | **S** | **T** | **T** |
| G05 | F6 | Brand colors | Base colors propagate only to intended FPB surfaces | **S** | **S** | **T** | **T** |
| G06 | F6 | Typography | Font family, weight, and scale propagate without theme leakage | **S** | **S** | **T** | **T** |
| G07 | F6 | Corners and control shapes | Cards, buttons, pills/tabs, tray, and summary use saved tokens | **S** | **S** | **T** | **T** |
| G08 | F6 | Expert color controls | Each control overrides only its owner surface | **S** | **S** | **T** | **T** |
| G09 | F6 | Landing Page custom CSS scope | Merchant CSS remains FPB-scoped and does not leak into theme/PPB | **T** | **T** | **T** | **T** |
| G10 | F6 | Desktop/mobile banners | Correct viewport asset appears without layout shift or distortion | **S** | **S** | **T** | **T** |
| G11 | F6 | Loading image/GIF | Saved loading media appears without wrong-preset/title flash | **S** | **P** CS5 | **T** | **T** |
| G12 | F1 | Show compare-at prices | Visibility follows the saved control independently from product data | **S** | **S** | **T** | **T** |
| G13 | F1 | Show text on Add button | Icon/text action follows saved configuration without preset drift | **S** | **S** | **P** C00 note | **P** C00 note |
| G14 | F1 | Variant selector enabled/disabled | Grouped options appear only when configured and applicable | **S** | **P** C03 | **T** | **T** |
| G15 | F1 | Hide out-of-stock products | Visible/hidden unavailable catalog behavior follows saved control | **S** | **S** | **T** | **T** |
| G16 | F7 | Inventory tracking control | Storefront selection/cart behavior follows the single saved source | **S** | **S** | **T** | **T** |
| G17 | F8 | Store header/footer visibility | Theme chrome is shown/hidden according to the FPB setting without displacing the widget | **T** | **T** | **T** | **T** |
| G18 | F6 | Step timeline visibility | Saved timeline control shows/hides the shopper timeline without changing navigation behavior | **S** | **S** | **T** | **T** |
| G19 | F3 | Bundle footer condition/discount messaging | Footer copy and visibility follow their independent saved controls | **S** | **S** | **T** | **T** |
| G20 | F7 | Cart-line messaging | Saved bundle/cart message and active locale reach cart and checkout lines | **S** | **S** | **T** | **T** |
| G21 | F7 | Discount display format | Amount plus percentage, amount-only, and percentage-only formats follow the saved setting | **T** | **T** | **T** | **T** |
| G22 | F8 | Bundle visibility and preview access | Active/unlisted public access and signed draft preview follow the persisted status without leaking drafts | **T** | **T** | **T** | **T** |
| G23 | F8 | App embed/page marker ownership | FPB mounts once from the supported marker path and does not duplicate the widget when both placement paths exist | **S** | **S** | **T** | **T** |

## 9. Responsive, Accessibility, Isolation, and Runtime Health

| ID | Group | Feature / state | EB storefront contract | ST | CL | CO | HO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q01 | F8 | Desktop `1440x900` and `1280x800` | Dense content remains aligned and reachable | **S** | **S** | **S** | **P** S01 |
| Q02 | F8 | Tablet `768x1024` | Layout adapts without clipped cards, tabs, summary, or CTA | **T** | **T** | **S** | **P** S02 |
| Q03 | F8 | Mobile `390x844` and `360x800` | Content and sticky tray fit the visual viewport | **S** | **S** | **S** | **P** S02 |
| Q04 | F8 | No page/component overflow | Document overflow is zero; internal scrollers remain contained | **P** F0-191 | **P** F0-191 | **P** F0-191 | **P** F0-191 |
| Q05 | F8 | Preset CSS and DOM isolation | Only active base + preset ownership applies | **P** F0-191 | **P** F0-191 | **P** F0-191 | **P** F0-191 |
| Q06 | F8 | Keyboard access | Category, card, variant, summary, navigation, and cart controls are operable | **S** | **S** | **P** S03 | **P** S03 |
| Q07 | F8 | Accessible names and state | Controls expose usable names, disabled/pressed/expanded state, and focus | **S** | **S** | **P** S03 | **P** S03 |
| Q08 | F8 | Console and app-owned request health | No unexplained app-owned errors or failed widget/cart requests | **S** | **S** | **P** F0-CO-191 | **P** |
| Q09 | F8 | Responsive placement robustness | Content-driven CSS survives narrow/wide theme containers without store-specific constants | **T** | **T** | **T** | **T** |
| Q10 | F8 | Cross-template regression | Shared fixes do not change unrelated FPB presets or PPB | **S** | **S** | **S** | **S** |

## Evidence Contract

Store raw evidence outside the repository:

```text
/private/tmp/fpb-feature-parity/<group-id>/<eb-or-wpb>/<template-key>/
```

Each terminal **P**, **E**, or **X** decision requires:

- persisted Admin state or saved request payload;
- runtime template/config snapshot;
- cache-cleared hard reload with exact active CSS URLs;
- desktop and mobile screenshots plus accessibility snapshots;
- row-specific computed geometry and interaction log;
- relevant console and app-owned network health;
- cart proof when the row reaches cart, or a written not-applicable reason;
- an EB/WPB `delta.md` explaining parity, divergence, or implementation need.

Evidence notes committed to the repository must link the corresponding rows and
group. Screenshots, HAR files, and raw captures remain under `/private/tmp`.

### Current evidence batches

| Batch | Scope | Raw evidence |
| --- | --- | --- |
| `F0-192` | Current EB/WPB ST → CL → CO → HO preset sweep; exact active preset assets; configured summary copy; desktop/mobile containment; EB Compact and WPB Horizontal restores. Compact collapsed tray is proven. Intrinsic, token-driven CSS corrected the expanded-state presentation, and `5.0.192` names the icon-only removal controls. A fresh EB Admin/runtime capture proves the current fixture still has two non-empty categories, exact-2 auto-next on Step 1, no Step 2 rule, disabled defaults, and disabled fixed-amount discounts. Structural fixture drift and the non-equivalent Bundle Quantity Options state keep the affected F0 cells non-terminal. | `/private/tmp/fpb-feature-parity/F0/{eb,wpb}/{ST,CL,CO,HO}/runtime-summary.md`, `/private/tmp/fpb-feature-parity/F0/eb/baseline/persisted-runtime-summary.md`, `/private/tmp/fpb-feature-parity/F0/CO-delta.md`, `/private/tmp/fpb-feature-parity/F0/delta.md` |

`F0-192` does not claim structural fixture equivalence, empty/partial/stress
summary coverage, tablet coverage, or cart coverage. Rows requiring those
states remain **S** or **T**.

## Completion Boundary

FPB feature parity is complete only when:

1. Every cell is terminal: **P**, **E**, **X**, or **N/A**. No **S** or **T**
   cells remain.
2. Every **P** cell links direct EB-first and equivalent WPB evidence for that
   design; shared source/tests alone are insufficient.
3. Every **E** cell records the EB Admin/runtime absence that prevents a
   shopper-visible state.
4. Every **X** cell records the observed difference and the safety/product
   reason for retaining it.
5. Every fixture group is restored to `F0`, and the final EB/WPB baseline is
   hard-reload verified.
6. All four designs pass desktop, tablet, mobile, keyboard, overflow, exact
   active-CSS, console/network, selection, navigation, summary, and cart smoke.
7. Any code change is verified at source, rebuilt into generated assets, and
   proven in the user-provided dev environment before the affected cells are
   promoted.
