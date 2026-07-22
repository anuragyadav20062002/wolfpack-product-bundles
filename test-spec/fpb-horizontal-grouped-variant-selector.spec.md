---
schema_version: 1
id: fpb-horizontal-grouped-variant-selector
title: "Test Spec: FPB Horizontal Grouped Variant Selector"
type: test-spec
status: active
summary: Verifies that grouped FPB variants use the template-appropriate selector interaction without expanding variants into separate cards.
last_audited: 2026-07-22
owners:
  - storefront
domains:
  - bundles
systems:
  - fpb-widget
source_paths:
  - app/assets/widgets/shared/variant-selector-policy.js
  - app/assets/widgets/shared/variant-selector.js
  - app/assets/widgets/full-page/methods/product-card-footer-methods.js
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - fpb
  - parity
keywords:
  - horizontal grouped variant selector
---

# Test Spec: FPB Horizontal Grouped Variant Selector

**Spec ID:** fpb-horizontal-grouped-variant-selector
**Created:** 2026-07-22

## Purpose

Keep one grouped multi-variant product card while using a dropdown selector in
Horizontal, including an inline mobile interaction that preserves the chosen
variant identity.

## Test Cases

### HorizontalGroupedVariantSelector

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Resolve Horizontal presentation | `HORIZONTAL` preset | Dropdown with inline mobile behavior | Standard and Classic keep their drawer behavior |
| 2 | Open selector on mobile | Grouped multi-variant product at mobile width | Inline option list opens; no drawer is created | Behavioral DOM test only |
| 3 | Choose a variant | Select an available option | Product identity and selected label update | Existing selection callback remains authoritative |

## Acceptance Criteria

- [x] Horizontal renders one grouped product card with a dropdown selector.
- [x] Mobile opens the options inline and does not create the Standard drawer.
- [x] Selecting an available option updates the variant identity and callback.
- [x] Existing Standard, Classic, and Compact selector behavior remains unchanged.
