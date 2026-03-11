# Breaking Changes — Ad-Ready Bundle Infrastructure

**Feature:** Ad-Ready Bundle Infrastructure
**Risk Window:** Single `shopify app deploy` cycle
**Last Updated:** 2026-03-09

---

## Pre-Flight Checklist

Before deploying any changes, confirm:

- [ ] All migration scripts tested against a **dev store** first
- [ ] Current scopes verified in `shopify.app.toml`: `write_products,read_products,read_publications,write_publications,read_content,write_content`
- [ ] Database backup taken before running Prisma migrations
- [ ] Merchant communication drafted (re-auth required — see #1)
- [ ] Bundle count queried: `SELECT COUNT(*) FROM "Bundle" WHERE "shopifyProductId" IS NOT NULL`

---

## 1. OAuth Scope Changes — HIGH RISK

### What changes

New scopes added to `shopify.app.toml`:

```
write_inventory, read_inventory, read_orders
```

### Impact

**Every installed merchant must re-authenticate.** Shopify shows a permissions screen on next app load. Until they re-auth, the app cannot call inventory or order APIs.

### Strategy

Batch ALL new scopes into a single `shopify app deploy` so merchants only re-auth **once**.

Do NOT deploy scopes incrementally — each deploy triggers a separate re-auth prompt.

### Pre-deploy checklist

- [ ] All three scopes added to `shopify.app.toml` in one commit
- [ ] `orders/create` webhook subscription added in the same deploy
- [ ] Web-pixel extension included in the same deploy
- [ ] No other deploys planned within the migration window

### Rollback

Remove the new scopes from `shopify.app.toml` and redeploy. Merchants will not be prompted again (scope reduction is silent).

---

## 2. Variant Price Fix — MEDIUM RISK

### What changes

Bundle parent products currently created with `price: "0.00"`. Changed to the calculated bundle price from `calculateBundlePrice()`.

### Impact by cart transform path

| Path | Impact |
|------|--------|
| **MERGE** | SAFE — always uses `percentageDecrease`, parent price is ignored |
| **EXPAND, discount > 0%** | SAFE — price derived from component variants, not parent |
| **EXPAND, discount = 0%** | **Behavior change** — line item goes from $0 to actual price. This is a **bug fix**, not a regression. |

### Migration script (pseudocode)

```ts
// Batch update all existing bundles with $0 parent price
const bundles = await db.bundle.findMany({
  where: {
    shopifyProductId: { not: null },
  },
  include: { products: { include: { variants: true } } },
});

for (const bundle of bundles) {
  const calculatedPrice = calculateBundlePrice(bundle);

  // Update Shopify product variant price
  await admin.graphql(PRODUCT_VARIANT_UPDATE, {
    input: {
      id: bundle.shopifyVariantId,
      price: (calculatedPrice / 100).toFixed(2), // cents → dollars
    },
  });
}
```

### Rollback

Re-run the migration setting prices back to `"0.00"`. MERGE bundles unaffected. EXPAND bundles with 0% discount revert to the $0 bug.

---

## 3. Inventory Management — MEDIUM RISK

### What changes

| Field | Before | After |
|-------|--------|-------|
| `inventoryManagement` | `null` / `NOT_MANAGED` | `"SHOPIFY"` |
| `inventoryPolicy` | `"CONTINUE"` | `"DENY"` (when tracked) |

### Impact

Bundles become inventory-aware. If MIN(component inventory) = 0, the bundle shows **"Out of stock"** in feeds and storefronts.

### Migration script (pseudocode)

```ts
// NOTE: Use `inventoryAdjustQuantities` (bulk), NOT the deprecated `inventoryAdjustQuantity`

for (const bundle of existingBundles) {
  // 1. Get variant's inventoryItem ID
  const variant = await admin.graphql(GET_VARIANT, {
    id: bundle.shopifyVariantId,
  });
  const inventoryItemId = variant.inventoryItem.id;

  // 2. Query component product inventory levels
  const componentInventories = await Promise.all(
    bundle.products.map(async (bp) => {
      const inv = await admin.graphql(GET_INVENTORY_LEVEL, {
        inventoryItemId: bp.variant.inventoryItem.id,
      });
      return Math.floor(inv.available / bp.quantity);
    }),
  );

  // 3. Calculate available quantity
  const bundleAvailable = Math.min(...componentInventories);
  // Edge case: if MIN = 0, bundle will show "out of stock" in feeds

  // 4. Set inventory management to SHOPIFY
  await admin.graphql(PRODUCT_VARIANT_UPDATE, {
    input: {
      id: bundle.shopifyVariantId,
      inventoryManagement: "SHOPIFY",
    },
  });

  // 5. Activate inventory at location + set quantity
  await admin.graphql(INVENTORY_ACTIVATE, {
    inventoryItemId,
    locationId: primaryLocationId,
  });

  await admin.graphql(INVENTORY_ADJUST_QUANTITIES, {
    input: {
      reason: "correction",
      name: "available",
      changes: [
        {
          inventoryItemId,
          locationId: primaryLocationId,
          delta: bundleAvailable, // absolute set via delta from 0
        },
      ],
    },
  });
}
```

### Edge cases

- **Component has no inventory tracking** — skip that component in MIN calculation, or treat as unlimited
- **Multiple locations** — pick the primary location; multi-location support is out of scope for Phase 1
- **MIN = 0** — bundle legitimately out of stock; log a warning but do not skip

### Rollback

```ts
// Revert to unmanaged inventory
await admin.graphql(PRODUCT_VARIANT_UPDATE, {
  input: {
    id: bundle.shopifyVariantId,
    inventoryManagement: null, // back to NOT_MANAGED
  },
});
```

---

## 4. BundleStatus Enum — LOW RISK

### What changes

New enum value `unlisted` added to `BundleStatus` in Prisma schema.

### Migration

```sql
ALTER TYPE "BundleStatus" ADD VALUE 'unlisted';
```

This is a **non-destructive, additive-only** change. Existing rows are unaffected.

### Rollback

Postgres does not support removing enum values. To roll back:
1. Ensure no rows use `unlisted`
2. Leave the enum value in place (harmless) or recreate the type without it (requires column migration)

---

## 5. New DB Model: OrderAttribution — LOW RISK

### What changes

New table for Phase 3 order attribution tracking.

### Migration

Standard `prisma migrate dev` — creates a new table, touches nothing existing.

### Rollback

```sql
DROP TABLE IF EXISTS "OrderAttribution";
```

---

## 6. shopify.app.toml Changes — Summary

All of these ship in a **single deploy**:

| Change | Type |
|--------|------|
| `write_inventory, read_inventory, read_orders` scopes | Scope addition |
| `orders/create` webhook | Webhook subscription |
| Web-pixel extension (UTM capture) | New extension |

### Rollback

Revert `shopify.app.toml` to previous state and redeploy.

---

## 7. Deprecated API Replacements

The Feature Doc referenced two deprecated Shopify APIs. Use the replacements below:

| Deprecated API | Replacement | Notes |
|----------------|-------------|-------|
| `productPublicationCreate` | `publishablePublish` | Same input shape, different mutation name |
| `inventoryAdjustQuantity` | `inventoryAdjustQuantities` | Bulk API, requires `changes` array input (see #3 pseudocode) |

Do NOT use the deprecated mutations in any new code — they may be removed in a future API version.

---

## Deploy Order

Execute in this exact sequence:

```
1. Database migrations (Prisma)
   - Add `unlisted` to BundleStatus enum
   - Create OrderAttribution table

2. Code deploy (app server)
   - Price fix logic
   - Inventory management logic
   - New routes/handlers

3. Run data migrations
   - Batch update bundle prices (see #2)
   - Batch enable inventory tracking (see #3)

4. shopify app deploy (MANUAL — see CLAUDE.md)
   - Scopes + webhook + web-pixel in one shot
   - Triggers merchant re-auth on next app load

5. Verify
   - Check a bundle product in Shopify admin: price != $0, inventory tracked
   - Confirm webhook registered: Settings → Notifications → Webhooks
   - Confirm web-pixel active in Online Store → Customer events
```

---

## Merchant Communication Template

> **Action Required: Wolfpack Bundles permissions update**
>
> We've added inventory tracking and order attribution to Wolfpack Bundles. The next time you open the app, Shopify will ask you to approve updated permissions. This is a one-time prompt.
>
> New permissions requested:
> - Read/write inventory (bundle stock tracking)
> - Read orders (bundle sales attribution)
>
> No action is needed until you next open the app.
