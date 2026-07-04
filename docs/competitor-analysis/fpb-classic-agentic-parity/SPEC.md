# FPB Classic Agentic Parity Spec

**Spec ID:** fpb-classic-agentic-parity
**Created:** 2026-07-02
**Scope:** Full-Page Bundle Classic storefront parity only
**Execution breadth:** Pairwise + stress
**Generator seed label:** FPB-CLASSIC-PAIRWISE-v1
**Evidence root:** `/private/tmp/fpb-classic-agentic-parity/`

## Purpose

This spec defines the repeatable parity loop for making Wolfpack FPB Classic storefronts match EB Classic storefront behavior. EB is the live source of truth. Wolfpack targets the existing Classic preset.

This is not a request to rebuild Admin UI parity, PPB parity, or non-Classic visual parity. Admin configuration flow and bundle business logic are locked for this loop unless the user explicitly reopens them. The full matrix is documented here, but execution uses bounded pairwise rows plus explicit high-risk stress rows.

## Ground Rules

- Configure EB first through Chrome DevTools MCP, then mirror or inspect the Wolfpack storefront through Chrome DevTools MCP. Do not change Wolfpack Admin configuration unless the user explicitly asks for that row setup.
- Do not use backend shortcuts unless the UI is blocked and the user explicitly approves that shortcut.
- Capture EB truth before editing code.
- Read every visible EB "How to setup", "Learn More", "?", or equivalent help link for the row's feature before implementing.
- Keep screenshots and raw browser captures under `/private/tmp/fpb-classic-agentic-parity/<case-id>/`.
- Commit only durable docs and source changes. Do not commit screenshots or raw browser captures.
- Update `internal docs/EB Implementation Reference.md` only when the loop discovers durable EB behavior that is not already documented.
- Preserve the current FPB runtime boundary: the storefront config load stays on the documented marker/metafield/cache path plus `/apps/product-bundles/api/bundle/{id}.json` fallback, including the `503`/`504` retry behavior.
- EB Classic uses `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "CLASSIC"`. Wolfpack's canonical Classic preset remains `CLASSIC`.
- Do not rename public runtime keys or runtime preset values unless fresh EB evidence proves a hard gap.
- Classic styling fixes must live in Classic-owned source CSS and selectors, including `[data-fpb-design-preset="CLASSIC"]`, `.fpb-preset-classic`, `app/assets/widgets/full-page-css/templates/side-footer-classic.css`, and `app/assets/widgets/full-page-css/templates/classic/*.css`.
- Shared storefront-runtime changes require browser evidence that the behavior is caused by shared runtime asset selection or rendering. Record that evidence in the row `delta.md`.
- Do not use JavaScript DOM injection, generated SVG, or runtime HTML composition for visual layout fixes.
- Do not add broad selectors that can affect Standard, Compact, Horizontal, PPB, or theme-owned storefront UI.
- Do not add competitor-name references in code. Competitor names belong in docs only.
- Do not use `!important` unless a scoped Classic selector cannot win and the row `delta.md` records why.
- Layout implementation must avoid hardcoded pixel layout values. EB pixel measurements are evidence only. Prefer scoped custom properties, container-relative sizing, `fr`, `%`, `rem`, `clamp()`, `minmax()`, and `aspect-ratio`.
- Unit tests must cover behavior/data contracts only. Do not add tests that grep CSS, class names, source order, or visual placement.
- Do not run `npm run dev`, `shopify app deploy`, or deploy scripts autonomously.

## Source References

Read these before every row:

| Order | Source | Use |
|---|---|---|
| 1 | `internal docs/EB Implementation Reference.md` | Confirmed EB data, runtime, template, cart, and rules behavior |
| 2 | `docs/competitor-analysis/16-eb-full-data-flow-investigation.md` | Raw evidence when the reference doc lacks detail |
| 3 | Existing Classic issue notes or captures | Bootstrap only; live EB evidence wins when stale |
| 4 | Visible EB help and learn-more links | Row-specific setup, constraints, and hidden behavior |
| 5 | `internal docs/Architecture/Widget Architecture.md` | Wolfpack runtime boundaries and widget build rules |
| 6 | `graphify-out/GRAPH_REPORT.md` | Communities and downstream risk before source changes |
| 7 | Live Chrome DevTools MCP capture | Current row truth and browser proof |

## Wolfpack Classic Ownership

These are the expected Classic-owned boundaries. Re-check current files before editing because the graph and generated assets may have changed.

| Area | Primary ownership |
|---|---|
| Preset config | `app/assets/widgets/full-page/templates/classic.config.js` |
| Preset template module | `app/assets/widgets/full-page/templates/classic-template.js` |
| Source CSS entry | `app/assets/widgets/full-page-css/templates/side-footer-classic.css` |
| Split CSS modules | `app/assets/widgets/full-page-css/templates/classic/base.css`, `desktop-products.css`, `desktop-sidebar.css`, `mobile.css` |
| Generated CSS asset | `extensions/bundle-builder/assets/bundle-widget-full-page-classic.css` |
| Active root selectors | `.fpb-preset-classic`, `[data-bundle-type="full_page"][data-fpb-design-preset="CLASSIC"]`, `.layout-sidebar[data-fpb-design-preset="CLASSIC"]` |

## Feature Matrix

Every axis value below must be represented by at least one pairwise or stress row before this loop is considered complete.

| Axis | Values |
|---|---|
| Bundle structure | Single-step, multi-step, multi-step with add-on/gifting step |
| Steps/categories | One category, multiple categories, cloned step, category tabs, empty category |
| Product source | Manual products, collection-backed category, mixed manual plus collection, no products |
| Variants | No variants, one option, multiple options, variants as individual products, unavailable variant, desktop dropdown, mobile drawer |
| Inventory | All in stock, out of stock visible, out of stock blocked, low inventory or tracked-at-cart state |
| Rules/navigation | No rule, step min, step max, step exact with auto-next, category exact, category min amount, category min weight, next/back |
| Discounts/progress | No discount, percentage tier, fixed amount tier, fixed price bundle, buy X get Y, progress below threshold, highest eligible tier |
| Free gifts/add-ons | Disabled, gifting step only, add-ons with paid tier, add-ons with free tier, multiple eligible tiers |
| Default selections | None, default product, default variant, invalid or unavailable default |
| Product slots/box validation | No slots, quantity slots, custom slot icon, under-min blocked, exact-max blocked, over-max blocked |
| Text/language | Default text, edited bundle summary title/subtitle, multi-language labels, long labels |
| Banners/media | No banner, desktop banner, mobile banner, missing image fallback, multi-image product cards |
| Settings controls | Variant selector enabled, text on add button, cart title/subtitle, personalization or message controls, track inventory on add-to-cart |
| Sidebar/mobile tray | Desktop sidebar open, desktop sidebar collapsed or compact, mobile tray closed, mobile tray open, mobile tray expanded, mobile final-step cart state |
| Cart behavior | Next/back only, add to cart success, add to cart blocked, cart properties, `bundle_details` cart metafield, discount/cart-line savings UI |
| Responsive states | Desktop 1280+ width, desktop wide 1440+ width, mobile 390 x 844, first load, reload after selection, loading state |

## Deterministic Cross-Product Rule

The matrix is intentionally too large for exhaustive execution. Use this deterministic rule to preserve pairwise coverage without turning the loop into an unbounded rewrite:

