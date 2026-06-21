type WebVitalsMetric = {
  country?: string;
  id: string;
  name: string;
  value: number;
};

type WebVitalsReport = {
  metrics?: WebVitalsMetric[];
};

type ShopifyWebVitals = {
  onReport: (callback: ((report: WebVitalsReport) => void) | null) => Promise<void> | void;
};

type WindowWithWebVitals = Omit<Window, "shopify"> & {
  PerformanceObserver?: typeof PerformanceObserver;
  shopify?: {
    webVitals?: ShopifyWebVitals;
  };
  __wpbAdminWebVitals?: {
    clearLcpSamples: () => void;
    getLcpP75Summary: () => Record<string, LcpP75Summary>;
  };
};

type DiagnosticsOptions = {
  windowLike?: WindowWithWebVitals;
  logger?: (message: string, payload: Record<string, unknown>) => void;
};

type LcpSample = {
  element: string | null;
  id: string;
  route: string;
  timestamp: number;
  value: number;
};

type LcpP75Summary = {
  p75: number | null;
  sampleCount: number;
  targetPass: boolean;
  threshold: number;
};

const LCP_TARGET_MS = 2500;
const LCP_SAMPLE_STORAGE_KEY = "wpb:web-vitals-debug:lcp-samples";
const MAX_DEBUG_LCP_SAMPLES = 500;

function isDebugEnabled(windowLike: Pick<Window, "localStorage" | "location">): boolean {
  try {
    if (new URLSearchParams(windowLike.location.search).get("wpbWebVitalsDebug") === "1") {
      return true;
    }
  } catch {
    // Fall back to localStorage below.
  }

  try {
    return windowLike.localStorage.getItem("wpb:web-vitals-debug") === "1";
  } catch {
    return false;
  }
}

export function describeLcpElement(element: Element | null | undefined): string | null {
  if (!element) return null;

  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const classes = Array.from(element.classList ?? [])
    .slice(0, 3)
    .map((className) => `.${className}`)
    .join("");
  const src = element.getAttribute("src") ?? element.getAttribute("poster");

  return `${tag}${id}${classes}${src ? `[src="${src}"]` : ""}`;
}

export function calculateP75(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(0.75 * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function getRouteKey(windowLike: Pick<Window, "location">): string {
  try {
    return windowLike.location.pathname || "/";
  } catch {
    return "/";
  }
}

function readLcpSamples(windowLike: Pick<Window, "localStorage">): LcpSample[] {
  try {
    const raw = windowLike.localStorage.getItem(LCP_SAMPLE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((sample): sample is LcpSample => (
      sample
      && typeof sample.id === "string"
      && typeof sample.route === "string"
      && typeof sample.timestamp === "number"
      && typeof sample.value === "number"
    ));
  } catch {
    return [];
  }
}

function writeLcpSamples(windowLike: Pick<Window, "localStorage">, samples: LcpSample[]) {
  try {
    windowLike.localStorage.setItem(
      LCP_SAMPLE_STORAGE_KEY,
      JSON.stringify(samples.slice(-MAX_DEBUG_LCP_SAMPLES)),
    );
  } catch {
    // Diagnostic-only storage must never affect app behavior.
  }
}

function buildLcpP75Summary(samples: LcpSample[]): Record<string, LcpP75Summary> {
  const valuesByRoute = new Map<string, number[]>();
  for (const sample of samples) {
    valuesByRoute.set(sample.route, [...(valuesByRoute.get(sample.route) ?? []), sample.value]);
  }

  return Object.fromEntries(
    Array.from(valuesByRoute.entries()).map(([route, values]) => {
      const p75 = calculateP75(values);
      return [route, {
        p75,
        sampleCount: values.length,
        targetPass: p75 !== null && p75 <= LCP_TARGET_MS,
        threshold: LCP_TARGET_MS,
      }];
    }),
  );
}

function installDebugConsoleApi(windowLike: WindowWithWebVitals) {
  windowLike.__wpbAdminWebVitals = {
    clearLcpSamples: () => {
      try {
        windowLike.localStorage.removeItem(LCP_SAMPLE_STORAGE_KEY);
      } catch {
        // Diagnostic-only storage must never affect app behavior.
      }
    },
    getLcpP75Summary: () => buildLcpP75Summary(readLcpSamples(windowLike)),
  };
}

function recordDebugLcpSample({
  element,
  logger,
  metric,
  windowLike,
}: {
  element: string | null;
  logger: (message: string, payload: Record<string, unknown>) => void;
  metric: WebVitalsMetric;
  windowLike: WindowWithWebVitals;
}) {
  const route = getRouteKey(windowLike);
  const samples = readLcpSamples(windowLike);
  const nextSamples = [...samples, {
    element,
    id: metric.id,
    route,
    timestamp: Date.now(),
    value: metric.value,
  }];
  writeLcpSamples(windowLike, nextSamples);

  const routeSamples = nextSamples.filter((sample) => sample.route === route);
  const p75 = calculateP75(routeSamples.map((sample) => sample.value));
  logger("Admin Web Vitals p75", {
    p75,
    route,
    sampleCount: routeSamples.length,
    targetPass: p75 !== null && p75 <= LCP_TARGET_MS,
    threshold: LCP_TARGET_MS,
  });
}

export function installAdminWebVitalsDiagnostics({
  windowLike = typeof window === "undefined"
    ? undefined
    : (window as unknown as WindowWithWebVitals),
  logger = console.info,
}: DiagnosticsOptions = {}): () => void {
  const webVitals = windowLike?.shopify?.webVitals;
  if (!windowLike) return () => {};
  if (isDebugEnabled(windowLike)) {
    installDebugConsoleApi(windowLike);
  }

  let latestLcpElement: string | null = null;
  let observer: PerformanceObserver | null = null;

  const PerformanceObserverCtor = windowLike.PerformanceObserver;
  if (typeof PerformanceObserverCtor === "function") {
    try {
      observer = new PerformanceObserverCtor(
        (list: PerformanceObserverEntryList) => {
        const entries = list.getEntries();
        const latestEntry = entries[entries.length - 1] as PerformanceEntry & {
          element?: Element;
          loadTime?: number;
          renderTime?: number;
          size?: number;
        };
        latestLcpElement = describeLcpElement(latestEntry?.element);
        if (isDebugEnabled(windowLike)) {
          logger("Admin Browser LCP Candidate", {
            element: latestLcpElement,
            loadTime: latestEntry?.loadTime,
            renderTime: latestEntry?.renderTime,
            size: latestEntry?.size,
          });
        }
        },
      );
      observer?.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      observer = null;
    }
  }

  const callback = (report: WebVitalsReport) => {
    if (!isDebugEnabled(windowLike)) return;

    for (const metric of report.metrics ?? []) {
      if (metric.name !== "LCP") continue;
      logger("Admin Web Vitals", {
        country: metric.country,
        element: latestLcpElement,
        id: metric.id,
        name: metric.name,
        value: metric.value,
      });
      recordDebugLcpSample({
        element: latestLcpElement,
        logger,
        metric,
        windowLike,
      });
    }
  };

  if (webVitals?.onReport) {
    void webVitals.onReport(callback);
  }

  return () => {
    observer?.disconnect();
    if (webVitals?.onReport) {
      void webVitals.onReport(null);
    }
  };
}
