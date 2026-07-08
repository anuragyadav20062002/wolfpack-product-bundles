import {
  installSupportChatLoader,
  openSupportChat,
  type SupportChatWindow,
} from "../../../app/lib/support-chat.client";

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
    expect(win.$crisp).toEqual([["do", "chat:open"]]);
  });
});
