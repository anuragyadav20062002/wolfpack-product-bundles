# Test Spec: Bundle Preview Readiness
**Spec ID:** bundle-preview-readiness  **Created:** 2026-07-05

## Purpose
Ensure every successful configure-page preview action marks the Preview Bundle readiness checklist item complete.

## Test Cases
### BundlePreviewReadiness
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Build storage key | Bundle ID `bundle-1` | `wpb_preview_bundle-1` | Keeps existing readiness persistence contract. |
| 2 | Mark preview complete with browser storage | Bundle ID, storage object, setter callback | Storage receives key value `1`; setter receives `true` | Used by FPB and PPB configure preview handlers. |
| 3 | Storage unavailable | Bundle ID, throwing storage object, setter callback | Setter still receives `true`; no throw | Keeps Admin UI responsive in restrictive browser contexts. |

## Acceptance Criteria
- [ ] Header Preview Bundle completion updates the same state as the readiness row click.
- [ ] Existing `wpb_preview_{bundleId}` persistence contract is unchanged.
- [ ] Storage failures do not block in-memory readiness state.
