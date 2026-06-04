# Test Spec: FPB Proxy Preview Stale URL
**Spec ID:** fpb-proxy-preview-stale-url  **Issue:** [fpb-proxy-preview-stale-url-1]  **Created:** 2026-06-05

## Purpose
Prevent admin preview flows from opening `/apps/product-bundles/wpb/{bundleId}` when a full-page bundle has no linked Shopify page handle. That proxy route now returns a setup error in that state.

## Test Cases
### DashboardPreviewAction
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB has no Shopify page handle | `bundleType=full_page`, `shopifyPageHandle=null` | `{ kind: "create_preview_page" }` | No stale proxy URL |
| 2 | FPB has Shopify page handle | `bundleType=full_page`, `shopifyPageHandle=build-your-box` | Opens `/pages/build-your-box` | No proxy hop |

### WizardPreviewUrl
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB has page handle | `pageHandle=build-your-box` | `/pages/build-your-box` | Avoid stale proxy URL |
| 2 | FPB has no page handle | `pageHandle=null` | `missing_page_handle` error | No fabricated preview URL |

### DashboardResponseHandling
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Preview page response returns `shareablePreviewUrl` | `intent=createPreviewPage` | Opens returned URL | Dashboard waits for server response |

## Acceptance Criteria
- [ ] Dashboard FPB-without-page preview action does not contain a proxy URL.
- [ ] Create wizard FPB preview helper returns a page URL only when a page handle exists.
- [ ] Focused unit tests pass.
