# Test Spec: Cart Transform Runtime Token Category Validation
**Spec ID:** cart-transform-runtime-token-category-validation  **Created:** 2026-07-08

## Purpose
Ensure runtime token validation accepts buyer-selected variants from every persisted full-page category product cache shape used by the storefront widget.

## Test Cases
### CartTransformRuntimeTokenService
| # | Scenario | Input | Expected Output | Notes |
| 1 | Category selectedProducts variant | StepCategory.selectedProducts with variant id | Selection validates | Mirrors persisted FPB category contract |
| 2 | Runtime category alias variant with gid | step.categories product variant.gid | Selection validates | Mirrors public runtime bundle config shape |
| 3 | Invalid outside variant | Unknown selected variant | Validation throws | Keeps Shopify-safe signed-token boundary |

## Acceptance Criteria
- [ ] All listed test cases pass
