# Architecture Decision Record: Admin UI Tier Configuration for Full-Page Bundle Widget

## Context

The full-page bundle widget supports Beco-style pricing tier pills (up to 4 tiers). Tier configuration (label + linked bundle ID per tier) is currently entered manually in the Shopify Theme Editor block settings (`tier_N_label`, `tier_N_bundle_id`). This feature moves that configuration into the Remix admin UI so merchants configure tiers on the bundle configure page, and the widget reads the config at runtime — eliminating the need for Theme Editor interaction.

## Constraints

- Must not break existing data or existing Theme Editor tier configs.
- Must work within the current stack: Remix, Prisma/PostgreSQL, Shopify App Proxy, and the IIFE widget JS.
- The Prisma migration must be zero-downtime (single nullable column addition on PostgreSQL).
- No new Shopify extension deployment is required to support reading tiers from the API.
- The widget JS is bundled (`npm run build:widgets`) — any change to `app/assets/bundle-widget-full-page.js` requires a rebuild and `shopify app deploy`.
- The Liquid block (`extensions/bundle-builder/blocks/bundle-full-page.liquid`) changes also require `shopify app deploy`.

---

## Options Considered

### Option A — New `BundleTier` Prisma model + new app proxy endpoint

Add a normalized relational `BundleTier` model with `bundleId`, `tierOrder`, `label`, `linkedBundleId`. Expose a new proxy endpoint `GET /apps/product-bundles/api/bundle/:bundleId/tiers.json`. The widget fetches tiers from this endpoint at init time.

**Pros:**
- Fully normalized, independently queryable.
- Clean separation of concerns.

**Cons:**
- Requires a new table and migration (more schema churn).
- Widget must make a second API call at init just for tiers — adds latency before pills render.
- The payload is tiny (max 4 tiers × 2 fields) — relational modeling adds overhead without benefit.

**Verdict: Rejected.** Disproportionate complexity. A second network call for 8 string values is wasteful.

---

### Option B — `custom:tier_config` JSON metafield on Shopify Page; Liquid reads at render time

On admin save, call `metafieldsSet` to write a JSON array of tiers to the Shopify Page's `custom:tier_config` metafield. The Liquid block reads it via `page.metafields.custom.tier_config` and injects it into `data-tier-config`.

**Pros:**
- Pills render synchronously from `data-tier-config` — no widget-init fetch delay.
- Consistent with `custom:bundle_id` pattern already in use.

**Cons:**
- Requires a Shopify API call (metafieldsSet mutation) on every tier config save.
- If the page is deleted and re-created, the metafield is lost until the next save.
- Splits bundle configuration between the DB and Shopify's metafield store — two sources of truth.
- Requires Liquid block update AND widget JS update.
- On metafield write failure (Shopify API error), the storefront silently shows stale tier config.

**Verdict: Rejected for v1.** The two-source-of-truth problem and Shopify API dependency on every save create operational risk that is not justified by the synchronous render benefit.

---

### Option C — `tierConfig` JSON column on `Bundle` model; exposed via existing bundle API (Recommended)

Add a nullable `tierConfig Json?` column to the `Bundle` table. The admin configure page reads and writes this field. The existing `/apps/product-bundles/api/bundle/:bundleId.json` proxy endpoint (already called by the widget to load all bundle data) includes `tierConfig` in its response. The widget JS reads `tierConfig` from the API response and calls `initTierPills()` from that data instead of (or in addition to) parsing `data-tier-config`.

**Pros:**
- Single source of truth: all bundle config lives in the `Bundle` DB row.
- Zero new Shopify API calls on save — only a DB write.
- No new endpoint: `tierConfig` is just an additional field in the existing API response.
- The widget already makes this API call on init; tier pills render after the bundle fetch (same timing as other data-driven UI).
- Prisma migration is a single nullable JSON column — zero-downtime on PostgreSQL.
- Backward compatible: existing bundles have `tierConfig: null`, widget falls back to `data-tier-config`.

