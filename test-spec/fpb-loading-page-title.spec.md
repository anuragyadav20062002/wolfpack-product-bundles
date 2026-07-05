# Test Spec: FPB Loading Page Title
**Spec ID:** fpb-loading-page-title  **Created:** 2026-07-02

## Purpose
Prevent the host theme page title from appearing while a full-page bundle is loading.

## Test Cases
### FullPageTitleHiding
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Theme renders a plain H1 in the same Shopify section as the FPB widget | Section contains a text-block H1 and `#bundle-builder-app` | The host H1 block is removed | Covers the loading state captured in Chrome |

## Acceptance Criteria
- [ ] Loading spinner state does not expose the Shopify page H1.
- [ ] Existing widget-rendered bundle content remains untouched.
