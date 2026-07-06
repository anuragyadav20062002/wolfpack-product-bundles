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
        <p className="wpb-empty-copy">
          No UTM-tagged orders this period.
        </p>
      ) : (
        <ul className="wpb-list wpb-list--campaigns">
          {rows.slice(0, 5).map(r => {
            const pct = maxRev > 0 ? Math.round((r.revenueCents / maxRev) * 100) : 0;
            return (
              <li key={r.utmCampaign} className="wpb-campaign-row">
                <div className="wpb-truncate-cell">
                  <p className="wpb-row-title">
                    {r.utmCampaign}
                  </p>
                  <progress className="wpb-campaign-meter" value={Math.max(2, pct)} max={100} />
                </div>
                <div className="wpb-row-align-end">
                  <p className="wpb-row-value">
                    {formatRevenue(r.revenueCents)}
                  </p>
                  <p className="wpb-muted-micro">
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
