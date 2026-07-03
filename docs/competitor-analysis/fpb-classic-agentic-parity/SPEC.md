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
| Current delta | EB desktop/mobile category-pill evidence captured. EB prunes truly empty/unselected categories from storefront output; after products were selected in the second long-label category, EB rendered both pills and switched categories correctly. Admin setup note: the category accordion exposes the category-name textbox only when more than one category exists; keep that as fixture setup evidence, not as a reason to reopen the locked Admin flow in this storefront loop. WPB proxy API returns `CLASSIC` and both long-label categories. Live page HTML still embeds stale `STANDARD` full config from `custom.bundle_config`, so the source fix hydrates the current proxy payload before the first render whenever the cached payload is a full config. Cache-bypassed Chrome proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.17"` shows root preset `CLASSIC`, no captured `STANDARD` transition, only base + Classic stylesheets active, EB-style active/inactive pills, hidden duplicate category-section row, and working desktop/mobile category switching. |

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
| Status | grouped-variants-live-proofed-individual-gap |
| EB config | Classic products with grouped variant selector, variants-as-individual-products mode, unavailable variant, desktop dropdown, and mobile drawer behavior |
| WPB config | Mirrored Classic bundle through Admin UI |
| Matrix coverage | One option, multiple options, variants as individual products, unavailable variant, desktop dropdown, mobile drawer, variant selector enabled, add to cart blocked for unavailable selection |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C03-variants/` |
| Current delta | `delta.md` captured. EB Classic evidence shows grouped variants render inline in this fixture on desktop and mobile and filters the unavailable `Peach` value out of the Fragrance Candle choices. WPB Admin persisted Classic and variant-backed products, but desktop proof before fix showed no option controls because runtime payloads carried Shopify `selectedOptions` while the compact serializer/storefront normalizer expected flattened `option1`/`option2`/`option3` and product `options`. Source now derives compact option names/values without exposing raw `selectedOptions`. A follow-up shared-runtime fix on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.20"` merges category-cached variant availability into duplicate step products and filters unavailable-only grouped values. Cache-bypassed WPB mobile proof at true `390 x 844` shows Classic root, Fragrance overflow changed from `+2` to `+1`, `Peach` absent, and only `Ocean` hidden in the overflow list. Final cart payload proof shows `cart/add.js` posts the selected Vanilla variant ID `48719984427267`. Current same-day mobile proof on `5.0.21` confirms grouped variant controls still render in Classic: WPB shows `Cherry`, `Vanilla`, `Lavendar`, `Orange`, `+1`, shirt size buttons, and `Option 2: Black`, with `Peach` absent; EB shows grouped Fragrance options including `Ocean`, shirt size/color combinations, and `Peach` absent. Evidence: `wpb-mobile-grouped-variants-current-5021.json/png/txt` and `eb-mobile-grouped-variants-current-20260703.json/png/txt`. The current EB/WPB fixture has variants-as-individual disabled (`wpb-c03-variants-individual-fixture-probe-5020.json` records WPB step/category flags false), so C03 still needs a separately configured variants-as-individual proof before it can be marked verified. |

Acceptance:
- [x] Desktop grouped variant selector state, selected variant label, and selected product identity match EB for the captured fixture.
- [x] Mobile variant state is captured at a true `390 x 844` viewport.
- [x] Unavailable variant state is captured and unavailable-only grouped choices are filtered out.
- [ ] Variants-as-individual-products state is captured.
- [x] Cart payload uses the selected variant ID and unavailable selections are blocked by absence at the same point as EB.
- [x] The fix is source-owned and behavior-scoped: shared runtime normalization only, with EB/WPB evidence that the missing Classic controls came from shared variant data shape.

### C04 Slots Box Validation

| Field | Value |
|---|---|
| Status | eb-box-proofed-wpb-slot-fixture-gap |
| EB config | Classic product slots with custom slot icon, under-min, exact-max, and over-max validation |
| WPB config | Current dev-tunnel Classic storefront fixture only; Admin flow/business logic remains locked for now |
| Matrix coverage | Quantity slots, custom slot icon, under-min blocked, exact-max blocked, over-max blocked, desktop sidebar, mobile expanded tray |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C04-slots-box-validation/` |
| Current delta | `C04-slots-box-validation/delta.md` updated with current EB/WPB evidence. EB bundle `1` mobile proof shows Classic box selection enabled with active `Box of 2`, `₹5 off`, `items_quantity: 1`, and `validateBoxSelectionQuantity: false`; per the documented EB runtime, this fixture does not block under-min or over-max checkout. Evidence: `eb-bundle1-current-box-slot-runtime-20260703.json`, `eb-bundle1-current-box-slot-mobile-20260703.png`, and `eb-bundle1-current-box-slot-mobile-a11y-20260703.txt`. WPB cache-cleared mobile proof on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.21"` shows the rendered root is `CLASSIC`, but the storefront config still reports `productSlotsEnabled: false`, `productSlotIconUrl: null`, and `boxSelection: null`; no visible slot/validation text is present. Evidence: `wpb-current-slot-payload-probe-5021-20260703.json`, `wpb-current-slot-fixture-mobile-5021-20260703.png`, and `wpb-current-slot-fixture-mobile-a11y-5021-20260703.txt`. C04 remains blocked on a storefront fixture that exposes product slots, a custom slot icon, and quantity validation enabled. |

