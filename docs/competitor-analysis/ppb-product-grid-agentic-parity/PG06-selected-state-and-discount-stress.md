# PG06 Selected State and Discount Stress

Date: 2026-07-13
Viewport: `390x844`

## State matrix

EB and WPB were replayed through the same rule-bounded state matrix:

- zero selections: progress requests two products and Next is gated;
- one Step 1 selection: one selected row, original total, one-product progress;
- two Step 1 selections: two rows, 5% tier, Next transition;
- two Step 1 plus one Step 2 selection: three rows, 10% tier, final Add Bundle
  to Cart CTA;
- a fourth selection is outside the fixture's exact-one Step 2 rule and is
  blocked rather than creating an unbounded drawer state.

## EB maximum state

- three selected rows;
- final total `₹1779.30`;
- `10% off`;
- final `Add Bundle to Cart` CTA;
- zero document horizontal overflow.

## WPB maximum state

- three selected rows;
- final total `$1348.15`;
- 10% success message;
- final `Add Bundle to Cart` CTA;
- drawer list height `241.390625px` within the mobile product-form owner;
- zero document horizontal overflow on `5.0.163`.

Currency and component prices differ by store. Selection count, tier
progression, final CTA semantics, rule-bounded maximum, and containment match.
All three selections were removed through each drawer and both fixtures were
returned to Step 1.
