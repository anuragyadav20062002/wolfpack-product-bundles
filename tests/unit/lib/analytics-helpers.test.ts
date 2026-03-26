/**
 * Unit tests for app/lib/analytics/analytics-helpers.ts
 *
 * All functions are pure — no mocks needed.
 */

import {
  computeBundleRevenueSummary,
  buildBundleLeaderboard,
  buildBundleTrendSeries,
  formatDelta,
  type OrderAttributionRow,
} from "../../../app/lib/analytics/analytics-helpers";

// ─── Fixture ──────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<OrderAttributionRow> = {}): OrderAttributionRow {
  return {
    bundleId: "bundle-1",
    revenue: 5000, // $50.00
    createdAt: new Date("2026-03-01T12:00:00Z"),
    ...overrides,
  };
}

// ─── computeBundleRevenueSummary ─────────────────────────────────────────────

describe("computeBundleRevenueSummary", () => {
  it("standard case: mixed bundle and non-bundle rows", () => {
    const current = [
      makeRow({ bundleId: "b1", revenue: 3000 }),
      makeRow({ bundleId: "b2", revenue: 2000 }),
      makeRow({ bundleId: null, revenue: 1000 }),
    ];
    const previous = [
      makeRow({ bundleId: "b1", revenue: 2500 }),
      makeRow({ bundleId: null, revenue: 500 }),
    ];
    const result = computeBundleRevenueSummary(current, previous, 6000, 3000);

    expect(result.totalBundleRevenue).toBe(5000);
    expect(result.totalBundleOrders).toBe(2);
    expect(result.bundleAOV).toBe(2500);
    expect(result.bundleRevenuePercent).toBeCloseTo(83.33, 1);
    expect(result.prevTotalBundleRevenue).toBe(2500);
    expect(result.prevTotalBundleOrders).toBe(1);
    expect(result.prevBundleAOV).toBe(2500);
    expect(result.prevBundleRevenuePercent).toBeCloseTo(83.33, 1);
  });

  it("zero bundle orders in current period", () => {
    const current = [makeRow({ bundleId: null, revenue: 5000 })];
    const result = computeBundleRevenueSummary(current, [], 5000, 0);

    expect(result.totalBundleRevenue).toBe(0);
    expect(result.totalBundleOrders).toBe(0);
    expect(result.bundleAOV).toBeNull();
    expect(result.bundleRevenuePercent).toBe(0);
  });

  it("zero orders in previous period (empty array)", () => {
    const current = [makeRow({ bundleId: "b1", revenue: 3000 })];
    const result = computeBundleRevenueSummary(current, [], 3000, 0);

    expect(result.prevBundleAOV).toBeNull();
    expect(result.prevBundleRevenuePercent).toBe(0);
    expect(result.prevTotalBundleRevenue).toBe(0);
    expect(result.prevTotalBundleOrders).toBe(0);
  });

  it("zero total revenue — no divide-by-zero", () => {
    const current = [makeRow({ bundleId: "b1", revenue: 5000 })];
    const result = computeBundleRevenueSummary(current, [], 0, 0);

    expect(result.bundleRevenuePercent).toBe(0);
  });

  it("AOV rounds correctly", () => {
    const current = [
      makeRow({ bundleId: "b1", revenue: 3334 }),
      makeRow({ bundleId: "b1", revenue: 3334 }),
      makeRow({ bundleId: "b1", revenue: 3333 }),
    ];
    const result = computeBundleRevenueSummary(current, [], 10001, 0);

    // 10001 / 3 = 3333.67 → rounds to 3334
    expect(result.bundleAOV).toBe(3334);
  });

  it("all orders are bundle orders → 100% revenue from bundles", () => {
    const current = [
      makeRow({ bundleId: "b1", revenue: 5000 }),
      makeRow({ bundleId: "b2", revenue: 5000 }),
    ];
    const result = computeBundleRevenueSummary(current, [], 10000, 0);

    expect(result.bundleRevenuePercent).toBe(100);
  });
});

// ─── buildBundleLeaderboard ───────────────────────────────────────────────────

