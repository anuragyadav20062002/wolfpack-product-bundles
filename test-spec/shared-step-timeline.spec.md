# Test Spec: Shared Step Timeline
**Spec ID:** shared-step-timeline  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify FPB timeline step markup can be rendered through a shared primitive without moving controller-owned timeline state or click rules yet.

## Test Cases

### SharedStepTimeline

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Timeline entry markup | Prepared timeline item | Stable `.timeline-step` DOM with escaped label | Keeps existing classes/data attributes. |
| 2 | Build inclusion | Build script | Shared timeline component bundled before widget sources | Required for storefront bundle build. |
| 3 | FPB integration | Full-page widget source | `createStepTimeline()` delegates entry markup to shared renderer | Narrow first timeline slice. |

## Acceptance Criteria

- [x] Timeline entry markup is shared.
- [x] Shared timeline component is bundled into FPB/PPB widget builds.
- [x] Existing FPB timeline controller state remains in place.
