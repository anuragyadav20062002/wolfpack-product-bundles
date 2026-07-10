import { Await, useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useMemo, useEffect, useRef, Suspense } from "react";
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
import type { AttributionDashboardData, loader } from "../app.attribution";
import { shouldRenderAnalyticsNoDataBanner } from "./attribution-lcp-state";

type PixelStatusPayload = {
  active: boolean;
};

type AttributionDashboardViewData = Omit<AttributionDashboardData, "from" | "to"> & {
  from?: string;
  to?: string;
};

// ─── Helpers ─────────────────────────────────────────────────

function formatRevenue(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
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
    <div ref={containerRef} className={styles.dateSelector}>
      <s-button onClick={() => setPopoverOpen((v) => !v)}>
        {triggerLabel}
      </s-button>

      {popoverOpen && (
        <div className={styles.datePopover}>
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
          <div className={styles.dateInputStack}>
            <div>
              <label className={styles.dateInputLabel}>From</label>
              <input
                type="date"
                value={fromDate}
                max={toDate || today}
                onChange={(e) => setFromDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
            <div>
              <label className={styles.dateInputLabel}>To</label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={today}
                onChange={(e) => setToDate(e.target.value)}
                className={styles.dateInput}
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

function AttributionDashboardSkeleton() {
  return (
    <div className={styles.dashboardShell}>
      <div className={styles.dashboardStack}>
        <ChartCardSkeleton height={180} label="Loading funnel summary" />
        <div className={styles.dashboardChartGrid}>
          <ChartCardSkeleton label="Loading engagement chart" />
          <ChartCardSkeleton label="Loading revenue attribution chart" />
        </div>
      </div>
    </div>
  );
}

function NoDataBanner({
  hasNoData,
  pixelStatus,
}: {
  hasNoData: boolean;
  pixelStatus: Promise<PixelStatusPayload>;
}) {
  if (!hasNoData) return null;

  return (
    <Suspense fallback={null}>
      <Await resolve={pixelStatus}>
        {(status) => (
          shouldRenderAnalyticsNoDataBanner({ hasNoData, pixelActive: Boolean(status.active) }) ? (
            <s-banner heading="No data for this period" tone="info">
              <s-stack direction="block" gap="small-100">
                <p className={styles.bodyText}>
                  Tracking is active but no attributed orders were recorded yet. Values will populate once customers arrive via UTM-tagged links and complete a purchase.
                </p>
                <p className={styles.bodyText}>
                  Make sure your ad links include UTM parameters — e.g.{" "}
                  <code className={styles.codeSample}>
                    ?utm_source=facebook&utm_campaign=bundles
                  </code>
                </p>
              </s-stack>
            </s-banner>
          ) : null
        )}
      </Await>
    </Suspense>
  );
}

function AttributionDashboardContent({
  data,
  pixelStatus,
}: {
  data: AttributionDashboardViewData;
  pixelStatus: Promise<PixelStatusPayload>;
}) {
  const {
    days, from, to, prevFrom, prevTo, summary,
    bundleRevenueSummary, bundleRevenueTrend,
    funnelSnapshot, engagementTrend, engagedSessions, prevEngagedSessions,
    engagementToOrderPct, bundleMatrix, topCampaignsRows, activityFeed,
  } = data;
  const navigate = useNavigate();

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

  const hasNoData = summary.totalOrders === 0 && summary.prevTotalOrders === 0;

  return (
    <div className={styles.dashboardShell}>
        <div className={styles.dashboardStack}>

          {/* No data banner */}
          <NoDataBanner hasNoData={hasNoData} pixelStatus={pixelStatus} />

          {/* Date range selector + Compare toggle + Export */}
          <div className={styles.headerRow}>
            <div className={styles.comparePillSlot}>
              {compare && comparePeriodLabel && (
                <span className={styles.comparePill}>
                  vs {comparePeriodLabel}
                </span>
              )}
            </div>
            <s-stack direction="inline" alignItems="center" gap="small-100">
              <form
                method="post"
                className={styles.inlineForm}
                onSubmit={(e) => {
                  if (!window.confirm("Reconcile the last 30 days of orders from Shopify? Existing rows are skipped.")) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="intent" value="backfill" />
                <input type="hidden" name="days" value="30" />
                <s-button variant="secondary">Backfill 30 days</s-button>
              </form>
              <form method="post" className={styles.inlineForm}>
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
            showHeader={false}
          />

          <div className={styles.dashboardChartGrid}>
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

          <div className={styles.dashboardActivityGrid}>
            <LiveActivityFeed initialEvents={activityFeed} />
            <TopCampaigns rows={topCampaignsRows} formatRevenue={formatRevenue} />
          </div>

        </div>
    </div>
  );
}

export default function AttributionDashboard() {
  const { analytics, pixelStatus } = useLoaderData<typeof loader>();

  return (
    <>
      <Suspense fallback={<AttributionDashboardSkeleton />}>
        <Await resolve={analytics}>
          {(data) => <AttributionDashboardContent data={data} pixelStatus={pixelStatus} />}
        </Await>
      </Suspense>
    </>
  );
}
