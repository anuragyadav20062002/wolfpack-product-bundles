import { useState, useEffect, useCallback } from "react";
import styles from "./BundleReadinessOverlay.module.css";

export interface BundleReadinessItem {
  key: string;
  label: string;
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
  return "#aaa";
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
    points: 10,
    done: hasPreview,
  };

  const allItems = [...items, previewItem];
  const score = allItems.reduce((sum, i) => sum + (i.done ? i.points : 0), 0);
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

  return (
    <div className={styles.container}>
      {expanded && (
        <div className={styles.panel}>
          <div className={styles.panelItems}>
            {allItems.map((item) => (
              <div key={item.key} className={styles.panelItem}>
                <span className={item.done ? styles.checkDone : styles.checkPending}>
                  {item.done ? "✓" : "○"}
                </span>
                <span className={styles.itemLabel}>{item.label}</span>
                <span className={styles.itemPoints}>+{item.points}</span>
                {!item.done && item.actionLabel && item.actionUrl && (
                  <a href={item.actionUrl} className={styles.itemAction}>→</a>
                )}
              </div>
            ))}
          </div>
          <div className={`${styles.statusLine} ${allDone ? styles.statusReady : styles.statusNotReady}`}>
            {allDone ? "✓ Bundle is ready!" : "⚠ Bundle isn't ready yet."}
          </div>
        </div>
      )}

      <div className={styles.collapsed} onClick={toggle}>
        <svg width="44" height="44" viewBox="0 0 44 44" className={styles.arc}>
          <circle cx="22" cy="22" r={radius} fill="none" stroke="#e8e8e8" strokeWidth="4" />
          <circle
            cx="22" cy="22" r={radius}
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
        <div className={styles.scoreLabel}>
          <span>Readiness</span>
          <span>Score</span>
        </div>
        <span className={styles.chevron}>{expanded ? "∧" : "∨"}</span>
      </div>
    </div>
  );
}
