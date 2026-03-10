# Architecture Decision Record: Feed-Ready Product Enhancement (Ad-Ready Phase 1)

**Inputs:** `docs/ad-ready-bundles/00-BR.md`, `docs/ad-ready-bundles/02-PO-requirements.md`

---

## Context

Wolfpack bundle products are invisible to ad platforms because they have `price: "0.00"` and `inventoryManagement: null`. We need to:

1. Set correct variant prices on creation
2. Enable Shopify inventory tracking on bundle variants
3. Build an inventory sync engine that maintains `bundle_stock = MIN(component_inventory / component_qty)`
4. Trigger recalculation when component inventory changes

## Constraints

- Must not break existing Cart Transform MERGE pricing (uses `percentageDecrease`, ignores parent variant price)
- Must not break existing Cart Transform EXPAND pricing (discount > 0% uses `percentageDecrease`)
- Must work within current stack: Remix + Prisma + Shopify Admin GraphQL API
- Webhook handlers currently have NO GraphQL client access (only Prisma DB operations)
- New OAuth scopes (`write_inventory`, `read_inventory`, `read_orders`) force merchant re-auth
- API version 2025-10 is already in use

## Options Considered

### Option A: Direct GraphQL in Webhook Handler via `unauthenticated.admin()`

**Description:** Import `unauthenticated` from `shopify.server.ts` and call `unauthenticated.admin(shopDomain)` directly in the webhook handler. This provides a full `admin.graphql` client using the stored offline session.

**Verified:** `unauthenticated.admin(shop)` is a first-party Shopify API that:
- Uses the **offline session** stored in Prisma session storage
- Returns the same `admin.graphql` client as `authenticate.admin(request)`
- Does NOT require an active HTTP request or online session
- Is already exported from `shopify.server.ts` (line 140) but unused

**Flow:**
```
inventory_levels/update webhook
  → Webhook processor routes to handler
  → Handler calls unauthenticated.admin(shopDomain)
  → Gets full admin.graphql client from offline session
  → Queries component inventory, calculates MIN, sets bundle inventory
```

**Pros:**
- Simpler — single function, no extra HTTP hop or API route
- Direct data flow, easier to debug and test
- Uses Shopify's official offline session pattern
- `unauthenticated.admin()` is designed exactly for this use case (background jobs, webhooks)

**Cons:**
- Changes the existing webhook handler pattern (all current handlers are DB-only)
- If offline session token has been revoked (app uninstalled), calls will fail (gracefully handled)

**Verdict:** ✅ Recommended

### Option B: Webhook → Internal API Route

**Description:** Webhook handler marks bundles as stale in DB. A separate API route performs the Shopify API calls.

**Pros:**
- Preserves existing webhook handler pattern (DB-only)
- Decouples webhook from API calls

**Cons:**
- Unnecessary indirection — extra HTTP hop, extra route to maintain
- More complex error handling (two failure points)
- `unauthenticated.admin()` eliminates the need for this pattern

**Verdict:** ❌ Rejected — over-engineered given `unauthenticated.admin()` availability

### Option C: Cron-Based Inventory Sync (No Webhooks)

**Description:** Skip the webhook entirely. Run a periodic job (every 5-10 minutes) that queries all active bundles, checks component inventory, and updates bundle inventory if changed.

**Pros:**
- No webhook subscription needed
- Simpler architecture
- Batches all updates efficiently

**Cons:**
- 5-10 minute delay before inventory reflects in feeds (ad platforms may show stale data)
- Wastes API calls checking bundles whose inventory hasn't changed
- Doesn't scale well with many bundles
- No `inventory_levels/update` webhook means no real-time updates

**Verdict:** ❌ Rejected — latency too high for ad feed accuracy

---

## Decision: Option A — Webhook-Triggered Inventory Sync via API Route

**Rationale:**

