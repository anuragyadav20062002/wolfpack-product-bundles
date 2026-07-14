# PG04 Mobile Selected Drawer Overflow Delta

Date: 2026-07-13

## EB-first evidence

At `390x844`, the Product Grid selected-items drawer opened with selected rows,
prices, quantities, and remove actions contained inside the 360px Grid owner.
Document horizontal overflow remained `0`.

## WPB pre-fix delta

WPB `5.0.161` opened the equivalent two-item drawer, but each selected row used
a `28px` action grid track while the shared action component required a minimum
of `56px`. The remove controls ended at x=`397` in a 390px viewport, producing
`7px` of app-owned document overflow.

## Source fix and proof

The COGNIVE selected-row grid now gives the action track its real intrinsic
minimum: `minmax(56px, auto)`. The middle text track remains shrinkable with
`minmax(0, 1fr)`.

After rebuilding widget `5.0.162` and minifying CSS:

- Grid owner: `358px`;
- action tracks end at x=`369`;
- selected rows and remove controls remain reachable;
- document horizontal overflow is `0`;
- closing the drawer and decrementing both products restores zero WPB
  selections.

EB had one stale Step 2 selection plus current Step 1 audit selections in its
session-backed drawer. All were removed through the visible cards and drawer
remove action; the EB footer returned to the zero-selection progress state.

No CSS/class/placement unit test was added.
