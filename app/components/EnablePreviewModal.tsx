import { useTranslation } from "react-i18next";
import { openThemeEditorInNewTab } from "../lib/theme-editor-navigation.client";
import styles from "./EnablePreviewModal.module.css";

interface EnablePreviewModalProps {
  open: boolean;
  onClose: () => void;
  themeEditorUrl: string | null;
  onSetupVisibility?: () => void;
}

export function EnablePreviewModal({
  open,
  onClose,
  themeEditorUrl,
  onSetupVisibility,
}: EnablePreviewModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enable-preview-modal-title"
      className={styles.backdrop}
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.iconFrame}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <h2
          id="enable-preview-modal-title"
          className={styles.title}
        >
          {t("common.previewGate.title")}
        </h2>
        <p className={styles.body}>
          {t("common.previewGate.body")}
        </p>
        <div className={styles.actions}>
          <s-button variant="secondary" onClick={onClose}>{t("common.actions.maybeLater")}</s-button>
          <s-button
            variant="primary"
            onClick={() => {
              if (onSetupVisibility) {
                onSetupVisibility();
              } else if (themeEditorUrl) {
                openThemeEditorInNewTab(themeEditorUrl);
              }
              onClose();
            }}
          >
            {t("common.actions.setUpVisibility")}
          </s-button>
        </div>
      </div>
    </div>
  );
}
