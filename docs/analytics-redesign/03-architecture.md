# Architecture Decision Record: Analytics Page Redesign — Bundle Revenue Section

**ADR ID:** analytics-redesign-03
**Feature:** Analytics Page Redesign — Bundle Revenue Section
**Status:** Accepted
**Created:** 2026-03-26
**Author:** Aditya Awasthi
**Depends on:** 00-BR.md, 02-PO-requirements.md

---

## 1. Context and Constraints

### What we are building

A new "Bundle Revenue" section is being inserted above the existing UTM attribution section on the `app/attribution` route (`app/routes/app/app.attribution.tsx`). The section contains:

1. A 4-card KPI row (Bundle Revenue, Bundle Orders, Bundle AOV, % Revenue from Bundles) with period-over-period deltas.
2. A two-panel lower section: Revenue Trend chart (bundle revenue + total revenue) and a Revenue by Bundle leaderboard (top 10, sorted by revenue).
3. The existing UTM attribution section moves below, visually separated by a section heading.

No new DB schema, migrations, or data collection is required. All metrics derive from the existing `OrderAttribution` table.

### Codebase constraints

- **Remix + Prisma + TypeScript + Polaris + Recharts stack.** The route is a standard Remix loader/component file with no separate data layer.
- **Existing loader pattern:** Two full `OrderAttribution` result sets (`currentAttributions`, `previousAttributions`) are already fetched via `Promise.all` and held in memory. All six existing aggregations (`byPlatform`, `byMedium`, `byCampaign`, `byBundle`, `byLandingPage`, time series) are pure JavaScript loops over those in-memory arrays — no secondary DB calls.
- **Existing bundle name lookup:** A secondary `db.bundle.findMany` is already issued against the `Bundle` table for the unique `bundleId` values found in `currentAttributions`. It currently selects `{ id, name }`. This query must be extended to also select `status` to support the archived badge requirement.
- **No `orderAttributions` Prisma relation** exists on the `Bundle` model. Bundle metadata is always resolved via the secondary lookup pattern above.
- **`BundleStatus` enum** has three values: `draft`, `active`, `archived`. (The PO document references "deleted" — no such value exists.)
- **`OrderAttribution` indexes:** Compound indexes exist on `[shopId, createdAt]` and `[bundleId, createdAt]`.
- **NFR-01:** Page must load in <2 s for shops with ≤10k `OrderAttribution` rows.
- **Chart library:** Recharts `AreaChart` is already imported and used. The new trend chart reuses the same component with a second `Area` series.
- **Polaris version:** Existing code uses `InlineStack`, `BlockStack`, `Badge`, `Banner`, `Button`, `Select`, `Text`, `Page`. New components needed: `InlineGrid`, `Tooltip`.
- **Time range change mechanism:** Full page reload via `window.location.href`. New sections follow the same pattern.

### What must not change

- Existing loader return fields (`days`, `pixelActive`, `summary`, `timeSeries`, `byPlatform`, `byMedium`, `byCampaign`, `byBundle`, `byLandingPage`) must remain identical in shape. New fields are additive only.
- The `PixelStatusCard` component and existing UTM attribution section UI are not touched.
- The existing `formatRevenue`, `formatRevenueShort`, `formatGrowth`, `isPositiveGrowth`, `formatDateKey` helpers remain in place and are reused.

---

## 2. Options Considered

### Option A — In-memory aggregation from the single existing fetch (Selected)

**Approach:** Extend the existing two-fetch `Promise.all` pattern. The loader already loads all `OrderAttribution` rows for both periods into `currentAttributions` and `previousAttributions`. Add three new pure-JS aggregation passes over those already-loaded arrays, immediately after the existing aggregation loops.

The bundle name/status lookup already exists as a secondary DB query. Extend its `select` to include `status`. No new DB queries are issued.

**Query budget:** 3 DB queries total (unchanged from today):
1. `db.orderAttribution.findMany` for current period — already exists.
2. `db.orderAttribution.findMany` for previous period — already exists.
3. `db.bundle.findMany` for name+status lookup — already exists, extended to add `status`.

**Aggregation work (new, pure JS):**
- Bundle revenue summary: single pass over `currentAttributions` + single pass over `previousAttributions`, both filtering `a.bundleId !== null`.
- Bundle leaderboard: reuse and extend existing `byBundleMap` loop to accumulate AOV and join status from the extended `bundleStatusMap`.
- Bundle revenue trend: extend existing `timeSeriesMap` loop to track a `bundleRevenue` accumulator per day alongside the existing `revenue` accumulator.

