import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { openThemeEditorInNewTab } from "../lib/theme-editor-navigation.client";
import styles from "./AppEmbedBanner.module.css";

interface AppEmbedBannerProps {
  appEmbedEnabled: boolean;
  themeEditorUrl: string | null;
  feedbackTrigger?: number;
  onEnableClick?: () => void;
}

export function AppEmbedBanner({
  appEmbedEnabled,
  themeEditorUrl,
  feedbackTrigger = 0,
  onEnableClick,
}: AppEmbedBannerProps) {
  const [isAnimatingFeedback, setIsAnimatingFeedback] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (feedbackTrigger <= 0 || appEmbedEnabled) return;
    setIsAnimatingFeedback(false);
    const startFrame = window.requestAnimationFrame(() => {
      setIsAnimatingFeedback(true);
    });
    const timeout = window.setTimeout(() => {
      setIsAnimatingFeedback(false);
    }, 320);

    return () => {
      window.cancelAnimationFrame(startFrame);
      window.clearTimeout(timeout);
    };
  }, [appEmbedEnabled, feedbackTrigger]);

  if (appEmbedEnabled) return null;

  return (
    <>
      <div
        role="alert"
        data-feedback-state={isAnimatingFeedback ? "active" : "idle"}
        className={`${styles.banner} ${isAnimatingFeedback ? styles.bannerFeedbackActive : ""}`}
        suppressHydrationWarning
      >
        <span aria-hidden="true" className={styles.icon}>
          !
        </span>
        <span className={styles.body}>
          {t("common.appEmbed.body")}
        </span>
        <div className={styles.actions}>
          <s-button
            variant="secondary"
            onClick={() => setIsGuideModalOpen(true)}
          >
            {t("common.actions.learnMore")}
          </s-button>
          {themeEditorUrl && (
            <s-button
              variant="secondary"
              onClick={() => {
                if (onEnableClick) {
                  onEnableClick();
                  return;
                }
                openThemeEditorInNewTab(themeEditorUrl);
              }}
            >
              {t("common.actions.enableHere")}
            </s-button>
          )}
        </div>
      </div>
      <AppEmbedGuideModal
        onClose={() => setIsGuideModalOpen(false)}
        onEnableClick={onEnableClick}
        open={isGuideModalOpen}
        themeEditorUrl={themeEditorUrl}
      />
    </>
  );
}

interface AppEmbedGuideModalProps {
  open: boolean;
  themeEditorUrl: string | null;
  onClose: () => void;
  onEnableClick?: () => void;
}

export function AppEmbedGuideModal({
  open,
  themeEditorUrl,
  onClose,
  onEnableClick,
}: AppEmbedGuideModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  const handleEnable = () => {
    onClose();
    if (onEnableClick) {
      onEnableClick();
      return;
    }
    if (themeEditorUrl) {
      openThemeEditorInNewTab(themeEditorUrl);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-embed-guide-title"
      className={styles.modalBackdrop}
    >
      <div className={styles.modal}>
        <h2 id="app-embed-guide-title" className={styles.modalTitle}>
          {t("common.appEmbed.guideTitle")}
        </h2>
        <img
          src="/appEmbedGuide.avif"
          alt={t("common.appEmbed.guideImageAlt")}
          className={styles.guideImage}
        />
        <div className={styles.modalActions}>
          <s-button variant="primary" onClick={handleEnable}>
            {t("common.actions.enable")}
          </s-button>
          <s-button variant="secondary" onClick={onClose}>
            {t("common.actions.close")}
          </s-button>
        </div>
      </div>
    </div>
  );
}
