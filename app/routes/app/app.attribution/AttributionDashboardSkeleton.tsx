import styles from "./AttributionRouteShell.module.css";
import attributionStyles from "../../../styles/routes/app-attribution.module.css";

type SkeletonSize = "funnel" | "chart" | "matrix" | "activity";

export function AttributionAnalyticsSkeletonCard({ size }: { size: SkeletonSize }) {
  return (
    <section
      aria-hidden="true"
      className={`wpb-card ${styles.analyticsSkeletonCard}`}
      data-size={size}
    >
      <s-spinner />
    </section>
  );
}

export function AttributionDashboardSkeleton() {
  return (
    <div aria-hidden="true" className={attributionStyles.dashboardShell}>
      <div className={attributionStyles.dashboardStack}>
        <AttributionAnalyticsSkeletonCard size="funnel" />
        <div className={attributionStyles.dashboardChartGrid}>
          <AttributionAnalyticsSkeletonCard size="chart" />
          <AttributionAnalyticsSkeletonCard size="chart" />
        </div>
        <AttributionAnalyticsSkeletonCard size="matrix" />
        <div className={attributionStyles.dashboardActivityGrid}>
          <AttributionAnalyticsSkeletonCard size="activity" />
          <AttributionAnalyticsSkeletonCard size="activity" />
        </div>
      </div>
    </div>
  );
}