**Trade-offs:**
- Pro: Zero new DB queries. Consistent with every existing aggregation in the file. Fastest path for NFR-01.
- Pro: Trivially unit-testable — the aggregation functions are pure JS with no DB dependency.
- Pro: No risk of N+1 queries as bundle count grows.
- Con: Loads all `OrderAttribution` rows into Node.js memory. For NFR-01 scoped shops (≤10k rows), each row is ~200 bytes → ~2 MB worst case, well within Render's memory headroom.
- Con: If a future merchant has 100k+ rows, this approach will hit memory pressure. That is an accepted scaling risk for the current NFR-01 scope.

### Option B — Targeted Prisma `groupBy` and `aggregate` queries

**Approach:** Issue three new DB queries using Prisma's `groupBy` for the leaderboard and `aggregate` with `_sum`/`_count` for the summary.

**Query budget:** 6 DB queries total (3 existing + 3 new).

**Trade-offs:**
- Pro: DB does the aggregation work, reducing data transferred to Node.js for the leaderboard and summary.
- Pro: Naturally scales beyond 10k rows without memory pressure.
- Con: Doubles the query count (3 to 6). Each new query is a separate round-trip (~5-15 ms each on Render).
- Con: The trend series still requires in-memory binning regardless — making it a hybrid approach.
- Con: `groupBy` queries require joining Bundle names/status separately, re-introducing the secondary lookup pattern.
- Con: Inconsistent with the existing loader pattern where all six aggregations are in-memory.
- Con: More complex to unit test — requires `groupBy`/`aggregate` mock shapes.

### Decision: Option A

**Rationale:** The existing loader establishes in-memory aggregation as the single pattern for this route. Option A is a strict extension with no new queries, no new abstraction layer, and no memory risk within NFR-01 bounds. The extra three aggregation passes are O(n) over the already-loaded array — negligible cost versus the two DB fetches that dominate loader latency.

Option B's advantage (DB-side aggregation) only matters beyond ~50k rows per shop — well outside NFR-01 scope. The added query count and code complexity of Option B is not justified at the current scale.

---

## 3. Data Model

### New loader return shape (additive)

Three new fields added to the existing loader `json(...)` return:

```typescript
// ─── New field 1: Bundle Revenue Summary ─────────────────────────────────────
bundleRevenueSummary: {
  // Current period
  totalBundleRevenue: number;       // cents; sum of revenue WHERE bundleId IS NOT NULL
  totalBundleOrders: number;        // count WHERE bundleId IS NOT NULL
  bundleAOV: number | null;         // cents; null when totalBundleOrders === 0
  bundleRevenuePercent: number;     // 0-100; (bundleRevenue / totalRevenue) * 100; 0 if totalRevenue === 0

  // Previous period (same window length, immediately prior)
  prevTotalBundleRevenue: number;
  prevTotalBundleOrders: number;
  prevBundleAOV: number | null;
  prevBundleRevenuePercent: number;
}

// ─── New field 2: Bundle Leaderboard ─────────────────────────────────────────
bundleLeaderboard: Array<{
  bundleId: string;
  bundleName: string;         // from bundleNameMap; falls back to "Unknown Bundle"
  bundleStatus: string;       // 'draft' | 'active' | 'archived'
  revenue: number;            // cents; current period only
  orders: number;
  aov: number | null;         // cents; null when orders === 0
}>
// Sorted by revenue DESC, top 10 only

// ─── New field 3: Bundle Revenue Trend ───────────────────────────────────────
bundleRevenueTrend: Array<{
  date: string;               // "YYYY-MM-DD" for 7d/30d; ISO week-start date for 90d
  bundleRevenue: number;      // cents
  totalRevenue: number;       // cents (mirrors existing timeSeries)
}>
// 7d/30d: daily (7 or 30 points), 90d: weekly aggregation (~13 points)
```

### Updated bundle lookup query

The existing `db.bundle.findMany` select must be extended:

```typescript
// Before:
select: { id: true, name: true }

// After:
select: { id: true, name: true, status: true }
```

A parallel `bundleStatusMap: Record<string, string>` is built alongside the existing `bundleNameMap`. This avoids changing `bundleNameMap`'s string-value type, which is referenced in six existing places.

---

## 4. Pure Helper Functions — `app/lib/analytics/`

