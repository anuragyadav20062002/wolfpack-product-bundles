import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { navigateBackOrFallback } from "../../../lib/navigation";
import styles from "./AttributionRouteShell.module.css";

const AttributionDashboard = lazy(() => import("./AttributionDashboard"));
const DASHBOARD_IMPORT_DELAY_MS = 3000;

function AttributionDashboardPending() {
  return <div aria-hidden="true" className={styles.dashboardPending} />;
}

export default function AttributionRouteShell() {
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
