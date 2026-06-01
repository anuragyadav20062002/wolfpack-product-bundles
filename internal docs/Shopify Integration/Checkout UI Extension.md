---
title: Checkout UI Extension
type: shopify-integration
audited: 2026-04-16
sources: extensions/bundle-checkout-ui/, CLAUDE.md memory
---

# Checkout UI Extension

## Overview

Preact-based extension that renders per-line-item bundle details in checkout and thank-you pages.

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