All new aggregation logic lives in a new module at `app/lib/analytics/analytics-helpers.ts`. This module has no imports except TypeScript types — no Prisma, no DB, no Remix. It is a pure computation layer.

### Module: `app/lib/analytics/analytics-helpers.ts`

**Exported types:**

```typescript
export interface OrderAttributionRow {
  bundleId: string | null;
  revenue: number;
  createdAt: Date;
}

export interface BundleRevenueSummary {
  totalBundleRevenue: number;
  totalBundleOrders: number;
  bundleAOV: number | null;
  bundleRevenuePercent: number;
  prevTotalBundleRevenue: number;
  prevTotalBundleOrders: number;
  prevBundleAOV: number | null;
  prevBundleRevenuePercent: number;
}

export interface LeaderboardRow {
  bundleId: string;
  bundleName: string;
  bundleStatus: string;
  revenue: number;
  orders: number;
  aov: number | null;
}

export interface TrendPoint {
  date: string;
  bundleRevenue: number;
  totalRevenue: number;
}

export type DeltaDirection = "positive" | "negative" | "neutral";

export interface FormattedDelta {
  label: string;   // e.g. "+23.0%", "-5.1%", or "—" when previous is 0
  direction: DeltaDirection;
}
```

**Exported functions:**

```typescript
/**
 * Compute bundle revenue KPIs for current and previous periods.
 * @param current - All OrderAttribution rows for the current period
 * @param previous - All OrderAttribution rows for the previous period
 * @param currentTotalRevenue - Sum of ALL revenue in current period (cents)
 * @param prevTotalRevenue - Sum of ALL revenue in previous period (cents)
 */
export function computeBundleRevenueSummary(
  current: OrderAttributionRow[],
  previous: OrderAttributionRow[],
  currentTotalRevenue: number,
  prevTotalRevenue: number,
): BundleRevenueSummary

/**
 * Build the leaderboard: top N bundles by revenue, current period only.
 * @param current - All OrderAttribution rows for the current period
 * @param bundleNameMap - { [bundleId]: bundleName }
 * @param bundleStatusMap - { [bundleId]: bundleStatus }
 * @param limit - Max rows to return (default 10)
 */
export function buildBundleLeaderboard(
  current: OrderAttributionRow[],
  bundleNameMap: Record<string, string>,
  bundleStatusMap: Record<string, string>,
  limit?: number,
): LeaderboardRow[]

/**
 * Build bundle revenue trend series (daily for 7d/30d, weekly for 90d).
 * @param current - All OrderAttribution rows for the current period
 * @param since - Period start Date (inclusive)
 * @param days - 7 | 30 | 90
 */
export function buildBundleTrendSeries(
  current: OrderAttributionRow[],
  since: Date,
  days: number,
): TrendPoint[]

/**
 * Format a period-over-period numeric delta as a label + direction.
 * Returns direction "neutral" and label "—" when previous is 0.
 */
export function formatDelta(current: number, previous: number): FormattedDelta
```

### Weekly aggregation (90-day trend)

For `days === 90`, `buildBundleTrendSeries` groups rows into ISO week buckets using the Monday of each row's week as the key. Produces ~13 data points. Every week in the window is filled — no gaps.

```typescript
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();           // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;  // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}
```

### Module: `app/lib/analytics/index.ts`

Barrel re-export of all public types and functions from `analytics-helpers.ts`.

---

## 5. Files to Create or Modify

| File | Action | Description |
|---|---|---|
| `app/lib/analytics/analytics-helpers.ts` | CREATE | Pure aggregation functions: `computeBundleRevenueSummary`, `buildBundleLeaderboard`, `buildBundleTrendSeries`, `formatDelta`. Zero external dependencies. |
| `app/lib/analytics/index.ts` | CREATE | Barrel re-export of all public symbols. |
| `app/routes/app/app.attribution.tsx` | MODIFY | (1) Extend bundle select to add `status`. (2) Add `bundleStatusMap`. (3) Import and call three new helpers. (4) Add three new fields to `json()` return. (5) Add `BundleKpiRow`, `BundleTrendChart`, `BundleLeaderboardCard` components. (6) Wire into `AttributionDashboard` render. (7) Add `InlineGrid`, `Tooltip` to Polaris imports. (8) Fix page subtitle. |
| `app/styles/routes/app-attribution.module.css` | MODIFY | Add `.bundleKpiGrid`, `.bundleKpiCard`, `.bundleKpiLabel`, `.bundleKpiValue`, `.bundleSplitRow`, `.leaderboardRow`, `.sectionDivider` CSS classes. |
| `tests/unit/lib/analytics-helpers.test.ts` | CREATE | Unit tests for all four exported functions. Pure input/output, no mocks. |

