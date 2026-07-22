export interface SupportChatWindow {
  __wpbLoadSupportChat?: () => void;
  $crisp?: unknown[];
  matchMedia?: (query: string) => {
    matches: boolean;
    addEventListener: (name: "change", listener: (event: { matches: boolean }) => void) => void;
    removeEventListener: (name: "change", listener: (event: { matches: boolean }) => void) => void;
  };
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
  setTimeout?: typeof setTimeout;
  clearTimeout?: typeof clearTimeout;
}

const CRISP_FALLBACK_DELAY_MS = 8_000;
const NARROW_SUPPORT_CHAT_QUERY = "(max-width: 767px)";

function queueCrispCommand(win: SupportChatWindow, command: unknown[]) {
  win.$crisp = win.$crisp ?? [];
  win.$crisp.push(command);
}

export function installSupportChatPresentation({
  win,
}: {
  win: SupportChatWindow;
}) {
  const mediaQuery = win.matchMedia?.(NARROW_SUPPORT_CHAT_QUERY);
  if (!mediaQuery) return () => {};

  const syncVisibility = () => {
    queueCrispCommand(win, [
      "do",
      mediaQuery.matches ? "chat:hide" : "chat:show",
    ]);
  };
  const handleViewportChange = () => syncVisibility();
  const handleChatClosed = () => {
    if (mediaQuery.matches) {
      queueCrispCommand(win, ["do", "chat:hide"]);
    }
  };

  syncVisibility();
  mediaQuery.addEventListener("change", handleViewportChange);
  queueCrispCommand(win, ["on", "chat:closed", handleChatClosed]);

  return () => {
    mediaQuery.removeEventListener("change", handleViewportChange);
    queueCrispCommand(win, ["off", "chat:closed"]);
  };
}

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
  queueCrispCommand(win, ["do", "chat:show"]);
  queueCrispCommand(win, ["do", "chat:open"]);
}

declare global {
  interface Window {
    __wpbLoadSupportChat?: () => void;
    $crisp?: unknown[];
  }
}
