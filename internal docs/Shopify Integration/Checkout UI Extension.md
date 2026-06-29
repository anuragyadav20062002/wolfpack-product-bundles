---
title: Checkout UI Extension
type: shopify-integration
audited: 2026-06-29
sources: extensions/bundle-checkout-ui/, CLAUDE.md memory
---

# Checkout UI Extension

## Overview

Preact-based extension registered on checkout and thank-you cart-line targets.
For EB-style FPB parity, the extension intentionally renders nothing: Shopify
native line properties and native discount allocations own the visible checkout
display.

## Targets

| Page | Target |
|---|---|
| Checkout | `purchase.checkout.cart-line-item.render-after` |
| Thank-you | `purchase.thank-you.cart-line-item.render-after` |

Note: Order status page uses `customer-account` extensions (separate app type), **not** `purchase` targets.

## Build Rules

- **Default export required**: Shopify's Preact extension build uses `import Target from` (default import) for ALL targets
- The `export` field in `shopify.extension.toml` is NOT supported for Preact extensions
- Named exports cause build failure
- Both checkout and thank-you targets share the same default export entry point

## Key Gotcha

The `export` field behaviour differs between JS function extensions (which use named exports) and Preact UI extensions (which require default export). Don't confuse the two when editing extension configs.

2026-06-29 parity note: do not reintroduce the custom `Bundle Savings` /
`Actual Price` / `Bundle Price` panel for FPB Standard. Live EB checkout proof
shows parent/add-on details rendered by native checkout line properties and
discount rows. The extension target may stay registered, but checkout parity
metadata belongs in storefront cart properties and Cart Transform output.
