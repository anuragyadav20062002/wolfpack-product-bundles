import { lazy, Suspense, useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { navigateBackOrFallback } from "../../../lib/navigation";
import type { loader } from "../app.attribution";
import styles from "./AttributionRouteShell.module.css";
import { AttributionDashboardSkeleton } from "./AttributionDashboardSkeleton";

const AttributionDashboard = lazy(() => import("./AttributionDashboard"));
const PixelStatusCard = lazy(() =>
  import("./PixelStatusCard").then((module) => ({
    default: module.PixelStatusCard,
  }))
);
const DASHBOARD_IMPORT_DELAY_MS = 3000;

function AttributionStatusPending() {
  return (
    <div
      className={styles.pixelStatusCard}
      data-status="checking"
      aria-busy="true"
    >
      <div className={styles.pixelStatusBody}>
        <div className={styles.pixelStatusIcon} aria-hidden="true">
          <s-icon type="globe" />
        </div>
        <div className={styles.pixelStatusContent}>
          <div className={styles.pixelStatusHeading}>
            <h2 className={styles.pixelStatusTitle}>UTM Pixel Tracking</h2>
            <s-badge tone="neutral">Checking</s-badge>
          </div>
          <p className={styles.pixelStatusDescription}>Checking your campaign attribution status.</p>
        </div>
        <div className={styles.pixelStatusAction}>
          <s-spinner size="base" />
        </div>
      </div>
    </div>
  );
}

function AttributionCriticalFunnelHeader() {
  return (
    <div className={styles.criticalHeroShell}>
      <section
        className={styles.criticalHeroCard}
        aria-labelledby="wpb-critical-funnel-hero-title"
      >
        <header className={styles.criticalHeroHeader}>
          <div>
            <p className={styles.criticalHeroKicker}>Bundle Funnel</p>
            <h2
              id="wpb-critical-funnel-hero-title"
              className={styles.criticalHeroTitle}
            >
              How shoppers move through your bundles
            </h2>
          </div>
        </header>
      </section>
    </div>
  );
}

function AttributionCriticalStatus({
  pixelStatus,
}: {
  pixelStatus: Promise<{ active: boolean }>;
}) {
  const [status, setStatus] = useState<{ active: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus(null);

    void pixelStatus
      .then((nextStatus) => {
        if (!cancelled) {
          setStatus({ active: Boolean(nextStatus.active) });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({ active: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pixelStatus]);

  return (
    <div className={styles.pixelStatusBoundary}>
      <div className={styles.pixelStatusShell}>
        {status ? (
          <Suspense fallback={<AttributionStatusPending />}>
            <PixelStatusCard pixelActive={status.active} />
          </Suspense>
        ) : (
          <AttributionStatusPending />
        )}
      </div>
    </div>
  );
}

export default function AttributionRouteShell() {
  const { pixelStatus } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [loadDashboard, setLoadDashboard] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setLoadDashboard(true);
    }, DASHBOARD_IMPORT_DELAY_MS);

    return () => {
      window.clearTimeout(handle);
    };
  }, []);

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
      <AttributionCriticalFunnelHeader />
      <AttributionCriticalStatus pixelStatus={pixelStatus} />
      {loadDashboard ? (
        <Suspense fallback={<AttributionDashboardSkeleton />}>
          <AttributionDashboard />
        </Suspense>
      ) : (
        <AttributionDashboardSkeleton />
      )}
    </>
  );
}
