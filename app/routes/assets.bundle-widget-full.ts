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

        // Cache headers - Cache for 1 hour (3600 seconds)
        // This means the browser will cache the file for 1 hour before requesting it again
        // Benefits:
        // - Reduces server load
        // - Faster page loads for returning visitors
        // - Lower bandwidth usage
        "Cache-Control": "public, max-age=3600, s-maxage=3600",

        // CDN cache header (for services like Cloudflare)
        // Tells CDNs to cache for 1 hour as well
        "CDN-Cache-Control": "public, max-age=3600",

        // ETag for cache validation - force reload with timestamp
        // Allows browser to check if file has changed without downloading it
        "ETag": `"bundle-widget-${Date.now()}"`,

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
