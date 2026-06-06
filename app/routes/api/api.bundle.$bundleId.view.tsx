import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import type { Params } from "@remix-run/react";
import db from "../../db.server";
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
 * Records a bundle view event from the storefront widget.
 * Called on widget first-render (once per page load).
 * No auth required — widget fires this via the Shopify App Proxy.
 *
 * POST /apps/product-bundles/api/bundle/:bundleId/view
 * Body: { shop: string }
 */
export const action: ActionFunction = async ({ request, params }: { request: Request; params: Params }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: CORS_HEADERS });
  }

  const { bundleId } = params;
  if (!bundleId) {
    return json({ error: "Missing bundleId" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const body = await request.json() as { shop?: string };
    const shopId = body.shop;

    if (!shopId) {
      return json({ error: "Missing shop" }, { status: 400, headers: CORS_HEADERS });
    }

    // Verify the bundle exists and belongs to this shop before recording
    const bundle = await db.bundle.findFirst({
      where: { id: bundleId, shopId },
      select: { id: true },
    });

    if (!bundle) {
      // Return 200 anyway to avoid exposing bundle existence to storefront
      return json({ ok: true }, { headers: CORS_HEADERS });
    }

    await db.bundleAnalytics.create({
      data: {
        bundleId,
        shopId,
        event: "view",
      },
    });

    return json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err) {
    AppLogger.error("Failed to record bundle view", {
      component: "api.bundle.view",
      operation: "record-view",
      bundleId,
    }, err);
    // Always return 200 — view tracking must never break the storefront
    return json({ ok: true }, { headers: CORS_HEADERS });
  }
};
