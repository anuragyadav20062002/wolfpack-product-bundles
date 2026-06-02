# Test Spec: FPB Sidebar Tier CTA
**Spec ID:** fpb-sidebar-tier-cta  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Verify the FPB sidebar primary add-to-cart CTA can use EB-style tier/box label text from existing pricing DTOs.

## Test Cases
### renderSidePanel
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Add-to-cart state has configured tier text | Pricing display options or `tierTextByRuleId` | Main dark CTA renders label/subtext spans | Uses existing DTO text |
| 2 | Intermediate step | Not final/conditionless | Button keeps next-step label | Avoids changing navigation behavior |
| 3 | No configured tier text | Empty display options | Button falls back to existing add-to-cart copy | No fabricated marketing copy |

## Acceptance Criteria
- [ ] Source contract test proves the helper is used by sidebar button rendering.
- [ ] Raw widget source passes `node --check`.
- [ ] Widget assets are rebuilt.
