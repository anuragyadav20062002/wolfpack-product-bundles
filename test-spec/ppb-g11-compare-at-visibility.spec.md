# Test Spec: PPB G11 Compare-at Visibility
**Spec ID:** ppb-g11-compare-at-visibility  **Created:** 2026-07-16

## Purpose

Verify Product Page Bundle storefront product cards honor the runtime compare-at visibility control.

## Test Cases

### ProductListCompareAtVisibility
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product List compare-at disabled | CASCADE row product with sale + compare-at price and `_shouldShowProductComparedAtPrice() === false` | Current price renders; compare-at price does not render | Covers shared-card Product List path |
| 2 | Product List compare-at enabled | CASCADE row product with sale + compare-at price and `_shouldShowProductComparedAtPrice() === true` | Current price and compare-at price render | Guards the enabled state |

## Acceptance Criteria

- [x] Product List compare-at disabled case passes.
- [x] Product List compare-at enabled case passes.
- [x] Focused PPB asset tests pass.
