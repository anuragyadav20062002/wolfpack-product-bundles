# FPB Standard Agentic Parity Spec

**Spec ID:** fpb-standard-agentic-parity
**Created:** 2026-06-28
**Scope:** Full-Page Bundle Standard storefront parity only
**Execution breadth:** Pairwise + stress
**Evidence root:** `/private/tmp/fpb-standard-agentic-parity/`

## Purpose

This spec defines a repeatable agentic loop for making Wolfpack FPB Standard storefronts match EB Standard storefront behavior. EB is the live source of truth. Wolfpack is the target.

This is not a request to build a new Admin UI, PPB parity, or full cross-product exhaustive run. The full matrix is documented here, but execution uses a deterministic pairwise run set plus explicit high-risk stress cases.

## Ground Rules

- Configure EB first through Chrome DevTools MCP, then mirror Wolfpack through Chrome DevTools MCP.
- Do not use backend shortcuts unless the UI is blocked and the user explicitly approves that shortcut.
- Capture EB truth before editing code.
- Keep screenshots and raw browser captures under `/private/tmp/fpb-standard-agentic-parity/<case-id>/`.
- Commit only durable docs and source changes. Do not commit screenshots or raw browser captures.
- Update `internal docs/EB Implementation Reference.md` only when the loop discovers durable EB behavior that is not already documented.
- Preserve the current FPB runtime boundary: config load stays metafield/cache pointer first, proxy API fallback second.
- EB Standard uses `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "DEFAULT_FBP"`. Wolfpack's canonical Standard preset remains `STANDARD`; map EB `DEFAULT_FBP` to Wolfpack `STANDARD` at the boundary.
- Do not rename public runtime keys unless fresh EB evidence proves a hard gap.
- Standard styling fixes must live in source CSS under Standard-scoped selectors, such as `[data-fpb-design-preset="STANDARD"]`, or the current Standard-owned stylesheet/module if the repo already routes Standard that way.
- Do not use JavaScript DOM injection or runtime HTML composition for visual layout fixes.
- Do not add broad selectors that can affect Classic, Compact, Horizontal, PPB, or theme-owned storefront UI.
- Do not add competitor-name references in code. Competitor names belong in docs only.
- Layout implementation must avoid hardcoded pixel layout values. EB pixel measurements are evidence only. Prefer scoped custom properties, container-relative sizing, `fr`, `%`, `rem`, `clamp()`, `minmax()`, and `aspect-ratio`.
- Unit tests must cover behavior/data contracts only. Do not add tests that grep CSS, class names, source order, or visual placement.

## Source References

Read these before every run:

| Order | Source | Use |
|---|---|---|
| 1 | `internal docs/EB Implementation Reference.md` | Confirmed EB data, runtime, template, cart, and rules behavior |
| 2 | `docs/competitor-analysis/16-eb-full-data-flow-investigation.md` | Raw evidence when the reference doc lacks detail |
| 3 | Live Chrome DevTools MCP capture | Only for gaps, stale facts, or row-specific evidence |
| 4 | `internal docs/Architecture/Widget Architecture.md` | Wolfpack runtime boundaries and widget build rules |
| 5 | `graphify-out/GRAPH_REPORT.md` | Communities and downstream risk before source changes |

## Feature Matrix

Every axis value below must be represented by at least one pairwise or stress row before this loop is considered complete.

| Axis | Values |
|---|---|
| Bundle structure | Single-step, multi-step, multi-step with add-on/gifting step |
| Steps/categories | One category, multiple categories, cloned step, category tabs, empty category |
| Product source | Manual products, collection-backed category, mixed manual plus collection, no products |
| Variants | No variants, one option, multiple options, unavailable variant, variant swatches or equivalent EB selector state |
| Inventory | All in stock, out of stock visible, out of stock blocked, low inventory or tracked-at-cart state |
| Rules/navigation | No rule, step min, step max, step exact with auto-next, category exact, category min amount, category min weight |
| Discounts/progress | No discount, percentage tier, fixed amount tier, fixed price bundle, buy X get Y, progress message below threshold, highest eligible tier |
| Free gifts/add-ons | Disabled, gifting step only, add-ons with paid tier, add-ons with free tier, multiple eligible tiers |
| Default selections | None, default product, default variant, invalid or unavailable default |
| Product slots/box validation | No slots, quantity slots, custom slot icon, under-min blocked, exact-max blocked, over-max blocked |
| Text/language | Default text, edited bundle summary title/subtitle, multi-language labels, long labels |
| Banners/media | No banner, desktop banner, mobile banner, missing image fallback |
| Settings controls | Variant selector enabled, text on add button, cart title/subtitle, personalization or message controls, track inventory on add-to-cart |
| Sidebar/mobile tray | Desktop sidebar open, desktop sidebar collapsed or compact, mobile tray closed, mobile tray open, mobile final-step cart state |
| Cart behavior | Next/back only, add to cart success, add to cart blocked, cart properties, `bundle_details` cart metafield, discount transform proof |
| Responsive states | Desktop 1280+ width, desktop wide 1440+ width, mobile 390 x 844, first load, reload after selection |

