/**
 * Analytics — UTM Attribution Dashboard
 *
 * Rebuilt with recharts time-series chart, AOV, period-over-period comparison,
 * UTM medium breakdown, and landing page performance analysis.
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { Badge, Banner, BlockStack, Button, DatePicker, InlineGrid, InlineStack, Page, Popover, Text, Tooltip } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../../shopify.server";
import { getPixelStatus, activateUtmPixel, deactivateUtmPixel } from "../../services/pixel-activation.server";
import {
  computeBundleRevenueSummary,
  buildBundleLeaderboard,
  buildBundleTrendSeries,
  formatDelta,
  type OrderAttributionRow,
  type BundleRevenueSummary,
  type TrendPoint,
  type LeaderboardRow,
} from "../../lib/analytics";
import db from "../../db.server";
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "../../styles/routes/app-attribution.module.css";

// ─── Helpers ─────────────────────────────────────────────────

function formatRevenue(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatRevenueShort(cents: number): string {
  const d = cents / 100;
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`;
  if (d >= 1_000) return `$${(d / 1_000).toFixed(1)}k`;
  return `$${Math.round(d)}`;
}

function formatGrowth(current: number, previous: number): string | null {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

function isPositiveGrowth(current: number, previous: number): boolean {
  return current >= previous;
}

function formatDateKey(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

const DOT_CLASSES = [
  styles.dot0, styles.dot1, styles.dot2, styles.dot3, styles.dot4, styles.dot5,
];
function platformDotClass(i: number) {
  return DOT_CLASSES[i] ?? styles.dotDefault;
}

function chartXFormatter(dateKey: string) {
  return formatDateKey(dateKey);
}

// ─── Loader ──────────────────────────────────────────────────

// ─── Action ──────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

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
  const { admin, session } = await authenticate.admin(request);
  const shopId = session.shop;

  const url = new URL(request.url);

  // Date range derivation — custom (?from&to) takes priority over preset (?days)
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

  // Previous period — same length, immediately before current
  const prevSince = new Date(since);
  prevSince.setDate(prevSince.getDate() - days);

  // Pixel status — read live from Shopify API; non-blocking (errors default to inactive)
  const pixelStatus = await getPixelStatus(admin);

  const [currentAttributions, previousAttributions] = await Promise.all([
    db.orderAttribution.findMany({
      where: { shopId, createdAt: { gte: since, lte: until } },
      orderBy: { createdAt: "asc" },
    }),
    db.orderAttribution.findMany({
      where: { shopId, createdAt: { gte: prevSince, lt: since } },
    }),
  ]);

  // Bundle name lookup
  const bundleIds = [...new Set(
    currentAttributions.filter(a => a.bundleId).map(a => a.bundleId!)
  )];
  const bundles = bundleIds.length > 0
    ? await db.bundle.findMany({
        where: { id: { in: bundleIds } },
        select: { id: true, name: true, status: true },
      })
    : [];
  const bundleNameMap = Object.fromEntries(bundles.map(b => [b.id, b.name]));
  const bundleStatusMap = Object.fromEntries(bundles.map(b => [b.id, b.status]));

  // ── Current period summaries ──────────────────────────────

  const totalRevenue = currentAttributions.reduce((s, a) => s + a.revenue, 0);
  const totalOrders = currentAttributions.length;
  const bundleOrders = currentAttributions.filter(a => a.bundleId).length;
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // ── Previous period summaries ─────────────────────────────

  const prevTotalRevenue = previousAttributions.reduce((s, a) => s + a.revenue, 0);
  const prevTotalOrders = previousAttributions.length;
  const prevAov = prevTotalOrders > 0 ? Math.round(prevTotalRevenue / prevTotalOrders) : 0;

  // ── By platform ───────────────────────────────────────────

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

  // ── By medium ─────────────────────────────────────────────

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

  // ── By campaign ───────────────────────────────────────────

  const byCampaignMap: Record<string, { revenue: number; orders: number; source: string }> = {};
  for (const a of currentAttributions) {
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

  // ── By bundle ─────────────────────────────────────────────

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

  // ── By landing page (top 10, query string stripped) ───────

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

  // ── Time series — daily bins ───────────────────────────────

  const timeSeriesMap: Record<string, { revenue: number; orders: number }> = {};
  for (const a of currentAttributions) {
    const dateKey = new Date(a.createdAt).toISOString().split("T")[0];
    if (!timeSeriesMap[dateKey]) timeSeriesMap[dateKey] = { revenue: 0, orders: 0 };
    timeSeriesMap[dateKey].revenue += a.revenue;
    timeSeriesMap[dateKey].orders += 1;
  }

  // Fill every day in the window so the chart has a continuous X axis
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

  // ── Bundle Revenue section — new additive aggregations ───────

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

  return json({
    days,
    from: fromStr,
    to: toStr,
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
  });
};

// ─── Component ───────────────────────────────────────────────

// ─── Pixel Status Card ────────────────────────────────────────

function PixelStatusCard({ pixelActive }: { pixelActive: boolean }) {
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== "idle";

  // Track live pixel state — seed from loader, update from action response
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
      {/* Status strip */}
      <div
        style={{
          height: 4,
          background: active
            ? "linear-gradient(90deg, #00a47c, #34d399)"
            : "linear-gradient(90deg, #b0b8c1, #d1d5db)",
        }}
      />

      <div style={{ padding: "20px 24px" }}>
        <InlineStack align="space-between" blockAlign="center" wrap={false} gap="400">
          <BlockStack gap="200">
            <InlineStack gap="300" blockAlign="center">
              {/* Status indicator dot */}
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
              <Text as="h2" variant="headingMd">UTM Pixel Tracking</Text>
              <Badge tone={active ? "success" : "new"}>{active ? "Active" : "Not active"}</Badge>
            </InlineStack>
            {active ? (
              <Text as="p" variant="bodyMd" tone="subdued">
                UTM parameters are being captured and attributed to orders at checkout. Your ad spend is being tracked.
              </Text>
            ) : (
              <BlockStack gap="300">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Enable tracking to start attributing orders to your ad campaigns. Three steps:
                </Text>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm">
                    <strong>1. Enable pixel</strong> — click the button to install the tracking pixel on your store.
                  </Text>
                  <Text as="p" variant="bodySm">
                    <strong>2. Tag your ad links</strong> — add UTM parameters to any ad URLs, e.g.{" "}
                    <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 5px", borderRadius: 3, fontSize: 12 }}>
                      ?utm_source=facebook&amp;utm_campaign=bundles
                    </code>
                  </Text>
                  <Text as="p" variant="bodySm">
                    <strong>3. Watch orders appear</strong> — attributed orders will show up here within minutes of a purchase.
                  </Text>
                </BlockStack>
              </BlockStack>
            )}
          </BlockStack>

          <div style={{ flexShrink: 0 }}>
            <Button
              onClick={handleToggle}
              loading={isSubmitting}
              disabled={isSubmitting}
              tone={active ? "critical" : undefined}
              variant={active ? "secondary" : "primary"}
              size="large"
            >
              {active ? "Disable tracking" : "Enable tracking"}
            </Button>
          </div>
        </InlineStack>
      </div>
    </div>
  );
}

