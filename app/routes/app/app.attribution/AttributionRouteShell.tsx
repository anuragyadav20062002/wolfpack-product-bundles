import { lazy, Suspense, useEffect, useState } from "react";
import { Await, useLoaderData, useNavigate } from "@remix-run/react";
import { navigateBackOrFallback } from "../../../lib/navigation";
import { ChartCardSkeleton } from "../../../components/skeletons/ChartCardSkeleton";
import { PixelStatusCard } from "./PixelStatusCard";
import type { loader } from "../app.attribution";
import styles from "./AttributionRouteShell.module.css";
import attributionStyles from "../../../styles/routes/app-attribution.module.css";
import "../../../components/analytics/shared/tokens.css";

const AttributionDashboard = lazy(() => import("./AttributionDashboard"));
const DASHBOARD_IMPORT_DELAY_MS = 3000;

function AttributionDashboardPending() {
  return <div aria-hidden="true" className={styles.dashboardPending} />;
}

function AttributionCriticalFunnelHeader() {
  return (
    <div className={attributionStyles.criticalHeroShell}>
      <section
        className="wpb-card wpb-card--hero"
        aria-labelledby="wpb-critical-funnel-hero-title"
      >
        <header className="wpb-section-header">
          <div>
            <p className="wpb-label wpb-section-kicker">Bundle Funnel</p>
            <h2
              id="wpb-critical-funnel-hero-title"
              className="wpb-section-title wpb-section-title--hero"
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
  return (
    <div className={attributionStyles.pixelStatusBoundary}>
      <div className={attributionStyles.pixelStatusShell}>
        <Suspense fallback={<ChartCardSkeleton height={96} label="Loading tracking status" />}>
          <Await resolve={pixelStatus}>
            {(status) => (
              <PixelStatusCard pixelActive={Boolean(status.active)} />
            )}
          </Await>
        </Suspense>
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
      <AttributionCriticalStatus pixelStatus={pixelStatus} />
      <AttributionCriticalFunnelHeader />
      {loadDashboard ? (
        <Suspense fallback={<AttributionDashboardPending />}>
          <AttributionDashboard />
        </Suspense>
      ) : (
        <AttributionDashboardPending />
      )}
    </>
  );
}
