# Test Spec: PPB Product List Cascade Drawer
**Spec ID:** ppb-product-list-cascade-drawer  **Created:** 2026-07-11

## Purpose
Verify EB-matched Product Page Bundle Product List runtime behavior for the single-step fixture and selected-products drawer.

## Test Cases
### Cascade Single Step Chrome
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Single-step Cascade with one category | `isCascade=true`, one step, one category | Step/category chrome hidden | Matches EB Product List fixture |
| 2 | Multi-category Cascade | `isCascade=true`, one step, two categories | Step/category chrome shown | Merchant category switching remains available |
| 3 | Non-Cascade template | `isCascade=false` | Step/category chrome shown | Other PPB templates unchanged |

### Cascade Selected Drawer
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | No selected products | `selectedEntries=[]` | Drawer closed, no selected heading | Empty footer remains compact |
| 2 | Selected products exist | one selected entry | Drawer stays collapsed by default, selected count is kept out of the visible pill text | Matches EB open-state proof where the count node is hidden |
| 3 | Toggle selected drawer | selected products, collapsed drawer | First click expands, second click collapses, no selected products never expands | Matches EB `View Bundle Items` behavior |
| 4 | Selected row display data | selected product, quantity, price formatter | Title includes `x n`, price is present, quantity label uses `x n` | Matches EB drawer row text shape |
| 5 | Selected row renderer | caller-provided quantity label | Quantity label renders exactly as provided | Keeps Product List EB spacing without changing other callers |
| 6 | Cascade footer ATC ownership | ATC button outside Cascade footer | Button is moved into the Cascade footer | Matches EB footer DOM order |
| 7 | Drawer affordance styling | selected products, Product List footer | Pill includes a chevron, drawer uses white background with top border, remove icon is red, and open animation follows EB's slower timing | Visual proof via Chrome DevTools MCP |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Existing banned source-grep test in this area is removed