1. Use the axis order shown in the Feature Matrix table.
2. Keep value order exactly as written in each axis row.
3. Generate pair coverage for every unordered pair of axes.
4. Build rows greedily from top to bottom:
   - Start with `C00-baseline`.
   - For each uncovered pair, choose the row candidate that covers the most remaining pairs.
   - Break ties by the lowest axis-value index sum.
   - Break remaining ties lexicographically by row ID.
5. Preserve the selected run set in this file. Future agents may append rows, but must not renumber existing row IDs.
6. Stress rows are not pairwise-generated. They are hand-selected because they combine high-risk behavior.

## Case Evidence Contract

Each case writes evidence under:

```text
/private/tmp/fpb-classic-agentic-parity/<case-id>/
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
| `delta.md` | Difference summary, source ownership decision, and implementation decision |

If a row does not exercise cart add, `cart-proof.json` must record that cart add was not relevant for that row and why.

## Shared Capture Steps

Run these steps for every pairwise and stress row:

1. Read the required source references for the row.
2. Open the relevant EB Admin feature and read every visible help or learn-more link.
3. Configure EB Classic through Chrome DevTools MCP.
4. Hard reload EB with cache bypass.
5. Capture EB initial desktop and mobile states.
6. Save EB runtime, computed-style, accessibility, and network evidence.
7. Exercise row-specific interactions: add product, remove product, next/back, category switch, variant selection, discount threshold, add-on/free-gift qualification, mobile tray state, and cart add where relevant.
8. Configure the same row in Wolfpack through Admin UI.
9. Hard reload Wolfpack storefront with cache bypass.
10. Verify `window.__BUNDLE_WIDGET_VERSION__`.
11. Capture Wolfpack desktop and mobile states.
12. Save Wolfpack runtime, computed-style, accessibility, network, and cart evidence.
13. Compare against EB and write `delta.md`.
14. If a gap exists, implement the smallest Classic-scoped slice, then rebuild and verify before moving to the next row.

## Implementation Loop After Each Code Slice

Use this only when a row requires code changes:

1. Update the smallest Classic-owned source file or behavior module.
2. If widget runtime files changed, bump `WIDGET_VERSION` in `scripts/build-widget-bundles.js`.
3. Run `npm run build:widgets`.
4. If CSS changed, run `npm run minify:assets css`.
5. Run `node --check` on touched raw widget JS and the generated full-page bundle when JS changed.
6. Run focused Jest only for behavior/data contracts.
7. Run ESLint on modified source files with `npx eslint --max-warnings 9999 <files>`.
8. Run `npm run graphify:rebuild` after code changes.
9. Hard reload the dev-preview or live storefront with cache bypass.
10. Verify `window.__BUNDLE_WIDGET_VERSION__`.
11. If the served asset version is stale, record that as an asset-refresh gap instead of treating the row as verified.
12. Capture desktop/mobile proof and mark the row complete only after the row-specific fixture is loaded.

## Regression Smoke

Classic changes must not alter non-Classic preset loading or shared behavior. Run the non-Classic smoke row after every Classic code slice that touches shared runtime, shared CSS, bundle build scripts, template registry, product-card rendering, summary footer rendering, variant selection, or cart payload logic.

Smoke checks:

- Standard still resolves `FBP_SIDE_FOOTER` + EB `DEFAULT_FBP` to Wolfpack `STANDARD`.
- Classic still resolves `FBP_SIDE_FOOTER` + `CLASSIC` to Wolfpack `CLASSIC`.
- Compact and Horizontal still load their preset-specific CSS assets.
- Standard, Compact, and Horizontal summary footer behavior is unchanged.
- Variant selector behavior is unchanged outside Classic.
- Add-to-cart payload shape and `bundle_details` persistence remain unchanged outside Classic.

## Status Values

- `pending`: row is selected but not yet captured.
- `eb-captured`: EB evidence exists; Wolfpack mirror pending.
- `wpb-captured`: EB and Wolfpack evidence exist; delta pending.
- `gap-open`: gap found and implementation pending.
- `fixed-awaiting-live-proof`: source fixed; row-specific cache-bypassed EB/WPB proof still needed.
- `verified`: row has EB/WPB evidence and any needed fix is verified live.
- `collapsed`: row was proven redundant by evidence and notes explain why.

## Pairwise Run Set

### C00 Baseline

| Field | Value |
|---|---|
| Status | verified |
| EB config | Single step, one category, manual products, no variants, all in stock, no add-ons, Classic preset |
| WPB config | User saved the existing bundle as Classic; storefront root resolved to `CLASSIC` after refresh |
| Matrix coverage | Single-step, one category, manual products, no variants, all in stock, no rule or baseline rule as EB requires, no discount, add-ons disabled, no defaults, no slots, default text, no banner, desktop sidebar open, mobile collapsed and expanded tray, first load |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C00-baseline/` |
| Current delta | `delta.md` captured. WPB runtime root became `CLASSIC`, but cached embedded config still started as `STANDARD`; Standard preset CSS loaded before bundle JSON refresh and stayed enabled alongside Classic CSS. Source fixes disable inactive FPB preset stylesheets after the active preset stylesheet is available. Follow-up C01 proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.17"` confirmed the widget hydrates current Classic proxy data before first render even while live page HTML still embeds stale `STANDARD` full config. A stricter `5.0.21` source fix now treats legacy full FPB `data-bundle-config` payloads as stale pointers and hydrates through the app proxy inside `loadBundleData()` before bundle selection. Cache-bypassed desktop and mobile Chrome proof in `/private/tmp/fpb-classic-agentic-parity/C00-baseline/wpb-first-load-preset-proof-5021*.json` shows the live HTML marker still has `bundleDesignPresetId: "STANDARD"` and `steps`, but the rendered root is `CLASSIC`, only base + Classic template CSS are active, and an early mutation recorder captured zero Standard preset transitions. |

Acceptance:
- Runtime snapshots confirm EB `FBP_SIDE_FOOTER` + `CLASSIC` and WPB `CLASSIC`.
- Desktop sidebar and product grid have no cross-preset styling leakage.
- Mobile tray can be captured both collapsed and expanded.
- `delta.md` separates visual gaps, behavior gaps, and data/runtime gaps.

### C01 Category Pills

