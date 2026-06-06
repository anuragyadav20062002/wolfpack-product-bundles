# Analytics

**Screenshot:** `31-analytics.png`

Route: `/analytics`

---

## Page Layout

### Header Controls
- **Export** button — download analytics data
- **Compare** button (expandable) — compare two date ranges
- **Date range picker** — defaults to "Last 30 Days" (expandable dropdown)

### Summary Metrics (4 KPI cards)

| Metric | Description |
|--------|-------------|
| Total Bundle Views | Number of times any bundle was viewed by a shopper |
| Total No. of Bundle Orders | Count of orders containing a bundle |
| Total Bundle Sales | Revenue generated from bundle orders |
| Total AOV | Average Order Value for bundle orders |

### Bundle Split Chart
- Labeled "Bundle Split"
- Dropdown to switch between metrics (e.g., "Bundle Revenue")
- Line/bar chart (no data visible on test store — *"There was no data found for this date range"*)

### Bundle Table
- Tab: **"All Bundles"** — per-bundle breakdown
- Search and filter
- Sort controls
- Empty state with magnifying glass icon

---

## Key Observations

- The analytics are bundle-level, not just store-level — merchants can compare individual bundle performance
- The Compare feature enables A/B-style period comparison (e.g., before and after a discount change)
- Export capability suggests the data can be pulled into merchant BI tools
- The 4 KPI summary metrics (Views, Orders, Sales, AOV) align with the standard e-commerce funnel — merchants can spot conversion drop-offs
- No customer-level or cohort analytics visible — this is operational analytics, not retention analytics
