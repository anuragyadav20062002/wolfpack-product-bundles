import {
  calculateP75,
  describeLcpElement,
  installAdminWebVitalsDiagnostics,
} from "../../../app/lib/admin-web-vitals-diagnostics.client";

describe("admin web vitals diagnostics", () => {
  it("calculates p75 using nearest-rank percentile", () => {
    expect(calculateP75([])).toBeNull();
    expect(calculateP75([3000, 1000, 2600, 1800])).toBe(2600);
    expect(calculateP75([1200])).toBe(1200);
  });

  it("registers and unregisters Shopify App Bridge Web Vitals reports", () => {
    const onReport = jest.fn();
    const win = {
      shopify: {
        webVitals: { onReport },
      },
      localStorage: {
        getItem: jest.fn(() => null),
      },
    };

    const cleanup = installAdminWebVitalsDiagnostics({ windowLike: win as any });

    expect(onReport).toHaveBeenCalledWith(expect.any(Function));
    cleanup();
    expect(onReport).toHaveBeenCalledWith(null);
  });

  it("pairs Shopify LCP reports with the latest browser LCP element in debug mode", () => {
    let observerCallback: PerformanceObserverCallback | null = null;
    const observe = jest.fn();
    const disconnect = jest.fn();
    const onReport = jest.fn();
    const logger = jest.fn();
    const element = {
      tagName: "IMG",
      id: "support-avatar",
      getAttribute: jest.fn((name: string) => name === "src" ? "/Parth.jpeg" : null),
      classList: { length: 0 },
    };
    function MockPerformanceObserver(callback: PerformanceObserverCallback) {
      observerCallback = callback;
      return { observe, disconnect };
    }
    const win = {
      PerformanceObserver: MockPerformanceObserver,
      shopify: {
        webVitals: { onReport },
      },
      localStorage: {
        getItem: jest.fn(() => "1"),
      },
    };

    const cleanup = installAdminWebVitalsDiagnostics({
      windowLike: win as any,
      logger,
    });
    observerCallback?.({
      getEntries: () => [{ element }],
    } as PerformanceObserverEntryList, {} as PerformanceObserver);
    const callback = onReport.mock.calls[0][0];
    callback({ metrics: [{ name: "LCP", id: "lcp-1", value: 1234 }] });

    expect(logger).toHaveBeenCalledWith("Admin Web Vitals", {
      country: undefined,
      element: "img#support-avatar[src=\"/Parth.jpeg\"]",
      id: "lcp-1",
      name: "LCP",
      value: 1234,
    });
    cleanup();
    expect(disconnect).toHaveBeenCalled();
  });

  it("stores route-keyed LCP samples and logs p75 summaries in debug mode", () => {
    let observerCallback: PerformanceObserverCallback | null = null;
    const observe = jest.fn();
    const onReport = jest.fn();
    const logger = jest.fn();
    const storage = new Map<string, string>();
    const element = {
      tagName: "H1",
      id: "",
      getAttribute: jest.fn(() => null),
      classList: { length: 0 },
    };
    function MockPerformanceObserver(callback: PerformanceObserverCallback) {
      observerCallback = callback;
      return { observe, disconnect: jest.fn() };
    }
    const win = {
      PerformanceObserver: MockPerformanceObserver,
      location: {
        href: "https://app.test/app/dashboard?embedded=1&wpbWebVitalsDebug=1",
        pathname: "/app/dashboard",
        search: "?embedded=1&wpbWebVitalsDebug=1",
      },
      shopify: {
        webVitals: { onReport },
      },
      localStorage: {
        getItem: jest.fn((key: string) => storage.get(key) ?? null),
        setItem: jest.fn((key: string, value: string) => storage.set(key, value)),
        removeItem: jest.fn((key: string) => storage.delete(key)),
      },
    };

    installAdminWebVitalsDiagnostics({
      windowLike: win as any,
      logger,
    });
    observerCallback?.({
      getEntries: () => [{ element }],
    } as PerformanceObserverEntryList, {} as PerformanceObserver);
    const callback = onReport.mock.calls[0][0];
    callback({ metrics: [{ name: "LCP", id: "lcp-1", value: 2100 }] });
    callback({ metrics: [{ name: "LCP", id: "lcp-2", value: 2700 }] });

    expect(win.localStorage.setItem).toHaveBeenCalled();
    expect(logger).toHaveBeenCalledWith("Admin Web Vitals p75", {
      p75: 2100,
      route: "/app/dashboard",
      sampleCount: 1,
      targetPass: true,
      threshold: 2500,
    });
    expect(logger).toHaveBeenCalledWith("Admin Web Vitals p75", {
      p75: 2700,
      route: "/app/dashboard",
      sampleCount: 2,
      targetPass: false,
      threshold: 2500,
    });
    expect((win as any).__wpbAdminWebVitals.getLcpP75Summary()).toEqual({
      "/app/dashboard": {
        p75: 2700,
        sampleCount: 2,
        targetPass: false,
        threshold: 2500,
      },
    });
  });

  it("does not store p75 samples when debug mode is disabled", () => {
    const onReport = jest.fn();
    const setItem = jest.fn();
    const win = {
      location: { pathname: "/app/dashboard", search: "" },
      shopify: {
        webVitals: { onReport },
      },
      localStorage: {
        getItem: jest.fn(() => null),
        setItem,
      },
    };

    installAdminWebVitalsDiagnostics({ windowLike: win as any });
    const callback = onReport.mock.calls[0][0];
    callback({ metrics: [{ name: "LCP", id: "lcp-1", value: 2100 }] });

    expect(setItem).not.toHaveBeenCalled();
  });

  it("logs browser LCP candidates from the iframe when debug is enabled by URL", () => {
    let observerCallback: PerformanceObserverCallback | null = null;
    const observe = jest.fn();
    const logger = jest.fn();
    const element = {
      tagName: "IMG",
      id: "",
      classList: { length: 0 },
      getAttribute: jest.fn((name: string) => name === "src" ? "/Parth.avif" : null),
    };
    function MockPerformanceObserver(callback: PerformanceObserverCallback) {
      observerCallback = callback;
      return { observe, disconnect: jest.fn() };
    }
    const win = {
      PerformanceObserver: MockPerformanceObserver,
      location: { search: "?shop=agent.myshopify.com&wpbWebVitalsDebug=1" },
      localStorage: {
        getItem: jest.fn(() => null),
      },
    };

    installAdminWebVitalsDiagnostics({
      windowLike: win as any,
      logger,
    });
    observerCallback?.({
      getEntries: () => [{
        element,
        entryType: "largest-contentful-paint",
        renderTime: 1120,
        loadTime: 1090,
        size: 14400,
      }],
    } as PerformanceObserverEntryList, {} as PerformanceObserver);

    expect(observe).toHaveBeenCalledWith({ type: "largest-contentful-paint", buffered: true });
    expect(logger).toHaveBeenCalledWith("Admin Browser LCP Candidate", {
      element: "img[src=\"/Parth.avif\"]",
      loadTime: 1090,
      renderTime: 1120,
      size: 14400,
    });
  });

  it("describes an LCP element with stable tag, id, class, and src details", () => {
    const element = {
      tagName: "IMG",
      id: "hero",
      classList: ["avatar", "loaded"],
      getAttribute: jest.fn((name: string) => name === "src" ? "/hero.avif" : null),
    };

    expect(describeLcpElement(element as any)).toBe("img#hero.avatar.loaded[src=\"/hero.avif\"]");
  });
});