## Deterministic Cross-Product Rule

The matrix is intentionally too large for exhaustive execution. Use this deterministic rule to generate the pairwise rows:

1. Use the axis order shown in the Feature Matrix table.
2. Keep value order exactly as written in each axis row.
3. Generate pair coverage for every unordered pair of axes.
4. Build rows greedily from top to bottom:
   - Start with the baseline row.
   - For each uncovered pair, choose the row candidate that covers the most remaining pairs.
   - Break ties by the lowest axis-value index sum.
   - Break remaining ties lexicographically by row ID.
5. Preserve the selected run set in this file. Future agents may append rows, but must not renumber existing row IDs.
6. Stress rows are not pairwise-generated. They are hand-selected because they combine high-risk behavior.

Generator seed label: `FPB-STANDARD-PAIRWISE-v1`.

## Case Evidence Contract

Each case writes evidence under:

```text
/private/tmp/fpb-standard-agentic-parity/<case-id>/
```

Required files per case:

| File | Required content |
|---|---|
| `eb-desktop.png` | EB desktop screenshot at 1280+ width |
| `eb-mobile.png` | EB mobile screenshot at 390 x 844 |
| `wpb-desktop.png` | Wolfpack desktop screenshot after mirrored config |
| `wpb-mobile.png` | Wolfpack mobile screenshot after mirrored config |
| `eb-a11y.json` | Accessibility snapshot or comparable serialized tree |
| `wpb-a11y.json` | Accessibility snapshot or comparable serialized tree |
| `eb-runtime.json` | EB runtime globals/config snapshot |
| `wpb-runtime.json` | Wolfpack runtime globals/config snapshot |
| `eb-computed.json` | Computed-style probes for row-specific selectors |
| `wpb-computed.json` | Computed-style probes for row-specific selectors |
| `eb-network.har.json` | Relevant network calls, filtered to bundle/runtime/cart calls |
| `wpb-network.har.json` | Relevant network calls, filtered to bundle/runtime/cart calls |
| `interaction-log.md` | Clicks, keyboard steps, state transitions, blockers |
| `cart-proof.json` | Cart add response, cart properties, `bundle_details`, and discount proof when relevant |
| `delta.md` | Difference summary and implementation decision |

If a row does not exercise cart add, `cart-proof.json` must record that cart add was not relevant for that row and why.

## Shared Capture Steps

Run these steps for every pairwise and stress row:

1. Hard reload EB with cache bypass.
2. Capture EB initial desktop and mobile states.
3. Save EB runtime, computed-style, accessibility, and network evidence.
4. Exercise row-specific interactions: add product, remove product, next/back, category switch, variant selection, discount threshold, add-on/free-gift qualification, and cart add where relevant.
5. Configure the same row in Wolfpack through Admin UI.
6. Hard reload Wolfpack storefront with cache bypass.
7. Verify `window.__BUNDLE_WIDGET_VERSION__`.
8. Capture Wolfpack desktop and mobile states.
9. Save Wolfpack runtime, computed-style, accessibility, network, and cart evidence.
10. Compare against EB and write `delta.md`.
11. If a gap exists, implement the smallest Standard-scoped slice, then rebuild and verify before moving to the next row.

## Implementation Loop After Each Code Slice

Use this only when a row requires code changes:

