import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { AppLogger } from "../../lib/logger";
import { activateUtmPixel } from "../../services/pixel-activation.server";

/**
 * GET /api/activate-pixel
 *
 * Re-activates the Wolfpack UTM web pixel for an already-installed store.
 * Useful when the pixel extension has been (re)deployed and the store didn't
 * go through the afterAuth flow (no reinstall).
 *
 * REQUIRES: shopify app deploy must have been run first so the extension
 * exists on Shopify's servers.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await requireAdminSession(request);
  const appUrl = process.env.SHOPIFY_APP_URL;

  if (!appUrl) {
    return json({ success: false, error: "SHOPIFY_APP_URL env var not set" }, { status: 500 });
  }

  try {
    const result = await activateUtmPixel(admin, appUrl);
    return json({ ...result, shopDomain: session.shop });
  } catch (error: unknown) {
    AppLogger.error("[PIXEL] Activation route failed", {
      component: "api.activate-pixel",
      operation: "loader",
    }, error instanceof Error ? error : new Error(String(error)));
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      shopDomain: session.shop,
    });
  }
}
