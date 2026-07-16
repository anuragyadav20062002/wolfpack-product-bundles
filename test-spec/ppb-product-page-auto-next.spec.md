---
schema_version: 1
id: ppb-product-page-auto-next
title: PPB Product Page Auto-next
type: test-spec
status: active
summary: Verifies product-page auto-next routes in-page templates through their visible step flow instead of the modal bottom-sheet flow.
last_audited: 2026-07-16
owners:
  - engineering
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page/methods/selection-methods.js
  - tests/unit/assets/ppb-product-list-step-conditions.test.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - tdd
  - ppb
keywords:
  - auto-next
---

# Test Spec: PPB Product Page Auto-next
**Spec ID:** ppb-product-page-auto-next  **Created:** 2026-07-16

## Purpose

Prove that product-page auto-next preserves the intended behavior for modal templates while routing Product List/Product Grid in-page templates through the visible in-page step flow.

## Test Cases

### ProductPageSelectionMethods

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product List auto-next after a valid selection | Multi-step in-page Product List context with `autoNextStepOnConditionMet: true`, quantity rule `>= 1`, and one selected product | Calls `navigateCascadeStep(1)` and does not call `_autoProgressBottomSheet` | Guards the source bug found during R15 fixture replay |

## Acceptance Criteria

- [x] All listed test cases pass
