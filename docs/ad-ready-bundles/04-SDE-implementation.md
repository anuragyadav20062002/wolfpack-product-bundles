# SDE Implementation Plan: Ad-Ready Bundle Infrastructure — Phase 1

**Inputs:** `00-BR.md`, `02-PO-requirements.md`, `03-architecture.md`

---

## Overview

Phase 1 makes bundle products visible to ad platforms by fixing two root issues:
1. Bundle variant price is `"0.00"` → set to calculated bundle price
2. Bundle variant `inventoryManagement` is `null` → set to `"SHOPIFY"` with synced inventory

All changes are backend-only. No UI changes required.

---

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/services/inventory-sync.test.ts` | MIN formula, edge cases (0 stock, untracked, multi-qty), Shopify API call construction | Pending |
| `tests/unit/services/inventory-webhook.test.ts` | Find affected bundles, mark stale, debounce, no-op for non-bundle products | Pending |
| `tests/unit/services/pricing-creation.test.ts` | Price calculation for all discount methods during creation | Pending |

---

## Phase 1: Inventory Calculation Engine (Pure Logic + Shopify API)

**Tests (Red):**
- `tests/unit/services/inventory-sync.test.ts`
  - `calculateMinInventory`: MIN formula with qty 1, multi-qty (floor division), 0 stock, untracked components, all untracked (→999), empty array (→0)
  - `calculateBundleInventory`: Full flow — queries component inventory, calculates MIN, returns result
  - `setInventoryLevel`: Constructs correct `inventoryAdjustQuantities` mutation

**Implementation (Green):**
- `app/services/bundles/inventory-sync.server.ts` — Core sync engine

---

## Phase 2: Webhook Handler for Inventory Updates

**Tests (Red):**
- `tests/unit/services/inventory-webhook.test.ts`
  - Given inventory update for product in a bundle → marks bundle stale, triggers sync
  - Given inventory update for product NOT in any bundle → no-op
  - Given bundle already recalculated < 60s ago → skipped (debounce)
  - Given handler failure → returns error result, does not crash

**Implementation (Green):**
- `app/services/webhooks/handlers/inventory.server.ts` — Webhook handler
- `app/services/webhooks/processor.server.ts` — Add `inventory_levels/update` case

---

## Phase 3: Fix Bundle Creation Price + Inventory Management

**Tests (Red):**
- `tests/unit/services/pricing-creation.test.ts`
  - percentage_off → price = component_sum * (1 - discount/100)
  - fixed_amount_off → price = component_sum - fixed_amount
  - fixed_bundle_price → price = fixed_price
  - no discount → price = component_sum
  - no products → price = "0.01" (minimum)

**Implementation (Green):**
- `app/services/bundles/pricing-calculation.server.ts` — Extend `calculateBundlePrice` to handle all discount methods
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` — Fix `handleCreateBundle` and `handleCloneBundle`
- `app/routes/app/app.bundles.cart-transform.tsx` — Fix clone path

---

## Phase 4: Schema + Config Changes (No Tests Required)

- `prisma/schema.prisma` — Add `inventorySyncedAt` and `inventoryStaleAt` to Bundle model
- `shopify.app.toml` — Add `write_inventory,read_inventory,read_orders` scopes + `inventory_levels/update` webhook topic

---

## Phase 5: Migration API Route

- `app/routes/api.migrate-bundles.ts` — Protected route to batch-update existing bundles
  - Idempotent: safe to re-run
  - Logs summary: total/success/failed/skipped

---

## Build & Verification Checklist

- [ ] All new tests pass (`npm test`)
- [ ] No regressions in existing tests
- [ ] TypeScript compiles without new errors
- [ ] Prisma migration generated and applied
- [ ] Manual test: create bundle → verify price != $0, inventory tracked
- [ ] Manual test: change component stock → verify bundle inventory recalculates

## Rollback Notes

- Revert variant price to `"0.00"` via migration script
- Revert `inventoryManagement` to `null` via migration script
- Remove webhook topic from `shopify.app.toml` and redeploy
- Drop new Prisma fields via down migration
