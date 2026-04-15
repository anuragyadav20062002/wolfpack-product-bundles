/**
 * POST /api/install-fpb-widget
 *
 * Previously wrote templates/page.full-page-bundle.json to the active theme.
 * Now a no-op — the app embed block handles all rendering on the default page
 * template. Kept as a stable endpoint so the UI doesn't need changes.
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { AppLogger } from "../../lib/logger";

const COMPONENT = "InstallFpbWidget";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    await requireAdminSession(request);

    AppLogger.info("[INSTALL] FPB widget install (no-op — app embed handles rendering)", { component: COMPONENT });

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