| Field | Value |
|---|---|
| Status | verified |
| EB config | Single Classic step with multiple categories, long labels, one empty category, and category switch interactions |
| WPB config | Mirrored Classic bundle through Admin UI |
| Matrix coverage | Single-step, multiple categories, category tabs, empty category, manual products, no products, long labels, no variants, no discount, mobile tray closed/open |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C01-category-pills/` |
| Current delta | EB desktop/mobile category-pill evidence captured. EB prunes truly empty/unselected categories from storefront output; after products were selected in the second long-label category, EB rendered both pills and switched categories correctly. Admin setup note: the category accordion exposes the category-name textbox only when more than one category exists; keep that as fixture setup evidence, not as a reason to reopen the locked Admin flow in this storefront loop. WPB proxy API returns `CLASSIC` and both long-label categories. Live page HTML still embeds stale `STANDARD` full config from `custom.bundle_config`, so the source fix hydrates the current proxy payload before the first render whenever the cached payload is a full config. Cache-bypassed Chrome proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.17"` shows root preset `CLASSIC`, no captured `STANDARD` transition, only base + Classic stylesheets active, EB-style active/inactive pills, hidden duplicate category-section row, and working desktop/mobile category switching. Follow-up Chrome DevTools MCP proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.22"` after reconfiguring the live WPB bundle through Admin shows `FBP_SIDE_FOOTER` + `CLASSIC`, two visible populated long-label category pills, the empty category hidden on storefront, active/inactive pill styling intact on desktop/mobile, and mobile category switching still moving the active state and visible heading. Fresh Chrome DevTools MCP proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.27"` reconfigured the current WPB bundle through Admin by adding an empty category and cloning the populated long-label category; the save POST returned `success: true` and `Bundle configuration saved successfully`. Cache-bypassed desktop `1280 x 725` and mobile `390 x 844` storefront proof shows root `CLASSIC`, only base + Classic full-page stylesheets active, two visible populated long-label pills, the empty `Category 2` hidden, and active/inactive pill state switching on both viewports. Current evidence files: `wpb-current-5027-desktop-after-category-copy-runtime-20260703.json`, `wpb-current-5027-desktop-second-pill-runtime-20260703.json`, `wpb-current-5027-mobile-after-category-copy-runtime-20260703.json`, `wpb-current-5027-mobile-second-pill-runtime-20260703.json`, and `current-admin-category-copy-save.response.network-response`. |

Acceptance:
- [x] Category switching matches EB interaction order and selected-state treatment.
- [x] Empty category state uses EB-backed copy only; no fabricated merchant-facing fallback copy is introduced.
- [x] Long category labels do not overlap product cards, tray controls, or sidebar content.
- [x] Mobile category controls match EB behavior for top tabs versus body expansion controls.

### C02 Multi-Step Defaults

| Field | Value |
|---|---|
| Status | verified |
| EB config | Multi-step Classic bundle with exact step rule, auto-next, default product or variant, next/back, and completed timeline state |
| WPB config | Mirrored Classic bundle through Admin UI for two product-backed steps, one category per step, exact Step 1 quantity rule, and auto-next |
| Matrix coverage | Multi-step, one category per step, manual products, step exact with auto-next, default product, default variant, next/back, completed timeline state, edited summary title/subtitle |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C02-multi-step-defaults/` |
| Current delta | EB desktop/mobile/runtime evidence captured. EB Admin saved exact quantity rule `1`, auto-next enabled, two product steps, Classic preset, edited summary title/subtitle, and one pre-selected product. EB storefront confirms exact-rule auto-next and back navigation preservation, but the storefront proxy still embeds `defaultProductsData.isDefaultProductsEnabled: false` after the Admin default-products save response returns `true`; `delta.md` records this EB propagation/cache gap. WPB was mirrored through Admin UI and persisted `CLASSIC`, two product-backed steps, one category per step, Step 1 `conditionOperator: "equal_to"`, `conditionValue: 1`, and `autoNextStepOnConditionMet: true`. WPB desktop proof confirms Add on the first product auto-advances to the second step, Back returns to Step 1, and selection is preserved. WPB mobile proof confirms the Classic collapsed tray and two-step timeline. No storefront source change is justified from C02. |

Acceptance:
- [x] Selecting the exact required count advances at the same point as EB.
- [x] Back navigation preserves selections and returns to the same Classic timeline state.
- [x] Completed timeline state is Classic-scoped and does not alter Standard, Compact, or Horizontal.
- [ ] Default product or variant is selected on first load in both desktop and mobile. Deferred because live EB storefront did not expose the Admin-saved default selection after cache-bypassed reloads, so this is not a Wolfpack storefront gap yet.

### C03 Variants

| Field | Value |
|---|---|
| Status | verified |
| EB config | Classic products with grouped variant selector, variants-as-individual-products mode, unavailable variant, desktop dropdown, and mobile drawer behavior |
| WPB config | Mirrored Classic bundle through Admin UI |
| Matrix coverage | One option, multiple options, variants as individual products, unavailable variant, desktop dropdown, mobile drawer, variant selector enabled, add to cart blocked for unavailable selection |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C03-variants/` |
| Current delta | `delta.md` captured. EB Classic evidence shows grouped variants render inline in this fixture on desktop and mobile and filters the unavailable `Peach` value out of the Fragrance Candle choices. WPB Admin persisted Classic and variant-backed products, but desktop proof before fix showed no option controls because runtime payloads carried Shopify `selectedOptions` while the compact serializer/storefront normalizer expected flattened `option1`/`option2`/`option3` and product `options`. Source now derives compact option names/values without exposing raw `selectedOptions`. A follow-up shared-runtime fix on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.20"` merges category-cached variant availability into duplicate step products and filters unavailable-only grouped values. Cache-bypassed WPB mobile proof at true `390 x 844` shows Classic root, Fragrance overflow changed from `+2` to `+1`, `Peach` absent, and only `Ocean` hidden in the overflow list. Final cart payload proof shows `cart/add.js` posts the selected Vanilla variant ID `48719984427267`. Current same-day mobile proof on `5.0.21` confirms grouped variant controls still render in Classic: WPB shows `Cherry`, `Vanilla`, `Lavendar`, `Orange`, `+1`, shirt size buttons, and `Option 2: Black`, with `Peach` absent; EB shows grouped Fragrance options including `Ocean`, shirt size/color combinations, and `Peach` absent. Evidence: `wpb-mobile-grouped-variants-current-5021.json/png/txt` and `eb-mobile-grouped-variants-current-20260703.json/png/txt`. WPB Admin was reconfigured through Chrome DevTools MCP to set the FPB step-level variants-as-individual selector; the save action returned 200 and the proxy API emitted `displayVariantsAsIndividual: true` while keeping `FBP_SIDE_FOOTER + CLASSIC`. Source fix `5.0.22` makes the storefront category grid honor that locked FPB step-level flag. Cache-bypassed WPB dev-tunnel proof now shows 37 cards, including individual Fragrance variants (`Cherry`, `Vanilla`, `Lavendar`, `Orange`, `Ocean`) and individual shirt variants (`S / Black` through `4XL / Gray`) on desktop and mobile. Evidence: `wpb-c03-variants-individual-runtime-5022-20260703.json`, `wpb-c03-variants-individual-desktop-5022-20260703.png`, `wpb-c03-variants-individual-mobile-5022-20260703.png`, and `wpb-c03-variants-individual-mobile-runtime-5022-20260703.json`. EB Admin was rechecked after save and the `Display variants as individual products` setting remained checked. Cache-bypassed EB storefront proof now shows zero `Choose Options` controls and individual variant cards for Fragrance Candle (`Cherry`, `Vanilla`, `Lavendar`, `Orange`, `Ocean`) and Black Crew Neck T-Shirt (`S / Black` through `4XL / Gray`) on desktop and mobile. Evidence: `eb-admin-current-after-reconfigure-check-20260703.txt`, `eb-c03-variants-individual-desktop-runtime-20260703.json`, `eb-c03-variants-individual-desktop-20260703.png`, `eb-c03-variants-individual-mobile-runtime-20260703.json`, `eb-c03-variants-individual-mobile-20260703.png`, and EB Storefront API/network captures under the C03 evidence path. No additional source gap remains for C03. |

Acceptance:
- [x] Desktop grouped variant selector state, selected variant label, and selected product identity match EB for the captured fixture.
- [x] Mobile variant state is captured at a true `390 x 844` viewport.
- [x] Unavailable variant state is captured and unavailable-only grouped choices are filtered out.
- [x] Variants-as-individual-products state is captured for EB and WPB on desktop and mobile.
- [x] Cart payload uses the selected variant ID and unavailable selections are blocked by absence at the same point as EB.
- [x] The fix is source-owned and behavior-scoped: shared runtime normalization only, with EB/WPB evidence that the missing Classic controls came from shared variant data shape.

