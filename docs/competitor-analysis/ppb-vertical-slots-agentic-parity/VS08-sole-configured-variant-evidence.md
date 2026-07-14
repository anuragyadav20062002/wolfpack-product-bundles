# VS08 Vertical Slots Sole Configured Variant Evidence

Date: 2026-07-13

Scope: feature-to-storefront matrix row `C09` for Product Page Bundle Vertical
Slots (`PDP_MODAL + SIMPLIFIED`). Chrome DevTools MCP was used directly for all
browser evidence. Browser screenshots were inspected but are not committed.

## EB Source of Truth

Step 1 Category 2 stores `18k Pedal Ring` with only option `10` configured even
though the parent product has options `6–11`. The cache-bypassed EB picker
renders:

- one `18k Pedal Ring` card;
- store-specific variant ID `45038876688580`;
- visible sole-variant identity `10`;
- no `select` element or alternate options; and
- `Add to Cart` as the reachable action.

This state was replayed at 1280 x 800 and 390 x 844. Document and modal
horizontal overflow were zero in both passes.

## WPB Gap Before the Fix

The WPB public bundle response correctly stored only variant `10` in the same
Category 2 product reference. The hydrated modal catalog discarded that
category-scoped subset and expanded the parent product back to options `6–11`.
The resulting card incorrectly exposed a grouped selector.

## Source Fix

`ProductPageLayoutShellMethods._filterProductsForInpageCategory` now applies an
explicit category product's variant IDs after storefront hydration. When one
configured variant survives, it becomes the card variant ID, title, price,
availability, and image identity. Categories with no explicit variant subset
retain every hydrated variant.

The focused behavior test proves the source product remains unmodified while
the category-scoped result contains only the configured survivor.

## WPB Result After the Fix

Hot-reloaded widget version: `5.0.169`.

At both 1280 x 800 and 390 x 844, the cache-bypassed WPB Category 2 picker now
renders:

- one `18k Pedal Ring` card;
- store-specific variant ID `48720161276163`;
- visible sole-variant identity `10`;
- no `select` element or alternate options; and
- `Add to Cart` as the reachable action.

Document and modal horizontal overflow were zero in both WPB passes.

## Decision

Matrix row `C09` is Proven for Vertical Slots. The evidence covers the
persisted category restriction, hydrated picker card, variant identity,
desktop/mobile output, and the source behavior that prevents re-expansion.
