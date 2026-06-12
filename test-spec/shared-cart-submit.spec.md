# Test Spec: Shared Cart Submit
**Spec ID:** shared-cart-submit  **Created:** 2026-06-11

## Purpose
Move EB-compatible PPB multipart cart form construction into a shared helper without changing the product-page widget transport behavior.

## Test Cases
### SharedCartSubmit
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Build PPB multipart form data | Cart items, bundle name, offer id, session key | `items[n]` fields include variant, quantity, selling plan, existing properties, Box, bundle name, OfferId, prodQty | Preserves EB-compatible `/cart/add` shape |
| 2 | Extract bundle-details source properties | Cart items where first item has `_bundle_display_properties` | Returns first matching properties object | Keeps metafield sync source compact |
| 3 | Build inclusion | Build script shared modules | `cart-submit.js` is inlined before widget sources | Ensures storefront bundles receive helper |
| 4 | Product-page integration | Widget source | Widget imports and delegates form-data creation to shared helper | Keeps controller behavior stable |

## Acceptance Criteria
- [ ] Focused cart-submit helper tests pass.
- [ ] Existing cart/add transport tests continue to pass.
