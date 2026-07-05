# Test Spec: FPB Mobile Summary Count Toggle
**Spec ID:** fpb-mobile-summary-count-toggle  **Created:** 2026-07-05

## Purpose
Verify that the Classic compact mobile summary footer preserves the Standard count-badge toggle interaction while retaining Classic footer copy and shell behavior.

## Test Cases
### FPB Standard Mobile Summary Action
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Classic compact summary count badge toggles through the shared tray handler | Classic preset context with compact summary tray collapsed and no selected products | Clicking the count control calls `_toggleCompactMobileSummaryTray(sheet)` | Behavior-only regression; no CSS, class-name, or placement assertions |

## Acceptance Criteria
- [x] The count control toggles Classic compact summary state through the same handler path used by Standard.
- [x] Existing compact summary action tests still pass.
