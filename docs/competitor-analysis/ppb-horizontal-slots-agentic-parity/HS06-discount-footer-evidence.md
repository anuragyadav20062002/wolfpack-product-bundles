# HS06 Discount and Footer Evidence

Date: 2026-07-13

## EB-first progression

After clearing all selections, EB reported:

| Selection count | Progress copy | Footer totals |
| --- | --- | --- |
| 0 | `Add 2 product(s) to save 5%!` | `₹0`, count `0` |
| 1 | `Add 1 product(s) to save 5%!` | `₹829`, count `1` |
| 2 | `Congrats! Add 1 more product(s) to save 10%!` | `₹1448` struck/original, `₹1375.60` discounted, count `2` |
| 3 | `Success! Your 10% discount has been applied to your cart.` | `₹1977` original, `₹1779.30` discounted, count `3` |

## WPB replay

WPB widget `5.0.157` reported the equivalent tier calculations:

| Selection count | Progress copy | Footer totals |
| --- | --- | --- |
| 0 | `Add 2 more items to get 5% off` | `$0.00`, count `0` |
| 1 | `Add 1 more item to get 5% off` | `$829.00`, count `1` |
| 2 | `Add 1 more item to get 10% off` | `$1448.00` original, `$1375.60` discounted, count `2` |
| 3 | `Congratulations! You got 10% off!` | `$1977.00` original, `$1779.30` discounted, count `3` |

Currency symbols and progress/success wording are store and bundle text configuration, not calculation deltas. Both apply 5% at two items, advertise 10% as the next tier, apply 10% at three items, retain totals across step navigation, and expose the final enabled CTA total.

## Result

HS06 is accepted for zero, progress, qualified 5%, qualified 10%, cross-step total persistence, count display, and final CTA content on mobile. The no-discount fixture state remains open because the current dedicated fixture has discount tiers enabled.
