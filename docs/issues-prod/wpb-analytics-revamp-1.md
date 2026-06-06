# Issue: Analytics Page Revamp — Engagement-First, Wolfpack-Original Design

**Issue ID:** wpb-analytics-revamp-1
**Status:** Design draft (awaiting sign-off)
**Priority:** 🟡 Medium
**Created:** 2026-06-06
**Last Updated:** 2026-06-06

## Overview

The current analytics page (`app/routes/app/app.attribution.tsx`, 1,425 lines) is a pure UTM-revenue dashboard built on `OrderAttribution` (checkout-completed events). It works, but it tells half the story — merchants only see who *converted*, not who *engaged*. With the `BundleEngagement` model just shipped (issue `wpb-storefront-analytics-events-1`) and 9 `wpb:*` storefront events firing, we have the data to show the **full funnel** — views → engagements → ATC → checkout → revenue — which is something most Shopify analytics apps (including EB) cannot do.

This issue revamps the page around an **engagement-first, funnel-as-story** narrative. The design is Wolfpack-original — it does **not** mirror EB or copy any competitor pattern. Every section answers a merchant question they cannot answer today.

## Design Principles

1. **Engagement is the new top metric.** Revenue stays important, but engagement comes first because it's the earliest, most actionable signal.
2. **Every bundle is a story.** A merchant should be able to glance at one bundle row and instantly understand: is this design working? where are people dropping off?
3. **Differentiate by what only WPB can show.** Funnel drop-off, preset-aware engagement, real-time activity. Don't compete with Shopify Analytics on the parts they own (raw conversion).
4. **Wolfpack-original visual language.** No Polaris components. No "competitor-app" patterns. Custom CSS modules, recharts only. Single accent (deep teal `#0E7C7B`), money in muted gold (`#B08800`), engagement in deep coral (`#D4493E`), negative space generous, rounded 12 px, large numerics (40–48 px), small-caps labels (11 px / letter-spacing 1 px).
5. **No new dependencies.** `recharts` and the existing custom-CSS-modules stack are sufficient.

## Information Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ── ANALYTICS ──────────────────────────────────────────  [date chip] ──── │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │ HERO — BUNDLE FUNNEL SNAPSHOT                                      │   │
│ │ ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐                             │   │
│ │ │views│→│engaged│→│ATC│→│checkout│→│revenue│   ← horizontal funnel  │   │
│ │ │  ─  │  │  ─  │  │ ─ │  │  ─    │  │  ─   │      with drop-off %   │   │
│ │ └────┘  └────┘  └────┘  └────┘  └────┘                             │   │
│ │  100%   42%↓    18%↓    14%↓     14%       drop-offs in coral      │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌──────────────────────────────────┬───────────────────────────────────┐ │
│ │ ENGAGEMENT PULSE                 │ REVENUE ATTRIBUTION                │ │
│ │   sparkline 14d ────────────/\__ │   $4.2k    Bundle AOV $48          │ │
│ │   3,481 engagements   +18 % wow  │   ▴ +12 %  Bundle revenue 32 %     │ │
│ │   Engagement→ATC      6.4 %      │   ── line chart 30d ─────────────  │ │
│ │   ── line chart 30d ─────/\__──  │   ▎▎▎▎  by channel: paid / email   │ │
│ └──────────────────────────────────┴───────────────────────────────────┘ │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │ BUNDLE PERFORMANCE MATRIX                                          │   │
│ │ NAME              PRESET   ENGAGED  ATC    CHECKOUT  AOV   REVENUE │   │
│ │ ───────────────── ──────── ─────── ──────  ───────  ───── ─────── │   │
│ │ Snowboard Kit     CLASSIC   1,247   18 %   14 %    $98   $1.2k    │   │
│ │ Skincare Routine  HORIZONTAL  842   22 %↑  16 %    $54   $812     │   │
│ │ Coffee Sampler    DEFAULT     623    9 %↓   7 %    $34   $284     │   │
│ │                                                                    │   │
│ │  per-row: sort by any column, ▴/▾ growth indicators                │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌──────────────────────────────────┬───────────────────────────────────┐ │
│ │ LIVE ACTIVITY FEED                │ TOP CAMPAIGNS                     │ │
│ │ 14:32  Skincare engaged · sess 8X │ utm_campaign         rev    sess │ │
│ │ 14:31  Snowboard ATC   · sess 4Y  │ spring_sale          $1.8k  812  │ │
│ │ 14:30  Coffee deselect · sess 2A  │ pdp_retargeting       $720  314  │ │
│ │ ...                                │ ig_creators           $612  241  │ │
│ └──────────────────────────────────┴───────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Section breakdown

| # | Section | Data source | What it answers |
|---|---|---|---|
| 1 | **Hero — Bundle Funnel Snapshot** | `BundleEngagement` (engaged), `wpb:*` events (impressions when forwarded), `OrderAttribution` (revenue) | "Where in my funnel am I losing people?" |
| 2 | **Engagement Pulse** | `BundleEngagement` over time | "Is engagement trending up?" |
| 3 | **Revenue Attribution** | `OrderAttribution` (existing) | "Which campaigns drive revenue?" |
| 4 | **Bundle Performance Matrix** | Both tables joined per bundle | "Which of my bundles is working?" |
| 5 | **Live Activity Feed** | `BundleEngagement` last 50 + future Redis-backed `wpb:*` mirror | "What's happening right now?" |
| 6 | **Top Campaigns** | `OrderAttribution` rolled up by `utmCampaign` | "Which UTM source is monetising?" |

