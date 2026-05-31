import { useCallback, useEffect, useState } from "react";

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

/**
 * Returns true when the visibility modal should auto-open on configure page mount:
 * embed is disabled AND the modal hasn't already been shown in this browser session.
 * Extracted as a pure function so it can be unit-tested without React or sessionStorage.
 */
export function shouldAutoShowOnMount(appEmbedEnabled: boolean, hasBeenShownThisSession: boolean): boolean {
  return !appEmbedEnabled && !hasBeenShownThisSession;
}

export type UseEnablePreviewGateOptions = EnablePreviewGateInput & {
  onSilentBlock?: () => void;
  /**
   * Bundle ID — when provided, the modal auto-shows on page mount if the embed is
   * disabled and it hasn't been shown yet this browser session (sessionStorage keyed
   * per bundle so navigating between bundles re-triggers the nudge).
   */
  sessionKey?: string;
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

  useEffect(() => {
    if (!options.sessionKey) return;
    const storageKey = `wpb_visibility_shown_${options.sessionKey}`;
    const hasBeenShown = sessionStorage.getItem(storageKey) === "1";
    if (shouldAutoShowOnMount(options.appEmbedEnabled, hasBeenShown)) {
      setOpen(true);
      sessionStorage.setItem(storageKey, "1");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional mount-only trigger

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
