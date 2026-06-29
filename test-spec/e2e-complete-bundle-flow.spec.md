# Test Spec: E2E Complete Bundle Flow (Free Gift & Add Ons)
**Spec ID:** e2e-complete-bundle-flow **Issue:** [fpb-free-gift-cart-line-parity-1] **Created:** 2026-06-26

## Purpose
Create a fresh FPB bundle in test flow and persist EB parity Free Gift & Add Ons contract data, including tiered chargeable addons, then verify persisted bundle and metafield-sync contract.

## Test Cases
### End-to-End Configure Flow
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Fresh create + save with free-gift + add-ons | Bundle creation form + complete `handleSaveBundle` payload matching `internal docs/EB Free Gift Add Ons Behavior Spec.md` | Bundle create returns `bundleId`; bundle save returns success; payload includes `personalizationData.isPersonalizationEnabled`, `addonProducts.isEnabled`, `tiers[0..n]`, and add-on step fields (`isFreeGift`, `addonLabel`, `addonTitle`) | Ensures admin contract parity for fresh flow |
| 2 | Multi-tier checkout-facing contract projection | `addonProducts.tiers` contains multiple tiers with different threshold/discount values | Metafield sync payload contains both tiers with non-mutating values | Foundation for cart-line discount parity in checkout transform |
| 3 | Zero add-on threshold input normalization | `eligibilityCondition.value` is `0` in saved payload | Persisted payload normalizes threshold to `1` (non-zero) before contract write and remains EB-structured | Prevents impossible/zero-capacity add-on step behavior in storefront/checkout |

## Acceptance Criteria
- [ ] Fresh create returns success and a bundle id
- [ ] Save flow with EB contract payload succeeds
- [ ] Personalized add-on block is persisted as separate toggles (`isPersonalizationEnabled`, `addonProducts.isEnabled`)
- [ ] Metafield-sync input contains all serialized tiers from the saved `personalizationData`
