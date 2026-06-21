/**
 * Analytics — UTM Attribution Dashboard
 *
 * Rebuilt with recharts time-series chart, AOV, period-over-period comparison,
 * UTM medium breakdown, and landing page performance analysis.
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { getPixelStatus, activateUtmPixel, deactivateUtmPixel } from "../../services/pixel-activation.server";
import {
  computeBundleRevenueSummary,
  buildBundleLeaderboard,
  buildBundleTrendSeries,
  computeBundleFunnel,
  buildEngagementTrendSeries,
  buildBundlePerformanceMatrix,
  type OrderAttributionRow,
} from "../../lib/analytics";
import db from "../../db.server";

export { default } from "./app.attribution/AttributionDashboard";


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
