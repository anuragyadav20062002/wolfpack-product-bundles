# Test Spec: Cart Transform Real Merchant Root Issue
**Spec ID:** cart-transform-real-merchant-root-issue  **Created:** 2026-07-07

## Purpose
Prevent the real merchant failure where fixed bundle pricing and selected product variants are not serialized correctly for Shopify Cart Transform, and where full-page runtime product payloads render incomplete products as $0.00.

## Test Cases
### PricingMetafieldSerialization
| # | Scenario | Input | Expected Output | Notes |
| 1 | Fixed bundle price rule includes discount display value and fixed price | `discountValue` plus `fixedBundlePrice` | Cart transform price adjustment uses `fixedBundlePrice` | Prevents discount amount being treated as bundle price |

### ComponentVariantMetafields
| # | Scenario | Input | Expected Output | Notes |
| 1 | Product fallback has multiple variants | Product IDs from collection/category path | `component_parents` written to every variant | Selected non-first variants can trigger Cart Transform |

### FullPageRuntimePayload
| # | Scenario | Input | Expected Output | Notes |
| 1 | FPB runtime config contains enriched step products | Products with price and variants | Runtime products preserve price and variants | Prevents $0.00 product cards |
| 2 | FPB runtime config contains fixed bundle rules | Rule with `fixedBundlePrice` | Runtime pricing preserves `fixedBundlePrice` | Keeps widget and transform tiers aligned |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Existing cart transform pricing tests still pass
- [ ] Widget source remains syntax-valid after product hydration changes