### C04 Slots Box Validation

| Field | Value |
|---|---|
| Status | wpb-reconfigured-true-mobile-proofed-custom-icon-noop-validation-gated |
| EB config | Classic product slots with custom slot icon, under-min, exact-max, and over-max validation |
| WPB config | Dev-tunnel Classic storefront fixture reconfigured through Admin UI for Product Slots plus one quantity fixed-amount discount tier; Admin flow/business logic remains locked except this fixture setup |
| Matrix coverage | Quantity slots, custom slot icon, under-min blocked, exact-max blocked, over-max blocked, desktop sidebar, mobile expanded tray |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C04-slots-box-validation/` |
| Current delta | `C04-slots-box-validation/delta.md` updated with current EB/WPB evidence. EB Admin previously showed Product Slots enabled, a slot icon control with Change/Reset actions, and the visible quantity validation control checked, but cache-bypassed EB storefront proof still emits `validateBoxSelectionQuantity: false`; under-min/exact-max/over-max blocking is therefore not proved by this fixture. Fresh 2026-07-04 EB desktop and true mobile `390 x 844` proof shows `FBP_SIDE_FOOTER + CLASSIC`, active `Box of 2` / `₹5 off`, desktop slot rail `170 x 90` with two `80 x 80` filled slots, and mobile filled slots as `65 x 80` images inside `65 x 60` slot containers. However, current EB live state is no longer a clean C04-only fixture: it includes long C01 category labels, variants-as-individual product cards, add-on copy, and two selected items. A follow-up EB Admin and storefront interaction pass saved the visible Rules help article, confirmed the Bundle Settings quantity-validation checkbox is the per-product max-quantity control, and proved that clearing selected items leaves the preselected/default product in place. The resulting EB mobile tray renders one filled slot plus one empty `65 x 60` dashed slot with `backgroundImage: none` and no custom image/source despite the Admin Slot Icon controls, so no WPB custom-icon source change is justified until EB actually renders a custom icon. WPB was reconfigured through the Shopify Admin UI, without backend shortcuts, back to a one-category C04 Product Slots fixture. Cache-bypassed WPB proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.32"` shows `FBP_SIDE_FOOTER + CLASSIC`, category `C04 Product Slots`, stale C07 labels absent, desktop sidebar with active `Box of 2` / `$5 off`, two `80 x 80` empty slot buttons, and progress copy `Add 2 product(s) to save $5`. True mobile `390 x 844` expanded tray proof shows `Review your bundle`, `Box of 2`, `$5 off`, two `65 x 60` empty slot cells, and `Add To Cart • $0.00`. Storefront-scoped source fixes remain: `5.0.25` inserted Classic mobile box-selection rendering, `5.0.28` reuses the compact mobile slot-tile renderer for slot-enabled `CLASSIC` summaries, and `5.0.32` changes only Classic desktop slot CSS so the generated `bundle-widget-full-page-classic.css` carries an `inline-grid` 5rem sidebar rail matching the current EB `80 x 80` desktop slot size. Evidence includes `eb-c04-current-desktop-runtime-20260704-fresh.json`, `eb-c04-current-mobile-expanded-runtime-20260704.json`, `eb-c04-mobile-after-clear-expanded-runtime-20260704.json`, `wpb-c04-current-desktop-runtime-20260704.json`, and `wpb-c04-current-mobile-expanded-runtime-20260704.json`. Remaining C04 gap: validation blocking remains unverified until EB emits a clean exact-2 or box-validation runtime without a default product satisfying the rule. |

Acceptance:
- [ ] Empty slots use the configured slot icon when EB does.
- [x] Filled slot thumbnails and selected counts match the current EB mobile slot fixture.
- [ ] Under-min, exact-max, and over-max states block at the same interaction point as EB.
- [ ] Validation copy comes from runtime language/config data or documented EB defaults.

### C05 Discounts Progress

| Field | Value |
|---|---|
| Status | wpb-progress-on-proofed-eb-visible-gap |
| EB config | Classic percentage, fixed amount, fixed-price, and highest-eligible discount tiers with progress below threshold |
| WPB config | Dev-tunnel Classic storefront fixture reconfigured through Admin UI for one fixed-amount quantity tier, Bundle Quantity Options, Progress Bar, and Discount Messaging; Admin flow/business logic remains locked except fixture setup |
| Matrix coverage | Percentage tier, fixed amount tier, fixed price bundle, buy X get Y, progress below threshold, highest eligible tier, sidebar progress, mobile progress |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C05-discounts-progress/` |
| Current delta | EB bundle `1` is the current recoverable Classic storefront evidence source for this row: it renders `bundleDesignPresetId: "CLASSIC"` with box selection enabled, default `Box of 2` / `₹5 off` copy, default product selection, and add-on percentage tier messaging (`Congrats you are eligible for 10% off on Add ons`). EB Admin recheck proves the active Discount & Pricing setup is `Fixed Amount Off`, quantity threshold `2`, fixed amount `₹5`, Bundle Quantity Options enabled with `Box of 2` / `₹5 off`, Progress Bar disabled, and Discount Messaging disabled; no row-specific help/setup links were visible on that surface. Cache-bypassed EB desktop/mobile storefront proof shows the visible bar nodes are the step timeline (`gbbStepsProgressBar*`), while the discount component is hidden and no discount-progress message renders. Adding a second item moves `items_quantity` from `1` to `2`, advances to Step 2, keeps the `Box of 2` / `₹5 off` label, and shows footer total `₹1658.00` for the two selected default-product instances with no visible ₹5 footer deduction. Current EB evidence includes `eb-c05-admin-discount-pricing-current-20260703.txt`, `eb-c05-current-desktop-runtime-computed-20260703.json`, `eb-c05-current-desktop-eligible-runtime-computed-20260703.json`, `eb-c05-current-mobile-expanded-runtime-20260703.json`, and `eb-c05-current-add-second-product-action-20260703.json`. WPB proof after the C04 reconfiguration and `window.__BUNDLE_WIDGET_VERSION__ === "5.0.25"` showed root `CLASSIC`, active `Box of 2` / `$5 off`, desktop initial copy `Add 2 product(s) to save $5`, desktop below-threshold copy `Add 1 product(s) to save $5`, desktop eligible success copy `Success! Your $5 discount has been applied to your cart.`, and desktop total moving from `$1448.00` to `$1443.00`. A follow-up Admin reconfiguration enabled WPB Progress Bar and Discount Messaging, saved through the dev tunnel with HTTP 200, then cache-bypassed storefront proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.28"` showed root `CLASSIC`, desktop stepped progress track/fill nodes plus `Box of 2` / `$5 off`, mobile collapsed/expanded unlock copy `Add 2 product(s) to save $5!`, mobile below-threshold copy `Add 1 product(s) to save $5!`, and mobile eligible success copy with `Next • $1443.00`. First-paint instrumentation saw no transient `STANDARD` preset class; it saw the root briefly without a preset class before final `CLASSIC`, so the reported Standard-looking flash is likely the presetless base state unless reproduced with a stricter visual trace. Evidence: `wpb-admin-reconfigure-c05-progress-save-20260703.response.network-response`, `wpb-c05-progress-on-desktop-initial-runtime-5028-20260703.json`, `wpb-c05-first-paint-preset-sequence-5028-20260703.json`, `wpb-c05-progress-on-mobile-collapsed-runtime-5028-20260703.json`, `wpb-c05-progress-on-mobile-expanded-runtime-5028-20260703.json`, `wpb-c05-progress-on-mobile-one-item-runtime-5028-20260703.json`, and `wpb-c05-progress-on-mobile-eligible-runtime-5028-20260703.json` with matching screenshots/a11y. Remaining C05 gaps: fixed-price tiers, buy-X-get-Y, multiple/highest-eligible discount conflicts, EB visible progress-bar-on behavior, and cart-line savings proof for the fixed-amount box rule. No source change is justified from this pass. |

