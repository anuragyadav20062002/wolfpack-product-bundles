---
schema_version: 1
id: cart-transform-fail-closed-validation
title: Cart Transform Fail-Closed Activation
type: test-spec
status: active
summary: Verify every Wolfpack CartTransform blocks cart and checkout operations when Shopify cannot execute bundle pricing.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - checkout
systems:
  - cart-transform
source_paths:
  - app/services/cart-transform-service.server.ts
related_docs:
  - internal docs/Architecture/Cart Transform Function.md
tags:
  - shopify-function
  - pricing-safety
keywords:
  - cart transform timeout
  - fail closed
  - blockOnFailure
---

# Test Spec: Cart Transform Fail-Closed Activation

**Spec ID:** cart-transform-fail-closed-validation  **Created:** 2026-07-14

## Purpose

Prevent Shopify from accepting ordinary component pricing when Cart Transform execution fails, times out, or exceeds its resource limits.

## Test Cases

### CartTransformService

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | New transform activation | No CartTransform exists | Create with `blockOnFailure: true` | Shopify blocks cart/checkout when the Function fails. |
| 2 | Compliant existing transform | Rust transform has `blockOnFailure: true` | Reuse without recreation | Idempotent retry. |
| 3 | Unsafe existing transform | Rust transform has `blockOnFailure: false` | Delete and recreate with `blockOnFailure: true` | Repairs the prior default safely. |
| 4 | Stale transform | Transform points to another Function | Delete and recreate with `blockOnFailure: true` | Preserves existing replacement behavior. |
| 5 | Unsafe transform deletion fails | Delete returns an error | Return failure without creating | Do not leave two transforms or report setup success. |
| 6 | Creation fails | No transform exists and create returns an error | Return failure | Do not report setup success. |

## Acceptance Criteria

- [x] Every newly created CartTransform sets `blockOnFailure: true`.
- [x] Existing transforms with the unsafe default are repaired idempotently.
- [x] Existing compliant transforms and normal successful pricing behavior remain unchanged.
- [x] Focused Jest, related regression tests, Admin GraphQL validation, scoped lint, and Graphify pass.
