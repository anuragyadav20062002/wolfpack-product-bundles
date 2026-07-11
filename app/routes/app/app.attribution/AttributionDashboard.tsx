import { Await, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import "../../../components/analytics/shared/tokens.css";
import {
  FunnelHero,
  BundlePerformanceMatrix,
  LiveActivityFeed,
  TopCampaigns,
} from "../../../components/analytics";
import { LazyEngagementPulse, LazyRevenueAttribution } from "../../../components/analytics/lazy";
import styles from "../../../styles/routes/app-attribution.module.css";
import type { AttributionDashboardData, loader } from "../app.attribution";
import {
  AttributionAnalyticsSkeletonCard,
  AttributionDashboardSkeleton,
} from "./AttributionDashboardSkeleton";
import { shouldRenderAnalyticsNoDataBanner } from "./attribution-lcp-state";
import { analyzeCustomUtmInput } from "../../../lib/analytics/attribution-controls";

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
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [fromDate, setFromDate] = useState(from || "");
  const [toDate, setToDate] = useState(to || "");
  const containerRef = useRef<HTMLDivElement>(null);

  const triggerLabel = formatRangeLabel(days, from, to);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setFromDate(from || "");
    setToDate(to || "");
  }, [from, to]);

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
    setPopoverOpen(false);
    navigate(`${url.pathname}?${url.searchParams.toString()}`);
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
                type="button"
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

function CustomUtmTrackingCard({
  customUtmParameters,
}: {
  customUtmParameters: string[];
}) {
  const fetcher = useFetcher<{
    success?: boolean;
    customUtmParameters?: string[];
    message?: string;
    error?: string;
  }>();
  const [input, setInput] = useState(customUtmParameters.join("\n"));
  const inputAnalysis = useMemo(() => analyzeCustomUtmInput(input), [input]);

  useEffect(() => {
    setInput(customUtmParameters.join("\n"));
  }, [customUtmParameters]);

  useEffect(() => {
    if (fetcher.data?.success && Array.isArray(fetcher.data.customUtmParameters)) {
      setInput(fetcher.data.customUtmParameters.join("\n"));
    }
  }, [fetcher.data]);

  const isSaving = fetcher.state !== "idle";
  const feedback = fetcher.data?.error ?? fetcher.data?.message;
  const previewLabel = inputAnalysis.accepted.length > 0
    ? `Wolfpack will track: ${inputAnalysis.accepted.join(", ")}`
    : "No valid custom attributes will be tracked yet.";
  const savedLabel = customUtmParameters.length > 0
    ? `Currently tracking: ${customUtmParameters.join(", ")}`
    : "No custom attributes are configured yet.";

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Custom UTM attributes</h2>
          <p className={styles.mutedBodyText}>
            Enter parameter names separated by commas or new lines. Wolfpack captures matching URL values on future visits and stores them with checkout attribution.
          </p>
        </div>
      </div>
      <div className={styles.customUtmBody}>
        <fetcher.Form method="post" className={styles.customUtmForm}>
          <input type="hidden" name="intent" value="saveCustomUtms" />
          <input type="hidden" name="customUtmParameters" value={input} />
          <s-text-area
            label="Parameter names"
            value={input}
            rows={3}
            placeholder={"utm_influencer, partner_id\ncreator"}
            onInput={(event) => {
              setInput((event.target as HTMLTextAreaElement).value);
            }}
          />
          <div className={styles.customUtmFeedback} aria-live="polite">
            <p className={styles.customUtmPreview}>{previewLabel}</p>
            <p className={styles.mutedBodyText}>
              {savedLabel}
            </p>
            {inputAnalysis.rejected.length > 0 ? (
              <p className={styles.errorText}>
                Ignored: {inputAnalysis.rejected.join(", ")}. Use URL parameter names only, not shopper identifiers.
              </p>
            ) : null}
            {inputAnalysis.limitReached ? (
              <p className={styles.mutedBodyText}>
                Only the first 10 valid custom attributes will be saved.
              </p>
            ) : null}
          </div>
          <s-stack direction="inline" alignItems="center" gap="small-100">
            <s-button variant="primary" disabled={isSaving || undefined}>
              {isSaving ? "Updating tracking" : "Save custom attributes"}
            </s-button>
            {feedback ? (
              <span className={fetcher.data?.error ? styles.errorText : styles.successText}>
                {feedback}
              </span>
            ) : null}
          </s-stack>
        </fetcher.Form>
      </div>
    </section>
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
    customUtmParameters,
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
                  if (!window.confirm("Reconcile orders from Shopify for the selected analytics window? Existing rows are skipped.")) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="intent" value="backfill" />
                {from && to ? (
                  <>
                    <input type="hidden" name="from" value={from} />
                    <input type="hidden" name="to" value={to} />
                  </>
                ) : (
                  <input type="hidden" name="days" value={String(days)} />
                )}
                <s-button variant="secondary">Backfill window</s-button>
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
            <Suspense fallback={<AttributionAnalyticsSkeletonCard size="chart" />}>
              <LazyEngagementPulse
                engagedSessions={engagedSessions}
                prevEngagedSessions={prevEngagedSessions}
                engagementToOrderPct={engagementToOrderPct}
                trend={engagementTrend}
              />
            </Suspense>
            <Suspense fallback={<AttributionAnalyticsSkeletonCard size="chart" />}>
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

          <CustomUtmTrackingCard customUtmParameters={customUtmParameters} />

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
