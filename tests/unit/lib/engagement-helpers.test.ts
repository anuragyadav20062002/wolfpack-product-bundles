/**
 * Unit tests for the engagement-funnel helpers.
 *
 * Issue: wpb-analytics-revamp-1
 */

import {
  computeBundleFunnel,
  buildEngagementTrendSeries,
  buildBundlePerformanceMatrix,
  type BundleEngagementRow,
  type BundleSummaryInput,
} from "../../../app/lib/analytics/engagement-helpers";
import type { OrderAttributionRow } from "../../../app/lib/analytics/analytics-helpers";

const D = (iso: string) => new Date(iso);

describe("computeBundleFunnel", () => {
  it("returns all-zeros for empty input", () => {
    const snap = computeBundleFunnel([], []);
    expect(snap.engaged).toBe(0);
    expect(snap.addedToCart).toBe(0);
    expect(snap.revenueCents).toBe(0);
    expect(snap.dropOffEngagedToAtc).toBe(0);
  });

  it("counts engaged as distinct sessionIds", () => {
    const eng: BundleEngagementRow[] = [
      { bundleId: "b1", sessionId: "s1", createdAt: D("2026-06-01T00:00Z") },
      { bundleId: "b1", sessionId: "s1", createdAt: D("2026-06-01T00:01Z") }, // dup session
      { bundleId: "b2", sessionId: "s2", createdAt: D("2026-06-01T00:02Z") },
    ];
    const snap = computeBundleFunnel(eng, []);
    expect(snap.engaged).toBe(2);
  });

  it("computes drop-off engaged → atc correctly", () => {
    const eng: BundleEngagementRow[] = Array.from({ length: 10 }, (_, i) => ({
      bundleId: "b1",
      sessionId: `s${i}`,
      createdAt: D("2026-06-01T00:00Z"),
    }));
    const attr: OrderAttributionRow[] = Array.from({ length: 4 }, (_, i) => ({
      bundleId: "b1",
      revenue: 5000,
      createdAt: D("2026-06-01T00:00Z"),
    }));
    const snap = computeBundleFunnel(eng, attr);
    expect(snap.engaged).toBe(10);
    expect(snap.addedToCart).toBe(4);
    expect(snap.dropOffEngagedToAtc).toBe(60); // 100 - 40
  });

  it("ignores attribution rows with null bundleId", () => {
    const snap = computeBundleFunnel([], [
      { bundleId: null, revenue: 9999, createdAt: D("2026-06-01T00:00Z") },
    ]);
    expect(snap.addedToCart).toBe(0);
    expect(snap.revenueCents).toBe(0);
  });
});

describe("buildEngagementTrendSeries", () => {
  it("fills zero buckets for an empty window", () => {
    const series = buildEngagementTrendSeries(
      [],
      D("2026-06-01T00:00Z"),
      D("2026-06-03T00:00Z"),
    );
    expect(series.map(p => p.date)).toEqual(["2026-06-01", "2026-06-02", "2026-06-03"]);
    expect(series.every(p => p.engagements === 0)).toBe(true);
  });

  it("counts engagements per day and tracks unique bundles", () => {
    const eng: BundleEngagementRow[] = [
      { bundleId: "b1", sessionId: "s1", createdAt: D("2026-06-01T03:00Z") },
      { bundleId: "b1", sessionId: "s2", createdAt: D("2026-06-01T05:00Z") },
      { bundleId: "b2", sessionId: "s3", createdAt: D("2026-06-02T05:00Z") },
    ];
    const series = buildEngagementTrendSeries(eng, D("2026-06-01"), D("2026-06-02"));
    expect(series).toHaveLength(2);
    expect(series[0]).toEqual({ date: "2026-06-01", engagements: 2, uniqueBundles: 1 });
    expect(series[1]).toEqual({ date: "2026-06-02", engagements: 1, uniqueBundles: 1 });
  });
});

describe("buildBundlePerformanceMatrix", () => {
  const bundles: BundleSummaryInput[] = [
    { id: "b1", name: "Snowboard Kit", status: "active", presetId: "CLASSIC" },
    { id: "b2", name: "Coffee Sampler", status: "active", presetId: "HORIZONTAL" },
    { id: "b3", name: "Empty Bundle", status: "draft", presetId: null },
  ];

  it("filters out bundles with no engagement and no revenue", () => {
    const rows = buildBundlePerformanceMatrix(bundles, [], []);
    expect(rows).toEqual([]);
  });

  it("computes engagement→order conversion + aov + sorts by revenue desc", () => {
    const eng: BundleEngagementRow[] = [
      { bundleId: "b1", sessionId: "s1", createdAt: D("2026-06-01") },
      { bundleId: "b1", sessionId: "s2", createdAt: D("2026-06-01") },
      { bundleId: "b2", sessionId: "s3", createdAt: D("2026-06-01") },
    ];
    const attr: OrderAttributionRow[] = [
      { bundleId: "b1", revenue: 10_000, createdAt: D("2026-06-01") },
      { bundleId: "b2", revenue: 25_000, createdAt: D("2026-06-01") },
    ];
    const rows = buildBundlePerformanceMatrix(bundles, eng, attr);
    expect(rows.map(r => r.bundleId)).toEqual(["b2", "b1"]);
    const b1 = rows.find(r => r.bundleId === "b1")!;
    expect(b1.engagedSessions).toBe(2);
    expect(b1.ordersFromBundle).toBe(1);
    expect(b1.aovCents).toBe(10_000);
    expect(b1.engagementToOrderRate).toBe(50);
  });
});