1. Preserves the existing webhook handler pattern (DB-only operations)
2. Uses the `unauthenticated.admin()` export that already exists in `shopify.server.ts`
3. Decouples webhook acknowledgment from API calls (webhook handler returns quickly)
4. Internal API route provides authenticated context for Shopify GraphQL calls
5. Can debounce recalculations at the DB level (skip if recalculated < 60s ago)

**Architecture Flow:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ BUNDLE CREATION (Route Handler Context)                             │
│                                                                     │
│ handleCreateBundle() / handleCloneBundle()                          │
│   1. Calculate bundle price via calculateBundlePrice()              │
│   2. Create Shopify product with price + inventoryManagement        │
│   3. Calculate initial inventory via inventorySync.calculate()      │
│   4. Set inventory via inventorySync.setInventory()                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ INVENTORY WEBHOOK (inventory_levels/update)                         │
│                                                                     │
│ Webhook Processor → handleInventoryUpdate()                         │
│   1. Extract inventory_item_id from payload                         │
│   2. Find bundles containing this product (via StepProduct → Bundle)│
│   3. For each bundle: set inventoryStaleAt = now() in DB            │
│   4. Fire-and-forget: POST /api/inventory-sync                      │
│      { shopDomain, bundleIds: [...] }                               │
│                                                                     │
│ /api/inventory-sync (API Route)                                     │
│   1. Get admin client via unauthenticated.admin(shopDomain)         │
│   2. For each bundleId:                                             │
│      a. Skip if recalculated < 60s ago (debounce)                   │
│      b. Query component variant inventory levels                    │
│      c. Calculate MIN(stock / qty)                                  │
│      d. Set bundle variant inventory via inventoryAdjustQuantities   │
│      e. Update inventoryStaleAt = null, inventorySyncedAt = now()   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### No New Prisma Models Required

Phase 1 operates entirely on Shopify product data. However, we need two new fields on the Bundle model for inventory sync tracking:

```prisma
model Bundle {
  // ... existing fields ...
  inventorySyncedAt    DateTime?  // Last successful inventory sync timestamp
  inventoryStaleAt     DateTime?  // Set when webhook indicates inventory changed
}
```

These fields enable debouncing (skip if synced < 60s ago) and staleness tracking (know which bundles need recalculation).

### Shopify Product Data Changes

| Field | Before | After |
|-------|--------|-------|
| Variant price | "0.00" | Calculated bundle price (string, e.g., "48.75") |
| Variant inventoryManagement | null | "SHOPIFY" |
| Variant inventoryPolicy | "DENY" | "DENY" (unchanged — bundle is a container) |
| Inventory level | N/A | MIN(component_inventory / component_quantity) |

---

## Files to Modify

| File | Change |
|------|--------|
| `app/routes/app/app.dashboard/handlers/handlers.server.ts` | Fix `price: "0.00"` → calculated price, `inventoryManagement: null` → `"SHOPIFY"`, call inventory sync on creation |
| `app/routes/app/app.bundles.cart-transform.tsx` | Same price/inventory fix for clone path (line 195-197) |
| `app/services/bundles/pricing-calculation.server.ts` | Ensure `calculateBundlePrice()` can be called during creation (verify it handles bundles with no products gracefully) |
| `app/services/webhooks/processor.server.ts` | Add `inventory_levels/update` case to switch statement |
| `prisma/schema.prisma` | Add `inventorySyncedAt` and `inventoryStaleAt` fields to Bundle model |
| `shopify.app.toml` | Add `write_inventory,read_inventory,read_orders` scopes; add `inventory_levels/update` webhook topic |

## New Files to Create

| File | Purpose |
|------|---------|
| `app/services/bundles/inventory-sync.server.ts` | Core inventory calculation + Shopify API sync engine |
| `app/services/webhooks/handlers/inventory.server.ts` | Webhook handler: find affected bundles, mark stale, trigger sync |
| `app/routes/api.inventory-sync.ts` | Internal API route for inventory sync (uses `unauthenticated.admin()`) |
| `tests/unit/services/inventory-sync.test.ts` | Unit tests for inventory calculation logic |
| `tests/unit/services/inventory-webhook.test.ts` | Unit tests for webhook handler (DB operations) |
| `tests/unit/routes/api.inventory-sync.test.ts` | Unit tests for API route action |

