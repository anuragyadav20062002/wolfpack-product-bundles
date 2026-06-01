# Test Spec: Storefront Asset Strategy
**Spec ID:** storefront-asset-strategy  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Align FPB and PPB storefront asset loading with EB practice: Shopify theme-extension assets via `asset_url`, app proxy for API/data only.

## Test Cases
### FPBGeneratedPages
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Create FPB page body | `createFullPageBundle` | Body has bundle page marker/metafield-compatible content and no `/apps/product-bundles/assets` JS/CSS | Theme app block loads assets |
| 2 | Refresh preview page body | `getPreviewPageUrl(..., bundleId)` | Refreshed body has no app-proxy JS/CSS | Avoid proxy asset 500s |

### LegacyProxy
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Signed legacy FPB proxy URL with page handle | `/apps/product-bundles/wpb/:bundleId` | Redirects to `/pages/{handle}` | Storefront loads through Shopify theme |
| 2 | Signed legacy FPB proxy URL without page handle | `/apps/product-bundles/wpb/:bundleId` | Returns non-rendering setup response | No proxy asset shell |

### PPB
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product page block | `bundle-product-page.liquid` | Uses `asset_url` for CSS, SDK, and widget JS | Existing EB-aligned path remains |

## Acceptance Criteria
- [ ] No storefront page body path injects `/apps/product-bundles/assets/*.js` or `*.css`.
- [ ] FPB and PPB Liquid blocks remain the storefront asset-loading source.
- [ ] Raw widget JS changes are syntax-checked with `node --check` before commits.
