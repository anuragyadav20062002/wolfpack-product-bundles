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
      className="wpb-card wpb-card--hero"
      aria-labelledby="wpb-funnel-hero-title"
    >
      <header className="wpb-section-header">
        <div>
          <p className="wpb-label wpb-section-kicker">Bundle Funnel</p>
          <h2 id="wpb-funnel-hero-title" className="wpb-section-title wpb-section-title--hero">
            How shoppers move through your bundles
          </h2>
        </div>
        <p className="wpb-section-hint">{windowLabel}</p>
      </header>
      <div
        className="wpb-funnel-grid"
        data-step-count={steps.length}
      >
        {steps.map(s => (
          <FunnelStepBar key={s.label} {...s} maxValue={maxValue} />
        ))}
      </div>
    </section>
  );
}
