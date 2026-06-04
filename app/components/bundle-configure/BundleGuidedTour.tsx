import { useEffect, useState, useCallback, useRef, type CSSProperties } from "react";
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
  enabled?: boolean;
  onStepChange?: (step: TourStep, index: number) => void;
  onComplete?: () => void;
  onDismiss?: () => void;
}

const TOOLTIP_WIDTH = 420;
const TOOLTIP_HEIGHT = 220;
const SPOTLIGHT_PAD = 8;
const MAX_TARGET_LOOKUP_FRAMES = 30;
const STABLE_FRAME_COUNT = 4;

export function BundleGuidedTour({
  steps,
  shop,
  enabled = true,
  onStepChange,
  onComplete,
  onDismiss,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const rafRef = useRef<number | null>(null);
  const highlightedTargetRef = useRef<{
    el: HTMLElement;
    position: string;
    zIndex: string;
  } | null>(null);

  const storageKey = `wpb_first_bundle_tour_seen_${shop}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) return;
    if (!localStorage.getItem(storageKey)) {
      setVisible(true);
    }
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const cancelPendingFrame = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const cleanupHighlightedTarget = useCallback(() => {
    const highlighted = highlightedTargetRef.current;
    if (!highlighted) return;
    highlighted.el.classList.remove("wpb-tour-highlight");
    highlighted.el.style.position = highlighted.position;
    highlighted.el.style.zIndex = highlighted.zIndex;
    highlightedTargetRef.current = null;
  }, []);

  const centeredBottomStyle = useCallback((): CSSProperties => ({
    top: window.innerHeight - 280,
    left: Math.max(12, window.innerWidth / 2 - TOOLTIP_WIDTH / 2),
    transform: "none",
    bottom: "auto",
  }), []);

  const showFallbackPosition = useCallback(() => {
    setSpotlightRect(null);
    setTooltipStyle(centeredBottomStyle());
  }, [centeredBottomStyle]);

  const queryTarget = useCallback((targetSection: string) => {
    return document.querySelector<HTMLElement>(
      `[data-tour-target="${targetSection}"]`
    );
  }, []);

  const highlightTarget = useCallback((el: HTMLElement) => {
    cleanupHighlightedTarget();
    highlightedTargetRef.current = {
      el,
      position: el.style.position,
      zIndex: el.style.zIndex,
    };
    el.classList.add("wpb-tour-highlight");
    el.style.position = "relative";
    el.style.zIndex = "595";
  }, [cleanupHighlightedTarget]);

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

    const belowFits = rect.bottom + TOOLTIP_HEIGHT + 12 < vh;
    const top = belowFits ? rect.bottom + 12 : Math.max(12, rect.top - TOOLTIP_HEIGHT - 12);
    let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(12, Math.min(left, vw - TOOLTIP_WIDTH - 12));

    setTooltipStyle({ top, left, transform: "none", bottom: "auto" });
  }, []);

  const waitForStableTarget = useCallback((el: HTMLElement) => {
    let lastTop = -Infinity;
    let stableFrames = 0;

    const poll = () => {
      const rect = el.getBoundingClientRect();
      if (Math.abs(rect.top - lastTop) < 0.5) {
        stableFrames += 1;
        if (stableFrames >= STABLE_FRAME_COUNT) {
          updatePositions(el);
          rafRef.current = null;
          return;
        }
      } else {
        stableFrames = 0;
      }
      lastTop = rect.top;
      rafRef.current = requestAnimationFrame(poll);
    };

    rafRef.current = requestAnimationFrame(poll);
  }, [updatePositions]);

  useEffect(() => {
    if (!visible) return;

    cancelPendingFrame();
    cleanupHighlightedTarget();

    const step = steps[currentStep];
    onStepChange?.(step, currentStep);

    if (!step?.targetSection) {
      showFallbackPosition();
      return;
    }

    showFallbackPosition();

    let cancelled = false;
    let lookupFrames = 0;

    const resolveAndMeasure = () => {
      if (cancelled) return;

      const el = queryTarget(step.targetSection);

      if (!el) {
        lookupFrames += 1;
        if (lookupFrames <= MAX_TARGET_LOOKUP_FRAMES) {
          rafRef.current = requestAnimationFrame(resolveAndMeasure);
          return;
        }
        showFallbackPosition();
        rafRef.current = null;
        return;
      }

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      highlightTarget(el);
      waitForStableTarget(el);
    };

    rafRef.current = requestAnimationFrame(resolveAndMeasure);

    return () => {
      cancelled = true;
      cancelPendingFrame();
      cleanupHighlightedTarget();
    };
  }, [
    visible,
    currentStep,
    steps,
    onStepChange,
    queryTarget,
    highlightTarget,
    waitForStableTarget,
    showFallbackPosition,
    cancelPendingFrame,
    cleanupHighlightedTarget,
  ]);

  useEffect(() => {
    return () => {
      cancelPendingFrame();
      cleanupHighlightedTarget();
    };
  }, [cancelPendingFrame, cleanupHighlightedTarget]);

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
                  style={{
                    x: spotlightRect.x,
                    y: spotlightRect.y,
                    width: spotlightRect.width,
                    height: spotlightRect.height,
                    transition: "x 0.35s ease, y 0.35s ease, width 0.35s ease, height 0.35s ease",
                  } as CSSProperties}
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
          <button type="button" className={styles.dismissTourLink} onClick={handleDismiss}>
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
          <button type="button" className={styles.nextBtn} onClick={handleNext}>
            {isLast ? "Got it" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}
