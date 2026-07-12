# PLS6 Other PPB Template Smoke Evidence

Date: 2026-07-13

Scope: regression smoke only for Product Grid, Horizontal Slots, and Vertical Slots after Product List work.

## Local Behavior Baseline

Command:

```bash
npx jest --selectProjects unit --runTestsByPath \
  tests/unit/assets/ppb-template-registry.test.ts \
  tests/unit/assets/ppb-template-registry-integration.test.ts \
  tests/unit/assets/ppb-vertical-slots-shared-shell.test.ts \
  tests/unit/assets/bundle-widget-product-page-init.test.ts \
  tests/unit/assets/bundle-widget-product-page-products.test.ts \
  tests/unit/assets/product-page-dom-placement.test.ts
```

Result: 6 suites passed, 50 tests passed.

The baseline proves:
- all four PPB registry mappings still resolve correctly;
- Product Grid, Product List, Horizontal Slots, and Vertical Slots configs remain included in the generated widget order;
- shared product processing and inventory behavior remain green;
- product-form bootstrap placement remains green;
- the Vertical Slots shared shell remains green.

## Aggregate PPB Product List Baseline

A broader behavior-only pass was run after the completion audit:

- 17 focused unit suites passed;
- 106 tests passed;
- coverage included Product List variants, inventory, category filtering, quantity controls, step rules, drawer persistence, discount messaging, cart metadata, loading state, DOM placement, and all four PPB template mappings.

This aggregate pass remains supporting behavior evidence. It does not close the live Product Grid, Horizontal Slots, or Vertical Slots storefront smoke requirement.

## Isolation Boundary

The card-density correction is CSS-scoped to:

`#bundle-builder-app[data-ppb-template-type="PDP_INPAGE"][data-ppb-design-preset="CASCADE"]`

This excludes Product Grid (`COGNIVE`), Horizontal Slots (`PDP_MODAL + MODAL`), and Vertical Slots (`PDP_MODAL + SIMPLIFIED`). Local tests are supporting evidence only; they do not replace the required live storefront smoke.

## Live Chrome DevTools MCP Proof

All three non-Product-List PPB templates were selected through the Admin fixture, hard-reloaded on the storefront, and checked at `1280 x 800` and `390 x 844` on widget `5.0.148`.

Product Grid:
- runtime contract: `PDP_INPAGE + COGNIVE`;
- 28 product cards, 28 enabled Add controls, and 5 enabled native selectors;
- no Cascade rows and no horizontal overflow.

Horizontal Slots:
- runtime contract: `PDP_MODAL + MODAL` with `data-ppb-slot-orientation="horizontal"`;
- horizontal shared slot wrapper present;
- no Cascade rows and no horizontal overflow;
- clicking a mobile slot opens the product picker with selectable product rows.

Vertical Slots:
- runtime contract: `PDP_MODAL + SIMPLIFIED` with `data-ppb-slot-orientation="vertical"`;
- vertical/simplified shared slot wrappers present;
- no Cascade rows and no horizontal overflow;
- clicking a mobile slot opens the product picker with selectable product rows.

Evidence is stored under `/private/tmp/ppb-product-list-agentic-parity/PLS6-other-template-smoke/`. No screenshots are committed.

The fixture was restored afterward and hard-reloaded with `PDP_INPAGE + CASCADE`, visible Cascade rows, and `View Bundle Items` on widget `5.0.148`.

Decision: PLS6 is accepted on desktop and mobile.
