# PG01 Active Step and Responsive Width Delta

Date: 2026-07-13

## Pre-fix WPB delta

The live WPB fixture was switched through the authenticated Select Template
flow and independently reported `PDP_INPAGE + COGNIVE` on widget `5.0.160`.

Two source-level deltas were present:

1. WPB rendered both complete step sections and both product grids at once. EB
   rendered one active body/grid and used the step flow to reach Step 2.
2. WPB's Grid root inherited a `300px` maximum width. At `390x844` it occupied
   only `300px` inside a `358px` product-form host, while EB occupied the
   available `360px` grid width. The fixed cap contradicted the content-driven
   responsive contract.

The shared 15px grid gap, 8px horizontal padding, three-column desktop grid,
two-column mobile grid, and zero document overflow were otherwise aligned.

## Source fix

- Extended the existing in-page active-step decision to include Product Grid.
  Grid now renders only `currentStepIndex`, uses the shared step navigation, and
  changes the footer CTA from `Next` to `Add Bundle to Cart` on the final step.
- Removed the Grid-only `300px` maximum width. Grid now fills its real
  product-form owner while retaining responsive tracks.
- Added a behavior test for multi-step/single-step/modal flow isolation. No CSS,
  class-name, or placement test was added.
- Bumped the widget version from `5.0.160` to `5.0.161`, rebuilt widget assets,
  and minified CSS.

## Post-fix live proof

Desktop, `1280x800`, WPB `5.0.161`:

- one rendered step section and one product grid;
- step-flow buttons expose Step 1 active and Step 2 gated;
- real Grid owner width `372.34375px` in the current theme;
- columns `108.781px 108.781px 108.781px`;
- 15px gap, 8px side padding, zero document overflow.

Mobile, `390x844`, WPB `5.0.161`:

- one rendered step section and one product grid;
- Grid fills the `358px` product-form owner;
- columns `163.5px 163.5px`;
- zero document overflow.

Selecting two Step 1 products enabled `Next`; advancing rendered only Step 2,
kept the two-item discount/selected-items footer state, exposed compare-at
prices, and changed the final CTA to `Add Bundle to Cart`. Returning to Step 1
and decrementing both selections restored the fixture to zero.

EB was replayed with the same two-product progression. Its stale disabled-style
class remained on the Next element, but the live handler advanced to Step 2;
this visual class discrepancy is recorded and is not copied into WPB's semantic
disabled state. EB selections were then removed and Step 1 restored.
