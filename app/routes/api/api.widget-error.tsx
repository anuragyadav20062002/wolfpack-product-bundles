import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { AppLogger } from "../../lib/logger";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Receives widget error reports from the storefront and logs them server-side.
 * Called by the FPB/PDP bundle widget when an unhandled init error occurs.
 * No auth required — carries no sensitive data, just error telemetry.
 *
 * POST /apps/product-bundles/api/widget-error
 * Body: { message, bundleId, bundleType, shop, url }
 */
export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: CORS_HEADERS });
  }

  try {
    const body = await request.json() as {
      message?: string;
      bundleId?: string;
      bundleType?: string;
      shop?: string;
      url?: string;
    };

    AppLogger.error("Bundle widget init error (storefront)", {
      component: "bundle-widget",
      operation: "init",
      bundleId: body.bundleId,
      bundleType: body.bundleType,
      shop: body.shop,
      url: body.url,
    }, new Error(body.message ?? "Unknown widget error"));

    return json({ ok: true }, { headers: CORS_HEADERS });
  } catch {
    return json({ ok: true }, { headers: CORS_HEADERS });
  }
};
