/**
 * KpiTile — single-stat card.
 *
 * Variants: hero (44px numeric), default (28px), small (20px).
 * Optional sparkline (recharts) renders along the bottom.
 *
 * Issue: docs/issues-prod/wpb-analytics-revamp-1.md
 */

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

export type KpiAccent = "engagement" | "revenue" | "warning" | "ink";

export interface KpiTileProps {
  label: string;
  value: string;
  delta?: { text: string; direction: "pos" | "neg" | "neutral" };
  hint?: string;
  accent?: KpiAccent;
  size?: "hero" | "default" | "small";
  sparkline?: number[];
}

const KPI_ACCENT_VAR: Record<KpiAccent, string> = {
  engagement: "var(--wpb-accent-engagement)",
  revenue: "var(--wpb-accent-revenue)",
  warning: "var(--wpb-accent-warning)",
  ink: "var(--wpb-ink-900)",
};

export function KpiTile({
  label,
  value,
  delta,
  hint,
  accent = "ink",
  size = "default",
  sparkline,
}: KpiTileProps) {
  const sparkData = useMemo(
    () => (sparkline ?? []).map((v, i) => ({ i, v })),
    [sparkline],
  );

  const valueClass =
    size === "hero"
      ? "wpb-display-num"
      : size === "small"
        ? "wpb-numeric wpb-numeric--small"
        : "wpb-numeric";

  return (
    <div className="wpb-card wpb-kpi-card">
      <span className="wpb-label">{label}</span>
      <span
        className={valueClass}
        data-accent={accent}
      >
        {value}
      </span>
      {(delta || hint) && (
        <div className="wpb-kpi-meta">
          {delta && (
            <span
              className={`wpb-delta wpb-delta--${delta.direction}`}
              aria-label={`${delta.direction === "pos" ? "Up" : delta.direction === "neg" ? "Down" : "Flat"} ${delta.text}`}
            >
              <span aria-hidden>{delta.direction === "pos" ? "▴" : delta.direction === "neg" ? "▾" : "·"}</span>
              {delta.text}
            </span>
          )}
          {hint && (
            <span className="wpb-muted-micro">{hint}</span>
          )}
        </div>
      )}
      {sparkline && sparkline.length > 1 && (
        <div className="wpb-sparkline">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id={`spark-${label.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={KPI_ACCENT_VAR[accent]} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={KPI_ACCENT_VAR[accent]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={KPI_ACCENT_VAR[accent]}
                strokeWidth={1.5}
                fill={`url(#spark-${label.replace(/\s+/g, "-")})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
