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

Widget `5.0.171` adds an offer-scoped, versioned session-selection payload for
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

## Build Inclusion Correction

The first hot-reloaded `5.0.170` asset exposed
`ProductPageSelectionPersistenceMethods is not defined`: the source entry
import existed, but `PRODUCT_PAGE_MODULES` did not inline the new module. A
failing build-manifest regression test was added before correcting the module
list and bumping to `5.0.171`. The generated Product Page asset now declares
the persistence methods before composing them into the controller.

## WPB Result On 5.0.171

On desktop, WPB selected store-equivalent `18k Pedal Ring / 10` variant
`48720161276163`. The widget wrote
`wpbPpb-cart-cmrf19c8d0000v0xpj8rz2wgh` with version `1`, Step 1 quantity `1`,
and an empty Step 2 object. A cache-bypassed hard reload restored the filled
Vertical row as `18k Pedal Ring - 10` plus the remaining `Product 2` and Step 2
empty slot.

The same cache-bypassed reload at `390 x 844 x 2, mobile, touch` restored the
same image/title/variant identity. The document had zero horizontal overflow.
The only console error was the theme-owned `/favicon.ico` 404; bundle data,
products, design, language, controls, JS, and CSS requests succeeded.

Vertical Slots `S08` is Proven. Product List, Product Grid, and Horizontal Slots
remain Shared until the identical selected-state desktop/mobile replay is run
for each template. PLS3 proved collection hydration/reload and HSS3 proved
dynamic slot-capacity reset; neither isolated selected-state reload, so their
prior Proven cells remain corrected.
