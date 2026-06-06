# Test Spec: FPB Add-ons Card Gap Density
**Spec ID:** fpb-addons-card-gap-density  **Issue:** [fpb-addons-card-gap-density-1]  **Created:** 2026-06-05

## Purpose
Keep the Free Gift & Add Ons cards visually tighter by reducing only the gap between the three section cards.

## Test Cases
### Add-ons Card Stack Gap
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Free Gift & Add Ons section renders cards | Inspect Add-ons section source | The three card classes remain in a single Add-ons stack | Preserve card order |
| 2 | Add-ons card gap is reduced | Inspect stack wrapper source | The Add-ons-only wrapper uses `gap="small-100"` instead of `gap="base"` | Do not change unrelated section stacks |

## Acceptance Criteria
- [x] Focused source-contract test fails before implementation and passes after.
- [x] Chrome verifies the three card gaps are visibly reduced.
