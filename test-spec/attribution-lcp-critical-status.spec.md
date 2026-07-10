# Test Spec: Attribution LCP Critical Status
**Spec ID:** attribution-lcp-critical-status  **Created:** 2026-07-10

## Purpose
Keep attribution's inactive-tracking state from becoming a delayed LCP-sized route body candidate.

## Test Cases
### AttributionCriticalStatus
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Pixel is active and analytics has no data | `pixelActive=true`, `hasNoData=true` | Render the analytics no-data banner after analytics resolves | Message depends on analytics summary |
| 2 | Pixel is inactive and analytics has no data | `pixelActive=false`, `hasNoData=true` | Do not render the analytics no-data banner | Prevents a delayed inactive/no-data paragraph becoming the route LCP candidate |

## Acceptance Criteria
- [ ] The first-load inactive tracking state is contained to the compact status card.
- [ ] Analytics no-data copy only renders when tracking is active and analytics confirms no data.