## Component Plan

Move from a single 1,425-line file to a composable tree:

```
app/components/analytics/
├── FunnelHero.tsx                  — hero funnel viz w/ horizontal step-bars
├── EngagementPulse.tsx             — engagement KPI + 30d sparkline
├── RevenueAttribution.tsx          — revenue KPI strip + line chart + channels
├── BundlePerformanceMatrix.tsx     — sortable table w/ per-row sparklines
├── LiveActivityFeed.tsx            — vertical stream of last-N engagement events
├── TopCampaigns.tsx                — compact campaign pivot
└── shared/
    ├── KpiTile.tsx                 — big number + label + delta + sparkline
    ├── FunnelStepBar.tsx           — single bar in the hero funnel
    ├── SortableHeader.tsx          — table header with sort affordance
    └── tokens.css                  — color tokens, type scale, spacing
```

Page route shrinks to ~200 lines (just the loader + layout + section composition).

## Data Plumbing (server-side)

Server loader extends `analytics-helpers.ts` with three new pure functions:

```ts
function computeBundleFunnel(
  engagementRows: BundleEngagementRow[],
  attributionRows: OrderAttributionRow[]
): FunnelSnapshot;

function buildEngagementTrendSeries(
  engagementRows: BundleEngagementRow[],
  granularity: 'day' | 'week'
): TrendPoint[];

function buildBundlePerformanceMatrix(
  bundles: Bundle[],
  engagementRows: BundleEngagementRow[],
  attributionRows: OrderAttributionRow[]
): BundleMatrixRow[];
```

These are pure functions, zero-dependency, unit-testable with fixtures (same pattern as the existing helpers).

## Visual Tokens (design system)

```css
/* Color */
--wpb-ink-100: #FFFFFF
--wpb-ink-300: #F5F2EE     /* page bg, warm off-white */
--wpb-ink-700: #2A2823
--wpb-ink-900: #15140F     /* primary text */
--wpb-accent-engagement: #0E7C7B   /* deep teal — engagement */
--wpb-accent-revenue:    #B08800   /* muted gold — money */
--wpb-accent-warning:    #D4493E   /* coral — drop-off / negative */
--wpb-line-dim:          rgba(21, 20, 15, 0.08)

/* Type scale (wpb-display, wpb-numeric, wpb-label, wpb-body, wpb-micro) */
--wpb-display:  44px / 48px / 700  /* hero numbers */
--wpb-numeric:  28px / 32px / 600  /* card numbers */
--wpb-label:    11px / 14px / 600 / letter-spacing:1px / text-transform:uppercase
--wpb-body:     14px / 22px / 400
--wpb-micro:    12px / 16px / 500

/* Surface */
--wpb-radius:   12px
--wpb-shadow:   0 1px 0 rgba(21,20,15,0.04), 0 4px 16px rgba(21,20,15,0.06)
--wpb-pad:      24px
```

These tokens live in `app/components/analytics/shared/tokens.css` and every component uses them — no ad-hoc hex codes.

## Implementation Phases

- [x] Phase 1: Design sign-off received (engagement-first IA + teal/gold/coral palette).
- [x] Phase 2: `tokens.css` + `KpiTile` / `FunnelStepBar` / `SortableHeader` shared primitives.
- [x] Phase 3: `engagement-helpers.ts` (3 pure functions) + 8 jest tests green.
- [x] Phase 4: `FunnelHero` + `EngagementPulse` components wired into the page loader.
- [x] Phase 5: `RevenueAttribution` rewrite in the new token language.
- [x] Phase 6: `BundlePerformanceMatrix` (sortable, clickable rows) + `LiveActivityFeed` (relative-time refresh, optional polling) + `TopCampaigns` (top-5 UTM rollup).
- [x] Phase 7: Page route trimmed from 1,425 → 1,221 lines. Legacy charts replaced with the 6 new sections. Existing pixel toggle / CSV export / date selector kept verbatim.
- [ ] Phase 8: Visual sweep on the live SIT analytics page after deploy (Chrome DevTools MCP, both viewports).
- [x] Phase 9: `docs/app-nav-map/APP_NAVIGATION_MAP.md` updated to reflect the revamped page.

## Out of Scope

- Real-time WebSocket activity feed (the `LiveActivityFeed` polls the engagement endpoint at first; WebSockets is a follow-up).
- Cross-shop benchmarks (e.g. "your engagement rate vs all WPB stores"). Privacy + data infra investment.
- Engagement-source breakdown (which UTM led to engagement, not just to revenue). Requires merging `BundleEngagement` with the UTM `localStorage` blob; ergonomically harder.
- Export to CSV / scheduled email. Common merchant request but separate UX surface.
