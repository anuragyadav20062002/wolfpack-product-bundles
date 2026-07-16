---
schema_version: 1
id: d06-product-grid-horizontal-vertical-amount-discount-evidence
title: D06 Product Grid Horizontal Slots Vertical Slots Amount Discount Evidence
type: evidence
status: current
summary: Confirms amount-threshold fixed-discount messaging and totals for PPB Product Grid, Horizontal Slots, and Vertical Slots on EB and WPB desktop and mobile.
last_audited: 2026-07-16
owners:
  - product-bundles
domains:
  - competitor-parity
systems:
  - ppb-storefront
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/D06-product-list-amount-discount-evidence.md
tags:
  - ppb
  - parity
  - discounts
keywords:
  - D06
  - amount-discount
  - Product Grid
  - Horizontal Slots
  - Vertical Slots
---

# D06 Product Grid Horizontal Slots Vertical Slots Amount Discount Evidence

## Scope

- Feature: D06, amount-based discount threshold.
- Templates: Product Grid (`PDP_INPAGE` + `COGNIVE`), Horizontal Slots (`PDP_MODAL` + `MODAL`), and Vertical Slots (`PDP_MODAL` + `SIMPLIFIED`).
- Fixture: fixed amount off, amount threshold 1000, discount 5.
- Browser path: Chrome DevTools MCP only.
- Reload discipline: Cache Storage, `localStorage`, and `sessionStorage` cleared, then hard reload with cache bypass before each storefront pass.
- Fixture grouping: one EB amount-discount fixture and one WPB amount-discount fixture covered all three templates before restore.

## EB fixture

EB was temporarily set to:

- Discount Type: `Fixed Amount Off`.
- Discount on: `Amount`.
- Rule #1: amount `1000`, discount `5`.
- Discount Text: `Spend {{discountUnit}}{{discountConditionDiff}} to get {{discountValueUnit}}{{discountValue}} off on your order.`
- Success Message: `Success! Your {{discountValueUnit}}{{discountValue}} discount has been applied to your cart.`

## EB evidence

### Product Grid

- Desktop `1280 x 800`, DPR `1`: runtime `COGNIVE` / `PDP_INPAGE`, `window.gbbMix.version` `1.1`; messages moved from `Spend ₹1000.00 to get ₹5 off on your order.` to `Spend ₹171.00 to get ₹5 off on your order.` to `Success! Your ₹5 discount has been applied to your cart.`; summary showed `Subtotal: ₹1443 ₹1448`, `You're saving ₹5`, and `₹5 off`; horizontal overflow was `0`.
- Mobile `390 x 844`, DPR `3`: runtime stayed `COGNIVE` / `PDP_INPAGE`; initial, partial, and success messages matched desktop; summary retained the discounted total and `₹5 off`; horizontal overflow was `0`.

### Horizontal Slots

- Desktop `1280 x 800`, DPR `1`: runtime `MODAL` / `PDP_MODAL`, `window.gbbMix.version` `1.1`; messages moved from `Spend ₹1000.00 to get ₹5 off on your order.` to `Spend ₹171.00 to get ₹5 off on your order.` to `Success! Your ₹5 discount has been applied to your cart.`; footer included `₹1443` and `₹1448`; horizontal overflow was `0`.
- Mobile `390 x 844`, DPR `3`: runtime stayed `MODAL` / `PDP_MODAL`; initial, partial, and success messages matched desktop; footer retained discounted/original totals; horizontal overflow was `0`.

### Vertical Slots

- Desktop `1280 x 800`, DPR `1`: runtime `SIMPLIFIED` / `PDP_MODAL`, `window.gbbMix.version` `1.1`; messages moved from `Spend ₹1000.00 to get ₹5 off on your order.` to `Spend ₹171.00 to get ₹5 off on your order.` to `Success! Your ₹5 discount has been applied to your cart.`; footer included `₹1443` and `₹1448`; horizontal overflow was `0`.
- Mobile `390 x 844`, DPR `3`: runtime stayed `SIMPLIFIED` / `PDP_MODAL`; initial, partial, and success messages matched desktop; footer retained discounted/original totals; horizontal overflow was `0`.

## WPB fixture

WPB was temporarily set to:

- `method: "fixed_amount_off"`.
- `conditionType: "amount"`.
- `conditionValue: 100000`.
- `discountValue: 500`.
- Discount Text: `Add {{discountConditionDiff}} more to save {{discountValueUnit}}{{discountValue}}!`
- Success Message: `Success! Your {{discountValueUnit}}{{discountValue}} discount has been applied to your cart.`

The fixture was synced after each template switch.

## WPB evidence

### Product Grid

- Desktop `1280 x 800`, DPR `1`: widget version `5.0.187`, `PDP_INPAGE` / `COGNIVE`; messages moved from `Add 1000.00 more to save $5.00!` to `Add 171.00 more to save $5.00!` to `Success! Your $5.00 discount has been applied to your cart.`; selected-product summary listed two selected products; horizontal overflow was `0`.
- Mobile `390 x 844`, DPR `3`: widget version `5.0.187`, `PDP_INPAGE` / `COGNIVE`; initial, partial, and success messages matched desktop; selected-product summary listed the same two selected products; horizontal overflow was `0`.

### Horizontal Slots

- Desktop `1280 x 800`, DPR `1`: widget version `5.0.187`, `PDP_MODAL` / `MODAL`, `data-ppb-slot-orientation="horizontal"`; first slot modal moved from `Add 1000.00 more to save $5.00!` to `Add 171.00 more to save $5.00!` to `Success! Your $5.00 discount has been applied to your cart.`; slot shell CTA showed `Add Bundle to Cart • $1443.00`; horizontal overflow was `0`.
- Mobile `390 x 844`, DPR `3`: widget version `5.0.187`, `PDP_MODAL` / `MODAL`, horizontal orientation; initial, partial, and success messages matched desktop; slot shell CTA showed `Add Bundle to Cart • $1443.00`; horizontal overflow was `0`.

### Vertical Slots

- Desktop `1280 x 800`, DPR `1`: widget version `5.0.187`, `PDP_MODAL` / `SIMPLIFIED`, `data-ppb-slot-orientation="vertical"`; first slot modal moved from `Add 1000.00 more to save $5.00!` to `Add 171.00 more to save $5.00!` to `Success! Your $5.00 discount has been applied to your cart.`; slot shell CTA showed `Add Bundle to Cart • $1443.00`; horizontal overflow was `0`.
- Mobile `390 x 844`, DPR `3`: widget version `5.0.187`, `PDP_MODAL` / `SIMPLIFIED`, vertical orientation; initial, partial, and success messages matched desktop; slot shell CTA showed `Add Bundle to Cart • $1443.00`; horizontal overflow was `0`.

## Restore

- WPB was restored to its baseline Vertical Slots template with percentage discount rules `2 => 5%` and `3 => 10%`, then synced.
- EB was restored through the admin UI to `Percentage Off`, `Quantity`, rule #1 `2 => 5%`, and rule #2 `3 => 10%`. The Shopify save bar cleared and the restored values remained visible.

## Result

Product Grid, Horizontal Slots, and Vertical Slots are terminal `P` for D06. EB and WPB both execute an amount threshold, show remaining amount before qualification, show success copy after qualification, and show discounted totals on desktop and mobile.
