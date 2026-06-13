/**
 * Analytics — UTM Attribution Dashboard
 *
 * Rebuilt with recharts time-series chart, AOV, period-over-period comparison,
 * UTM medium breakdown, and landing page performance analysis.
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { getPixelStatus, activateUtmPixel, deactivateUtmPixel } from "../../services/pixel-activation.server";
import {
  computeBundleRevenueSummary,
  buildBundleLeaderboard,
  buildBundleTrendSeries,
  formatDelta,
  computeBundleFunnel,
  buildEngagementTrendSeries,
  buildBundlePerformanceMatrix,
  type OrderAttributionRow,
  type BundleRevenueSummary,
  type TrendPoint,
  type LeaderboardRow,
} from "../../lib/analytics";
import db from "../../db.server";
import "../../components/analytics/shared/tokens.css";
import {
  FunnelHero,
  BundlePerformanceMatrix,
  LiveActivityFeed,
  TopCampaigns,
} from "../../components/analytics";
import { LazyEngagementPulse, LazyRevenueAttribution } from "../../components/analytics/lazy";
import { ChartCardSkeleton } from "../../components/skeletons/ChartCardSkeleton";
import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from "react";
import styles from "../../styles/routes/app-attribution.module.css";

// ─── Helpers ─────────────────────────────────────────────────

function formatRevenue(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatGrowth(current: number, previous: number): string | null {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

function isPositiveGrowth(current: number, previous: number): boolean {
  return current >= previous;
}

const DOT_CLASSES = [
  styles.dot0, styles.dot1, styles.dot2, styles.dot3, styles.dot4, styles.dot5,
];
function platformDotClass(i: number) {
  return DOT_CLASSES[i] ?? styles.dotDefault;
}

// ─── Action ──────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await requireAdminSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "export") {
    const shopId = session.shop;
    const fromParam = formData.get("from") as string | null;
    const toParam   = formData.get("to")   as string | null;
    const daysParam = formData.get("days") as string | null;

    let since: Date;
    let until: Date;

    if (fromParam && toParam) {
      since = new Date(fromParam + "T00:00:00.000Z");
      until = new Date(toParam   + "T23:59:59.999Z");
    } else {
      const days = Math.max(1, parseInt(daysParam || "30", 10));
      until = new Date();
      since = new Date(until);
      since.setDate(since.getDate() - days);
      since.setHours(0, 0, 0, 0);
    }

    const [attributions, viewEvents] = await Promise.all([
      db.orderAttribution.findMany({
        where: { shopId, createdAt: { gte: since, lte: until } },
        orderBy: { createdAt: "asc" },
      }),
      db.bundleAnalytics.findMany({
        where: { shopId, event: "view", createdAt: { gte: since, lte: until } },
        select: { bundleId: true, createdAt: true },
      }),
    ]);

    const bundleIds = [...new Set([
      ...attributions.filter(a => a.bundleId).map(a => a.bundleId!),
      ...viewEvents.filter(v => v.bundleId).map(v => v.bundleId!),
    ])];
    const bundles = bundleIds.length > 0
      ? await db.bundle.findMany({ where: { id: { in: bundleIds } }, select: { id: true, name: true } })
      : [];
    const nameMap = Object.fromEntries(bundles.map(b => [b.id, b.name]));

    const escape = (v: string | null | undefined) =>
      v == null ? "" : `"${String(v).replace(/"/g, '""')}"`;

    const rows: string[] = [
      ["Date", "Type", "Bundle ID", "Bundle Name", "UTM Source", "UTM Medium", "UTM Campaign", "Revenue (USD)", "Order ID", "Landing Page"].join(","),
    ];

    for (const a of attributions) {
      rows.push([
        new Date(a.createdAt).toISOString().split("T")[0],
        "order",
        escape(a.bundleId),
        escape(a.bundleId ? nameMap[a.bundleId] : null),
        escape(a.utmSource),
        escape(a.utmMedium),
        escape(a.utmCampaign),
        (a.revenue / 100).toFixed(2),
        escape(a.orderId),
        escape(a.landingPage),
      ].join(","));
    }

    for (const v of viewEvents) {
      rows.push([
        new Date(v.createdAt).toISOString().split("T")[0],
        "view",
        escape(v.bundleId),
        escape(v.bundleId ? nameMap[v.bundleId] : null),
        "", "", "", "", "", "",
      ].join(","));
    }

    const csv = rows.join("\n");
    const fromLabel = since.toISOString().split("T")[0];
    const toLabel   = until.toISOString().split("T")[0];

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="wolfpack-analytics-${fromLabel}-to-${toLabel}.csv"`,
      },
    });
  }

  if (intent === "enable") {
    const appUrl = process.env.SHOPIFY_APP_URL;
    if (!appUrl) {
      return json({ success: false, pixelActive: false, error: "App URL not configured." });
    }
    const result = await activateUtmPixel(admin, appUrl);
    if (result.success) {
      return json({ success: true, pixelActive: true, message: "UTM tracking enabled successfully" });
    }
    const isNotDeployed =
      typeof result.error === "string" && result.error.toLowerCase().includes("not found");
    return json({
      success: false,
      pixelActive: false,
      error: isNotDeployed
        ? "Tracking could not be enabled. Deploy the app extension first via Shopify CLI."
        : "Failed to enable tracking. Please try again.",
    });
  }

  if (intent === "disable") {
    const result = await deactivateUtmPixel(admin);
    if (result.success) {
      return json({ success: true, pixelActive: false, message: "UTM tracking disabled" });
    }
    return json({ success: false, pixelActive: true, error: "Failed to disable tracking. Please try again." });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
};

// ─── Loader ──────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await requireAdminSession(request);
  const shopId = session.shop;

  const url = new URL(request.url);

  const fromParam = url.searchParams.get("from");
  const toParam   = url.searchParams.get("to");

  let since: Date;
  let until: Date;
  let days: number;
  let fromStr: string | undefined;
  let toStr: string | undefined;

  if (fromParam && toParam) {
    since = new Date(fromParam + "T00:00:00.000Z");
    until = new Date(toParam   + "T23:59:59.999Z");
    days  = Math.max(1, Math.round((until.getTime() - since.getTime()) / 86400000));
    fromStr = fromParam;
    toStr   = toParam;
  } else {
    days  = Math.max(1, parseInt(url.searchParams.get("days") || "30", 10));
    until = new Date();
    since = new Date(until);
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
  }

  const prevSince = new Date(since);
  prevSince.setDate(prevSince.getDate() - days);
  const prevUntil = new Date(since);
  prevUntil.setDate(prevUntil.getDate() - 1);
  const prevFromStr = prevSince.toISOString().split("T")[0];
  const prevToStr   = prevUntil.toISOString().split("T")[0];

  const pixelStatus = await getPixelStatus(admin);

  const [currentAttributions, previousAttributions, viewEvents, prevViewEvents, engagementRows, prevEngagementRows, recentActivity] = await Promise.all([
    db.orderAttribution.findMany({
      where: { shopId, createdAt: { gte: since, lte: until } },
      orderBy: { createdAt: "asc" },
    }),
    db.orderAttribution.findMany({
      where: { shopId, createdAt: { gte: prevSince, lt: since } },
    }),
    db.bundleAnalytics.findMany({
      where: { shopId, event: "view", createdAt: { gte: since, lte: until } },
      select: { bundleId: true, createdAt: true },
    }),
    db.bundleAnalytics.findMany({
      where: { shopId, event: "view", createdAt: { gte: prevSince, lt: since } },
      select: { bundleId: true },
    }),
    db.bundleEngagement.findMany({
      where: { shopId, createdAt: { gte: since, lte: until } },
      select: { bundleId: true, sessionId: true, presetId: true, createdAt: true },
    }),
    db.bundleEngagement.findMany({
      where: { shopId, createdAt: { gte: prevSince, lt: since } },
      select: { sessionId: true },
    }),
    db.bundleEngagement.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, bundleId: true, sessionId: true, presetId: true, createdAt: true },
    }),
  ]);

  // Issue: admin-lcp-phase4-loaders-1.
  // Was: 3 separate db.bundle.findMany calls (here, at viewsByBundle, at matrixBundles)
  // each filtering by a different ID set, executed sequentially. p95 cost ~600 ms.
  // Now: union all bundle ids needed by the page, fire ONE query, then partition.
  const attributionBundleIds = currentAttributions
    .filter(a => a.bundleId)
    .map(a => a.bundleId!);
  const viewBundleIds = viewEvents.filter(v => v.bundleId).map(v => v.bundleId!);
  const engagementBundleIds = engagementRows.map(r => r.bundleId);
  const activityBundleIds = recentActivity.map(r => r.bundleId);
  const allBundleIds = [...new Set([
    ...attributionBundleIds,
    ...viewBundleIds,
    ...engagementBundleIds,
    ...activityBundleIds,
  ])];

  const allBundles = allBundleIds.length > 0
    ? await db.bundle.findMany({
        where: { id: { in: allBundleIds } },
        select: { id: true, name: true, status: true },
      })
    : [];
  const fullBundleMap: Record<string, { name: string; status: string }> = {};
  for (const b of allBundles) fullBundleMap[b.id] = { name: b.name, status: b.status };
  const bundleIds = [...new Set(attributionBundleIds)];
  const bundleNameMap = Object.fromEntries(allBundles.map(b => [b.id, b.name]));
  const bundleStatusMap = Object.fromEntries(allBundles.map(b => [b.id, b.status]));

  const totalRevenue = currentAttributions.reduce((s, a) => s + a.revenue, 0);
  const totalOrders = currentAttributions.length;
  const bundleOrders = currentAttributions.filter(a => a.bundleId).length;
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const prevTotalRevenue = previousAttributions.reduce((s, a) => s + a.revenue, 0);
  const prevTotalOrders = previousAttributions.length;
  const prevAov = prevTotalOrders > 0 ? Math.round(prevTotalRevenue / prevTotalOrders) : 0;

  const byPlatformMap: Record<string, { revenue: number; orders: number }> = {};
  for (const a of currentAttributions) {
    const src = a.utmSource || "direct";
    if (!byPlatformMap[src]) byPlatformMap[src] = { revenue: 0, orders: 0 };
    byPlatformMap[src].revenue += a.revenue;
    byPlatformMap[src].orders += 1;
  }
  const byPlatform = Object.entries(byPlatformMap)
    .map(([source, d]) => ({ source, ...d }))
    .sort((a, b) => b.revenue - a.revenue);

  const byMediumMap: Record<string, { revenue: number; orders: number }> = {};
  for (const a of currentAttributions) {
    const med = a.utmMedium || "unknown";
    if (!byMediumMap[med]) byMediumMap[med] = { revenue: 0, orders: 0 };
    byMediumMap[med].revenue += a.revenue;
    byMediumMap[med].orders += 1;
  }
  const byMedium = Object.entries(byMediumMap)
    .map(([medium, d]) => ({ medium, ...d }))
    .sort((a, b) => b.revenue - a.revenue);

  // Exclude attribution rows that have no bundleId — those represent UTM-tracked
  // orders that didn't include any bundle product (recorded by api.attribution for
  // broader analytics). Including them here makes TopCampaigns show non-zero while
  // the bundle-aware cards (RevenueAttribution, BundlePerformanceMatrix) stay at
  // zero for the same campaign, which reads as a bug on a Bundle Analytics page.
  const byCampaignMap: Record<string, { revenue: number; orders: number; source: string }> = {};
  for (const a of currentAttributions) {
    if (!a.bundleId) continue;
    const campaign = a.utmCampaign || "(no campaign)";
    if (!byCampaignMap[campaign]) {
      byCampaignMap[campaign] = { revenue: 0, orders: 0, source: a.utmSource || "direct" };
    }
    byCampaignMap[campaign].revenue += a.revenue;
    byCampaignMap[campaign].orders += 1;
  }
  const byCampaign = Object.entries(byCampaignMap)
    .map(([campaign, d]) => ({ campaign, ...d }))
    .sort((a, b) => b.revenue - a.revenue);

  const byBundleMap: Record<string, { name: string; revenue: number; orders: number }> = {};
  for (const a of currentAttributions) {
    if (!a.bundleId) continue;
    if (!byBundleMap[a.bundleId]) {
      byBundleMap[a.bundleId] = {
        name: bundleNameMap[a.bundleId] || "Unknown Bundle",
        revenue: 0,
        orders: 0,
      };
    }
    byBundleMap[a.bundleId].revenue += a.revenue;
    byBundleMap[a.bundleId].orders += 1;
  }
  const byBundle = Object.values(byBundleMap).sort((a, b) => b.revenue - a.revenue);

  const byLandingMap: Record<string, { revenue: number; orders: number }> = {};
  for (const a of currentAttributions) {
    if (!a.landingPage) continue;
    const page = a.landingPage.split("?")[0];
    if (!byLandingMap[page]) byLandingMap[page] = { revenue: 0, orders: 0 };
    byLandingMap[page].revenue += a.revenue;
    byLandingMap[page].orders += 1;
  }
  const byLandingPage = Object.entries(byLandingMap)
    .map(([page, d]) => ({ page, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const timeSeriesMap: Record<string, { revenue: number; orders: number }> = {};
  for (const a of currentAttributions) {
    const dateKey = new Date(a.createdAt).toISOString().split("T")[0];
    if (!timeSeriesMap[dateKey]) timeSeriesMap[dateKey] = { revenue: 0, orders: 0 };
    timeSeriesMap[dateKey].revenue += a.revenue;
    timeSeriesMap[dateKey].orders += 1;
  }

  const timeSeries: Array<{ date: string; revenue: number; orders: number }> = [];
  const cursor = new Date(since);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  while (cursor <= today) {
    const dateKey = cursor.toISOString().split("T")[0];
    timeSeries.push({
      date: dateKey,
      ...(timeSeriesMap[dateKey] ?? { revenue: 0, orders: 0 }),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const attrRows: OrderAttributionRow[] = currentAttributions.map(a => ({
    bundleId: a.bundleId,
    revenue: a.revenue,
    createdAt: a.createdAt,
  }));
  const prevAttrRows: OrderAttributionRow[] = previousAttributions.map(a => ({
    bundleId: a.bundleId,
    revenue: a.revenue,
    createdAt: a.createdAt,
  }));

  const prevTotalRevForPercent = previousAttributions.reduce((s, a) => s + a.revenue, 0);
  const bundleRevenueSummary = computeBundleRevenueSummary(
    attrRows,
    prevAttrRows,
    totalRevenue,
    prevTotalRevForPercent,
  );
  const bundleLeaderboard = buildBundleLeaderboard(attrRows, bundleNameMap, bundleStatusMap, 10);
  const bundleRevenueTrend = buildBundleTrendSeries(attrRows, since, days, until);

  const totalViews = viewEvents.length;
  const prevTotalViews = prevViewEvents.length;

  const viewsByBundleMap: Record<string, number> = {};
  for (const v of viewEvents) {
    if (v.bundleId) {
      viewsByBundleMap[v.bundleId] = (viewsByBundleMap[v.bundleId] ?? 0) + 1;
    }
  }
  // bundleNameMap already covers every bundle id referenced by viewEvents (it was
  // included in allBundleIds above). No follow-up findMany needed.
  const viewsByBundle = Object.entries(viewsByBundleMap)
    .map(([bundleId, views]) => ({ bundleId, name: bundleNameMap[bundleId] ?? "Unknown Bundle", views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // ── Engagement-funnel data plumbing (wpb-analytics-revamp-1) ──
  const engagementRowsTyped = engagementRows.map(r => ({
    bundleId: r.bundleId,
    sessionId: r.sessionId,
    presetId: r.presetId ?? null,
    createdAt: r.createdAt,
  }));
  const funnelSnapshot = computeBundleFunnel(
    engagementRowsTyped,
    currentAttributions.map(a => ({ bundleId: a.bundleId, revenue: a.revenue, createdAt: a.createdAt })),
  );
  const engagementTrend = buildEngagementTrendSeries(engagementRowsTyped, since, until);
  const prevEngagedUnique = new Set(prevEngagementRows.map(r => r.sessionId)).size;

  // fullBundleMap already covers every bundle id from engagement + activity + attributions
  // (built in the single consolidated findMany above). Just compute the matrix id set.
  const matrixBundleIds = [...new Set([
    ...bundleIds,
    ...engagementRows.map(r => r.bundleId),
    ...recentActivity.map(r => r.bundleId),
  ])];

  const matrixBundles = matrixBundleIds.map(id => {
    const meta = fullBundleMap[id];
    const presetSample = engagementRows.find(r => r.bundleId === id)?.presetId ?? null;
    return {
      id,
      name: meta?.name ?? "Unknown Bundle",
      status: meta?.status ?? "active",
      presetId: presetSample,
    };
  });
  const bundleMatrix = buildBundlePerformanceMatrix(
    matrixBundles,
    engagementRowsTyped,
    currentAttributions.map(a => ({ bundleId: a.bundleId, revenue: a.revenue, createdAt: a.createdAt })),
  );

  // Top campaigns — derived from existing byCampaign array.
  const topCampaignsRows = byCampaign
    .filter(c => c.campaign !== "(no campaign)")
    .slice(0, 5)
    .map(c => ({ utmCampaign: c.campaign, revenueCents: c.revenue, orders: c.orders }));

  // Live activity feed — newest first.
  const activityFeed = recentActivity.map(r => ({
    id: r.id,
    bundleName: fullBundleMap[r.bundleId]?.name ?? "Unknown Bundle",
    presetId: r.presetId ?? null,
    sessionId: r.sessionId,
    createdAt: r.createdAt.toISOString(),
  }));

  // Engagement → checkout rate (cross-bundle).
  const engagementToOrderPct = funnelSnapshot.engaged > 0
    ? Math.round((funnelSnapshot.checkedOut / funnelSnapshot.engaged) * 100)
    : null;

  return json({
    days,
    from: fromStr,
    to: toStr,
    prevFrom: prevFromStr,
    prevTo: prevToStr,
    pixelActive: pixelStatus.active,
    summary: {
      totalRevenue, totalOrders, bundleOrders, aov,
      prevTotalRevenue, prevTotalOrders, prevAov,
    },
    timeSeries,
    byPlatform,
    byMedium,
    byCampaign,
    byBundle,
    byLandingPage,
    bundleRevenueSummary,
    bundleLeaderboard,
    bundleRevenueTrend,
    views: { totalViews, prevTotalViews, viewsByBundle },
    // wpb-analytics-revamp-1 additions
    funnelSnapshot,
    engagementTrend,
    engagedSessions: funnelSnapshot.engaged,
    prevEngagedSessions: prevEngagedUnique,
    engagementToOrderPct,
    bundleMatrix,
    topCampaignsRows,
    activityFeed,
  });
};

// ─── Pixel Status Card ────────────────────────────────────────

function PixelStatusCard({ pixelActive }: { pixelActive: boolean }) {
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== "idle";

  const [active, setActive] = useState(pixelActive);

  useEffect(() => {
    if (!fetcher.data) return;
    const data = fetcher.data as { success: boolean; pixelActive?: boolean; message?: string; error?: string };
    if (data.success && data.pixelActive !== undefined) {
      setActive(data.pixelActive);
      shopify.toast.show(data.message ?? "Done", { isError: false });
    } else if (!data.success && data.error) {
      shopify.toast.show(data.error, { isError: true, duration: 6000 });
    }
  }, [fetcher.data]);

  const handleToggle = useCallback(() => {
    fetcher.submit(
      { intent: active ? "disable" : "enable" },
      { method: "POST" }
    );
  }, [fetcher, active]);

  return (
    <div
      style={{
        borderRadius: 12,
        border: active ? "1px solid #a8e6c1" : "1px solid #e1e3e5",
        background: active
          ? "linear-gradient(135deg, #f0faf4 0%, #ffffff 100%)"
          : "#ffffff",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          height: 4,
          background: active
            ? "linear-gradient(90deg, #00a47c, #34d399)"
            : "linear-gradient(90deg, #b0b8c1, #d1d5db)",
        }}
      />

      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "nowrap" }}>
          <s-stack direction="block" gap="small-100">
            <s-stack direction="inline" alignItems="center" gap="small">
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: active ? "#00a47c" : "#b0b8c1",
                  boxShadow: active ? "0 0 0 3px rgba(0,164,124,0.18)" : "none",
                  flexShrink: 0,
                }}
              />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>UTM Pixel Tracking</h2>
              <s-badge tone={active ? "success" : "neutral"}>{active ? "Active" : "Not active"}</s-badge>
            </s-stack>
            {active ? (
              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                UTM parameters are being captured and attributed to orders at checkout. Your ad spend is being tracked.
              </p>
            ) : (
              <s-stack direction="block" gap="small">
                <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                  Enable tracking to start attributing orders to your ad campaigns. Three steps:
                </p>
                <s-stack direction="block" gap="small-400">
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <strong>1. Enable pixel</strong> — click the button to install the tracking pixel on your store.
                  </p>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <strong>2. Tag your ad links</strong> — add UTM parameters to any ad URLs, e.g.{" "}
                    <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 5px", borderRadius: 3, fontSize: 12 }}>
                      ?utm_source=facebook&amp;utm_campaign=bundles
                    </code>
                  </p>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <strong>3. Watch orders appear</strong> — attributed orders will show up here within minutes of a purchase.
                  </p>
                </s-stack>
              </s-stack>
            )}
          </s-stack>

          <div style={{ flexShrink: 0 }}>
            <s-button
              onClick={handleToggle}
              loading={isSubmitting || undefined}
              disabled={isSubmitting || undefined}
              variant={active ? "secondary" : "primary"}
            >
              {active ? "Disable tracking" : "Enable tracking"}
            </s-button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BundleKpiRow ─────────────────────────────────────────────

function BundleKpiRow({ summary: s, compare }: { summary: BundleRevenueSummary; compare: boolean }) {
  const revDelta = formatDelta(s.totalBundleRevenue, s.prevTotalBundleRevenue);
  const ordDelta = formatDelta(s.totalBundleOrders, s.prevTotalBundleOrders);
  const aovDelta = s.bundleAOV !== null && s.prevBundleAOV !== null
    ? formatDelta(s.bundleAOV, s.prevBundleAOV)
    : null;
  const pctPpDiff = s.bundleRevenuePercent - s.prevBundleRevenuePercent;
  const pctDelta = s.prevBundleRevenuePercent === 0
    ? null
    : {
        label: (pctPpDiff >= 0 ? "+" : "") + pctPpDiff.toFixed(1) + " pp",
        direction: (pctPpDiff > 0 ? "positive" : pctPpDiff < 0 ? "negative" : "neutral") as "positive" | "negative" | "neutral",
      };

  function deltaTone(dir: string): "success" | "critical" | "neutral" {
    if (dir === "positive") return "success";
    if (dir === "negative") return "critical";
    return "neutral";
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}
      className={styles.bundleKpiGrid}>
      <div className={styles.bundleKpiCard}>
        <span className={styles.bundleKpiLabel}>Bundle Revenue</span>
        <span className={styles.bundleKpiValue}>
          {s.totalBundleRevenue > 0 ? formatRevenue(s.totalBundleRevenue) : "$0"}
        </span>
        {compare && (revDelta.label !== "—" ? (
          <s-badge tone={deltaTone(revDelta.direction)}>{`${revDelta.label} vs prev`}</s-badge>
        ) : (
          <s-badge tone="neutral">{"— no prior data"}</s-badge>
        ))}
      </div>

      <div className={styles.bundleKpiCard}>
        <span className={styles.bundleKpiLabel}>Bundle Orders</span>
        <span className={styles.bundleKpiValue}>{s.totalBundleOrders}</span>
        {compare && (ordDelta.label !== "—" ? (
          <s-badge tone={deltaTone(ordDelta.direction)}>{`${ordDelta.label} vs prev`}</s-badge>
        ) : (
          <s-badge tone="neutral">{"— no prior data"}</s-badge>
        ))}
      </div>

      <div className={styles.bundleKpiCard}>
        <span className={styles.bundleKpiLabel}>Bundle AOV</span>
        <span className={styles.bundleKpiValue}>
          {s.bundleAOV !== null ? formatRevenue(s.bundleAOV) : "—"}
        </span>
        {compare && (aovDelta && aovDelta.label !== "—" ? (
          <s-badge tone={deltaTone(aovDelta.direction)}>{`${aovDelta.label} vs prev`}</s-badge>
        ) : (
          <s-badge tone="neutral">{"— no prior data"}</s-badge>
        ))}
      </div>

      <div className={styles.bundleKpiCard}>
        <span className={styles.bundleKpiLabel}>% Revenue from Bundles</span>
        <span className={styles.bundleKpiValue}>
          {s.bundleRevenuePercent > 0 ? s.bundleRevenuePercent.toFixed(1) + "%" : "0%"}
        </span>
        {compare && (pctDelta ? (
          <s-badge tone={deltaTone(pctDelta.direction)}>{`${pctDelta.label} vs prev`}</s-badge>
        ) : (
          <s-badge tone="neutral">{"— no prior data"}</s-badge>
        ))}
      </div>
    </div>
  );
}

// ─── BundleLeaderboardCard ─────────────────────────────────────

function BundleLeaderboardCard({ leaderboard }: { leaderboard: LeaderboardRow[] }) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Revenue by Bundle</span>
        <span className={styles.sectionCount}>
          {leaderboard.length} bundle{leaderboard.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className={styles.dataTable}>
        <div className={`${styles.dataRow} ${styles.leaderboardRow} ${styles.headRow}`}>
          <span className={styles.dataCell}>Bundle</span>
          <span className={`${styles.dataCell} ${styles.right}`}>Revenue</span>
          <span className={`${styles.dataCell} ${styles.right}`}>Orders</span>
          <span className={`${styles.dataCell} ${styles.right}`}>AOV</span>
        </div>
        {leaderboard.length === 0 && (
          <div className={styles.emptyWrapper}>
            <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>No bundle orders in this period.</p>
          </div>
        )}
        {leaderboard.map((row) => {
          const isLong = row.bundleName.length > 40;
          const nameCell = isLong ? (
            <span
              className={`${styles.dataCell} ${styles.primary} ${styles.truncate}`}
              title={row.bundleName}
            >
              {row.bundleName}
              {row.bundleStatus === "archived" && (
                <span style={{ marginLeft: 6 }}>
                  <s-badge tone="warning">Archived</s-badge>
                </span>
              )}
            </span>
          ) : (
            <span className={`${styles.dataCell} ${styles.primary}`}>
              {row.bundleName}
              {row.bundleStatus === "archived" && (
                <span style={{ marginLeft: 6 }}>
                  <s-badge tone="warning">Archived</s-badge>
                </span>
              )}
            </span>
          );

          return (
            <div key={row.bundleId} className={`${styles.dataRow} ${styles.leaderboardRow}`}>
              {nameCell}
              <span className={`${styles.dataCell} ${styles.right}`} style={{ fontWeight: 600 }}>
                {formatRevenue(row.revenue)}
              </span>
              <span className={`${styles.dataCell} ${styles.right}`}>{row.orders}</span>
              <span className={`${styles.dataCell} ${styles.right}`} style={{ color: "#6d7175" }}>
                {row.aov !== null ? formatRevenue(row.aov) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DateRangeSelector ───────────────────────────────────────

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatRangeLabel(days: number, from?: string, to?: string): string {
  if (from && to) {
    const start = new Date(from + "T00:00:00Z");
    const end   = new Date(to   + "T00:00:00Z");
    const startStr = formatDateLabel(start);
    const endStr   = formatDateLabel(end);
    if (start.getUTCFullYear() === end.getUTCFullYear()) {
      const startNoYear = start.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      return `${startNoYear} – ${endStr}`;
    }
    return `${startStr} – ${endStr}`;
  }
  return `Last ${days} days`;
}

interface DateRangeSelectorProps {
  days: number;
  from?: string;
  to?: string;
}

function DateRangeSelector({ days, from, to }: DateRangeSelectorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [fromDate, setFromDate] = useState(from || "");
  const [toDate, setToDate] = useState(to || "");
  const containerRef = useRef<HTMLDivElement>(null);

  const triggerLabel = formatRangeLabel(days, from, to);
  const today = new Date().toISOString().split("T")[0];

  // Close on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  function navigateTo(daysN?: number, fromStr?: string, toStr?: string) {
    const url = new URL(window.location.href);
    url.searchParams.delete("days");
    url.searchParams.delete("from");
    url.searchParams.delete("to");
    if (fromStr && toStr) {
      url.searchParams.set("from", fromStr);
      url.searchParams.set("to", toStr);
    } else {
      url.searchParams.set("days", String(daysN ?? 30));
    }
    window.location.href = url.toString();
  }

  function handleApply() {
    if (!fromDate || !toDate) return;
    navigateTo(undefined, fromDate, toDate);
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <s-button onClick={() => setPopoverOpen((v) => !v)}>
        {triggerLabel}
      </s-button>

      {popoverOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            zIndex: 100,
            background: "#fff",
            border: "1px solid #e1e3e5",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: 16,
            minWidth: 260,
          }}
        >
          {/* Preset chips */}
          <div className={styles.presetChips}>
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                className={`${styles.presetChip}${!from && days === d ? ` ${styles.presetChipActive}` : ""}`}
                onClick={() => navigateTo(d)}
              >
                Last {d} days
              </button>
            ))}
          </div>

          {/* Native date range inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#6d7175", marginBottom: 4 }}>From</label>
              <input
                type="date"
                value={fromDate}
                max={toDate || today}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #ced4da",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#6d7175", marginBottom: 4 }}>To</label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={today}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #ced4da",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div className={styles.calendarApplyRow}>
            <s-button
              variant="primary"
              disabled={(!fromDate || !toDate) || undefined}
              onClick={handleApply}
            >
              Apply
            </s-button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function AttributionDashboard() {
  const {
    days, from, to, prevFrom, prevTo, summary, timeSeries,
    byPlatform, byMedium, byCampaign, byBundle, byLandingPage,
    pixelActive,
    bundleRevenueSummary, bundleLeaderboard, bundleRevenueTrend,
    views,
    funnelSnapshot, engagementTrend, engagedSessions, prevEngagedSessions,
    engagementToOrderPct, bundleMatrix, topCampaignsRows, activityFeed,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const [compare, setCompare] = useState(true);

  const comparePeriodLabel = useMemo(() => {
    if (!prevFrom || !prevTo) return null;
    const fmt = (s: string) => {
      const [, m, d] = s.split("-");
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}`;
    };
    return `${fmt(prevFrom)} – ${fmt(prevTo)}`;
  }, [prevFrom, prevTo]);

  const maxPlatformRevenue = byPlatform[0]?.revenue || 1;

  const revenueGrowth = formatGrowth(summary.totalRevenue, summary.prevTotalRevenue);
  const ordersGrowth = formatGrowth(summary.totalOrders, summary.prevTotalOrders);
  const aovGrowth = formatGrowth(summary.aov, summary.prevAov);

  const chartTooltipFormatter = useCallback((value: any, name: any): [string | number, string] => {
    if (name === "revenue") return [formatRevenue(value as number), "Revenue"];
    return [value as number, "Orders"];
  }, []);

  const xAxisInterval = useMemo(() => {
    const count = timeSeries.length;
    if (count <= 8) return 0;
    if (count <= 31) return 4;
    return Math.floor(count / 8);
  }, [timeSeries.length]);

  const hasNoData = summary.totalOrders === 0 && summary.prevTotalOrders === 0;

  return (
    <>
      <ui-title-bar title="Analytics">
        <button variant="breadcrumb" onClick={() => navigate("/app/dashboard")}>
          Dashboard
        </button>
      </ui-title-bar>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 4px 88px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* No data banner */}
          {hasNoData && (
            <s-banner
              heading={pixelActive ? "No data for this period" : "UTM tracking is not enabled"}
              tone={pixelActive ? "info" : "warning"}
            >
              {pixelActive ? (
                <s-stack direction="block" gap="small-100">
                  <p style={{ margin: 0, fontSize: 14 }}>
                    Tracking is active but no attributed orders were recorded yet. Values will populate once customers arrive via UTM-tagged links and complete a purchase.
                  </p>
                  <p style={{ margin: 0, fontSize: 14 }}>
                    Make sure your ad links include UTM parameters — e.g.{" "}
                    <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 5px", borderRadius: 3, fontSize: 12 }}>
                      ?utm_source=facebook&utm_campaign=bundles
                    </code>
                  </p>
                </s-stack>
              ) : (
                <p style={{ margin: 0, fontSize: 14 }}>
                  Enable tracking below to start capturing UTM parameters from visitor sessions. Once active, orders from tagged ad links will be attributed and shown here.
                </p>
              )}
            </s-banner>
          )}

          {/* Pixel tracking toggle */}
          <PixelStatusCard pixelActive={pixelActive} />

          {/* Date range selector + Compare toggle + Export */}
          <div className={styles.headerRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {compare && comparePeriodLabel && (
                <span className={styles.comparePill}>
                  vs {comparePeriodLabel}
                </span>
              )}
            </div>
            <s-stack direction="inline" alignItems="center" gap="small-100">
              <form method="post" style={{ display: "inline" }}>
                <input type="hidden" name="intent" value="export" />
                {from && to ? (
                  <>
                    <input type="hidden" name="from" value={from} />
                    <input type="hidden" name="to" value={to} />
                  </>
                ) : (
                  <input type="hidden" name="days" value={String(days)} />
                )}
                <s-button variant="secondary">Export CSV</s-button>
              </form>
              <button
                className={`${styles.compareToggle}${compare ? ` ${styles.compareToggleActive}` : ""}`}
                onClick={() => setCompare(v => !v)}
                type="button"
              >
                Compare
              </button>
              <div className={styles.datePickerWrap}>
                <DateRangeSelector days={days} from={from} to={to} />
              </div>
            </s-stack>
          </div>

          {/* ────────── Revamped analytics sections (wpb-analytics-revamp-1) ─────── */}

          <FunnelHero
            snapshot={funnelSnapshot}
            windowLabel={from && to ? `${from} → ${to}` : `Last ${days} days`}
            formatRevenue={formatRevenue}
            formatCount={(n) => n.toLocaleString()}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 16,
            }}
          >
            <Suspense fallback={<ChartCardSkeleton label="Loading engagement chart" />}>
              <LazyEngagementPulse
                engagedSessions={engagedSessions}
                prevEngagedSessions={prevEngagedSessions}
                engagementToOrderPct={engagementToOrderPct}
                trend={engagementTrend}
              />
            </Suspense>
            <Suspense fallback={<ChartCardSkeleton label="Loading revenue attribution chart" />}>
              <LazyRevenueAttribution
                summary={bundleRevenueSummary}
                trend={bundleRevenueTrend}
                formatRevenue={formatRevenue}
              />
            </Suspense>
          </div>

          <BundlePerformanceMatrix
            rows={bundleMatrix}
            formatRevenue={formatRevenue}
            onRowClick={(bundleId) => navigate(`/app/bundles/full-page-bundle/configure/${bundleId}`)}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
              gap: 16,
            }}
          >
            <LiveActivityFeed initialEvents={activityFeed} />
            <TopCampaigns rows={topCampaignsRows} formatRevenue={formatRevenue} />
          </div>

        </div>
      </div>
    </>
  );
}
