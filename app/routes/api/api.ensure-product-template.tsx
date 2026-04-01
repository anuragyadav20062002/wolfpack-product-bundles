import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { AppLogger } from "../../lib/logger";

/**
 * API endpoint for theme editor integration
 * Note: Shopify restricts programmatic theme file creation, so this returns
 * instructions for merchants to add the Bundle Builder block via Theme Customizer
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await requireAdminSession(request);

    const body = await request.json();
    const { productHandle, bundleId } = body;

    AppLogger.info('Theme editor request for product template', { operation: 'ensure-template' }, { productHandle, bundleId });

    if (!productHandle) {
      return json({
        success: false,
        error: "Product handle is required"
      }, { status: 400 });
    }

    // Shopify restricts programmatic theme file creation
    // Return success with instructions for manual setup via Theme Customizer
    AppLogger.info('Shopify restricts theme file creation - returning Theme Customizer instructions', { operation: 'ensure-template' });

    return json({
      success: true,
      created: false,
      templatePath: "theme-app-extension",
      message: `Bundle functionality available via theme app extension. Add the Bundle Builder block to your product template through the theme editor.`,
      bundleId,
      themeExtensionRequired: true,
      restrictionMessage: "Shopify restricts direct theme file creation. Use Theme Customizer to add the Bundle Builder block to your product template."
    });

  } catch (error) {
    AppLogger.error('Unexpected error in ensure template', { operation: 'ensure-template' }, error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Request failed"
    }, { status: 500 });
  }
};
