/**
 * DashboardBannerSkeleton — fixed-height placeholder for the deferred
 * ProxyHealthBanner + UpgradePromptBanner row on the dashboard. Reserves
 * vertical space so the bundles list below it doesn't shift when the
 * deferred promise resolves (CLS guard).
 *
 * Reserves height for at most one banner — both banners are conditional
 * (proxy unhealthy / upgrade prompt visible) and don't usually render
 * together. If only one renders, this shrinks gracefully; if neither
 * renders, the skeleton briefly shows then collapses to 0 — acceptable
 * tradeoff vs. blocking initial paint on the queries.
 *
 * Issue: docs/issues-prod/admin-lcp-phase6-defer-skeletons-1.md
 */

import styles from "./DashboardBannerSkeleton.module.css";

export function DashboardBannerSkeleton() {
  return (
    <div className={styles.row} role="status" aria-label="Loading dashboard banners">
      <div className={styles.banner} />
    </div>
  );
}
