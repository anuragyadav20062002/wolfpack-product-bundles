# Test Spec: FPB Horizontal Shared Card
**Spec ID:** fpb-horizontal-shared-card  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify the FPB Horizontal migration slice routes Horizontal product cards through the shared row-mode card primitive.

## Test Cases

### FPBHorizontalSharedCard

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | HORIZONTAL product cards | `createProductCard()` source | Shared card renderer with row mode | Keeps list-like layout intent. |

## Acceptance Criteria

- [x] HORIZONTAL product cards route through `renderSharedProductCard()`.
- [x] Shared card uses row mode for Horizontal only.
