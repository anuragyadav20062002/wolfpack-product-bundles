# HSR1 Product List Regression Evidence

Date: 2026-07-13

## Purpose

Re-prove the previously accepted Product List surface after shared PPB modal,
product-card, variant, and category changes made during Horizontal Slots parity.
The shared EB and WPB fixtures were switched through their authenticated Admin
template selectors, inspected at 360 x 800, and restored to Horizontal Slots.

## EB Product List

After cache clearing and a cache-bypassed reload, Product List rendered both
steps, the long `Category 2Long Label Empty Category` tab, six Step 1 rows, the
grouped Pedal Ring selector, selected-items drawer, discount progress, and Next
footer without document overflow.

Selecting `14k Dangling Obsidian Earrings` plus `18k Pedal Ring / 8` produced:

- two ordered selected rows, including identity `18k Pedal Ring - 8`;
- original total `₹1228`, discounted total `₹1166.60`;
- 5% qualified state and 10% next-tier progress;
- zero horizontal overflow.

Both rows were decremented back to zero. The footer returned to `Add 2 product(s)
to save 5%!` and disabled `Next` state.

## WPB Product List

The equivalent cache-bypassed reload rendered widget `5.0.158` with runtime
markers `PDP_INPAGE + CASCADE` and the dedicated
`bundle-widget-product-page-cascade.css` asset.

Selecting the equivalent normal product plus Pedal Ring option `8` produced two
ordered drawer rows, including `18k Pedal Ring - 8 x 1`, and the qualified footer
`Next • $1166.60 • 5% off`. The document had zero horizontal overflow. Both
accessible drawer delete actions returned the fixture to zero selections and the
disabled `Next` state.

## Restoration

EB and WPB were switched back through their authenticated Admin template UIs to
Horizontal Slots. Fresh cache-bypassed storefront reloads returned the empty
two-plus-one slot fixture. WPB reported widget `5.0.158`, zero filled slots, and
zero document overflow.

## Result

Product List remains accepted after the Horizontal Slots shared-source changes.
No Product List regression or source patch was found.
