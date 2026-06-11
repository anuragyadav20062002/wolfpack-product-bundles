# Test Spec: PPB Shared Discount Progress
**Spec ID:** ppb-discount-progress-shared  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify PPB footer/bottom-sheet discount progress uses the shared progress primitive while preserving existing PPB CSS class hooks.

## Test Cases

### PPBSharedDiscountProgress

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB footer progress | `renderFooter()` source | Shared progress renderer with PPB class hooks | Pricing/message calculation remains in widget. |

## Acceptance Criteria

- [x] PPB footer progress uses `getDiscountProgressData()`.
- [x] PPB footer progress DOM uses `renderDiscountProgress()`.
- [x] Existing PPB progress classes remain in the rendered DOM.
