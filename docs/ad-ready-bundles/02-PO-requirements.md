# Product Owner Requirements: Feed-Ready Product Enhancement (Ad-Ready Phase 1)

**Input:** `docs/ad-ready-bundles/00-BR.md`

---

## User Stories with Acceptance Criteria

### Story 1: Bundle Products Created with Correct Price

**As a** merchant creating a bundle in Wolfpack
**I want** the bundle product in Shopify to have the correct calculated price from the start
**So that** ad platforms and storefronts display the real bundle price, not $0.00

**Acceptance Criteria:**

- [ ] Given a merchant creates a new product-page bundle with component products, when the Shopify product is created, then the variant price equals the calculated bundle price (not "0.00")
- [ ] Given a merchant creates a new full-page bundle, when the Shopify product is created, then the variant price equals the calculated bundle price
- [ ] Given a merchant clones an existing bundle, when the clone's Shopify product is created, then the variant price equals the source bundle's calculated price
- [ ] Given a bundle has pricing with percentage_off discount, when created, then the variant price reflects the discounted total (component sum minus discount)
- [ ] Given a bundle has pricing with fixed_amount_off discount, when created, then the variant price reflects the discounted total
- [ ] Given a bundle has pricing with fixed_bundle_price, when created, then the variant price equals the fixed price
- [ ] Given a bundle has no pricing/discount configured, when created, then the variant price equals the sum of average component prices per step
- [ ] Given the MERGE cart transform path processes a bundle with updated price, when checkout completes, then the final charged amount is identical to what it was before this change (no pricing regression)
- [ ] Given the EXPAND cart transform path processes a bundle with discount > 0%, when checkout completes, then the final charged amount is identical to before
- [ ] Given the EXPAND cart transform path processes a bundle with 0% discount, when checkout completes, then the final charged amount equals the calculated bundle price (previously was $0 — this is a bug fix)

---

### Story 2: Bundle Products Created with Managed Inventory

**As a** merchant creating a bundle
**I want** the bundle product to have Shopify-managed inventory tracking enabled
**So that** ad platforms can read accurate stock availability from the product feed

**Acceptance Criteria:**

- [ ] Given a merchant creates a new bundle, when the Shopify product variant is created, then `inventoryManagement` is set to `"SHOPIFY"` (not `null`)
- [ ] Given a merchant creates a new bundle, when inventory management is enabled, then the initial inventory quantity is set to the calculated bundle stock level (not 0)
- [ ] Given a merchant clones a bundle, when the clone is created, then inventory management is enabled and initial stock is calculated

---

### Story 3: Bundle Inventory Calculation

**As a** merchant
**I want** my bundle's available stock to automatically reflect the lowest component stock
**So that** customers and ad platforms see accurate availability

**Acceptance Criteria:**

- [ ] Given a bundle with components (Beans:50, Mug:20, Grinder:10) each requiring quantity 1, when inventory is calculated, then bundle stock = 10 (minimum)
- [ ] Given a bundle with a component requiring quantity 2 (e.g., 2x Beans from stock of 50), when inventory is calculated, then that component's effective stock = floor(50/2) = 25
- [ ] Given a bundle where one component has 0 stock, when inventory is calculated, then bundle stock = 0 (out of stock)
- [ ] Given a bundle where one component has no inventory tracking (inventoryManagement: null), when inventory is calculated, then that component is treated as unlimited and excluded from the MIN calculation
- [ ] Given a bundle where ALL components have no inventory tracking, when inventory is calculated, then bundle stock defaults to a high value (e.g., 999) to indicate unlimited availability
- [ ] Given inventory is calculated, when the value is set on the Shopify variant, then the `inventoryAdjustQuantities` mutation is used (not the deprecated `inventoryAdjustQuantity`)

---

### Story 4: Automatic Inventory Recalculation

**As a** merchant
**I want** bundle inventory to update automatically when component stock changes
**So that** I don't have to manually adjust bundle stock after restocking or selling products

**Acceptance Criteria:**

