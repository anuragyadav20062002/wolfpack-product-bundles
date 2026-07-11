# Test Spec: Pixel Activation Custom UTM Settings
**Spec ID:** pixel-activation-custom-utms  **Created:** 2026-07-11

## Purpose
Ensure UTM pixel activation always sends Shopify-valid settings, including when the merchant has not configured custom UTM attributes.

## Test Cases
### PixelActivationService
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | No custom attributes configured | `activateUtmPixel(..., [])` | `custom_utm_parameters` is nonblank and invalid as a parameter name | Avoids Shopify `INVALID_SETTINGS` while tracking no custom names |
| 2 | Custom attributes configured | `["utm_influencer", "partner_id"]` | `custom_utm_parameters` is `utm_influencer,partner_id` | Preserves merchant-selected parameters |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] TypeScript passes
- [ ] Integration tests pass
