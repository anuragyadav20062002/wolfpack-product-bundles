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
  const offset = circumference - (score / 100) * circumference;

  const toggle = useCallback(() => {
    setExpanded((e) => {
      onOpenChange?.(!e);
      return !e;
    });
  }, [onOpenChange]);

  const allDone = allItems.every((i) => i.done);

  const donut = (
    <svg width="44" height="44" viewBox="0 0 44 44" className={styles.arc}>
      <circle cx="22" cy="22" r={radius} fill="none" stroke="#e8e8e8" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="22" y="27" textAnchor="middle" fontSize="11" fontWeight="600" fill={color}>
        {score}
      </text>
    </svg>
  );

  return (
    <div className={styles.container}>
      {expanded && (
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
      )}

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
        <span className={styles.chevron}>{expanded ? "∨" : "∧"}</span>
      </div>
    </div>
  );
}
