# Test Spec: PPB Vertical Filled Row
**Spec ID:** ppb-vertical-filled-row  **Created:** 2026-07-13

## Purpose

Keep full selected-product titles in Vertical Slots while preserving compact
title behavior for the other PPB templates.

## Test Cases

### SelectedSlotTitle

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Vertical Slots long title | long title, vertical true | full title | CSS owns containment |
| 2 | Other template long title | long title, vertical false | 25 chars plus ellipsis | Preserve existing card behavior |
| 3 | Short title | short title | unchanged | Both modes |

## Acceptance Criteria

- [ ] Vertical Slots never truncates selected titles in JavaScript.
- [ ] Other template title behavior remains unchanged.
- [ ] Focused test passes.
