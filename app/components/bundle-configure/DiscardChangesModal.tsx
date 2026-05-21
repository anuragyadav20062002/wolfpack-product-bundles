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
  if (!open) return null;

  return (
    <LocalAppModal
      title="Discard all unsaved changes"
      onClose={onContinue}
      primaryAction={(
        <s-button tone="critical" variant="primary" onClick={onDiscard}>
          Discard Changes
        </s-button>
      )}
      secondaryAction={(
        <s-button variant="secondary" onClick={onContinue}>
          Continue Editing
        </s-button>
      )}
    >
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
        If you discard changes, you'll delete any edits you made since you last saved.
      </p>
    </LocalAppModal>
  );
}
