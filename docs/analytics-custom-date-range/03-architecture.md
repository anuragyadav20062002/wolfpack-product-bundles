# Architecture Decision Record: Analytics Custom Date Range

## Context

The analytics page (`/app/attribution`) currently supports only three fixed presets (7/30/90 days) via a Polaris `Select` dropdown. The goal is to replace this with a `Polaris DatePicker` in a `Popover`, while keeping the three presets as quick-select options. The loader must accept `?from=YYYY-MM-DD&to=YYYY-MM-DD` in addition to the existing `?days=N`.

## Constraints

- Must not break existing `?days=N` URL routing
- Must not add new DB query patterns (still exactly two Prisma queries)
- Must stay within the single `app.attribution.tsx` file — no new route files
- `buildBundleTrendSeries` change must be backward-compatible for unit tests

## Options Considered

### Option A: Popover + DatePicker, URL-param-driven navigation ✅ Recommended
- Replace the `Select` dropdown with a `Button disclosure` trigger that opens a `Popover`
- Inside the Popover: three preset chips + a `DatePicker allowRange multiMonth` calendar + Apply button
- On preset click or Apply: navigate via `window.location.href = ...?days=N` or `...?from=&to=`
- Loader reads `from`/`to` first; falls back to `days`
- **Pros:** Clean URL shape; calendar UX; no extra state synchronization needed (navigation resets state)
- **Verdict:** ✅ Recommended

### Option B: Client-side state, loader called via fetcher
- Keep current page, use `useFetcher` to re-run the loader with new params
- **Pros:** No full page reload
- **Cons:** More complex state management; `useFetcher` with a loader action is non-trivial in Remix; the existing `days` change handler already uses `window.location.href` — inconsistent to switch patterns for just the date picker
- **Verdict:** ❌ Rejected — premature complexity for this use case

## Decision: Option A

Single full-page navigation (matching the existing `handleDaysChange` pattern). The Polaris `DatePicker` requires controlled `month`/`year` state, but that is local to the Popover component and resets naturally on close.

## Data Model

No schema changes. The loader output shape gains two optional fields:

```typescript
// Loader return shape (new fields in bold)
{
  days: number;           // computed span (even for custom ranges)
  from?: string;          // "YYYY-MM-DD" — present only when custom range is active
  to?: string;            // "YYYY-MM-DD" — present only when custom range is active
  // ... all existing fields unchanged
}
```

The component derives the trigger label from `{ days, from, to }`:
- `from` + `to` present → format as "Mar 1 – Mar 25, 2026"
- Otherwise → "Last N days"

## `buildBundleTrendSeries` Signature Change

Current:
```typescript
export function buildBundleTrendSeries(
  current: OrderAttributionRow[],
  since: Date,
  days: number,
): TrendPoint[]
```

New (backward-compatible — `until` defaults to `new Date()`):
```typescript
export function buildBundleTrendSeries(
  current: OrderAttributionRow[],
  since: Date,
  days: number,
  until?: Date,
): TrendPoint[]
```

Internal change:
- `weekly = days >= 90` stays the same threshold
- The bucket fill loop uses `until` instead of `new Date(since.getTime() + days * 86400000)` for the upper bound

The caller in the loader passes `until` explicitly when using a custom range:
```typescript
const bundleRevenueTrend = buildBundleTrendSeries(attrRows, since, days, until);
```

For preset ranges, `until` is omitted (defaults to `new Date()`).

## Loader Change

```typescript
// New date variable derivation
const fromParam = url.searchParams.get("from");
const toParam   = url.searchParams.get("to");

let since: Date;
let until: Date;
let days: number;
let fromStr: string | undefined;
let toStr: string | undefined;

if (fromParam && toParam) {
  since = new Date(fromParam + "T00:00:00.000Z");
  until = new Date(toParam   + "T23:59:59.999Z");
  days  = Math.round((until.getTime() - since.getTime()) / 86400000);
  fromStr = fromParam;
  toStr   = toParam;
} else {
  days  = Math.max(1, parseInt(url.searchParams.get("days") || "30", 10));
  until = new Date();
  since = new Date(until);
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
}

// Previous period (symmetric)
const prevSince = new Date(since);
prevSince.setDate(prevSince.getDate() - days);
const prevUntil = new Date(since); // exclusive upper bound for prev period
```

The two Prisma queries become:
```typescript
currentAttributions:  where: { shopId, createdAt: { gte: since, lte: until } }
previousAttributions: where: { shopId, createdAt: { gte: prevSince, lt: since } }
```

(The existing current period query uses `gte: since` with no upper bound — adding `lte: until` is safe for preset ranges because `until` equals `new Date()` which is always >= any row's `createdAt`.)

## Component Change

Replace the `Select` in the `AttributionDashboard` component with a new `DateRangeSelector` sub-component (defined in the same file):

```typescript
interface DateRangeSelectorProps {
  days: number;
  from?: string;
  to?: string;
}

function DateRangeSelector({ days, from, to }: DateRangeSelectorProps) {
  const [popoverActive, setPopoverActive] = useState(false);
  const [{ month, year }, setCalendar] = useState({ month: ..., year: ... });
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | undefined>();

  // derive trigger label from props
  // render Popover > [preset chips | DatePicker | Apply]
}
```

The three preset chips navigate immediately on click (no Apply needed). The Apply button is disabled until `selectedRange` has both `start` and `end`.

## Files to Modify

| File | Change |
|------|--------|
| `app/routes/app/app.attribution.tsx` | (1) Loader: add `from`/`to` param handling; (2) Component: replace `Select` + `useState(days)` with `DateRangeSelector`; (3) Add Polaris `Popover`, `DatePicker` imports |
| `app/lib/analytics/analytics-helpers.ts` | `buildBundleTrendSeries`: add `until?: Date` param; update bucket fill loop |
| `tests/unit/lib/analytics-helpers.test.ts` | Add tests for `until` param behaviour; no existing tests should break |
| `app/styles/routes/app-attribution.module.css` | Add `.dateRangePopover`, `.presetChips`, `.presetChip`, `.calendarApplyRow` classes |

## Migration / Backward Compatibility Strategy

- `?days=N` URLs continue to work unchanged — loader falls back when `from`/`to` are absent
- `buildBundleTrendSeries` gets `until` as optional param — all existing call sites (and all existing tests) pass `days` and omit `until`, which remains valid
- No DB schema changes

## Testing Strategy

### Test Files to Create/Modify
| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/lib/analytics-helpers.test.ts` | Unit | `buildBundleTrendSeries` with explicit `until`; custom range spanning month boundary; same-day range |

### Behaviors to Test
- `buildBundleTrendSeries` with `until` explicitly set: last bucket should not exceed `until`
- `buildBundleTrendSeries` without `until` (existing tests): no regression
- Custom range where `days` is computed from `from`/`to` span: weekly bucketing kicks in at ≥ 90 days
- Same-day range (`from === to`): produces exactly 1 daily data point

### Mock Strategy
- No mocks needed — `buildBundleTrendSeries` is a pure function

### TDD Exceptions (no tests required)
- The Polaris `DateRangeSelector` component (UI rendering)
- Loader param parsing (Remix loader; covered by manual integration test)
- CSS changes
