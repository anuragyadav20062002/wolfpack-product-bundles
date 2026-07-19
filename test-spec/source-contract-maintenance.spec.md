---
schema_version: 1
id: source-contract-maintenance
title: Source Contract Maintenance Test Spec
type: test-spec
status: active
summary: Keeps widget and Admin i18n contract tests aligned with current documented behavior.
last_audited: 2026-07-20
owners:
  - engineering
domains:
  - storefront
  - admin
systems:
  - widgets
  - i18n
source_paths:
  - tests/unit/assets
  - tests/unit/i18n
related_docs:
  - internal docs/Architecture/Cart Transform Function.md
  - internal docs/EB Implementation Reference.md
tags:
  - contract-tests
keywords:
  - add-ons
  - cart-properties
  - translation-keys
---

# Test Spec: Source Contract Maintenance
**Spec ID:** source-contract-maintenance  **Created:** 2026-07-20

## Purpose
Verify source-reading contracts against the current widget behavior and visible Admin translation usage.

## Test Cases
### CurrentContracts
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Chargeable PPB add-on | Add-on tier with a discount | Cart line uses add-on metadata, not the legacy free-gift path | Matches runtime-token architecture |
| 2 | PPB visible totals | Base and add-on discounts | Combined final price is used by the CTA and total pill | No obsolete local-variable assertion |
| 3 | FPB cart metadata | Bundle quantity display disabled | Public Box property is omitted | Matches documented EB behavior |
| 4 | Selected Product List row | Quantity is two | Quantity label renders as x2 | Current parity format |
| 5 | Admin route copy | Billing and create routes | Tests require only translation keys rendered by the current routes | Removed UI keys are not retained |

## Acceptance Criteria
- [x] All six previously failing assertions pass
- [x] Locale catalogs remain key-compatible