1. Update the smallest Standard-owned source file or behavior module.
2. If widget runtime files changed, bump `WIDGET_VERSION` in `scripts/build-widget-bundles.js`.
3. Run `npm run build:widgets`.
4. If CSS changed, run `npm run minify:assets css`.
5. Run `node --check` on touched raw widget JS and generated full-page bundle when JS changed.
6. Run focused Jest only for behavior/data contracts.
7. Run ESLint on modified source files with `npx eslint --max-warnings 9999 <files>`.
8. Run `npm run graphify:rebuild` after code changes.
9. User performs SIT deploy with `npm run deploy:sit`.
10. Hard reload the storefront with cache bypass.
11. Verify live `window.__BUNDLE_WIDGET_VERSION__`.
12. Capture desktop/mobile proof and mark the row complete.

## Pairwise Run Set

Status values:
- `pending`: row is selected but not yet captured.
- `eb-captured`: EB evidence exists; Wolfpack mirror pending.
- `gap-open`: gap found and implementation pending.
- `fixed-awaiting-deploy`: source fixed; SIT deploy needed.
- `verified`: row has EB/WPB evidence and any needed fix is verified live.
- `collapsed`: row was proven redundant by evidence and notes explain why.

### P00 Baseline Existing Twin Bundles

| Field | Value |
|---|---|
| Status | fixed-awaiting-deploy |
| EB config | Captured EB Standard bundle `Daily Essentials`, bundle ID `1`, `FBP_SIDE_FOOTER` + `DEFAULT_FBP` |
| WPB config | Captured Wolfpack Standard bundle `Daily Essentials`, bundle ID `cmqwx0k3u0000v08brgbhh6aa`, `FBP_SIDE_FOOTER` + `STANDARD` |
| Matrix coverage | Single-step, one category, manual products, no variants, all in stock, step min 4, discount/progress copy for one 100% off item at threshold, add-ons disabled, no defaults, no slots, default text, no banner, default settings, desktop sidebar open, mobile summary tray, add to cart blocked before min, desktop/mobile first load and after one add |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P00-baseline/` |

Acceptance:
- EB and WPB initial desktop/mobile captures exist.
- Runtime snapshots confirm EB `FBP_SIDE_FOOTER` + `DEFAULT_FBP` and WPB `STANDARD`.
- `delta.md` separates visual gaps, behavior gaps, and data/runtime gaps.
- Source fix exists for the mobile final-step CTA label gap; live verification is pending SIT deploy of widget version `3.0.53`.

### P01 Multi-Category Tabs With Step Min

| Field | Value |
|---|---|
| Status | fixed-awaiting-deploy |
| EB config | Single step `Choose Full-Size Products` with categories `Full-Size Earrings` and `Statement Earrings`; step quantity rule is greater than or equal to 4; discount progress from the shared fixture remains visible |
| WPB config | Mirrored Standard bundle with categories `Full-Size Earrings` and `Statement Earrings`; three Statement products added through Admin resource picker; step quantity rule is greater than or equal to 4 |
| Matrix coverage | Single-step, multiple categories, manual products, no variants, mixed inventory evidence, step min 4, discount progress inherited from baseline fixture, add-ons disabled, no defaults, quantity slots, default text, no banner, variant selector off, desktop sidebar open, mobile tray open, add to cart blocked before min |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P01-multi-category-step-min/` |

Acceptance:
- Category switching matches EB interaction order and selected-state treatment.
- Under-min add/next behavior matches EB message, disabled state, or blocking state.
- Mobile tray reflects the same selected count and blocked state as desktop sidebar.
- EB help links for Step Setup and Rules were read before configuration; no new durable EB facts were found beyond the existing implementation reference.
- Desktop WPB category tabs switch product sets correctly after Admin save; evidence exists for initial desktop, Statement category switch, mobile initial, mobile category switch, and add-one state.
- Source fix exists for the Standard mobile top-tab interaction: top category tabs no longer switch the expanded product body on mobile; lower category rows remain the body expansion control, matching EB evidence. Live verification is pending SIT deploy of widget version `3.0.53`.

### P02 Multi-Step Exact Auto-Next With Defaults

