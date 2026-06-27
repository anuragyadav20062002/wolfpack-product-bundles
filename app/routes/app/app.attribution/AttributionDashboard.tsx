import { useLoaderData, useNavigate } from "@remix-run/react";
import { PixelStatusCard } from "./PixelStatusCard";
import { navigateBackOrFallback } from "../../../lib/navigation";
import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from "react";
import {
  formatDelta,
  type BundleRevenueSummary,
  type LeaderboardRow,
} from "../../../lib/analytics";
import "../../../components/analytics/shared/tokens.css";
import {
  FunnelHero,
  BundlePerformanceMatrix,
  LiveActivityFeed,
  TopCampaigns,
} from "../../../components/analytics";
import { LazyEngagementPulse, LazyRevenueAttribution } from "../../../components/analytics/lazy";
import { ChartCardSkeleton } from "../../../components/skeletons/ChartCardSkeleton";
import styles from "../../../styles/routes/app-attribution.module.css";
import type { loader } from "../app.attribution";

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
        <button
          variant="breadcrumb"
          onClick={() =>
            navigateBackOrFallback(navigate, "/app/dashboard", { replaceFallback: true })
          }
        >
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
