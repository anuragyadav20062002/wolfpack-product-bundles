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

## Cross-Row Evidence Notes

### Standard Sidebar Back Arrow

Evidence path: `/private/tmp/fpb-standard-agentic-parity/back-arrow-analysis/`

- EB renders the summary-sidebar back arrow when the current storefront navigation page has a previous navigation item. In the captured two-step bundle, `addProductsPage1` shows only `Next`; `addProductsPage2` shows the back arrow next to `Add To Cart`.
- EB category switches stay on the same navigation page and do not make the back arrow visible.
- EB `Free Gift & Add Ons` admin evidence confirms the `Add-Ons and Gifting Step` is a separate storefront navigation step. The implementation reference already documents that this gifting-step toggle alone creates the storefront `Add On` navigation step, so the same non-first-navigation-page back-arrow rule applies there.
- WPB evidence before the fix showed no `.side-panel-btn-back` on the second Standard step because the sidebar action row only rendered the next/add-to-cart button.
- Current P08 evidence confirms the same rule for the add-on/gifting step: EB and WPB show Back on `addProductsPage2` and on `personalizationPage` / `Add On`, and neither app shows Back for category switches inside `addProductsPage1`.

### Standard Step Timeline Entries

Evidence path: `/private/tmp/fpb-standard-agentic-parity/step-timeline-all-configs/`

- EB desktop and mobile evidence for the current multi-step + add-on Standard bundle shows three timeline entries: `Choose Full-Size Products`, `Choose Full-Size Products_copy`, and `Add On`.
- EB does not promote multi-category tabs into separate timeline nodes; category switching stays inside the active product step.
- WPB pre-fix desktop/mobile evidence rendered extra `Multiple Categories` nodes, which changed desktop spacing and forced mobile pagination at five entries.
- Source fix in widget version `3.0.81` suppresses synthetic multi-category timeline entries for the Standard preset only; non-Standard timeline eligibility remains unchanged.
- EB desktop/mobile icon evidence shows 40px circular step containers, active icon image 24px, inactive icon image 28px, hidden container overflow, and unrounded icon images.
- Source fix in widget version `3.0.91` resets the Standard timeline icon image radius/object-fit and aligns the circle overflow. Evidence path: `/private/tmp/fpb-standard-agentic-parity/step-timeline/`.
- EB completed-step evidence shows completed past steps as a black filled circle with a centered white tick; the active step remains white with a black border and its image. Locked future steps do not show the tick. Evidence path: `/private/tmp/fpb-standard-agentic-parity/step-timeline-completed-tick/`.
- Source fix in widget version `4.0.0` draws the completed tick with Standard-scoped CSS, removes inline checkmark SVG injection from the shared timeline path, and prevents future steps with satisfied empty conditions from being marked completed. WPB proof files: `wpb-desktop-after-initial-timeline-state.json`, `wpb-final-desktop-completed-timeline-state.json`, `wpb-final-mobile-completed-timeline-state.json`.

### Standard Category Tab Text Weight

Evidence path: `/private/tmp/fpb-standard-agentic-parity/category-tab-font-weight/`

- EB Standard category tab title nodes render at `font-weight: 700`; surrounding tab containers remain `400`.
- WPB pre-fix evidence on widget `3.0.103` showed Standard `.category-tab .tab-label` at `400`. Source fix built into widget version `3.0.104` sets only the Standard tab label node to `700`.
- Current WPB dev-preview storefront still served Shopify CDN widget `3.0.103` after cache clear, so live browser proof remains pending asset refresh/deploy.

### Current WPB Standard Hard-Reload Check

Evidence path: `/private/tmp/fpb-standard-agentic-parity/final-wrap-current-wpb/`

