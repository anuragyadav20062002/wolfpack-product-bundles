# Test Spec: FPB Promo Discount Tier Badges
**Spec ID:** fpb-promo-discount-tier-badges  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Verify FPB storefront promo banners can render EB-style discount tier badge rows from the bundle pricing DTO.

## Test Cases
### createPromoBanner
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Pricing rules exist | FPB pricing rules with quantity thresholds and discounts | Promo banner includes `.promo-discount-tier-row` and `.promo-discount-tier-badge` elements | Labels are derived from DTO values |
| 2 | Merchant tier text exists | `pricing.messages.tierTextByRuleId` has tier text/subtext | Badge label prefers configured tier text/subtext | No hardcoded merchant copy |
| 3 | No pricing rules | Disabled pricing or empty rules | No tier badge row is rendered | Avoids empty UI |

## Acceptance Criteria
- [ ] Source contract test proves helper/render markers exist.
- [ ] Raw widget source passes `node --check`.
- [ ] Widget assets and CSS are rebuilt/minified.
