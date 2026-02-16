import type { LoaderFunctionArgs } from "@remix-run/node";
import { readFile } from "fs/promises";
import { join } from "path";
import { AppLogger } from "../../lib/logger";

/**
 * Server-side hosting route for the full-page bundle widget
 *
 * This route serves the full-page specific widget (horizontal tabs layout).
 * It imports and uses shared components from bundle-widget-components.js.
 *
 * Benefits:
 * 1. No file size restrictions
 * 2. Faster updates without redeploying extension
 * 3. Better caching control
 * 4. ES6 module support
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Read the full-page widget file
    const filePath = join(
      process.cwd(),
      "app",
      "assets",
      "bundle-widget-full-page.js"
    );

    const content = await readFile(filePath, "utf-8");

    // Detect environment for appropriate caching strategy
    const isDevelopment = process.env.NODE_ENV === "development";

    // Return the JavaScript file with appropriate headers
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",

        // CORS headers - Allow loading from any Shopify store
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",

        // Cache headers - Environment-aware caching strategy
        "Cache-Control": isDevelopment
          ? "no-cache, no-store, must-revalidate"
          : "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",

        // Static ETag for proper cache validation
        "ETag": isDevelopment
          ? `"bundle-full-page-dev-${Date.now()}"`
          : `"bundle-full-page-v1.0.0"`,

        // Additional performance headers
        "X-Content-Type-Options": "nosniff",
        "Timing-Allow-Origin": "*",
      },
    });
  } catch (error) {
    AppLogger.error("Error serving full-page bundle widget", { component: "assets.bundle-widget-full-page", operation: "loader" }, error);

    // Return a fallback error response
    return new Response(
      `console.error('Failed to load full-page bundle widget: ${error}');`,
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