| Field | Value |
|---|---|
| Status | fixed-awaiting-deploy |
| EB config | Two steps; step 1 exact quantity 2 with auto-next enabled; 5% quantity discount at 2; default product `14k Dangling Obsidian Earrings`; product slots, text-on-plus, and bundle cart title/subtitle enabled |
| WPB config | Mirrored Standard bundle through Admin UI; source fix added direct default-product hydration and step-rule auto-next persistence |
| Matrix coverage | Multi-step, one category per step, manual products, no variants, all in stock, step exact with auto-next, percentage tier, add-ons disabled, default product, quantity slots, edited bundle summary title/subtitle, no banner, text on add button, desktop sidebar open, mobile final-step cart state |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P02-auto-next-defaults/` |

Acceptance:
- Default product is selected on first load in both desktop and mobile.
- Selecting the exact required count advances at the same point as EB.
- Final-step CTA label and summary title/subtitle match configured EB behavior.
- Desktop WPB first load now shows the default product selected, `Add 1 product(s) to save 5%`, `1 item(s)`, and `Daily kit` / `Two essentials unlock savings` on widget version `3.0.55`.
- Desktop WPB one-manual-add state now matches EB discount/progress behavior and keeps exact step validation independent from the direct default product; Next shows `Add exactly 2 products on this step`.
- Source fix adds durable `BundleStep.autoNextStepOnConditionMet` persistence and exposes it to runtime/metafield config. Live auto-next proof remains pending Prisma migration application, app server reload, WPB Admin re-save, and SIT deploy/hard reload.

### P03 Category Exact With Variant Selector

| Field | Value |
|---|---|
| Status | fixed-awaiting-deploy |
| EB config | Single step with two categories; each category requires exactly one item; no desktop/mobile banner rendered in captured storefront state |
| WPB config | Mirrored Standard bundle; product slots enabled in current saved fixture; source fix normalizes Standard product cards and sidebar height |
| Matrix coverage | Single-step, multiple categories, mixed manual plus collection, one option variant, all in stock, category exact, fixed amount tier, add-ons disabled, default variant, exact-max blocked, default text, no banner, variant selector enabled, desktop sidebar open, mobile tray open, cart properties, quantity slots |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P03-category-exact-variants/` |

Acceptance:
- Variant selector state, selected variant label, and cart line properties match EB.
- EB allows adding a second product from one exact-one category during selection; Add To Cart blocks when the other exact-one category is missing. Captured EB message: `Statement Earrings : Add exactly 01 products on this step`.
- Desktop product cards stay uniform and match EB row rhythm: EB card evidence is `eb-card-regression-desktop-metrics.json`; WPB post-fix evidence is `wpb-sidebar-slots-enabled-3.0.65-desktop.json`.
- Product image fade is present in Standard text-mode cards: WPB image animation is `fpb-standard-product-image-fade` with `1.5s` duration, matching EB's fade timing.
- Product card actions stretch to the card content width; default products still appear in the sidebar summary but the grid card renders `Add To Box`.
- Fresh EB Product Slots proof is captured in `/private/tmp/fpb-standard-agentic-parity/sidebar-slots-current/`. Desktop slots disabled uses the tall selected-product summary: `eb-desktop-sidebar-current.json` measures a `476.296875px` panel, text product rows, and item/action rows `55px 298.796875px 60.5px`.
- Desktop slots enabled uses a compact image-slot summary: `eb-desktop-sidebar-slots-enabled.json` measures a `296.296875px` panel, no text product rows, and a three-tile slot strip with two selected product images plus one empty slot.
- Mobile collapsed footer height does not change between slots enabled and disabled: both `eb-mobile-footer-slots-enabled-collapsed.json` and `eb-mobile-footer-slots-disabled-collapsed.json` measure a `101px` sticky footer.
- Mobile expanded footer changes content and height by Product Slots state: slots enabled uses image tiles only and measures `243px` in `eb-mobile-footer-slots-enabled-expanded.json`; slots disabled uses text product rows and measures `308px` in `eb-mobile-footer-slots-disabled-expanded.json`.
- Source fix is built into widget version `3.0.71`: Standard desktop uses a tall product-list row when Product Slots are disabled and a compact image-slot row when enabled; Standard mobile slots enabled renders image tiles instead of text rows. Live WPB proof is pending SIT deploy and cache-bypassed desktop/mobile reload.

### P04 Collection Category With Amount Rule

