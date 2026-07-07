# Test Spec: Page URL Slug Save
**Spec ID:** page-url-slug-save  **Created:** 2026-07-07

## Purpose
Ensure full-page bundle page URL slugs typed in the UI are normalized before Shopify page creation or rename, so merchant-friendly input does not fail save.

## Test Cases
### FullPageBundleSlugPersistence
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Create page with human-formatted slug | `My Kit URL` | `resolveUniqueHandle` receives `my-kit-url` | Prevents Shopify handle validation errors during first placement |
| 2 | Rename existing page with human-formatted slug | `New Kit URL` | `resolveUniqueHandle` receives `new-kit-url` and current handle | Prevents Shopify handle validation errors during save |
| 3 | Route rename handler receives human-formatted slug | `New Kit URL` | Service is called with `new-kit-url` | Keeps route boundary defensive |

## Acceptance Criteria
- [x] All listed test cases pass.
- [x] Existing slug adjusted and page URL behavior remains unchanged.