---

## Migration / Backward Compatibility Strategy

### Migration Script (Batch Job)

A one-time migration updates all existing bundle products:

1. Query `Bundle` where `shopifyProductId IS NOT NULL` and `status IN (active, draft)`
2. For each bundle:
   a. Calculate price via `calculateBundlePrice(admin, bundle)`
   b. Update Shopify variant price via `updateBundleProductPrice(admin, productId, price)`
   c. Change `inventoryManagement` to `"SHOPIFY"` on the variant
   d. Activate inventory item at the shop's primary location
   e. Calculate and set initial inventory level
3. Log summary: total/success/failed/skipped

**Implementation:** A protected API route `/api/migrate-bundles` that can be triggered manually or via admin action. Must be idempotent.

### Backward Compatibility

- **Cart Transform MERGE:** Uses `percentageDecrease` calculated from component sums. Parent variant price is completely ignored. **SAFE.**
- **Cart Transform EXPAND (discount > 0):** Uses `percentageDecrease`. **SAFE.**
- **Cart Transform EXPAND (discount = 0):** Currently shows $0 because no price override is applied and variant price is $0. After fix, shows calculated price. **This is a bug fix, not a regression.**
- **Metafields:** No changes to metafield structure.
- **Widgets:** Do not read variant price. Read pricing from `bundle_ui_config` metafield. **SAFE.**

---

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/services/inventory-sync.test.ts` | Unit | Inventory calculation logic: MIN formula, edge cases (0 stock, untracked components, multi-quantity), Shopify API call construction |
| `tests/unit/services/inventory-webhook.test.ts` | Unit | Webhook handler: finding affected bundles, marking stale, debounce logic |
| `tests/unit/routes/api.inventory-sync.test.ts` | Unit | API route action: authentication, bundle lookup, calling sync service |
| `tests/unit/services/pricing-creation.test.ts` | Unit | Price calculation during bundle creation: all discount methods, no-discount case, empty bundles |

### Behaviors to Test

From PO acceptance criteria → test cases:

**Inventory Calculation (`inventory-sync.test.ts`):**
- Given components (50, 20, 10) with qty 1 each → returns 10
- Given component with qty 2 (stock 50) → effective = floor(50/2) = 25
- Given one component with stock 0 → returns 0
- Given component with no inventory tracking → excluded from MIN (unlimited)
- Given ALL components untracked → returns 999 (high default)
- Given empty components array → returns 0 (defensive)

**Webhook Handler (`inventory-webhook.test.ts`):**
- Given inventory update for product in a bundle → marks bundle stale
- Given inventory update for product NOT in any bundle → no-op
- Given inventory update when bundle already recalculated < 60s ago → skipped (debounce)
- Given handler failure → returns error result, does not crash

**Price on Creation (`pricing-creation.test.ts`):**
- Given bundle with percentage_off → price = component_sum * (1 - discount/100)
- Given bundle with fixed_amount_off → price = component_sum - fixed_amount
- Given bundle with fixed_bundle_price → price = fixed_price
- Given bundle with no discount → price = component_sum
- Given bundle with no products → price = "0.01" (minimum)

### Mock Strategy

- **Mock:** Prisma DB client (`db.stepProduct.findMany`, `db.bundle.update`), Shopify Admin GraphQL client (`admin.graphql`), `unauthenticated.admin()`
- **Do NOT mock:** Pure calculation functions (`calculateMinInventory`, `calculateBundlePrice` internal math), data transformation utilities
- **Do NOT test:** Polaris UI rendering, shopify.app.toml config, Prisma migration SQL

### TDD Exceptions (no tests required)

- `shopify.app.toml` scope/webhook changes
- `prisma/schema.prisma` field additions
- Migration script (tested manually against dev store)
- CSS/style-only changes
