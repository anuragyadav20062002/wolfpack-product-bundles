/**
 * Attribution Dashboard Route
 *
 * Displays UTM attribution analytics for bundle sales.
 * Shows revenue by platform, campaign, and bundle with date range filtering.
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Select,
} from "@shopify/polaris";
import { authenticate } from "../../shopify.server";
import db from "../../db.server";
import { useState, useCallback, useMemo } from "react";
import styles from "../../styles/routes/app-attribution.module.css";

/** Format cents to dollars */
function formatRevenue(cents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const DOT_CLASSES = [
  styles.dot0,
  styles.dot1,
  styles.dot2,
  styles.dot3,
  styles.dot4,
  styles.dot5,
];

function platformDotClass(index: number) {
  return DOT_CLASSES[index] ?? styles.dotDefault;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "30", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const attributions = await db.orderAttribution.findMany({
    where: { shopId: session.shop, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate by platform
  const byPlatform: Record<string, { revenue: number; orders: number }> = {};
  for (const attr of attributions) {
    const source = attr.utmSource || "direct";
    if (!byPlatform[source]) byPlatform[source] = { revenue: 0, orders: 0 };
    byPlatform[source].revenue += attr.revenue;
    byPlatform[source].orders += 1;
  }

  // Aggregate by campaign
  const byCampaign: Record<string, { revenue: number; orders: number; source: string }> = {};
  for (const attr of attributions) {
    const campaign = attr.utmCampaign || "(no campaign)";
    if (!byCampaign[campaign]) {
      byCampaign[campaign] = { revenue: 0, orders: 0, source: attr.utmSource || "direct" };
    }
    byCampaign[campaign].revenue += attr.revenue;
    byCampaign[campaign].orders += 1;
  }

  // Bundle names
  const bundleIds = [...new Set(attributions.filter(a => a.bundleId).map(a => a.bundleId!))];
  const bundles = bundleIds.length > 0
    ? await db.bundle.findMany({ where: { id: { in: bundleIds } }, select: { id: true, name: true } })
    : [];
  const bundleNameMap = Object.fromEntries(bundles.map(b => [b.id, b.name]));

  // Aggregate by bundle
  const byBundle: Record<string, { name: string; revenue: number; orders: number }> = {};
  for (const attr of attributions) {
    if (!attr.bundleId) continue;
    if (!byBundle[attr.bundleId]) {
      byBundle[attr.bundleId] = { name: bundleNameMap[attr.bundleId] || "Unknown Bundle", revenue: 0, orders: 0 };
    }
    byBundle[attr.bundleId].revenue += attr.revenue;
    byBundle[attr.bundleId].orders += 1;
  }

  const totalRevenue = attributions.reduce((sum, a) => sum + a.revenue, 0);
  const totalOrders = attributions.length;
  const bundleOrders = attributions.filter(a => a.bundleId).length;

  return json({
    days,
    summary: { totalRevenue, totalOrders, bundleOrders },
    byPlatform: Object.entries(byPlatform)
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
    byCampaign: Object.entries(byCampaign)
      .map(([campaign, data]) => ({ campaign, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
    byBundle: Object.values(byBundle).sort((a, b) => b.revenue - a.revenue),
  });
};

export default function AttributionDashboard() {
  const { days, summary, byPlatform, byCampaign, byBundle } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [selectedDays, setSelectedDays] = useState(days.toString());

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

  // ── Empty state ──────────────────────────────────────────────
  if (summary.totalOrders === 0) {
    return (
      <Page
        title="Analytics"
        subtitle="UTM attribution & bundle revenue"
        backAction={{ content: "Dashboard", onAction: () => navigate("/app/dashboard") }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            background: "#fff",
            border: "1px solid #e1e3e5",
            borderRadius: 12,
          }}>
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
                  <span>Add UTM parameters to your ad links — e.g. <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>?utm_source=facebook&utm_campaign=bundles</code></span>
                </div>
                <div className={styles.emptyStep}>
                  <span className={styles.stepNum}>2</span>
                  <span>The web pixel captures UTM params on the first page view and stores them in the browser session.</span>
                </div>
                <div className={styles.emptyStep}>
                  <span className={styles.stepNum}>3</span>
                  <span>When the customer completes a checkout, the attribution data is saved and appears on this dashboard.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  // ── Data state ───────────────────────────────────────────────
  return (
    <Page
      title="Analytics"
      subtitle="UTM attribution & bundle revenue"
      backAction={{ content: "Dashboard", onAction: () => navigate("/app/dashboard") }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header: date picker */}
        <div className={styles.headerRow}>
          <div /> {/* spacer — title is in Page component */}
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

        {/* Stat cards */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.accent1}`}>
            <span className={styles.statLabel}>Total Ad Revenue</span>
            <span className={styles.statValue}>{formatRevenue(summary.totalRevenue)}</span>
            <span className={styles.statSub}>from attributed orders</span>
          </div>
          <div className={`${styles.statCard} ${styles.accent2}`}>
            <span className={styles.statLabel}>Attributed Orders</span>
            <span className={styles.statValue}>{summary.totalOrders}</span>
            <span className={styles.statSub}>orders with UTM data</span>
          </div>
          <div className={`${styles.statCard} ${styles.accent3}`}>
            <span className={styles.statLabel}>Bundle Orders</span>
            <span className={styles.statValue}>{summary.bundleOrders}</span>
            <span className={styles.statSub}>
              {summary.totalOrders > 0
                ? `${Math.round((summary.bundleOrders / summary.totalOrders) * 100)}% of attributed`
                : "—"}
            </span>
          </div>
        </div>

        {/* Revenue by Platform */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Revenue by Platform</span>
            <span className={styles.sectionCount}>{byPlatform.length} source{byPlatform.length !== 1 ? "s" : ""}</span>
          </div>

          <div className={styles.platformTable}>
            {/* head */}
            <div className={`${styles.platformRow} ${styles.tableHead}`}>
              <span className={styles.colLabel}>Platform</span>
              <span className={styles.colLabel}>Orders</span>
              <span className={styles.colLabel} style={{ minWidth: 120 }}>Revenue</span>
              <span className={styles.colLabel} style={{ minWidth: 100 }}>&nbsp;</span>
            </div>

            {byPlatform.map((p, i) => (
              <div key={p.source} className={styles.platformRow}>
                <div className={styles.platformName}>
                  <span className={`${styles.platformDot} ${platformDotClass(i)}`} />
                  <span className={styles.platformLabel}>{p.source}</span>
                </div>
                <span className={styles.colLabel}>{p.orders}</span>
                <span className={`${styles.colLabel}`} style={{ fontWeight: 600, color: "#202223" }}>
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

        {/* Revenue by Campaign */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Revenue by Campaign</span>
            <span className={styles.sectionCount}>{byCampaign.length} campaign{byCampaign.length !== 1 ? "s" : ""}</span>
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

        {/* Revenue by Bundle */}
        {byBundle.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Top Bundles by Ad Revenue</span>
              <span className={styles.sectionCount}>{byBundle.length} bundle{byBundle.length !== 1 ? "s" : ""}</span>
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

      </div>
    </Page>
  );
}
