# HS02 Mixed Media and Compare-at Evidence

Date: 2026-07-13

## EB-first evidence

- EB global Bundle Settings had `Show Compare At Price` enabled.
- The live Step 2 picker rendered sale and compare-at pairs, including
  `14k Solid Bloom Earrings` (`₹529` / `₹489`) and `Yellow Sofa`
  (`₹150` / `₹99.99`).
- Direct Chrome DevTools measurements proved mixed source ratios inside the
  same card media frame:
  - square: `14k Solid Bloom Earrings`, natural `400x400`
  - tall: `Massage Oil`, natural `333x400`
  - wide: `Yellow Sofa`, natural `400x274`
  - each card media box rendered `229x190.828125`.

## WPB equivalent evidence

- The authenticated PPB Bundle Settings surface exposed the new
  `Show Compare At Price` switch. Enabling and saving it persisted the existing
  `showCompareAtPrices` field.
- The live app-proxy response emitted the widget-facing
  `showProductComparedAtPrice: true` key rather than leaking the raw persistence
  key.
- The live Step 2 picker rendered sale and compare-at pairs, including
  `14k Solid Bloom Earrings` (`$529.00` / `$489.00`), plus the other available
  sale products.
- Direct Chrome DevTools measurements proved mixed source ratios:
  - square: `14k Solid Bloom Earrings`, natural `900x900`, rendered
    `232.75x194.3125`
  - tall: `Massage Oil`, natural `1200x1440`, rendered
    `182.109375x194.3125`
  - wide: `Purely Almonds Original`, natural `4000x3000`, rendered
    `232.75x194.3125`

The narrower rendered width for the tall source is content-driven containment,
not overflow. All three remain within the same fixed-height media frame.

## Delta and fixture restoration

- Currency and exact source image dimensions differ by store; compare-at
  hierarchy and mixed-ratio containment match.
- `Massage Oil` was temporarily added to WPB Step 2 and its Grapefruit variant
  inventory was temporarily changed from `0` to `1` to make the tall source
  reachable. The product was removed again, Step 2 was saved with four selected
  products, and inventory was restored to `0`.
- The WPB compare-at switch was restored to its original disabled state after
  evidence capture.
- No committed screenshots were created.

## Remaining boundary

The current EB and WPB catalogs still do not expose a safe, equivalent
missing-image product. Missing-image fallback remains a separate unproven
fixture row; it is not inferred from lazy images whose `naturalWidth` was still
zero during loading.
