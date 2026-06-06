# Test Spec: Product Page Theme Editor Deep Link
**Spec ID:** product-page-theme-editor-deep-link  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Lock PPB Place Widget theme-editor deep-link behavior so the merchant-selected product template from server data is used without hardcoded template-name resolution.

## Test Cases
### ProductPageAdminSections
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Any merchant product template link | Server-returned template with arbitrary product-template handle | Theme editor URL uses that handle unchanged, bundle ID, and product preview path | No template-name resolution |
| 2 | Merchant-selected custom product template link | Server-returned template with `handle=product.custom-merch-template` | Theme editor URL uses `template=product.custom-merch-template` unchanged | Proves arbitrary product template handles pass through |
| 3 | Server listing source | Published theme contains product template assets | Modal data contains only those product templates; no generated bundle-container or fallback rows | Proves server lists store templates only |
| 4 | Template display names | Theme asset key resolves to arbitrary product-template name | Modal title uses the asset-derived template name unchanged | No hardcoded `Default product`, `Cart transform`, or suffix title-casing |

## Acceptance Criteria
- [ ] Deep link unit tests pass.
- [ ] Chrome e2e shows Place Widget loading on the button first, then opens a ready modal listing templates returned by the server.
- [ ] Clicking a listed template opens Theme Editor with that selected template handle.
