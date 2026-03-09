# Issue: Ad-Ready Bundle Infrastructure — Phase 1: Feed-Ready Product Enhancement

**Issue ID:** ad-ready-feed-ready-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-09
**Last Updated:** 2026-03-09 14:00

## Overview

Make Wolfpack bundle products visible to ad platforms (Google Shopping, Meta Catalog, TikTok Shop) by fixing two root issues:
1. Bundle variant price is `"0.00"` → calculated bundle price
2. Bundle variant `inventoryManagement` is `null` → `"SHOPIFY"` with synced inventory

## Related Documentation
- Business Requirement: `docs/ad-ready-bundles/00-BR.md`
- PO Requirements: `docs/ad-ready-bundles/02-PO-requirements.md`
- Architecture: `docs/ad-ready-bundles/03-architecture.md`
- SDE Plan: `docs/ad-ready-bundles/04-SDE-implementation.md`
- Breaking Changes: `docs/ad-ready-bundles/BREAKING-CHANGES.md`

## Progress Log

### 2026-03-09 14:00 - Starting Phase 1: Inventory Calculation Engine
- Writing failing tests for inventory sync service
- Files to create: `app/services/bundles/inventory-sync.server.ts`, `tests/unit/services/inventory-sync.test.ts`
- Expected: Pure calculation functions + Shopify API wrappers for inventory management

### 2026-03-09 15:30 - Completed Phases 1-4: Core Implementation
- ✅ Created `app/services/bundles/inventory-sync.server.ts` — Core inventory sync engine with calculateMinInventory, calculateBundleInventory, setInventoryLevel, syncBundleInventory
- ✅ Created `app/services/webhooks/handlers/inventory.server.ts` — Webhook handler for inventory_levels/update
- ✅ Created `tests/unit/services/inventory-sync.test.ts` — 12 tests for inventory calculation + sync
- ✅ Created `tests/unit/services/inventory-webhook.test.ts` — 6 tests for webhook handler
- ✅ Created `tests/unit/services/pricing-creation.test.ts` — 7 tests for price calculation
- ✅ Modified `app/routes/app/app.dashboard/handlers/handlers.server.ts` — Fixed create + clone to use calculated price + inventoryManagement: "SHOPIFY"
- ✅ Modified `app/routes/app/app.bundles.cart-transform.tsx` — Fixed clone path same way
- ✅ Modified `app/services/webhooks/processor.server.ts` — Added inventory_levels/update case
- ✅ Modified `prisma/schema.prisma` — Added inventorySyncedAt + inventoryStaleAt to Bundle
- ✅ Modified `shopify.app.toml` — Added scopes (read_inventory, write_inventory, read_orders) + webhook topic
- All 26 new tests pass, 0 regressions (14 pre-existing failures unchanged)
- Next: Phase 5 (migration API route), then commit

## Phases Checklist
- [x] Phase 1: Inventory calculation engine (tests + implementation)
- [x] Phase 2: Webhook handler for inventory updates (tests + implementation)
- [x] Phase 3: Fix bundle creation price + inventory management (tests + implementation)
- [x] Phase 4: Schema + config changes (Prisma + shopify.app.toml)
- [x] Phase 5: Migration API route for existing bundles (`POST /api/migrate-bundles`)
