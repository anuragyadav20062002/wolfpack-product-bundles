/**
 * POST /api/install-pdp-widget
 *
 * Previously wrote templates/product.product-page-bundle.json to the active theme
 * and set templateSuffix on the PDP product. Now a no-op — the app embed block
 * handles all rendering on the default product template. Kept as a stable endpoint
 * so the UI doesn't need changes.
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { AppLogger } from "../../lib/logger";

const COMPONENT = "InstallPdpWidget";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    await requireAdminSession(request);

    AppLogger.info("[INSTALL] PDP widget install (no-op — app embed handles rendering)", { component: COMPONENT });

    return json({
      success: true,
      templateCreated: false,
      templateAlreadyExists: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    AppLogger.error("[INSTALL] Unexpected error", { component: COMPONENT, error: message });
    return json({ success: false, error: message }, { status: 500 });
  }
};