Acceptance:
- Progress below threshold updates after each relevant product quantity change.
- Highest eligible tier wins when multiple discount tiers qualify.
- Desktop sidebar and mobile tray show the same discount state as EB.
- Cart proof records whether savings are native discount allocations, cart properties, or display-only state.

2026-07-04 recheck: fresh cache-cleared EB proof at the available Chrome DevTools MCP viewport (`500 x 725`) still shows `Box of 2` / `₹5 off`, the step timeline progress bar, and `gbbDiscountComponent` hidden with `display: none`; evidence: `eb-c05-current-runtime-20260704.json`, `eb-c05-current-20260704.png`, and `eb-c05-current-a11y-20260704.txt`. Fresh WPB proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.32"` still serves `FBP_SIDE_FOOTER + CLASSIC`, but its current saved fixture has Progress Bar and Discount Messaging enabled, so the mobile Classic footer shows `Add 2 product(s) to save $5!` plus the green stepped progress track; evidence: `wpb-c05-current-runtime-5032-20260704.json`, `wpb-c05-current-5032-20260704.png`, and `wpb-c05-current-a11y-5032-20260704.txt`. A follow-up true-mobile `390 x 844` pass confirmed the same fixture mismatch: EB shows `gbbStepsProgressBar` / `gbbStepsProgressBarFilled` as the step timeline and keeps `gbbDiscountComponent` hidden, while WPB `5.0.32` shows visible mobile discount copy and a `360 x 7` stepped progress track/fill because the current saved WPB fixture has those display options on. Evidence: `eb-c05-true-mobile-runtime-20260704.json`, `eb-c05-true-mobile-20260704.png`, `wpb-c05-true-mobile-runtime-20260704.json`, and `wpb-c05-true-mobile-20260704.png`. This does not justify a source change: EB and WPB are not on the same progress-display fixture, and the approved Admin UI path remained unavailable from the direct configure URL because the embedded app iframe loaded as `about:blank`.

### C06 Addons Free Gift

| Field | Value |
|---|---|
| Status | verified |
| EB config | Classic add-on step with free gift tier, paid add-on tier, eligibility and ineligibility transitions, and add-on summary visibility |
| WPB config | Dev-tunnel Classic storefront fixture reconfigured through WPB Admin for a paid `10%` tier and a `100%` free-gift tier; Admin business logic remains locked except this fixture setup |
| Matrix coverage | Multi-step with add-on/gifting step, add-ons with paid tier, add-ons with free tier, multiple eligible tiers, highest eligible tier, add-on summary visibility, cart proof |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C06-addons-free-gift/` |
| Current delta | EB and WPB Classic add-on evidence is captured for paid add-on, two-tier add-on messaging, mobile tray, card badge, and cart behavior. Earlier fixes `5.0.23` through `5.0.24` kept Classic paid add-on cards on product-add copy, fixed mobile footer progression into the Add On step, and restored the visible `10% off` add-on card badge. Source fix `5.0.26` resolves saved message aliases such as `{remainingQuantity}` and `{discountValue}` in addition to existing EB-style `##addons...##` and `{{addons...}}` tokens. Source fix `5.0.27` separates the summary message tier from the active discount/product tier so the summary can show progress toward the next locked tier while cart/add-on pricing still uses the earned tier. Cache-bypassed desktop and mobile proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.27"` shows root `CLASSIC`, no literal placeholders, one paid item, and the EB-matching next-tier copy `Add 1 more product(s) to claim 100% off on Add ons` with no stale `Congrats you are eligible for 10% off on Add ons`; evidence files include `wpb-c06-next-tier-desktop-after-one-5027-20260703.json/png/txt` and `wpb-c06-next-tier-mobile-after-one-5027-20260703.json/png/txt`. Fresh current EB free-gift cart proof shows EB renders a separate `Fragrance Candle - Cherry` add-on line discounted to free, plus a `Daily Essentials` parent line with hidden component items and `TOTAL SAVINGS`; current WPB proof matches that high-level cart shape with a separate free add-on line, parent line, `ADD ON` discount, and hidden component summary. Source fix `5.0.29` prevents Classic desktop side-panel box-tier CTA text from replacing the final Add On submit button; cache-bypassed desktop proof shows root `CLASSIC`, visible submit text `Add To Cart`, and no `side-panel-btn-has-tier-cta` class on the visible submit button after selecting the free gift. Fresh mobile recheck on `5.0.29` reproduced the Add On path through real DevTools clicks: the first free-gift Add control selected `Fragrance Candle - Cherry` without navigating away, updated the footer to `Add To Cart • $1413.00`, posted `cart/add.js` 200, saved bundle details, redirected to checkout, and produced the same separate free add-on line plus parent line cart shape. Evidence files include `eb-c06-freegift-checkout-runtime-cart-20260703.json`, `wpb-c06-freegift-checkout-runtime-cart-5028-20260703.json`, `wpb-c06-5029-addon-cta-proof-20260703.json/png`, `wpb-c06-5029-mobile-freegift-selected-proof-20260704.json/png`, `wpb-c06-5029-mobile-cart-add-20260704.network-request`, `wpb-c06-5029-mobile-after-submit-tap-20260704.json`, and `wpb-c06-5029-mobile-checkout-runtime-20260704.json/png/txt`. No C06 storefront source gap remains in the current fixture. |

Acceptance:
- Eligibility and ineligibility transitions match EB before and after entering the add-on step.
- Highest eligible add-on tier wins.
- Free gift and paid add-on cart lines match EB metadata and savings behavior.
- Summary visibility rules are Classic-scoped unless fresh evidence proves shared behavior.

### C07 Product Source Inventory