| Field | Value |
|---|---|
| Status | fixed-awaiting-deploy |
| EB config | Category `Statement Earrings Collection With Extra Long Label` has `Products 3`, `Collections 1` (`Automated Collection`, 28 products), and category rule `Amount` `is greater than or equal to` `100`; Bundle Settings product slots and preselected product were toggled off before save, but live storefront retained the previously selected default item until cart-clear confirmation flow |
| WPB config | Mirrored through Admin UI: category `Statement Earrings Collection With Extra Long Label` has `Products 3`, `Collections 1` (`Automated Collection`, 28 products), category rule `Amount` `is greater than or equal to` `100`, Product Slots off, and Pre Selected Product off; save bar cleared in live admin snapshots |
| Matrix coverage | Single-step, category tabs, collection-backed category, multiple option variants, all in stock, category min amount, fixed price bundle, add-ons disabled, no defaults, no slots, long labels, mobile banner, cart title/subtitle, desktop wide, reload after selection |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P04-collection-amount-rule/` |

Acceptance:
- Collection products hydrate by ID list/batch behavior, not cursor pagination assumptions.
- Long labels do not overlap or hide required controls.
- Amount-rule progress and blocked/unblocked transitions match EB.
- EB help and rule references were captured before configuration: `eb-step-setup-help-snapshot.txt`, `eb-step-setup-help-article-snapshot.txt`, and `eb-rules-help-article-snapshot.txt`.
- EB Admin configured-state proof: `eb-category-amount-rule-configured-snapshot.txt`, `eb-bundle-settings-p04-toggles-off-snapshot.txt`, and `eb-admin-p04-saved-state-snapshot.txt`.
- EB storefront desktop proof: `eb-storefront-desktop-collection-category-metrics.json` shows collection products and GraphQL hydration calls; `eb-click-exact-add-button-state.json` shows the collection product button changing to quantity `1`, sidebar moving to `2 item(s)`, and the `₹5` discount applying.
- WPB Admin mirror proof: `wpb-admin-p04-step-setup-configured-before-save-snapshot.txt`, `wpb-admin-before-second-save-snapshot.txt`, and `wpb-admin-after-save-live-check-snapshot.txt` show `Collections 1`, `Automated Collection`, long label, and Statement category `Amount >= 100`.
- WPB Bundle Settings mirror proof: `wpb-admin-p04-bundle-settings-toggles-off-saved-snapshot.txt` shows Pre Selected Product off, Product Slots off, Variant Selector on, Show Text on + Button on, and cart title/subtitle retained.
- WPB cache-bypassed desktop proof before source fix: `wpb-storefront-desktop-initial-snapshot.txt`, `wpb-storefront-desktop-initial.png`, `wpb-storefront-desktop-collection-category-snapshot.txt`, `wpb-storefront-desktop-collection-category.png`, `wpb-storefront-desktop-collection-category-targeted-metrics.json`, and `wpb-storefront-live-bundle-config-category-details.json`.
- Confirmed gap: live WPB widget `3.0.65` had `step.displayVariantsAsIndividual: true`, but category entries had `displayVariantsAsIndividualProducts: false`; Standard category tabs treated the false category flag as overriding the step flag, so collection products did not render EB-style variant cards such as `Yellow Sofa` `2 Seater`, `3 seater`, and `4 seater`.
- Live WPB deploy proof for widget `3.0.66`: `wpb-storefront-live-version-after-deploy-check.json`, `wpb-storefront-3.0.66-desktop-collection-snapshot.txt`, `wpb-storefront-3.0.66-desktop-collection.png`, and `wpb-storefront-3.0.66-desktop-collection-metrics.json` confirm category-backed variant cards now render, including multi-option product variants.
- Confirmed follow-up gap after `3.0.66`: WPB expanded variants but preserved full step product load order inside the active category; EB renders active category manual products first, followed by attached collection products in collection order.
- Live WPB deploy proof for widget `3.0.67`: `wpb-live-version-check-3067-attempt.json`, `wpb-storefront-3.0.67-desktop-collection-metrics.json`, `wpb-storefront-3.0.67-desktop-collection.png`, and `wpb-storefront-3.0.67-two-category-add-state.json` confirm manual category products render before attached collection products, variant cards remain expanded, and the discount message applies after one Statement product plus one Full-Size product.
- Confirmed follow-up gap after `3.0.67`: Add To Cart still blocks the completed category-rule state with `Please complete all bundle steps before adding to cart.` because category amount validation was summing selected quantity (`1`) instead of selected amount (`$619.00`) against the configured `Amount >= 100` rule. Evidence: `wpb-storefront-3.0.67-before-cart-click-state.json`, `wpb-storefront-3.0.67-cart-click-result.json`, and `wpb-storefront-3.0.67-after-statement-add-blocked-cart.json`.
- Source fix is built into widget version `3.0.68`: Standard/FPB category grids inherit the step-level variant display flag when rendering category tabs, the collection Storefront API proxy returns variant `compareAtPrice`, active category grids order manual category products before collection products using category membership data, and category amount rules validate selected product amounts instead of selected quantities.
- Pending: SIT deploy, cache-bypassed WPB desktop/mobile storefront verification of widget version `3.0.68`, final Add To Cart/network proof, mobile proof, collection catalog/order comparison note, and final `delta.md`.

### P05 Cloned Step With Step Max

| Field | Value |
|---|---|
| Status | fixed-awaiting-deploy |
| EB config | Cloned second step with max quantity rule |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Multi-step, cloned step, manual products, no variants, all in stock, step max, no discount, add-ons disabled, no defaults, over-max blocked, default text, no banner, default settings, desktop sidebar collapsed or compact, mobile tray open, next/back |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P05-cloned-step-max/` |

