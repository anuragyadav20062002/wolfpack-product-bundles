# VS11 Vertical Slots Runtime Health Evidence

Date: 2026-07-13

Scope: feature-to-storefront matrix row `Q06` for Product Page Bundle Vertical
Slots (`PDP_MODAL + SIMPLIFIED`). Chrome DevTools MCP was used directly after
the cache-bypassed desktop/mobile card, modal, and delayed-load replays.

## EB

App-owned and template-owned requests completed successfully:

- Product Page and shared bundle JS/CSS assets: `200`;
- bundle-view update: `200`;
- cart-state reads and updates: `200`; and
- storefront analytics/collection requests observed in the replay: `200`.

The console contained no error or warning messages. A cart update still marked
pending in the first request-list sample appeared later in the same trace with
status `200`.

## WPB

App-owned requests completed successfully:

- Product Page design settings: `200`;
- Product Page language settings: `200`;
- Product Page controls settings: `200`;
- public bundle JSON: `304` cache validation;
- Product Page widget JS and Vertical modal CSS: `200`;
- Storefront GraphQL catalog hydration: `200`; and
- bundle-view event: `200`.

The console contained no error or warning messages. Shopify theme/CDN requests
were also successful and no theme failure obscured an app-owned boundary.

## Decision

Matrix row `Q06` is Proven for Vertical Slots. The proof covers the current
desktop/mobile feature replays on widget `5.0.169`, including constrained-network
loading, category switching, grouped variants, sole configured variants, modal
open/close, and final slot rendering.
