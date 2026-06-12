# Test Spec: FPB Shared Discount Progress
**Spec ID:** fpb-discount-progress-shared  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose
Route FPB sidebar, footer, and mobile progress through the shared discount progress renderer while preserving existing FPB classes and tier labels.

## Test Cases
### FPBSharedDiscountProgress
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB imports shared progress renderer | Raw FPB widget source | Imports `renderDiscountProgress` and `getDiscountProgressData` | Required by Loop 17 |
| 2 | FPB simple progress uses shared renderer | `_renderDiscountProgress` source | Contains `renderDiscountProgress(progressData, {` and FPB class options | Keeps existing CSS contract |
| 3 | FPB stepped progress uses shared milestones | Step-based source | Passes milestones to shared renderer and no longer builds custom DOM manually | Keeps tier labels |

## Acceptance Criteria
- [x] FPB progress paths use the shared progress renderer.
- [x] FPB milestone labels and sidebar subtitles remain available.
- [x] Existing FPB CSS hooks are preserved.
