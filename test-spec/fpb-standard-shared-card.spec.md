# Test Spec: FPB Standard Shared Card
**Spec ID:** fpb-standard-shared-card  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify the first FPB Standard migration slice routes Standard product cards through the shared card renderer while keeping other templates on the existing renderer.

## Test Cases

### FPBStandardSharedCard

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | STANDARD preset card render path | `createProductCard()` source | Shared renderer under `STANDARD` branch | Keeps blast radius scoped to Standard. |

## Acceptance Criteria

- [ ] STANDARD product cards use `renderSharedProductCard()`.
- [ ] Shared card receives grid mode.
- [ ] Merchant add-button text setting is preserved.
