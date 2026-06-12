# Test Spec: Admin Save Lock
**Spec ID:** admin-save-lock  **Created:** 2026-06-13

## Purpose

Prevent bundle configure controls from changing while the contextual save operation is in flight, and trigger the save-bar irritated state when a merchant tries.

## Test Cases

### AdminSaveLock
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Saving blocks form controls | `isSaving=true`, target with closest editable selector | returns blocked | Covers inputs, buttons, Polaris controls, clickable roles |
| 2 | Idle does not block controls | `isSaving=false`, target with closest editable selector | returns not blocked | Normal editing remains unchanged |
| 3 | Saving ignores non-controls | `isSaving=true`, target without editable match | returns not blocked | Allows scroll/static content interaction |
| 4 | Explicit allow bypasses lock | `isSaving=true`, target inside `[data-save-lock-allow="true"]` | returns not blocked | Keeps save-bar actions usable if needed |
| 5 | Blocked event is cancelled | cancellable event plus blocked target | preventDefault, stopPropagation, and onBlocked are called | Route capture handlers use this helper |

## Acceptance Criteria

- [x] Helper tests fail before implementation and pass after implementation.
- [x] FPB and PPB configure routes use the helper while their save fetcher is busy.
- [x] Attempted edits during save trigger the save-bar native show/attention state.
