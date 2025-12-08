import type { LoaderFunctionArgs } from "@remix-run/node";
import { readFile } from "fs/promises";
import { join } from "path";
import { AppLogger } from "../lib/logger";

/**
 * Server-side hosting route for the full bundle widget JavaScript
 *
 * This route serves the complete bundle-widget.js file from the server,
 * allowing us to bypass Shopify's 10KB app block file size limit.
 *
 * Benefits:
 * 1. No file size restrictions
 * 2. Faster updates (no extension redeployment needed)
 * 3. Better caching control
 * 4. Dynamic loading only when needed
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Read the FULL bundle-widget.js file from app assets
    // This contains all the bundle widget functionality (toast, modal, product selection, etc.)
    const filePath = join(
      process.cwd(),
      "app",
      "assets",
      "bundle-widget-full.js"
    );

    const content = await readFile(filePath, "utf-8");

    // Return the JavaScript file with appropriate headers
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",

        // CORS headers - Allow loading from any Shopify store
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",

        // Cache headers - Aggressive caching for high-traffic scale
        // Cache for 1 hour, serve stale content during revalidation for 24 hours
        // This handles traffic spikes (sales, promotions) by serving cached versions
        // even when cache is expired, while fetching fresh content in background
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",

        // CDN cache header (for Shopify's CDN when using app proxy)
        "CDN-Cache-Control": "public, max-age=3600",

        // Static ETag for proper cache validation
        // Uses app version to invalidate cache on deployments
        // NOTE: Update this when deploying widget changes
        "ETag": `"bundle-widget-v1.0.1"`,

        // Additional performance headers
        "X-Content-Type-Options": "nosniff",
        "Timing-Allow-Origin": "*",
      },
    });
  } catch (error) {
    AppLogger.error("Error serving bundle widget", { component: "assets.bundle-widget-full", operation: "loader" }, error);

    // Return a fallback error response
    return new Response(
      `console.error('Failed to load bundle widget: ${error}');`,
      {
        status: 500,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};

// Handle OPTIONS preflight requests for CORS
export const options = () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
};
