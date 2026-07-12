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

## Isolation Boundary

The card-density correction is CSS-scoped to:

`#bundle-builder-app[data-ppb-template-type="PDP_INPAGE"][data-ppb-design-preset="CASCADE"]`

This excludes Product Grid (`COGNIVE`), Horizontal Slots (`PDP_MODAL + MODAL`), and Vertical Slots (`PDP_MODAL + SIMPLIFIED`). Local tests are supporting evidence only; they do not replace the required live storefront smoke.

## Remaining Proof

Use Chrome DevTools MCP to render Product Grid, Horizontal Slots, and Vertical Slots on desktop and mobile after Chrome reconnects. Confirm each template mounts, products remain interactive, and no Product List Cascade CSS leaks into its cards or controls.
