---
schema_version: 1
id: fpb-disabled-step-storefront
title: FPB Disabled Step Storefront Test Spec
type: test-spec
status: active
summary: Verifies that disabled FPB Admin steps are excluded from every shopper flow before rendering and navigation state is initialized.
last_audited: 2026-07-21
owners:
  - storefront
domains:
  - full-page-bundle
systems:
  - storefront-widget
source_paths:
  - app/assets/widgets/full-page/methods/initial-render-methods.js
  - tests/unit/assets/fpb-disabled-step-storefront.test.ts
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - tdd
  - parity
keywords:
  - disabled step
  - shopper timeline
---

# Test Spec: FPB Disabled Step Storefront

**Spec ID:** fpb-disabled-step-storefront  **Created:** 2026-07-21

## Purpose

Ensure a step persisted as disabled in Admin is removed from the shopper step
collection before timeline, navigation, selection, and add-on state are built.

## Test Cases

### Enabled Step Selection

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Mixed enabled states | enabled, disabled, and unspecified steps | enabled and unspecified steps only, in original order | Unspecified preserves current direct-column default semantics |
| 2 | Disabled step between enabled steps | three ordered steps with the middle disabled | first and third steps remain adjacent and ordered | Navigation indices must be contiguous |
| 3 | Invalid step collection | non-array input | empty array | Initialization remains safe |

## Acceptance Criteria

- [x] Disabled steps never enter shopper render/navigation state.
- [x] Remaining steps preserve persisted order.
- [x] No preset-specific exception is introduced.