| Field | Value |
|---|---|
| Status | wpb-source-fixture-proofed-oos-eb-gap |
| EB config | Classic manual, collection-backed, mixed-source, visible OOS, blocked OOS, and inventory tracking at add-to-cart |
| WPB config | Dev-tunnel Classic storefront fixture reconfigured through Admin UI only: manual category, collection-backed category, mixed manual plus collection category, add-ons disabled, Step 1 exact quantity 2 |
| Matrix coverage | Manual products, collection-backed category, mixed manual plus collection, out of stock visible, out of stock blocked, track inventory on add-to-cart, collection hydration |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C07-product-source-inventory/` |
| Current delta | EB bundle `1` desktop/mobile proof captured with cache/storage cleared. It proves Classic manual product rendering, long pill sizing, variant DOM data, image cards, prices, add-to-box controls, and no visible OOS/unavailable storefront signal in the current fixture. EB desktop network proof shows Storefront GraphQL product hydration via `nodes(ids: $ids)` and includes `availableForSale`, `quantityAvailable`, and variant inventory fields; it does not use cursor pagination in this fixture. Evidence: `eb-c07-desktop-runtime-20260703.json`, `eb-c07-desktop-20260703.png`, `eb-c07-desktop-a11y-20260703.txt`, `eb-c07-desktop-graphql-3240.*`, `eb-c07-desktop-graphql-3271.*`, `eb-c07-desktop-graphql-3386.*`, `eb-bundle1-product-source-mobile-runtime-20260703.json`, `eb-bundle1-product-source-mobile-20260703.png`, and `eb-bundle1-product-source-mobile-a11y-20260703.txt`. WPB bundle `cmr361mz50000v00yrdeyxpf7` was reconfigured through the Admin UI for the C07 source fixture without changing Admin flow/business logic: `C07 Manual Products` has 6 manual products and 0 collections, `C07 Collection Source` has 0 manual products and 1 `Automated Collection`, and `C07 Mixed Source` has 6 manual products plus 1 `Automated Collection`; add-ons/gifting were disabled. Hard-reloaded WPB proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.29"` and `data-fpb-design-preset="CLASSIC"` shows all three C07 category pills on desktop and mobile, the collection-backed tab rendering collection products, the mixed-source tab rendering both saved manual products and collection products, and no visible Add On or Free Gift text. Evidence: `wpb-admin-c07-before-reconfigure-20260704.txt`, `wpb-admin-c07-saved-step-setup-20260704.txt`, `wpb-c07-runtime-after-reconfigure-20260704.json`, `wpb-c07-mobile-runtime-after-reconfigure-20260704.json`, `wpb-c07-desktop-after-reconfigure-20260704.png`, `wpb-c07-mobile-after-reconfigure-20260704.png`, `wpb-c07-bundle-api-608-20260704.network-response`, `wpb-c07-storefront-collections-614-20260704.network-response`, `wpb-c07-desktop-collection-category-state-20260704.json`, `wpb-c07-desktop-collection-category-20260704.png`, `wpb-c07-desktop-collection-category-a11y-20260704.txt`, `wpb-c07-desktop-mixed-category-state-20260704.json`, `wpb-c07-desktop-mixed-category-20260704.png`, `wpb-c07-desktop-bundle-api-1980-20260704.network-response`, and `wpb-c07-desktop-storefront-collections-1984-20260704.network-response`. C07 remains gated only for current EB collection/mixed/OOS fixture proof plus true visible OOS, blocked OOS, and inventory tracking at add-to-cart. No source change is justified from current C07 evidence. |

Acceptance:
- Collection products hydrate by the EB-documented ID/batch behavior, not cursor-pagination assumptions.
- Manual and collection-backed products render in EB order.
- Inventory-related network proof is captured for both apps.
- OOS presentation and blocking point match EB without conflicting with rule validation messages.

2026-07-04 recheck: fresh cache-cleared EB proof at the available Chrome DevTools MCP viewport (`500 x 725`) still shows manual products plus the long/empty category fixture only; `collectionsSelectedData` is absent from the inline runtime script probe, no collection/mixed-source label is visible, and no OOS/sold-out storefront copy appears. Evidence: `eb-c07-current-runtime-20260704.json`, `eb-c07-current-20260704.png`, and `eb-c07-current-a11y-20260704.txt`. Fresh WPB proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.32"` still serves `FBP_SIDE_FOOTER + CLASSIC`; the current C07 fixture API has `C07 Manual Products` with 6 manual products, `C07 Collection Source` with 1 collection and 20 visible hydrated cards, and `C07 Mixed Source` with 6 manual products plus 1 collection and 23 visible cards. Evidence: `wpb-c07-current-states-5032-20260704.json`, `wpb-c07-current-mixed-5032-20260704.png`, and `wpb-c07-current-mixed-a11y-5032-20260704.txt`. No source change is justified; C07 remains gated on EB collection/mixed/OOS fixture proof and inventory blocking.

### C08 Cart Lines

| Field | Value |
|---|---|
| Status | verified |
| EB config | Classic add-to-cart success and blocked states with cart properties, `bundle_details`, and discount/cart-line savings UI |
| WPB config | Current dev-tunnel Classic storefront fixture only; Admin flow/business logic remains locked for now |
| Matrix coverage | Add to cart success, add to cart blocked, cart properties, `bundle_details`, discount/cart-line savings UI, reload after selection |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C08-cart-lines/` |
| Current delta | EB bundle `1` provides live Classic success proof: Step 2 routes through `personalizationPage`, add-on review pricing is visible, final `Add To Cart` triggers `cart/add.js` 200, `cart/update.js` 200, and checkout. EB blocked-state proof on mobile shows the footer action remains pressable while underfilled and surfaces `Add exactly 1 products on this step` instead of disabling the action; evidence includes `eb-c08-underfilled-before-next-mobile-20260704.png`, `eb-c08-click-underfilled-next-20260704.json`, `eb-c08-underfilled-blocked-state-20260704.json`, `eb-c08-underfilled-blocked-mobile-20260704.png`, and `eb-c08-underfilled-blocked-a11y-20260704.txt`. EB `bundle_details` GraphQL proof is captured: `eb-c08-graphql-before-2474-20260704.network-request` queries `GetCartMetafield` for key `bundle_details`, and `eb-c08-graphql-after-2476-20260704.network-request` calls `cartMetafieldsSet` with merged `FBP-1_Z6D` and `FBP-1_TO4` display properties. EB cart proof for `FBP-1_TO4` posts two component items in `eb-c08-cart-add-2477-20260704.network-request`, each with `Box: 2`, `_bundleName`, `_easyBundle:prodQty`, `_easyBundle:OfferId`, and `_addon_offer_id`; after-add proof is in `eb-c08-after-add-cart-json-graphql-proof-20260704.json`, `eb-c08-checkout-after-graphql-proof-mobile-20260704.png`, and `eb-c08-checkout-after-graphql-proof-a11y-20260704.txt`. WPB `5.0.30` hard-reload proof fixed the Classic mobile blocked-action delta: the final underfilled `Add To Cart` CTA remains enabled at zero selected and one selected, clicking it shows `Add exactly 2 products on this step`, and no cart submission occurs before validation passes. WPB `5.0.31` hard-reload desktop proof fixes the corresponding Classic side-panel path: the primary button keeps `Add To Cart` copy instead of inheriting `Box of 2 $5 off`, the zero-selected click surfaces `Add exactly 2 products on this step`, and no cart/add or bundle-details traffic occurs while blocked. Evidence: `wpb-c08-5031-final2-zero-click-state-20260704.json`, `wpb-c08-5031-final2-zero-toast-20260704.png`, and `wpb-c08-5031-final2-zero-toast-a11y-20260704.txt`. Current WPB `5.0.31` success proof on the reconfigured C07 fixture selects two paid products, keeps the desktop CTA as `Add To Cart`, reaches checkout, and `/cart.js` records one parent `Daily Essentials` line with `_is_bundle_parent: "true"`, `_bundle_component_count: "2"`, `_bundle_total_retail_cents: "144800"`, `_bundle_total_price_cents: "144300"`, `_bundle_total_savings_cents: "500"`, component metadata, and visible checkout line details. Evidence: `wpb-c08-5031-final2-two-selected-state-20260704.json`, `wpb-c08-5031-final2-submit-click-20260704.json`, `wpb-c08-5031-final2-success-cart-json-20260704.json`, `wpb-c08-5031-final2-success-storefront-20260704.png`, and `wpb-c08-5031-final2-success-storefront-a11y-20260704.txt`. The older WPB `5.0.27` two-tier fixture remains the add-on/cart-bundle-details proof for the add-on branch: `wpb-c08-cart-add-5027.request.network-request`, `wpb-c08-cart-bundle-details-5027.request.network-request`, `wpb-c08-cart-bundle-details-repeat-response-5027.json`, `wpb-c08-after-add-cart-json-5027-20260703.json/png/txt`, and `wpb-c08-checkout-mobile-runtime-5027-20260703.json/png/txt`. No C08 source gap remains for the current Classic fixture. |

Acceptance:
- Blocked add-to-cart state appears at the same interaction point as EB.
- Successful add-to-cart records parent and component metadata expected by the current Wolfpack cart pipeline.
- `bundle_details` proof includes before/after state or explains why it is unchanged.
- Discount/cart-line savings UI is verified in cart or checkout when relevant.

## Stress Run Set

### CS1 Multi-Step Variants Discount Add-On

| Field | Value |
|---|---|
| Status | eb-partial-wpb-stress-fixture-gap |
| Scenario | Multi-step Classic bundle combining variants, discount progress, and add-on/free-gift qualification |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/CS1-multi-step-variants-discount-addon/` |
| Current delta | 2026-07-04 recheck: EB bundle `1` now exercises a stronger CS1 stress shape at the available Chrome DevTools MCP viewport (`500 x 725`): `FBP_SIDE_FOOTER + CLASSIC`, default product enabled, `Box of 2` / `₹5 off`, add-on personalization enabled, Step 2 add-on navigation, tier 1 paid percentage add-on, and tier 2 `100%` add-on/free-gift-like eligibility with variants-as-individual-products (`Fragrance Candle` variants plus `Black Crew Neck T-Shirt` variant cards). EB still has no top-level `discountConfiguration` in this fixture, so fixed/fixed-price tier conflicts remain unproved. Evidence: `eb-cs1-current-runtime-20260704.json`, `eb-cs1-current-addon-runtime-20260704.json`, `eb-cs1-current-interaction-log-20260704.json`, `eb-cs1-current-20260704.png`, `eb-cs1-current-addon-20260704.png`, and saved GraphQL/cart network calls under `/private/tmp/fpb-classic-agentic-parity/CS1-multi-step-variants-discount-addon/`. Fresh WPB proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.32"` still serves `FBP_SIDE_FOOTER + CLASSIC`, but the current API fixture remains the C07 one-step category source fixture: one step, three categories (`C07 Manual Products`, `C07 Collection Source`, `C07 Mixed Source`), active fixed-amount discount progress, visible variant selectors/cards, and no `personalizationData`, add-on, or free-gift data. Evidence: `wpb-cs1-current-runtime-5032-20260704.json`, `wpb-cs1-current-5032-20260704.png`, `wpb-cs1-current-a11y-5032-20260704.txt`, and `wpb-cs1-bundle-api-1048-5032-20260704.network-response`. CS1 remains fixture-gated on a WPB Classic fixture that combines multi-step products, variants, discount progress, and add-on/free-gift qualification; no source change is justified from current proof. |

