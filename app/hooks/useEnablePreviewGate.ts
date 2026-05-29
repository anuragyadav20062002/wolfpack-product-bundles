import { useCallback, useState } from "react";

export type EnablePreviewGateInput = {
  appEmbedEnabled: boolean;
  themeEditorUrl: string | null;
};

export type EnablePreviewGateDecision =
  | { mode: "proceed" }
  | { mode: "block_with_modal" }
  | { mode: "block_silent" };

/**
 * Pure helper backing useEnablePreviewGate — separates the branching logic
 * from React state for easy unit testing.
 */
export function decideEnablePreviewGate(input: EnablePreviewGateInput): EnablePreviewGateDecision {
  if (input.appEmbedEnabled) return { mode: "proceed" };
  if (input.themeEditorUrl) return { mode: "block_with_modal" };
  return { mode: "block_silent" };
}

export type UseEnablePreviewGateOptions = EnablePreviewGateInput & {
  onSilentBlock?: () => void;
};

/**
 * React hook that wraps a preview action in the "enable theme app extension"
 * gate. Use:
 *
 *   const { requestPreview, modalProps } = useEnablePreviewGate({ appEmbedEnabled, themeEditorUrl });
 *   <s-button onClick={() => requestPreview(() => openPreview())} />
 *   <EnablePreviewModal {...modalProps} />
 */
export function useEnablePreviewGate(options: UseEnablePreviewGateOptions) {
  const [open, setOpen] = useState(false);

  const requestPreview = useCallback((onProceed: () => void) => {
    const decision = decideEnablePreviewGate({
      appEmbedEnabled: options.appEmbedEnabled,
      themeEditorUrl: options.themeEditorUrl,
    });
    if (decision.mode === "proceed") {
      onProceed();
      return;
    }
    if (decision.mode === "block_with_modal") {
      setOpen(true);
      return;
    }
    options.onSilentBlock?.();
  }, [options]);

  const closeModal = useCallback(() => setOpen(false), []);

  return {
    requestPreview,
    modalProps: {
      open,
      onClose: closeModal,
      themeEditorUrl: options.themeEditorUrl,
    },
  };
}
