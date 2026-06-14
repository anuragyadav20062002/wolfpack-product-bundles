# Test Spec: fpb-widget-action-busy
**Spec ID:** fpb-widget-action-busy  **Created:** 2026-06-13

## Purpose
Validate that FPB action surfaces block interaction during in-flight requests and swap Next/Add-to-Cart button text with an inline spinner while the request is processing.

## Test Cases

### FPB Widget Busy State

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Set loading state on action button | `_setWidgetBusy(true, actionButton)` called while container exists | Container gets `fpb-widget-busy`, button receives `fpb-inline-spinner-active`, and button innerHTML is spinner markup | Includes desktop and mobile Next buttons |
| 2 | Restore loading state | `_setWidgetBusy(false, actionButton)` after busy state | Busy class removed, spinner removed, and button HTML restored to original text | Ensures non-destructive restore |
| 3 | Prevent re-entrant action while busy | `_withWidgetActionBusy` called twice while first action pending | Second call returns `false` and body not executed | Verifies guard prevents concurrent operations |
| 4 | Show/clear spinner during add-to-cart request | `addBundleToCart(clickedButton)` with mocked async fetch | Busy class and spinner appear immediately, and are removed after promise resolves | Covers desktop/mobile call sites through shared helper |

## Acceptance Criteria

- [ ] Spinner appears in-place on sidebar/mobile action buttons during in-flight add-to-cart/step navigation
- [ ] Widget actions are blocked while busy (`pointer-events` lock + no duplicate actions)
- [ ] Busy state is always cleared after async action completion
