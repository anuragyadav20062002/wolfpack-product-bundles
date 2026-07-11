import { lazy, Suspense, useEffect, useState } from "react";
import { Await, useLoaderData, useNavigate } from "@remix-run/react";
import { navigateBackOrFallback } from "../../../lib/navigation";
import type { loader } from "../app.attribution";
import styles from "./AttributionRouteShell.module.css";
import attributionStyles from "../../../styles/routes/app-attribution.module.css";
import { AttributionDashboardSkeleton } from "./AttributionDashboardSkeleton";
import "../../../components/analytics/shared/tokens.css";

const AttributionDashboard = lazy(() => import("./AttributionDashboard"));
const PixelStatusCard = lazy(() =>
  import("./PixelStatusCard").then((module) => ({
    default: module.PixelStatusCard,
  }))
);
const DASHBOARD_IMPORT_DELAY_MS = 3000;

function AttributionStatusPending() {
  return <div aria-hidden="true" className={styles.statusPending} />;
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
        <Suspense fallback={<AttributionStatusPending />}>
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
