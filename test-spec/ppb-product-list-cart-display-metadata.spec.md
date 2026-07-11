# Test Spec: PPB Product List Cart Display Metadata
**Spec ID:** ppb-product-list-cart-display-metadata  **Created:** 2026-07-11

## Purpose

Verify the Product Page Bundle widget builds EB-compatible cart display metadata before `/cart/add`, so Product List cart lines have a source for public `Items`, `Box`, and bundle-details metadata.

## Test Cases

### ProductPageCartMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product List selected items build cart metadata | Two selected PPB products with deterministic offer/session ids | Every component line carries `_bundle_display_properties`; parsed metadata includes `box`, `items`, and `retailPrice`; `bundle_details` display mapping includes public `Items` | PL08 cart-line parity |

## Acceptance Criteria
- [ ] Product-page widget cart items carry source display metadata.
- [ ] `bundle_details` mapping exposes public `Items` and `Box`.
- [ ] Focused Jest test passes.
