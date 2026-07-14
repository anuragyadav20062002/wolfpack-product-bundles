---
schema_version: 1
id: fpb-product-card-description
title: FPB Product Card Description
type: test-spec
status: completed
summary: Verifies that FPB cards omit merchant descriptions while retaining description data for product details.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - storefront
systems:
  - full-page-bundle-widget
source_paths:
  - app/assets/widgets/full-page/methods/product-card-footer-methods.js
related_docs:
  - internal docs/Architecture/Product Card Layout Contract.md
tags:
  - fpb
  - product-card
keywords:
  - product description
  - product details modal
---

# Test Spec: FPB Product Card Description

**Spec ID:** fpb-product-card-description  **Created:** 2026-07-14

## Purpose

Keep Shopify product descriptions available for the FPB product-details modal without rendering them inside storefront product cards.

## Test Cases

### FPBProductCardDescription

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB card receives a product with a description | Product with title, price, image, and merchant description | Card output omits the description text and description element | Description remains on the product object for modal rendering |

## Acceptance Criteria

- [x] FPB storefront product cards do not render Shopify product descriptions.
- [x] Product description data remains available to the product-details modal.
- [x] Desktop and mobile storefront cards are verified after a cache-bypassing reload.
