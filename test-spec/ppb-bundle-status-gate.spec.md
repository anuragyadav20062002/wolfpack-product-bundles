# Test Spec: PPB Bundle Status Gate
**Spec ID:** ppb-bundle-status-gate  **Created:** 2026-07-15

## Purpose

Verify that saving a Product Page Bundle preserves the merchant-selected Wolfpack bundle status. Configured steps must not auto-promote a Draft bundle to Active, because Draft is the storefront runtime gate.

## Test Cases

### PpbSaveBundleStatus
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Draft bundle with directly selected products | `bundleStatus=draft`, `stepsData[0].StepProduct` populated | Database update persists `status: draft` | Prevents configured products from bypassing inactive status |
| 2 | Draft bundle with category products | `bundleStatus=draft`, `stepsData[0].StepCategory[0].products` populated | Database update persists `status: draft` | Category-based configuration must preserve the explicit status |
| 3 | Active bundle save | `bundleStatus=active` | Database update persists `status: active` | Confirms active saves still remain public |

## Acceptance Criteria

- [ ] All listed test cases pass
- [ ] PPB Draft status remains the storefront runtime gate after save