Acceptance:
- Empty slots use the configured slot icon when EB does.
- Filled slot thumbnails, remove affordances, and selected counts match EB in desktop and mobile.
- Under-min, exact-max, and over-max states block at the same interaction point as EB.
- Validation copy comes from runtime language/config data or documented EB defaults.

### C05 Discounts Progress

| Field | Value |
|---|---|
| Status | eb-partial-captured-wpb-fixture-gap |
| EB config | Classic percentage, fixed amount, fixed-price, and highest-eligible discount tiers with progress below threshold |
| WPB config | Current dev-tunnel Classic storefront fixture only; Admin flow/business logic remains locked for now |
| Matrix coverage | Percentage tier, fixed amount tier, fixed price bundle, buy X get Y, progress below threshold, highest eligible tier, sidebar progress, mobile progress |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C05-discounts-progress/` |
| Current delta | EB bundle `1` is the current recoverable Classic storefront evidence source for this row: it renders `bundleDesignPresetId: "CLASSIC"` with box selection enabled, default `Box of 2` / `₹5 off` copy, default product selection, and add-on percentage tier messaging (`Congrats you are eligible for 10% off on Add ons`). Evidence: `eb-bundle1-mobile-runtime-20260703.json`, `eb-bundle1-desktop-runtime-20260703.json`, `eb-bundle1-discount-config-probe-20260703.json`, and `eb-bundle1-after-second-add-20260703.json`. This is partial C05 proof only: `progressKeys` is empty and the live EB fixture does not prove fixed-price tiers, fixed-amount tiers beyond the box-selection subtext, buy-X-get-Y, or highest-eligible discount conflict behavior. Current WPB Classic fixture probe on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.21"` still shows `pricing.enabled: false`, empty `pricing.rules`, and disabled progress-bar settings, so no source change is justified until the storefront fixture exposes equivalent discount data. |

Acceptance:
- Progress below threshold updates after each relevant product quantity change.
- Highest eligible tier wins when multiple discount tiers qualify.
- Desktop sidebar and mobile tray show the same discount state as EB.
- Cart proof records whether savings are native discount allocations, cart properties, or display-only state.

### C06 Addons Free Gift

