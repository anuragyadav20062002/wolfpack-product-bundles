/**
 * Web Vitals Beacon API
 *
 * Receives Core Web Vitals samples from the embedded admin via
 * `app/lib/web-vitals.client.ts`. Writes idempotent rows into the
 * `AdminWebVital` Prisma table powered by a (shopId, sessionId, route, metric)
 * unique constraint.
 *
 * Auth: runs inside the embedded Shopify admin so we use the same
 * `authenticate.admin(request)` guard that every admin route uses. App Bridge
 * attaches the session token automatically on fetch calls and `navigator.sendBeacon`
 * inherits cookies, so no extra Authorization header is needed in the happy path.
 *
 * Issue: docs/issues-prod/admin-lcp-measurement-1.md.
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import db from "../../db.server";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { AppLogger } from "../../lib/logger";

type WebVitalPayload = {
  sessionId?: unknown;
  route?: unknown;
  metric?: unknown;
  value?: unknown;
  rating?: unknown;
  navType?: unknown;
  deviceType?: unknown;
  appVersion?: unknown;
};

const ALLOWED_METRICS = new Set(["LCP", "INP", "CLS", "TTFB", "FCP"]);
const ALLOWED_RATINGS = new Set(["good", "needs-improvement", "poor"]);
const ALLOWED_NAV_TYPES = new Set([
  "navigate",
  "reload",
  "back-forward",
  "back-forward-cache",
  "prerender",
  "restore",
]);
const ALLOWED_DEVICE_TYPES = new Set(["desktop", "mobile"]);
const MAX_VALUE = 600_000; // 10 minutes — anything beyond is clearly bogus.

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function sanitizeOptionalString(v: unknown, maxLen = 256): string | null {
  if (!isNonEmptyString(v)) return null;
  return v.trim().slice(0, maxLen);
}

function sanitizeRoute(v: unknown): string | null {
  if (!isNonEmptyString(v)) return null;
  const trimmed = v.trim();
  // Routes must start with "/" and be reasonable in length.
  if (!trimmed.startsWith("/") || trimmed.length > 512) return null;
  // Strip query string and hash — we only want the pathname for aggregation.
  return trimmed.split("?")[0].split("#")[0];
}

function sanitizeFinite(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (v < 0 || v > MAX_VALUE) return null;
  return v;
}

export const loader = async (_args: LoaderFunctionArgs) => {
  return new Response(null, { status: 405 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let session;
  try {
    ({ session } = await requireAdminSession(request));
  } catch (error) {
    // requireAdminSession throws on missing/expired session — return 401.
    AppLogger.warn("Web vitals rejected unauthenticated request", {
      component: "api.web-vitals",
      operation: "action",
    });
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: WebVitalPayload | null;
  try {
    payload = (await request.json()) as WebVitalPayload | null;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json({ error: "Invalid payload" }, { status: 400 });
  }

  const sessionId = sanitizeOptionalString(payload.sessionId, 64);
  const route = sanitizeRoute(payload.route);
  const metric = sanitizeOptionalString(payload.metric, 16);
  const value = sanitizeFinite(payload.value);
  const rating = sanitizeOptionalString(payload.rating, 32);
  const navType = sanitizeOptionalString(payload.navType, 32);
  const deviceType = sanitizeOptionalString(payload.deviceType, 16);
  const appVersion = sanitizeOptionalString(payload.appVersion, 32);

  if (!sessionId || !route || !metric || value === null || !rating) {
    return json({ error: "Missing or invalid required field(s)" }, { status: 400 });
  }
  if (!ALLOWED_METRICS.has(metric)) {
    return json({ error: `Unknown metric: ${metric}` }, { status: 400 });
  }
  if (!ALLOWED_RATINGS.has(rating)) {
    return json({ error: `Unknown rating: ${rating}` }, { status: 400 });
  }
  if (navType !== null && !ALLOWED_NAV_TYPES.has(navType)) {
    return json({ error: `Unknown navType: ${navType}` }, { status: 400 });
  }
  if (deviceType !== null && !ALLOWED_DEVICE_TYPES.has(deviceType)) {
    return json({ error: `Unknown deviceType: ${deviceType}` }, { status: 400 });
  }

  try {
    await db.adminWebVital.createMany({
      data: [
        {
          shopId: session.shop,
          sessionId,
          route,
          metric,
          value,
          rating,
          navType,
          deviceType,
          appVersion,
        },
      ],
      skipDuplicates: true,
    });
    return json({ ok: true });
  } catch (error) {
    AppLogger.error("[WEB-VITALS] Failed to record web vital", {
      component: "api.web-vitals",
      shopId: session.shop,
      route,
      metric,
    }, error);
    return json({ error: "Failed to record web vital" }, { status: 500 });
  }
};
