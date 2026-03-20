# Architecture Decision Record: FPB Bundle Config Metafield Cache

## Context
FPB widgets fetch bundle configuration at runtime via the Shopify app proxy
(`/apps/product-bundles/api/bundle/{id}.json`). If the proxy is unregistered or unavailable,
every storefront visitor sees a broken widget. PDP bundles avoid this entirely by storing config
in a Shopify product metafield and injecting it via Liquid. This ADR brings FPB to parity.

## Constraints
- Must not break existing FPB pages (no `bundle_config` metafield → proxy fallback must work)
- Must not introduce a DB migration
- Must not duplicate the bundle-serialisation logic (DRY: API endpoint + metafield writer share one formatter)
- Must work within Remix + Prisma + Shopify Admin API stack

---

## Options Considered

### Option A: Write config in `createFullPageBundle` (widget installation service)
Pass serialised bundle config into the service function alongside bundleId/bundleName.
- Pros: One place writes all page metafields
- Cons: Service has to accept a large data payload it doesn't currently need; mixes concerns
  (page creation vs bundle data sync)
- **Verdict: ❌ Rejected** — bloats the service interface; harder to test independently

### Option B: Write config from the handlers after `createFullPageBundle` returns ✅
After `createFullPageBundle` returns `result.pageId`, the handler (which already holds or
can load the full bundle) calls a dedicated `writeBundleConfigPageMetafield()` helper.
- Pros: Clean separation; handlers own data sync; easy to call from both `handleValidateWidgetPlacement`
  and `handleSyncBundle`; service stays focused on page lifecycle
- Cons: Slightly more code in handlers; requires full bundle load in `handleValidateWidgetPlacement`
  (currently only loads basic fields)
- **Verdict: ✅ Recommended**

### Option C: Merge into the existing `metafieldsSet` call inside `createFullPageBundle`
Extend the existing `metafieldsSet` call to include `bundle_config` alongside `bundle_id`.
- Pros: Minimal code change
- Cons: Requires passing bundle data into the service; same concern as Option A
- **Verdict: ❌ Rejected**

---

## Decision: Option B

Handlers write the `bundle_config` page metafield after `createFullPageBundle` completes.
A shared `formatBundleForWidget()` function is extracted so both the API endpoint and the
metafield writer produce identical JSON.

---

## Data Model

No Prisma schema changes. New Shopify page metafield:

```
owner:     PAGE
namespace: custom
key:       bundle_config
type:      json
access:
  admin:      MERCHANT_READ_WRITE
  storefront: PUBLIC_READ
```

Value: serialised bundle config (see PO doc for shape). Typical size: 5–30 KB.
Shopify's JSON metafield limit is 128 KB — well within range for any realistic bundle.

```typescript
// Shared formatter — extracted from api.bundle.$bundleId.json.tsx
// app/lib/bundle-formatter.server.ts
export function formatBundleForWidget(bundle: BundleWithStepsAndPricing): FormattedBundle
```

---

## Files to Modify / Create

| File | Change |
|------|--------|
| `app/lib/bundle-formatter.server.ts` | **NEW** — extract `formatBundleForWidget()` from API endpoint |
| `app/routes/api/api.bundle.$bundleId[.]json.tsx` | Use shared formatter (no behaviour change) |
| `app/services/bundles/metafield-sync/operations/definitions.server.ts` | Add `ensureCustomPageBundleConfigDefinition()` |
| `app/services/bundles/metafield-sync/operations/index.ts` | Export new function |
| `app/services/bundles/metafield-sync/index.ts` | Re-export new function |
| `app/services/widget-installation/widget-full-page-bundle.server.ts` | Add `writeBundleConfigPageMetafield()` and call `ensureCustomPageBundleConfigDefinition` in `createFullPageBundle` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Load full bundle in `handleValidateWidgetPlacement`; call `writeBundleConfigPageMetafield` in both handlers |
| `extensions/bundle-builder/blocks/bundle-full-page.liquid` | Read `custom.bundle_config`, inject as `data-bundle-config` |
| `app/assets/bundle-widget-full-page.js` | Prefer `data-bundle-config` over proxy API call (same logic as PDP widget) |
| `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` | Rebuilt output |
| `scripts/build-widget-bundles.js` | Version bump |

---

## Migration / Backward Compatibility Strategy

- Existing pages: `bundle_config` metafield absent → widget falls back to proxy API (unchanged behaviour)
- After merchant re-syncs via "Sync Bundle": metafield is written, page becomes proxy-independent
- No bulk migration needed. No data is deleted or overwritten destructively.

---

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/lib/bundle-formatter.test.ts` | Unit | `formatBundleForWidget()` — field mapping, numeric price conversion, GID extraction, null handling |
| `tests/unit/services/fpb-config-metafield.test.ts` | Unit | `writeBundleConfigPageMetafield()` — happy path, metafield write errors (non-fatal), missing pageId skip |

### Behaviors to Test

From PO acceptance criteria:
- `formatBundleForWidget`: converts DB bundle to correct JSON shape (price in cents, GID → numeric id)
- `formatBundleForWidget`: null/missing pricing, steps, products all handled gracefully
- `writeBundleConfigPageMetafield`: calls `metafieldsSet` with correct payload; logs warning on userErrors; does NOT throw
- `writeBundleConfigPageMetafield`: skips write when pageId is null
- Widget `loadBundleData`: when `data-bundle-config` is valid JSON, returns it without fetching API
- Widget `loadBundleData`: when `data-bundle-config` is invalid JSON, falls back to proxy API

### Mock Strategy
- **Mock:** Shopify Admin API client (`admin.graphql`), Prisma DB client
- **Do NOT mock:** `formatBundleForWidget` (pure function — test directly)
- **Do NOT test:** Liquid template rendering, Polaris UI, widget CSS

### TDD Exceptions (no tests required)
- `bundle-full-page.liquid` changes (Liquid template — no test runner)
- `bundle-widget-full-page.js` changes (widget storefront JS — tested via `tests/unit/assets/` if applicable)
- Widget version bump in build script
