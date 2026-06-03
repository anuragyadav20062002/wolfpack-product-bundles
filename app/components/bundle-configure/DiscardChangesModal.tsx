import { useTranslation } from "react-i18next";
import { LocalAppModal } from "./LocalAppModal";

interface DiscardChangesModalProps {
  open: boolean;
  onDiscard: () => void;
  onContinue: () => void;
}

export function DiscardChangesModal({
  open,
  onDiscard,
  onContinue,
}: DiscardChangesModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <LocalAppModal
      title={t("common.discardChanges.title")}
      onClose={onContinue}
      primaryAction={(
        <s-button tone="critical" variant="primary" onClick={onDiscard}>
          {t("common.actions.discardChanges")}
        </s-button>
      )}
      secondaryAction={(
        <s-button variant="secondary" onClick={onContinue}>
          {t("common.actions.continueEditing")}
        </s-button>
      )}
    >
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
        {t("common.discardChanges.body")}
      </p>
    </LocalAppModal>
  );
}
