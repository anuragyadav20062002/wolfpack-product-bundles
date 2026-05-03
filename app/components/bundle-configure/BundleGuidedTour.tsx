import { useEffect, useState, useCallback } from "react";
import styles from "./BundleGuidedTour.module.css";
import type { TourStep } from "./tourSteps";

interface Props {
  steps: TourStep[];
  shop: string;
  bundleId: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export function BundleGuidedTour({ steps, shop, bundleId, onComplete, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const storageKey = `wpb_tour_seen_${shop}_${bundleId}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(storageKey)) {
      setVisible(true);
    }
  }, [storageKey]);

  // Highlight + scroll target section when step changes
  useEffect(() => {
    if (!visible) return;
    const step = steps[currentStep];
    if (!step?.targetSection) return;
    const el = document.querySelector(
      `[data-tour-target="${step.targetSection}"]`
    ) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("wpb-tour-highlight");
    return () => el.classList.remove("wpb-tour-highlight");
  }, [visible, currentStep, steps]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
    onDismiss?.();
  }, [storageKey, onDismiss]);

  const handleNext = useCallback(() => {
    if (currentStep === steps.length - 1) {
      localStorage.setItem(storageKey, "1");
      setVisible(false);
      onComplete?.();
      return;
    }
    setCurrentStep((i) => i + 1);
  }, [currentStep, steps.length, storageKey, onComplete]);

  if (!visible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className={styles.overlay}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.stepLabel}>
        STEP {currentStep + 1} OF {steps.length}
      </div>
      <div className={styles.title}>{step.title}</div>
      <div className={styles.body}>{step.body}</div>
      <div className={styles.actions}>
        <button className={styles.dismissBtn} onClick={handleDismiss}>
          Dismiss
        </button>
        <button className={styles.nextBtn} onClick={handleNext}>
          {isLast ? "Got it" : "Next →"}
        </button>
      </div>
    </div>
  );
}
