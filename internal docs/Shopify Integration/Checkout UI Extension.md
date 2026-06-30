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

2026-06-29 dev-preview gotcha: local source and built output can be inert while
the active checkout still loads an older `version/dev-*` extension CDN URL. After
changing the entry point to render `null` directly, Chrome proof showed a new dev
CDN URL and a response with `ue=()=>null`; no custom checkout pricing labels
remained in the live response or checkout snapshot. Evidence:
`/private/tmp/fpb-standard-agentic-parity/checkout-ui/wpb-live-bundle-checkout-ui-after-entrypoint.response.network-response`
and `wpb-current-checkout-after-entrypoint.snapshot.txt`.

2026-06-29 follow-up proof: live SIT checkout loads the `bundle-checkout-ui`
dev CDN asset and the fetched script contains none of the removed labels
(`Bundle Savings`, `Actual Price`, `Bundle Price`, `Retail Price`, `You Save`).
The expanded mobile order summary shows only native checkout rows: paid add-on
line at the adjusted price, parent bundle line with `Box` / `Items`, and no app
panel. This confirms the remaining EB gap is not a Checkout UI extension issue:
EB's `ADD ON (-...)` row is a native line-level discount allocation, while WPB's
Cart Transform `lineUpdate` only changes the line price. Evidence:
`/private/tmp/fpb-standard-agentic-parity/checkout-ui/wpb-current-checkout-extension-script-audit.json`
and `wpb-current-checkout-expanded.snapshot.txt`.

2026-06-30 EB parity correction: paid add-on checkout proof also shows a native
`TOTAL SAVINGS` row after the checkout total. Shopify Checkout UI static targets
do not expose a slot after the native total row; the supported order-summary
savings slot is `purchase.checkout.reductions.render-after`. WPB uses that target
to render only `TOTAL SAVINGS` from native discount allocations or Cart Transform
bundle savings attributes, while the cart-line target remains inert so it does
not duplicate line item properties or native original/discounted price rows.
