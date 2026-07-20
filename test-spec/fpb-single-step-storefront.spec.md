---
schema_version: 1
id: fpb-single-step-storefront
title: FPB Single-Step Storefront Test Spec
type: test-spec
status: active
summary: Verifies that full-page bundles suppress multi-step navigation chrome when only one enabled shopper stage remains.
last_audited: 2026-07-21
owners:
  - Wolfpack Bundles
domains:
  - storefront
systems:
  - full-page-bundle-widget
source_paths:
  - app/assets/widgets/full-page/methods/initial-render-methods.js
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - fpb
  - parity
  - single-step
keywords:
  - single shopper stage
  - step timeline
  - step subtitle
---

# Test Spec: FPB Single-Step Storefront

**Spec ID:** fpb-single-step-storefront  **Created:** 2026-07-21

## Purpose

Keep navigation-only step chrome out of a full-page bundle when filtering leaves one shopper stage, while retaining it for genuinely multi-stage flows.

## Test Cases

### FullPageSingleStepStorefront

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | One enabled shopper stage | One step | `false` | Timeline and step subtitle are unnecessary |
| 2 | Two enabled shopper stages | Two steps | `true` | Multi-step orientation remains visible |
| 3 | Product step plus add-on stage | Product and add-on steps | `true` | Add-on is a real shopper stage |
| 4 | Missing or malformed steps | Missing value or non-array | `false` | Fail closed without fabricated stages |

## Acceptance Criteria

- [x] Single-stage FPB storefronts suppress timeline and step subtitle chrome.
- [x] Multi-stage FPB storefronts retain timeline and step subtitle chrome.
- [x] The decision is shared across Standard, Classic, Compact, and Horizontal.
