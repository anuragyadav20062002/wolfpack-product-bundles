# Test Spec: PPB Discount Tier Pill DTO
**Spec ID:** ppb-discount-tier-pill-dto  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Verify PPB storefront discount tier pills consume EB-aligned rule-id keyed display DTO text before falling back to older index arrays or structured threshold/discount values.

## Test Cases
### ProductPageBundleTierPills
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Rule-id keyed DTO text exists | `bundleQuantityOptions.optionsByRuleId[rule.id]` | Pill label/subtext come from the rule-id keyed object | Primary EB-aligned path |
| 2 | Pricing message map exists | `pricing.messages.tierTextByRuleId[rule.id]` | Pill label/subtext come from pricing messages | Supports server-side pricing text DTO |
| 3 | Only index arrays exist | `labels[index]` / `subtexts[index]` | Existing consumed JSON shape still renders | Current WPB compatibility |
| 4 | No configured copy exists | Rule threshold and discount values | Pill label uses structured threshold/discount text | Avoids fabricated marketing copy |

## Acceptance Criteria
- [ ] PPB tier pill rendering calls a rule-id aware content resolver.
- [ ] Rule-id keyed DTO values are checked before index-based arrays.
- [ ] Final fallback is structured data, not hardcoded merchant marketing copy.
