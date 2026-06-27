type WebVitalsMetric = {
  country?: string;
  id: string;
  name: string;
  value: number;
  [key: string]: unknown;
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
    getRecentLcpSamples: () => LcpSample[];
  };
};

type DiagnosticsOptions = {
  windowLike?: WindowWithWebVitals;
  logger?: (message: string, payload: Record<string, unknown>) => void;
};

type LcpSample = {
  blockingTime?: number | null;
  element: string | null;
  candidate?: string | null;
  candidateResource?: string | null;
  candidateType?: string;
  id: string;
  route: string;
  routeLoadId: string;
  country?: string;
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

function getRouteLoadId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getLcpCandidateType({
  element,
  url,
}: {
  element?: Element;
  url?: string;
}) {
  if (url) {
    return "resource";
  }
  if (!element) {
    return "text";
  }
  const tag = element.tagName.toLowerCase();
  if (tag === "img" || tag === "video") return "media";
  if (["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "strong", "em", "div"].includes(tag)) {
    return "text";
  }
  return "container";
}

function getLcpCandidateBlockingTime(entry: {
  startTime?: number;
  loadTime?: number;
  renderTime?: number;
}) {
  if (typeof entry.renderTime === "number" && typeof entry.startTime === "number") {
    return Math.max(0, entry.renderTime - entry.startTime);
  }
  if (typeof entry.loadTime === "number" && typeof entry.startTime === "number") {
    return Math.max(0, entry.loadTime - entry.startTime);
  }
  return null;
}

type LcpBrowserCandidateMetadata = {
  candidate: string | null;
  type: string;
  resource: string | null;
  blockingTime: number | null;
  renderTime?: number;
  loadTime?: number;
  size?: number;
};

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
    getRecentLcpSamples: () => readLcpSamples(windowLike).slice(-25),
    getLcpP75Summary: () => buildLcpP75Summary(readLcpSamples(windowLike)),
  };
}

function recordDebugLcpSample({
  element,
  candidateMetadata,
  country,
  logger,
  metric,
  routeLoadId,
  windowLike,
}: {
  element: string | null;
  candidateMetadata?: LcpBrowserCandidateMetadata;
  country?: string;
  logger: (message: string, payload: Record<string, unknown>) => void;
  metric: WebVitalsMetric;
  routeLoadId: string;
  windowLike: WindowWithWebVitals;
}) {
  const route = getRouteKey(windowLike);
  const samples = readLcpSamples(windowLike);
  const nextSamples = [...samples, {
    blockingTime: candidateMetadata?.blockingTime ?? null,
    element,
    country,
    candidate: candidateMetadata?.candidate ?? null,
    candidateResource: candidateMetadata?.resource ?? null,
    candidateType: candidateMetadata?.type ?? null,
    id: metric.id,
    route,
    routeLoadId,
    timestamp: Date.now(),
    value: metric.value,
  }];
  writeLcpSamples(windowLike, nextSamples);

  const routeSamples = nextSamples.filter((sample) => sample.route === route);
  const p75 = calculateP75(routeSamples.map((sample) => sample.value));
  logger("Admin Web Vitals p75", {
    p75,
    route,
    routeLoadId,
    sampleCount: routeSamples.length,
    country,
    candidate: candidateMetadata?.candidate ?? null,
    candidateType: candidateMetadata?.type ?? null,
    candidateResource: candidateMetadata?.resource ?? null,
    blockingTime: candidateMetadata?.blockingTime ?? null,
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
  let latestLcpMetadata: LcpBrowserCandidateMetadata = {
    candidate: null,
    type: "text",
    resource: null,
    blockingTime: null,
  };
  let observer: PerformanceObserver | null = null;
  const routeLoadId = getRouteLoadId();

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
        const candidate = describeLcpElement(latestEntry?.element);
        latestLcpElement = candidate;
        latestLcpMetadata = {
          candidate,
          type: getLcpCandidateType({ element: latestEntry?.element, url: latestEntry?.url as string | undefined }),
          resource: typeof latestEntry?.url === "string" ? latestEntry.url : null,
          blockingTime: getLcpCandidateBlockingTime(latestEntry),
          renderTime: latestEntry?.renderTime,
          loadTime: latestEntry?.loadTime,
          size: latestEntry?.size,
        };
        if (isDebugEnabled(windowLike)) {
          logger("Admin Browser LCP Candidate", {
            element: latestLcpMetadata.candidate,
            candidateType: latestLcpMetadata.type,
            candidateResource: latestLcpMetadata.resource,
            blockingTime: latestLcpMetadata.blockingTime,
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
        routeLoadId,
        candidate: latestLcpMetadata.candidate,
        candidateType: latestLcpMetadata.type,
        candidateResource: latestLcpMetadata.resource,
        blockingTime: latestLcpMetadata.blockingTime,
        element: latestLcpElement,
        id: metric.id,
        name: metric.name,
        value: metric.value,
      });
      recordDebugLcpSample({
        element: latestLcpElement,
        candidateMetadata: latestLcpMetadata,
        country: metric.country,
        logger,
        metric,
        routeLoadId,
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
