# Test Spec: FPB Compact Runtime CSS
**Spec ID:** fpb-compact-runtime-css  **Issue:** waived  **Created:** 2026-06-11

## Purpose
Move FPB Compact preset layout styles out of JS inline style injection and into the modular full-page CSS asset.

## Test Cases
### CompactCssOwnership
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | No Compact style tag | Compact template source | No `wpb-fpb-compact-runtime-styles` style id or style append contract remains | Other FPB templates still own their current runtime styles |
| 2 | CSS owns Compact layout | `side-footer-compact.css` | COMPACT wrapper, card dimensions, and mobile rules are present | Preserves existing storefront layout contract |

## Acceptance Criteria
- [x] Focused Jest contract passes
- [x] Raw JS syntax checks pass
- [x] Widget build and CSS minification pass
- [x] ESLint reports zero errors for modified test files
