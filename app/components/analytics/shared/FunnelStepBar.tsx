/**
 * FunnelStepBar — one step in the hero funnel viz.
 *
 * Renders a vertical column with:
 *   - LABEL (small caps)
 *   - VALUE (big numeric)
 *   - CONVERSION PILL from the previous step (drop-off in coral)
 *
 * Issue: docs/issues-prod/wpb-analytics-revamp-1.md
 */

export interface FunnelStepBarProps {
  label: string;
  value: number;
  formattedValue: string;
  previousValue?: number;
  accent?: "engagement" | "revenue" | "warning" | "ink";
  maxValue: number;
}

const ACCENT_VAR: Record<NonNullable<FunnelStepBarProps["accent"]>, string> = {
  engagement: "var(--wpb-accent-engagement)",
  revenue: "var(--wpb-accent-revenue)",
  warning: "var(--wpb-accent-warning)",
  ink: "var(--wpb-ink-900)",
};

export function FunnelStepBar({
  label,
  value,
  formattedValue,
  previousValue,
  accent = "engagement",
  maxValue,
}: FunnelStepBarProps) {
  const fillPct = maxValue > 0 ? Math.max(2, Math.round((value / maxValue) * 100)) : 0;
  const conversionPct =
    previousValue && previousValue > 0
      ? Math.round((value / previousValue) * 100)
      : null;
  const dropOffPct = conversionPct !== null ? 100 - conversionPct : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flex: 1,
        minWidth: 0,
      }}
    >
      <span className="wpb-label">{label}</span>
      <span
        className="wpb-display-num"
        style={{ color: ACCENT_VAR[accent], fontSize: 36, lineHeight: 1 }}
        title={String(value)}
      >
        {formattedValue}
      </span>
      <div
        aria-hidden
        style={{
          height: 6,
          background: "var(--wpb-ink-300)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${fillPct}%`,
            height: "100%",
            background: ACCENT_VAR[accent],
            borderRadius: 999,
          }}
        />
      </div>
      {conversionPct !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, font: "var(--wpb-micro)" }}>
          <span style={{ color: "var(--wpb-ink-500)" }}>
            {conversionPct}% kept
          </span>
          {dropOffPct !== null && dropOffPct > 0 && (
            <span
              style={{
                color: "var(--wpb-accent-warning)",
                background: "var(--wpb-accent-warning-soft)",
                borderRadius: 999,
                padding: "2px 8px",
                fontWeight: 600,
              }}
            >
              −{dropOffPct}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
