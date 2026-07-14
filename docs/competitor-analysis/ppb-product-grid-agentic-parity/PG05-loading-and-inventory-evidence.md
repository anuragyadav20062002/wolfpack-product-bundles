# PG05 Loading and Inventory Evidence

Date: 2026-07-13

## Throttled hard reload

At `390x844` under Slow 3G, EB reached `document.readyState=interactive`
without an app-owned root or loader. The theme product information remained
visible until the final Product Grid was inserted. This is EB's established
architecture rather than a skeleton contract.

WPB exposed its outer bootstrap overlay during the same throttled state, then
rendered the final Grid in the native product-form owner. The separate inner
Grid loading renderer was replayed in the real final target with the exact
markup produced by `renderInpageProductLoadingRows()`.

Before the fix, all three COGNIVE loading rows and media blocks measured zero
height because loader styles existed only under Product List/CASCADE selectors.

## Source fix

COGNIVE now owns a content-driven card skeleton:

- `display: contents` lets the loading wrapper participate in the real Grid;
- each row follows the card column layout;
- media uses the same square aspect ratio as final cards;
- title, price, and 32px action placeholders remain within the card track;
- no fixed fixture/card width is introduced.

After rebuilding widget `5.0.163` and minifying CSS:

- mobile Grid: `358x410px`, two `163.5px` first-row tracks;
- mobile loading rows: `163.5x249.5px`, square `163.5px` media;
- desktop Grid: `372.34375x410px`, three `108.78125px` tracks;
- desktop loading rows start at the exact final first-card x/y and measure
  `108.78125x194.78125px`;
- desktop and mobile document horizontal overflow remains `0`.

The live DOM simulation was immediately restored after each measurement.

## Inventory and over-target behavior

Both stores were advanced through the two-product Step 1 rule and inspected on
Step 2.

- WPB omits its unavailable snowboard and keeps `Selling Plans Ski Wax`
  selectable. Selecting Ski Wax satisfies the exact-one Step 2 rule; a second
  selection attempt is blocked while the valid Ski Wax selection remains.
- EB's current catalog has different inventory and exposes Massage Oil plus
  three sellable snowboard products. None render an out-of-stock/disabled
  action in the current fixture.

The stores therefore cannot prove the same unavailable identity, but WPB proves
the required omission/blocking behavior and EB proves the equivalent Grid does
not fabricate disabled cards for its sellable catalog. All temporary Step 1 and
Step 2 selections were removed afterward.

No styling unit test was added.
