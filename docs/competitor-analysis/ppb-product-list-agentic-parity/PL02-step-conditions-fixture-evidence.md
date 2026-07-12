# PL02 Step Conditions Fixture Evidence

Date: 2026-07-12

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-desktop-step-conditions.json`
- WPB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-desktop-step-conditions.json`
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-mobile-step-conditions.json`
- WPB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-mobile-step-conditions.json`

## State Tested

1. Inspect EB runtime Product List config for step count, category count, step rules, and category rules.
2. Inspect WPB rendered Product List markers, step sections, category tabs, product rows, and navigation/toast affordances.
3. Repeat the same capture on desktop and mobile.

## EB Source Of Truth

Current EB fixture:
- Template: `PDP_INPAGE + CASCADE`.
- `useSingleStepCategoriesAsBundleSteps`: `false`.
- Step count: `1`.
- `productsData1.conditions.isEnabled`: `false`.
- `productsData1.conditions.rules`: `[]`.
- Category count: `1`.
- Category product count: `6`.
- Category `conditions`: `[]`.
- Category `autoNextStepOnConditionMet`: `false`.
- No Product List category tabs are rendered.
- No Product List next/back controls are rendered.
- No active step-condition toast is present.

Mobile confirms the same runtime shape:
- Step count: `1`.
- Step rules are disabled and empty.
- Category rules are empty.
- No category tabs or next/back Product List controls are rendered.

## WPB Current Result

Desktop, widget `5.0.136`:
- Runtime marker: `data-ppb-template-type="PDP_INPAGE"`.
- Runtime marker: `data-ppb-design-preset="CASCADE"`.
- Step section count: `1`.
- Product row count: `6`.
- Category tab count: `0`.
- No Product List step title is visible in the single-step/single-category collapsed chrome state.
- No active condition toast is present.

Mobile, widget `5.0.136`:
- Runtime marker: `data-ppb-template-type="PDP_INPAGE"`.
- Runtime marker: `data-ppb-design-preset="CASCADE"`.
- Step section count: `1`.
- Product row count: `6`.
- Category tab count: `0`.
- No active condition toast is present.

## Decision

No Product List source patch is justified from this capture. The current EB fixture does not exercise PL02's required multi-step or step/category-rule states, so browser evidence cannot prove blocked/allowed next/back behavior yet.

Existing behavior coverage is in `test-spec/ppb-product-list-step-conditions.spec.md` and `tests/unit/assets/ppb-product-list-step-conditions.test.ts`, covering category amount rules and forward access after previous-step completion. That is useful code coverage, but it is not live storefront parity proof.

Next fixture requirement:
- Configure EB Product List with at least two steps and one required step/category condition.
- Mirror the same Product List fixture in WPB.
- Capture desktop and mobile states for incomplete previous step, completed previous step, blocked forward access, allowed forward access, and final add-to-cart gating.
- Only patch runtime code if EB/WPB diverge under the same configured condition state.

## 2026-07-13 EB Admin Access Recheck

Chrome DevTools MCP was used for all browser evidence.

Evidence files:
- EB embedded admin current page snapshot: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-admin-current-page-snapshot-2026-07-13.txt`
- EB embedded admin verbose snapshot: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-admin-current-page-snapshot-verbose-2026-07-13.txt`
- EB section click probe: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-admin-section-click-probe-2026-07-13.json`
- EB direct-open snapshot: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-admin-direct-open-snapshot-2026-07-13.txt`

Observed state:
- The existing EB admin tab was on `Bundle Settings`, not `Step Setup`.
- The accessibility tree exposed `Step Setup`, `Discount & Pricing`, `Bundle Visibility`, `Bundle Settings`, `Subscriptions`, and `Select template` as static text nodes, not buttons.
- The Chrome DevTools MCP tool surface for this run did not expose a coordinate click or keypress tool, and the EB app iframe was cross-origin from the outer Shopify Admin page.
- Opening the iframe URL as a top-level tab normalized back into Shopify Admin. It landed on the EB home/bundle list with the target Product Page bundle visible, but its row action buttons were unlabeled in the accessibility tree. No row action was clicked because one of the unlabeled actions could be destructive.

Decision:
- PL02 remains a fixture-setup gap, not a proven WPB storefront/runtime gap.
- Do not patch WPB step-condition rendering until EB emits a comparable multi-step Product List storefront runtime.
- The safe next step is to use a Chrome DevTools MCP session that exposes coordinate click or keypress controls, or ask the user to manually open EB `Step Setup` for `WPB PPB Product List Parity 2026-07-11` and confirm when it is visible.

## 2026-07-13 Multi-Step Fixture And Live Delta

Chrome DevTools MCP was used for all browser evidence. The earlier Admin tooling blocker is cleared: the EB iframe accessibility tree now exposes the Step Setup controls and supports safe interaction.

