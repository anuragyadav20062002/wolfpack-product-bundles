import { useEffect, useState, useCallback } from "react";
import styles from "./BundleGuidedTour.module.css";
import type { TourStep } from "./tourSteps";

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  steps: TourStep[];
  shop: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

const TOOLTIP_WIDTH = 420;
const SPOTLIGHT_PAD = 8;

export function BundleGuidedTour({ steps, shop, onComplete, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // Shop-level key — tour fires only once per shop (first bundle creation)
  const storageKey = `wpb_first_bundle_tour_seen_${shop}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(storageKey)) {
      setVisible(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const updatePositions = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    setSpotlightRect({
      x: rect.left - SPOTLIGHT_PAD,
      y: rect.top - SPOTLIGHT_PAD,
      width: rect.width + SPOTLIGHT_PAD * 2,
      height: rect.height + SPOTLIGHT_PAD * 2,
    });

    const tooltipH = 220;
    const belowFits = rect.bottom + tooltipH + 12 < vh;
    const top = belowFits ? rect.bottom + 12 : Math.max(12, rect.top - tooltipH - 12);
    let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(12, Math.min(left, vw - TOOLTIP_WIDTH - 12));

    setTooltipStyle({ top, left, transform: "none", bottom: "auto" });
  }, []);

  useEffect(() => {
    if (!visible) return;
    const step = steps[currentStep];

    if (!step?.targetSection) {
      setSpotlightRect(null);
      setTooltipStyle({});
      return;
    }

    const el = document.querySelector(
      `[data-tour-target="${step.targetSection}"]`
    ) as HTMLElement | null;
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("wpb-tour-highlight");
    const prevPosition = el.style.position;
    const prevZIndex = el.style.zIndex;
    el.style.position = "relative";
    el.style.zIndex = "595";

    // Position immediately, then refine once smooth-scroll settles
    updatePositions(el);
    const tid = window.setTimeout(() => updatePositions(el), 350);

    return () => {
      clearTimeout(tid);
      el.classList.remove("wpb-tour-highlight");
      el.style.position = prevPosition;
      el.style.zIndex = prevZIndex;
    };
  }, [visible, currentStep, steps, updatePositions]);

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
    <>
      <svg
        className={styles.backdrop}
        onClick={handleDismiss}
        xmlns="http://www.w3.org/2000/svg"
      >
        {spotlightRect ? (
          <>
            <defs>
              <mask id="wpb-spotlight">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotlightRect.x}
                  y={spotlightRect.y}
                  width={spotlightRect.width}
                  height={spotlightRect.height}
                  rx="10"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.55)"
              mask="url(#wpb-spotlight)"
            />
          </>
        ) : (
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.45)" />
        )}
      </svg>

      <div className={styles.overlay} style={tooltipStyle}>
        <div className={styles.tourHeader}>
          <button className={styles.dismissTourLink} onClick={handleDismiss}>
            Dismiss guided tour
          </button>
        </div>
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
    </>
  );
}
