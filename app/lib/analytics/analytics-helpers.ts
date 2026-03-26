/**
 * Pure analytics helper functions for the Bundle Revenue section.
 *
 * Zero external dependencies — no Prisma, no Remix, no DB.
 * All functions are unit-testable with plain object fixtures.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderAttributionRow {
  bundleId: string | null;
  revenue: number; // cents
  createdAt: Date;
}

export interface BundleRevenueSummary {
  // Current period
  totalBundleRevenue: number;
  totalBundleOrders: number;
  bundleAOV: number | null;
  bundleRevenuePercent: number; // 0-100
  // Previous period
  prevTotalBundleRevenue: number;
  prevTotalBundleOrders: number;
  prevBundleAOV: number | null;
  prevBundleRevenuePercent: number; // 0-100
}

export interface LeaderboardRow {
  bundleId: string;
  bundleName: string;
  bundleStatus: string;
  revenue: number; // cents
  orders: number;
  aov: number | null; // cents
}

export interface TrendPoint {
  date: string; // "YYYY-MM-DD"
  bundleRevenue: number; // cents
  totalRevenue: number; // cents
}

export type DeltaDirection = "positive" | "negative" | "neutral";

export interface FormattedDelta {
  label: string; // e.g. "+23.0%", "-5.1%", or "—"
  direction: DeltaDirection;
}

// ─── computeBundleRevenueSummary ─────────────────────────────────────────────

/**
 * Compute bundle revenue KPIs for current and previous periods.
 */
export function computeBundleRevenueSummary(
  current: OrderAttributionRow[],
  previous: OrderAttributionRow[],
  currentTotalRevenue: number,
  prevTotalRevenue: number,
): BundleRevenueSummary {
  let totalBundleRevenue = 0;
  let totalBundleOrders = 0;
  for (const row of current) {
    if (row.bundleId !== null) {
      totalBundleRevenue += row.revenue;
      totalBundleOrders += 1;
    }
  }

  let prevTotalBundleRevenue = 0;
  let prevTotalBundleOrders = 0;
  for (const row of previous) {
    if (row.bundleId !== null) {
      prevTotalBundleRevenue += row.revenue;
      prevTotalBundleOrders += 1;
    }
  }

  const bundleAOV =
    totalBundleOrders > 0
      ? Math.round(totalBundleRevenue / totalBundleOrders)
      : null;

  const prevBundleAOV =
    prevTotalBundleOrders > 0
      ? Math.round(prevTotalBundleRevenue / prevTotalBundleOrders)
      : null;

  const bundleRevenuePercent =
    currentTotalRevenue > 0
      ? (totalBundleRevenue / currentTotalRevenue) * 100
      : 0;

  const prevBundleRevenuePercent =
    prevTotalRevenue > 0
      ? (prevTotalBundleRevenue / prevTotalRevenue) * 100
      : 0;

  return {
    totalBundleRevenue,
    totalBundleOrders,
    bundleAOV,
    bundleRevenuePercent,
    prevTotalBundleRevenue,
    prevTotalBundleOrders,
    prevBundleAOV,
    prevBundleRevenuePercent,
  };
}

// ─── buildBundleLeaderboard ───────────────────────────────────────────────────

/**
 * Build the top-N bundles by revenue leaderboard for the current period.
 */
export function buildBundleLeaderboard(
  current: OrderAttributionRow[],
  bundleNameMap: Record<string, string>,
  bundleStatusMap: Record<string, string>,
  limit = 10,
): LeaderboardRow[] {
  const map = new Map<string, { revenue: number; orders: number }>();

  for (const row of current) {
    if (row.bundleId === null) continue;
    const existing = map.get(row.bundleId);
    if (existing) {
      existing.revenue += row.revenue;
      existing.orders += 1;
    } else {
      map.set(row.bundleId, { revenue: row.revenue, orders: 1 });
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit)
    .map(([bundleId, { revenue, orders }]) => ({
      bundleId,
      bundleName: bundleNameMap[bundleId] ?? "Unknown Bundle",
      bundleStatus: bundleStatusMap[bundleId] ?? "active",
      revenue,
      orders,
      aov: orders > 0 ? Math.round(revenue / orders) : null,
    }));
}

// ─── buildBundleTrendSeries ───────────────────────────────────────────────────

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return toDateKey(d);
}

/**
 * Build bundle revenue trend series.
 * 7d/30d: daily points. 90d: weekly points (ISO week Monday keys).
 * Every bucket in the window is filled — zero-revenue buckets included.
 */
export function buildBundleTrendSeries(
  current: OrderAttributionRow[],
  since: Date,
  days: number,
  until?: Date,
): TrendPoint[] {
  const windowEnd = until ?? new Date(since.getTime() + days * 86400000);
  const weekly = days >= 90;

  // Build accumulator map keyed by date string
  const map = new Map<string, { bundleRevenue: number; totalRevenue: number }>();

  // Fill all buckets for the window so there are no gaps
  if (weekly) {
    const cursor = new Date(since);
    while (cursor < windowEnd) {
      const key = getWeekStart(cursor);
      if (!map.has(key)) {
        map.set(key, { bundleRevenue: 0, totalRevenue: 0 });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
  } else {
    const cursor = new Date(since);
    while (cursor < windowEnd) {
      map.set(toDateKey(cursor), { bundleRevenue: 0, totalRevenue: 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  // Accumulate rows
  for (const row of current) {
    const key = weekly ? getWeekStart(row.createdAt) : toDateKey(row.createdAt);
    const bucket = map.get(key);
    if (!bucket) continue; // outside window
    bucket.totalRevenue += row.revenue;
    if (row.bundleId !== null) {
      bucket.bundleRevenue += row.revenue;
    }
  }

  // Return sorted by date ascending
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, { bundleRevenue, totalRevenue }]) => ({
      date,
      bundleRevenue,
      totalRevenue,
    }));
}

// ─── formatDelta ──────────────────────────────────────────────────────────────

/**
 * Format a period-over-period numeric delta as a label + direction.
 * Returns "—" / "neutral" when previous is 0 (no basis for comparison).
 */
export function formatDelta(current: number, previous: number): FormattedDelta {
  if (previous === 0) {
    return { label: "—", direction: "neutral" };
  }
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  const label = `${sign}${pct.toFixed(1)}%`;
  const direction: DeltaDirection =
    pct > 0 ? "positive" : pct < 0 ? "negative" : "neutral";
  return { label, direction };
}
