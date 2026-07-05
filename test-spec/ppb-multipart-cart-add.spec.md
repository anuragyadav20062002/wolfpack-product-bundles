# Test Spec: PPB Multipart Cart Add Contract
**Spec ID:** ppb-multipart-cart-add  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Align Product Page Bundle storefront cart add transport with EB: PPB uses multipart `FormData` against `/cart/add`, while FPB continues to use JSON against `/cart/add.js`.

## Test Cases
### ProductPageWidgetCart
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB cart submit endpoint | Raw product-page widget source | `fetch('/cart/add', ...)` with `FormData` | EB PPB transport |
| 2 | PPB multipart field names | Raw product-page widget source | `items[index][id]`, `items[index][quantity]`, `items[index][properties][Box]`, `items[index][properties][_wolfpackProductBundle:OfferId]`, `items[index][properties][_wolfpackProductBundle:prodQty]` | EB field shape |
| 3 | FPB transport unchanged | Raw full-page widget source | still posts JSON to `/cart/add.js` | EB FPB transport |

## Acceptance Criteria
- [ ] PPB raw widget uses `/cart/add` multipart fields.
- [ ] FPB raw widget remains JSON `/cart/add.js`.
- [ ] Raw PPB widget syntax passes `node --check`.
- [ ] Widget assets are rebuilt before commit.
