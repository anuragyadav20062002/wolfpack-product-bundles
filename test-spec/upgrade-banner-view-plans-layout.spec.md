# Test Spec: Upgrade Banner View Plans Layout
**Spec ID:** upgrade-banner-view-plans-layout  **Issue:** [upgrade-banner-view-plans-layout-1]  **Created:** 2026-06-04

## Purpose
Ensure the usage upgrade banner keeps its message on the left and moves the "View Plans" action to the far right.

## Test Cases
### UpgradePromptBannerLayout
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Usage banner action alignment | `UpgradePromptBanner.tsx` source | component uses custom banner layout classes and no longer relies on `s-banner slot="primaryAction"` for the 50% usage state | Polaris banner action slot renders beside the icon in the current app. |
| 2 | Right aligned action style | banner CSS module | action class uses `margin-left: auto` | Keeps button pinned right. |

## Acceptance Criteria
- [ ] Layout contract test passes.
- [ ] Modified component lint/build pass.