- Chrome DevTools MCP hard-reload proof on the current dev-tunnel preview confirms WPB Standard widget `4.0.5`, preset `STANDARD`, and the active two-entry add-on fixture (`Choose Full-Size Products`, `Add On`).
- Desktop first-load proof `wpb-desktop-runtime-and-metrics.json` confirms product images keep `fpb-standard-product-image-fade 1.5s` and visible product cards are uniform in the current wide-desktop viewport.
- Desktop post-selection proof `wpb-desktop-after-one-selection.json` confirms the selected product card uses `outline: rgb(0, 0, 0) solid 2px`, `border: 0`, and unchanged card dimensions, so the selected black state does not resize the card.
- The same post-selection proof confirms the Standard sidebar displays the add-on summary block and moves to `1 item(s)` with the selected product row, total, and Next action.
- Follow-up hard-reload evidence `wpb-current-hard-reload-desktop-metrics-2.json`, `wpb-current-selected-desktop-metrics-2.json`, `wpb-current-four-selected-next-blocked.json`, `wpb-current-statement-category-next-blocked.json`, and `wpb-current-narrow-container-probe.json` reconfirms widget `4.0.5`, product image fade animation, visible full product titles, selected-card outline behavior, and the add-on qualification summary on the base step. The active fixture still blocks Add On navigation with `Complete all steps to unlock Add On!` after four selected base products, including after switching to the long-label Statement category, so add-on-step sidebar removal is not proven by this current fixture.
- 2026-07-02 hard-reload evidence after widget `5.0.1`: `/private/tmp/fpb-standard-agentic-parity/final-e2e-current-2026-07-02/wpb-after-page-marker-fix-runtime.json` confirms the WPB preview still renders `Bundle unavailable`, has zero product cards, and the generated Shopify page marker is still an old bootstrap payload (`configLength: 154`) because the page body has not been refreshed through the Admin save/sync path. The same file shows the app-proxy bundle fallback returning `500` with theme HTML. Admin configure retry evidence `wpb-admin-configure-loaded.snapshot.txt` first showed the embedded configure route failing with `Invalid prisma.session.findUnique() invocation: Server has closed the connection`; after the session-storage retry source fix, Chrome evidence showed the next failure as `Can't reach database server at dpg-d8f5g20g4nts738i88c0-a.ohio-postgres.render.com:5432`, so current UI save/sync proof could not be completed in this pass.
- 2026-07-02 follow-up Chrome DevTools MCP retry: `wpb-admin-retry-20260702-current.snapshot.txt` shows the Shopify Admin shell embedding the WPB app iframe, but the iframe root remains `Error — Wolfpack Bundles` with `Unexpected Error`. Network proof `wpb-admin-app-iframe-500-current.response.txt` shows the app iframe request to the dev tunnel returning `500`; the response body was no longer available from DevTools. Storefront proof after Cache Storage clear and hard reload, `wpb-storefront-current-runtime.json`, still shows widget `5.0.1`, `Bundle unavailable`, zero product cards, and the same bootstrap-only `data-bundle-config` payload length `154`. This confirms the source fixes are built but the current live page still cannot refresh or render the full config through the UI path.
- Post-commit retry after `630c7b5c`: Admin snapshot `wpb-admin-retry-after-630c7b5c.snapshot.txt` and network proof `wpb-admin-app-iframe-500-after-630c7b5c.response.txt` again show the WPB app iframe returning `500`. Storefront proof `wpb-storefront-runtime-after-630c7b5c.json`, after Cache Storage clear and cache-bypassed reload, still shows widget `5.0.1`, `Bundle unavailable`, zero product cards, and the stale bootstrap payload. No row can be advanced from this live state.
- Post-Prisma-fix retry on 2026-07-02: Admin hard reload evidence `wpb-admin-prisma-solved-dom-summary.json` shows the Shopify Admin URL still points at the configure route and embeds the current dev-tunnel iframe, but the accessible outer shell remains the Shopify dev preview/extensions surface and no configure content (`Step Setup`, `Bundle Settings`, or `Daily Essentials`) appeared within the 15s Chrome DevTools MCP wait window. Storefront proof after Cache Storage clear and cache-bypassed reload, `wpb-storefront-prisma-solved-runtime.json`, still shows widget `5.0.1`, `Bundle unavailable`, zero product cards, and a bootstrap-only `data-bundle-config` payload length `154` with no `steps` array. This removes the stale-Prisma text from the observed failure but still leaves final parity proof unavailable.
- SIT DB reset follow-up on 2026-07-02: Chrome DevTools MCP dashboard proof `wpb-admin-dashboard-after-db-change.snapshot.txt` and screenshot `wpb-admin-dashboard-empty-after-db-change.png` show the WPB dashboard is reachable again but has no bundles in the current SIT DB (`You haven't created any bundles for your store`). The old configure URL for `cmqwx0k3u0000v08brgbhh6aa` now renders the app's `404 Page Not Found`, so there is no existing bundle row to re-save through the UI. The stale Shopify page at `/pages/preview-daily-essentials` still points at that removed bundle id and therefore keeps rendering `Bundle unavailable`.
- Replacement SIT fixture follow-up on 2026-07-02: Chrome DevTools MCP Admin proof in `/private/tmp/fpb-standard-agentic-parity/final-e2e-current-2026-07-02/` shows a new FPB Standard bundle `Daily Essentials` saved through the Admin UI with bundle id `cmr361mz50000v00yrdeyxpf7`, one step, one category, and four products. `wpb-new-fpb-products-persist-after-admin-reload.snapshot.txt` confirms the saved Admin state persists after hard reload with parent product status `Active` and `4 Selected`. The new storefront page `/pages/preview-daily-essentials-2` renders again after Cache Storage clear and hard reload; `wpb-new-preview-desktop-runtime.json` and `wpb-new-preview-mobile-runtime.json` confirm widget `5.0.1`, `bundleUnavailable: false`, bundle id `cmr361mz50000v00yrdeyxpf7`, one configured step, full `data-bundle-config` length `6550`, and all four products visible on mobile. `wpb-preview-current-recheck-runtime.json` later confirms widget `5.0.2` on the same preview after this mobile summary footer slice.
- This proof does not close any pending pairwise or stress row by itself because the browser was at a wide desktop viewport, the store cart already contained older lines, and the active fixture is not the OOS, cloned-step, weight-rule, empty-category, or long-content row-specific fixture.

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
| Status | verified |
| EB config | Single step with two categories; each category requires exactly one item; no desktop/mobile banner rendered in captured storefront state |
| WPB config | Mirrored Standard bundle; Product Slots restored off in the current saved fixture after enabled/disabled proof; source fix normalizes Standard product cards and sidebar/mobile footer height |
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
- Source fix is built into widget version `3.0.85`: Standard desktop uses the tall product-list branch when Product Slots are disabled (`current-3.0.85/wpb-desktop-slots-disabled-postfix.json`, `476.2890625px`) and the compact inline-slot branch when enabled (`current-3.0.85/wpb-desktop-slots-enabled-confirmed-postfix.json`, `296.2890625px`).
- Live WPB mobile proof on `3.0.85` after cache-bypassed reload: Product Slots enabled stays `101px` collapsed and expands to `243px` with inline-slot content (`wpb-mobile-slots-enabled-confirmed-postfix-collapsed.json`, `wpb-mobile-slots-enabled-confirmed-postfix-expanded.json`); Product Slots disabled stays `101px` collapsed and expands to the text-row branch (`wpb-mobile-slots-disabled-final-collapsed.json`, `wpb-mobile-slots-disabled-final-expanded.json`, one selected row measures `228px`; EB's `308px` reference uses two selected rows).

### P04 Collection Category With Amount Rule

| Field | Value |
|---|---|
| Status | verified |
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
- Current WPB desktop proof on widget `3.0.85`: `current-3.0.85/wpb-live-p04-persisted-config-after-save.json` confirms one product step, Statement category `Products 3`, `Collections 1`, and `Amount >= 100`; `current-3.0.85/wpb-current-p04-category-snapshot.txt` and `current-3.0.85/wpb-desktop-p04-visible-order-availability-explained.png` show the Statement category active with manual products first.
- Current collection order note: `current-3.0.85/wpb-live-p04-collection-availability.json` confirms the endpoint returns 27 products and that `automated-collection` starts with unavailable snowboard products before the first available product, `Keto Fresh Meal Subscription - Large Single`; the visible grid starts at the first available collection product after the manual Statement products, so no source ordering patch is required for this pass.
- Current amount-rule/cart proof: `current-3.0.85/wpb-desktop-p04-after-statement-add-state.json` shows the `$619.00` Statement product selected and the sidebar moving to `Next`; `current-3.0.85/wpb-desktop-p04-after-next-state.json` shows the final Add To Cart state; Chrome DevTools network captured `/cart/add.js`, `/cart.js?app=wolfpackProductBundles`, and `/apps/product-bundles/api/cart-bundle-details` returning `200`; `current-3.0.85/wpb-desktop-p04-cart-after-add.json` shows one parent bundle line at `$619.00`, `_bundle_component_count: 1`, and no discount allocation. The current fixture still renders an Add On step, so this proof clicks the final footer Add To Cart without selecting the add-on.
- Current mobile proof: `current-3.0.85/wpb-mobile-p04-clean-after-statement-add-state.json` and `current-3.0.85/wpb-mobile-p04-clean-after-statement-add.png` show the Statement category active at `390x844`, manual products followed by the first available collection product, and the selected `$619.00` product; `current-3.0.85/wpb-mobile-p04-clean-after-next-state.json` shows the final mobile Add To Cart state; clean network proof after `cart/clear.js` captured `/cart/add.js`, `/cart.js?app=wolfpackProductBundles`, and `/apps/product-bundles/api/cart-bundle-details` returning `200`; `current-3.0.85/wpb-mobile-p04-clean-cart-after-add.json` shows one parent bundle line at `$619.00`, `_bundle_component_count: 1`, and no discount allocation.
- Pending: refreshed collection catalog/order comparison against the EB store's current collection contents and final `delta.md`.

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

Notes:
- EB Settings > Additional Configurations inventory help confirms product-level inventory tracking is global, zero-stock tracked products are hidden, and untracked out-of-stock products may remain visible but must be blocked at cart add. Evidence: `/private/tmp/fpb-standard-agentic-parity/P06-oos-visible/eb-additional-configurations.snapshot.txt` and `/private/tmp/fpb-standard-agentic-parity/P06-oos-visible/eb-inventory-help.snapshot.txt`.
- Source guard added in widget version `3.0.77`: the shared inline variant selector now carries the selected variant `available` flag onto the product model, and the FPB Standard card migration path uses `isVariantOutOfStock(product)` instead of checking `quantityAvailable === 0`. This prevents unavailable fallback variants from preserving stale available state. Live EB/WPB fixture capture is still pending.
- 2026-07-01 current-fixture drift proof: Chrome DevTools MCP recapture of the current EB and WPB storefront URLs shows both are still on the multi-step add-on fixture, not an OOS-visible row. EB evidence `eb-current-desktop-addProductsPage1-runtime.json` shows six visible first-category addable cards and no OOS/disabled card state. WPB evidence `wpb-current-desktop-addProductsPage1-runtime.json` shows widget `4.0.3`, the same add-on/multi-category fixture, and no OOS/disabled card state. Delta note: `/private/tmp/fpb-standard-agentic-parity/P06-oos-visible/current-fixture-drift-delta.md`. P06 remains pending until EB/WPB are configured into a row-specific OOS-visible fixture through the Admin UI.

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
| Status | verified |
| EB config | Add-Ons and Gifting Step enabled; Add-Ons with Bundles disabled |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Multi-step with add-on/gifting step, one category, manual products, no variants, all in stock, no rule, no discount, gifting step only, no defaults, no slots, edited bundle summary title/subtitle, no banner, personalization or message controls, next/back, mobile final-step cart state |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P08-gifting-step-only/` |

Acceptance:
- Gifting/add-on navigation step appears when the gifting-step toggle alone is enabled.
- No add-on discount tier behavior appears when Add-Ons with Bundles is disabled.
- Back/final-step behavior matches EB desktop and mobile.

Notes:
- EB desktop proof: `eb-desktop-initial-runtime.json`, `eb-desktop-page2-runtime.json`, `eb-desktop-final-addon-runtime.json`, and `eb-addon-final-live-desktop-controls.json` show the empty `Add On` navigation step and icon Back on non-first navigation pages.
- WPB desktop proof before source fix: `wpb-runtime-config-after-gifting-save.json` and `wpb-bundle-json-response.network-response` show `isPersonalizationEnabled: true`, `addonProducts.isEnabled: false`, and no tiers, while widget `3.0.72` still rendered `Congrats! You're eligible for a FREE Add On!`.
- Source fix built into widget version `3.0.73`: gifting-only steps keep the `Add On` navigation step but suppress add-on/free-gift eligibility messaging until Add-Ons with Bundles is enabled. Dev-tunnel proof is captured in `wpb-dev-tunnel-post-reload-state.json`, `wpb-dev-tunnel-desktop-flow-states.json`, `wpb-dev-tunnel-mobile-flow-states.json`, and `wpb-dev-tunnel-mobile-final.png`.

### P09 Paid Add-On Tier

| Field | Value |
|---|---|
| Status | verified |
| EB config | Add-Ons with Bundles enabled; paid discount tier below free threshold |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Multi-step with add-on/gifting step, multiple categories, manual products, multiple option variants, all in stock, step min, percentage tier, add-ons with paid tier, no defaults, quantity slots, default text, desktop banner, variant selector enabled, cart properties, discount transform proof |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P09-paid-addon-tier/` |

Acceptance:
- Add-on qualification copy and paid discount tier match EB.
- Selected add-on cart line properties and discount proof are captured.
- Highest eligible base discount and add-on discount do not double-apply.
- EB desktop add-on-step proof shows the paid add-on card with original price struck through, discounted price, `10% off` badge, title/price divider, and `Add To Cart` card CTA. Evidence: `eb-storefront-desktop-addons-step.png` and `eb-storefront-desktop-addons-step-computed.json`.
- Source fix is built into widget version `3.0.75`: paid-step totals no longer discount products merely because they are add-on candidates; selected paid add-ons discount only on the add-on step; Standard paid add-on cards derive display compare/current prices from the active tier; mobile text-mode cards use EB-aligned title and price typography with a title/price divider; paid add-on cards use the configured add-to-cart CTA label.
- WPB dev-tunnel mobile proof after cache clear: `wpb-storefront-final-version.json` confirms version `3.0.75`, `STANDARD`, `390` width, and text CTA mode; `wpb-storefront-final-addon-step-state.json` confirms paid-step footer `Next • $829.00` and add-on card `10% off`, `$829.00`, `$746.10`, `Add To Cart`; `wpb-storefront-mobile-addon-step-final-computed.json` confirms Assistant font, `14px` original price, `16px` discounted price, `700` price weights, line-through original price, and divider border.
- WPB dev-tunnel cart/network proof after UI interaction: `wpb-cart-proof-ui-sequence.json` shows paid-step footer `Next • $829.00`, add-on-step card `10% off`, `$829.00`, `$746.10`, `Add To Cart`, selected add-on quantity `1`, footer `Add To Cart • $1575.10`, and Shopify cart after add with one bundle parent line. That line contains `_bundle_component_count: 2`, `_bundle_components` with component 1 `82900 -> 82900` and component 2 `82900 -> 74610` at `10.0` discount / `8290` savings, `_bundle_total_retail_cents: 165800`, `_bundle_total_price_cents: 157510`, `_bundle_total_savings_cents: 8290`, `_bundle_discount_percent: 5.00`, and `_addon_offer_id`. Preserved Chrome DevTools network proof is summarized in `wpb-cart-proof-network-summary.md` with `/cart/add.js`, `/cart.js?app=wolfpackProductBundles`, and `/apps/product-bundles/api/cart-bundle-details` all returning `200`.
- EB one-paid-product cart/network proof after UI interaction: `eb-cart-proof-one-paid-ui-sequence.json` and `eb-cart-proof-one-paid-cart-after-wait.json` show paid-step footer `₹829.00`, add-on card `₹829.00`, `₹746.10`, `Add To Cart`, `10% off`, footer `₹1575.10`, and Shopify cart after bundle preparation with two cart lines. The selected add-on line has properties `Box`, `_addon_product: true`, `_addonTierId: tier68403`, and `_addon_offer_id`, line price/final price `74610`, original line price `82900`, discount title `Add On`, and line-level discount allocation `10.0` percentage / `8290` amount. The parent bundle line has `_EasyBundleId: FBP-1`, `_originalOfferId`, `_addon_offer_id`, `Items: 1 x 14k Dangling Obsidian Earrings`, and line price `82900`. Preserved Chrome DevTools network proof is summarized in `eb-cart-proof-network-summary.md` with `/cart/update.js`, `/apps/gbb/updateFullPageBundleView`, `/api/2025-04/graphql.json`, `/cart/add.js`, and `/cart.js` calls returning `200`.
- Current EB cart-line UI proof: `/private/tmp/fpb-standard-agentic-parity/cart-lines-ui/eb-cart-page-current-mobile.png`, `eb-cart-page-current-dom-probe.json`, and `eb-cart-ui-probe.json` show the paid add-on cart page using Dawn/native discounted-line treatment: the add-on line renders regular price `Rs. 829.00`, sale price `Rs. 746.10`, and the `Add On` discount row; the parent bundle line renders `Box` and `Items` only. The tested paid-add-on and current base-bundle cart pages did not render a separate bottom `Total Savings` row after `Estimated total`; savings are represented by Shopify's line discount data in `/cart.js` (`total_discount: 8290`) and native line pricing. Source fix built into widget version `3.0.86`: FPB parent bundle display metadata now excludes selected paid add-ons, so add-on-only savings do not leak into parent `Retail Price` / `You Save` cart-line properties. WPB dev-tunnel proof after cache clear: `cart-lines-ui/wpb-postfix-version-and-state.json` shows live widget version `3.0.86` and `STANDARD`; `cart-lines-ui/wpb-postfix-cart-after-add.json` shows the selected paid add-on remains separate with `_bundle_step_type: addon:PERCENTAGE:10`, while the parent bundle line has `Box` and hidden bundle metadata only, with no public `Retail Price` / `You Save`.
- Cart Transform source update: `extensions/bundle-cart-transform-rs/src/merge.rs` now keeps paid add-on lines out of the parent merge, emits a separate `lineUpdate` fixed unit price for the paid add-on discount, and restores parent public cart-line messaging from `_bundle_display_properties`. Rust proof: `cargo test` in `extensions/bundle-cart-transform-rs` passes with `test_merge_keeps_paid_addon_line_separate`.
- WPB fresh Chrome proof after cart clear/cache clear: `wpb-cart-transform-fresh-ui-sequence.json` shows two cart lines after add. The paid add-on line carries `_addon_product: true`, `_addonTierId: tier1`, `_addon_offer_id`, and `_bundle_step_type: addon:PERCENTAGE:10` at `74610`; the parent bundle line remains separate at `82900` with `_bundle_component_count: 1` and `_addon_offer_id`.
- Checkout UI proof: EB checkout uses native Shopify output, not a custom app savings panel. `/private/tmp/fpb-standard-agentic-parity/checkout-ui/eb-checkout-reference-current.snapshot.txt` shows the add-on line with `Box: 1`, native `ADD ON (-₹82.90)` discount row, native original/discounted price labels, and the parent line with `Box: 1` plus `Items: 1 x 14k Dangling Obsidian Earrings`. `/private/tmp/fpb-standard-agentic-parity/checkout-ui/wpb-checkout-box-fix-expanded.snapshot.txt` shows WPB no longer leaks child-line `Items` / `Retail Price` / `You Save`; `bundle-checkout-ui` is now inert so native checkout rows remain the only FPB display surface. Fresh dev-preview proof after the direct-null entry point is in `/private/tmp/fpb-standard-agentic-parity/checkout-ui/wpb-live-bundle-checkout-ui-after-entrypoint.response.network-response` and `wpb-current-checkout-after-entrypoint.snapshot.txt`; both are free of `Bundle Savings`, `Actual Price`, `Bundle Price`, `Retail Price`, and `You Save` custom-extension labels.
- Checkout UI follow-up proof: `/private/tmp/fpb-standard-agentic-parity/checkout-ui/wpb-current-checkout-extension-script-audit.json` confirms the live SIT checkout still loads `bundle-checkout-ui` but the fetched dev CDN script contains none of the removed custom panel labels. `/private/tmp/fpb-standard-agentic-parity/checkout-ui/wpb-current-checkout-expanded.snapshot.txt` shows the expanded WPB mobile order summary has only native checkout output: separate paid add-on line at `$746.10`, parent bundle line at `$829.00`, `Box: 1`, and parent `Items`; no app-rendered cart-line savings panel is present.
- Checkout UI total-savings correction: EB paid-add-on checkout proof also shows `TOTAL SAVINGS` / `₹82.90` after the native checkout total. WPB source now registers `purchase.checkout.reductions.render-after` and renders only `TOTAL SAVINGS` from native checkout discount allocations or Cart Transform `_bundle_total_savings_cents` attributes; cart-line targets remain inert. Source proof: `npx jest tests/unit/extensions/checkout-ui-eb-native-parity.test.ts --runInBand`, Shopify component validation for `purchase.checkout.reductions.render-after`, `npx tsc --noEmit --skipLibCheck --project extensions/bundle-checkout-ui/tsconfig.json`, and ESLint on changed checkout files pass. Dev-preview proof: `/private/tmp/fpb-standard-agentic-parity/cart-lines-ui-current/wpb-checkout-extension-script-direct-fetch.json` confirms the loaded `bundle-checkout-ui` dev script contains `TOTAL SAVINGS` and `purchase.checkout.reductions.render-after`; current live checkout did not render the row because the refreshed cart state has no savings.
- Discount Function source slice: `extensions/bundle-discount-function` now defines a `cart.lines.discounts.generate.run` product discount function for selected add-on line markers such as `_bundle_step_type=addon:PERCENTAGE:10`. It emits `Add On` product discount candidates for partial and `100%` add-on tiers and ignores non-add-on or malformed markers. Verification: `cargo test` in `extensions/bundle-discount-function`, pinned stable `cargo build --target=wasm32-unknown-unknown --release`, `npm test` fixture validation in `extensions/bundle-discount-function`, and Shopify schema validation for `src/cart_lines_discounts_generate_run.graphql` all pass.
- Discount Function activation slice: `app/services/addon-discount-function-service.server.ts` resolves the deployed `bundle-discount-function`, finds an existing automatic app discount through the current `discountNodes` Admin query, and creates an EB-shaped automatic app discount titled `Add On` when missing. The app configs now request `read_discounts` plus existing `write_discounts`; Shopify Admin schema validation passed for both the `discountNodes` find query and `discountAutomaticAppCreate` mutation. Cart Transform source now keeps selected paid add-ons separate without applying a `lineUpdate` fixed price, so the Discount Function owns the native `Add On` discount allocation and avoids double-discounting. Verification: `npx jest tests/unit/services/addon-discount-function-service.test.ts tests/unit/services/cart-transform-service.test.ts --runInBand`, `cargo test` and pinned wasm build in `extensions/bundle-cart-transform-rs`, and ESLint on the touched service/app files pass.
- 2026-07-01 cart-line focused audit: `/private/tmp/fpb-standard-agentic-parity/cart-lines-current/wpb-mobile-addon-step-before-add.png`, `wpb-mobile-addon-step-selected.png`, `wpb-cart-after-ui-add.json`, `wpb-mobile-cart-page-after-ui-add.png`, and `wpb-mobile-cart-page-dom-probe.json` show the WPB storefront reaches the paid add-on UI path through Chrome DevTools MCP, but the selected add-on line still lands in Shopify cart at full price `$829.00`, `total_discount: 0`, and no native `Add On` discount row. Source follow-up adds FPB save-time activation of `bundle-discount-function` whenever `personalizationData.addonProducts.isEnabled=true`, so stores already authenticated before the Discount Function existed can heal on the next merchant save instead of waiting for a fresh auth cycle. Behavior proof: `npx jest tests/unit/routes/fpb-save-bundle.test.ts --runInBand --testNamePattern="add-on discount function"` and `npx jest tests/unit/services/addon-discount-function-service.test.ts --runInBand`.
- 2026-07-01 post-save live proof: `/private/tmp/fpb-standard-agentic-parity/cart-lines-post-save/admin-save-click-result.json` confirms the FPB Admin save path was invoked through the embedded app UI after the save-time activation slice. `/private/tmp/fpb-standard-agentic-parity/cart-lines-post-save/wpb-addon-step-after-correct-selection.json` and `wpb-mobile-addon-step-post-save.png` show the paid add-on step still renders the EB-aligned `10% off`, `$829.00`, `$746.10`, and `Add To Cart` card state on mobile widget `4.0.1`. `/private/tmp/fpb-standard-agentic-parity/cart-lines-post-save/wpb-checkout-expanded-and-cart.json` proves the selected paid add-on now lands as a separate native-discounted Shopify cart line with `original_price: 82900`, `final_price: 74610`, `discounts[0].title: "Add On"`, `discounts[0].amount: 8290`, cart `total_price: 305210`, and cart `total_discount: 8290`; the expanded checkout shows native `ADD ON (-$82.90)` and the checkout UI extension `TOTAL SAVINGS $82.90`. `/private/tmp/fpb-standard-agentic-parity/cart-lines-post-save/wpb-mobile-cart-page-post-save.png` and `wpb-cart-page-post-save-dom-probe.json` prove the cart page now uses the same Dawn/native discounted-line treatment as EB: add-on line `Add On`, sale price `$746.10`, regular price `$829.00`, parent line `Daily Essentials` at `$2,306.00`, and no bottom cart-page `Total Savings` row after `Estimated total`.
- Current add-on product-card badge proof is captured in `/private/tmp/fpb-standard-agentic-parity/addon-card-discount-badges/current/`. EB desktop/mobile partial-discount cards render the add-on discount as a right-edge blue ribbon with white `10% off` text; evidence: `eb-desktop-partial-addon-step.png`, `eb-desktop-partial-addon-computed.json`, `eb-mobile-partial-addon-step.png`, `eb-mobile-partial-addon-computed.json`, plus fresh refresh proof `eb-desktop-partial-addon-step-refresh-3.0.85-context.png`, `eb-desktop-partial-addon-computed-refresh.json`, `eb-mobile-partial-addon-step-refresh-3.0.85-context.png`, and `eb-mobile-partial-addon-computed-refresh.json`. WPB version `3.0.84` renders the same Standard ribbon treatment for partial tiers after the paid-step eligibility path; evidence: `live-wpb-desktop-eligible-partial-now.png`, `live-wpb-desktop-eligible-partial-computed-now.json`, `live-wpb-mobile-eligible-partial-now.png`, `live-wpb-mobile-eligible-partial-computed-now.json`, and restored-fixture proof `wpb-mobile-restored-10-proof.json`. The currently open WPB tab is the P04 collection fixture, not an add-on badge fixture; proof is `wpb-current-open-tab-addons-probe.json`.
- Source fix built into widget version `3.0.84`: Standard add-on discount badges inherit EB-aligned ribbon typography spacing, and 100% add-on tiers expose `100% off` display data instead of falling through to a generic free-gift badge. Temporary UI-switched WPB 100% proof is captured in `wpb-desktop-100-addon-step.png`, `wpb-desktop-100-addon-computed.json`, `wpb-mobile-100-addon-step.png`, and `wpb-mobile-100-addon-computed.json`; both viewports show the blue right-edge `100% off` badge, original price struck through, discounted price `$0.00`, and no generic `.fpb-free-badge`. The Admin tier was restored to `10%` after this proof. Fresh EB storefront bundle `2` did not render during this pass, so current live EB 100% card proof still belongs to P10/S02 follow-up.
- Source fix built into widget version `3.0.105`: Standard add-on discount badges now render as a direct product-card child instead of inside the image/media slot, so the ribbon starts at the product-card edge like EB. Evidence path: `/private/tmp/fpb-standard-agentic-parity/addon-card-badge-card-edge/`; EB measured `badgeRightMinusCardRight: 0`, WPB before measured `-8`, and WPB after hard reload measured `0` on live widget `3.0.105`.
- Source fix built into widget version `3.0.106`: Standard product image hover magnifier moves to the left only when the product card has a direct add-on savings badge, avoiding overlap with the right-edge ribbon. Evidence path: `/private/tmp/fpb-standard-agentic-parity/magnifier-badge-overlap/`; WPB before measured `overlap: true`, and WPB after hard reload measured `overlap: false` on live dev-tunnel widget `3.0.106`.
- Source fix built into widget version `3.0.108`: Standard desktop summary sidebar add-on messaging now keeps the EB-style add-on section only before the shopper is on the add-on step, uses a black border plus entry animation for the eligible message container, and disables summary remove buttons for products from non-current steps while showing the EB copy `Remove This Product From <Step Name>`. The same slice restores the EB selected product-card black outline without changing card dimensions, tightens the Admin category name row so the help text sits below the input/button row, and keeps mobile summary footer count/expanded states rendering after the shared removal handler. Evidence path: `/private/tmp/fpb-standard-agentic-parity/addon-summary-sidebar-current/`; key files include `eb-desktop-addon-summary-eligible-before-next.json`, `eb-desktop-addon-step-summary-hidden.json`, `wpb-desktop-postfix-selected.json`, `wpb-desktop-postfix-addon-step.json`, `wpb-desktop-postfix-disabled-remove-toast.json`, `wpb-mobile-footer-collapsed-postfix.json`, `wpb-mobile-footer-expanded-postfix.json`, and `wpb-admin-category-row-postfix.png`. Verification: `npx jest tests/unit/assets/fpb-summary-current-step-removal.test.ts tests/unit/assets/fpb-addons-gifting-step-separation.test.ts tests/unit/assets/fpb-sidebar-discount-progress.test.ts --runInBand`, widget build/minify, node syntax checks, ESLint, Chrome DevTools MCP desktop/mobile/Admin proof.
- Mobile summary footer empty-state follow-up built into widget version `5.0.2`: the compact Standard mobile summary tray can now expand before any product is selected, matching EB's empty-state drawer behavior, and the `fpb-mobile-summary-count-badge` stays above the expanded drawer content. Evidence path: `/private/tmp/fpb-standard-agentic-parity/mobile-summary-footer-empty-expanded/`; `wpb-after-empty-expanded-state.json` confirms widget `5.0.2`, `expanded: true`, `ariaExpanded: "true"`, badge text `0`, summary content present, `badgeZIndex: "1"`, and `elementFromPoint` at the badge center returning `.fpb-mobile-summary-count-badge`. Screenshot: `wpb-after-empty-expanded.png`. Behavior test: `npx jest tests/unit/assets/fpb-standard-mobile-summary-action.test.ts --runInBand`.
- Source follow-up built into widget version `4.0.0`: Standard desktop add-on-summary sidebars expand to the EB measured add-on-summary height, keep the normal fixed height after entering the add-on step, and render the eligible add-on check icon as a smaller centered tick inside the circle. Final Chrome DevTools MCP proof is captured in `/private/tmp/fpb-standard-agentic-parity/final-wrap/`: `eb-desktop-addon-descendants.json`, `wpb-desktop-after-addons-summary.json`, `wpb-desktop-after-category-and-addon-step.json`, `wpb-mobile-after-accordion-addon-step.json`, and paired screenshots.
- Source follow-up built into widget version `4.0.1`: Standard selected product cards keep the EB-style black outline but offset it inward so WPB's scrollable product grid no longer clips the first-row/left-edge selected marker. Evidence path: `/private/tmp/fpb-standard-agentic-parity/selected-card-border-clipping/`; key files are `eb-desktop-selected-card.json`, `wpb-desktop-before.json`, `wpb-desktop-after-4.0.1.json`, `wpb-mobile-after-4.0.1.json`, and paired screenshots.
- Current badge follow-up: `eb-current-selected-page-badge-probe.json`, `eb-current-selected-page-badge-probe.png`, `eb-current-selected-page-badge-probe-2026-06-30.json`, and `eb-current-selected-page-badge-probe-2026-06-30.png` refresh EB mobile partial-tier proof at `390 x 844`; the badge remains `10% off`, absolute right-edge, blue, Assistant `12px` / `700`, `21.6px` line-height, `2px 8px` padding, and no free badge. Focused Jest `npx jest tests/unit/assets/fpb-addons-gifting-step-separation.test.ts --runInBand` passes and covers partial paid add-on display pricing, `100% off` add-on display pricing, highest eligible tier selection, and selected add-on discount math. Current live WPB add-on recapture is pending restored P09/P10 Admin fixture access; the open WPB storefront is still the P04 collection fixture.

### P10 Free Add-On Tier Highest Eligible

| Field | Value |
|---|---|
| Status | verified |
| EB config | Multiple add-on tiers; highest eligible tier gives free add-on |
| WPB config | Mirrored Standard bundle |
| Matrix coverage | Multi-step with add-on/gifting step, multiple categories, collection-backed category, multiple option variants, all in stock, category exact, highest eligible tier, add-ons with free tier, no defaults, custom slot icon, multi-language labels, mobile banner, variant selector enabled, `bundle_details` cart metafield, desktop/mobile reload after selection |
| Evidence path | `/private/tmp/fpb-standard-agentic-parity/P10-free-addon-highest-tier/` |

Acceptance:
- Highest eligible tier wins when multiple add-on tiers qualify.
- Free add-on cart proof matches EB pricing and cart metadata behavior.
- Multi-language labels and custom slot icons render without layout spillover.

Notes:
- Current EB bundle `2` proof is captured in `/private/tmp/fpb-standard-agentic-parity/P10-free-addon-highest-tier/`. Direct storefront loads at `page=addProductsPage1` and EB's lowercase `page=addproductspage1` both render the theme header/footer with an empty bundle body. Runtime evidence in `eb-bundle2-empty-runtime.json` shows EB scripts loaded, `window.gbb` present, and `gbbAddonProducts.state.isEnabled=false`; console proof shows `Cannot read properties of null (reading 'personalizationData')`. The open EB Admin tab is a Shopify `Update data access` grant screen for customer/order/metaobject access; it was inspected but not approved autonomously.
- Existing durable EB reference evidence in `internal docs/EB Free Gift Add Ons Behavior Spec.md` still proves the `100%` tier contract: eligible message says `100% off`, the add-on step card can be selected, and the Shopify add-on cart line is discounted to free with `_addon_product`, `_addonTierId`, and `_addon_offer_id`.
- Current WPB behavior proof: `tests/unit/assets/fpb-addons-gifting-step-separation.test.ts` passes and covers highest eligible tier selection, active tier-specific messages, no line discount before eligibility, selected add-on discount math, and `100% off` add-on card display data. Temporary UI-switched WPB Standard storefront proof for a single 100% tier is captured in `/private/tmp/fpb-standard-agentic-parity/addon-card-discount-badges/current/`.
- Source fix built into widget version `3.0.87`: when a multi-tier add-on step loads, WPB now renders products from the active eligible tier only, updates the add-on step selection cap to that active product count, and removes stale add-on selections from inactive tiers. Behavior proof is `tests/unit/assets/fpb-addons-gifting-step-separation.test.ts` case `loads products and selection capacity from the active add-on tier only`; the focused add-on/cart suites pass with 25 tests. Dev-tunnel proof: `P10-free-addon-highest-tier/wpb-3.0.87-preview-runtime-probe.json` confirms live `window.__BUNDLE_WIDGET_VERSION__` is `3.0.87` and `STANDARD`, and `wpb-3.0.87-preview-mobile.png` captures the loaded mobile preview after cache clear.
- 2026-07-01 live WPB multi-tier proof is captured in `/private/tmp/fpb-standard-agentic-parity/P10-free-addon-highest-tier/current-wpb/`. Through Chrome DevTools MCP, the Admin fixture was changed from one `10%` quantity tier to two tiers: Tier 1 keeps quantity `1` / `10%`, and Tier 2 uses quantity `4` / `100%`, with `14k Dangling Obsidian Earrings` selected for both tiers; evidence: `admin-tier2-configured-before-save.snapshot.txt`, `admin-save-poll.json`. Mobile storefront proof on widget `4.0.1`: `wpb-after-three-paid-products.json` shows the below-free-tier state after three paid products, and `wpb-addon-step-four-paid-products.json` plus `wpb-mobile-addon-step-100-free.png` show the highest eligible tier winning after four paid products: the add-on card renders `100% off`, original `$829.00`, discounted `$0.00`, and footer total remains `$2,306.00`. Cart/checkout proof: `wpb-free-addon-cart-after-wait.json`, `wpb-checkout-free-addon-expanded.json`, `wpb-mobile-checkout-free-addon-expanded.png`, `wpb-mobile-cart-free-addon.png`, and `wpb-cart-free-addon-dom-probe.json` show the selected add-on line is separate with `_addonTierId: tier2`, `_bundle_step_type: addon:PERCENTAGE:100`, `original_price: 82900`, `final_price: 0`, `discounts[0].title: "Add On"`, cart `total_discount: 82900`, checkout total savings `$829.00`, cart-page sale price `$0.00`, regular price `$829.00`, and no parent-line savings leakage.
- 2026-07-01 desktop duplicate-product follow-up: `wpb-desktop-initial-4.0.1.json`, `wpb-desktop-addon-step-after-statement-4.0.1.json`, `wpb-desktop-addon-step-after-statement-4.0.1.png`, `wpb-desktop-free-addon-cart-after-wait-4.0.1.json`, `wpb-desktop-cart-free-addon-4.0.1.png`, `wpb-desktop-checkout-free-addon-expanded-4.0.1.png`, and `wpb-desktop-checkout-free-addon-expanded-4.0.1.json` capture a desktop `1280 x 900` pass where the same variant was selected as both a paid product and the `100%` add-on. Shopify cart output collapses that duplicate into one parent bundle line with `_bundle_total_savings_cents: 82900`, no native `Add On` line discount, and no checkout `TOTAL SAVINGS` row. This is consistent with the existing EB duplicate free-add-on cart state in `eb-current-cart-state.json`, which also keeps the duplicate item inside the parent bundle line with `total_discount: 0`.
- Remaining P10 gap: a desktop no-duplicate storefront/cart/checkout recapture for the saved multi-tier free-add-on fixture is still open. After the checkout-extension source build, the storefront temporarily loaded Shopify CDN dev theme asset `bundle-widget-full-page-bundled.js` at `404`, leaving the widget root hydrated but empty; proof is `wpb-desktop-nodup-load-probe.json`, `wpb-desktop-nodup-resource-probe.json`, `wpb-desktop-nodup-widget-script-audit.json`, `wpb-desktop-nodup-load-timeout.snapshot.txt`, `wpb-desktop-nodup-retry-runtime-probe.json`, and `wpb-desktop-nodup-after-local-rebuild-probe.json`. After widget `4.0.2` rebuild and cache bypass, `wpb-desktop-nodup-after-4.0.2-build-probe.json` shows the dev asset recovered at `200` with `window.__BUNDLE_WIDGET_VERSION__ = "4.0.2"` and two Standard roots. Fresh desktop proof then selected five paid products without duplicating the `100%` add-on product, reached the Add On step, selected `14k Dangling Obsidian Earrings` at `$0.00`, and added to cart; evidence: `wpb-desktop-nodup-four-paid-selected-4.0.2.json`, `wpb-desktop-nodup-addon-step-4.0.2.png`, `wpb-desktop-nodup-free-addon-selected-4.0.2.json`, `wpb-desktop-nodup-checkout-4.0.2.png`, and `wpb-desktop-nodup-checkout-cart-state-4.0.2.json`. The desktop no-duplicate cart still collapsed the free add-on into one parent bundle line with `_bundle_component_count: 6`, `_bundle_total_savings_cents: 82900`, `total_discount: 0`, and no separate native `Add On` discount line, so P10 remains partial despite the existing mobile separate-line proof.
- Source fix built into widget version `4.0.3`: add-on cart-line detection now treats an eligible add-on tier as an add-on line even when the active `100%` tier makes the card display as free. Behavior proof: `npx jest tests/unit/assets/fpb-checkout-line-properties.test.ts --runInBand` covers `_bundle_step_type=addon:PERCENTAGE:100`, `_addon_product`, `_addonTierId`, and parent display metadata excluding the add-on; `npx jest tests/unit/assets/fpb-addons-gifting-step-separation.test.ts --runInBand` covers full-price selected add-on savings when `addonDisplayFree=true`. Source/runtime build proof: `npm run build:widgets`, raw widget `node --check`, and generated bundle `node --check` pass. Early cache-bypassed reloads still served Shopify dev extension asset version `4.0.2`; evidence is `wpb-4.0.3-load-probe.json`, `wpb-4.0.3-after-hard-reload-probe.json`, `wpb-4.0.3-direct-dev-asset-probe.json`, and `wpb-4.0.3-retry-after-wait-probe.json`.
- 2026-07-01 desktop no-duplicate proof after cache-bypassed reload on widget `4.0.3`: `wpb-4.0.3-after-cache-clear-runtime.json` confirms the served Shopify dev extension asset is version `4.0.3`. The flow selected four non-add-on Full-Size products plus one Statement category product to satisfy the active category amount rule, then selected the eligible `100% off` add-on. Evidence: `wpb-4.0.3-desktop-four-paid-before-addon.json`, `wpb-4.0.3-desktop-addon-step-before-select.json`, and paired screenshots. Cart proof `wpb-4.0.3-desktop-nodup-cart-after-add.json` shows two Shopify cart lines: the add-on line has `_addon_product: "true"`, `_addonTierId: "tier2"`, `_bundle_step_type: "addon:PERCENTAGE:100"`, `original_price: 82900`, `final_price: 0`, native `discounts[0].title: "Add On"`, and the parent line has `_bundle_component_count: 5`, `_bundle_total_savings_cents: 0`, and no parent-line add-on savings leakage. Checkout proof `wpb-4.0.3-desktop-nodup-checkout.snapshot.txt` and `wpb-4.0.3-desktop-nodup-checkout-text.json` shows native `ADD ON (-$829.00)`, `FREE`, subtotal `$2,415.00`, and checkout extension `TOTAL SAVINGS $829.00`.
- 2026-07-01 live checkout recheck after hard reload: Chrome DevTools MCP evidence `wpb-current-checkout-tab4-live-reload-cart.json` and `wpb-current-checkout-tab4-live-reload.snapshot.txt` reconfirm the same current cart and checkout UI. `/cart.js` has two lines, add-on line `final_price: 0`, `total_discount: 82900`, native `discounts[0].title: "Add On"`, parent `_bundle_component_count: 5`, parent `_bundle_total_savings_cents: "0"`, and checkout visible text includes `ADD ON (-$829.00)`, `FREE`, subtotal `$2,415.00`, and `TOTAL SAVINGS $829.00`.

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

Notes:
- Existing EB implementation evidence says empty FPB steps/categories render `No Products Available`. Source fix built into widget version `3.0.78`: full-page product grids now resolve the empty-product message from FPB runtime language settings via `noProductsAvailable` and fall back to the EB default `No Products Available` instead of the prior local sentence `No products available in this step.` Widget version `4.0.2` extends the same resolver to the full-page modal product renderer so empty modal/category paths cannot reintroduce the stale sentence `No products available for this step.` Focused proof: `npx jest tests/unit/assets/bundle-widget-full-page-category-hydration.test.ts --runInBand` covers both grid and modal empty-copy resolution. Live EB/WPB fixture capture remains pending.
- 2026-07-01 live EB recapture attempt for the documented bundle `3` empty-step fixture is not usable as storefront truth. Direct loads of `/apps/gbb/easybundle/3?page=addProductsPage2` and `/apps/gbb/easybundle/3?page=addProductsPage1` render the theme shell with an empty `<main>` and console error `Cannot read properties of null (reading 'personalizationData')`. Evidence: `P11-empty-category/eb-bundle3-direct-page2-runtime.json`, `eb-bundle3-direct-page2-empty-main.png`, `eb-bundle3-page1-runtime-failure.json`, and `eb-bundle3-page1-failure.png`. Fresh behavior proof still passes with `npx jest tests/unit/assets/bundle-widget-full-page-category-hydration.test.ts --runInBand`; P11 remains pending until a live EB/WPB mirrored empty-category fixture is captured through the UI.

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

Notes:
- EB reference proof in `internal docs/EB Implementation Reference.md` confirms category rules support `Weight: total selected item weight` with equal-to, greater-than-or-equal-to, and less-than-or-equal-to conditions. The current EB storefront tab is not a P12 fixture; it still renders the baseline amount-rule bundle and no category weight condition.
- Current WPB source proof: `app/assets/widgets/full-page/methods/product-processing-methods.js` normalizes product/variant weights to grams, `app/assets/widgets/full-page/methods/selection-navigation-methods.js` accumulates selected product weight, and `app/assets/widgets/shared/condition-validator.js` evaluates category rules with `type: "weight"` against selected weights rather than selected quantity.
- Focused behavior proof: `npx jest tests/unit/assets/condition-validator.test.ts --runInBand` passes with 85 tests, including `weight category rule uses selected product weights, not selected quantity`.
- Chrome DevTools MCP Admin proof is captured in `/private/tmp/fpb-standard-agentic-parity/P12-category-weight-rule/`: `wpb-admin-current.snapshot.txt` shows the Step Setup category-rule Type dropdown exposes `Quantity`, `Amount`, and `Weight`; `wpb-admin-category-rule-weight-option-admin.png` captures the same Admin surface. The saved live WPB preview is still the P04 amount-rule fixture (`wpb-current-runtime-globals-and-config.json` shows the current embedded config pointer only and `wpb-admin-current.snapshot.txt` shows `Type` currently selected as `Amount`).
- Source fix added for the P12 data path: compact category runtime payloads now preserve product and variant `weight` / `weightUnit`, and `/api/storefront-collections` now requests and returns Storefront API variant `weight` / `weightUnit`. Regression proof: `npx jest tests/unit/lib/bundle-config-contracts.test.ts tests/unit/routes/storefront-collections.test.ts --runInBand` passes with 29 tests. Live Chrome DevTools MCP proof `wpb-live-storefront-collections-weight-after-source-fix.json` shows the dev-tunnel collection endpoint returning `weight` and `weightUnit`, including `The Complete Snowboard` variants at `10` `POUNDS`.
- Remaining P12 gap: create or switch to a dedicated EB/WPB mirrored category-weight fixture through the UI, then capture desktop/mobile storefront proof for below-threshold blocking, selected weight threshold satisfaction, quantity changes, and cart-add blocking/unblocking.

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

Notes:
- Current mobile product-card evidence is captured in `/private/tmp/fpb-standard-agentic-parity/mobile-product-cards-current/`. EB `eb-mobile-product-card.png` and `eb-mobile-product-card-runtime.json` show two-column Standard cards with compact media, Assistant bold title, title divider, left-aligned 14px/700 pricing, full-width 35px card CTA, and `gbbFade` image animation at `1.5s`.
- Source fix built into widget version `3.0.79`: Standard mobile text-CTA product cards now use scoped responsive card media sizing, EB-style title weight/divider, left-aligned pricing rows, full-width CTA/quantity action area, and keep `fpb-standard-product-image-fade` at `1.5s`. WPB dev-tunnel proof after cache clear is `wpb-mobile-card-final-compact-3.0.79.json` and `wpb-mobile-card-final-compact-3.0.79.png`.
- Current uniform-card follow-up is captured in `/private/tmp/fpb-standard-agentic-parity/mobile-product-card-uniform/`. EB proof `eb-mobile-card-focused-probe.json` measures each mobile Standard card as a fixed grid with `150px 42px 60px` rows, including a consistent title row and action area. WPB pre-fix proof `wpb-mobile-card-probe-before.json` showed matching outer row heights but one-line titles collapsing the title/divider row and moving the price/action block upward. WPB dev-tunnel proof after the scoped Standard CSS fix is `wpb-mobile-card-probe-after-title-fix.json` and `wpb-mobile-product-cards-after-title-fix.png`: all measured mobile cards share one `277.195px` row height, all title rows measure `42px`, first-row price/action/button Y positions match across cards, and product images retain `fpb-standard-product-image-fade 1.5s`.
- Fresh live mobile recapture in the P13 evidence folder confirms the same result after cache-bypassed reload: EB `eb-mobile-current-live-card-geometry.json` measures all five visible mobile product cards at `284px` height, while WPB `wpb-mobile-current-live-card-geometry.json` on widget version `3.0.87` measures all five visible Standard product cards at `277.2px`, every title row at `42px`, and image animation including `fpb-standard-product-image-fade 1.5s`. Screenshots are `eb-mobile-current-live-card-uniform.png` and `wpb-mobile-current-live-card-uniform.png`.
- Final wrap Chrome check on widget version `4.0.0` found the active dev-tunnel WPB fixture still differs from the EB fixture used for comparison: EB mobile currently renders three timeline entries and visible product cards at `284px` height, while the active WPB preview fixture renders two timeline entries and visible product cards at `323.195px` height. Evidence: `/private/tmp/fpb-standard-agentic-parity/final-wrap/eb-mobile-current-state.json`, `wpb-mobile-initial-runtime.json`, and `wpb-mobile-after-accordion-addon-step.json`.
- Current long-title proof in the P13 evidence folder: EB `eb-mobile-keto-reference.json` measures `Keto Fresh Meal Subscription - Large Single` with a three-line text box and no clipping; WPB pre-fix `wpb-mobile-keto-overflow-before.json` showed inherited two-line clamping and bottom clipping. The source fix removes the inherited mobile title clamp only for Standard text-CTA cards while preserving the image fade. WPB dev-tunnel proof after cache clear is `wpb-mobile-keto-full-title-after.json` and `wpb-mobile-keto-full-title-after.png`: the full product title renders without ellipsis, `scrollHeight` equals `clientHeight`, `textOverflow` is `clip`, `-webkit-line-clamp` is `none`, and the image keeps `fpb-standard-product-image-fade 1.5s`.
- Variant selector parity proof is captured in `/private/tmp/fpb-standard-agentic-parity/variant-selector/`. EB Standard evidence `eb-mobile-choose-options-locate.json`, `eb-mobile-yellow-selector-before-open.json`, and `eb-mobile-yellow-selector-after-open.json` shows the FPB Standard selector as a `Choose Options` dropdown with a `38px` selected row, `1.5px` `#e3e3e3` border, Assistant `12px` / `700` label, and `35.2px` option rows with `25px` images. Source fix built into widget version `3.0.88`: when `displayVariantsAsIndividualProducts` is off for the active category, WPB renders one grouped product card with the EB-style Standard dropdown instead of pill buttons; when the category flag is on, variants still expand as individual cards. WPB mobile live proof after cache clear: `wpb-mobile-standard-selector-closed.json` confirms `STANDARD`, version `3.0.88`, four Standard dropdowns, zero old pill buttons, selector before price, EB-matching selected-row typography/dimensions, and preserved `fpb-standard-product-image-fade`; `wpb-mobile-standard-selector-open.json` confirms twelve options, `35.2px` option rows, and `25px` option images; `wpb-mobile-standard-selector-after-6-meals.json` confirms choosing `6 meals` updates the selected label, selected variant id `48720218554627`, and price `$95.40`. Screenshots: `wpb-mobile-standard-selector-closed.png`, `wpb-mobile-standard-selector-open.png`, and `wpb-mobile-standard-selector-after-6-meals.png`. Live desktop proof after cache clear on widget version `3.0.89`: `wpb-desktop-card-dropdown-open-live-final-3.0.89.json` confirms the generated Standard stylesheet contains the dropdown margin reset and selector-card price z-index reset, the image keeps `fpb-standard-product-image-fade`, the desktop card rows are image/title/selector/price/action with gaps `8/8/5/5`, the dropdown starts exactly at selector bottom, and the dropdown overlays price/action rows without the price text stacking above it. Screenshot: `wpb-desktop-card-dropdown-open-live-final-3.0.89.png`.
- Desktop variant dropdown clipping follow-up is captured in `/private/tmp/fpb-standard-agentic-parity/variant-selector-dropdown-clipping/`. EB reference `eb-long-dropdown-reference.json` shows the Standard desktop dropdown uses a short scroll viewport, `max-height` transition, subtle shadow, and `3px` WebKit scrollbar with `#f1f1f1` track and `#f6f6f6` thumb. WPB pre-fix `wpb-before-open-dropdown.json` showed the panel bottom hit-testing to the product image below the open card. Source fix built into widget version `3.0.102`: the open Standard dropdown card/wrapper stack above later product cards, the desktop dropdown uses the EB-style scroll viewport, scrollbar, shadow, and open/close max-height animation. Live dev-preview proof `wpb-after-dropdown-parity-final-3.0.102.json` confirms version `3.0.102`, open card `z-index: 30`, wrapper `z-index: 31`, dropdown hit-tests to `.vs-option`, scrollbar colors match EB, and close transitions run; `wpb-loaded-stylesheet-audit-3.0.102.json` shows the currently served Shopify CDN Standard CSS was stale for the new max-height while the local generated asset no longer contains the old `9.38rem` rule.
- Mobile variant selector correction for widget `3.0.90`: fresh EB drawer proof `eb-mobile-selector-drawer-open-inspect.json` and `eb-mobile-selector-drawer-open.png` shows mobile Standard opens a fixed `gbbVariantSelector` overlay with a dim backdrop, bottom sheet max-height `80%`, `20px` top radius, `116px` product image, Assistant `18px` / `700` product title and price, `Choose Options` title at `20px` / `400`, and `55px` option rows with `50px x 45px` images plus label and price. WPB source now branches only mobile Standard selector clicks into a body-level drawer while desktop continues using the card dropdown. Behavior tests: `tests/unit/assets/fpb-standard-mobile-variant-drawer.test.ts` and `tests/unit/assets/fpb-standard-variant-availability.test.ts`. Generated CSS proof after cache clear is `wpb-mobile-drawer-css-fixture-final-3.0.90.json` and `wpb-mobile-drawer-css-fixture-final-3.0.90.png`; it confirms the generated Standard stylesheet applies the EB-matching overlay, sheet, header, title, and option-row geometry. Current WPB live preview data at this checkpoint contains no grouped multi-variant Standard product (`wpb-mobile-runtime-config-variant-products-3.0.90.json`, `wpb-mobile-dom-product-search-3.0.90.json`), so live click-through proof on a real grouped variant card remains pending for the next active variant fixture.
- Mobile variant drawer close-button follow-up for widget `3.0.103`: the Standard drawer close button now uses a black circular background with a white uppercase cross via the existing `.vs-mobile-drawer--standard .vs-mobile-drawer-close` source rule. Evidence is in `/private/tmp/fpb-standard-agentic-parity/mobile-variant-drawer-close/`: local generated CSS proof confirms the rule is in `bundle-widget-full-page-standard.css`; `wpb-live-standard-css-close-substrings.json` shows the currently served dev-preview Standard CSS is still stale on widget `3.0.102` and contains the old transparent close-button rule.
- Yellow Sofa mobile selector follow-up for widget `3.0.107`: live EB coordinate proof shows the visible Yellow Sofa `Choose Options` control can be covered by the sticky mobile footer when the card sits at the viewport bottom, so taps hit the footer instead of the selector. WPB Standard now reserves footer-height scroll runway at the end of the mobile product grid when the compact summary tray is active. Evidence path: `/private/tmp/fpb-standard-agentic-parity/mobile-yellow-sofa-variant-drawer/`; generated source proof confirms the rule is in `bundle-widget-full-page-standard.css`, and the Chrome harness measured the selector hit target above the footer with `paddingBlockEnd: 107px`. Live WPB storefront proof is pending because the dev-tunnel proxy returned `500` for language, controls, and bundle JSON endpoints during this pass.
- Hover/click-state evidence is captured in `/private/tmp/fpb-standard-agentic-parity/product-card-interactions/`. EB single-image cards keep hover visually inert in the measured DOM state and switch the CTA area to a full-width black quantity control. Fresh EB selected-card proof in `/private/tmp/fpb-standard-agentic-parity/selected-card-border/` corrects the older note: selected cards are visually marked with `outline: rgb(0, 0, 0) solid 2px` while keeping `border: 0`, so the black selected state does not shift card sizing. Source fix built into widget version `3.0.108`: WPB Standard selected cards now use the same black outline treatment. WPB proof after cache clear is `wpb-desktop-postfix-selected.json`; earlier hover proof remains `wpb-mobile-selected-final-3.0.80.json` / `.png`, `wpb-desktop-selected-hoverrule-postfix-3.0.79.json`, and `wpb-loaded-css-hover-rule.json`.
- Multi-image product coverage needs a dedicated fixture row: this baseline EB/WPB bundle currently renders only single-image products (`images.length === 1` for every active category product). Matching multi-image products exist in both stores, including `14k Dangling Pendant Earrings` and `18k Dangling Pendant Earrings`; use those in the next EB/WPB mirrored fixture before implementing carousel-arrow parity.
- Current P13 mobile offset proof is captured in `/private/tmp/fpb-standard-agentic-parity/P13-mobile-long-content/`. EB mobile `eb-mobile-current-geometry.json` shows no theme page title between the header and bundle body; first product cards start at about `y=401.78`. WPB pre-fix `wpb-mobile-current-geometry.json` showed a theme H1 above the widget and first product cards at about `y=487.59`, pushing first-row CTAs toward the sticky summary footer. Source fix built into widget version `3.0.83`: the Standard stylesheet hides only the theme `.text-block` containing the page H1 when that same section contains a Standard FPB widget. WPB post-fix proof `wpb-mobile-postfix-3.0.83-geometry.json` shows the H1 no longer appears in the accessibility snapshot, first product cards start at about `y=391.59`, and first-row CTAs end at about `y=665.78` in a `390x844` viewport.

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

## Closeout Audit 2026-07-02

The goal is not yet closeable. Current source and generated assets are committed, but the parity evidence set is still incomplete against this spec's completion criteria.

Current blockers to closing:

- The current WPB dev preview harness has been restored with replacement FPB Standard bundle `cmr361mz50000v00yrdeyxpf7` and storefront page `/pages/preview-daily-essentials-2`, but it is only a minimal one-step, one-category, four-product fixture. It is sufficient for focused widget proof such as the mobile summary footer empty-state fix, but it does not replace the row-specific EB/WPB mirrored fixtures required below.
- P00, P01, P02, and P05 remain `fixed-awaiting-deploy`; each needs cache-bypassed live proof on the current served widget after the relevant saved fixtures are loaded.
- P06 has help/reference and current-fixture-drift evidence only. It still needs a mirrored OOS-visible EB/WPB fixture and desktop/mobile storefront proof.
- P07 has no evidence folder yet and still needs a mirrored inventory-tracking/OOS-blocked fixture.
- P11 has source/test evidence and failed direct EB fixture loads, but still needs a live mirrored empty-category fixture through the UI.
- P12 has source/test/Admin evidence and Storefront API weight payload proof, but still needs a live mirrored category-weight storefront fixture with below-threshold, threshold, quantity-change, and cart-blocking proof.
- P13 has substantial mobile, long-title, variant-selector, and selected-card evidence, but the active EB/WPB fixtures differ and multi-image carousel/click proof still needs a dedicated mirrored fixture.
- S01, S02, S03, S04, and S05 remain pending and have no completed evidence folders.
- Regression smoke remains missing; Standard plus Classic, Compact, and Horizontal need current runtime snapshots/screenshots, with cart add proof for Standard and at least one non-Standard preset.

No row should be marked complete from source-only evidence. Each remaining row requires the case evidence contract above: EB and WPB desktop/mobile captures, runtime snapshots, computed probes, accessibility/network evidence, interaction log, and cart proof where relevant.

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
| P03 | verified | `/private/tmp/fpb-standard-agentic-parity/P03-category-exact-variants/` |
| P04 | verified | `/private/tmp/fpb-standard-agentic-parity/P04-collection-amount-rule/` |
| P05 | fixed-awaiting-deploy | `/private/tmp/fpb-standard-agentic-parity/P05-cloned-step-max/` |
| P06 | pending | `/private/tmp/fpb-standard-agentic-parity/P06-oos-visible/` |
| P07 | pending | `/private/tmp/fpb-standard-agentic-parity/P07-oos-blocked-inventory/` |
| P08 | verified | `/private/tmp/fpb-standard-agentic-parity/P08-gifting-step-only/` |
| P09 | verified | `/private/tmp/fpb-standard-agentic-parity/P09-paid-addon-tier/`; `/private/tmp/fpb-standard-agentic-parity/cart-lines-post-save/` |
| P10 | verified | `/private/tmp/fpb-standard-agentic-parity/P10-free-addon-highest-tier/`; `/private/tmp/fpb-standard-agentic-parity/P10-free-addon-highest-tier/current-wpb/` |
| P11 | pending | `/private/tmp/fpb-standard-agentic-parity/P11-empty-category/` |
| P12 | pending | `/private/tmp/fpb-standard-agentic-parity/P12-category-weight-rule/` |
| P13 | pending | `/private/tmp/fpb-standard-agentic-parity/P13-mobile-long-content/` |
| S01 | pending | `/private/tmp/fpb-standard-agentic-parity/S01-multi-step-variants-discounts-addons/` |
| S02 | pending | `/private/tmp/fpb-standard-agentic-parity/S02-free-gift-tier-boundary/` |
| S03 | pending | `/private/tmp/fpb-standard-agentic-parity/S03-empty-categories-missing-media/` |
| S04 | pending | `/private/tmp/fpb-standard-agentic-parity/S04-default-selection-recovery/` |
| S05 | pending | `/private/tmp/fpb-standard-agentic-parity/S05-quantity-validation/` |
