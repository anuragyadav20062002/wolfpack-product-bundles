# PPB Product List Agentic Parity Spec

## Summary

**Goal:** Complete EB-to-WPB storefront parity for Product Page Bundle Product List only. EB `PDP_INPAGE + CASCADE` is the live source of truth. WPB must mirror it as Product Page `Product List` with `bundleDesignTemplate: "PDP_INPAGE"`, `bundleDesignPresetId: "CASCADE"`, and runtime `bundleDesignTemplateData: { templateId: "CASCADE" }`.

Current repo findings to respect:
- Product List already resolves through the PPB template registry and dedicated CASCADE stylesheet.
- PPB template CSS assets are split; Product List must load `bundle-widget-product-page-cascade.css`.
- Product List rows already use the shared product card path, and selected drawer rows use shared selected-row rendering.
- Existing source-grep visual tests are stale under current repo rules. Do not add more CSS/source visual assertions.
- Older CASCADE evidence captured fixed 300px-style measurements from one EB context. Re-measure EB and translate findings into responsive rules, not one-store hardcoding.

## Boundaries

In scope:
- PPB Product List storefront UI, behavior, responsive states, runtime config, selected drawer/footer, discount messaging, validation, variant display, inventory behavior, loading state, and cart proof.
- Admin is fixture setup only.
- Desktop and mobile are both required for every completed row.

Out of scope:
- FPB templates.
- PPB Product Grid, Horizontal Slots, Vertical Slots except smoke checks after shared changes.
- Admin UI parity unless storefront serialization is proven broken.
- Cart Transform business-rule rewrites unless cart proof shows Product List-specific payload mismatch.
- Backend shortcuts unless Chrome fixture setup is blocked and the user explicitly approves.

Hard rules:
- EB live storefront wins over old docs, old screenshots, and current WPB assumptions.
- Do not overfit to one store, one product width, one theme, one currency, or one product media shape.
- Use EB measurements as evidence; implement responsive CSS with scoped variables, `%`, `fr`, `minmax()`, `clamp()`, and `aspect-ratio`.
- No broad selectors, JS layout injection, runtime SVG/HTML visual hacks, or `!important` unless documented in row `delta.md`.
- No autonomous `npm run dev`, `shopify app deploy`, or deploy scripts.

## Tools Available

Use:
- Chrome DevTools MCP for EB/WPB desktop and mobile screenshots, a11y snapshots, computed-style probes, network capture, cache-bypass reloads, runtime config snapshots, and cart proof.
- Local shell for `rg`, `git`, `node --check`, `npx jest`, `npx eslint --max-warnings 9999`, `npm run build:widgets`, `npm run minify:assets css`, and `npm run graphify:rebuild`.
- Repo references: `internal docs/EB Implementation Reference.md`, `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`, `internal docs/EB Settings Design Reference.md`, current PPB widget/template/CSS source, and current test specs.
- Evidence root: `/private/tmp/ppb-product-list-agentic-parity/<case-id>/`.

Do not use:
- CSS/source-grep tests for visual parity.
- Production deploy commands.
- Direct backend data edits as fixture shortcuts without approval.

## Evidence Workflow

For each row:
1. Read EB reference docs and visible EB help/learn-more content for the feature.
2. Configure EB Product List fixture through EB Admin.
3. Hard reload EB storefront with cache bypass.
4. Capture EB desktop `1280+` and mobile `390x844`: screenshots, a11y snapshot, runtime globals/body attrs, computed styles, network, interaction log.
5. Mirror fixture in WPB Admin using Product Page `Product List`.
6. Hard reload WPB storefront with cache bypass.
7. Verify `window.__BUNDLE_WIDGET_VERSION__`, `data-ppb-template-type="PDP_INPAGE"`, `data-ppb-design-preset="CASCADE"`, and active Product List CSS asset.
8. Capture matching WPB proof and write `delta.md`.
9. Implement only the smallest Product List-scoped fix for measured gaps.
10. Rebuild, recheck, hard reload, and recapture proof.

## Run Matrix

Pairwise rows:
- `PL00-baseline`: single step/category, manual products, no variants, all in stock, no discounts, default footer/drawer.
- `PL01-category-list`: multiple categories, long labels, empty category, category switching, active/inactive states.
- `PL02-step-conditions`: multi-step quantity conditions, next/back behavior, blocked/allowed add-to-cart.
- `PL03-variants`: grouped variants, variants-as-individual, swatches if EB exposes them, unavailable variants.
- `PL04-product-source-inventory`: manual + collection-backed categories, OOS hidden/visible/blocked behavior.
- `PL05-discounts-footer`: percentage, fixed amount, fixed price if EB exposes it, progress/success messaging.
- `PL06-quantity-options-validation`: quantity options, validation enabled/disabled, under/exact/over target.
- `PL07-selected-drawer-footer`: selected drawer, remove/clear, count pill, mobile open/closed state.
- `PL08-cart-lines`: add-to-cart success/blocked, cart properties, `bundle_details`, savings display.
- `PL09-unsupported-or-different-ppb-options`: record EB-absent or PPB-different features; do not invent behavior.

