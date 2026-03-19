/**
 * POST /api/install-fpb-widget
 *
 * Programmatically installs the bundle-full-page app block into the active
 * Shopify theme by writing `templates/page.full-page-bundle.json`.
 *
 * This replaces the "open Theme Editor + click Save" step for full-page bundles.
 * The operation is idempotent — safe to call multiple times.
 *
 * Request body: { pageHandle: string }
 * Response:     { success, templateCreated, templateAlreadyExists } | { success: false, error }
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { ensureBundlePageTemplate } from "../../services/widget-installation/widget-theme-template.server";
import { AppLogger } from "../../lib/logger";

const COMPONENT = "InstallFpbWidget";

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
    const pageHandle = (body as any).pageHandle as string | undefined;

    AppLogger.info("[INSTALL] Installing FPB widget", { component: COMPONENT, pageHandle });

    const result = await ensureBundlePageTemplate(admin, session, apiKey);

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
