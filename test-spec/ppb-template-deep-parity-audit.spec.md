# Test Spec: PPB Template Deep Parity Audit
**Spec ID:** ppb-template-deep-parity-audit  **Issue:** [ppb-template-deep-parity-audit-1]  **Created:** 2026-06-04

## Purpose
Verify PPB Product List CASCADE parity hardening while preserving Product Grid, Horizontal Slots, and Vertical Slots contracts.

## Test Cases
### ProductPageWidgetTemplateContracts
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product List CASCADE source structure | `app/assets/bundle-widget-product-page.js`, `cascade-template.js`, `inpage-cascade.css` | EB CASCADE aliases and measured layout hooks are present | Fresh live EB Product List evidence |
| 2 | Product Grid isolation | Existing COGNIVE module/CSS | COGNIVE dedicated module and responsive grid hooks remain present | Prior live evidence |
| 3 | Modal templates isolation | MODAL/SIMPLIFIED CSS/module | Horizontal and Vertical slot contracts remain present | Prior live evidence |
| 4 | Build output | Widget build/minify | Generated product-page bundle and CSS include changes under Shopify asset size limits | Deployable assets |

## Acceptance Criteria
- [x] Focused Jest contract test passes
- [x] Raw JS syntax checks pass
- [x] Widget build and CSS minification pass
- [x] ESLint reports zero errors for modified files
