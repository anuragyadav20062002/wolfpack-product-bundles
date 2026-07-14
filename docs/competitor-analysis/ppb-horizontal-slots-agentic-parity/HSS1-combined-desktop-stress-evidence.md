# HSS1 Combined Desktop Stress Evidence

Date: 2026-07-13

## Matrix

The 1280 x 800 stress pass combined multi-step navigation, grouped variant `8`, a sole inventory survivor, 5% and 10% discount tiers, modal overflow, slot order, final CTA enablement, and horizontal-overflow checks. EB was inspected first, followed by WPB widget `5.0.158`.

## EB

Step 1 selected `14k Dangling Obsidian Earrings` and `18k Pedal Ring / 8`:

- original total `₹1228`, discounted total `₹1166.60`, count `2`;
- next-tier copy advertises 10%;
- modal body `scrollHeight=915`, `clientHeight=520`.

Step 2 selected the sole sellable `Massage Oil / Grapefruit` survivor:

- original total `₹1253`, discounted total `₹1127.70`, count `3`;
- 10% success copy.

Done returned slots in order with the normal product, Pedal Ring option `8`, and Grapefruit variant IDs. The final CTA was enabled at opacity `1`, displayed `₹1127.70` and `10% off`, and the document had no horizontal overflow.

## WPB

The equivalent WPB Step 1 pass produced original total `$1228.00`, discounted total `$1166.60`, count `2`, the 10% next tier, and a scrollable body (`1044/550`).

Step 2 selected the store-equivalent sole live `Selling Plans Ski Wax / Special Selling Plans Ski Wax` survivor, producing `$1277.95` original, `$1150.15` discounted, count `3`, and 10% success copy.

Done returned variant IDs `48720141091075`, `48720161210627` (Pedal Ring `8`), and `48720397271299` (sole live Ski Wax) in slot order. The final CTA was enabled at opacity `1`, displayed `$1150.15`, and the document had no horizontal overflow.

Total differences are exclusively the stores' different Step 2 survivor prices.

## Result

HSS1 is accepted for the combined desktop interaction matrix. Variant identity, inventory filtering, discounts, scrolling, persistence, slot order, and final enablement operate together without cross-state leakage.
