/**
 * Bundle Engagement Beacon API Route
 *
 * Receives the storefront engagement beacon from the FPB widget the first time
 * a shopper interacts with a bundle in a browser session. Writes a single
 * BundleEngagement row (or no-op if the (shopId, bundleId, sessionId) tuple
 * already exists, thanks to the unique constraint).
 *
 * Called via fetch() from `bundle-widget-full-page.js -> _sendEngagementBeacon`.
 * The endpoint sits behind the Shopify App Proxy at
 *   /apps/product-bundles/api/attribution/engagement
 * which strips the /apps/product-bundles prefix before forwarding here.
 *
 * Powers funnel metrics independent of OrderAttribution (which only fires on
 * checkout). Issue: docs/issues-prod/wpb-storefront-analytics-events-1.md.
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import db from "../../db.server";
import { verifyAppProxyRequest } from "../../lib/app-proxy.server";
import { AppLogger } from "../../lib/logger";
import { recordBusinessEvent } from "../../services/app-events.server";

type EngagementPayload = {
  shopId?: unknown;
  bundleId?: unknown;
  sessionId?: unknown;
  presetId?: unknown;
  bundleType?: unknown;
  eventName?: unknown;
  landingPage?: unknown;
  userAgent?: unknown;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin",
  "Access-Control-Max-Age": "86400",
};

function buildCorsHeaders(request: Request) {
  const origin = request.headers.get("origin");

  return {
    ...CORS_HEADERS,
    "Access-Control-Allow-Origin": origin ?? "*",
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeOptionalString(value: unknown) {
  return isNonEmptyString(value) ? value.trim() : null;
}

function sanitizeEventName(value: unknown): string | null {
  if (!isNonEmptyString(value)) return null;
  const trimmed = value.trim();
  if (!/^wpb:[a-zA-Z0-9._-]+$/.test(trimmed)) return null;
  return trimmed;
}

function getBusinessEventHandle(eventName: string) {
  if (eventName === "wpb:bundle-add-to-cart-success") {
    return "bundle_add_to_cart_succeeded";
  }
  return "bundle_engaged";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: buildCorsHeaders(request) });
  }
  return new Response(null, { status: 405 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: buildCorsHeaders(request) });
  }

  const url = new URL(request.url);
  const proxyShop = verifyAppProxyRequest(url);

  if (!proxyShop) {
    AppLogger.warn("Bundle engagement rejected unsigned storefront request", {
      component: "api.attribution.engagement",
      operation: "action",
      method: request.method,
    });
    return json(
      { error: "Invalid storefront request" },
      { status: 400, headers: buildCorsHeaders(request) }
    );
  }

  let eventContext: {
    shopDomain: string;
    bundleId: string | null;
    bundleType: string | null;
  } = {
    shopDomain: proxyShop,
    bundleId: null,
    bundleType: null,
  };

  try {
    const payload = (await request.json()) as EngagementPayload | null;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return json(
        { error: "Invalid payload" },
        { status: 400, headers: buildCorsHeaders(request) }
      );
    }

    const {
      shopId,
      bundleId,
      sessionId,
      presetId,
      bundleType,
      eventName,
      landingPage,
      userAgent,
    } = payload;

    const normalizedShopId = sanitizeOptionalString(shopId);
    const normalizedBundleId = sanitizeOptionalString(bundleId);
    const normalizedSessionId = sanitizeOptionalString(sessionId);
    const normalizedPresetId = sanitizeOptionalString(presetId);
    const normalizedBundleType = sanitizeOptionalString(bundleType);
    const normalizedLandingPage = sanitizeOptionalString(landingPage);
    const normalizedUserAgent = sanitizeOptionalString(userAgent);
    const normalizedEventName = sanitizeEventName(eventName);
    eventContext = {
      shopDomain: normalizedShopId ?? proxyShop,
      bundleId: normalizedBundleId,
      bundleType: normalizedBundleType,
    };

    if (
      !normalizedShopId ||
      !normalizedBundleId ||
      !normalizedSessionId ||
      !normalizedEventName
    ) {
      await recordBusinessEvent({
        eventHandle: "engagement_failed",
        shopDomain: proxyShop,
        bundleId: normalizedBundleId,
        bundleType: normalizedBundleType,
        surface: "storefront",
        actor: "buyer",
        result: "failure",
        errorCode: "invalid_payload",
        sendToShopify: false,
      });
      return json(
        { error: "Missing or invalid required field(s): shopId, bundleId, sessionId, eventName" },
        { status: 400, headers: buildCorsHeaders(request) },
      );
    }

    if (normalizedShopId !== proxyShop) {
      AppLogger.warn("Bundle engagement rejected cross-shop payload", {
        component: "api.attribution.engagement",
        operation: "action",
        proxyShop,
        payloadShopId: normalizedShopId,
      });
      return json(
        { error: "Shop mismatch" },
        { status: 403, headers: buildCorsHeaders(request) },
      );
    }

    // Idempotent write — unique constraint on (shopId, bundleId, sessionId) means
    // a duplicate beacon for the same session is silently ignored. We use createMany
    // with skipDuplicates so a retry never errors and never double-counts.
    await db.bundleEngagement.createMany({
      data: [
        {
          shopId: normalizedShopId,
          bundleId: normalizedBundleId,
          sessionId: normalizedSessionId,
          presetId: normalizedPresetId,
          bundleType: normalizedBundleType,
          eventName: normalizedEventName,
          landingPage: normalizedLandingPage,
          userAgent: normalizedUserAgent,
        },
      ],
      skipDuplicates: true,
    });

    AppLogger.info("[ENGAGEMENT] Bundle engagement recorded", {
      component: "api.attribution.engagement",
      shopId: normalizedShopId,
      bundleId: normalizedBundleId,
      sessionId: normalizedSessionId,
      presetId: normalizedPresetId,
      eventName: normalizedEventName,
    });

    await recordBusinessEvent({
      eventHandle: getBusinessEventHandle(normalizedEventName),
      shopDomain: normalizedShopId,
      bundleId: normalizedBundleId,
      bundleType: normalizedBundleType,
      surface: "storefront",
      actor: "buyer",
      result: "success",
      attributes: {
        event_name: normalizedEventName,
        preset_id: normalizedPresetId,
      },
      sendToShopify: false,
    });

    return json({ ok: true }, { headers: buildCorsHeaders(request) });
  } catch (error) {
    AppLogger.error("[ENGAGEMENT] Failed to record bundle engagement", {
      component: "api.attribution.engagement",
    }, error);
    await recordBusinessEvent({
      eventHandle: "engagement_failed",
      shopDomain: eventContext.shopDomain,
      bundleId: eventContext.bundleId,
      bundleType: eventContext.bundleType,
      surface: "storefront",
      actor: "buyer",
      result: "failure",
      errorCode: "persist_failed",
      sendToShopify: false,
    });
    return json(
      { error: "Failed to record engagement" },
      { status: 500, headers: buildCorsHeaders(request) }
    );
  }
};
