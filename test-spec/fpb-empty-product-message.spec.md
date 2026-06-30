# Test Spec: FPB Empty Product Message
**Spec ID:** fpb-empty-product-message  **Created:** 2026-06-29

## Purpose
Ensure FPB storefront empty-product states use the runtime language contract instead of a local hardcoded sentence.

## Test Cases
### fullPageProductGridMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Runtime override exists | `_resolveText("noProductsAvailable")` returns custom text | Custom text is used | Covers merchant language settings |
| 2 | No runtime override exists | `_resolveText` returns fallback | `No Products Available` | Matches EB default copy |

## Acceptance Criteria
- [x] Focused widget behavior test passes.
- [x] Empty-grid rendering still escapes search query copy separately.