describe("buildBundleLeaderboard", () => {
  const nameMap: Record<string, string> = {
    "b1": "Summer Bundle",
    "b2": "Gift Set",
    "b3": "Starter Pack",
  };
  const statusMap: Record<string, string> = {
    "b1": "active",
    "b2": "archived",
    "b3": "active",
  };

  it("standard case: returns rows sorted by revenue descending", () => {
    const current = [
      makeRow({ bundleId: "b1", revenue: 1000 }),
      makeRow({ bundleId: "b3", revenue: 3000 }),
      makeRow({ bundleId: "b2", revenue: 2000 }),
    ];
    const result = buildBundleLeaderboard(current, nameMap, statusMap);

    expect(result[0].bundleId).toBe("b3");
    expect(result[1].bundleId).toBe("b2");
    expect(result[2].bundleId).toBe("b1");
  });

  it("respects limit — returns at most N rows", () => {
    const current = Array.from({ length: 12 }, (_, i) =>
      makeRow({ bundleId: `bundle-${i}`, revenue: (12 - i) * 100 }),
    );
    const bigNameMap: Record<string, string> = {};
    const bigStatusMap: Record<string, string> = {};
    for (let i = 0; i < 12; i++) {
      bigNameMap[`bundle-${i}`] = `Bundle ${i}`;
      bigStatusMap[`bundle-${i}`] = "active";
    }
    const result = buildBundleLeaderboard(current, bigNameMap, bigStatusMap, 10);

    expect(result).toHaveLength(10);
  });

  it("unknown bundle falls back to 'Unknown Bundle' and 'active' status", () => {
    const current = [makeRow({ bundleId: "unknown-id", revenue: 500 })];
    const result = buildBundleLeaderboard(current, {}, {});

    expect(result[0].bundleName).toBe("Unknown Bundle");
    expect(result[0].bundleStatus).toBe("active");
  });

  it("archived bundle shows correct status", () => {
    const current = [makeRow({ bundleId: "b2", revenue: 2000 })];
    const result = buildBundleLeaderboard(current, nameMap, statusMap);

    expect(result[0].bundleStatus).toBe("archived");
  });

  it("accumulates multiple rows for the same bundle", () => {
    const current = [
      makeRow({ bundleId: "b1", revenue: 1000 }),
      makeRow({ bundleId: "b1", revenue: 2000 }),
    ];
    const result = buildBundleLeaderboard(current, nameMap, statusMap);

    expect(result[0].revenue).toBe(3000);
    expect(result[0].orders).toBe(2);
    expect(result[0].aov).toBe(1500);
  });

  it("empty current array returns empty leaderboard", () => {
    const result = buildBundleLeaderboard([], nameMap, statusMap);
    expect(result).toHaveLength(0);
  });

  it("non-bundle rows (bundleId: null) are excluded", () => {
    const current = [
      makeRow({ bundleId: null, revenue: 9999 }),
      makeRow({ bundleId: "b1", revenue: 500 }),
    ];
    const result = buildBundleLeaderboard(current, nameMap, statusMap);

    expect(result).toHaveLength(1);
    expect(result[0].bundleId).toBe("b1");
  });
});

// ─── buildBundleTrendSeries ───────────────────────────────────────────────────