- [ ] Given a component product's inventory level changes (webhook: `inventory_levels/update`), when the webhook is received, then all bundles containing that component are identified and their inventory is recalculated
- [ ] Given the same component inventory webhook fires multiple times within 60 seconds for the same bundle, when processed, then the bundle is only recalculated once (debounce)
- [ ] Given the webhook handler receives an inventory update for a product not in any bundle, when processed, then no action is taken (efficient early exit)
- [ ] Given the webhook handler fails to recalculate (e.g., Shopify API error), when the error occurs, then it is logged with bundle ID and error details, and does not crash the webhook processor

---

### Story 5: Data Migration for Existing Bundles

**As a** merchant with existing bundles
**I want** my current bundles to be updated with correct prices and inventory tracking
**So that** I don't have to recreate them to benefit from ad-ready functionality

**Acceptance Criteria:**

- [ ] Given existing bundles with `price: "0.00"` and `inventoryManagement: null`, when the migration runs, then each bundle's variant price is updated to the calculated value
- [ ] Given existing bundles, when the migration runs, then each bundle's variant `inventoryManagement` is changed to `"SHOPIFY"`
- [ ] Given existing bundles, when the migration runs, then initial inventory levels are calculated and set
- [ ] Given an existing bundle whose Shopify product no longer exists (deleted externally), when the migration encounters it, then it is skipped with a warning log (not an error)
- [ ] Given the migration, when run multiple times, then it is idempotent (safe to re-run without side effects)
- [ ] Given the migration, when complete, then a summary is logged: total bundles processed, successes, failures, skipped

---

## UI/UX Specifications

### No New UI Required for Phase 1

Phase 1 is entirely backend/infrastructure work. The merchant experience changes are:

1. **Bundle products in Shopify admin** now show a real price instead of $0.00
2. **Bundle products in Shopify admin** now show inventory tracking with a stock count
3. **Ad channel feeds** (Google, Meta, TikTok) now include the bundle with correct data

### Existing UI Unchanged

- Bundle builder in Wolfpack app — no changes
- Configure page pricing controls — no changes
- Dashboard bundle list — no changes
- Storefront widgets (product-page and full-page) — no changes

---

## Data Persistence

### What Changes in Shopify (not local DB)

| Data Point | Where | Before | After |
|-----------|-------|--------|-------|
| Bundle variant price | Shopify Product Variant | "0.00" | Calculated bundle price (dollars) |
| Bundle variant inventoryManagement | Shopify Product Variant | null | "SHOPIFY" |
| Bundle variant inventory level | Shopify Inventory Level | N/A | MIN(component stock / component qty) |

### What Changes in Local DB (Prisma)

Nothing in Phase 1. All changes are to Shopify product data via Admin GraphQL API.

### What Changes in shopify.app.toml

| Change | Current | New |
|--------|---------|-----|
| Scopes | `...write_products,write_publications,write_themes` | Add `write_inventory,read_inventory,read_orders` |
| Webhooks | 6 topics | Add `inventory_levels/update` |

---

## Backward Compatibility Requirements

1. **Cart Transform MERGE path** — Zero behavior change. Always uses `percentageDecrease` from component sums, parent variant price is irrelevant.
2. **Cart Transform EXPAND path (discount > 0%)** — Zero behavior change. Price override via `percentageDecrease`.
3. **Cart Transform EXPAND path (discount = 0%)** — Intentional behavior change (bug fix). Previously showed $0, now shows calculated price.
4. **Existing bundle metafields** — Untouched. No metafield schema changes.
5. **Widget JS** — Untouched. Widgets read metafields, not variant price.
6. **Checkout UI extension** — Untouched. Reads from cart line items, not variant directly.

---

## Out of Scope (explicit)

- Publishing bundles to additional sales channels (Phase 2)
- Campaign/UNLISTED bundle status (Phase 2)
- UTM attribution tracking (Phase 3)
- Multi-location inventory support (use primary location only)
- Compare-at price or "save X%" in product feeds
- Real-time inventory display in storefront widgets
- Automatic inventory deduction on bundle purchase (Shopify handles this for managed inventory)
- Admin UI changes in Wolfpack app