---

## 6. Component Design

### Sub-components within `app.attribution.tsx`

**`BundleKpiRow`**
```
Props: { summary: BundleRevenueSummary; currency: string; }
```
Renders `InlineGrid columns={{ xs: 2, md: 4 }}` with four `Card` components. Each card: label (`Text variant="bodyMd" tone="subdued"`), value (`Text variant="headingXl"`), delta badge (`Badge tone="success"|"critical"|"subdued"`). Uses `formatDelta` for badge labels. Revenue formatted via `Intl.NumberFormat`.

**`BundleTrendChart`**
```
Props: { trend: TrendPoint[]; days: number; isClient: boolean; }
```
Renders only when `isClient === true` (SSR guard — same as existing chart). Uses Recharts `AreaChart`/`ResponsiveContainer`. Two `Area` series:
- `bundleRevenue`: filled area, primary color `#008060`, `linearGradient id="bundleRevGrad"` (distinct from existing `revGrad` to avoid SVG id collision)
- `totalRevenue`: dashed line, `strokeDasharray="4 2"`, `fillOpacity={0}`

Reuses `formatRevenueShort` (Y-axis), `formatDateKey` (X-axis), same `xAxisInterval` calculation.

**`BundleLeaderboardCard`**
```
Props: { leaderboard: LeaderboardRow[]; currency: string; }
```
Uses existing `.dataTable` / `.dataRow` / `.dataCell` CSS class pattern (consistent with `byPlatform`, `byMedium`, `byCampaign` tables). A new `.leaderboardRow` class defines `grid-template-columns: 1fr 100px 72px 80px` for 4 columns: Bundle Name | Revenue | Orders | AOV.

- Bundle names >40 chars: CSS `text-overflow: ellipsis` + `Polaris Tooltip` wrapping the cell.
- Archived bundles: inline `Badge tone="attention"` with text "Archived" appended after name.
- Empty state: centered `"No bundle orders in this period."` message.

> **Note:** Polaris `DataTable` was specified in PO requirements but all existing tables use the custom CSS grid pattern. Using `DataTable` for one section would create visual inconsistency. Custom CSS table is used throughout.

### Layout changes in `AttributionDashboard`

Render order:
1. No-data `Banner` (existing, unchanged)
2. `PixelStatusCard` (existing, unchanged)
3. Date range `Select` row (existing, unchanged)
4. **NEW:** `BundleKpiRow`
5. **NEW:** `.bundleSplitRow` grid — `BundleTrendChart` (left ~55%) + `BundleLeaderboardCard` (right ~45%)
6. **NEW:** `.sectionDivider` with heading "UTM Attribution"
7. Existing stat cards (Total Ad Revenue, Attributed Orders, Avg. Order Value)
8. Existing Revenue Trend chart (existing, unchanged)
9. Existing UTM section cards (Platform, Channel, Campaign, Landing Page, Bundles by Ad Revenue)

`.bundleSplitRow`: `display: grid; grid-template-columns: 55fr 45fr; gap: 16px;` collapsing to single column below 768px.

---

## 7. Data Flow

```
Browser request: GET /app/attribution?days=30
        |
        v
[Remix Loader — app.attribution.tsx]
        |
        |-- Promise.all([
        |     db.orderAttribution.findMany(current)    → currentAttributions[]
        |     db.orderAttribution.findMany(previous)   → previousAttributions[]
        |   ])
        |
        |-- db.bundle.findMany({ select: { id, name, status } })  [extended]
        |   → bundleNameMap: Record<string, string>
        |   → bundleStatusMap: Record<string, string>   [NEW]
        |
        |-- Existing in-memory passes (unchanged):
        |   totalRevenue, totalOrders, byPlatform, byMedium, byCampaign,
        |   byBundle, byLandingPage, timeSeries
        |
        |-- NEW in-memory passes (app/lib/analytics):
        |   computeBundleRevenueSummary(current, previous, totalRev, prevTotalRev)
        |   → bundleRevenueSummary
        |
        |   buildBundleLeaderboard(current, bundleNameMap, bundleStatusMap, 10)
        |   → bundleLeaderboard[]
        |
        |   buildBundleTrendSeries(current, since, days)
        |   → bundleRevenueTrend[]
        |
        v
json({ ...existing fields, bundleRevenueSummary, bundleLeaderboard, bundleRevenueTrend })
        |
        v
[Component — AttributionDashboard]
        |
        |-- BundleKpiRow → formatDelta(), Intl.NumberFormat
        |-- BundleTrendChart → Recharts AreaChart, 2 Area series, SSR guard
        |-- BundleLeaderboardCard → custom CSS table, Tooltip, Badge
        v
Rendered HTML
```