// ─── BundleKpiRow ─────────────────────────────────────────────

function BundleKpiRow({ summary: s }: { summary: BundleRevenueSummary }) {
  const revDelta = formatDelta(s.totalBundleRevenue, s.prevTotalBundleRevenue);
  const ordDelta = formatDelta(s.totalBundleOrders, s.prevTotalBundleOrders);
  const aovDelta = s.bundleAOV !== null && s.prevBundleAOV !== null
    ? formatDelta(s.bundleAOV, s.prevBundleAOV)
    : null;
  // Percentage-point delta — straight difference, not relative change
  const pctPpDiff = s.bundleRevenuePercent - s.prevBundleRevenuePercent;
  const pctDelta = s.prevBundleRevenuePercent === 0
    ? null
    : {
        label: (pctPpDiff >= 0 ? "+" : "") + pctPpDiff.toFixed(1) + " pp",
        direction: (pctPpDiff > 0 ? "positive" : pctPpDiff < 0 ? "negative" : "neutral") as "positive" | "negative" | "neutral",
      };

  function deltaTone(dir: string): "success" | "critical" | "new" {
    if (dir === "positive") return "success";
    if (dir === "negative") return "critical";
    return "new";
  }

  return (
    <InlineGrid columns={{ xs: 2, md: 4 }} gap="400">
      <div className={styles.bundleKpiCard}>
        <span className={styles.bundleKpiLabel}>Bundle Revenue</span>
        <span className={styles.bundleKpiValue}>
          {s.totalBundleRevenue > 0 ? formatRevenue(s.totalBundleRevenue) : "$0"}
        </span>
        {revDelta.label !== "—" ? (
          <Badge tone={deltaTone(revDelta.direction)}>{`${revDelta.label} vs prev`}</Badge>
        ) : (
          <Badge tone="new">{"— no prior data"}</Badge>
        )}
      </div>

      <div className={styles.bundleKpiCard}>
        <span className={styles.bundleKpiLabel}>Bundle Orders</span>
        <span className={styles.bundleKpiValue}>{s.totalBundleOrders}</span>
        {ordDelta.label !== "—" ? (
          <Badge tone={deltaTone(ordDelta.direction)}>{`${ordDelta.label} vs prev`}</Badge>
        ) : (
          <Badge tone="new">{"— no prior data"}</Badge>
        )}
      </div>

      <div className={styles.bundleKpiCard}>
        <span className={styles.bundleKpiLabel}>Bundle AOV</span>
        <span className={styles.bundleKpiValue}>
          {s.bundleAOV !== null ? formatRevenue(s.bundleAOV) : "—"}
        </span>
        {aovDelta && aovDelta.label !== "—" ? (
          <Badge tone={deltaTone(aovDelta.direction)}>{`${aovDelta.label} vs prev`}</Badge>
        ) : (
          <Badge tone="new">{"— no prior data"}</Badge>
        )}
      </div>

      <div className={styles.bundleKpiCard}>
        <span className={styles.bundleKpiLabel}>% Revenue from Bundles</span>
        <span className={styles.bundleKpiValue}>
          {s.bundleRevenuePercent > 0 ? s.bundleRevenuePercent.toFixed(1) + "%" : "0%"}
        </span>
        {pctDelta ? (
          <Badge tone={deltaTone(pctDelta.direction)}>{`${pctDelta.label} vs prev`}</Badge>
        ) : (
          <Badge tone="new">{"— no prior data"}</Badge>
        )}
      </div>
    </InlineGrid>
  );
}

