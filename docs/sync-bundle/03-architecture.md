# Architecture Decision Record: Sync Bundle (Hard Reset)

## Context

Both bundle configure routes (`full-page` and `product-page`) need a "Sync Bundle" action that tears down all Shopify-side data for a bundle (product/page + all metafields) and re-creates it from the current DB state. The existing `handleSaveBundle` handler already contains the complete metafield sync logic — the `handleSyncBundle` handler re-uses this machinery without requiring a form submission of new data.

## Constraints

- Must not delete `BundleAnalytics` records (historical data)
- Must preserve `Bundle.id` and `Bundle.shopId`
- Must work within the existing Remix `fetcher.submit` + switch-case action pattern
- Must not introduce new DB migrations (no schema changes)
- Must re-use existing metafield sync services without duplication
- Both bundle types share the same metafield sync logic; only the Shopify object type (product vs. page) differs

## Options Considered

### Option A: Re-use `handleSaveBundle` with a `sync=true` flag
Pass all current form data + a `sync=true` flag to `handleSaveBundle`. The handler deletes Shopify objects before re-creating them when the flag is set.
- **Pros:** Single handler, no code duplication for metafield logic.
- **Cons:** `handleSaveBundle` is already 500+ lines; adding a branch makes it harder to reason about. The sync path does NOT need form data (it reads from DB directly). Coupling save and sync increases risk of regressions.
- **Verdict:** ❌ Rejected

### Option B: New `handleSyncBundle` handler that reads DB and re-runs sync
A dedicated `handleSyncBundle` handler that reads the current bundle from DB, deletes the Shopify product/page and DB child records, then calls the same three metafield update functions used by `handleSaveBundle`.
- **Pros:** Clean separation of concerns. Sync reads from DB (authoritative state) not form data. Zero form parsing required. Re-uses all existing metafield services.
- **Cons:** Some duplication in the "build bundle config for metafields" logic — mitigated by extracting a shared `buildBundleConfigForSync` helper if needed (both `handleSaveBundle` and `handleSyncBundle` build the same shape).
- **Verdict:** ✅ Recommended

### Option C: Shared `SyncBundleService` extracted to a service file
Move the full sync logic to `app/services/bundles/sync-bundle.server.ts`, called by both handlers.
- **Pros:** Max reusability.
- **Cons:** Over-engineering for two call sites that already share the same handler file location. The logic is simple enough to live directly in the handler file alongside `handleSaveBundle`.
- **Verdict:** ❌ Rejected (YAGNI — one service file per feature is enough complexity)

## Decision: Option B — dedicated `handleSyncBundle` in each handler file

The handler:
1. Loads the bundle + steps + pricing from DB
2. Deletes child DB records (steps → cascade to StepProduct, pricing)
3. Re-inserts steps + pricing from the DB-sourced data (no form parsing)
4. Deletes the Shopify product (product-page) or Shopify page (full-page) via Admin GraphQL
5. Re-creates the Shopify product/page via existing `WidgetInstallationService` or a direct mutation
6. Updates the DB `Bundle` record with the new `shopifyProductId`/`shopifyPageId`
7. Re-runs all three metafield operations in parallel
8. Returns `{ success: true, message }` or `{ success: false, error }`

## Data Model

No schema changes. All existing models are used as-is.

```typescript
// Types used (no new types required)
type SyncBundleResult = {
  success: boolean;
  message?: string;
  error?: string;
};
```

The handler reads `Bundle` with:
```typescript
db.bundle.findUnique({
  where: { id: bundleId, shopId: session.shop },
  include: {
    steps: { include: { StepProduct: true }, orderBy: { position: 'asc' } },
    pricing: true
  }
})
```

## Shopify Object Deletion

### Full-page bundle — delete Shopify page

```graphql
mutation DeletePage($id: ID!) {
  pageDelete(id: $id) {
    deletedPageId
    userErrors { field message }
  }
}
```

Called with `bundle.shopifyPageId`. After re-creation via `createFullPageBundle`, update DB:
```typescript
db.bundle.update({ where: { id: bundleId }, data: { shopifyPageId: newPageId, shopifyPageHandle: newPageHandle } })
```

### Product-page bundle — archive then delete Shopify product

Shopify requires a product to be `ARCHIVED` (draft status) before deletion via the `productDelete` mutation:

```graphql
mutation ArchiveProduct($input: ProductInput!) {
  productUpdate(input: $input) { product { id status } userErrors { field message } }
}
mutation DeleteProduct($input: ProductDeleteInput!) {
  productDelete(input: $input) { deletedProductId userErrors { field message } }
}
```

After re-creation (via existing product creation flow in `handleUpdateBundleProduct`), update DB:
```typescript
db.bundle.update({ where: { id: bundleId }, data: { shopifyProductId: newProductId } })
```

## DB Child Record Reset

```typescript
// Delete steps (cascades to StepProduct)
await db.bundleStep.deleteMany({ where: { bundleId } });

// Delete pricing
await db.bundlePricing.deleteMany({ where: { bundleId } });

// Re-create steps from current DB-sourced data
await db.bundleStep.createMany({
  data: steps.map(step => ({ ...step, bundleId }))  // with StepProduct nested
});
```

Note: `BundleAnalytics` is NOT touched — it has no `onDelete: Cascade` in the schema and is independent.

## Files to Modify

| File | Change |
|------|--------|
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Add `handleSyncBundle` export |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/index.ts` | Export `handleSyncBundle` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Add `case "syncBundle"` + confirmation modal + Sync button |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Add `handleSyncBundle` export |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/index.ts` | Export `handleSyncBundle` |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | Add `case "syncBundle"` + confirmation modal + Sync button |

## Migration / Backward Compatibility Strategy

- No DB migrations required
- Existing bundles are unaffected until a merchant explicitly clicks "Sync Bundle"
- After sync, the bundle Shopify product/page gets a new GID — the DB is updated immediately
- The bundle's storefront URL (`/pages/bundle-{id}`) is unchanged because the page handle is deterministic

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/routes/app.bundles.full-page-bundle.sync.test.ts` | Unit | `handleSyncBundle` for full-page: happy path, missing page, Shopify API error |
| `tests/unit/routes/app.bundles.product-page-bundle.sync.test.ts` | Unit | `handleSyncBundle` for product-page: happy path, missing product, metafield failure |

### Behaviors to Test

**Full-page `handleSyncBundle`:**
- Given a valid bundleId with shopifyPageId → deletes page, re-creates page, re-runs metafields, returns success
- Given a bundleId with no shopifyPageId → returns error "No Shopify page found"
- Given Shopify page deletion fails → returns error without DB changes
- Given metafield sync fails (component or variant metafields) → returns error
- Given BundleAnalytics exists → analytics records survive the sync

**Product-page `handleSyncBundle`:**
- Given a valid bundleId with shopifyProductId → archives product, deletes product, re-creates product, re-runs metafields, returns success
- Given a bundleId with no shopifyProductId → returns error "No Shopify product found"
- Given Shopify product deletion fails → returns error without DB changes
- Given metafield sync fails → returns error

### Mock Strategy
- **Mock:** `db` (Prisma), `admin.graphql` (Shopify API), metafield service functions
- **Do NOT mock:** Pure data transformation logic

### TDD Exceptions (no tests required)
- Confirmation modal UI (Polaris rendering)
- Button disabled state (UI-only)
- Toast messages (Polaris rendering)
- `case "syncBundle"` dispatch in `route.tsx` (one-line routing)
