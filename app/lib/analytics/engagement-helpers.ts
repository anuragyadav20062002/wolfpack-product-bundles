/**
 * Pure analytics helper functions for the engagement-funnel revamp.
 *
 * Zero external dependencies — no Prisma, no Remix, no DB.
 * Unit-testable with plain object fixtures.
 *
 * Issue: docs/issues-prod/wpb-analytics-revamp-1.md
 */

import type { OrderAttributionRow, TrendPoint } from "./analytics-helpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BundleEngagementRow {
  bundleId: string;
  sessionId: string;
  createdAt: Date;
  presetId?: string | null;
}

export interface FunnelSnapshot {
  // Each step is a unique-count (sessions for engaged/atc, orders for revenue).
  // `impressions` is optional and only populated when the storefront also forwards
  // wpb:bundle-ready beacons; for now it defaults to engagements (so the funnel
  // collapses to engaged → atc → checkout → revenue) and the impressions step is
  // hidden in the UI when impressions == engagements.
  impressions: number;
  engaged: number;
  addedToCart: number;
  checkedOut: number;
  revenueCents: number;
  // Drop-off percentages between adjacent steps, capped at [0, 100].
  dropOffEngagedToAtc: number;
  dropOffAtcToCheckout: number;
}

export interface EngagementTrendPoint {
  date: string; // YYYY-MM-DD
  engagements: number;
  uniqueBundles: number;
}

export interface BundleMatrixRow {
  bundleId: string;
  bundleName: string;
  presetId: string | null;
  status: string;
  engagedSessions: number;
  ordersFromBundle: number;
  revenueCents: number;
  aovCents: number | null;
  engagementToOrderRate: number | null; // 0..100, null when no engagement
}

// ─── computeBundleFunnel ───────────────────────────────────────────────────────

/**
 * Build the cross-bundle funnel snapshot for a single time window.
 *
 * Engagement = distinct sessionIds (one shopper, one session, one engaged event).
 * AddedToCart = sessions that produced at least one OrderAttribution row.
 *   We use orders as a proxy for ATC; refining this requires forwarding the
 *   wpb:bundle-add-to-cart-success beacon server-side (deferred).
 * CheckedOut = same as AddedToCart for now (every OrderAttribution row is a
 *   completed checkout). Once an "abandoned cart" beacon lands these two
 *   diverge.
 */
export function computeBundleFunnel(
  engagementRows: BundleEngagementRow[],
  attributionRows: OrderAttributionRow[],
): FunnelSnapshot {
  const engagedSessionIds = new Set<string>();
  for (const r of engagementRows) {
    engagedSessionIds.add(r.sessionId);
  }
  const engaged = engagedSessionIds.size;

  let bundleOrderCount = 0;
  let revenueCents = 0;
  for (const r of attributionRows) {
    if (r.bundleId !== null) {
      bundleOrderCount += 1;
      revenueCents += r.revenue;
    }
  }
  const addedToCart = bundleOrderCount;
  const checkedOut = bundleOrderCount;

  const dropOffEngagedToAtc =
    engaged > 0 ? Math.max(0, Math.min(100, 100 - Math.round((addedToCart / engaged) * 100))) : 0;
  const dropOffAtcToCheckout =
    addedToCart > 0 ? Math.max(0, Math.min(100, 100 - Math.round((checkedOut / addedToCart) * 100))) : 0;

  return {
    impressions: engaged, // hidden in UI until impression-beacon ships
    engaged,
    addedToCart,
    checkedOut,
    revenueCents,
    dropOffEngagedToAtc,
    dropOffAtcToCheckout,
  };
}

// ─── buildEngagementTrendSeries ────────────────────────────────────────────────

/**
 * Aggregate engagement rows into a daily series. Days with zero engagement still
 * appear in the result (filled-zero) so the chart renders a continuous line.
 */
export function buildEngagementTrendSeries(
  rows: BundleEngagementRow[],
  windowStart: Date,
  windowEnd: Date,
): EngagementTrendPoint[] {
  const dayKey = (d: Date): string => d.toISOString().slice(0, 10);
  const series = new Map<string, { engagements: number; uniqueBundles: Set<string> }>();

  // Pre-fill the window with zero buckets.
  const cursor = new Date(windowStart);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(windowEnd);
  end.setUTCHours(0, 0, 0, 0);
  while (cursor <= end) {
    series.set(dayKey(cursor), { engagements: 0, uniqueBundles: new Set() });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const r of rows) {
    const key = dayKey(r.createdAt);
    const bucket = series.get(key);
    if (!bucket) continue;
    bucket.engagements += 1;
    bucket.uniqueBundles.add(r.bundleId);
  }

  return Array.from(series.entries()).map(([date, b]) => ({
    date,
    engagements: b.engagements,
    uniqueBundles: b.uniqueBundles.size,
  }));
}

// ─── buildBundlePerformanceMatrix ──────────────────────────────────────────────

export interface BundleSummaryInput {
  id: string;
  name: string;
  status: string;
  presetId: string | null;
}

/**
 * Join bundle metadata + engagement + revenue into one row per bundle.
 * Bundles with zero engagement AND zero revenue are filtered out so the matrix
 * does not pollute with inactive bundles.
 */
export function buildBundlePerformanceMatrix(
  bundles: BundleSummaryInput[],
  engagementRows: BundleEngagementRow[],
  attributionRows: OrderAttributionRow[],
): BundleMatrixRow[] {
  const engagedByBundle = new Map<string, Set<string>>();
  for (const r of engagementRows) {
    const set = engagedByBundle.get(r.bundleId) ?? new Set<string>();
    set.add(r.sessionId);
    engagedByBundle.set(r.bundleId, set);
  }

  const revenueByBundle = new Map<string, { revenue: number; orders: number }>();
  for (const r of attributionRows) {
    if (r.bundleId === null) continue;
    const existing = revenueByBundle.get(r.bundleId) ?? { revenue: 0, orders: 0 };
    existing.revenue += r.revenue;
    existing.orders += 1;
    revenueByBundle.set(r.bundleId, existing);
  }

  const rows: BundleMatrixRow[] = [];
  for (const b of bundles) {
    const engaged = engagedByBundle.get(b.id)?.size ?? 0;
    const rev = revenueByBundle.get(b.id) ?? { revenue: 0, orders: 0 };
    if (engaged === 0 && rev.orders === 0) continue;
    const aov = rev.orders > 0 ? Math.round(rev.revenue / rev.orders) : null;
    const rate =
      engaged > 0 ? Math.max(0, Math.min(100, Math.round((rev.orders / engaged) * 100))) : null;
    rows.push({
      bundleId: b.id,
      bundleName: b.name,
      presetId: b.presetId,
      status: b.status,
      engagedSessions: engaged,
      ordersFromBundle: rev.orders,
      revenueCents: rev.revenue,
      aovCents: aov,
      engagementToOrderRate: rate,
    });
  }

  // Default sort: revenue desc, then engagement desc.
  rows.sort((a, b) => {
    if (b.revenueCents !== a.revenueCents) return b.revenueCents - a.revenueCents;
    return b.engagedSessions - a.engagedSessions;
  });

  return rows;
}

// Re-export helper for any callers wanting the existing trend type.
export type { TrendPoint };
