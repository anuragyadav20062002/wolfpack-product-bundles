---
schema_version: 1
id: ppb-d05-buy-x-get-y-evidence
title: PPB D05 Buy X Get Y Evidence
type: parity-evidence
status: active
summary: Documents Buy X, Get Y parity for Product List, Product Grid, Horizontal Slots, and Vertical Slots.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - internal docs/EB Implementation Reference.md
  - tests/unit/assets/pricing-calculator-bxy.test.ts
related_docs:
  - internal docs/EB Implementation Reference.md
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - discounts
  - buy-x-get-y
keywords:
  - D05
  - Buy X Get Y
  - BXY
  - BOGO
---

# D05 Buy X, Get Y

## Result

Row D05 is terminal **P** for Product List, Product Grid, Horizontal Slots, and Vertical Slots.

Chrome DevTools MCP was used directly. One shared Buy X, Get Y fixture was configured per app, then all four templates were cycled against that fixture to minimize fixture churn:

- Product Grid
- Product List
- Horizontal Slots
- Vertical Slots

Each EB and Wolfpack storefront pass cleared Cache Storage, hard reloaded, and verified desktop plus mobile:

- desktop: `1280x800`
- mobile: `390x844x3`

No screenshots were committed.

## Persisted fixtures

EB was configured UI-only:

- discount type: Buy X, get Y
- customer buys / minimum quantity: `2`
- customer gets / quantity: `1`
- discount value: `100`
- discount type: `% off`
- apply discount to: The lowest priced items
- pre-threshold message: `Add {{discountConditionDiff}} product(s) to get {{discountedItems}} of them at {{discountValue}}{{discountValueUnit}} off!`
- success message: `Success! You got {{discountedItems}} product(s) at {{discountValue}}{{discountValueUnit}} off`

Wolfpack bundle `cmrf19c8d0000v0xpj8rz2wgh` was configured with the equivalent scoped fixture:

- `BundlePricing.method`: `buy_x_get_y`
- rule id: `d05-bxy-rule`
- condition: quantity `>= 2`
- `customerBuys`: `2`
- `customerGets`: `1`
- `discountValue`: `100`
- `bxyDiscountType`: `percentage`
- `bxyApplyMode`: `lowest_priced`
- `boxSelection`: `null`
- progress bar disabled
- Bundle Quantity Options disabled
- pre-threshold message: `Add {{discountConditionDiff}} product(s) to get {{discountedItems}} of them at {{discountValue}}{{discountValueUnit}} off!`
- success message: `Success! You got {{discountedItems}} product(s) at {{discountValue}}{{discountValueUnit}} off`
- widget version observed during Wolfpack passes: `5.0.187`

The BXY threshold is buy plus get. With `customerBuys = 2` and `customerGets = 1`, the runtime copy correctly asks for `3` products before success.

## Source and unit coverage

The browser replay was backed by existing shared-path coverage:

- `tests/unit/assets/pricing-calculator-bxy.test.ts` verifies that two products do not qualify, three products qualify, one item is discounted, and success variables are generated.
- `tests/unit/routes/ppb-save-bundle.test.ts` verifies that Product Page Buy X, Get Y saves clear direct `boxSelection`.
- `internal docs/EB Implementation Reference.md` confirms EB PPB BXY persists as `discountMode: "BOGO"` with `value`, `getsQuantity`, `discountValue`, `discountType`, and `applyDiscountTo`.

## Template evidence

### Product Grid

Runtime:

- EB: Product Grid
- Wolfpack: `PDP_INPAGE / COGNIVE`

Evidence:

- EB desktop/mobile below threshold rendered `Add 3 product(s) to get 1 of them at 100% off!`.
- EB desktop/mobile after selecting three products rendered `Success! You got 1 product(s) at 100% off`, showed a discounted `₹0` item, and had no horizontal overflow.
- Wolfpack desktop/mobile below threshold rendered `Add 3 product(s) to get 1 of them at 100% off!`.
- Wolfpack desktop/mobile after selecting three products rendered `Success! You got 1 product(s) at 100% off`, showed a discounted `$0.00` item, had no raw `<span` text, and had no horizontal overflow.

### Product List

Runtime:

- EB: Product List
- Wolfpack: `PDP_INPAGE / CASCADE`

Evidence:

- EB desktop/mobile below threshold rendered `Add 3 product(s) to get 1 of them at 100% off!`.
- EB desktop/mobile after selecting three products rendered `Success! You got 1 product(s) at 100% off`, showed a discounted `₹0` item, and had no horizontal overflow.
- Wolfpack desktop/mobile below threshold rendered `Add 3 product(s) to get 1 of them at 100% off!`.
- Wolfpack desktop/mobile after selecting three products rendered `Success! You got 1 product(s) at 100% off`, showed a discounted `$0.00` item, had no raw `<span` text, and had no horizontal overflow.

### Horizontal Slots

Runtime:

- EB: Horizontal Slots
- Wolfpack: `PDP_MODAL / MODAL`

Evidence:

- EB desktop/mobile modal below threshold rendered `Add 3 product(s) to get 1 of them at 100% off!`.
- EB desktop/mobile after selecting three modal products rendered `Success! You got 1 product(s) at 100% off` and had no horizontal overflow.
- Wolfpack desktop/mobile modal below threshold rendered `Add 3 product(s) to get 1 of them at 100% off!`.
- Wolfpack desktop/mobile after selecting three modal products rendered `Success! You got 1 product(s) at 100% off`, showed a discounted `$0.00` item, had no raw `<span` text, and had no horizontal overflow.

### Vertical Slots

Runtime:

- EB: Vertical Slots
- Wolfpack: `PDP_MODAL / SIMPLIFIED`

Evidence:

- EB desktop/mobile modal below threshold rendered `Add 3 product(s) to get 1 of them at 100% off!`.
- EB desktop/mobile after selecting three modal products rendered `Success! You got 1 product(s) at 100% off` and had no horizontal overflow.
- Wolfpack desktop/mobile modal below threshold rendered `Add 3 product(s) to get 1 of them at 100% off!`.
- Wolfpack desktop/mobile after selecting three modal products rendered `Success! You got 1 product(s) at 100% off`, showed a discounted `$0.00` item, had no raw `<span` text, and had no horizontal overflow.

## Health checks

- Wolfpack Product List, Product Grid, Horizontal Slots, and Vertical Slots used widget version `5.0.187`.
- Wolfpack passes checked that success messages did not render raw `<span` fragments.
- Desktop and mobile passes checked that document `scrollWidth` did not exceed `clientWidth`.
- EB Product Grid/List required clicking the inner add control; wrapper clicks were unreliable.
- EB modal templates exposed the BXY prompt and success copy in the modal flow, but did not consistently expose a zero-price selected-item text node. Success copy and discounted totals were still verified.

## Matrix promotion

This evidence promotes D05 from untested **T** to current browser-verified **P** for all four PPB templates.

## Fixture restore

After the D05 batch, both fixtures were restored and hard-reload verified:

- EB: Product Grid with Percentage Off rules quantity `>= 2` at `5%` and quantity `>= 3` at `10%`; storefront rendered `Add 2 product(s) to save 5%!`.
- Wolfpack: Vertical Slots with Percentage Off rules quantity `>= 2` at `5%` and quantity `>= 3` at `10%`; storefront modal rendered `Add 2 product(s) to save 5%!`.