---

## 8. Testing Strategy

### Test file

`tests/unit/lib/analytics-helpers.test.ts`

Uses Jest (`describe`/`it`/`expect`) consistent with the pattern in `tests/unit/lib/auth-guards.test.ts`. **No mocks** — all four functions are pure.

### Mock strategy

No mocks. Functions accept plain `OrderAttributionRow` object arrays (TypeScript interfaces, not Prisma generated types). Test fixtures are simple inline object literals.

```typescript
function makeRow(overrides: Partial<OrderAttributionRow> = {}): OrderAttributionRow {
  return {
    bundleId: 'bundle-1',
    revenue: 5000,         // $50.00
    createdAt: new Date('2026-03-01T12:00:00Z'),
    ...overrides,
  };
}
```

### Behaviors to test

**`computeBundleRevenueSummary`**

| Test | Input | Expected |
|---|---|---|
| Standard case | 3 bundle rows + 2 non-bundle current; 2 bundle previous | Correct sums, percent, AOV |
| Zero bundle orders current | All rows `bundleId: null` | `totalBundleRevenue: 0`, `totalBundleOrders: 0`, `bundleAOV: null`, `bundleRevenuePercent: 0` |
| Zero orders in previous | Empty `previous` array | `prevBundleAOV: null`, `prevBundleRevenuePercent: 0` |
| Zero total revenue | `currentTotalRevenue: 0` | `bundleRevenuePercent: 0` (no divide-by-zero) |
| AOV rounded | Revenue 10001 / 3 orders | `bundleAOV: 3334` |
| All orders are bundle orders | All rows have `bundleId` | `bundleRevenuePercent: 100` |

**`buildBundleLeaderboard`**

| Test | Input | Expected |
|---|---|---|
| Standard case | 5 bundles, mixed revenue | Sorted desc by revenue |
| Limit enforcement | 12 distinct bundles | Returns exactly 10 rows |
| Unknown bundle | `bundleId` not in `bundleNameMap` | `bundleName: "Unknown Bundle"`, `bundleStatus: "active"` |
| Archived bundle | `bundleStatusMap['b1'] = 'archived'` | `bundleStatus: 'archived'` in row |
| AOV null guard | `orders: 0` | `aov: null` |
| Empty input | `current: []` | Returns `[]` |
| Non-bundle rows excluded | Mix of null + non-null bundleId | Only non-null rows appear |

**`buildBundleTrendSeries`**

| Test | Input | Expected |
|---|---|---|
| 7-day window | 1 bundle row per day | 7 points, correct `bundleRevenue` |
| 30-day window sparse | Not every day has rows | 30 points; zero-filled for days without data |
| 90-day window | 90 days of data | ~13 weekly points |
| Mixed bundle/non-bundle | Same day has both null and non-null bundleId | `bundleRevenue` = non-null only; `totalRevenue` = all |
| Zero revenue day | No rows on a day | `bundleRevenue: 0`, `totalRevenue: 0` |
| Date key format | Any row | Keys are "YYYY-MM-DD" strings |
| 90d weekly grouping | Rows across two weeks | Two distinct week-start date keys |

**`formatDelta`**

| Test | Input | Expected |
|---|---|---|
| Positive | current 120, previous 100 | `{ label: "+20.0%", direction: "positive" }` |
| Negative | current 80, previous 100 | `{ label: "-20.0%", direction: "negative" }` |
| Zero change | current 100, previous 100 | `{ label: "+0.0%", direction: "neutral" }` |
| Previous zero | current 50, previous 0 | `{ label: "—", direction: "neutral" }` |
| Both zero | current 0, previous 0 | `{ label: "—", direction: "neutral" }` |
| -100% | current 0, previous 50 | `{ label: "-100.0%", direction: "negative" }` |

### TDD exceptions (no tests required)

- CSS changes in `app-attribution.module.css`
- Polaris/Recharts UI component rendering (too coupled to DOM)
- Loader function itself (requires Remix + Prisma integration environment)

