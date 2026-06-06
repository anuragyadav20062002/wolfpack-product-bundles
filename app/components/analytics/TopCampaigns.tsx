/**
 * TopCampaigns — compact pivot table of UTM campaigns by bundle revenue.
 *
 * Issue: docs/issues-prod/wpb-analytics-revamp-1.md
 */

export interface TopCampaignsRow {
  utmCampaign: string;
  revenueCents: number;
  orders: number;
}

export interface TopCampaignsProps {
  rows: TopCampaignsRow[];
  formatRevenue: (cents: number) => string;
}

export function TopCampaigns({ rows, formatRevenue }: TopCampaignsProps) {
  const maxRev = rows.reduce((m, r) => Math.max(m, r.revenueCents), 0);
  return (
    <section className="wpb-card" aria-labelledby="wpb-top-campaigns-title">
      <header className="wpb-section-header">
        <div>
          <h2 id="wpb-top-campaigns-title" className="wpb-section-title">Top Campaigns</h2>
          <p className="wpb-section-hint">Bundle revenue by UTM source</p>
        </div>
      </header>

      {rows.length === 0 ? (
        <p style={{ color: "var(--wpb-ink-500)", font: "var(--wpb-body)", margin: 0 }}>
          No UTM-tagged orders this period.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {rows.slice(0, 5).map(r => {
            const pct = maxRev > 0 ? Math.round((r.revenueCents / maxRev) * 100) : 0;
            return (
              <li key={r.utmCampaign} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, font: "var(--wpb-body)", color: "var(--wpb-ink-900)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.utmCampaign}
                  </p>
                  <div style={{ marginTop: 6, height: 4, borderRadius: 999, background: "var(--wpb-ink-300)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.max(2, pct)}%`, height: "100%", background: "var(--wpb-accent-revenue)", borderRadius: 999 }} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, font: "var(--wpb-body)", color: "var(--wpb-accent-revenue)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    {formatRevenue(r.revenueCents)}
                  </p>
                  <p style={{ margin: 0, font: "var(--wpb-micro)", color: "var(--wpb-ink-500)" }}>
                    {r.orders} orders
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
