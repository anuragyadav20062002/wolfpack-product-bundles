# HSS3 Open-Ended Slot Capacity Evidence

Date: 2026-07-13

## EB-first finding

The Horizontal Slots fixture uses different quantity operators by step:

- Step 1: quantity greater than or equal to 2;
- Step 2: quantity equal to 1.

At 360 x 800, EB accepted three Step 1 products. The modal advanced normally,
the final widget rendered all three Step 1 products plus the one required Step 2
product, and Step 1 exposed a new `Product 4` empty slot. Step 2 exposed no
overflow slot because its exact-one rule was satisfied.

The four selected products totaled `₹2436`, qualified for 10%, and produced an
enabled final CTA at `₹2192.40`. The document had no horizontal overflow.

Removing every product preserved four empty Step 1 slots for the remainder of
the session while Step 2 returned to its single empty slot. A hard reload reset
the fixture to its initial two-plus-one empty-slot state.

## WPB delta on 5.0.158

WPB also accepted three Step 1 products and one Step 2 product and produced the
same 10%-discounted total. It rendered the four filled cards without overflow,
but omitted EB's open-ended `Product 4` slot. Removal immediately collapsed Step
1 to its configured two slots instead of retaining the expanded session capacity.

## Source correction

Widget `5.0.159` now tracks per-step modal-slot capacity for open-ended minimum
operators. Capacity grows to selected quantity plus one, persists through removal
for the current widget session, and resets on reload. Exact rules continue to stop
at their configured quantity.

The behavior was developed red-green with the focused empty-placeholder suite.
The final suite covers initial exact/minimum counts, threshold reach, over-target
selection, retained capacity after removal, and exact-rule termination.

## Live WPB proof on 5.0.159

The cache-bypassed dev-extension replay rendered:

- three filled Step 1 cards and one filled Step 2 card;
- one Step 1 `Product 4` placeholder;
- no Step 2 overflow placeholder;
- enabled `Add Bundle to Cart • $2075.40` for the store-equivalent selections;
- zero document horizontal overflow.

After all four removals, Step 1 retained `Product 1` through `Product 4`; Step 2
returned only `Product 1`. A final hard reload restored both EB and WPB to empty
`Product 1`, `Product 2` plus Step 2 `Product 1`.

## Result

HSS3 is accepted. Minimum-rule overflow, dynamic next-slot reachability,
session-retained capacity, exact-rule termination, discounted final rendering,
and reload reset now match EB.
