import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Public proxy health check endpoint.
 * Called server-side from the dashboard loader via:
 *   GET https://{shop}/apps/product-bundles/api/proxy-health
 *
 * If Shopify forwards the request here → proxy is registered and healthy.
 * If Shopify returns 404 directly → proxy is not registered for this store.
 *
 * No auth required — this endpoint carries no sensitive data.
 */
export const loader: LoaderFunction = async () => {
  return json(
    { ok: true },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "no-store",
      },
    }
  );
};
