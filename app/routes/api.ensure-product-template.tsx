import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { ThemeTemplateService } from "../services/theme-template-service.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request);

    const body = await request.json();
    const { productHandle, bundleId } = body;

    console.log(`🎨 [ENSURE_TEMPLATE] Creating template for product: ${productHandle}, bundle: ${bundleId}`);

    if (!productHandle) {
      return json({
        success: false,
        error: "Product handle is required"
      }, { status: 400 });
    }

    const templateService = new ThemeTemplateService(admin, session);
    const result = await templateService.ensureProductTemplate(productHandle);

    if (result.success) {
      console.log(`✅ [ENSURE_TEMPLATE] Template operation successful: ${result.created ? 'CREATED' : 'EXISTS'}`);

      // Handle theme modification restriction gracefully
      if (result.error?.includes('THEME_MODIFICATION_RESTRICTED')) {
        return json({
          success: true,
          created: false,
          templatePath: result.templatePath,
          message: `Bundle functionality available via theme app extension. Add the Bundle Builder block to your product template through the theme editor.`,
          bundleId,
          themeExtensionRequired: true,
          restrictionMessage: result.error
        });
      }

      return json({
        success: true,
        created: result.created,
        templatePath: result.templatePath,
        message: result.created
          ? `Created new template for ${productHandle}`
          : `Template already exists for ${productHandle}`,
        bundleId
      });
    } else {
      console.error(`❌ [ENSURE_TEMPLATE] Template operation failed: ${result.error}`);

      return json({
        success: false,
        error: result.error || "Failed to create template"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("🔥 [ENSURE_TEMPLATE] Unexpected error:", error);
    return json({
      success: false,
      error: (error as Error).message || "Template creation failed"
    }, { status: 500 });
  }
};