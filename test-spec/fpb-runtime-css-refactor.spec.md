# Test Spec: FPB Runtime CSS Refactor
**Spec ID:** fpb-runtime-css-refactor  **Issue:** [fpb-runtime-css-refactor-1]  **Created:** 2026-06-04

## Purpose
Verify static Full Page Bundle runtime styles are owned by CSS classes instead of JS inline style strings.

## Test Cases
### FullPageRuntimeCssOwnership
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Sidebar tier CTA styles | Full-page widget source and CSS | JS creates `fpb-sidebar-tier-cta`; CSS owns dimensions, colors, spacing, typography | Side panel footer |
| 2 | Promo banner background styles | Full-page widget source and CSS | JS sets CSS variables for image/crop only; CSS owns background-image/size/position declarations | Banner image URL remains dynamic |
| 3 | Discount progress width | Full-page widget source and CSS | JS sets a CSS variable; CSS owns `width` on `.fpb-dp-fill` | Progress percentage remains dynamic |
| 4 | Bundle banner image styles | Full-page widget source and CSS | JS creates banner image nodes only; CSS owns responsive display and image sizing | Removes banner style tag injection |

## Acceptance Criteria
- [x] Focused Jest contract fails before implementation
- [x] Focused Jest contract passes after implementation
- [x] Raw JS syntax checks pass
- [x] Widget build and CSS minification pass
- [x] ESLint reports zero errors for modified files
