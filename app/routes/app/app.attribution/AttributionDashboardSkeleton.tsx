import styles from "./AttributionRouteShell.module.css";

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
    <div aria-hidden="true" className={styles.dashboardShell}>
      <div className={styles.dashboardStack}>
        <AttributionAnalyticsSkeletonCard size="funnel" />
        <div className={styles.dashboardChartGrid}>
          <AttributionAnalyticsSkeletonCard size="chart" />
          <AttributionAnalyticsSkeletonCard size="chart" />
        </div>
        <AttributionAnalyticsSkeletonCard size="matrix" />
        <div className={styles.dashboardActivityGrid}>
          <AttributionAnalyticsSkeletonCard size="activity" />
          <AttributionAnalyticsSkeletonCard size="activity" />
        </div>
      </div>
    </div>
  );
}