describe("buildBundleTrendSeries", () => {
  const since = new Date("2026-03-01T00:00:00Z");

  it("7-day window: produces 7 daily points", () => {
    const current = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(since);
      d.setUTCDate(d.getUTCDate() + i);
      return makeRow({ bundleId: "b1", revenue: 1000, createdAt: d });
    });
    const result = buildBundleTrendSeries(current, since, 7);

    expect(result).toHaveLength(7);
    expect(result[0].date).toBe("2026-03-01");
    expect(result[6].date).toBe("2026-03-07");
    expect(result[0].bundleRevenue).toBe(1000);
  });

  it("30-day window sparse: zero-fills days with no data", () => {
    // Only one row on day 1
    const current = [makeRow({ bundleId: "b1", revenue: 500, createdAt: since })];
    const result = buildBundleTrendSeries(current, since, 30);

    expect(result).toHaveLength(30);
    expect(result[0].bundleRevenue).toBe(500);
    expect(result[1].bundleRevenue).toBe(0);
    expect(result[29].bundleRevenue).toBe(0);
  });

  it("90-day window: produces weekly points (~13)", () => {
    const current: OrderAttributionRow[] = [];
    const result = buildBundleTrendSeries(current, since, 90);

    expect(result.length).toBeGreaterThanOrEqual(12);
    expect(result.length).toBeLessThanOrEqual(14);
  });

  it("mixed bundle/non-bundle: bundleRevenue counts only non-null bundleId", () => {
    const current = [
      makeRow({ bundleId: "b1", revenue: 3000, createdAt: since }),
      makeRow({ bundleId: null, revenue: 2000, createdAt: since }),
    ];
    const result = buildBundleTrendSeries(current, since, 7);

    expect(result[0].bundleRevenue).toBe(3000);
    expect(result[0].totalRevenue).toBe(5000);
  });

  it("zero revenue day: both fields are 0", () => {
    const current: OrderAttributionRow[] = [];
    const result = buildBundleTrendSeries(current, since, 7);

    expect(result[0].bundleRevenue).toBe(0);
    expect(result[0].totalRevenue).toBe(0);
  });

  it("date keys are formatted as YYYY-MM-DD strings", () => {
    const current = [makeRow({ createdAt: since })];
    const result = buildBundleTrendSeries(current, since, 7);

    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("90d weekly grouping: rows in different weeks produce different keys", () => {
    const week1Day = new Date("2026-03-02T12:00:00Z"); // Monday week
    const week2Day = new Date("2026-03-09T12:00:00Z"); // Next Monday week
    const current = [
      makeRow({ bundleId: "b1", revenue: 1000, createdAt: week1Day }),
      makeRow({ bundleId: "b1", revenue: 2000, createdAt: week2Day }),
    ];
    const result = buildBundleTrendSeries(current, since, 90);

    const week1Key = result.find((p) => p.bundleRevenue === 1000)?.date;
    const week2Key = result.find((p) => p.bundleRevenue === 2000)?.date;
    expect(week1Key).toBeDefined();
    expect(week2Key).toBeDefined();
    expect(week1Key).not.toBe(week2Key);
  });
});

  it("explicit until: daily buckets stop at until date", () => {
    const since = new Date("2026-03-01T00:00:00Z");
    const until = new Date("2026-03-03T23:59:59Z"); // 3-day range
    const row = makeRow({ createdAt: new Date("2026-03-02T10:00:00Z"), bundleId: "b1", revenue: 1000 });
    const result = buildBundleTrendSeries([row], since, 3, until);
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe("2026-03-01");
    expect(result[2].date).toBe("2026-03-03");
    const day2 = result.find((p) => p.date === "2026-03-02");
    expect(day2?.bundleRevenue).toBe(1000);
  });

  it("explicit until: same-day range (days=1) produces exactly 1 bucket", () => {
    const since = new Date("2026-03-15T00:00:00Z");
    const until = new Date("2026-03-15T23:59:59Z");
    const row = makeRow({ createdAt: since, bundleId: "b1", revenue: 500 });
    const result = buildBundleTrendSeries([row], since, 1, until);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-03-15");
    expect(result[0].bundleRevenue).toBe(500);
  });

  it("explicit until with weekly mode (days >= 90): last bucket does not exceed until", () => {
    const since = new Date("2026-01-05T00:00:00Z"); // Monday
    const until = new Date("2026-04-05T23:59:59Z"); // 90 days later
    const result = buildBundleTrendSeries([], since, 90, until);
    expect(result.length).toBeGreaterThan(0);
    // All bucket dates should be >= since
    for (const point of result) {
      expect(new Date(point.date).getTime()).toBeGreaterThanOrEqual(since.getTime());
    }
  });

  it("no until: existing behaviour unchanged (fills days buckets from since)", () => {
    const since = new Date("2026-03-01T00:00:00Z");
    const result = buildBundleTrendSeries([], since, 7);
    expect(result).toHaveLength(7);
    expect(result[0].date).toBe("2026-03-01");
    expect(result[6].date).toBe("2026-03-07");
  });
});

// ─── formatDelta ──────────────────────────────────────────────────────────────

describe("formatDelta", () => {
  it("positive delta", () => {
    const result = formatDelta(120, 100);
    expect(result.label).toBe("+20.0%");
    expect(result.direction).toBe("positive");
  });

  it("negative delta", () => {
    const result = formatDelta(80, 100);
    expect(result.label).toBe("-20.0%");
    expect(result.direction).toBe("negative");
  });

  it("zero change", () => {
    const result = formatDelta(100, 100);
    expect(result.label).toBe("+0.0%");
    expect(result.direction).toBe("neutral");
  });

  it("previous is zero → em dash and neutral", () => {
    const result = formatDelta(50, 0);
    expect(result.label).toBe("—");
    expect(result.direction).toBe("neutral");
  });

  it("both zero → em dash and neutral", () => {
    const result = formatDelta(0, 0);
    expect(result.label).toBe("—");
    expect(result.direction).toBe("neutral");
  });

  it("-100% when current is 0 and previous is non-zero", () => {
    const result = formatDelta(0, 50);
    expect(result.label).toBe("-100.0%");
    expect(result.direction).toBe("negative");
  });
});
