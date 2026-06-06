# Test Spec: Polaris Prop Type Fixes
**Spec ID:** polaris-prop-type-fixes  **Issue:** [polaris-prop-types-and-ppb-product-list-parity-1]  **Created:** 2026-06-04

## Purpose
Use TypeScript as the regression signal for invalid Polaris web component props in Admin UI files.

## Test Cases
### PolarisPropTypecheck
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Invalid Polaris props are present | `npx tsc --noEmit --pretty false` filtered to `s-*` prop errors | Fails on invalid prop names, prop values, slot names, and refs | Red state captured before fixes |
| 2 | Polaris prop usage is corrected | Same command after fixes | No remaining Polaris `s-*` prop type errors in touched surfaces | Unrelated repo TypeScript errors may remain |

## Acceptance Criteria
- [ ] Invalid `s-*` prop names are replaced with typed prop names.
- [ ] Invalid `s-*` prop values are replaced with valid values.
- [ ] Unsupported React props on `s-*` elements are removed or wrapped outside the web component.
- [ ] Filtered typecheck no longer reports Polaris prop errors for the fixed files.
