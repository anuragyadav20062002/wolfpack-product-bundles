---
schema_version: 1
id: fpb-empty-category-navigation
title: FPB Empty Category Navigation
type: test-spec
status: active
summary: Verifies that named empty FPB categories remain available for storefront navigation and empty-state rendering.
last_audited: 2026-07-20
owners:
  - storefront
domains:
  - bundles
systems:
  - full-page-widget
source_paths:
  - app/assets/widgets/full-page/methods/search-category-methods.js
  - tests/unit/assets/bundle-widget-full-page-category-hydration.test.ts
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - fpb
  - parity
  - storefront
keywords:
  - empty category
  - category navigation
---

# Test Spec: FPB Empty Category Navigation

**Spec ID:** fpb-empty-category-navigation  **Created:** 2026-07-20

## Purpose

Keep configured FPB categories in storefront navigation even when they contain no direct products or collections, so the existing empty-product state can render when shoppers activate them.

## Test Cases

### FullPageWidgetCategoryHydration

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Named empty category | Category has an ID and title but empty product, selected-product, and collection arrays | Category entry is retained with empty handle and product-ID arrays | Behavior contract only; no CSS or placement assertion |
| 2 | Active empty category | Step has other products but the active category has no product IDs or collection handles | Product grid renders the existing empty-state copy and no product cards | Prevents empty categories from falling back to every step product |

## Acceptance Criteria

- [x] The new behavior test fails before implementation.
- [x] The focused category-hydration suite passes after implementation.
- [x] No CSS, class-name, or element-placement assertions are added.
