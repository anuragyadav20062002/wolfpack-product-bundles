/**
 * Web Vitals reporter — captures Core Web Vitals from the embedded Shopify
 * admin and beacons them to `/api/web-vitals` for durable storage in the
 * `AdminWebVital` table.
 *
 * Mounted from `app/root.tsx` inside a `useEffect` so it only runs in the
 * browser (Remix SSR pass skips it).
 *
 * Issue: docs/issues-prod/admin-lcp-measurement-1.md.
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals/attribution";

const STORAGE_KEY = "wpb_admin_session_id";
const ENDPOINT = "/api/web-vitals";

/** Generates / restores the per-browser-session UUID. */
function ensureSessionId(): string {
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `wpb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return `wpb-${Date.now()}`;
  }
}

function inferDeviceType(): "desktop" | "mobile" {
  if (typeof navigator === "undefined") return "desktop";
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop";
}

function inferNavType(metric: Metric): string | null {
  const nav = (metric as { navigationType?: string }).navigationType;
  return typeof nav === "string" ? nav : null;
}

function send(metric: Metric, sessionId: string, appVersion: string | undefined) {
  try {
    const body = JSON.stringify({
      sessionId,
      route: window.location.pathname,
      metric: metric.name,
      value: typeof metric.value === "number" ? metric.value : 0,
      rating: metric.rating,
      navType: inferNavType(metric),
      deviceType: inferDeviceType(),
      appVersion: appVersion ?? null,
    });

    // Prefer sendBeacon — survives page-unload, which matters because LCP can
    // finalise just as the user navigates away.
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* silent — reporter must never break the page */
    });
  } catch {
    /* silent */
  }
}

/**
 * Wires up all Web Vitals callbacks for the current document. Idempotent —
 * subsequent calls are no-ops so React StrictMode double-invocation is safe.
 */
let installed = false;
export function reportWebVitals(options: { appVersion?: string } = {}) {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  const sessionId = ensureSessionId();
  const appVersion = options.appVersion;
  const fire = (metric: Metric) => send(metric, sessionId, appVersion);

  onLCP(fire, { reportAllChanges: false });
  onINP(fire, { reportAllChanges: false });
  onCLS(fire, { reportAllChanges: false });
  onTTFB(fire);
  onFCP(fire);
}

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return ensureSessionId();
}