Stress rows:
- `PLS1`: multi-step + variants + discount + quantity validation.
- `PLS2`: long titles, compare-at price, multi-image cards, mobile.
- `PLS3`: collection pagination, reload/first-load, no-product category.
- `PLS4`: drawer/footer animation, selected-row overflow, mobile scroll.
- `PLS5`: spinner-only loading with no native product title/add-to-cart flash.
- `PLS6`: smoke Product Grid, Horizontal Slots, Vertical Slots after shared PPB edits.
- `PLS7-placement-responsive`: Product List mounted in narrow product-info column, full-width product section, and constrained card/sidebar contexts. Capture EB and WPB at desktop and mobile widths, then fix only Product List-owned responsive CSS gaps.

## Current Row Status

Last updated: 2026-07-13.

| Row | Status | Evidence | Remaining requirement |
|---|---|---|---|
| `PL00-baseline` | Accepted for current fixture after fixes | `PL00-product-row-quantity-delta.md`, `PL00-add-button-centering-delta.md`, `PL-quantity-behavior-evidence.md`, `PL-loading-placement-evidence.md` | Serve/deploy `5.0.145` before live no-injection proof for the selected quantity radius fix. |
| `PL01-category-list` | Accepted for populated category tabs and switching | `PL01-category-list-fixture-evidence.md` | Empty manual category remains EB-absent in the captured fixture; do not invent WPB-only behavior. |
| `PL02-step-conditions` | Partially accepted | `PL02-step-rules-eb-fixture-evidence.md`, `PL02-step-conditions-fixture-evidence.md` | Single-step quantity rule gating is accepted; true multi-step next/back behavior still needs an EB fixture with visible Step Setup controls. |
| `PL03-variants` | Accepted for grouped variant selector, selected identity, price typography, and responsive select width | `PL03-variant-row-evidence.md` | Unavailable variant state is still covered under `PL04`; swatches only apply if EB exposes them for Product List. |
| `PL04-product-source-inventory` | Fixture-gated | `PL04-inventory-fixture-evidence.md` | Need EB and WPB fixture with at least one sold-out product row and one unavailable variant option. |
| `PL05-discounts-footer` | Accepted for percentage-tier discount footer | `PL05-discounts-footer-fixture-evidence.md` | Fixed-amount and fixed-price discount permutations remain optional fixture expansion, not a known WPB gap. |
| `PL06-quantity-options-validation` | Fixture-gated | `PL06-quantity-validation-fixture-evidence.md` | Need EB storefront runtime with `boxSelection.isEnabled: true` and `validateBoxSelectionQuantity: true`, or a separate EB fixture that already emits those flags. |
| `PL07-selected-drawer-footer` | Accepted for current selected-count, drawer, overflow, remove, add-while-open, and geometry states | `PL07-selected-drawer-footer-delta.md`, `PL07-one-item-drawer-overflow-delta.md`, `PL07-three-row-drawer-overflow-delta.md`, `PL07-selected-drawer-heading-gap-delta.md`, `PL-drawer-add-open-evidence.md`, `PL07-remove-expanded-evidence.md`, `PL-empty-drawer-toast-evidence.md`, `PL-drawer-top-geometry-delta.md` | Recheck after future source changes that touch shared selected-row or footer behavior. |
| `PL08-cart-lines` | Accepted for tested variant and two-product step-rule cart lines | `PL08-cart-lines-evidence.md` | `Retail Price` remains a SIT settings difference, not a Product List parity gap. |
| `PLS7-placement-responsive` | Accepted for measured placement widths | `PLS7-placement-responsive-evidence.md`, `PL-product-list-overflow-evidence.md` | Recheck after any Product List row/grid CSS change. |
| `PLS1/PLS3/PLS5/PLS6` | Not yet independently closed | Existing pairwise rows cover pieces | Need combined stress passes only after fixture-gated rows are unblocked. |

## Test And Verification Plan

Behavior/data tests only:
- Template mapping: `PDP_INPAGE + CASCADE` resolves to Product List.
- Runtime config emits `bundleDesignTemplateData.templateId = "CASCADE"`.
- Variant display flags and selection counts behave correctly.
- Selected drawer row data and remove actions are correct.
- Discount progress/condition evaluation matches EB behavior.
- Inventory guards and cart payload shape are correct.

After code changes:
- Create/update `test-spec/<module>.spec.md` for TDD slices.
- Run focused Jest only for changed behavior.
- Run `node --check` on touched raw widget JS and generated product-page bundle.
- Run `npm run build:widgets`.
- Run `npm run minify:assets css` for CSS changes.
- Run ESLint on modified source files.
- Run `npm run graphify:rebuild`.
- Recheck git status for generated graph/widget asset churn.
- Browser-verify served storefront version and active CSS after hard reload.

Completion requires:
- Every row has EB/WPB desktop and mobile proof.
- All row `delta.md` files show no unresolved Product List gap or explicitly document EB absence.
- WPB Product List remains responsive across theme/product widths and does not depend on one captured store geometry.
- Non-Product List PPB smoke checks pass after shared changes.
- Tests, builds, lint, graph rebuild, and browser proof are current.