Help content read before fixture changes:
- Step-flow help: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-step-flow-help-2026-07-13.txt`
- Steps-versus-categories help: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-steps-vs-categories-help-2026-07-13.txt`
- Rules help: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-rules-help-2026-07-13.txt`

Configured EB fixture:
- Step 1 retains its quantity `greater than or equal to 2` rule.
- Step 2 contains `14k Intertwined Earrings` and `14k Solid Bloom Earrings`.
- Step 2 uses a quantity `equal to 1` rule.
- Auto-next is disabled so manual Next and Back behavior remains observable.

Configured WPB mirror fixture:
- Step 1 retains its quantity `greater_than_or_equal_to 2` rule.
- Step 2 contains the same two products.
- Step 2 uses a quantity `equal_to 1` rule.
- Auto-next is disabled.
- The Admin save response returned `success: true`, status `200`, and `Updated Successfully!`: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-admin-save-response-2026-07-13.network-response`.

EB desktop source of truth:
- Only the active step's products render.
- Step 1 shows a `Next` footer action.
- Selecting the second Step 1 product permits transition to Step 2.
- Step 2 shows a separate Back control and a disabled `Add Bundle to Cart` action while no Step 2 product is selected.
- Selecting exactly one Step 2 product enables `Add Bundle to Cart` with `opacity: 1` and `pointer-events: auto`.
- Attempting to select a second Step 2 product leaves the selected count at one and shows `Add exactly 01 products on this step`.
- The selected-items drawer preserves selections from both steps.

EB evidence:
- Initial multi-step DOM: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-desktop-multistep-dom-2026-07-13.json`
- Step 1 condition met: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-desktop-step1-condition-met-2026-07-13.json`
- Step 2 initial: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-desktop-step2-initial-2026-07-13.json`
- Step 2 exact-one state: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-desktop-step2-exact-one-2026-07-13.json`
- Step 2 over-target attempt: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-desktop-step2-over-attempt-2026-07-13.json`
- Mobile exact-one state: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-mobile-step2-exact-one-2026-07-13.json`

Measured WPB divergence after a cache-cleared hard reload:
- Both Step 1 and Step 2 headings render simultaneously.
- Products from both steps render simultaneously.
- The footer remains `Add Bundle to Cart`; there is no Step 1 `Next` action and no Step 2 Back control.
- This contradicts EB's one-active-step navigation model and blocks PL02 acceptance.

Decision:
- PL02 is now a proven Product List runtime gap, not a fixture blocker.
- Fix the `PDP_INPAGE + CASCADE` source owner so only the active step renders and Next/Back navigation follows the configured step rules.
- Re-run the same desktop and mobile sequence after implementation, including blocked, allowed, Back, exact-one, and over-target toast states.

## 2026-07-13 mobile step-indicator delta

Chrome DevTools MCP measurements at `390x844` found one remaining visual delta after the multi-step behavior matched:

- EB uses a `20px` flex gap between step items and has no connector element or pseudo-element.
- EB fills only the active `30px` step badge. A completed but inactive step returns to the light badge treatment.
- EB step badges use the inherited `15px` regular-weight type; labels use `14px`, `700`, and `25.2px` line height.
- EB uses a `10px` gap between the badge and label.
- EB's inactive badge uses `#f4f9f9` with a dark `1px` border, and unavailable future steps remain fully opaque.
- WPB still rendered a connector line, filled completed badges, and used `12px/700` badge type with `14px/500` labels.

Evidence:

- `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-mobile-step-parts-390-2026-07-13.json`
- `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/eb-mobile-step-pseudo-390-2026-07-13.json`
- `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-mobile-step-parts-390-5-0-146.json`
- `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-mobile-step-pseudo-390-5-0-146.json`

## 2026-07-13 implementation proof

Widget `5.0.146` was verified after cache-cleared hard reloads without a deploy or dev-server restart.

Desktop and mobile results:

- Only the active step renders; Step 1 has six rows and Step 2 has two rows.
- Step 1 Next remains disabled until two products are selected, then transitions to Step 2.
- Step 2 has a separate Back control and disabled `Add Bundle to Cart` at zero selected.
- Selecting exactly one Step 2 product enables Add Bundle to Cart.
- Attempting a second Step 2 product keeps the selected count at one and shows `Add exactly 01 products on this step`.
- Back returns to Step 1 while the drawer retains all three cross-step selections.
- The final served CSS uses a `20px` step gap, `10px` badge-label gap, no connector pseudo-element, active-only badge fill, and EB-matching inactive badge treatment and typography.

Final WPB evidence:

- `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-desktop-final-step-flow-5-0-146.json`
- `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-mobile-step1-initial-5-0-146.json`
- `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-mobile-step1-two-enabled-5-0-146.json`
- `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-mobile-step2-exact-one-5-0-146.json`
- `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-mobile-step2-over-attempt-5-0-146.json`
- `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-mobile-back-persistence-5-0-146.json`
- `/private/tmp/ppb-product-list-agentic-parity/PL02-step-conditions/wpb-mobile-final-css-propagation-recheck-390-5-0-146.json`

Decision: PL02 is accepted for the configured multi-step Product List permutation on desktop and mobile.
