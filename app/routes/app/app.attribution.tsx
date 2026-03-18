/**
 * Analytics — UTM Attribution Dashboard
 *
 * Rebuilt with recharts time-series chart, AOV, period-over-period comparison,
 * UTM medium breakdown, and landing page performance analysis.
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { Badge, BlockStack, Box, Button, Card, InlineStack, Page, Select, Text } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../../shopify.server";
import { getPixelStatus, activateUtmPixel, deactivateUtmPixel } from "../../services/pixel-activation.server";
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
  const days = parseInt(url.searchParams.get("days") || "30", 10);

  // Pixel status — read live from Shopify API; non-blocking (errors default to inactive)
  const pixelStatus = await getPixelStatus(admin);

  // Current period
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  // Previous period — same length, immediately before current
  const prevSince = new Date(since);
  prevSince.setDate(prevSince.getDate() - days);

  const [currentAttributions, previousAttributions] = await Promise.all([
    db.orderAttribution.findMany({
      where: { shopId, createdAt: { gte: since } },
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
        select: { id: true, name: true },
      })
    : [];
  const bundleNameMap = Object.fromEntries(bundles.map(b => [b.id, b.name]));

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

  return json({
    days,
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
    <Card>
      <Box padding="400">
        <InlineStack align="space-between" blockAlign="center" wrap={false}>
          <BlockStack gap="100">
            <InlineStack gap="200" blockAlign="center">
              <Text as="h2" variant="headingMd">UTM Pixel Tracking</Text>
              {active
                ? <Badge tone="success">Active</Badge>
                : <Badge tone="new">Not active</Badge>
              }
            </InlineStack>
            <Text as="p" variant="bodyMd" tone="subdued">
              {active
                ? "Tracking is active. UTM parameters are captured and attributed to orders at checkout."
                : "Enable tracking to capture UTM parameters from visitor sessions and attribute orders to campaigns."
              }
            </Text>
          </BlockStack>
          <Button
            onClick={handleToggle}
            loading={isSubmitting}
            disabled={isSubmitting}
            tone={active ? "critical" : undefined}
            variant={active ? "secondary" : "primary"}
          >
            {active ? "Disable tracking" : "Enable tracking"}
          </Button>
        </InlineStack>
      </Box>
    </Card>
  );
}

// ─── Component ───────────────────────────────────────────────

export default function AttributionDashboard() {
  const {
    days, summary, timeSeries,
    byPlatform, byMedium, byCampaign, byBundle, byLandingPage,
    pixelActive,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [selectedDays, setSelectedDays] = useState(days.toString());
  // Recharts uses ResizeObserver — only render on client to avoid SSR mismatch
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const handleDaysChange = useCallback((value: string) => {
    setSelectedDays(value);
    const url = new URL(window.location.href);
    url.searchParams.set("days", value);
    window.location.href = url.toString();
  }, []);

  const dateRangeOptions = useMemo(() => [
    { label: "Last 7 days", value: "7" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 90 days", value: "90" },
  ], []);

  const maxPlatformRevenue = byPlatform[0]?.revenue || 1;

  const revenueGrowth = formatGrowth(summary.totalRevenue, summary.prevTotalRevenue);
  const ordersGrowth = formatGrowth(summary.totalOrders, summary.prevTotalOrders);
  const aovGrowth = formatGrowth(summary.aov, summary.prevAov);

  const chartTooltipFormatter = useCallback((value: any, name: any): [string | number, string] => {
    if (name === "revenue") return [formatRevenue(value as number), "Revenue"];
    return [value as number, "Orders"];
  }, []);

  const chartXFormatter = useCallback((dateKey: string) => formatDateKey(dateKey), []);

  // ── Empty state ───────────────────────────────────────────

  if (summary.totalOrders === 0 && summary.prevTotalOrders === 0) {
    return (
      <Page
        title="Analytics"
        subtitle="UTM attribution & bundle revenue"
        backAction={{ content: "Dashboard", onAction: () => navigate("/app/dashboard") }}
      >
        <BlockStack gap="400">
          <PixelStatusCard pixelActive={pixelActive} />
          <div style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>
          <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 12 }}>
            <div className={styles.emptyWrapper}>
              <div className={styles.emptyIcon}>📊</div>
              <p className={styles.emptyTitle}>No attribution data yet</p>
              <p className={styles.emptySubtitle}>
                Once customers arrive via UTM-tagged links and complete purchases,
                you'll see revenue broken down by platform, campaign, and bundle here.
              </p>
              <div className={styles.emptySteps}>
                <div className={styles.emptyStep}>
                  <span className={styles.stepNum}>1</span>
                  <span>
                    Add UTM parameters to your ad links — e.g.{" "}
                    <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>
                      ?utm_source=facebook&utm_campaign=bundles
                    </code>
                  </span>
                </div>
                <div className={styles.emptyStep}>
                  <span className={styles.stepNum}>2</span>
                  <span>
                    The web pixel captures UTM params on the first page view and stores them in the browser session.
                  </span>
                </div>
                <div className={styles.emptyStep}>
                  <span className={styles.stepNum}>3</span>
                  <span>
                    When the customer completes a checkout, the attribution data is saved and appears on this dashboard.
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </BlockStack>
      </Page>
    );
  }

  // ── Data state ────────────────────────────────────────────

  return (
    <Page
      title="Analytics"
      subtitle="UTM attribution & bundle revenue"
      backAction={{ content: "Dashboard", onAction: () => navigate("/app/dashboard") }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Pixel tracking toggle */}
        <PixelStatusCard pixelActive={pixelActive} />

        {/* Date range selector */}
        <div className={styles.headerRow}>
          <div />
          <div className={styles.datePickerWrap}>
            <Select
              label="Date range"
              labelInline
              options={dateRangeOptions}
              value={selectedDays}
              onChange={handleDaysChange}
            />
          </div>
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
            <span className={styles.statSub}>from attributed orders</span>
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
            <span className={styles.statSub}>orders with UTM data</span>
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
                    interval="preserveStartEnd"
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
