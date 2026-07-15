---
schema_version: 1
id: ppb-d04-fixed-bundle-price-evidence
title: PPB D04 Fixed Bundle Price Evidence
type: parity-evidence
status: active
summary: Documents fixed-bundle-price parity for Product List, Product Grid, Horizontal Slots, and Vertical Slots.
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
  - tests/unit/assets/pricing-calculator.test.ts
related_docs:
  - internal docs/EB Implementation Reference.md
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - discounts
  - fixed-bundle-price
keywords:
  - D04
  - fixed bundle price
  - Product List
  - Product Grid
  - Horizontal Slots
  - Vertical Slots
---

# D04 Fixed Bundle Price

## Result

Row D04 is terminal **P** for Product List, Product Grid, Horizontal Slots, and Vertical Slots.

Chrome DevTools MCP was used directly. Each EB and Wolfpack storefront pass selected the relevant tab, cleared Cache Storage, hard reloaded, and verified desktop plus mobile:

- desktop: `1280x800`
- mobile: `390x844x3`

No screenshots were committed.

## Persisted fixtures

EB was configured UI-only:

- discount type: Fixed Bundle Price
- condition: quantity `>= 2`
- fixed bundle price: `₹1000`
- pre-threshold message: `Add {{discountConditionDiff}} product(s) to get the bundle at {{discountValueUnit}}{{discountValue}}`
- success message: `Success! Your bundle is at {{discountValueUnit}}{{discountValue}}.`

Wolfpack bundle `cmrf19c8d0000v0xpj8rz2wgh` was configured with the equivalent scoped fixture:

- `discountApplicationMethod`: `fixed_bundle_price`
- rule: quantity `>= 2`
- `discountValue`: `100000` cents
- `fixedBundlePrice`: `100000` cents
- pre-threshold message: `Add {{discountConditionDiff}} product(s) to get the bundle at {{discountValueUnit}}{{discountValue}}`
- success message: `Success! Your bundle is at {{discountValueUnit}}{{discountValue}}.`
- widget version observed during Wolfpack passes: `5.0.187`

Note: the first Wolfpack Product Grid pass exposed an invalid direct-DB fixture shape. Top-level `messages.discountText` / `messages.successMessage` rendered fallback raw-span text. Correct fixture shape is `messages.ruleMessages[ruleId].discountText` plus `successMessage`; after correcting the fixture, no source change was needed and all templates passed.

## Template evidence

### Product Grid

Runtime:

- EB: `PDP_INPAGE / COGNIVE`
- Wolfpack: `PDP_INPAGE / COGNIVE`

Evidence:

- EB desktop/mobile below threshold rendered `Add 2 product(s) to get the bundle at ₹1000`.
- EB desktop/mobile after selecting two products rendered `Success! Your bundle is at ₹1000.`, original total `₹1448`, fixed bundle price `₹1000`, and no horizontal overflow.
- Wolfpack desktop/mobile below threshold rendered `Add 2 product(s) to get the bundle at $1000.00`.
- Wolfpack desktop/mobile after selecting two products rendered `Success! Your bundle is at $1000.00.`, original total `$1448.00`, fixed bundle price `$1000.00`, no raw `<span` text, and no horizontal overflow.

### Product List

Runtime:

- EB: `PDP_INPAGE / CASCADE`
- Wolfpack: `PDP_INPAGE / CASCADE`

Evidence:

- EB desktop/mobile below threshold rendered `Add 2 product(s) to get the bundle at ₹1000`.
- EB desktop/mobile after selecting two products rendered `Success! Your bundle is at ₹1000.`, original total `₹1448`, fixed bundle price `₹1000`, and no horizontal overflow.
- Wolfpack desktop/mobile below threshold rendered `Add 2 product(s) to get the bundle at $1000.00`.
- Wolfpack desktop/mobile after selecting two products rendered `Success! Your bundle is at $1000.00.`, original total `$1448.00`, fixed bundle price `$1000.00`, `$448.00` savings, no raw `<span` text, and no horizontal overflow.

### Horizontal Slots

Runtime:

- EB: `PDP_MODAL / MODAL`
- Wolfpack: `PDP_MODAL / MODAL`

Evidence:

- EB desktop/mobile below threshold rendered `Add 2 product(s) to get the bundle at ₹1000`.
- EB desktop/mobile after selecting two modal products rendered `Success! Your bundle is at ₹1000.`, fixed bundle price `₹1000`, two selected product states, and no horizontal overflow. EB's modal selected state did not expose the original `₹1448` total as text.
- Wolfpack desktop/mobile below threshold rendered `Add 2 product(s) to get the bundle at $1000.00`.
- Wolfpack desktop/mobile after selecting two modal products rendered `Success! Your bundle is at $1000.00.`, two `Added x1` product states, original total `$1448.00`, fixed bundle price `$1000.00`, no raw `<span` text, and no horizontal overflow.

### Vertical Slots

Runtime:

- EB: `PDP_MODAL / SIMPLIFIED`
- Wolfpack: `PDP_MODAL / SIMPLIFIED`

Evidence:

- EB desktop/mobile below threshold rendered `Add 2 product(s) to get the bundle at ₹1000`.
- EB desktop/mobile after selecting two modal products rendered `Success! Your bundle is at ₹1000.`, fixed bundle price `₹1000`, two selected product states, and no horizontal overflow. EB's modal selected state did not expose the original `₹1448` total as text.
- Wolfpack desktop/mobile below threshold rendered `Add 2 product(s) to get the bundle at $1000.00`.
- Wolfpack desktop/mobile after selecting two modal products rendered `Success! Your bundle is at $1000.00.`, two `Added x1` product states, original total `$1448.00`, fixed bundle price `$1000.00`, no raw `<span` text, and no horizontal overflow.

## Health checks

- Wolfpack Product List, Product Grid, Horizontal Slots, and Vertical Slots used widget version `5.0.187`.
- Wolfpack app-owned storefront requests during the final Vertical Slots mobile pass returned `200` or `304`, including `bundle-widget-product-page-bundled.js`, `/apps/product-bundles/api/language-settings/...`, `/apps/product-bundles/api/controls-settings/...`, `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh.json`, `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh/view`, and `/apps/product-bundles/api/storefront-products?...`.
- Chrome DevTools console during the final Wolfpack pass showed theme/browser noise only: content-visibility verbose logs, Bugsnag loaded, one generic `404`, and one form-field id/name issue. No app-owned request failed.
- EB final health showed app-owned EB requests returning `200`, including `cart.js?app=gbbMixBundleApp`, `/apps/gbb/updateMixAndMatchBundleView`, Storefront GraphQL, and `/cart/update.js?app=gbbMixBundleApp`.

## Matrix promotion

This evidence promotes D04 from shared/source-backed **S** to current browser-verified **P** for all four PPB templates.

## Fixture restore

After the D04 batch, both fixtures were restored and hard-reload verified:

- EB: Product Grid with Percentage Off rules quantity `>= 2` at `5%` and quantity `>= 3` at `10%`; storefront rendered `Add 2 product(s) to save 5%!`.
- Wolfpack: Vertical Slots with Percentage Off rules quantity `>= 2` at `5%` and quantity `>= 3` at `10%`; storefront rendered `Add 2 product(s) to save 5%!`.
