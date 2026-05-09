import { useState, useEffect, useCallback } from "react";
import styles from "./BundleReadinessOverlay.module.css";

export interface BundleReadinessItem {
  key: string;
  label: string;
  description?: string;
  points: number;
  done: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

interface Props {
  items: BundleReadinessItem[];
  bundleId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function scoreColor(score: number) {
  if (score >= 80) return "#008060";
  if (score >= 40) return "#005bd3";
  return "#d82c0d";
}

export function BundleReadinessOverlay({ items, bundleId, open, onOpenChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);

  useEffect(() => {
    setHasPreview(!!localStorage.getItem(`wpb_preview_${bundleId}`));
  }, [bundleId]);

  useEffect(() => {
    if (open !== undefined) setExpanded(open);
  }, [open]);

  const previewItem: BundleReadinessItem = {
    key: "previewed",
    label: "Bundle previewed",
    description: "Preview your bundle to see how it looks on the storefront.",
    points: 10,
    done: hasPreview,
  };

  const allItems = [...items, previewItem];
  const score = allItems.reduce((sum, i) => sum + (i.done ? i.points : 0), 0);
  const doneCount = allItems.filter((i) => i.done).length;
  const color = scoreColor(score);

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270° visible span
  const progressLength = (score / 100) * arcLength;

  const toggle = useCallback(() => {
    setExpanded((e) => {
      onOpenChange?.(!e);
      return !e;
    });
  }, [onOpenChange]);

  const allDone = allItems.every((i) => i.done);

  const donut = (
    <svg width="48" height="48" viewBox="0 0 48 48" className={styles.arc}>
      {/* Gray C-gauge track (270°, gap at bottom) */}
      <circle
        cx="24" cy="24" r={radius}
        fill="none" stroke="#e8e8e8" strokeWidth="4"
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        transform="rotate(135 24 24)"
      />
      {/* Colored progress arc */}
      <circle
        cx="24" cy="24" r={radius}
        fill="none" stroke={color} strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${progressLength} ${circumference - progressLength}`}
        transform="rotate(135 24 24)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="24" y="29" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
        {score}
      </text>
    </svg>
  );

  const chevron = (
    <svg className={styles.chevron} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d={expanded ? "M2 5L7 10L12 5" : "M2 9L7 4L12 9"}
        stroke="#666"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <>
    {expanded && (
      <div className={styles.dimOverlay} onClick={toggle} />
    )}
    <div className={styles.container}>
      <div className={`${styles.panelWrapper} ${expanded ? styles.panelWrapperOpen : ""}`}>
        <div className={styles.panelInner}>
          <div className={styles.panel}>
            <div className={styles.panelItems}>
              {allItems.map((item) => (
                <div
                  key={item.key}
                  className={`${styles.panelItem} ${item.done ? styles.panelItemDone : ""}`}
                >
                  <div className={styles.itemIndicator}>
                    {item.done ? (
                      <svg width="20" height="20" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="10" fill="#008060" />
                        <path
                          d="M6 10.5l2.5 2.5L14 8"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="9" fill="none" stroke="#c9cccf" strokeWidth="1.5" />
                      </svg>
                    )}
                  </div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemLabel}>{item.label}</span>
                    {item.description && (
                      <span className={styles.itemDesc}>{item.description}</span>
                    )}
                  </div>
                  <span className={`${styles.itemPoints} ${item.done ? styles.itemPointsDone : ""}`}>
                    +{item.points}
                  </span>
                </div>
              ))}
            </div>
            <div className={allDone ? styles.statusReady : styles.statusNotReady}>
              {allDone ? "Your bundle is ready to sell!" : "Your bundle isn't ready to sell yet."}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${styles.collapsed} ${expanded ? styles.collapsedOpen : ""}`}
        onClick={toggle}
      >
        {donut}
        {expanded && (
          <div className={styles.scoreLabel}>
            <span className={styles.scoreLabelTitle}>Readiness Score</span>
            <span className={styles.scoreLabelSub}>
              {doneCount}/{allItems.length} items complete
            </span>
          </div>
        )}
        {chevron}
      </div>
    </div>
    </>
  );
}
