import {
  installSupportChatLoader,
  installSupportChatPresentation,
  openSupportChat,
  type SupportChatWindow,
} from "../../../app/lib/support-chat.client";

function createMediaQueryList(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: { matches: boolean }) => void>();

  return {
    get matches() {
      return matches;
    },
    addEventListener: jest.fn(
      (_name: "change", listener: (event: { matches: boolean }) => void) => {
        listeners.add(listener);
      },
    ),
    removeEventListener: jest.fn(
      (_name: "change", listener: (event: { matches: boolean }) => void) => {
        listeners.delete(listener);
      },
    ),
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      listeners.forEach((listener) => listener({ matches }));
    },
  };
}

describe("support chat client", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("defers automatic chat configuration until the fallback delay", () => {
    const configure = jest.fn();
    const idleCallback = jest.fn(() => 7);
    const win: SupportChatWindow = {
      requestIdleCallback: idleCallback,
      cancelIdleCallback: jest.fn(),
      setTimeout: jest.fn((callback: () => void, delay?: number) => {
        return setTimeout(callback, delay);
      }) as unknown as typeof setTimeout,
      clearTimeout: jest.fn((handle?: ReturnType<typeof setTimeout>) => {
        clearTimeout(handle);
      }) as typeof clearTimeout,
    };

    installSupportChatLoader({ win, configure, fallbackDelayMs: 5000 });

    expect(configure).not.toHaveBeenCalled();
    expect(win.__wpbLoadSupportChat).toEqual(expect.any(Function));
    expect(idleCallback).not.toHaveBeenCalled();
    expect(win.setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);

    jest.advanceTimersByTime(4999);
    expect(configure).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(configure).toHaveBeenCalledTimes(1);
  });

  it("loads chat immediately before queueing an explicit support open request", () => {
    const configure = jest.fn();
    const win: SupportChatWindow = {};

    installSupportChatLoader({ win, configure });

    expect(configure).not.toHaveBeenCalled();

    openSupportChat(win);

    expect(configure).toHaveBeenCalledTimes(1);
    expect(win.$crisp).toEqual([
      ["do", "chat:show"],
      ["do", "chat:open"],
    ]);
  });

  it("hides the floating launcher on narrow screens and after chat closes", () => {
    const mediaQuery = createMediaQueryList(true);
    const win: SupportChatWindow = {
      matchMedia: jest.fn(() => mediaQuery),
    };

    installSupportChatPresentation({ win });

    expect(win.$crisp?.[0]).toEqual(["do", "chat:hide"]);
    const closeRegistration = win.$crisp?.find(
      (entry: any) => entry[0] === "on" && entry[1] === "chat:closed",
    ) as [string, string, () => void];

    closeRegistration[2]();

    expect(win.$crisp?.at(-1)).toEqual(["do", "chat:hide"]);
  });

  it("keeps chat visible on desktop and follows viewport changes", () => {
    const mediaQuery = createMediaQueryList(false);
    const win: SupportChatWindow = {
      matchMedia: jest.fn(() => mediaQuery),
    };

    installSupportChatPresentation({ win });
    expect(win.$crisp?.[0]).toEqual(["do", "chat:show"]);

    mediaQuery.setMatches(true);
    expect(win.$crisp?.at(-1)).toEqual(["do", "chat:hide"]);

    mediaQuery.setMatches(false);
    expect(win.$crisp?.at(-1)).toEqual(["do", "chat:show"]);
  });

  it("removes responsive and Crisp listeners during cleanup", () => {
    const mediaQuery = createMediaQueryList(true);
    const win: SupportChatWindow = {
      matchMedia: jest.fn(() => mediaQuery),
    };

    const cleanup = installSupportChatPresentation({ win });
    cleanup();

    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(win.$crisp?.at(-1)).toEqual(["off", "chat:closed"]);
  });
});
