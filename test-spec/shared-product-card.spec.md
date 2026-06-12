# Test Spec: Shared Product Card Contract
**Spec ID:** shared-product-card  **Issue:** none  **Created:** 2026-06-11

## Purpose

Create the Loop 4 shared product-card primitive before migrating templates.

## Test Cases

### SharedProductCard
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Renders unselected card | product, quantity `0`, mode `grid` | stable `data-bw-product-card` root, media/title/price/action regions, add button in action region | No selected overlay layout dependency |
| 2 | Renders selected card | product, quantity `2` | same action region contains quantity controls instead of add button | Add and qty swap inside same reserved area |
| 3 | Renders row mode | product, mode `row` | root has `bw-product-card--mode-row` | Needed for PPB List/FPB Horizontal |
| 4 | Escapes merchant/product text | product title with HTML | escaped title and alt text | Prevents innerHTML injection |
| 5 | Quantity control supports disabled increase | quantity input with `increaseDisabled` | plus button has `disabled aria-disabled="true"` | Stock/rule clamp compatibility |

### WidgetBuildSharedModules
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Build script inlines shared product-card modules | `scripts/build-widget-bundles.js` | `quantity-control.js` before `product-card.js` in widget shared modules | Product card imports quantity control |

### CSSContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB and PPB base CSS reserve product-card action area | raw CSS files | `.bw-product-card__action` with stable min-height | Prevent selected-state height jumps |

## Acceptance Criteria

- [x] Product card and quantity control tests pass.
- [x] Build module inclusion test passes.
- [x] FPB and PPB raw CSS include the shared card action contract.