---

## 9. Implementation Build Sequence

### Phase 1 — Pure helpers and tests

- [ ] Create `app/lib/analytics/analytics-helpers.ts` with all four exported functions and types.
- [ ] Create `app/lib/analytics/index.ts` barrel file.
- [ ] Write `tests/unit/lib/analytics-helpers.test.ts` with all test cases.
- [ ] Run `npm test` — all new tests pass.
- [ ] Run `npx eslint --max-warnings 9999 app/lib/analytics/analytics-helpers.ts app/lib/analytics/index.ts tests/unit/lib/analytics-helpers.test.ts` — zero errors.

### Phase 2 — Loader extension

- [ ] Extend `db.bundle.findMany` select to include `status`.
- [ ] Add `bundleStatusMap` initialization.
- [ ] Import and call three new helpers.
- [ ] Add three new fields to `json(...)` return.
- [ ] Update `useLoaderData` destructure.
- [ ] Run `npm test` — no regressions.
- [ ] Run eslint — zero errors.

### Phase 3 — New CSS classes

- [ ] Add to `app/styles/routes/app-attribution.module.css`:
  - `.bundleKpiGrid`, `.bundleKpiCard`, `.bundleKpiLabel`, `.bundleKpiValue`
  - `.bundleSplitRow` (two-column grid, collapses to 1-col below 768px)
  - `.leaderboardRow` (`grid-template-columns: 1fr 100px 72px 80px`)
  - `.sectionDivider` (horizontal separator with embedded label)

### Phase 4 — New UI sub-components

- [ ] Implement `BundleKpiRow` component.
- [ ] Implement `BundleTrendChart` component (second `Area` series, `linearGradient id="bundleRevGrad"`).
- [ ] Implement `BundleLeaderboardCard` component.
- [ ] Add `InlineGrid`, `Tooltip` to Polaris imports.
- [ ] Wire all three into `AttributionDashboard` render in the specified order.
- [ ] Update page subtitle to `"Bundle revenue & UTM attribution"`.
- [ ] Run `npm test` — no regressions.
- [ ] Run eslint — zero errors.

### Phase 5 — Manual verification

- [ ] Test `?days=7`, `?days=30`, `?days=90` — all KPI cards, leaderboard, and trend chart render correctly.
- [ ] Verify existing UTM attribution cards are untouched.
- [ ] Verify page subtitle reads "Bundle revenue & UTM attribution".
- [ ] Verify empty state: shop with zero `OrderAttribution` rows shows no blank sections, no JS errors.

---

## 10. Critical Details

### Currency handling

The existing `formatRevenue` helper takes `cents: number, currency = "USD"`. The loader does not currently expose the shop's currency to the frontend. For this release, `currency = "USD"` default is used (consistent with existing KPI cards). Currency exposure is a follow-on task.

### Period-over-period delta for "% Revenue from Bundles"

This is a percentage-point change, not a relative percentage change. E.g., 30% → 34% = "+4 pp", not "+13.3%". The `BundleKpiRow` component overrides the label suffix for this specific card to read "+4.0 pp" rather than "+4.0%".

### SSR guard for chart

`BundleTrendChart` must guard on `isClient === true` (same as existing chart). Recharts uses `ResizeObserver` which is unavailable in SSR. The existing `isClient` state in `AttributionDashboard` is shared by both charts — no new state needed.

### SVG gradient id collision

The existing chart defines `linearGradient id="revGrad"`. New trend chart must use distinct ids (`bundleRevGrad`, `totalRevGrad`) to avoid SVG namespace collision when both charts render simultaneously.

### `bundleId` null filtering

All three helpers filter on `row.bundleId !== null`. The TypeScript interface types `bundleId` as `string | null` to match the Prisma model.

### No new Prisma migrations

The only schema-adjacent change is extending an existing `select` to include the already-existing `status` field. Zero DB migrations needed.

---

## Related Documents

- `docs/analytics-redesign/00-BR.md` — Business Requirement
- `docs/analytics-redesign/02-PO-requirements.md` — Product Owner Requirements
- `app/routes/app/app.attribution.tsx` — Route file to modify
- `app/styles/routes/app-attribution.module.css` — CSS module to modify
- `tests/unit/lib/auth-guards.test.ts` — Jest test pattern to follow
- `prisma/schema.prisma` — `Bundle` and `OrderAttribution` models