**Cons:**
- Tier pills render slightly after page load (on API response, ~200–500 ms) rather than synchronously from HTML. Acceptable: the loading overlay covers init, and pills are secondary UI.
- The existing `data-tier-config` block setting path continues to work — two code paths in the widget for tier initialization. However, the precedence rule is clear: API-sourced wins.

**Verdict: Recommended.**

---

### Option D — DB + Shopify page metafield sync on save (hybrid)

Combination of C and B: write `tierConfig` to the DB AND call `metafieldsSet` on save to keep a Shopify-side cache for synchronous Liquid rendering.

**Verdict: Rejected.** Over-engineered for v1. The UX difference (synchronous vs. ~300 ms delayed pills) does not justify maintaining a two-write save path with a potential drift vector.

---

## Decision: Option C

Store `tierConfig` as a nullable JSON field on `Bundle`. Expose it through the existing bundle proxy API. Widget reads it from the API response, with fallback to `data-tier-config` for backward compatibility.

---

## Data Model

### Prisma schema change

```prisma
model Bundle {
  // ... existing fields ...
  tierConfig  Json?  // Ordered array of { label: string; linkedBundleId: string }
  // ...
}
```

### TypeScript type for the JSON value

```typescript
// app/types/tier-config.ts  (new file)

export interface TierConfigEntry {
  label: string;          // Display label, e.g. "Buy 3 @ ₹499 ›"
  linkedBundleId: string; // CUID of the linked Bundle record
}

export type TierConfig = TierConfigEntry[]; // 0–4 entries
```

### Validation rules (server-side)

- `tierConfig` must be an array.
- Maximum 4 entries.
- Each entry must have `label` (non-empty string, max 50 chars) and `linkedBundleId` (non-empty string).
- Each `linkedBundleId` must reference a `Bundle` record with `shopId === session.shop`.
- Entries failing validation are stripped (not an error) unless all are invalid while at least one was submitted.

### Bundle API response addition

The existing response shape in `api.bundle.$bundleId[.]json.tsx` gets one new top-level field:

```typescript
tierConfig: TierConfigEntry[] | null
```

---

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `tierConfig Json?` to `Bundle` model |
| `app/types/tier-config.ts` | New file — `TierConfigEntry` and `TierConfig` types |
| `app/lib/tier-config-validator.server.ts` | New file — `validateTierConfig(raw, shopId, db)` pure server function |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Parse `tierConfigData` from `formData` in `handleSaveBundle`; pass to `db.bundle.update` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/types.ts` | Add `tierConfig` field to `BundleData` interface |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Add "Pricing Tiers" nav item; render `<PricingTiersSection>` component; include `tierConfig` in save payload; load available bundles in the loader |
| `app/components/bundle-configure/PricingTiersSection.tsx` | New file — Polaris UI component for tier management |
| `app/hooks/useBundleConfigurationState.ts` | Add `tierConfig` / `setTierConfig` state (or managed inline in the component) |
| `app/routes/api/api.bundle.$bundleId[.]json.tsx` | Include `tierConfig` in `formattedBundle` response |
| `app/assets/bundle-widget-full-page.js` | Read `tierConfig` from API response; call `initTierPills()` from API data; retain `data-tier-config` fallback |
| `extensions/bundle-builder/blocks/bundle-full-page.liquid` | No change required for v1 (backward compat preserved via `data-tier-config` fallback) |
| `scripts/build-widget-bundles.js` | Increment `WIDGET_VERSION` (PATCH bump) |

---

## Migration / Backward Compatibility Strategy

### Prisma migration

```sql
-- Migration: add_tier_config_to_bundle
ALTER TABLE "Bundle" ADD COLUMN "tierConfig" JSONB;
```

- `JSONB` is already the Prisma default for `Json` fields on PostgreSQL.
- Nullable with no default — no UPDATE needed on existing rows.
- Index not required: `tierConfig` is only read by primary key lookup (bundle load).

### Widget backward compatibility

Priority order in the widget's `initTierPills` call site:

1. If `bundle.tierConfig` is a non-empty array (from API response) → use it.
2. Else if `this.config.tierConfig` (from `data-tier-config` parsing) is a non-empty array → use it.
3. Else → no tier pills rendered.

This means:
- Old bundles without `tierConfig` continue to work via `data-tier-config` (Theme Editor path unchanged).
- New bundles with `tierConfig` use the admin-configured tiers automatically.
- If a merchant configured tiers in both the Theme Editor and the admin, the admin-configured tiers take precedence.

---

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/lib/tier-config-validator.test.ts` | Unit | `validateTierConfig` — all valid/invalid shapes, ownership check |
| `tests/unit/routes/api.bundle.tier-config.test.ts` | Unit | `api.bundle.$bundleId[.]json.tsx` loader — `tierConfig` included in response when set, null when absent |
| `tests/unit/routes/full-page-configure.tier-save.test.ts` | Unit | `handleSaveBundle` — parses `tierConfigData` from formData, strips invalid entries, writes to DB |
| `tests/unit/assets/fpb-tier-api-source.test.ts` | Unit | Widget JS — tier pills initialized from API response data; fallback to `data-tier-config` when API data absent |

