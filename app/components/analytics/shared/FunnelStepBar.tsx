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
    <div className="wpb-funnel-step">
      <span className="wpb-label">{label}</span>
      <span
        className="wpb-display-num wpb-display-num--funnel"
        data-accent={accent}
        title={String(value)}
      >
        {formattedValue}
      </span>
      <progress
        aria-hidden
        className="wpb-funnel-meter"
        data-accent={accent}
        value={fillPct}
        max={100}
      />
      {conversionPct !== null && (
        <div className="wpb-funnel-conversion">
          <span className="wpb-muted-micro">
            {conversionPct}% kept
          </span>
          {dropOffPct !== null && dropOffPct > 0 && (
            <span className="wpb-funnel-dropoff">
              −{dropOffPct}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
