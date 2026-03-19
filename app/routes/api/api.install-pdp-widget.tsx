/**
 * POST /api/install-pdp-widget
 *
 * Programmatically installs the bundle-product-page app block into the active
 * Shopify theme by writing `templates/product.product-page-bundle.json`.
 *
 * This gives merchants a one-click "Add to Storefront" flow from the configure
 * page without needing to open the Theme Editor manually.
 * The operation is idempotent — safe to call multiple times.
 *
 * Request body: { productHandle?: string, bundleId?: string }
 * Response:     { success, templateCreated, templateAlreadyExists } | { success: false, error }
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { ensureProductBundleTemplate } from "../../services/widget-installation/widget-theme-template.server";
import { AppLogger } from "../../lib/logger";

const COMPONENT = "InstallPdpWidget";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { admin, session } = await requireAdminSession(request);

    const apiKey = process.env.SHOPIFY_API_KEY;
    if (!apiKey) {
      AppLogger.error("[INSTALL] SHOPIFY_API_KEY env var not set", { component: COMPONENT });
      return json({ success: false, error: "App configuration error: missing API key" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { productHandle, bundleId } = body as { productHandle?: string; bundleId?: string };

    AppLogger.info("[INSTALL] Installing PDP widget template", { component: COMPONENT, productHandle, bundleId });

    const result = await ensureProductBundleTemplate(admin, session, apiKey);

    if (!result.success) {
      AppLogger.error("[INSTALL] Template install failed", { component: COMPONENT, error: result.error });
      return json({ success: false, error: result.error ?? "Template install failed" }, { status: 500 });
    }

    AppLogger.info("[INSTALL] Template install succeeded", {
      component: COMPONENT,
      templateCreated: result.templateCreated,
      templateAlreadyExists: result.templateAlreadyExists,
    });

    return json({
      success: true,
      templateCreated: result.templateCreated,
      templateAlreadyExists: result.templateAlreadyExists,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    AppLogger.error("[INSTALL] Unexpected error", { component: COMPONENT, error: message });
    return json({ success: false, error: message }, { status: 500 });
  }
};
