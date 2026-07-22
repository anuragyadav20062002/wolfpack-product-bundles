---
schema_version: 1
id: fpb-compare-at-setting-control
title: "Test Spec: FPB Compare-at Setting Control"
type: test-spec
status: active
summary: Verifies the FPB compare-at control and storefront product-representation gates.
last_audited: 2026-07-22
owners:
  - Wolfpack Product Bundles
domains:
  - admin-configure
systems:
  - full-page-bundle
source_paths:
  - app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/sections/BundleSettingsSummaryText.tsx
  - app/assets/widgets/full-page/methods/product-card-footer-methods.js
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - fpb
  - compare-at-price
keywords:
  - showCompareAtPrices
  - Bundle Settings
---

# Test Spec: FPB Compare-at Setting Control

**Spec ID:** fpb-compare-at-setting-control  **Created:** 2026-07-22

## Purpose

Expose the already-persisted FPB compare-at visibility state through the merchant-facing Bundle Settings surface.

## Test Cases

### FpbCompareAtSettingControl

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Persisted setting enabled | `showCompareAtPrices: true` | The Show Compare At Price control renders checked | Uses the existing state and save path |
| 2 | Persisted setting disabled | `showCompareAtPrices: false` | The Show Compare At Price control renders unchecked | No fallback or legacy key |
| 3 | Storefront compare-at disabled | Sale product plus `showProductComparedAtPrice: false` | Card omits compare-at price | Product data and visibility are independent gates |
| 4 | Storefront compare-at enabled | Sale product plus `showProductComparedAtPrice: true` | Card renders compare-at price | Uses canonical storefront DTO key |
| 5 | Grouped unavailable variant | Grouped product with two sellable variants and one unavailable variant | Every FPB preset omits the unavailable option | Keeps the surviving variant identities |

## Acceptance Criteria

- [x] Both persisted states render correctly.
- [x] Changing the control marks the configure flow dirty and uses the existing setter.
- [x] Storefront cards honor the canonical compare-at visibility flag.
- [x] Grouped selectors omit unavailable variants in all four presets.
- [x] Focused behavior tests pass.
