# Test Spec: Add-Ons Tier Accordion
**Spec ID:** addons-tier-accordion  **Created:** 2026-06-21

## Purpose
Match EB's Add-Ons with Bundles tier accordion behavior: clicking an expanded tier collapses it to a header-only row, and clicking a collapsed tier expands it.

## Test Cases
### AddonTierAccordionState
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Click an already active tier | current `0`, clicked `0` | `null` | EB collapses the open tier to header only |
| 2 | Click a different tier | current `0`, clicked `1` | `1` | EB opens the clicked tier |
| 3 | Click a tier when all tiers are collapsed | current `null`, clicked `1` | `1` | Restores an expanded body |
| 4 | Clamp active tier after tier count shrinks | current `2`, count `2` | `1` | Delete keeps a valid active index |
| 5 | Preserve collapsed state after tier count changes | current `null`, count `2` | `null` | Collapsed stays collapsed |
| 6 | Delete a tier from a multi-tier list | tiers `[tier-1, tier-2, tier-3]`, delete index `1` | tiers `[tier-1, tier-3]` | Trash action removes the requested tier |
| 7 | Delete is blocked for the only tier | tiers `[tier-1]`, delete index `0` | unchanged tiers `[tier-1]` | Mirrors disabled UI state |

## Acceptance Criteria
- [x] All listed unit tests pass
- [x] Chrome DevTools verifies WPB tier click toggles expanded/collapsed like EB
- [x] Trash icon click removes the requested tier and keeps header click behavior isolated
