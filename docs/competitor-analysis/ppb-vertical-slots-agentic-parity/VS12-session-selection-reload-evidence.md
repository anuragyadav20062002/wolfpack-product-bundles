# VS12 Session Selection Reload Evidence

Date: 2026-07-13

Scope: feature-to-storefront matrix row `S08`, discovered through the current
Vertical Slots (`PDP_MODAL + SIMPLIFIED`) fixture and implemented in the shared
Product Page Bundle runtime.

## EB Source Of Truth

Direct Chrome DevTools MCP inspection found that offer `MIX-156854` has an empty
`defaultProductsData` object. The visible `18k Pedal Ring / 10` selection was
therefore not a configured default.

EB wrote the selection to both offer-scoped session keys:

- `gbbMixSdk-cart-MIX-156854`
- `gbbMix-cart-MIX-156854`

Each payload contained `selectedCategoriesProducts` plus a cart item for variant
`45038876688580`, quantity `1`. Removing only those two keys and performing a
cache-bypassed hard reload returned the Vertical fixture to empty Step 1 and
Step 2 slots. Re-selecting `18k Pedal Ring / 10` recreated both keys. A second
cache-bypassed hard reload restored the filled Step 1 slot, `$399` equivalent
total, selected option `10`, and `Added x1` card state.

This proves selected-state session restoration. It is distinct from HSS3's
open-ended slot-capacity behavior: slot capacity resets on reload, while actual
product selections restore when the offer cart payload still exists.

## Historical WPB Gap

WPB widget `5.0.169` initialized `selectedProducts` from configured defaults on
every document load and did not read or write storefront session state. A hard
reload therefore cleared customer selections.

## Shared Source Correction

Widget `5.0.170` adds an offer-scoped, versioned session-selection payload for
the shared Product Page Bundle controller. It:

- restores customer selections after configured defaults, so compulsory
  defaults cannot be removed by stored state;
- persists every quantity mutation and explicit step clear;
- ignores malformed or unsupported payloads without blocking widget startup;
- preloads only steps with restored selections so filled-card and cart product
  data can resolve before the first completed render;
- applies to Product List, Product Grid, Horizontal Slots, and Vertical Slots
  through one controller path.

Focused behavior coverage is in
`tests/unit/assets/ppb-session-selection-persistence.test.ts`; its TDD contract
is `test-spec/ppb-session-selection-persistence.spec.md`.

## Current Evidence Gate

The local generated asset is widget `5.0.170`, but repeated cache-bypassed dev
storefront reloads still served widget `5.0.169` from the current Shopify dev
extension asset URL. No deploy wait is required or requested; the browser proof
remains open until the existing hot-reloaded dev asset serves `5.0.170`.

Matrix row `S08` is therefore Shared, not Proven, for all four templates. PLS3
proved collection hydration/reload and HSS3 proved dynamic slot-capacity reset;
neither isolated selected-state reload and their prior Proven cells were
corrected.
