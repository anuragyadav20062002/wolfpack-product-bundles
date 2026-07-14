# VS06 Vertical Slots Per-Product Quantity Validation — Current State

Date: 2026-07-13

Scope: feature-to-storefront matrix row `S16` for Product Page Bundle Vertical
Slots (`PDP_MODAL + SIMPLIFIED`). This is a gap record, not parity proof.
Chrome DevTools MCP was used directly for all browser evidence.

## EB Runtime Truth

The cache-bypassed EB storefront currently emits:

```json
{
  "validateQuantityPerProduct": {
    "isEnabled": true,
    "allowedQuantity": 1
  }
}
```

The selected product card renders `Added x1`. Activating that selected action
removes the product instead of creating quantity 2, so the Vertical picker does
not expose an increase past the saved maximum in this state.

## WPB Runtime Truth

The equivalent cache-bypassed WPB public bundle response currently emits:

```json
{
  "validateQuantityPerProduct": {
    "isEnabled": false,
    "allowedQuantity": 1
  }
}
```

The WPB Admin Bundle Settings surface exposes `Enable quantity validation` and
`Maximum allowed quantity per product`. Enabling the checkbox produced an
unsaved payload attempt, but the request received Cloudflare tunnel error 1033
with HTTP 530 before reaching the app. The response body identified the dev
tunnel as unavailable; it was not an app error response.

## Source Coverage Is Not Storefront Proof

The Product Page widget already routes modal and in-page quantity changes
through `ConditionValidator.canUpdateProductQuantity`, disables modal increases
at the configured maximum, and has focused behavior coverage. Those facts do
not satisfy the matrix requirement for current, equivalent EB/WPB storefront
proof.

## Decision

Vertical Slots `S16` remains Not Tested. Re-run the WPB Admin save when the
provided dev tunnel is reachable, hard-reload the storefront, prove the public
runtime value is enabled, and replay the maximum on desktop and mobile before
promoting the cell.
