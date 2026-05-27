import { useState, useEffect, useCallback, type KeyboardEvent } from "react";
import styles from "./BundleReadinessOverlay.module.css";

export interface BundleReadinessItem {
  key: string;
  label: string;
  description?: string;
  points: number;
  done: boolean;
}

interface Props {
  items: BundleReadinessItem[];
  bundleId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideCollapsedTrigger?: boolean;
  onItemClick?: (key: string) => void;
}

function scoreColor(score: number) {
  if (score >= 80) return "#008060";
  if (score >= 40) return "#005bd3";
  return "#d82c0d";
}

export function BundleReadinessOverlay({ items, open, onOpenChange, hideCollapsedTrigger = false, onItemClick }: Props) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (open !== undefined) setExpanded(open);
  }, [open]);

  const score = items.reduce((sum, i) => sum + (i.done ? i.points : 0), 0);
  const color = scoreColor(score);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const progressLength = (score / 100) * arcLength;

  const toggle = useCallback(() => {
    setExpanded((e) => {
      onOpenChange?.(!e);
      return !e;
    });
  }, [onOpenChange]);

  const allDone = items.every((i) => i.done);

  const activateItem = useCallback((key: string) => {
    if (!onItemClick) return;
    setExpanded(false);
    onOpenChange?.(false);
    onItemClick(key);
  }, [onItemClick, onOpenChange]);

  const handleItemKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, key: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateItem(key);
      }
    },
    [activateItem],
  );

  if (hideCollapsedTrigger && !expanded) return null;

  const donut = (
    <svg width="56" height="56" viewBox="0 0 56 56" className={styles.arc}>
      <circle
        cx="28" cy="28" r={radius}
        fill="none" stroke="#e8e8e8" strokeWidth="4.5"
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        transform="rotate(135 28 28)"
      />
      <circle
        cx="28" cy="28" r={radius}
        fill="none" stroke={color} strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={`${progressLength} ${circumference - progressLength}`}
        transform="rotate(135 28 28)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="28" y="34" textAnchor="middle" fontSize="16" fontWeight="700" fill={color}>
        {score}
      </text>
    </svg>
  );

  const chevron = (
    <svg
      className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ""}`}
      width="14" height="14" viewBox="0 0 14 14" fill="none"
    >
      <path d="M2 9L7 4L12 9" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      {expanded && <div className={styles.dimOverlay} onClick={toggle} />}
      <div className={styles.container}>
        <div className={`${styles.panelWrapper} ${expanded ? styles.panelWrapperOpen : ""}`}>
          <div className={styles.panelInner}>
            <div className={styles.panel}>
              <div className={styles.panelItems}>
                {items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.panelItem} ${item.done ? styles.panelItemDone : ""} ${onItemClick ? styles.panelItemClickable : ""}`}
                    onClick={() => {
                      activateItem(item.key);
                    }}
                    onKeyDown={(event) => handleItemKeyDown(event, item.key)}
                    aria-label={`${item.label} readiness item`}
                  >
                    <div className={styles.itemIndicator}>
                      {item.done ? (
                        <svg width="20" height="20" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="10" fill="#008060" />
                          <path d="M6 10.5l2.5 2.5L14 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
                      <span className={`${styles.itemPoints} ${item.done ? styles.itemPointsDone : ""}`}>
                        +{item.points} Points
                      </span>
                    </div>
                    {onItemClick && (
                      <div className={styles.itemChevron} aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M3 1.5L7 5L3 8.5" stroke="#8c8c8c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className={allDone ? styles.statusReady : styles.statusNotReady}>
                {allDone ? "Your bundle is ready to sell!" : "Your bundle isn't ready to sell yet."}
              </div>
            </div>
          </div>
        </div>

        {(!hideCollapsedTrigger || expanded) && (
          <div
            role="button"
            tabIndex={0}
            data-tour-target="fpb-readiness-score"
            className={`${styles.collapsed} ${expanded ? styles.collapsedOpen : ""}`}
            onClick={toggle}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggle();
              }
            }}
            aria-label="Toggle readiness score"
          >
            {donut}
            {expanded && (
              <div className={styles.scoreLabel}>
                <span className={styles.scoreLabelTitle}>Readiness Score</span>
                <span className={styles.scoreLabelSub}>
                  Complete all steps to maximise your bundle's success.
                </span>
              </div>
            )}
            {chevron}
          </div>
        )}
      </div>
    </>
  );
}
