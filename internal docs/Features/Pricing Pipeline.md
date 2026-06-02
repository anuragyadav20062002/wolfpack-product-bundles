---
title: Pricing Pipeline
type: feature
audited: 2026-04-16
sources: app/lib/pricing.ts (via memory), CLAUDE.md memory
---

# Pricing Pipeline

## Unit Conversion Chain

```
UI (dollars) → DB (cents) → Metafield (cents) → Cart Transform (cents / 100 = dollars)
```

- UI input: dollars (decimal string, e.g. `"9.99"`)
- DB storage: cents (integer, via `amountToCents()`)
- Metafield: cents (same as DB)
- Cart Transform: divides cents by 100 to get dollars for Shopify line price

## Discount Methods

Defined in `pricing.ts`:

| Method | Description |
|---|---|
| `'percentage_off'` | e.g. 10% off the sum of component prices |
| `'fixed_amount_off'` | e.g. $5 off the bundle total |
| `'fixed_bundle_price'` | e.g. bundle always costs $29.99 |

## `calculateDiscountPercentage`

- Clamps output to 0–100 range
- Used in Cart Transform to compute the line-level discount
- Bug fixed: EXPAND path argument mismatch corrected (commit `6b279a0`)

## Bundle Variant Price

The bundle "variant" (the parent Shopify product) has a display price:
- Calculated via `calculateBundlePrice()`: average price per step × discount
- This is a **feed/display price** only — Cart Transform computes the actual checkout price
- Currently only `percentage_off` is fully supported in `calculateBundlePrice()` — `fixed_amount_off` and `fixed_bundle_price` need to be completed

## Notes

- Never store prices as floats in the DB — always cents as integers
- The Cart Transform is the source of truth for what the customer actually pays
