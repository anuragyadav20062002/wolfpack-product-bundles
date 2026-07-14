# VS03 Selection, Progression, Removal, And Replacement

Date: 2026-07-13
Viewport: `390x844`

## EB-first progression

- Opening Product 1 targeted Step 1 and locked body scrolling.
- Two selected products produced subtotal `₹1448`, discounted total `₹1375.60`,
  count `2`, and the 5% tier.
- Next opened Step 2 while preserving both selections.
- The exact-one Step 2 selection produced subtotal `₹1977`, discounted total
  `₹1779.30`, count `3`, and the 10% tier.
- Done closed the picker and rendered two Step 1 filled rows, dynamic Product 3,
  and one Step 2 filled row.
- Removing the first Step 1 row shifted the remaining product to row 1 and
  restored Product 2 plus Product 3.
- Clicking the filled exact-one Step 2 row reopened Step 2 with its selected
  quantity retained, enabling replacement.

## WPB comparison and fix

WPB matched the same selection order, discount totals, dynamic capacity,
removal reindexing, body lock, and zero overflow. Before the fix, clicking the
filled exact-one row emitted `Product limit reached for this step.` and did not
open the picker.

The filled-card click guard was removed. Validation remains owned by the picker
and Done action, while a filled row now remains editable. On served widget
`5.0.165`, clicking Step 2 reopened the Step 2 picker with quantity `1` retained;
decrementing it, choosing `14k Solid Bloom Earrings`, and completing the step
replaced the outside row successfully.

## Restoration

WPB reset to three empty rows after a cache-bypassed reload. EB persists its
local session across reload, so both remaining selected rows were removed using
their row actions. EB and WPB both ended with zero filled rows and the original
two Step 1 plus one Step 2 empty rows.
