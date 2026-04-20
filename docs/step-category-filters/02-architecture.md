# Architecture: Category Filter Sub-Tabs Per Step

## Fast-Track Note
> BR context from: `docs/ui-audit-26.05.md` § "Category Filter Sub-Tabs Per Step"

---

## Impact Analysis

- **Communities touched:** Community 0 (`BundleWidgetFullPage`), Community 1 (`BundleWidgetProductPage`), and the admin configure route community
- **God nodes affected:** `BundleWidgetFullPage` (112 edges) — product grid rendering and step content flow are inside this class. Adding filter tabs adds a new rendering branch before `createFullPageProductGrid()` is called. `BundleWidgetProductPage` (76 edges) — same for PDP.
- **Blast radius:** Moderate. The product grid rendering path changes. The existing search bar coexists — filter tabs replace or supplement the search. Step switching must reset the active filter. No pricing, cart, HMAC, or auth paths affected.

---

## Decision

Store per-step filter tabs as a `filters Json?` column on `BundleStep`. The shape is `{ label: string; collectionHandle: string }[]`. When a merchant configures filters for a step, the widget renders a horizontal filter tab bar above the product grid. Clicking a tab filters the already-loaded product list to only show products whose `collections` include the selected handle. "All" is always the first tab (no filter). The existing text search bar is retained alongside the filter tabs.

The DCP already has `filterBgColor`, `filterIconColor`, `filterTextColor` CSS variables — these will apply to the new filter tabs via those existing variables.

**Why not a new DB relation?** A `Json?` column is sufficient — filter configs are small, merchant-defined, and do not require querying or indexing independently. This avoids a new Prisma model, new migration complexity, and new API endpoints.

---

## Data Model

```typescript
// prisma/schema.prisma — BundleStep model addition
filters Json?  // { label: string; collectionHandle: string }[] — per-step category filter tabs
```

```typescript
// Widget step shape (bundle_ui_config metafield) — addition
{
  id: string;
  name: string;
  filters?: { label: string; collectionHandle: string }[] | null;  // NEW
  // ... existing fields unchanged
}
```

```typescript
// Widget runtime state (not persisted)
// Track which filter is active per step:
this._activeFilters = {};  // { [stepIndex: number]: collectionHandle | null }
```

---

## Files

| File | Action | What changes |
|---|---|---|
| `prisma/schema.prisma` | modify | Add `filters Json?` to `BundleStep` model |
| `prisma/migrations/*/migration.sql` | create | `ALTER TABLE "BundleStep" ADD COLUMN "filters" JSONB;` |
| `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` | modify | Add `filters: Array.isArray(step.filters) ? step.filters : null` to step map |
| `app/assets/bundle-widget-full-page.js` | modify | (1) Add `_activeFilters = {}` instance var. (2) Add `createFilterTabBar(stepIndex)` method that renders filter tabs from `step.filters`. (3) In `renderProductPageLayout()` / sidebar content: insert filter tab bar between search bar and product grid. (4) Filter tab click sets `_activeFilters[stepIndex]` and re-renders product grid. (5) `createFullPageProductGrid()`: when `_activeFilters[stepIndex]` is set, filter product list to those whose step collections include the active handle. (6) On step change, reset `_activeFilters[newStepIndex]` to null. |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | modify | Add `.filter-tabs-bar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }` `.filter-tab { padding: 6px 14px; border-radius: var(--bundle-filter-radius, 20px); background: var(--bundle-filter-bg, #F3F4F6); color: var(--bundle-filter-text, #111); cursor: pointer; white-space: nowrap; }` `.filter-tab.active { background: var(--bundle-filter-active-bg, #111); color: var(--bundle-filter-active-text, #fff); }` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | modify | In step setup card: add "Category Filters" section — a repeatable list of `{ label, collection }` pairs. Each row has a text input (label) and a collection picker (reuse existing collection picker component). Add/remove rows. Wire to step state update. |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | Same filter config UI |
| `npm run build:widgets` | run | Rebuild after widget source changes |

---

## Test Plan

| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/services/bundle-product-metafield.test.ts` | unit | `filters` passes through step map correctly; null when absent; malformed input coerces to null |
| `tests/unit/lib/step-filter.test.ts` | unit | Product list filtering by collection handle: all products match "All" (null filter); products with matching collection handle included; products without it excluded; empty filters array → no filter bar rendered |

**Mock:** Prisma, Shopify Admin API
**Do not mock:** product list filtering (pure function — extract from widget as a testable helper)
**No tests needed:** widget DOM rendering, CSS, Polaris admin UI

---

## Notes

- "All" tab is always first and resets the filter — no store needed in the metafield.
- Products already have `collections` data in the metafield step — no new API call needed for filtering. The filter is a client-side array filter.
- If a step has no `filters` array (or empty), the filter tab bar is not rendered — zero visual impact on existing bundles.
- The filter bar should scroll horizontally on mobile (`overflow-x: auto; -webkit-overflow-scrolling: touch`).
- Widget version must be bumped (MINOR — new visible feature) before deploying.
