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

const ACCENT_VAR: Record<KpiAccent, string> = {
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
    size === "hero" ? "wpb-display-num" : size === "small" ? "wpb-numeric" : "wpb-numeric";
  const valueStyle = size === "small" ? { font: "var(--wpb-numeric-sm)" } : undefined;

  return (
    <div className="wpb-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span className="wpb-label">{label}</span>
      <span
        className={valueClass}
        style={{ color: ACCENT_VAR[accent], ...(valueStyle || {}) }}
      >
        {value}
      </span>
      {(delta || hint) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -2 }}>
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
            <span style={{ font: "var(--wpb-micro)", color: "var(--wpb-ink-500)" }}>{hint}</span>
          )}
        </div>
      )}
      {sparkline && sparkline.length > 1 && (
        <div style={{ height: 36, margin: "8px -8px -8px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id={`spark-${label.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT_VAR[accent]} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={ACCENT_VAR[accent]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={ACCENT_VAR[accent]}
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
