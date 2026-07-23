---
schema_version: 1
id: condition-validator
title: Condition Validator
type: test-spec
status: active
summary: Defines behavior coverage for shared storefront step and category rule validation.
last_audited: 2026-07-22
owners:
  - storefront
domains:
  - bundle-rules
systems:
  - storefront-widget
source_paths:
  - app/assets/widgets/shared/condition-validator.js
  - tests/unit/assets/condition-validator.test.ts
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - fpb
  - validation
keywords:
  - no-rule
  - step-condition
---

# Test Spec: Condition Validator
**Spec ID:** condition-validator  **Created:** 2026-06-29

## Purpose
Verify shared storefront step/category rule validation for quantity, amount, and weight rules.

## Test Cases

### ConditionValidator
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Category quantity rule | Category with quantity condition and selected product quantities | Rule is satisfied only when category quantity threshold is met | Existing coverage |
| 2 | Category amount rule | Category with amount condition and selected product amounts | Rule is satisfied when selected category amount reaches the configured amount threshold | P04 regression |
| 3 | Category weight rule | Category with weight condition and selected product weights in grams | Rule is satisfied when selected category weight reaches the configured weight threshold | P12 regression |
| 4 | No step rule | Step has null condition fields but retained min/max persistence fields | Empty selection is valid and Next may proceed | F2 no-rule parity regression |

## Acceptance Criteria
- [x] All listed test cases pass.
