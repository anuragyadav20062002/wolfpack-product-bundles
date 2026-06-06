# Test Spec: Checkout Bundle Images
**Spec ID:** checkout-bundle-images  **Issue:** [settings-checkout-template-parity-1]  **Created:** 2026-06-04

## Purpose
Ensure bundle checkout extension rows can display product images without showing redundant bundle summary copy.

## Test Cases
### BundleCheckoutImageContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Component pricing metadata includes product image URLs | Saved bundle component with `imageUrl` | `component_pricing` includes `imageUrl` | Source of truth for checkout extension rows |
| 2 | Cart transform component array preserves product image URLs | `_bundle_components` compact array | Seventh array item is image URL | Backwards compatible for older six-item arrays |
| 3 | Checkout UI renders custom item thumbnails | `_bundle_components` with image URL | `s-product-thumbnail` appears per component row | Non-bundle lines still return `null` |
| 4 | Checkout UI does not render redundant bundle summary line | Non-discounted bundle parent | No `Bundle (n items)` string | Native Shopify line text is outside extension control |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Checkout UI extension TypeScript passes
- [ ] Cart transform Rust tests pass if transform source changes