Acceptance:
- Step clone labels, order, and per-step selected items match EB.
- Over-max add behavior matches EB without affecting prior step selections.
- Back navigation preserves selections and sidebar/tray state.

Notes:
- EB configured and captured with two cloned steps, `Quantity <= 1` step rules, no discount, no default/preselected products, product slots disabled, variant selector on, and plus-button text on.
- WPB mirrored through Chrome DevTools MCP. Desktop proof confirms two-step flow, preserved prior-step selections, and over-max blocking with `This step allows at most 1 product only.`
- Product cards remain uniform in WPB capture and product image fade is present via `fpb-standard-product-image-fade`.
- Gap found: Standard desktop summary sidebar height stayed at `20.94375rem` (~335px) while EB measured ~476px with selected products. Source fix sets `--standard-desktop-side-panel-height` to `29.76855rem` and is built into widget version `3.0.69`; live proof is pending SIT deploy and cache-bypassed reload.
- Follow-up product-card pricing evidence is captured in `/private/tmp/fpb-standard-agentic-parity/product-card-pricing-row/`. EB `Solid Bloom` sale-card proof shows the title divider on the title row, Assistant typography, one-line compare/current pricing, 14px/700 compare price, and 16px/700 current price. Source fix restores those Standard desktop product-card rules in widget version `3.0.70`; live proof is pending SIT deploy and cache-bypassed reload.

### P06 Out Of Stock Visible

| Field | Value |
|---|---|
| Status | pending |
| EB config | Product set with one visible out-of-stock product |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Single-step, one category, manual products, unavailable variant, out of stock visible, no rule, percentage tier, add-ons disabled, invalid or unavailable default, no slots, default text, missing image fallback, track inventory on add-to-cart, add to cart blocked |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P06-oos-visible/` |

Acceptance:
- Out-of-stock presentation and blocked add behavior match EB.
- Invalid default selection resolves the same way EB resolves it.
- Missing image fallback does not affect product selection or cart blocking.

### P07 Out Of Stock Blocked With Inventory Tracking

| Field | Value |
|---|---|
| Status | pending |
| EB config | Track inventory on add-to-cart enabled with OOS blocked state |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Single-step, one category, manual products, one option variant, out of stock blocked, step min, buy X get Y, add-ons disabled, no defaults, under-min blocked, default text, no banner, track inventory on add-to-cart, add to cart blocked, mobile 390 x 844 |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P07-oos-blocked-inventory/` |

Acceptance:
- Storefront blocks OOS item selection or add-to-cart at the same point as EB.
- Inventory-related network proof is captured for both apps.
- Rule blocking and inventory blocking messages do not conflict.

### P08 Add-On Gifting Step Only

| Field | Value |
|---|---|
| Status | pending |
| EB config | Add-Ons and Gifting Step enabled; Add-Ons with Bundles disabled |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Multi-step with add-on/gifting step, one category, manual products, no variants, all in stock, no rule, no discount, gifting step only, no defaults, no slots, edited bundle summary title/subtitle, no banner, personalization or message controls, next/back, mobile final-step cart state |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P08-gifting-step-only/` |

Acceptance:
- Gifting/add-on navigation step appears when the gifting-step toggle alone is enabled.
- No add-on discount tier behavior appears when Add-Ons with Bundles is disabled.
- Back/final-step behavior matches EB desktop and mobile.

### P09 Paid Add-On Tier

| Field | Value |
|---|---|
| Status | pending |
| EB config | Add-Ons with Bundles enabled; paid discount tier below free threshold |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Multi-step with add-on/gifting step, multiple categories, manual products, multiple option variants, all in stock, step min, percentage tier, add-ons with paid tier, no defaults, quantity slots, default text, desktop banner, variant selector enabled, cart properties, discount transform proof |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P09-paid-addon-tier/` |

