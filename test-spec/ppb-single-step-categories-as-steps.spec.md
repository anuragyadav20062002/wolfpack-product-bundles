# Test Spec: PPB Single-Step Categories As Steps
**Spec ID:** ppb-single-step-categories-as-steps  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Prove the PPB storefront consumes EB's `useSingleStepCategoriesAsBundleSteps` setting and turns one multi-category step into category-backed visible steps before widget selection state initializes.

## Test Cases
### ProductPageWidget
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | EB setting helper exists | Product page widget source | `ppbExpandSingleStepCategoriesAsSteps` is exported through `window.__bsHelpers` | Keeps runtime behavior testable |
| 2 | Bundle selection uses helper before state setup | Product page widget source | `selectBundle()` wraps `BundleDataManager.selectBundle(...)` with the helper | Ensures selectedProducts/stepProductData indexes match visible category steps |
| 3 | Category clones keep only one category | Product page widget source | Helper maps `categories` to `categories: [category]` | Prevents category tabs from rendering on expanded steps |

## Acceptance Criteria
- [ ] Source exposes the helper for focused unit coverage.
- [ ] Bundle selection applies expansion before `initializeDataStructures()`.
- [ ] Widget assets are rebuilt after version bump.