### Behaviors to Test (derived from PO acceptance criteria)

**`validateTierConfig` (unit — `tests/unit/lib/tier-config-validator.test.ts`):**
- Given a valid array of 2 entries with correct `label` and `linkedBundleId` → returns the array unchanged.
- Given an array with 5 entries → strips the 5th entry (max 4).
- Given an entry with empty `label` → strips that entry.
- Given an entry with empty `linkedBundleId` → strips that entry.
- Given a `linkedBundleId` that belongs to a different shop → strips that entry.
- Given `null` input → returns empty array.
- Given non-array input → returns empty array.
- Given `label` longer than 50 characters → strips or truncates (TBD at implementation — strip is safer).

**Bundle API response (unit — `tests/unit/routes/api.bundle.tier-config.test.ts`):**
- Given a bundle with `tierConfig = [{ label: "Buy 3", linkedBundleId: "abc" }]` in DB → response includes `bundle.tierConfig` with that value.
- Given a bundle with `tierConfig = null` in DB → response includes `bundle.tierConfig: null`.

**`handleSaveBundle` tier parsing (unit — `tests/unit/routes/full-page-configure.tier-save.test.ts`):**
- Given `formData` with valid `tierConfigData` JSON → `db.bundle.update` is called with `tierConfig` set.
- Given `formData` with no `tierConfigData` field → `db.bundle.update` is called with `tierConfig: null` (clears previous config).
- Given `formData` with `tierConfigData` containing an entry with a foreign shop's bundle ID → that entry is stripped before DB write.

**Widget tier initialization from API (unit — `tests/unit/assets/fpb-tier-api-source.test.ts`):**
- Given `bundle.tierConfig` in API response has 2+ entries → `initTierPills` is called with those entries.
- Given `bundle.tierConfig` in API response is null → widget falls back to `data-tier-config`.
- Given `bundle.tierConfig` in API response has 1 entry → no pills rendered (minimum is 2).
- Given both API `tierConfig` and `data-tier-config` are present → API source takes precedence.

### Mock Strategy

- **Mock:** `db` (Prisma client) using a jest mock factory — replace `db.bundle.update`, `db.bundle.findMany` etc. with jest.fn().
- **Mock:** `session` object with `{ shop: 'test-shop.myshopify.com' }`.
- **Do NOT mock:** `validateTierConfig` — it is a pure function and must be tested directly.
- **Do NOT mock:** Widget JS tier functions — they are pure JS functions tested in `tests/unit/assets/`.
- **Do NOT test:** Polaris `PricingTiersSection` React component rendering.

### TDD Exceptions (no tests required)

- Prisma migration file.
- `app/types/tier-config.ts` (pure type declaration).
- CSS/style changes.
- Liquid block (no functional change in v1).
- `scripts/build-widget-bundles.js` version bump.