Acceptance:
- Add-on qualification copy and paid discount tier match EB.
- Selected add-on cart line properties and discount proof are captured.
- Highest eligible base discount and add-on discount do not double-apply.

### P10 Free Add-On Tier Highest Eligible

| Field | Value |
|---|---|
| Status | pending |
| EB config | Multiple add-on tiers; highest eligible tier gives free add-on |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Multi-step with add-on/gifting step, multiple categories, collection-backed category, multiple option variants, all in stock, category exact, highest eligible tier, add-ons with free tier, no defaults, custom slot icon, multi-language labels, mobile banner, variant selector enabled, `bundle_details` cart metafield, desktop/mobile reload after selection |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P10-free-addon-highest-tier/` |

Acceptance:
- Highest eligible tier wins when multiple add-on tiers qualify.
- Free add-on cart proof matches EB pricing and cart metadata behavior.
- Multi-language labels and custom slot icons render without layout spillover.

### P11 Empty Category

| Field | Value |
|---|---|
| Status | pending |
| EB config | Multi-category step with one empty category |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Single-step, empty category, no products, no variants, all in stock for non-empty category, no rule, no discount, add-ons disabled, no defaults, no slots, long labels, no banner, default settings, mobile tray closed, next/back only |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P11-empty-category/` |

Acceptance:
- Empty category message/state matches EB.
- Switching away from and back to the empty category preserves selected products in non-empty categories.
- No fabricated fallback merchant-facing copy is introduced.

### P12 Category Weight Rule

| Field | Value |
|---|---|
| Status | pending |
| EB config | Category minimum weight rule with weighted products |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Single-step, multiple categories, manual products, no variants, all in stock, category min weight, fixed amount tier, add-ons disabled, no defaults, quantity slots, default text, no banner, default settings, desktop sidebar open, add to cart blocked below weight |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P12-category-weight-rule/` |

Acceptance:
- Weight progress/blocking behavior matches EB.
- Product quantity changes update the weight rule immediately.
- Cart add remains blocked until the category weight rule is satisfied.

### P13 Mobile Long Content

| Field | Value |
|---|---|
| Status | pending |
| EB config | Long product names, long category names, long step labels, mobile banner |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Multi-step, category tabs, mixed manual plus collection, one option variant, low inventory or tracked-at-cart state, step min, progress message below threshold, add-ons disabled, default product, quantity slots, long labels, mobile banner, text on add button, mobile tray open, mobile final-step cart state |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P13-mobile-long-content/` |

Acceptance:
- Mobile text wraps or truncates the same way EB does without overlapping controls.
- Progress and tray state remain visible and actionable.
- Low inventory/tracked state does not displace primary selection controls.

## Stress Run Set

### S01 Multi-Step Variants Discounts Add-Ons

| Field | Value |
|---|---|
| Status | pending |
| Purpose | Exercise the highest-risk combined storefront path |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/S01-multi-step-variants-discounts-addons/` |

Configuration:
- Three steps.
- Step 1 exact rule with auto-next.
- Step 2 multiple categories with variant products.
- Step 3 gifting/add-on step with paid and free tiers.
- Percentage base discount plus add-on tier discount.
- Desktop banner and mobile banner.

Acceptance:
- Step transitions, variant selections, add-on qualification, progress copy, and cart add all match EB in one continuous session.
- Cart proof shows selected base products, selected add-on, cart properties, `bundle_details`, and discount transform output.

### S02 Free Gift Tier Boundary

| Field | Value |
|---|---|
| Status | pending |
| Purpose | Verify tier boundary transitions just below, at, and above free gift threshold |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/S02-free-gift-tier-boundary/` |

Acceptance:
- Below threshold: no free gift qualification.
- At threshold: free gift qualification appears.
- Above threshold: highest eligible tier remains stable and does not oscillate.

### S03 Empty Categories And Missing Media

| Field | Value |
|---|---|
| Status | pending |
| Purpose | Verify empty category, missing image fallback, and long label behavior together |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/S03-empty-categories-missing-media/` |

Acceptance:
- Empty state, fallback image, and long labels remain coherent on desktop and mobile.
- No fallback merchant copy is invented in Wolfpack.
- Category switching remains functional.

### S04 Default Selection Recovery

| Field | Value |
|---|---|
| Status | pending |
| Purpose | Verify unavailable default product and default variant recovery |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/S04-default-selection-recovery/` |