| Field | Value |
|---|---|
| Status | eb-partial-captured-wpb-fixture-gap |
| EB config | Classic add-on step with free gift tier, paid add-on tier, eligibility and ineligibility transitions, and add-on summary visibility |
| WPB config | Current dev-tunnel Classic storefront fixture only; Admin flow/business logic remains locked for now |
| Matrix coverage | Multi-step with add-on/gifting step, add-ons with paid tier, add-ons with free tier, multiple eligible tiers, highest eligible tier, add-on summary visibility, cart proof |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C06-addons-free-gift/` |
| Current delta | EB bundle `1` proves the Classic paid add-on step surface on desktop and mobile. Step 2 renders add-on products, collapsed mobile footer (`View Selected Products`, CTA, price, count), expanded mobile summary (`Daily kit`, `Two essentials unlock savings`, `Box of 2`, `₹5 off`, add-on eligibility message), and paid add-on selection. After clicking the first Step 2 add-on, the product button changes from `Add To Box` to quantity `1`, the footer total changes from `₹1158.00` to `₹1687.00`, and the footer count changes from `2` to `3`. Evidence: `eb-bundle1-step2-runtime-20260703.json`, `eb-bundle1-step2-desktop-20260703.png`, `eb-bundle1-step2-mobile-collapsed-20260703.png`, `eb-bundle1-step2-mobile-expanded-20260703.png`, `eb-bundle1-after-addon-click-runtime-20260703.json`, and `eb-bundle1-after-addon-click-mobile-20260703.png`. This is partial C06 proof only: the live EB fixture currently proves a paid percentage add-on tier, not a free gift tier, multiple eligible tiers, or highest-eligible add-on conflict behavior. Current WPB Classic fixture probe on `5.0.21` still shows `personalizationData: null` and no add-on/gift step, so no source change is justified until the storefront payload exposes equivalent add-on data. |

Acceptance:
- Eligibility and ineligibility transitions match EB before and after entering the add-on step.
- Highest eligible add-on tier wins.
- Free gift and paid add-on cart lines match EB metadata and savings behavior.
- Summary visibility rules are Classic-scoped unless fresh evidence proves shared behavior.

### C07 Product Source Inventory

| Field | Value |
|---|---|
| Status | eb-wpb-manual-mobile-proofed-fixture-gap |
| EB config | Classic manual, collection-backed, mixed-source, visible OOS, blocked OOS, and inventory tracking at add-to-cart |
| WPB config | Current dev-tunnel Classic storefront fixture only; Admin flow/business logic remains locked for now |
| Matrix coverage | Manual products, collection-backed category, mixed manual plus collection, out of stock visible, out of stock blocked, track inventory on add-to-cart, collection hydration |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C07-product-source-inventory/` |
| Current delta | EB bundle `1` mobile proof captured at `390 x 844` with cache/storage cleared. It proves Classic tabbed manual product rendering, long pill sizing, variant DOM data, and no visible OOS/unavailable storefront signal in the current fixture. Evidence: `eb-bundle1-product-source-mobile-runtime-20260703.json`, `eb-bundle1-product-source-mobile-20260703.png`, and `eb-bundle1-product-source-mobile-a11y-20260703.txt`. WPB mobile proof captured after cache/storage clear on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.21"` and `data-fpb-design-preset="CLASSIC"`; current fixture shows one long category pill, product cards, variants, no `Empty Category` text, and no visible OOS/unavailable text. Evidence: `wpb-product-source-mobile-runtime-20260703.json`, `wpb-product-source-mobile-20260703.png`, and `wpb-product-source-mobile-a11y-20260703.txt`. C07 remains fixture-gated for collection-backed, mixed-source, visible OOS, blocked OOS, and inventory tracking at add-to-cart. Desktop capture was not completed in this pass because the current DevTools target remained in mobile emulation; do not treat this row as accepted. |

Acceptance:
- Collection products hydrate by the EB-documented ID/batch behavior, not cursor-pagination assumptions.
- Manual and collection-backed products render in EB order.
- Inventory-related network proof is captured for both apps.
- OOS presentation and blocking point match EB without conflicting with rule validation messages.

### C08 Cart Lines

