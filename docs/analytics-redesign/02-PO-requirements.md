# Product Owner Requirements: Analytics Page Redesign

## Overview

The Analytics page becomes a two-section dashboard: **Bundle Revenue** (primary, top) and **UTM Attribution** (secondary, below). All data comes from the existing `OrderAttribution` table — no new DB schema needed. The page subtitle changes to "Bundle revenue & UTM attribution".

---

## User Stories with Acceptance Criteria

### Story 1: Hero KPI Bar

**As a** merchant
**I want** to see 4 key bundle revenue metrics at the top of the page
**So that** I can assess performance at a glance without scrolling

**Acceptance Criteria:**
- [ ] Given any time range selected, when the page loads, then 4 KPI cards are shown in a responsive row: "Bundle Revenue", "Bundle Orders", "Bundle AOV", "% Revenue from Bundles"
- [ ] Given the selected period has data, when the KPI renders, then each card shows a period-over-period delta badge (e.g. "+23%" in green, "-5%" in red, or "—" if no prior data)
- [ ] Given the selected period has zero bundle orders, when the KPI renders, then values show "$0", "0", "—", "0%" respectively (not blank or error)
- [ ] Given currency is not USD, when revenue displays, then the currency code is shown (e.g. "£1,240" or "€980")
- [ ] All 4 KPIs update when the time-range selector changes — no page reload required (client-side derived from the same loader data)

**KPI definitions:**
| Card | Value | Delta |
|------|-------|-------|
| Bundle Revenue | Sum of `revenue / 100` where `bundleId IS NOT NULL` | vs same window prior period |
| Bundle Orders | Count of `OrderAttribution` where `bundleId IS NOT NULL` | vs same window prior period |
| Bundle AOV | Bundle Revenue ÷ Bundle Orders (or "—" if 0 orders) | vs same window prior period |
| % Revenue from Bundles | Bundle Revenue ÷ Total Revenue × 100 | vs same window prior period |

---

### Story 2: Revenue by Bundle Leaderboard

**As a** merchant
**I want** to see which bundles are generating the most revenue
**So that** I know where to focus my marketing and optimization effort

**Acceptance Criteria:**
- [ ] Given bundles have attributed orders, when the leaderboard renders, then it shows up to 10 bundles sorted by revenue descending
- [ ] Given a bundle has attributed orders, when its row renders, then it shows: bundle name, total revenue, order count, and AOV for the selected period
- [ ] Given a bundle name is >40 characters, when the row renders, then the name is truncated with ellipsis and a tooltip shows the full name
- [ ] Given fewer than 10 bundles have data, when the leaderboard renders, then it shows exactly how many bundles have data (no empty rows)
- [ ] Given zero bundles have attributed orders in the period, when the leaderboard renders, then it shows an empty-state message: "No bundle orders in this period. Enable the UTM pixel and tag your ad links to start tracking."
- [ ] Bundles with `status: archived` or `status: deleted` may still appear if they have revenue data — show their name with a "Archived" badge

---

### Story 3: Revenue Trend Chart

**As a** merchant
**I want** to see how my bundle revenue trends over time
**So that** I can spot growth, seasonality, or drops linked to campaigns

**Acceptance Criteria:**
- [ ] Given a time range is selected, when the chart renders, then the x-axis shows dates and the y-axis shows revenue in the shop's currency
- [ ] Given 7-day range selected, then daily data points (7 points)
- [ ] Given 30-day range selected, then daily data points (30 points)
- [ ] Given 90-day range selected, then weekly aggregation (13 points) to avoid noise
- [ ] The chart has two series: "Bundle Revenue" (filled area, primary color) and "Total Revenue" (line, secondary color) — both for the selected period
- [ ] Given a day has zero orders, the chart shows $0 for that day (no gap in the line)
- [ ] Given all days are zero, the chart shows an empty-state illustration — not a flat line with no labels

---

### Story 4: UTM Attribution Section (existing, cleaned up)

**As a** merchant
**I want** the existing UTM attribution breakdown to remain accessible
**So that** I can still analyze which campaigns are driving bundle-associated orders

**Acceptance Criteria:**
- [ ] The UTM attribution section (platform, medium, campaign, landing page breakdowns) remains on the page below the Bundle Revenue section
- [ ] Section is visually separated with a divider or section heading "UTM Attribution"
- [ ] All existing UTM data and metrics are preserved exactly
- [ ] "Why are values nil?" helper section remains for empty states

---

### Story 5: Page-level UI polish

**As a** merchant
**I want** the Analytics page to look and feel like a real analytics product
**So that** I trust the data and come back to it regularly

