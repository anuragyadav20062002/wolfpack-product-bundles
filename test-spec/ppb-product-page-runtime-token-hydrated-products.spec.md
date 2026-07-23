---
schema_version: 1
id: ppb-product-page-runtime-token-hydrated-products
title: PPB Product Page Runtime Token Hydrated Products
type: test-spec
status: active
summary: Verifies product-page runtime token validation accepts hydrated variant IDs for configured category products without weakening product membership checks.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
  - cart-transform
source_paths:
  - app/services/cart-transform-runtime-token.server.ts
  - app/assets/widgets/product-page/methods/cart-methods.js
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - runtime-token
keywords:
  - cart-transform-runtime-token
  - hydrated-products
---

# Test Spec: PPB Product Page Runtime Token Hydrated Products
**Spec ID:** ppb-product-page-runtime-token-hydrated-products  **Created:** 2026-07-15

## Purpose

Prevent Product Grid cart adds from failing when persisted PPB category products contain product IDs but their variant arrays are populated later by storefront hydration.

## Test Cases

### RuntimeTokenService
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Configured category product has no cached variants | Component variant ID plus matching product ID | Component is accepted and normalized | Product ID is validation-only |
| 2 | Selection claims a product outside the bundle | Component variant ID plus unconfigured product ID | Selection is rejected | Prevents broad variant acceptance |
| 3 | Runtime token payload uses validation-only product ID | Build token from matching product ID selection | Payload components omit product ID | Keeps cart-transform payload contract narrow |

### RuntimeTokenRoute
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product-page route receives hydrated product selection | Component includes numeric variant ID and configured product GID | Route returns signed token | Matches browser payload shape |

## Acceptance Criteria
- [ ] Focused runtime token service tests pass.
- [ ] Focused runtime token route tests pass.
- [ ] Product-page widget sends a validation-only product ID with runtime token requests.
- [ ] Widget bundle is rebuilt with a patch `WIDGET_VERSION` bump.
