# Test Spec: FPB Compact Shared Card
**Spec ID:** fpb-compact-shared-card  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify the FPB Compact migration slice routes Compact product cards through the shared card primitive.

## Test Cases

### FPBCompactSharedCard

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | COMPACT product cards | `createProductCard()` source | Shared card renderer handles Compact | Keeps existing render ownership. |

## Acceptance Criteria

- [ ] COMPACT product cards route through `renderSharedProductCard()`.
- [ ] Shared card uses grid mode.
