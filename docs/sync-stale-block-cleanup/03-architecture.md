# Architecture Decision Record: Sync Bundle — Stale Block Cleanup

## Context

The app migrated from section blocks to app embed blocks. Stores set up before the migration have stale block references in their Shopify theme templates (`page.full-page-bundle.json`, `product.product-page-bundle.json`). These dead blocks render as `display: none` wrappers that hide the bundle widget.

The current Sync Bundle flow already deletes and recreates pages/products, but assigns them back to the same custom `templateSuffix` — so the stale template is reused and the problem persists.

## Constraints

- Must not require new API scopes (no `read_themes`, `write_themes`)
- Must not use Theme API / Asset API (disqualifies from Built For Shopify badge)
- Must preserve page/product URLs
- Must be backward compatible — stores that don't sync continue working

## Options Considered

### Option A: Drop templateSuffix entirely

Remove `templateSuffix` from all page/product creation and update mutations. Pages use `page.json`, products use `product.json`.

- **Pros:** Simplest change, guaranteed clean templates, no theme scope needed
- **Cons:** Theme editor deep links that reference `template=page.full-page-bundle` or `template=product.product-page-bundle` would break; PDP "Open in Theme Editor" button wouldn't navigate to the right template
- **Verdict:** Needs refinement for theme editor links → see Option C

### Option B: Clean stale blocks via Theme Asset API

Read template JSON, remove stale block references, write back.

- **Pros:** Surgical fix, preserves merchant customizations
- **Cons:** Requires theme scope exemption, high risk of breaking merchant themes, complex implementation
- **Verdict:** Rejected — too risky, scope issues

### Option C: Drop templateSuffix + update theme editor links (Recommended)

Same as Option A, but also update the theme editor deep links in the UI to use the default template names (`page` / `product`) instead of the custom suffixes.

- **Pros:** Simple, safe, no new scopes, fixes the root cause
- **Cons:** Merchants who had custom sections on the bundle template lose them (low risk — app embed handles all rendering)
- **Verdict:** Recommended

## Decision: Option C

Drop `templateSuffix` from all Shopify API mutations (create/update for both pages and products). Update theme editor deep links to reference default templates. Remove dead template-management code.

## Files to Modify

| File | Change |
|------|--------|
| `app/services/widget-installation/widget-full-page-bundle.server.ts` | Remove `templateSuffix` from pageCreate/pageUpdate mutations; remove template suffix check/update logic |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Remove `templateSuffix` from `syncBundleProductToShopify()` mutation; remove `ensureProductBundleTemplate` call + `ApplyTemplateSuffix` mutation in `handleSyncBundle()` |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | Update theme editor deep link: `template=product.product-page-bundle` → `template=product` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Update theme editor deep link: `template=page.full-page-bundle` → `template=page` |
| `app/routes/api/api.install-fpb-widget.tsx` | Remove `ensureBundlePageTemplate` call |
| `app/routes/api/api.install-pdp-widget.tsx` | Remove `ensureProductBundleTemplate` call + templateSuffix mutation |
| `app/services/widget-installation/widget-theme-template.server.ts` | Delete entire file (dead code) |
| `app/services/widget-installation/index.ts` | Remove `ensureProductBundleTemplate` export |

## Detailed Changes

### 1. `widget-full-page-bundle.server.ts` — FPB page creation

**Current (line 60):**
```typescript
const templateSuffix = 'full-page-bundle';
```

**Change:** Remove the `templateSuffix` variable. Remove it from the `pageCreate` mutation variables (line 122). Remove the template suffix check/update block (lines 162-190). Keep the `templateSuffix` field in the CHECK_PAGE_QUERY response (it's harmless and useful for logging).

### 2. PDP `handlers.server.ts` — `syncBundleProductToShopify()`

**Current (lines 65-76):**
```typescript
mutation UpdateProductStatus($id: ID!, $status: ProductStatus!, $templateSuffix: String!) {
  productUpdate(input: {id: $id, status: $status, templateSuffix: $templateSuffix}) { ... }
}
variables: { id: shopifyProductId, status: shopifyStatus, templateSuffix: 'product-page-bundle' }
```

**Change:** Remove `templateSuffix` from mutation and variables. Function becomes a pure status sync.

### 3. PDP `handlers.server.ts` — `handleSyncBundle()` (lines 1031-1057)

**Current:** Calls `ensureProductBundleTemplate()` then runs `ApplyTemplateSuffix` mutation.

**Change:** Remove the entire block (lines 1031-1057). The template suffix is no longer applied.

### 4. Theme editor deep links

**FPB route.tsx (line 1217):**
```typescript
// Current:
const templateParam = template.isPage ? 'page.full-page-bundle' : template.handle;
// Change to:
const templateParam = template.isPage ? 'page' : template.handle;
```

**PDP route.tsx (line 1229):**
```typescript
// Current:
? `https://${shop}/admin/themes/current/editor?template=product.product-page-bundle${previewParam}`
// Change to:
? `https://${shop}/admin/themes/current/editor?template=product${previewParam}`
```

### 5. API routes — widget installation

**`api.install-fpb-widget.tsx`:** Remove `ensureBundlePageTemplate` import and call.
**`api.install-pdp-widget.tsx`:** Remove `ensureProductBundleTemplate` import/call and the templateSuffix mutation block.

### 6. Dead code removal

**`widget-theme-template.server.ts`:** Delete entire file — both `ensureBundlePageTemplate()` and `ensureProductBundleTemplate()` are no longer called.
**`index.ts`:** Remove the `ensureProductBundleTemplate` export line.

## Migration / Backward Compatibility Strategy

- No database migration needed
- No forced store migration — merchants click "Sync Bundle" to pick up the fix
- Existing pages/products with the old templateSuffix continue to work (the template still exists in their theme, just unused for new syncs)
- The old template files (`page.full-page-bundle.json`, `product.product-page-bundle.json`) remain in merchant themes — Shopify doesn't auto-delete them

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| None required | — | This change removes template suffix strings from existing mutations. No new logic is introduced. |

### TDD Exceptions (no tests required)

All changes in this feature fall into TDD exception categories:
- Removing string literals from GraphQL mutation variables (no new logic)
- Updating URL strings in UI components (no testable logic)
- Deleting dead code (`widget-theme-template.server.ts`)
- Removing import statements

The existing Sync Bundle flow (page deletion, page creation, metafield writes) is unchanged — only the `templateSuffix` field is dropped from mutations.

### Manual Verification Checklist

- [ ] FPB: Sync Bundle on a store with stale blocks → page recreated without templateSuffix → bundle renders on storefront
- [ ] FPB: "Place Widget Now" → page created without templateSuffix → bundle renders
- [ ] FPB: "Open in Theme Editor" link navigates correctly
- [ ] PDP: Sync Bundle → product recreated without templateSuffix → bundle renders
- [ ] PDP: Save bundle (product create) → product has no templateSuffix
- [ ] PDP: "Open in Theme Editor" link navigates correctly
- [ ] PDP: Product status sync (active/draft) works without templateSuffix
- [ ] Verify on `wolfpackdemostore` — Sync the toy-bundle, confirm it renders
