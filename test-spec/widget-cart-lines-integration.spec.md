# Test Spec: Widget Cart Lines Integration
**Spec ID:** widget-cart-lines-integration  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify FPB and PPB cart-line metadata wrappers delegate to the shared cart-line helper while preserving current widget-owned pricing and discount calculations.

## Test Cases

### WidgetCartLinesIntegration

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB source metadata wrapper | Full-page widget source | Calls shared source and visible-label helpers | Preserves FPB visible labels. |
| 2 | PPB source metadata wrapper | Product-page widget source | Calls shared source helper | Preserves PPB private source metadata. |

## Acceptance Criteria

- [x] FPB cart-line metadata wrapper delegates to shared helper.
- [x] PPB cart-line metadata wrapper delegates to shared helper.
- [x] Pricing, discount, selling-plan, and submission logic remain widget-owned.