**Acceptance Criteria:**
- [ ] Page title: "Analytics"
- [ ] Page subtitle: "Bundle revenue & UTM attribution"
- [ ] Time-range selector is positioned in the page header area (not buried mid-page)
- [ ] Section headers use Polaris `Text variant="headingMd"` with a subtle visual separator
- [ ] KPI cards use Polaris `Card` with consistent padding — no custom inline styles on the outer containers
- [ ] The page does not show a blank white area when data is loading — use Polaris `SkeletonBodyText` or `SkeletonDisplayText` as placeholders

---

## UI/UX Specifications

### Page Layout (top to bottom)

```
┌─────────────────────────────────────────────────────────────┐
│ Page Header                                                 │
│   Title: "Analytics"                                        │
│   Subtitle: "Bundle revenue & UTM attribution"             │
│   Right: [Last 7 days ▾]  [Last 30 days]  [Last 90 days]  │
├─────────────────────────────────────────────────────────────┤
│ SECTION: Bundle Revenue                                     │
│                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ Bundle   │ │ Bundle   │ │ Bundle   │ │ % Revenue│       │
│ │ Revenue  │ │ Orders   │ │ AOV      │ │ from     │       │
│ │          │ │          │ │          │ │ Bundles  │       │
│ │  $4,280  │ │    38    │ │  $112    │ │   34%    │       │
│ │ +23% ↑  │ │ +12% ↑  │ │ +9%  ↑  │ │ +4pp ↑  │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│ ┌─────────────────────┐  ┌──────────────────────────────┐  │
│ │ Revenue Trend       │  │ Revenue by Bundle            │  │
│ │ [Area chart]        │  │ 1. Summer Bundle    $1,240 ▶ │  │
│ │  Bundle vs Total    │  │ 2. Gift Set 3       $980  ▶  │  │
│ │                     │  │ 3. Starter Pack     $760  ▶  │  │
│ └─────────────────────┘  └──────────────────────────────┘  │
│                                                             │
│ ─────────────── UTM Attribution ──────────────────────────  │
│ [existing UTM cards — by Platform, Medium, Campaign, etc.] │
└─────────────────────────────────────────────────────────────┘
```

### KPI Card Spec (Polaris `Card`)

```
┌─────────────────────┐
│  Bundle Revenue      │  ← Text variant="bodyMd" tone="subdued"
│  $4,280              │  ← Text variant="headingXl" fontWeight="bold"
│  ▲ +23% vs last period │ ← Badge tone="success" or "critical"
└─────────────────────┘
```

- Use `InlineGrid columns={{ xs: 2, md: 4 }}` for the KPI row
- Period-over-period delta: green badge for positive, red for negative, neutral for 0
- Currency format: `Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode })`

### Revenue by Bundle Card

- Polaris `DataTable` with columns: Bundle Name | Revenue | Orders | AOV
- Sorted by revenue descending
- Max 10 rows; if more, show "and N more bundles" below
- Empty state: Polaris `EmptyState` with icon and message

### Revenue Trend Chart

- Use a lightweight inline SVG area chart (same approach as existing chart on the page)
- Two datasets: bundle revenue (primary), total revenue (dashed line)
- Tooltip on hover showing exact date + revenue
- X-axis: abbreviated date labels ("Mar 1", "Mar 8" etc.)
- Y-axis: currency-formatted values ($0, $500, $1k, etc.)

---

## Data Persistence

No new data is written. All metrics are derived from `OrderAttribution` at query time.

**Loader data shape (additions to existing):**

```typescript
// New fields added to existing loader return
bundleRevenueSummary: {
  totalBundleRevenue: number;       // cents
  totalBundleOrders: number;
  bundleAOV: number | null;         // cents
  bundleRevenuePercent: number;     // 0-100
  // period-over-period
  prevTotalBundleRevenue: number;
  prevTotalBundleOrders: number;
  prevBundleAOV: number | null;
  prevBundleRevenuePercent: number;
}

bundleLeaderboard: Array<{
  bundleId: string;
  bundleName: string;
  bundleStatus: string;
  revenue: number;       // cents
  orders: number;
  aov: number | null;
}>

bundleRevenueTrend: Array<{
  date: string;          // "YYYY-MM-DD"
  bundleRevenue: number; // cents
  totalRevenue: number;  // cents
}>
```

---

## Backward Compatibility Requirements

- All existing `OrderAttribution` data remains valid and visible
- The existing UTM attribution section is unchanged in its data; only repositioned below
- Existing loader fields (`attributions`, `revenueByPlatform`, etc.) are preserved — new fields are additive

---

## Out of Scope (explicit)

- Widget event tracking (views, add-to-cart clicks) for funnel metrics
- Conversion rate (requires view tracking)
- Plan-gating any analytics features
- CSV/data export
- Real-time updates (SSE/WebSocket)
- Comparison against specific date ranges (custom date picker)
- Individual order drill-down
