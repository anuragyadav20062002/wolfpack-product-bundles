# HS10 Dynamic Checkout Unsupported Behavior

Date: 2026-07-13

## EB baseline

At zero bundle selections, EB renders:

- a disabled `Add Bundle to Cart` control at opacity `0.5` and pointer events `none`;
- the theme's real Shopify accelerated-checkout `Buy it now` button immediately below it.

Activating the EB accelerated button navigated directly to Shopify checkout even though the bundle rules were invalid. This bypasses EB's bundle selection flow and does not represent a valid bundle add.

The test-store cart was cleared after the probe and confirmed at zero items.

## WPB

At the equivalent zero-selection state, WPB renders:

- a disabled `Add Bundle to Cart` button;
- a visually matching `Buy it now` surface below it.

WPB's accelerated surface is intentionally non-mutating. Activating it did not navigate, did not add a line, and left the test cart at zero items.

## Decision

The invalid-bundle checkout bypass is not copied. Visual presence is retained, but checkout remains blocked until the bundle is valid and its signed component contract can be submitted.

This is a deliberate safety divergence from EB, not an unresolved parity defect. Implementing EB's behavior would violate the bundle's validation, component, pricing, and Cart Transform contracts.

## Result

HS10 is accepted as unsupported competitor behavior. The WPB test cart remains empty.
