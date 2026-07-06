/**
 * EngagementPulse — engagement KPIs + 30-day trend line.
 *
 * Visualises BundleEngagement growth — the metric merchants cannot get
 * anywhere else in their stack.
 *
 * Issue: docs/issues-prod/wpb-analytics-revamp-1.md
 */

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { KpiTile } from "./shared/KpiTile";
import type { EngagementTrendPoint } from "../../lib/analytics";
import { formatCompactCountAxisTick } from "../../lib/analytics/chart-axis-formatters";

export interface EngagementPulseProps {
  engagedSessions: number;
  prevEngagedSessions: number;
  engagementToOrderPct: number | null;
  trend: EngagementTrendPoint[];
}

function formatPctDelta(current: number, prev: number): { text: string; direction: "pos" | "neg" | "neutral" } {
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

export function EngagementPulse({
  engagedSessions,
  prevEngagedSessions,
  engagementToOrderPct,
  trend,
}: EngagementPulseProps) {
  const delta = formatPctDelta(engagedSessions, prevEngagedSessions);
  const sparkData = trend.map(p => p.engagements);

  return (
    <section className="wpb-card" aria-labelledby="wpb-engagement-pulse-title">
      <header className="wpb-section-header">
        <h2 id="wpb-engagement-pulse-title" className="wpb-section-title">Engagement Pulse</h2>
        <p className="wpb-section-hint">Pre-checkout signal</p>
      </header>

      <div className="wpb-two-column-grid">
        <KpiTile
          label="Engaged sessions"
          value={engagedSessions.toLocaleString()}
          accent="engagement"
          delta={delta}
          hint="vs prev period"
          sparkline={sparkData.length > 1 ? sparkData : undefined}
        />
        <KpiTile
          label="Engaged → checkout"
          value={engagementToOrderPct === null ? "—" : `${engagementToOrderPct}%`}
          accent="engagement"
          hint="conversion of engaged shoppers"
        />
      </div>

      <div className="wpb-chart-strip">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="wpb-engagement-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--wpb-accent-engagement)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--wpb-accent-engagement)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              hide
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--wpb-ink-500)", fontSize: 11 }}
              tickFormatter={(value: number) => formatCompactCountAxisTick(value)}
              width={42}
            />
            <Tooltip
              labelStyle={{ font: "var(--wpb-micro)", color: "var(--wpb-ink-700)" }}
              contentStyle={{
                border: "1px solid var(--wpb-line)",
                borderRadius: 8,
                background: "var(--wpb-ink-100)",
                font: "var(--wpb-micro)",
              }}
              formatter={(value: ValueType | undefined, _name: NameType | undefined) => [
                Number(value ?? 0).toLocaleString(),
                "engagements",
              ]}
            />
            <Area
              type="monotone"
              dataKey="engagements"
              stroke="var(--wpb-accent-engagement)"
              strokeWidth={1.75}
              fill="url(#wpb-engagement-grad)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