Acceptance:
- Step navigation, variant state, discount progress, and add-on eligibility stay synchronized across desktop and mobile.
- Cart proof records final selected products, add-ons, savings, and metadata.

### CS2 Mobile Long Titles Multi-Image Cards

| Field | Value |
|---|---|
| Status | mobile-long-title-partial-fixture-gap |
| Scenario | Long product titles and multi-image cards on mobile Classic |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/CS2-mobile-long-titles-multi-image-cards/` |
| Current delta | 2026-07-04 recheck at the available Chrome DevTools MCP viewport (`500 x 725`): EB bundle `1` still serves `FBP_SIDE_FOOTER + CLASSIC` and proves long Classic category pills, long product/card text, visible variant-as-card/list content, 44 visible images, and carousel/arrow signals. Evidence: `eb-cs2-current-runtime-20260704.json`, `eb-cs2-current-20260704.png`, and `eb-cs2-current-a11y-20260704.txt`. WPB proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.32"` still serves `FBP_SIDE_FOOTER + CLASSIC`; the current C07 fixture proves long-ish category labels, `Black Crew Neck T-Shirt - Kite App`, visible variant controls, 8 visible images, and carousel/arrow signals. Evidence: `wpb-cs2-current-runtime-5032-20260704.json`, `wpb-cs2-current-5032-20260704.png`, and `wpb-cs2-current-a11y-5032-20260704.txt`. This remains partial because the available viewport is not true `390 x 844`, WPB is not on the same long-label fixture as EB, and the same EB-style multi-image carousel interaction state is still not isolated. No source change is justified yet. |

Acceptance:
- Long titles remain readable without overlapping price, variant, CTA, or tray controls.
- Product cards do not shift height during image load or selection.
- Mobile screenshot and computed styles are captured at 390 x 844.

### CS3 Empty Category Reload First-Load

| Field | Value |
|---|---|
| Status | eb-label-not-empty-wpb-fixture-gap |
| Scenario | Empty or no-product category plus reload and first-load Classic state |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/CS3-empty-category-reload-first-load/` |
| Current delta | 2026-07-04 recheck at the available Chrome DevTools MCP viewport (`500 x 725`): EB bundle `1` still serves `FBP_SIDE_FOOTER + CLASSIC` and still has a category labeled `Empty Category With An Exceptionally Long Name For Classic Pills`, but a targeted click on its `category62596` tab proves it is not empty in the current fixture: the tab becomes active and renders `18k Bloom Earrings` plus `18k Bloom Pendant`; no `No Products Available`/`No products` copy appears. Hard reload resets to the first category with product cards visible. Evidence: `eb-cs3-current-before-runtime-20260704.json`, `eb-cs3-current-after-targeted-empty-tab-click-20260704.json`, `eb-cs3-current-after-targeted-empty-tab-click-20260704.png`, `eb-cs3-current-after-targeted-empty-tab-click-a11y-20260704.txt`, and `eb-cs3-current-after-reload-20260704.json`. WPB proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.32"` still serves `FBP_SIDE_FOOTER + CLASSIC`, but the current C07 fixture has no empty category label and no no-product copy; its categories are `C07 Manual Products` (6 manual products), `C07 Collection Source` (1 collection), and `C07 Mixed Source` (6 manual products plus 1 collection). Evidence: `wpb-cs3-current-before-reload-5032-20260704.json`, `wpb-cs3-current-before-reload-5032-20260704.png`, `wpb-cs3-current-before-reload-a11y-5032-20260704.txt`, `wpb-cs3-current-after-reload-5032-20260704.json`, and `wpb-cs3-collections-2070-5032-20260704.network-response`. CS3 cannot validate empty/no-product category first-load or reload behavior until EB and WPB expose a true empty category. No source change is justified yet. |

Acceptance:
- Empty category state matches EB on first load and after reload.
- Reload preserves or clears selection exactly where EB does.
- No local fallback copy is introduced without EB evidence.

### CS4 Mobile Footer Scroll Lock

