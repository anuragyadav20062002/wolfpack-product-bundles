# Test Spec: PPB Modal Card and Toast Parity
**Spec ID:** ppb-modal-card-toast-parity  **Created:** 2026-07-13

## Purpose

Preserve the rule-derived modal validation message and stable selected-card action copy used by Horizontal and Vertical slot product pickers.

## Test Cases

### ProductPageModalCopy

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Configured selected copy | quantity 1; `Added x{{allowedQuantity}}` | `Added x1` | Merchant-authored token interpolation |
| 2 | Default selected modal copy | quantity 2; no configured replacement | `Added x2` | Keeps the card action quantity-aware |
| 3 | Greater-than-or-equal step is blocked | quantity rule `>= 2` | `Add at least 02 products on this step` | Matches live EB modal validation |
| 4 | Exact step is blocked | quantity rule `= 1` | `Add exactly 01 products on this step` | Preserves exact-rule wording |
| 5 | Initially empty card becomes selected | quantity changes from 0 to 1 | Selected marker is created and inserted into the card | Incremental updates must not depend on initial markup |

## Acceptance Criteria

- [x] Focused behavior tests pass.
- [x] Raw product-page widget source passes syntax checks.
- [x] Widget and minified CSS builds pass.
- [x] Live desktop and mobile modal comparison passes against the hot-reloaded Shopify dev preview.
