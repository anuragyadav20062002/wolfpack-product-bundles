# VS05 Vertical Slots Category Switching Evidence

Date: 2026-07-13

Scope: feature-to-storefront matrix row `R05` for Product Page Bundle Vertical
Slots (`PDP_MODAL + SIMPLIFIED`). Chrome DevTools MCP was used directly for all
browser evidence. Browser screenshots were inspected but are not committed.

## Persisted and Runtime Configuration

EB storefront:

- Runtime template: `PDP_MODAL + SIMPLIFIED`.
- Step 1 contains `Category 1` and `Category 2Long Label Empty Category`.
- Category 1 has six visible catalog products.
- Category 2 has one visible catalog product, `18k Pedal Ring`.

WPB storefront:

- Bundle ID: `cmrf19c8d0000v0xpj8rz2wgh`.
- Runtime markers: `data-ppb-template-type="PDP_MODAL"`,
  `data-ppb-design-preset="SIMPLIFIED"`, and
  `data-ppb-slot-orientation="vertical"`.
- The equivalent Step 1 categories and product assignments are persisted in the
  public bundle response and rendered in the picker.

## Mobile Replay — 390 x 844

EB:

1. Opened the Step 1 picker from the second empty vertical slot.
2. Confirmed `Category 1` was active and rendered six products:
   `14k Dangling Obsidian Earrings`, `14k Dangling Pendant Earrings`,
   `14k Interlinked Earrings`, `18k Bloom Earrings`,
   `18k Fluid Lines Necklace`, and `18k Pedal Ring`.
3. Activated `Category 2Long Label Empty Category`.
4. Confirmed the active state moved to Category 2 and the catalog changed to
   only `18k Pedal Ring`.
5. Document and modal horizontal overflow were both zero.

WPB:

1. Opened the Step 1 picker from the first empty vertical slot.
2. Confirmed `Category 1` was active and rendered the same six products.
3. Activated `Category 2Long Label Empty Category`.
4. Confirmed the active state moved to Category 2 and the catalog changed to
   only `18k Pedal Ring`.
5. Document and modal horizontal overflow were both zero.

## Desktop Replay — 1280 x 800

The same EB-first sequence was repeated at desktop width. EB and WPB each
changed from the six-product Category 1 catalog to the single-product Category
2 catalog, moved the active-tab state, and retained zero document/modal
horizontal overflow.

## Decision

Matrix row `R05` is Proven for Vertical Slots. This evidence isolates category
switching on the Vertical template itself; it does not rely on the shared modal
implementation or the Horizontal Slots replay.
