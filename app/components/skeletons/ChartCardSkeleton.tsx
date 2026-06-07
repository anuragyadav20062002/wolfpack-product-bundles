/**
 * ChartCardSkeleton — fixed-height shimmer placeholder for Suspense
 * fallbacks around chart components. Designed to match the analytics
 * card surface so the swap-in doesn't shift layout (CLS guard).
 *
 * Issue: docs/issues-prod/admin-lcp-phase5-recharts-lazy-1.md
 */

import styles from "./ChartCardSkeleton.module.css";

interface ChartCardSkeletonProps {
  /** Approximate inner content height in px. Defaults to 280 to match the
   *  Engagement/Revenue cards. Use 220 for sparkline-only tiles. */
  height?: number;
  /** Optional accessible label. Defaults to "Loading chart". */
  label?: string;
}

export function ChartCardSkeleton({ height = 280, label = "Loading chart" }: ChartCardSkeletonProps) {
  return (
    <div className={styles.card} role="status" aria-label={label}>
      <div className={styles.header}>
        <div className={styles.headerBar} />
      </div>
      <div className={styles.body} style={{ minHeight: height }}>
        <div className={styles.shimmer} />
      </div>
    </div>
  );
}