// ─── BundleTrendChart ─────────────────────────────────────────

function BundleTrendChart({
  trend,
  days,
  isClient,
}: {
  trend: TrendPoint[];
  days: number;
  isClient: boolean;
}) {
  const xAxisInterval = useMemo(() => {
    const count = trend.length;
    if (count <= 8) return 0;
    if (count <= 31) return 4;
    return Math.floor(count / 8);
  }, [trend.length]);

  const tooltipFormatter = useCallback(
    (value: unknown, name: unknown): [string, string] => {
      const label = name === "bundleRevenue" ? "Bundle Revenue" : "Total Revenue";
      return [formatRevenue(value as number), label];
    },
    [],
  );

  if (!isClient || trend.length <= 1) return null;

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Revenue Trend</span>
        <span className={styles.sectionCount}>
          {days >= 90 ? "weekly" : "daily"}
        </span>
      </div>
      <div style={{ padding: "20px 16px 16px" }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={trend}
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="bundleRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#008060" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#008060" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={chartXFormatter}
              tick={{ fontSize: 11, fill: "#8c9196" }}
              axisLine={false}
              tickLine={false}
              interval={xAxisInterval}
            />
            <YAxis
              tickFormatter={formatRevenueShort}
              tick={{ fontSize: 11, fill: "#8c9196" }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <RechartsTooltip
              formatter={tooltipFormatter}
              contentStyle={{
                border: "1px solid #e1e3e5",
                borderRadius: 8,
                fontSize: 13,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
              labelFormatter={(label) => formatDateKey(label as string)}
            />
            <Area
              type="monotone"
              dataKey="bundleRevenue"
              stroke="#008060"
              strokeWidth={2}
              fill="url(#bundleRevGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#008060" }}
            />
            <Area
              type="monotone"
              dataKey="totalRevenue"
              stroke="#5c6ac4"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              fill="none"
              dot={false}
              activeDot={{ r: 3, fill: "#5c6ac4" }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className={styles.trendLegend}>
          <span className={styles.trendLegendItem}>
            <span className={styles.trendDotGreen} /> Bundle Revenue
          </span>
          <span className={styles.trendLegendItem}>
            <span className={styles.trendDotPurple} /> Total Revenue
          </span>
        </div>
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
            <Text as="p" variant="bodyMd" tone="subdued">
              No bundle orders in this period.
            </Text>
          </div>
        )}
        {leaderboard.map((row) => {
          const isLong = row.bundleName.length > 40;
          const nameCell = isLong ? (
            <Tooltip content={row.bundleName}>
              <span className={`${styles.dataCell} ${styles.primary} ${styles.truncate}`}>
                {row.bundleName}
                {row.bundleStatus === "archived" && (
                  <span style={{ marginLeft: 6 }}>
                    <Badge tone="attention">Archived</Badge>
                  </span>
                )}
              </span>
            </Tooltip>
          ) : (
            <span className={`${styles.dataCell} ${styles.primary}`}>
              {row.bundleName}
              {row.bundleStatus === "archived" && (
                <span style={{ marginLeft: 6 }}>
                  <Badge tone="attention">Archived</Badge>
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
    // Strip year from start if same year
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
  const [popoverActive, setPopoverActive] = useState(false);
  const today = new Date();
  const [{ month, year }, setCalendar] = useState({
    month: today.getMonth(),
    year: today.getFullYear(),
  });
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | undefined>(undefined);

  const triggerLabel = formatRangeLabel(days, from, to);

  function navigate(daysN?: number, fromStr?: string, toStr?: string) {
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
    if (!selectedRange) return;
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    navigate(undefined, fmt(selectedRange.start), fmt(selectedRange.end));
  }

  const activator = (
    <Button disclosure onClick={() => setPopoverActive((v) => !v)}>
      {triggerLabel}
    </Button>
  );

  return (
    <Popover
      active={popoverActive}
      activator={activator}
      onClose={() => setPopoverActive(false)}
      preferredPosition="below"
      sectioned
    >
      <div className={styles.dateRangePopover}>
        {/* Preset chips */}
        <div className={styles.presetChips}>
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              className={`${styles.presetChip}${!from && days === d ? ` ${styles.presetChipActive}` : ""}`}
              onClick={() => navigate(d)}
            >
              Last {d} days
            </button>
          ))}
        </div>

        {/* Calendar */}
        <DatePicker
          month={month}
          year={year}
          allowRange
          multiMonth
          disableDatesAfter={today}
          selected={selectedRange}
          onChange={({ start, end }) => setSelectedRange({ start, end })}
          onMonthChange={(m, y) => setCalendar({ month: m, year: y })}
        />

        {/* Apply */}
        <div className={styles.calendarApplyRow}>
          <Button
            variant="primary"
            disabled={!selectedRange}
            onClick={handleApply}
          >
            Apply
          </Button>
        </div>
      </div>
    </Popover>
  );
}

// ─── Component ───────────────────────────────────────────────

export default function AttributionDashboard() {
  const {
    days, from, to, summary, timeSeries,
    byPlatform, byMedium, byCampaign, byBundle, byLandingPage,
    pixelActive,
    bundleRevenueSummary, bundleLeaderboard, bundleRevenueTrend,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  // Recharts uses ResizeObserver — only render on client to avoid SSR mismatch
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const maxPlatformRevenue = byPlatform[0]?.revenue || 1;

  const revenueGrowth = formatGrowth(summary.totalRevenue, summary.prevTotalRevenue);
  const ordersGrowth = formatGrowth(summary.totalOrders, summary.prevTotalOrders);
  const aovGrowth = formatGrowth(summary.aov, summary.prevAov);

  const chartTooltipFormatter = useCallback((value: any, name: any): [string | number, string] => {
    if (name === "revenue") return [formatRevenue(value as number), "Revenue"];
    return [value as number, "Orders"];
  }, []);

  // Show ~6-8 evenly spaced ticks depending on timeframe
  const xAxisInterval = useMemo(() => {
    const count = timeSeries.length;
    if (count <= 8) return 0;          // ≤8 points: every day
    if (count <= 31) return 4;         // 30-day window: every 5th day
    return Math.floor(count / 8);      // 90-day window: ~every 11 days
  }, [timeSeries.length]);

  const hasNoData = summary.totalOrders === 0 && summary.prevTotalOrders === 0;

  return (
    <Page
      title="Analytics"
      subtitle="Bundle revenue & UTM attribution"
      backAction={{ content: "Dashboard", onAction: () => navigate("/app/dashboard") }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Why are values nil? — shown at very top when there's no data */}
        {hasNoData && (
          <Banner
            title={pixelActive ? "No data for this period" : "UTM tracking is not enabled"}
            tone={pixelActive ? "info" : "warning"}
          >
            {pixelActive ? (
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  Tracking is active but no attributed orders were recorded yet. Values will populate once customers arrive via UTM-tagged links and complete a purchase.
                </Text>
                <Text as="p" variant="bodyMd">
                  Make sure your ad links include UTM parameters — e.g.{" "}
                  <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 5px", borderRadius: 3, fontSize: 12 }}>
                    ?utm_source=facebook&utm_campaign=bundles
                  </code>
                </Text>
              </BlockStack>
            ) : (
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  Enable tracking below to start capturing UTM parameters from visitor sessions. Once active, orders from tagged ad links will be attributed and shown here.
                </Text>
              </BlockStack>
            )}
          </Banner>
        )}

        {/* Pixel tracking toggle */}
        <PixelStatusCard pixelActive={pixelActive} />

        {/* Date range selector */}
        <div className={styles.headerRow}>
          <div />
          <div className={styles.datePickerWrap}>
            <DateRangeSelector days={days} from={from} to={to} />
          </div>
        </div>

        {/* ── Bundle Revenue Section ─────────────────────────── */}
        <div className={styles.bundleSection}>
          <Text as="h2" variant="headingMd">Bundle Revenue</Text>
        </div>

        <BundleKpiRow summary={bundleRevenueSummary} />

        <div className={styles.bundleSplitRow}>
          <BundleTrendChart trend={bundleRevenueTrend} days={days} isClient={isClient} />
          <BundleLeaderboardCard leaderboard={bundleLeaderboard} />
        </div>

        {/* ── Section divider: UTM Attribution ──────────────── */}
        <div className={styles.sectionDivider}>
          <span className={styles.sectionDividerLabel}>UTM Attribution</span>
        </div>

        {/* Metric cards */}
        <div className={styles.statsGrid}>

          {/* Total Revenue */}
          <div className={`${styles.statCard} ${styles.accent1}`}>
            <span className={styles.statLabel}>Total Ad Revenue</span>
            <span className={styles.statValue}>{formatRevenue(summary.totalRevenue)}</span>
            {revenueGrowth && (
              <span className={
                isPositiveGrowth(summary.totalRevenue, summary.prevTotalRevenue)
                  ? styles.growthPos : styles.growthNeg
              }>
                {revenueGrowth} vs prev period
              </span>
            )}
            <span className={styles.statSub}>
              {summary.totalRevenue > 0 ? "from attributed orders" : "no attributed orders yet"}
            </span>
          </div>

          {/* Attributed Orders */}
          <div className={`${styles.statCard} ${styles.accent2}`}>
            <span className={styles.statLabel}>Attributed Orders</span>
            <span className={styles.statValue}>{summary.totalOrders}</span>
            {ordersGrowth && (
              <span className={
                isPositiveGrowth(summary.totalOrders, summary.prevTotalOrders)
                  ? styles.growthPos : styles.growthNeg
              }>
                {ordersGrowth} vs prev period
              </span>
            )}
            <span className={styles.statSub}>
              {summary.totalOrders > 0 ? "orders with UTM data" : "no UTM-tagged orders yet"}
            </span>
          </div>

          {/* Average Order Value */}
          <div className={`${styles.statCard} ${styles.accent3}`}>
            <span className={styles.statLabel}>Avg. Order Value</span>
            <span className={styles.statValue}>{formatRevenue(summary.aov)}</span>
            {aovGrowth && (
              <span className={
                isPositiveGrowth(summary.aov, summary.prevAov)
                  ? styles.growthPos : styles.growthNeg
              }>
                {aovGrowth} vs prev period
              </span>
            )}
            <span className={styles.statSub}>
              {summary.totalOrders > 0
                ? `${Math.round((summary.bundleOrders / summary.totalOrders) * 100)}% bundle orders`
                : "—"}
            </span>
          </div>

        </div>

        {/* Revenue Trend — area chart (client-only) */}
        {isClient && timeSeries.length > 1 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Revenue Trend</span>
              <span className={styles.sectionCount}>daily</span>
            </div>
            <div style={{ padding: "20px 16px 16px" }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={timeSeries}
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5c6ac4" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#5c6ac4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={chartXFormatter}
                    tick={{ fontSize: 11, fill: "#8c9196" }}
                    axisLine={false}
                    tickLine={false}
                    interval={xAxisInterval}
                  />
                  <YAxis
                    tickFormatter={formatRevenueShort}
                    tick={{ fontSize: 11, fill: "#8c9196" }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <RechartsTooltip
                    formatter={chartTooltipFormatter}
                    contentStyle={{
                      border: "1px solid #e1e3e5",
                      borderRadius: 8,
                      fontSize: 13,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                    labelFormatter={(label) => formatDateKey(label as string)}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#5c6ac4"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#5c6ac4" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Revenue by Platform */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Revenue by Platform</span>
            <span className={styles.sectionCount}>
              {byPlatform.length} source{byPlatform.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className={styles.platformTable}>
            <div className={`${styles.platformRow} ${styles.tableHead}`}>
              <span className={styles.colLabel}>Platform</span>
              <span className={styles.colLabel}>Orders</span>
              <span className={styles.colLabel} style={{ minWidth: 100 }}>Revenue</span>
              <span className={styles.colLabel} style={{ minWidth: 120 }}>&nbsp;</span>
            </div>
            {byPlatform.length === 0 && (
              <div style={{ padding: "24px", textAlign: "center", color: "#8c9196", fontSize: 13 }}>
                No platform data yet — will appear once attributed orders come in.
              </div>
            )}
            {byPlatform.map((p, i) => (
              <div key={p.source} className={styles.platformRow}>
                <div className={styles.platformName}>
                  <span className={`${styles.platformDot} ${platformDotClass(i)}`} />
                  <span className={styles.platformLabel}>{p.source}</span>
                </div>
                <span className={styles.colLabel}>{p.orders}</span>
                <span className={styles.colLabel} style={{ fontWeight: 600, color: "#202223" }}>
                  {formatRevenue(p.revenue)}
                </span>
                <div className={styles.revenueBar}>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${Math.round((p.revenue / maxPlatformRevenue) * 100)}%`,
                        background: i === 0
                          ? "linear-gradient(90deg,#5c6ac4,#9c6ade)"
                          : i === 1
                            ? "linear-gradient(90deg,#00848e,#00a0ac)"
                            : i === 2
                              ? "linear-gradient(90deg,#f49342,#f26419)"
                              : "#c4cdd0",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Channel (UTM medium) */}
        {byMedium.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Revenue by Channel</span>
              <span className={styles.sectionCount}>
                {byMedium.length} channel{byMedium.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className={styles.dataTable}>
              <div className={`${styles.dataRow} ${styles.mediumRow} ${styles.headRow}`}>
                <span className={styles.dataCell}>Medium</span>
                <span className={`${styles.dataCell} ${styles.right}`}>Orders</span>
                <span className={`${styles.dataCell} ${styles.right}`}>Revenue</span>
                <span className={`${styles.dataCell} ${styles.right}`}>AOV</span>
              </div>
              {byMedium.map((m) => (
                <div key={m.medium} className={`${styles.dataRow} ${styles.mediumRow}`}>
                  <span className={`${styles.dataCell} ${styles.primary}`}>
                    <span className={styles.mediumTag}>{m.medium}</span>
                  </span>
                  <span className={`${styles.dataCell} ${styles.right}`}>{m.orders}</span>
                  <span className={`${styles.dataCell} ${styles.right}`} style={{ fontWeight: 600 }}>
                    {formatRevenue(m.revenue)}
                  </span>
                  <span className={`${styles.dataCell} ${styles.right}`} style={{ color: "#6d7175" }}>
                    {m.orders > 0 ? formatRevenue(Math.round(m.revenue / m.orders)) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue by Campaign */}
        {byCampaign.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Revenue by Campaign</span>
              <span className={styles.sectionCount}>
                {byCampaign.length} campaign{byCampaign.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className={styles.dataTable}>
              <div className={`${styles.dataRow} ${styles.campaignRow} ${styles.headRow}`}>
                <span className={styles.dataCell}>Campaign</span>
                <span className={styles.dataCell}>Source</span>
                <span className={`${styles.dataCell} ${styles.right}`}>Orders</span>
                <span className={`${styles.dataCell} ${styles.right}`}>Revenue</span>
              </div>
              {byCampaign.map((c) => (
                <div key={c.campaign} className={`${styles.dataRow} ${styles.campaignRow}`}>
                  <span className={`${styles.dataCell} ${styles.primary}`}>{c.campaign}</span>
                  <span className={styles.dataCell}>
                    <span className={styles.sourceTag}>{c.source}</span>
                  </span>
                  <span className={`${styles.dataCell} ${styles.right}`}>{c.orders}</span>
                  <span className={`${styles.dataCell} ${styles.right}`} style={{ fontWeight: 600 }}>
                    {formatRevenue(c.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Bundles by Ad Revenue */}
        {byBundle.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Top Bundles by Ad Revenue</span>
              <span className={styles.sectionCount}>
                {byBundle.length} bundle{byBundle.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className={styles.dataTable}>
              <div className={`${styles.dataRow} ${styles.bundleRow} ${styles.headRow}`}>
                <span className={styles.dataCell}>Bundle</span>
                <span className={`${styles.dataCell} ${styles.right}`}>Orders</span>
                <span className={`${styles.dataCell} ${styles.right}`}>Revenue</span>
              </div>
              {byBundle.map((b) => (
                <div key={b.name} className={`${styles.dataRow} ${styles.bundleRow}`}>
                  <span className={`${styles.dataCell} ${styles.primary}`}>{b.name}</span>
                  <span className={`${styles.dataCell} ${styles.right}`}>{b.orders}</span>
                  <span className={`${styles.dataCell} ${styles.right}`} style={{ fontWeight: 600 }}>
                    {formatRevenue(b.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Landing Pages */}
        {byLandingPage.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Top Landing Pages</span>
              <span className={styles.sectionCount}>
                {byLandingPage.length} page{byLandingPage.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className={styles.dataTable}>
              <div className={`${styles.dataRow} ${styles.landingRow} ${styles.headRow}`}>
                <span className={styles.dataCell}>Page</span>
                <span className={`${styles.dataCell} ${styles.right}`}>Orders</span>
                <span className={`${styles.dataCell} ${styles.right}`}>Revenue</span>
              </div>
              {byLandingPage.map((lp) => (
                <div key={lp.page} className={`${styles.dataRow} ${styles.landingRow}`}>
                  <span className={`${styles.dataCell} ${styles.primary} ${styles.pageUrl}`}>
                    {lp.page}
                  </span>
                  <span className={`${styles.dataCell} ${styles.right}`}>{lp.orders}</span>
                  <span className={`${styles.dataCell} ${styles.right}`} style={{ fontWeight: 600 }}>
                    {formatRevenue(lp.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Page>
  );
}
