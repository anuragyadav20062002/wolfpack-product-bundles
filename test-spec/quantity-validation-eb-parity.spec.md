---
schema_version: 1
id: quantity-validation-eb-parity
title: Quantity Validation EB Parity Test Spec
type: test-spec
status: active
summary: Verifies FPB and PPB quantity validation controls, persistence, and storefront enforcement.
last_audited: 2026-07-23
owners:
  - engineering
domains:
  - storefront
systems:
  - quantity-validation
source_paths:
  - app/assets/bundle-widget-full-page.js
  - app/assets/bundle-widget-product-page.js
related_docs: []
tags:
  - tdd
  - parity
keywords:
  - quantity-validation
  - product-slots
---

# Test Spec: Quantity Validation EB Parity

**Spec ID:** quantity-validation-eb-parity  **Issue:** [quantity-validation-eb-parity-create-preview-placement-1]  **Created:** 2026-06-03

## Purpose

Verify that FPB and PPB Bundle Settings expose EB-aligned Quantity Validation controls, persist their direct contracts, and enforce them in storefront widgets.

## Test Cases

### Quantity Validation Admin

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB card layout | Bundle Settings section | Enable Quantity Validation card includes enable toggle, max quantity field, Product Slots toggle, Slot Icon controls, and pro tip | EB parity |
| 2 | PPB card layout | Bundle Settings section | same controls as FPB | EB parity |
| 3 | Toggle disabled | quantity validation off | max quantity field is disabled and persists `isEnabled: false` | EB default |
| 4 | Toggle enabled | allowed quantity set | persists `validateQuantityPerProduct` with `allowedQuantity` | direct bundle field |
| 5 | Product Slots | toggle changed | persists `productSlotsEnabled` | direct bundle field |
| 6 | Slot Icon | change/reset | uses per-bundle `productSlotIconUrl` only | no DCP control |

### Storefront Runtime

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 7 | PPB quantity validation | max quantity exceeded for product | storefront prevents selecting above allowed quantity | EB behavior |
| 8 | FPB quantity validation | max quantity exceeded for product | storefront prevents selecting above allowed quantity | EB behavior |
| 9 | Product slots disabled | `productSlotsEnabled: false` | empty slot cards are not rendered | EB behavior |
| 10 | Product slots enabled | `productSlotsEnabled: true` | empty slots render with configured Slot Icon or plus fallback | EB behavior |

## Acceptance Criteria

- [x] FPB and PPB Quantity Validation card matches EB control set and structure
- [x] Quantity Validation persists direct bundle-level config
- [x] Product Slots and Slot Icon remain bundle-level only
- [x] Slot Icon does not move into the old Design Control Panel path
- [x] Storefront widgets enforce max per-product quantity when enabled
- [x] Storefront empty slot rendering follows `productSlotsEnabled`
