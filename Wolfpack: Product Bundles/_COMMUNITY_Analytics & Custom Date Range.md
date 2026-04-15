---
type: community
cohesion: 0.15
members: 18
---

# Analytics & Custom Date Range

**Cohesion:** 0.15 - loosely connected
**Members:** 18 nodes

## Members
- [[Analytics Custom Date Range Architecture]] - document - docs/analytics-custom-date-range/03-architecture.md
- [[Analytics Page Redesign Architecture]] - document - docs/analytics-redesign/03-architecture.md
- [[Analytics Pixel Toggle Architecture]] - document - docs/analytics-pixel-toggle/03-architecture.md
- [[BundleKpiRow Component]] - document - docs/analytics-redesign/03-architecture.md
- [[BundleLeaderboardCard Component]] - document - docs/analytics-redesign/03-architecture.md
- [[BundleTrendChart Component]] - document - docs/analytics-redesign/03-architecture.md
- [[DateRangeSelector Polaris Component]] - document - docs/analytics-custom-date-range/03-architecture.md
- [[Rationale Option A (In-Memory Aggregation) Selected for Analytics]] - document - docs/analytics-redesign/03-architecture.md
- [[Rationale Option B (Action on Attribution Route) Selected for Pixel Toggle]] - document - docs/analytics-pixel-toggle/03-architecture.md
- [[Remove Pixel Auto-Activation from afterAuth]] - document - docs/analytics-pixel-toggle/03-architecture.md
- [[analytics-helpers.ts_1]] - code - app/lib/analytics/analytics-helpers.ts
- [[analytics-helpers.ts Pure Functions]] - document - docs/analytics-redesign/03-architecture.md
- [[app.attribution.tsx Route]] - code - app/routes/app/app.attribution.tsx
- [[buildBundleTrendSeries Function (until param)]] - document - docs/analytics-custom-date-range/03-architecture.md
- [[deactivateUtmPixel Service Function]] - document - docs/analytics-pixel-toggle/03-architecture.md
- [[getPixelStatus Service Function]] - document - docs/analytics-pixel-toggle/03-architecture.md
- [[pixel-activation.server.ts Service]] - code - app/services/pixel-activation.server.ts
- [[shopify.server.ts_1]] - code - app/shopify.server.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Analytics_&_Custom_Date_Range
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Ad-Ready Bundles Feature Docs]]

## Top bridge nodes
- [[Analytics Page Redesign Architecture]] - degree 7, connects to 1 community