Acceptance:
- EB resolution behavior is captured before Wolfpack comparison.
- Wolfpack either matches EB or records a precise data-contract gap.
- Cart add uses only valid selected variants.

### S05 Quantity Validation

| Field | Value |
|---|---|
| Status | pending |
| Purpose | Verify under-min, exact-max, over-max, and final cart blocking |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/S05-quantity-validation/` |

Acceptance:
- Under-min, exact-max, and over-max states match EB.
- Disabled/enabled state, error copy, and cart proof are captured.
- Unit tests, if needed, cover rule behavior and cart payload only.

## Regression Smoke

Run this after any Standard source change:

| Preset | Required proof |
|---|---|
| Standard | Active row evidence passes |
| Classic | Loads without Standard-scoped selectors applying |
| Compact | Loads without Standard-scoped selectors applying |
| Horizontal | Loads without Standard-scoped selectors applying |

Smoke evidence path:

```text
/private/tmp/fpb-standard-agentic-parity/regression-smoke/
```

Required proof:
- Runtime preset snapshot for each preset.
- Desktop screenshot for each preset.
- Cart add proof for Standard and at least one non-Standard preset.
- Source isolation note in `regression-smoke/delta.md`.

## Completion Criteria

The parity loop is complete when:

- All pairwise rows are `verified` or intentionally `collapsed` with evidence.
- All stress rows are `verified`.
- Every matrix axis value is represented by at least one verified or collapsed row.
- Every open gap has either a committed Standard-scoped fix or a documented user-approved deferral.
- `internal docs/EB Implementation Reference.md` is updated for any newly discovered durable EB behavior.
- No screenshots or raw captures are staged for commit.
- Standard changes do not regress Classic, Compact, or Horizontal loading, asset selection, or cart add.

## Current Status

| Row | Status | Evidence path |
|---|---|---|
| P00 | fixed-awaiting-deploy | `/private/tmp/fpb-standard-agentic-parity/P00-baseline/` |
| P01 | fixed-awaiting-deploy | `/private/tmp/fpb-standard-agentic-parity/P01-multi-category-step-min/` |
| P02 | fixed-awaiting-deploy | `/private/tmp/fpb-standard-agentic-parity/P02-auto-next-defaults/` |
| P03 | fixed-awaiting-deploy | `/private/tmp/fpb-standard-agentic-parity/P03-category-exact-variants/` |
| P04 | fixed-awaiting-deploy | `/private/tmp/fpb-standard-agentic-parity/P04-collection-amount-rule/` |
| P05 | fixed-awaiting-deploy | `/private/tmp/fpb-standard-agentic-parity/P05-cloned-step-max/` |
| P06 | pending | `/private/tmp/fpb-standard-agentic-parity/P06-oos-visible/` |
| P07 | pending | `/private/tmp/fpb-standard-agentic-parity/P07-oos-blocked-inventory/` |
| P08 | pending | `/private/tmp/fpb-standard-agentic-parity/P08-gifting-step-only/` |
| P09 | pending | `/private/tmp/fpb-standard-agentic-parity/P09-paid-addon-tier/` |
| P10 | pending | `/private/tmp/fpb-standard-agentic-parity/P10-free-addon-highest-tier/` |
| P11 | pending | `/private/tmp/fpb-standard-agentic-parity/P11-empty-category/` |
| P12 | pending | `/private/tmp/fpb-standard-agentic-parity/P12-category-weight-rule/` |
| P13 | pending | `/private/tmp/fpb-standard-agentic-parity/P13-mobile-long-content/` |
| S01 | pending | `/private/tmp/fpb-standard-agentic-parity/S01-multi-step-variants-discounts-addons/` |
| S02 | pending | `/private/tmp/fpb-standard-agentic-parity/S02-free-gift-tier-boundary/` |
| S03 | pending | `/private/tmp/fpb-standard-agentic-parity/S03-empty-categories-missing-media/` |
| S04 | pending | `/private/tmp/fpb-standard-agentic-parity/S04-default-selection-recovery/` |
| S05 | pending | `/private/tmp/fpb-standard-agentic-parity/S05-quantity-validation/` |