| Field | Value |
|---|---|
| Status | eb-wpb-default-tray-proofed-empty-fixture-gap |
| Scenario | Mobile Classic footer expanded scroll lock, collapsed empty state, and EB-style height animation |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/CS4-mobile-footer-scroll-lock/` |
| Current delta | WPB mobile proof captured on `5.0.21` at `390 x 844` with cache/storage cleared. Evidence includes `wpb-mobile-collapsed-5021.json/png`, `wpb-mobile-expanded-scroll-probe-5021.json`, `wpb-mobile-expanded-a11y-5021.txt`, and `wpb-mobile-expanded-5021.png`. The collapsed empty Classic tray sits at the viewport bottom with `Review your bundle` and `Next • $0.00`, measures `370 x 116.1875`, and uses the Classic footer transition `height 0.28s cubic-bezier(0.22, 1, 0.36, 1), grid-template-rows 0.28s ...`. Expanding adds `fpb-mobile-summary-tray-expanded` and exposes `Your Bundle` in a11y, but the empty fixture keeps the same measured height. A forced `window.scrollBy(0, 350)` while expanded changed `scrollY` from `0` to `343`; computed body overflow was `auto hidden`. EB bundle `1` now provides mobile Classic tray proof for a default-selected fixture, not the empty-state fixture: collapsed footer shows `View Selected Products`, `Next`, `₹829.00`, and count `1`; expanded footer measures `370 x 458`, uses `position: sticky`, exposes `Daily kit`, `Box of 2`, `₹5 off`, and `Add 0 more product(s) to claim 10% off on Add ons`; forced scroll while expanded changed `scrollY` from `0` to `350` with body overflow `auto hidden`. Evidence: `eb-bundle1-mobile-default-collapsed-20260703.png`, `eb-bundle1-mobile-default-expanded-20260703.png`, and `eb-bundle1-mobile-expanded-scroll-probe-20260703.json`. No scroll-lock mismatch is justified from current evidence. The collapsed empty-state comparison remains blocked because EB bundle `1` has `defaultProductsData.isDefaultProductsEnabled: true`. |

Acceptance:
- Collapsed empty state is captured before any product selection.
- Expanded tray does not allow incoherent background scrolling if EB locks scroll.
- Height animation matches EB behavior without hardcoding brittle pixel values in source.

### CS5 Loading State

| Field | Value |
|---|---|
| Status | wpb-eb-load-proofed-spinner-detector-limited |
| Scenario | Classic loading state: spinner only, no theme bundle title flash |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/CS5-loading-state/` |
| Current delta | WPB first-paint proof captured on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.21"` after clearing Cache Storage/local/session and hard reloading with a document-start mutation probe. Evidence includes `wpb-load-probe-safe-5021.json`, `wpb-network-summary-5021.json`, `wpb-a11y-5021.txt`, and `wpb-desktop-5021.png`. WPB root states were only an unpreset `bundle-widget-container bundle-widget-full-page` loading overlay followed by `CLASSIC`; `sawStandardPreset: false`, `visibleThemeBundleTitleEvents: 0`, and only base + Classic CSS remained active. EB bundle `1` loading proof was captured with cache/storage cleared and a document-start probe: `sawClassic: true`, `sawStandardLike: false`, `sawThemeTitleOnly: false`, and final root class `gbbPageBody gbbMinimilisticLayout gbbProductsCardLayoutV2 bundle-1`. EB final active bundle styles are `easy-bundle-min.css` and `easy-bundle-full-page-min.css`. Evidence: `eb-bundle1-load-probe-20260703.json`, `eb-bundle1-loaded-mobile-20260703.png`, and `eb-bundle1-loaded-mobile-a11y-20260703.txt`. Caveat: the EB probe's generic spinner detector stays true after render because EB leaves spinner assets/classes in the DOM, so it proves no Standard-like or theme-title-only flash, but not exact spinner visibility duration. No source change is justified. |

Acceptance:
- Initial loading state shows only EB-equivalent loading UI.
- Theme bundle title does not flash before Classic widget hydration.
- Network and performance timing evidence explain the observed loading sequence.

### CS6 Non-Classic Smoke

| Field | Value |
|---|---|
| Status | completed-current-smoke |
| Scenario | Standard, Compact, and Horizontal smoke after Classic changes |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/CS6-non-classic-smoke/` |
| Current delta | `delta.md` captured the original fixture blocker and the current Admin reconfiguration pass. Cache-cleared WPB `/pages/preview-daily-essentials-2` on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.21"` rendered active root `data-fpb-design-preset="CLASSIC"` with `bundle-widget-full-page-classic.css`; the compact inline config still contained `bundleDesignPresetId: "STANDARD"`, but hydrated runtime/proxy data was Classic. After the shared product-card slice in `5.0.24`, fresh cache-cleared desktop and mobile proof still showed only the Classic fixture: root `CLASSIC`, only `bundle-widget-full-page-classic.css` active, Standard/Compact/Horizontal preset stylesheets inactive or not loaded, and `0` Standard selectors applying to the Classic root. The user then approved reconfiguring the single current bundle through the Admin UI. Chrome DevTools MCP proof on `5.0.24` shows the same bundle successfully switched through Standard, Compact, and Horizontal and loaded only the matching preset root/CSS for each: `wpb-standard-runtime-after-admin-reconfigure-desktop-20260703.json`, `wpb-standard-runtime-after-admin-reconfigure-mobile-20260703.json`, `wpb-standard-desktop-after-admin-reconfigure-20260703.png`, `wpb-standard-mobile-after-admin-reconfigure-20260703.png`, `wpb-compact-runtime-after-admin-reconfigure-desktop-20260703.json`, `wpb-compact-runtime-after-admin-reconfigure-mobile-20260703.json`, `wpb-compact-desktop-after-admin-reconfigure-20260703.png`, `wpb-compact-mobile-after-admin-reconfigure-20260703.png`, `wpb-horizontal-runtime-after-admin-reconfigure-desktop-20260703.json`, `wpb-horizontal-runtime-after-admin-reconfigure-mobile-20260703.json`, `wpb-horizontal-desktop-after-admin-reconfigure-20260703.png`, and `wpb-horizontal-mobile-after-admin-reconfigure-20260703.png`. The bundle was restored to Classic through the same Admin flow, and `wpb-classic-restore-runtime-mobile-20260703.json` confirms root `CLASSIC`, only base + Classic full-page CSS active, and no Standard/Compact/Horizontal root present. No source change is justified from CS6. |

Acceptance:
- Standard, Compact, and Horizontal load their expected preset roots and template CSS assets.
- Classic-scoped selectors do not apply to Standard, Compact, or Horizontal.
- Shared cart add, variant selector, summary footer, and asset selection behavior remain unchanged.

## Test Plan

- Spec checks: this file must include matrix values, row IDs, evidence paths, current status, acceptance criteria, and row-specific delta requirements.
- Unit tests are allowed only for behavior/data contracts: preset mapping, DTO/metafield payloads, selection rules, add-on/free-gift qualification, discount progress, inventory guards, and cart payloads.
- Do not add CSS, class-name, source-order, pixel-parity, layout-contract, or source-grep tests.
- Browser acceptance for every completed row requires Chrome DevTools MCP cache-bypassed EB/WPB proof on desktop `1280+` and mobile `390 x 844`.
- Regression smoke requires Classic changes not to alter Standard, Compact, or Horizontal preset loading, asset selection, summary footer behavior, variant selector behavior, or cart add.
- No autonomous deploy or `npm run dev`; use the user-provided dev tunnel and hard reload unless the user explicitly performs a deploy.

## Open Assumptions

- Scope is FPB Classic storefront parity only. Admin UI parity, PPB parity, and non-Classic visual parity are out of scope except regression smoke.
- Existing Classic docs and old captures are bootstrap references, not final truth; live EB Chrome evidence wins when they disagree.
- The current Classic source structure is retained; no template rewrite happens unless repeated EB evidence proves the current structure cannot match Classic.
- Durable new EB behavior discovered during execution updates `internal docs/EB Implementation Reference.md` and is linked from `internal docs/index.md`.
