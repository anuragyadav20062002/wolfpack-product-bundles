---
schema_version: 1
id: d06-product-list-amount-discount-evidence
title: D06 Product List Amount Discount Evidence
type: evidence
status: current
summary: Confirms amount-threshold fixed-discount messaging and totals for PPB Product List on EB and WPB desktop and mobile.
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
tags:
  - ppb
  - parity
  - discounts
keywords:
  - D06
  - amount-discount
  - Product List
---

# D06 Product List Amount Discount Evidence

## Scope

- Feature: D06, amount-based discount threshold.
- Template: Product List (`PDP_INPAGE` + `CASCADE`).
- Fixture: fixed amount off, amount threshold 1000, discount 5.
- Browser path: Chrome DevTools MCP only.
- Reload discipline: Cache Storage cleared and hard reload with cache bypass before each storefront pass.

## EB Product List

Desktop viewport: `1280 x 800`, DPR `1`.

- Initial Product List state showed: `Spend ₹1000.00 to get ₹5 off on your order.`
- After one selected product, EB showed: `Spend ₹171.00 to get ₹5 off on your order.`
- After a qualifying second selection, EB showed: `Success! Your ₹5 discount has been applied to your cart.`
- Runtime check showed EB Product List assets loaded from the EB app extension, `window.gbbMix.version` was `1.1`, and horizontal overflow was `0`.
- App-owned requests observed during the pass returned `200`, including bundle-view, Storefront GraphQL, cart update, and cart read requests. Console noise was limited to theme/resource noise.

Mobile viewport: `390 x 844`, DPR `3`, mobile + touch emulation.

- Initial Product List state showed: `Spend ₹1000.00 to get ₹5 off on your order.`
- After one selected product, EB showed: `Spend ₹171.00 to get ₹5 off on your order.`
- After a qualifying second selection, EB showed: `Success! Your ₹5 discount has been applied to your cart.`
- Horizontal overflow was `0`.

## WPB Product List

WPB fixture was temporarily set to Product List with amount rule `conditionValue: 100000` and fixed discount `discountValue: 500`, matching WPB's cent-scale pricing model.

Desktop viewport: `1280 x 800`, DPR `1`.

- Initial Product List state showed: `Add 1000.00 more to save $5.00!`
- After selecting `14k Dangling Obsidian Earrings` and `14k Dangling Pendant Earrings`, WPB showed: `Success! Your $5.00 discount has been applied to your cart.`
- The cart CTA showed the discounted total: `Add Bundle to Cart • $1443.00 $5.00 off`.
- Runtime check showed widget version `5.0.187`, root attributes `data-ppb-template-type="PDP_INPAGE"` and `data-ppb-design-preset="CASCADE"`, and horizontal overflow `0`.
- App-owned bundle stylesheet/script requests returned `200`; console output contained only theme/resource `404` noise.

Mobile viewport: `390 x 844`, DPR `3`, mobile + touch emulation.

- Initial Product List state showed: `Add 1000.00 more to save $5.00!`
- After one selected product, WPB showed: `Add 171.00 more to save $5.00!`
- After a qualifying second selection, WPB showed: `Success! Your $5.00 discount has been applied to your cart.`
- The cart CTA showed the discounted total and original total: `Add Bundle to Cart • $1443.00 $1448.00 $5.00 off`.
- Runtime check showed widget version `5.0.187`, root attributes `data-ppb-template-type="PDP_INPAGE"` and `data-ppb-design-preset="CASCADE"`, and horizontal overflow `0`.

## Result

Product List is terminal `P` for D06. EB and WPB both execute an amount threshold, show remaining amount before qualification, show success copy after qualification, and show discounted Product List totals on desktop and mobile.
