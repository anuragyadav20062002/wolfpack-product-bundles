---
title: Shopify Admin API
type: shopify-integration
audited: 2026-04-16
sources: docs/API_ENDPOINTS.md (corrected), Shopify Dev MCP
---

# Shopify Admin API

## Rate Limits (corrected)

> ⚠️ `docs/API_ENDPOINTS.md` states "40 requests/second" — **this is incorrect**.

### Actual Rate Limit: Leaky Bucket

- **Capacity**: 1,000 points
- **Leak rate**: 50 points/second (restores 50 points/sec back to 1,000)
- **Cost per query**: varies by operation complexity (1–1,000 points)
  - Simple queries: ~1–10 points
  - `inventoryAdjustQuantities` bulk mutation: higher cost
  - Exact cost returned in `X-GraphQL-Cost-Include-Fields` response header

### Practical Guidance
- Burst up to 1,000 points, then throttle
- Use `X-Shopify-Shop-Api-Call-Limit` header to monitor remaining
- For bulk operations (inventory sync): check `inventorySyncedAt` debounce (< 60s → skip) to avoid hammering the limit
- REST API: separate rate limit, roughly 2 req/sec per store on Basic plans

---

## Authenticated Clients

### Within a Remix request (merchant session)
```typescript
const { admin } = await authenticate.admin(request);
await admin.graphql(/* query */);
```

### Outside a request (webhooks, background jobs)
```typescript
import { unauthenticated } from '~/shopify.server';
const { admin } = await unauthenticated.admin(shopDomain);
await admin.graphql(/* query */);
```
`unauthenticated.admin(shopDomain)` uses the stored offline session token. Exported from `app/shopify.server.ts:140`.

---

## Embedded Admin Shell Title Bars

Embedded app routes should not emit a `ui-title-bar` when the target UI needs the default app-name shell row. Chrome proof on 2026-05-27 showed Shopify automatically renders the app-name title row after a route stops emitting `ui-title-bar`; adding a route-owned duplicate app header creates a second title strip.

For EB-style configure parity, omit the route breadcrumb title bar and keep the in-frame configure header (`Configure Bundle Flow`, readiness score, preview action) as the route-owned header.

---

## Key Mutations Used

### Product Create/Update

Shopify Admin GraphQL latest (`2026-04` as of 2026-05-27) exposes the current product mutations as:

```graphql
mutation CreateProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
  productCreate(product: $product, media: $media) { ... }
}

mutation UpdateProduct($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {
  productUpdate(product: $product, media: $media) { ... }
}
```

The older `input: ProductInput` argument remains documented only as deprecated for `productCreate` and should not be used for generated bundle product creation or update flows. `ProductUpdateInput` includes `id`, `title`, `descriptionHtml`, `status`, `vendor`, `productType`, `tags`, and related fields.

### Product Media Cleanup

For existing product media, Shopify Admin GraphQL latest (`2026-04` as of 2026-05-27) marks `productDeleteMedia` as deprecated and points to `fileUpdate` instead. To remove an existing media file from a product gallery without using deprecated product media deletion, call:

```graphql
mutation UpdateFiles($files: [FileUpdateInput!]!) {
  fileUpdate(files: $files) {
    files { id }
    userErrors { field message code }
  }
}
```

with variables shaped like:

```json
{
  "files": [
    {
      "id": "gid://shopify/MediaImage/123",
      "referencesToRemove": ["gid://shopify/Product/456"]
    }
  ]
}
```

`FileUpdateInput.referencesToRemove` currently accepts product IDs and removes the file-product association from the product media gallery.

### Inventory Sync
```graphql
mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
  inventoryAdjustQuantities(input: $input) { ... }
}
```
Note: **NOT** `inventoryAdjustQuantity` (deprecated singular form).

### Metafield Write
Used by `bundle-config-metafield.server.ts` to cache bundle config for zero-latency widget load.

---

## Storefront API

- Rate limit: ~4 req/sec unauthenticated (higher for authenticated/private tokens)
- Used by widgets for product data when metafield cache is absent
- Proxy route: `/apps/product-bundles/` (Shopify app proxy)
