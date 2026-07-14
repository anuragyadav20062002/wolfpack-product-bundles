# VS02 Filled Row Delta

Date: 2026-07-13
Viewport: `390x844`

## EB-first filled state

Step 1 was completed with two products and Step 2 with its exact-one target.
After `Done`, EB rendered:

- selected rows: `360x64px`;
- selected media: `50x50px`;
- row display: flex, 5px gap, 5px padding;
- Step 1 retained a dynamic `Product 3` empty row because its minimum rule is
  open-ended;
- Step 2 retained no empty row because its exact-one rule was full;
- the full product title remained in the selected-row DOM;
- horizontal overflow: `0`.

The final footer total progressed from `₹1448 / ₹1375.60 / 2` after Step 1 to
`₹1977 / ₹1779.30 / 3` after Step 2, proving the 5% then 10% tiers.

## Exact pre-change WPB delta

WPB matched selection order, dynamic capacity, totals, discount progression,
and 50x50 media, but every selected row measured `358x200px`. The general modal
card height and absolute title positioning leaked into Vertical Slots. WPB also
truncated the long product title in JavaScript before rendering it.

## Required correction

Only `PDP_MODAL + SIMPLIFIED + vertical` filled rows should use the compact row
contract. Horizontal Slots must keep its card layout. Vertical Slots must render
the full title and let CSS contain it within the responsive text column.

## Post-change WPB proof

Served widget `5.0.165` rendered all three selected rows at `358x64px`, with:

- flex row orientation;
- 5px gap and padding;
- 50x50 media;
- static, full product titles clamped by CSS to two lines;
- the open-ended Step 1 `Product 3` row at `358x60px`;
- no remaining empty Step 2 row after its exact-one selection;
- document horizontal overflow `0`.

Removing the first Step 1 product matched EB: the second product shifted to the
first filled row and the empty rows became Product 2 and Product 3.

The `1280x800` replay proved the same contract in the real desktop product
columns: EB rows were `345x64px`; WPB rows were responsive `372.34x64px`; both
used 50x50 media, retained Product 3 at 60px high, and had zero overflow. After
removing all three products, both transient capacity tracks reached four empty
rows; a cache-bypassed reload restored the intended two Step 1 plus one Step 2
empty rows in both stores.
