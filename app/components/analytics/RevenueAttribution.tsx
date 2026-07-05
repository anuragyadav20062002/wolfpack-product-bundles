/**
 * RevenueAttribution — UTM revenue KPI strip + 30-day trend line.
 *
 * Refactor of the existing OrderAttribution surface into the new visual
 * language. Same data plumbing, new design tokens.
 *
 * Issue: docs/issues-prod/wpb-analytics-revamp-1.md
 */

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { KpiTile } from "./shared/KpiTile";
import type { BundleRevenueSummary, TrendPoint } from "../../lib/analytics";
import { formatCompactCurrencyAxisTick } from "../../lib/analytics/chart-axis-formatters";

export interface RevenueAttributionProps {
  summary: BundleRevenueSummary;
  trend: TrendPoint[];
  formatRevenue: (cents: number) => string;
}

function pctDelta(current: number, prev: number): { text: string; direction: "pos" | "neg" | "neutral" } {
  if (prev === 0) {
    return { text: current > 0 ? "new" : "—", direction: current > 0 ? "pos" : "neutral" };
  }
  const pct = ((current - prev) / prev) * 100;
  const text = (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
  return {
    text,
    direction: pct >= 0.5 ? "pos" : pct <= -0.5 ? "neg" : "neutral",
  };
}

export function RevenueAttribution({ summary, trend, formatRevenue }: RevenueAttributionProps) {
  const revDelta = pctDelta(summary.totalBundleRevenue, summary.prevTotalBundleRevenue);
  const aovDelta = pctDelta(summary.bundleAOV ?? 0, summary.prevBundleAOV ?? 0);
  const sparkRevenue = trend.map(p => p.bundleRevenue);

  return (
    <section className="wpb-card" aria-labelledby="wpb-revenue-attribution-title">
      <header className="wpb-section-header">
        <h2 id="wpb-revenue-attribution-title" className="wpb-section-title">Revenue Attribution</h2>
        <p className="wpb-section-hint">UTM-tracked bundle revenue</p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <KpiTile
          label="Bundle revenue"
          value={formatRevenue(summary.totalBundleRevenue)}
          accent="revenue"
          delta={revDelta}
          hint="vs prev period"
          sparkline={sparkRevenue.length > 1 ? sparkRevenue : undefined}
        />
        <KpiTile
          label="Bundle AOV"
          value={summary.bundleAOV === null ? "—" : formatRevenue(summary.bundleAOV)}
          accent="revenue"
          delta={aovDelta}
          hint={`${summary.totalBundleOrders} orders`}
        />
      </div>

      <div style={{ height: 160, marginLeft: -8, marginRight: -8, marginBottom: -8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="wpb-revenue-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--wpb-accent-revenue)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--wpb-accent-revenue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--wpb-ink-500)", fontSize: 11 }}
              tickFormatter={(value: number) => formatCompactCurrencyAxisTick(value)}
              width={48}
            />
            <Tooltip
              labelStyle={{ font: "var(--wpb-micro)", color: "var(--wpb-ink-700)" }}
              contentStyle={{
                border: "1px solid var(--wpb-line)",
                borderRadius: 8,
                background: "var(--wpb-ink-100)",
                font: "var(--wpb-micro)",
              }}
              formatter={(value: ValueType | undefined) => [
                formatRevenue(Number(value ?? 0)),
                "bundle revenue",
              ]}
            />
            <Area
              type="monotone"
              dataKey="bundleRevenue"
              stroke="var(--wpb-accent-revenue)"
              strokeWidth={1.75}
              fill="url(#wpb-revenue-grad)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
