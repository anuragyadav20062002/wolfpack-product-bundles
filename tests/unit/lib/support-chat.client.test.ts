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

  it("defers chat configuration until the browser is idle", () => {
    const configure = jest.fn();
    const idleCallbacks: Array<() => void> = [];
    const win: SupportChatWindow = {
      requestIdleCallback: jest.fn((callback: () => void) => {
        idleCallbacks.push(callback);
        return 7;
      }),
      cancelIdleCallback: jest.fn(),
    };

    installSupportChatLoader({ win, configure });

    expect(configure).not.toHaveBeenCalled();
    expect(win.__wpbLoadSupportChat).toEqual(expect.any(Function));

    idleCallbacks[0]?.();

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
