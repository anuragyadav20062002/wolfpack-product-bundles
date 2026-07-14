# VS10 Vertical Slots Delayed-Load Evidence

Date: 2026-07-13

Scope: feature-to-storefront matrix row `S07` for Product Page Bundle Vertical
Slots (`PDP_MODAL + SIMPLIFIED`). Chrome DevTools MCP was used directly for all
browser evidence. The test used cache bypass, cleared Cache Storage, Slow 3G,
and a pre-document 25 ms transition recorder.

## Desktop — 1280 x 800

EB:

- the theme-native product Add button became visible at approximately 7.3 s;
- the EB widget root did not yet exist at that point;
- the native Add button remained visible through the interactive document
  state; and
- at approximately 22.0 s, the final Vertical root appeared and EB added its
  native-button hidden classes.

The constrained-network replay therefore exposed the native product form for
roughly 14.7 s before EB owned the final product-form surface.

WPB widget `5.0.169`:

- the final `#bundle-builder-app` root existed by approximately 5.0 s with
  `data-wpb-bootstrap-loading="true"`;
- the root and loading overlay became visible at approximately 6.8 s;
- the theme-native product Add button existed but remained invisible for every
  recorded transition;
- the loader stayed inside the final widget target while the app-proxy bundle
  data resolved; and
- the Vertical slots replaced the loader at approximately 44.4 s without a
  native product-form flash.

## Mobile — 390 x 844

EB repeated the native-button flash:

- native Add visible at approximately 7.4 s;
- final Vertical root present and native Add hidden at approximately 16.9 s;
- final load complete at approximately 21.7 s.

WPB repeated final-root loading ownership:

- bootstrap root present at approximately 5.1 s;
- final-root loader visible at approximately 6.8 s;
- zero visible native Add controls throughout the trace; and
- final Vertical slots present and loader removed at approximately 45.9 s.

## Decision

Matrix row `S07` is an accepted UX/safety divergence for Vertical Slots. WPB
intentionally retains the final-root loader and early native-button suppression
instead of reproducing EB's constrained-network product-form flash.

Horizontal Slots uses the same `PDP_MODAL` asset family, and HS07 already
records the accepted architectural difference between EB's inline-state root
and WPB's final-root bootstrap overlay. Its canonical matrix status is therefore
reconciled from Proven to accepted divergence as well.
