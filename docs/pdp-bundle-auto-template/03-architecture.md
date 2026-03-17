# Architecture Decision Record: PDP Bundle Auto-Template

## Context

Product-page bundles must automatically apply `templates/product.product-page-bundle.json`
to their linked Shopify product on every Save and Sync Bundle, matching the zero-friction
installation experience already provided for full-page bundles.

## Constraints

- Must not break existing DB schema (no new Prisma fields)
- Must not mutate existing theme files (`templates/product.json`)
- Must work within current stack (Remix + Prisma + Shopify Admin GraphQL + REST Theme API)
- Template creation must be idempotent (safe to call on every save)
- Failure must be non-fatal (bundle save must succeed regardless)
- Must reuse the `readExtensionUidFromToml()` + `resolveBlockUuid()` pattern already in place

## Options Considered

### Option A — Extend `widget-theme-template.server.ts` with a second exported function

Add `ensureProductBundleTemplate()` alongside the existing `ensureBundlePageTemplate()` in
the same file. Share all the private helpers (`readBaseTemplate`, `writeThemeAsset`,
`themeAssetExists`, `getActiveThemeId`, `resolveBlockUuid`).

- Pros: Zero duplication — all REST helpers are already there; single file to maintain.
- Cons: File grows slightly; the two functions differ only in `TEMPLATE_KEY` and `BLOCK_HANDLE`.
- **Verdict: ✅ Recommended.**

### Option B — Create a separate `widget-product-template.server.ts`

Mirror the full file, change the two constants, export `ensureProductBundleTemplate()`.

- Pros: Clean separation.
- Cons: Duplicates ~200 lines of REST helpers (asset URL builder, read/write helpers,
  theme ID query, TOML reader). Violates DRY. Two files to update when the REST API version
  changes.
- **Verdict: ❌ Rejected.**

### Option C — Generalise into a single `ensureBundleTemplate(type)` function

Replace both functions with one parameterised function: `ensureBundleTemplate({ templateKey, blockHandle })`.

- Pros: Maximally DRY.
- Cons: Changes the existing `ensureBundlePageTemplate()` call signature, requiring updates
  at every call site. More refactoring risk than benefit given only two templates exist.
- **Verdict: ❌ Rejected — over-engineering for two call sites.**

## Decision: Option A

Add `ensureProductBundleTemplate()` to the existing `widget-theme-template.server.ts`.
Private helpers are already shared by the file-level scope, so no duplication occurs.
Only two new constants and one new exported function are needed.

## Data Model

No schema changes. The `shopifyProductId` field already on the `Bundle` model is the
only identifier needed to drive the `productUpdate` mutation.

New type (re-use existing `TemplateEnsureResult` — identical shape):
```typescript
// No new type needed — TemplateEnsureResult already exported from widget-theme-template.server.ts
export interface TemplateEnsureResult {
  success: boolean;
  templateCreated: boolean;
  templateAlreadyExists: boolean;
  themeId?: string;
  error?: string;
}
```

## Files to Modify

| File | Change |
|------|--------|
| `app/services/widget-installation/widget-theme-template.server.ts` | Add `ensureProductBundleTemplate()` + two new constants |
| `app/services/widget-installation/index.ts` | Export `ensureProductBundleTemplate` |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Call `ensureProductBundleTemplate()` + `productUpdate(templateSuffix)` in `handleSaveBundle()` and `handleSyncBundle()` |

## Implementation Detail

### `widget-theme-template.server.ts` additions

```typescript
const PRODUCT_TEMPLATE_KEY = "templates/product.product-page-bundle.json";
const PRODUCT_BLOCK_HANDLE = "bundle-product-page";

export async function ensureProductBundleTemplate(
  admin: any,
  session: ShopSession,
  apiKey: string,
): Promise<TemplateEnsureResult> {
  // 1. Get active theme
  // 2. Check if template already exists → return early if so
  // 3. Read base product.json as foundation
  // 4. resolveBlockUuid() — same function, same TOML uid
  // 5. buildTemplate() with PRODUCT_BLOCK_HANDLE
  // 6. Write template
  // (identical control flow to ensureBundlePageTemplate)
}
```

### `handlers.server.ts` — `handleSaveBundle` addition

After the existing `productUpdate(status)` mutation (line ~275), add:

```typescript
// TEMPLATE: Ensure product.product-page-bundle.json exists + apply templateSuffix
const apiKey = process.env.SHOPIFY_API_KEY ?? '';
const templateResult = await ensureProductBundleTemplate(admin, session, apiKey);
if (!templateResult.success) {
  AppLogger.warn('[PRODUCT_TEMPLATE] Could not ensure product bundle template (non-fatal)', {
    bundleId, error: templateResult.error
  });
}

// Apply templateSuffix to the product regardless of template write outcome
await admin.graphql(UPDATE_PRODUCT_TEMPLATE_SUFFIX, {
  variables: { id: updatedBundle.shopifyProductId, templateSuffix: 'product-page-bundle' }
});
```

### `handlers.server.ts` — `handleSyncBundle` addition

After step 5 (product re-created), before returning success:

```typescript
// Re-apply template + templateSuffix on new product
const apiKey = process.env.SHOPIFY_API_KEY ?? '';
const templateResult = await ensureProductBundleTemplate(admin, session, apiKey);
// ... same non-fatal warn pattern ...
await admin.graphql(UPDATE_PRODUCT_TEMPLATE_SUFFIX, {
  variables: { id: newProductId, templateSuffix: 'product-page-bundle' }
});
```

### GraphQL mutation (shared constant)

```graphql
mutation UpdateProductTemplateSuffix($id: ID!, $templateSuffix: String!) {
  productUpdate(input: { id: $id, templateSuffix: $templateSuffix }) {
    product { id templateSuffix }
    userErrors { field message }
  }
}
```

Note: the existing `UPDATE_PRODUCT_STATUS` mutation can be merged with this
into a single `productUpdate` call that sets both `status` and `templateSuffix`
simultaneously — one fewer API call on save.

## Migration / Backward Compatibility Strategy

- Existing PDP bundles: next Save triggers template creation + suffix application. Widget
  behavior is unchanged (same block, same metafield data binding).
- No DB migration required.
- Merchants who already added the block manually: their product gets `templateSuffix` set;
  the template file is created in the theme. Since the template clones from `product.json`
  and adds the same block they placed manually, the result is equivalent — no regression.

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/services/ensure-product-bundle-template.test.ts` | Unit | `ensureProductBundleTemplate()` — template exists path, template created path, UUID resolution, non-fatal failure |

### Behaviors to Test (from PO acceptance criteria)

- Given template exists → returns `{ success: true, templateAlreadyExists: true }`, no write call
- Given template does not exist + UUID resolved → writes template, returns `{ success: true, templateCreated: true }`
- Given no active theme → returns `{ success: false }`
- Given UUID resolution returns null (TOML unreadable, no env var) → returns `{ success: false, error: "Block UUID not found..." }`
- Given `writeThemeAsset` throws → returns `{ success: false }` (caught in try/catch)
- Given product.json readable → base template includes existing sections
- Given product.json not found → minimal fallback template used

### Mock Strategy

- Mock: Shopify Admin GraphQL (`admin.graphql`), Theme REST API (`fetch`)
- Do NOT mock: `readExtensionUidFromToml()`, `resolveBlockUuid()` (pure), template JSON construction

### TDD Exceptions

- The `handlers.server.ts` wiring (calling the new service) — covered by the service unit tests
- The `productUpdate templateSuffix` GraphQL call — existing product-sync tests in handlers cover the pattern
