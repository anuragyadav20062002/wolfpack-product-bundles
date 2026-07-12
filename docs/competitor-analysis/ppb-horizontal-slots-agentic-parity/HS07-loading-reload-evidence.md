# HS07 Loading and Hard-Reload Evidence

Date: 2026-07-13

## Method

A direct Chrome DevTools MCP `initScript` sampled each page every 25ms from `DOMContentLoaded`, before either widget runtime initialized. Both pages were reloaded with cache bypass at 390 x 844.

## EB

EB renders from its page-provided state without a visible loading shell in the captured reload:

- no visible skeleton, loading, `aria-busy`, or status element appeared;
- the product-page widget root was absent at 157ms and present with its final 360 x 525.13px structure at 186ms;
- the root entered at the final mounted product-information location and completed a small vertical entrance transition by approximately 719ms.

## WPB

WPB uses its existing bootstrap overlay while app-proxy configuration resolves:

- the mounted widget root entered with `data-wpb-bootstrap-loading="true"` and a 180px loading region;
- after the theme's product column settled, the overlay occupied the final 358px host width at x=16;
- the root and loading overlay remained at the same final widget location;
- on the captured cold proxy pass, slots appeared at 6526ms, the host expanded to its final 358 x 576px content size, bootstrap loading cleared, and the overlay was removed after its existing fade delay;
- the loaded runtime remained `PDP_MODAL + MODAL`, horizontal orientation, widget `5.0.157`.

The brief first 28ms sample occurred before the theme column finished layout and is not a persistent overflow state. Once the host settled, the overlay and final widget shared the same width and x-position.

## Requests and console

All app-owned reload requests succeeded:

- language settings: 200;
- controls settings: 200;
- bundle JSON: 304 from cache validation;
- bundle view event: 200.

The only console error was the theme's missing `/favicon.ico` request (404), not an app-owned request.

## Result

HS07 is accepted for cache-bypassing reload, loading location, proxy-cold loading persistence, final replacement, runtime contract, and app-owned request health on mobile. EB's absence of a loading shell is retained as a documented architectural difference; removing WPB's overlay would expose a multi-second blank state and would not improve parity behavior.
