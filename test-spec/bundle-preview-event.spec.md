# Test Spec: Bundle Preview Event
**Spec ID:** bundle-preview-event  **Created:** 2026-07-02

## Purpose
Record one Admin preview event per bundle once a usable bundle link is available.

## Test Cases
### BundlePreviewEventService
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | First preview | Bundle id/type/status and bundle link | Records `bundle_previewed` with bundle id, type, status, and link | Uses Admin surface and merchant actor |
| 2 | Duplicate preview | Existing `bundle_previewed` event for bundle | Does not record another event | Prevents duplicate first-preview events |

### FPBPreviewHandler
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Draft preview page created | `createPreviewPage` succeeds | Records first preview event using returned preview link | Link exists only after page creation |
| 2 | Existing draft preview opened | Existing preview page URL is returned | Records first preview event using returned preview link | Handles repeated preview action without duplicate service write |

### PPBPreviewHandler
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product preview opened | `recordBundlePreview` action with product link | Records first preview event after bundle ownership check | Product link is resolved client-side before opening |

## Acceptance Criteria
- [ ] First successful preview records `bundle_previewed`.
- [ ] Duplicate previews for the same bundle do not create duplicate events.
- [ ] Event contains bundle id, bundle type, bundle status, and bundle link.
- [ ] Focused route/service tests pass.
