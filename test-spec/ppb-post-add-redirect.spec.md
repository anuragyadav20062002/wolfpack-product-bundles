# Test Spec: PPB Post Add Redirect
**Spec ID:** ppb-post-add-redirect  **Created:** 2026-07-17

## Purpose

Verify the Product Page Bundle post-add redirect handler follows the saved
Product Page redirect mode after a successful bundle add.

## Test Cases

### ProductPagePostAddRedirect
| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Checkout redirect | `redirect.action = "checkout"` | Browser path changes to `/checkout` after delay | Covers Redirect to Checkout |
| 2 | Cart redirect fallback | `redirect.action = "cart"` | Browser path changes to `/cart` after delay | Covers Redirect to Cart and side-cart fallback |
| 3 | Side-cart trigger | `redirect.action = "side_cart"` plus selector for an existing trigger | Trigger receives click and URL does not change | Covers Execute Default Side Cart Update |
| 4 | Merchant scripts | Redirect script and custom Product Page script configured | Both scripts execute before redirect handling | Covers existing G28 lifecycle reuse |

## Acceptance Criteria

- [ ] All listed test cases pass.
