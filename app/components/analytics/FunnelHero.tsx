/**
 * FunnelHero — top-of-page funnel visualization.
 *
 * Renders Engaged → ATC → Checkout → Revenue with drop-off pills between steps.
 * Impressions step is hidden until the impression-beacon ships server-side.
 *
 * Issue: docs/issues-prod/wpb-analytics-revamp-1.md
 */

import { FunnelStepBar } from "./shared/FunnelStepBar";
import type { FunnelSnapshot } from "../../lib/analytics";

export interface FunnelHeroProps {
  snapshot: FunnelSnapshot;
  windowLabel: string;
  formatRevenue: (cents: number) => string;
  formatCount: (n: number) => string;
}

export function FunnelHero({
  snapshot,
  windowLabel,
  formatRevenue,
  formatCount,
}: FunnelHeroProps) {
  const showImpressions = snapshot.impressions > snapshot.engaged;
  const steps: Array<{
    label: string;
    value: number;
    formattedValue: string;
    previousValue?: number;
    accent: "engagement" | "revenue" | "warning" | "ink";
  }> = [];

  if (showImpressions) {
    steps.push({
      label: "Views",
      value: snapshot.impressions,
      formattedValue: formatCount(snapshot.impressions),
      accent: "ink",
    });
  }
  steps.push({
    label: "Engaged",
    value: snapshot.engaged,
    formattedValue: formatCount(snapshot.engaged),
    previousValue: showImpressions ? snapshot.impressions : undefined,
    accent: "engagement",
  });
  steps.push({
    label: "Added to Cart",
    value: snapshot.addedToCart,
    formattedValue: formatCount(snapshot.addedToCart),
    previousValue: snapshot.engaged,
    accent: "engagement",
  });
  steps.push({
    label: "Checked Out",
    value: snapshot.checkedOut,
    formattedValue: formatCount(snapshot.checkedOut),
    previousValue: snapshot.addedToCart,
    accent: "revenue",
  });
  steps.push({
    label: "Revenue",
    value: snapshot.revenueCents,
    formattedValue: formatRevenue(snapshot.revenueCents),
    accent: "revenue",
  });

  const maxValue = Math.max(...steps.map(s => s.value), 1);

  return (
    <section
      className="wpb-card"
      aria-labelledby="wpb-funnel-hero-title"
      style={{ padding: 32 }}
    >
      <header className="wpb-section-header">
        <div>
          <p className="wpb-label" style={{ marginBottom: 4 }}>Bundle Funnel</p>
          <h2 id="wpb-funnel-hero-title" className="wpb-section-title" style={{ font: "var(--wpb-heading)", fontSize: 22 }}>
            How shoppers move through your bundles
          </h2>
        </div>
        <p className="wpb-section-hint">{windowLabel}</p>
      </header>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
          gap: 24,
          marginTop: 8,
        }}
      >
        {steps.map(s => (
          <FunnelStepBar key={s.label} {...s} maxValue={maxValue} />
        ))}
      </div>
    </section>
  );
}