| Field | Value |
|---|---|
| Status | live-cart-proofed-delta-open |
| EB config | Classic add-to-cart success and blocked states with cart properties, `bundle_details`, and discount/cart-line savings UI |
| WPB config | Current dev-tunnel Classic storefront fixture only; Admin flow/business logic remains locked for now |
| Matrix coverage | Add to cart success, add to cart blocked, cart properties, `bundle_details`, discount/cart-line savings UI, reload after selection |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/C08-cart-lines/` |
| Current delta | WPB mobile proof captured on `5.0.21`: final CTA is disabled after Step 1 selection and before Step 2 selection; after Step 2 selection, `cart/add.js` posts two component lines with `_wolfpackProductBundle:OfferId` and `_bundle_display_properties`; Cart Transform produces one parent cart line with `_is_bundle_parent`, component count, retail/price/savings cents, and no discount allocation; `/apps/product-bundles/api/cart-bundle-details` receives `bundleDetailsKey: "FBP-cmr361mz50000v00yrdeyxpf7_UYM"` and display properties. Evidence: `wpb-cart-proof-5021.json`, `wpb-cart-add-5021.network-request`, and `wpb-cart-bundle-details-5021.network-request`. EB bundle `1` now provides live Classic success proof: Step 2 routes through `personalizationPage`, shows add-on review pricing (`₹829.00` to `₹746.10`, `10% off`), then `Add To Cart` triggers `cart/add.js` 200, `cart/update.js` 200, and `/cart/checkout` 302. Checkout `/cart.js` shows one parent line `Daily Essentials`, `final_line_price: 168700`, no discount allocations, and properties `_EasyBundleId: "FBP-1"`, `_originalOfferId: "FBP-1_0TZ"`, `_addon_offer_id: "Bundle1-ADP-407_1$Q:3$P:1687"`, `Box: "1"`, and `Items: "1 x 14k Dangling Obsidian Earrings, 1 x 14k Interlinked Earrings, 1 x 14k Intertwined Earrings"`. Expanded checkout summary shows one parent line, `Hide 3 items`, three component labels, subtotal `₹1,687.00`, estimated taxes `₹303.66`, and total `₹1,990.66`. Evidence: `eb-bundle1-before-final-next-20260703.json`, `eb-bundle1-personalization-runtime-20260703.json`, `eb-bundle1-after-add-to-cart-click-20260703.json`, `eb-bundle1-checkout-proof-20260703.json`, and `eb-bundle1-checkout-expanded-proof-20260703.json`. Remaining C08 gaps: EB blocked-state proof, `bundle_details` before/after GraphQL proof for bundle `1`, and full discount/cart-line savings comparison. |

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
| Current delta | EB bundle `1` now partially exercises the stress shape: Classic multi-step storefront, default product, box-selection discount copy, and paid percentage add-on eligibility/selection on Step 2. It still does not prove variants in the same EB stress fixture, free gifts, fixed/fixed-price discount tiers, or highest-eligible conflicts. Current WPB proxy capability probe on `5.0.21` shows a Classic two-step product fixture with variants, but no active discount rules and no add-on/free-gift step: `hasDiscountRules: false`, `pricing.enabled: false`, `pricing.rules.length: 0`, `hasAddOnOrGiftStep: false`, and `personalizationData: null`. Evidence: `/private/tmp/fpb-classic-agentic-parity/current-classic-proxy-capabilities-5021.json`, `/private/tmp/fpb-classic-agentic-parity/C05-discounts-progress/`, and `/private/tmp/fpb-classic-agentic-parity/C06-addons-free-gift/`. CS1 cannot be completed until a Classic fixture combines multi-step products, variants, active discount progress, and add-on/free-gift qualification in WPB and EB. No source change is justified yet. |

Acceptance:
- Step navigation, variant state, discount progress, and add-on eligibility stay synchronized across desktop and mobile.
- Cart proof records final selected products, add-ons, savings, and metadata.

### CS2 Mobile Long Titles Multi-Image Cards

| Field | Value |
|---|---|
| Status | mobile-long-title-partial-fixture-gap |
| Scenario | Long product titles and multi-image cards on mobile Classic |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/CS2-mobile-long-titles-multi-image-cards/` |
| Current delta | EB bundle `1` mobile proof at `390 x 844` captures long Classic category pills and product cards with visible image carousel arrows (`❮❯`), variant option lists, and long mobile category title wrapping. Evidence: `eb-bundle1-mobile-card-runtime-20260703.json`, `eb-bundle1-mobile-cards-20260703.png`, and `eb-bundle1-mobile-cards-a11y-20260703.txt`. WPB mobile proof on `5.0.21` captures `Black Crew Neck T-Shirt - Kite App`, Classic category pill sizing, product-card image nodes, and variant controls. Evidence: `wpb-mobile-card-runtime-20260703.json`, `wpb-mobile-cards-20260703.png`, and `wpb-mobile-cards-a11y-20260703.txt`. This is still partial: the current WPB fixture does not expose the same EB-style multi-image carousel interaction state, and desktop proof was not completed because the DevTools target stayed in mobile emulation. No source change is justified yet. |

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
| Current delta | EB bundle `1` contains a category named `Empty Category With An Exceptionally Long Name For Classic Pills`, but live mobile proof shows it is not a reliable empty-state fixture: after the category click probe, product text count remained `122` and visible product cards were still present. Evidence: `eb-bundle1-empty-label-click-probe-20260703.json`, `eb-bundle1-empty-label-after-click-mobile-20260703.png`, and `eb-bundle1-empty-label-after-click-a11y-20260703.txt`. WPB proof on `5.0.21` still has no `Empty Category` text and no empty/no-product category in the current storefront fixture. Evidence: `wpb-mobile-empty-category-runtime-20260703.json`, `wpb-mobile-current-category-20260703.png`, and `wpb-mobile-current-category-a11y-20260703.txt`. CS3 cannot validate empty/no-product category first-load or reload behavior until EB and WPB expose a true empty category. No source change is justified yet. |

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
| Status | pending |
| Scenario | Standard, Compact, and Horizontal smoke after Classic changes |
| Evidence path | `/private/tmp/fpb-classic-agentic-parity/CS6-non-classic-smoke/` |
| Current delta | `delta.md` captured a current fixture blocker. The WPB Admin dashboard currently exposes only one full-page bundle, `Daily Essentials`, page `1 of 1`, and the user has intentionally saved that bundle as Classic for this storefront loop. Older Standard, Compact, and Horizontal proof exists under `/private/tmp/fpb-standard-agentic-parity/regression-smoke/`, but those proofs used the same `/pages/preview-daily-essentials-2` page while the single bundle was temporarily switched between presets and are on older widget versions (`5.0.3`/`5.0.8`). That page now serves the Classic fixture, so CS6 cannot verify the `5.0.21` shared bootstrap change unless a second non-Classic full-page fixture exists or the user explicitly approves temporarily switching the current bundle away from Classic and restoring it. No source change is justified from CS6 yet. |

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
