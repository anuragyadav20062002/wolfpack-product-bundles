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
