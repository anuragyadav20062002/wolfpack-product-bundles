# Test Spec: Disabled Pricing Progress
**Spec ID:** pricing-disabled-progress  **Created:** 2026-07-13

## Purpose

Ensure saved discount rules remain inert when the pricing master toggle is off.

## Test Cases

### PricingCalculatorDisabledProgress

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Disabled pricing retains rules | `pricing.enabled=false`, quantity rules present | `getNextDiscountRule()` returns `null` | Prevents progress and discount UI while preserving merchant rules for re-enable |

## Acceptance Criteria

- [x] Disabled pricing never exposes a next discount rule.
