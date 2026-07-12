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
