---
schema_version: 1
id: ppb-d03-fixed-amount-off-evidence
title: PPB D03 Fixed Amount Off Evidence
type: parity-evidence
status: active
summary: Documents fixed-amount-off parity for Product List, Product Grid, Horizontal Slots, and Vertical Slots.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - app/assets/bundle-widget-product-page.js
  - tests/unit/assets/pricing-calculator.test.ts
related_docs:
  - internal docs/EB Settings Design Reference.md
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - discounts
  - fixed-amount-off
keywords:
  - D03
  - fixed amount off
  - Product List
  - Product Grid
  - Horizontal Slots
  - Vertical Slots
---

# D03 Fixed Amount Off

## Result

Row D03 is terminal **P** for Product List, Product Grid, Horizontal Slots, and Vertical Slots.

Chrome DevTools MCP was used directly. Each EB and Wolfpack storefront pass selected the relevant tab, cleared Cache Storage, hard reloaded, and verified desktop plus mobile:

- desktop: `1280x800`
- mobile: `390x844x3`

No screenshots were committed.

## Persisted fixtures

EB was configured UI-only:

- discount type: Fixed Amount Off
- condition: quantity `>= 2`
- discount amount: `₹5`
- pre-threshold message: `Add {{discountConditionDiff}} product(s) to save {{discountValueUnit}}{{discountValue}}!`
- success message: `Success! Your {{discountValueUnit}}{{discountValue}} discount has been applied to your cart.`

Wolfpack bundle `cmrf19c8d0000v0xpj8rz2wgh` was configured with the equivalent scoped fixture:

- `discountApplicationMethod`: `fixed_amount_off`
- rule: quantity `>= 2`
- `discountValue`: `500` cents
- pre-threshold message: `Add {{discountConditionDiff}} product(s) to save {{discountValueUnit}}{{discountValue}}!`
- success message: `Success! Your {{discountValueUnit}}{{discountValue}} discount has been applied to your cart.`
- widget version observed during Wolfpack passes: `5.0.187`

## Template evidence

### Product Grid

Runtime:

- EB: `PDP_INPAGE / COGNIVE`
- Wolfpack: `PDP_INPAGE / COGNIVE`

Evidence:

- EB desktop/mobile below threshold rendered `Add 2 product(s) to save ₹5!`.
- EB desktop/mobile after selecting two products rendered `Success! Your ₹5 discount has been applied to your cart`, original total `₹1448`, discounted total `₹1443`, `₹5 off`, and no horizontal overflow.
- Wolfpack desktop/mobile below threshold rendered `Add 2 product(s) to save $5.00!`.
- Wolfpack desktop/mobile after selecting two products rendered `Success! Your $5.00 discount has been applied to your cart`, CTA total `$1443.00`, and no horizontal overflow.

### Product List

Runtime:

- EB: `PDP_INPAGE / CASCADE`
- Wolfpack: `PDP_INPAGE / CASCADE`

Evidence:

- EB desktop/mobile below threshold rendered `Add 2 product(s) to save ₹5!`.
- EB desktop/mobile after selecting two products rendered `Success! Your ₹5 discount has been applied to your cart`, original total `₹1448`, discounted total `₹1443`, `₹5 off`, and no horizontal overflow.
- Wolfpack desktop/mobile below threshold rendered `Add 2 product(s) to save $5.00!`.
- Wolfpack desktop/mobile after selecting two products rendered `Success! Your $5.00 discount has been applied to your cart`, CTA `Add Bundle to Cart • $1443.00 $5.00 off`, and no horizontal overflow.

### Horizontal Slots

Runtime:

- EB: `PDP_MODAL / MODAL`
- Wolfpack: `PDP_MODAL / MODAL`

Evidence:

- EB desktop/mobile below threshold rendered `Add 2 product(s) to save ₹5!`.
- EB desktop/mobile after selecting two modal products rendered `Success! Your ₹5 discount has been applied to your cart`, two `Added x1` product states, original total `₹1448`, discounted total `₹1443`, selected count `2`, and no horizontal overflow.
- Wolfpack desktop/mobile below threshold rendered `Add 2 product(s) to save $5.00!`.
- Wolfpack desktop/mobile after selecting two modal products rendered `Success! Your $5.00 discount has been applied to your cart.`, two `Added x1` product states, original total `$1448.00`, discounted total `$1443.00`, selected count `2`, page CTA `Add Bundle to Cart • $1443.00`, and no horizontal overflow.

### Vertical Slots

Runtime:

- EB: `PDP_MODAL / SIMPLIFIED`
- Wolfpack: `PDP_MODAL / SIMPLIFIED`

Evidence:

- EB desktop/mobile below threshold rendered `Add 2 product(s) to save ₹5!`.
- EB desktop/mobile after selecting two modal products rendered `Success! Your ₹5 discount has been applied to your cart`, two `Added x1` product states, original total `₹1448`, discounted total `₹1443`, selected count `2`, and no horizontal overflow.
- Wolfpack desktop below threshold rendered `Add 2 product(s) to save $5.00!`.
- Wolfpack desktop after selecting two modal products rendered `Success! Your $5.00 discount has been applied to your cart.`, two `Added x1` product states, original total `$1448.00`, discounted total `$1443.00`, selected count `2`, page CTA `Add Bundle to Cart • $1443.00`, and no horizontal overflow.
- Wolfpack mobile below threshold rendered `Add 2 product(s) to save $5.00!`; after one product, remaining-threshold copy changed to `Add 1 product(s) to save $5.00!`; after two products, it rendered `Success! Your $5.00 discount has been applied to your cart.`, two `Added x1` product states, original total `$1448.00`, discounted total `$1443.00`, selected count `2`, page CTA `Add Bundle to Cart • $1443.00`, and no horizontal overflow.

## Health checks

- Wolfpack Product List, Product Grid, Horizontal Slots, and Vertical Slots used widget version `5.0.187`.
- Wolfpack app-owned storefront requests during the final Vertical Slots mobile pass returned `200` or `304`.
- Chrome DevTools console had no errors or warnings during the final Vertical Slots mobile pass.

## Matrix promotion

This evidence promotes D03 from shared/source-backed **S** to current browser-verified **P** for all four PPB templates.

## Fixture restore

After the D03 batch, both fixtures were restored and hard-reload verified:

- EB: Product Grid with Percentage Off rules quantity `>= 2` at `5%` and quantity `>= 3` at `10%`.
- Wolfpack: Vertical Slots with Percentage Off rules quantity `>= 2` at `5%` and quantity `>= 3` at `10%`.
