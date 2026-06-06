# Test Spec: FPB Page URL Theme Shell
**Spec ID:** fpb-page-url-theme-shell  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Ensure full-page bundle creation returns the Shopify page URL so the storefront inherits the store theme header and footer.

## Test Cases
### CreateFullPageBundle
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Created FPB page returns storefront URL | Page handle `my-kit` | `https://test-shop.myshopify.com/pages/my-kit` | Prevents app-proxy URL from bypassing theme shell |
| 2 | Created FPB page contains widget bootstrap | Bundle ID `bundle-abc123` | Page body contains widget container and full-page widget assets | Ensures page URL still renders the bundle |
| 3 | Existing preview page is reopened | Stored preview page ID | Page body and bundle config are refreshed before returning URL | Prevents stale blank preview pages |
| 4 | FPB page selects bundle by explicit bundle ID | `bundleType=full_page`, no current product context | Bundle is selected even if widget targeting exists | Prevents product-page targeting rules from hiding FPB pages |

## Acceptance Criteria
- [ ] FPB page creation result uses `/pages/{handle}`.
- [ ] FPB page body renders the full-page widget from the Shopify page content area.
- [ ] Existing preview/promoted pages refresh the widget body before opening.
- [ ] FPB runtime selection ignores product-page targeting when an explicit FPB bundle ID is present.
- [ ] Existing slug and page creation contracts remain intact.
