---
schema_version: 1
id: fpb-clear-cart-confirmation
title: FPB Clear Cart Confirmation Test Spec
type: test-spec
status: active
summary: Verifies clear-cart confirmation and reset behavior, including restoration of configured default products.
last_audited: 2026-07-21
owners:
  - Wolfpack Bundles
domains:
  - storefront
systems:
  - full-page-bundle-widget
source_paths:
  - app/assets/widgets/full-page/methods/clear-cart-confirmation-methods.js
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - fpb
  - clear-cart
  - default-products
keywords:
  - clear cart
  - preselected product
  - reset selections
---

# Test Spec: FPB Clear Cart Confirmation
**Spec ID:** fpb-clear-cart-confirmation  **Created:** 2026-06-12

## Purpose
Verify that the full-page bundle clear-cart action opens a confirmation dialog on desktop and mobile, preserves selections when dismissed, and uses the existing clear/reset behavior only after confirmation.

## Test Cases
### ClearCartConfirmationMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Open confirmation | Widget with selected products and fake DOM | Dialog is appended and marked open without mutating selections | Covers shared desktop/mobile entry point |
| 2 | Cancel confirmation | Open dialog, click cancel | Dialog closes and selections remain unchanged | Dismiss path |
| 3 | Confirm clear with configured defaults | Open dialog, click Clear Cart | Step 1 resets to configured default quantities; other steps clear; current step and transient filters reset; render hook runs | Mirrors the persisted default-products contract |
| 4 | Confirm clear without configured defaults | Open dialog, click Clear Cart | Every step resets to an empty selection map | No fabricated fallback selection |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Desktop sidebar Clear uses the shared confirmation
- [x] Mobile summary Clear uses the shared confirmation
- [x] Widget source builds and minified assets are refreshed
- [x] Configured default products are restored after confirmation
- [x] Bundles without configured defaults still clear to zero selections
