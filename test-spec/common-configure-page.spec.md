# Test Spec: Common Configure Page
**Spec ID:** common-configure-page  **Created:** 2026-07-11

## Purpose
Verify the shared FPB/PPB configure page model and dispatch behavior without asserting on CSS, source layout, class names, or visual placement.

## Test Cases
### ConfigureAdminModel
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB section list | `bundleType: full_page` | Common setup sections with no PPB-only subscriptions section | Adapter contract |
| 2 | PPB section list | `bundleType: product_page` | Common setup sections plus PPB-only subscriptions | Adapter contract |
| 3 | FPB visibility children | `bundleType: full_page` | Bundle Widget child only | Adapter contract |
| 4 | PPB visibility children | `bundleType: product_page` | Bundle Widget and Bundle Embed children | PPB-only behavior |
| 5 | FPB bundle link | linked page handle and page URL | Link model returns page URL and linked state | Visibility behavior |
| 6 | PPB bundle link | shop plus product handle | Link model returns product URL and linked state | Visibility behavior |
| 7 | App embed status parity | enabled and disabled states for both types | Same enabled/disabled label and tone per state | Shared status model |
| 8 | Locale action gate | empty and non-empty locales | Empty locales disable multi-language action | Behavior helper |

### ConfigureActionDispatch
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB syncBundle dispatch | `intent=syncBundle` | Shared storefront-sync action called with `full_page` | Existing route URL preserved |
| 2 | PPB syncBundle dispatch | `intent=syncBundle` | Shared storefront-sync action called with `product_page` | Existing route URL preserved |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Banned source-grep configure UI contract tests are removed or replaced
- [ ] Focused Jest and lint pass for touched files
