# PPB Product List Cart-Line Evidence

Date: 2026-07-12

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB controls before add: `/private/tmp/ppb-product-list-agentic-parity/PL08-cart-lines/eb-controls-before-add.json`
- EB cart after add: `/private/tmp/ppb-product-list-agentic-parity/PL08-cart-lines/eb-cart-after-add.json`
- WPB controls before add: `/private/tmp/ppb-product-list-agentic-parity/PL08-cart-lines/wpb-controls-before-add.json`
- WPB cart before settings sync: `/private/tmp/ppb-product-list-agentic-parity/PL08-cart-lines/wpb-cart-after-add.json`
- WPB settings after resave: `/private/tmp/ppb-product-list-agentic-parity/PL08-cart-lines/wpb-settings-controls-after-resave-snapshot.txt`
- WPB cart after settings sync: `/private/tmp/ppb-product-list-agentic-parity/PL08-cart-lines/wpb-cart-after-settings-sync-settled.json`
- WPB widget version after variant suffix fix: `/private/tmp/ppb-product-list-agentic-parity/PL08-cart-lines/wpb-variant-suffix-widget-ready.json`
- WPB cart after variant suffix fix: `/private/tmp/ppb-product-list-agentic-parity/PL08-cart-lines/wpb-cart-after-variant-suffix-fix-settled.json`

## State Tested

1. Clear storefront cart.
2. Load the Product List storefront.
3. Select the `18k Pedal Ring` variant option `8`.
4. Add the row to the bundle.
5. Submit the parent bundle.
6. Read `/cart.js` after the cart redirect settles.

## EB Source Of Truth

EB cart line after adding `18k Pedal Ring - 8`:

- `item_count`: `1`
- `total_price`: `39900`
- Public property: `Items: "1 x 18k Pedal Ring - 8 (8)"`
- Internal property: `_Items: ""`
- Box property: `Box: "1"`

## WPB Before Fix

WPB selected the same row and variant, submitted successfully, and produced a parent cart line.

Before the settings sync fix, the cart line had:

- `item_count`: `1`
- `total_price`: `39900`
- Internal bundle metadata present
- `_Items: ""`
- `Box: "1"`
- Missing public `Items`

The storefront widget was already sending the selected bundle metadata. The missing `Items` property was caused by stale Cart Transform owner metafield state: the Settings -> Controls route persisted `bundleCartLineMessaging` to Prisma, but did not sync the function-owner metafield that the Cart Transform reads.

## Fix

Settings -> Controls save now calls `CartTransformService.syncCartLineMessagingSettings(...)` after persisting the shared Controls runtime state.

This keeps the Cart Transform owner metafield aligned with the Admin toggle state and avoids leaving merchants with checked Admin controls that the transform does not apply at runtime.

## WPB After Fix

After resaving Controls with `Bundle Items` checked, WPB cart line after adding `18k Pedal Ring - 8`:

- `item_count`: `1`
- `total_price`: `39900`
- Public property: `Items: "1 x 18k Pedal Ring - 8"`
- Internal property: `_Items: ""`
- Box property: `Box: "1"`
- `Retail Price: "$399.00"`

The `Retail Price` property appears because SIT has `Original Bundle Price` enabled in Settings -> Controls. That is a settings-state difference from the captured EB fixture, not a Product List row or drawer rendering issue.

## Variant Suffix Fix

The first WPB post-sync proof emitted `Items: "1 x 18k Pedal Ring - 8"`, while EB emitted `Items: "1 x 18k Pedal Ring - 8 (8)"`.

The shared cart-line metadata formatter now appends non-default variant titles in parentheses. This keeps the Product List parent title and variant option visible in the same public cart-line text that EB uses.

After the fix, WPB served widget version `5.0.136` and the settled cart payload emitted:

- `Items: "1 x 18k Pedal Ring - 8 (8)"`
- `Retail Price: "$399.00"` because SIT still has Original Bundle Price enabled.

## Verification

- Chrome DevTools MCP: EB and WPB cart-line `/cart.js` payloads captured from live storefronts.
- `npx jest tests/unit/routes/settings-controls-runtime-route-contract.test.ts --runInBand`
- `npx jest tests/unit/assets/ppb-product-list-cart-display-metadata.test.ts --runInBand`
- `npx jest tests/unit/assets/shared-cart-lines.test.ts --runInBand`
- `node --check app/assets/widgets/shared/engine/cart-lines.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- `npm run build:widgets`
