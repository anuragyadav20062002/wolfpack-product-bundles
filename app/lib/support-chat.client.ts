export interface SupportChatWindow {
  __wpbLoadSupportChat?: () => void;
  $crisp?: unknown[];
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
  setTimeout?: typeof setTimeout;
  clearTimeout?: typeof clearTimeout;
}

const CRISP_FALLBACK_DELAY_MS = 8_000;

export function installSupportChatLoader({
  win,
  configure,
  fallbackDelayMs = CRISP_FALLBACK_DELAY_MS,
}: {
  win: SupportChatWindow;
  configure: () => void;
  fallbackDelayMs?: number;
}) {
  let configured = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const loadSupportChat = () => {
    if (configured) return;
    configured = true;
    if (timeoutHandle !== null) {
      const clearTimer = win.clearTimeout ?? clearTimeout;
      clearTimer(timeoutHandle);
      timeoutHandle = null;
    }
    configure();
  };

  win.__wpbLoadSupportChat = loadSupportChat;

  const setTimer = win.setTimeout ?? setTimeout;
  timeoutHandle = setTimer(loadSupportChat, fallbackDelayMs);

  return () => {
    if (timeoutHandle !== null) {
      const clearTimer = win.clearTimeout ?? clearTimeout;
      clearTimer(timeoutHandle);
    }
    if (win.__wpbLoadSupportChat === loadSupportChat) {
      delete win.__wpbLoadSupportChat;
    }
  };
}

export function openSupportChat(
  win: SupportChatWindow | undefined =
    typeof window === "undefined" ? undefined : window,
) {
  if (!win) return;
  win.__wpbLoadSupportChat?.();
  win.$crisp = win.$crisp ?? [];
  win.$crisp.push(["do", "chat:open"]);
}

declare global {
  interface Window {
    __wpbLoadSupportChat?: () => void;
    $crisp?: unknown[];
  }
}
