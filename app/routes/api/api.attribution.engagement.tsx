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
import { AppLogger } from "../../lib/logger";

// CORS headers required for cross-origin fetch() calls from the storefront.
// The beacon may be called from the bundle page hosted under the shop's domain,
// while this endpoint lives on the app server. Keep parity with api.attribution.tsx.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  return new Response(null, { status: 405 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: CORS_HEADERS });
  }

  try {
    const payload = await request.json() as Record<string, any>;

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

    if (!shopId || !bundleId || !sessionId || !eventName) {
      return json(
        { error: "Missing required field(s): shopId, bundleId, sessionId, eventName" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Idempotent write — unique constraint on (shopId, bundleId, sessionId) means
    // a duplicate beacon for the same session is silently ignored. We use createMany
    // with skipDuplicates so a retry never errors and never double-counts.
    await db.bundleEngagement.createMany({
      data: [
        {
          shopId: String(shopId),
          bundleId: String(bundleId),
          sessionId: String(sessionId),
          presetId: presetId ? String(presetId) : null,
          bundleType: bundleType ? String(bundleType) : null,
          eventName: String(eventName),
          landingPage: landingPage ? String(landingPage) : null,
          userAgent: userAgent ? String(userAgent) : null,
        },
      ],
      skipDuplicates: true,
    });

    AppLogger.info("[ENGAGEMENT] Bundle engagement recorded", {
      component: "api.attribution.engagement",
      shopId,
      bundleId,
      sessionId,
      presetId,
      eventName,
    });

    return json({ ok: true }, { headers: CORS_HEADERS });
  } catch (error) {
    AppLogger.error("[ENGAGEMENT] Failed to record bundle engagement", {
      component: "api.attribution.engagement",
    }, error);
    return json({ error: "Failed to record engagement" }, { status: 500, headers: CORS_HEADERS });
  }
};
