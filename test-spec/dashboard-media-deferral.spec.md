# Test Spec: Dashboard Media Deferral
**Spec ID:** dashboard-media-deferral  **Created:** 2026-06-28

## Purpose
Prevent non-critical Dashboard instructional media from becoming the first-load LCP candidate while preserving the visible card shell and loading the media after hydration.

## Test Cases
### DashboardMediaState
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Initial render before hydration | `isHydrated=false` | `loadAppEmbedImage=false` | The app-embed image should not be eligible as initial LCP. |
| 2 | After hydration | `isHydrated=true` | `loadAppEmbedImage=true` | The instructional image should appear automatically after the first hydrated render so it does not look broken. |

## Acceptance Criteria
- [ ] Dashboard support avatar paints directly from the initial image markup without hydration-only skeleton state.
- [ ] Dashboard app-embed image is not rendered before hydration.
- [ ] Dashboard app-embed image is rendered after merchant preview intent.
- [ ] Existing Dashboard interactions remain unchanged.
