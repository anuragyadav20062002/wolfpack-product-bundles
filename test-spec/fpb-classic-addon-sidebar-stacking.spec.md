# Test Spec: FPB Classic Add-on Sidebar Stacking
**Spec ID:** fpb-classic-addon-sidebar-stacking  **Created:** 2026-07-05

## Purpose
Verify the storefront add-on summary can render stacked tier messages in the Classic desktop sidebar while preserving existing highest-eligible-tier business logic for add-on products, pricing, and cart lines.

## Test Cases
### AddonTierSummaryState
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Multiple ineligible tiers | Two quantity tiers at 1 and 2 selected paid products, zero selected | Returns two ineligible summary states in tier order | Supports stacked sidebar messages |
| 2 | Mixed eligible and ineligible tiers | Two quantity tiers at 1 and 2 selected paid products, one selected | Returns tier 1 eligible and tier 2 ineligible | UI can show stacked status cards |
| 3 | Highest eligible tier remains active discount | Two quantity tiers, two selected paid products | Active line discount remains the highest eligible tier | Preserves business/cart behavior |

## Acceptance Criteria
- [x] Summary state exposes every configured add-on tier in display order.
- [x] Existing active add-on discount evaluation still uses the highest eligible tier.
- [x] No CSS/source-grep tests are added.
