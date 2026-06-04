# Test Spec: PPB Runtime CSS Refactor
**Spec ID:** ppb-runtime-css-refactor  **Issue:** [ppb-runtime-css-refactor-1]  **Created:** 2026-06-04

## Purpose
Verify static Product Page Bundle runtime styles are owned by CSS classes instead of JS inline style strings.

## Test Cases
### ProductPageRuntimeCssOwnership
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Static default product styles | Product page widget source and CSS | JS uses semantic classes; CSS owns layout and typography | Shared PPB block |
| 2 | Static discount/progress styles | Product page widget source and CSS | JS only sets message text, state class, and dynamic CSS variables | Progress width remains dynamic |
| 3 | Static quantity pill styles | Product page widget source and CSS | JS toggles `bw-qty-pill--active`; CSS owns pill appearance | Active color uses CSS variable |
| 4 | Static gift message styles | Product page widget source and CSS | JS creates fields with classes; CSS owns card/input/counter layout | Copy and values remain runtime |
| 5 | Modal slot static styles | Modal slot template and CSS | JS sets classes and image variables; CSS owns icon/CTA sizing/colors | Slot image URL remains dynamic |

## Acceptance Criteria
- [x] Focused Jest contract fails before implementation
- [x] Focused Jest contract passes after implementation
- [x] Raw JS syntax checks pass
- [x] Widget build and CSS minification pass
- [x] ESLint reports zero errors for modified files
