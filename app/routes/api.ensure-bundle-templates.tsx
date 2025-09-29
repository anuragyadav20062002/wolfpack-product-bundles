import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { ThemeTemplateService } from "../services/theme-template-service.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request);

    console.log("🎨 [TEMPLATE_API] Starting bundle template creation process");

    const templateService = new ThemeTemplateService(admin, session);

    // Get all active bundles with container products
    const activeBundles = await db.bundle.findMany({
      where: {
        shopId: session.shop,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        shopifyProductId: true
      }
    });

    console.log(`🎨 [TEMPLATE_API] Found ${activeBundles.length} active bundles`);

    if (activeBundles.length === 0) {
      return json({
        success: true,
        message: "No active bundles found - no templates to create",
        results: []
      });
    }

    // Get product handles from Shopify
    const productIds = activeBundles
      .filter(bundle => bundle.shopifyProductId)
      .map(bundle => bundle.shopifyProductId);

    if (productIds.length === 0) {
      return json({
        success: true,
        message: "No bundle container products found",
        results: []
      });
    }

    // Use the nodes query for reliable product fetching by GID
    const GET_BUNDLE_PRODUCTS = `
      query getBundleContainerProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            handle
            title
            legacyResourceId
          }
        }
      }
    `;

    const response = await admin.graphql(GET_BUNDLE_PRODUCTS, {
      variables: { ids: productIds }
    });
    const data = await response.json();
    const products = data.data?.nodes?.filter(node => node) || [];

    console.log(`🎨 [TEMPLATE_API] Found ${products.length} bundle container products`);

    // Create templates for each bundle container product
    const results = [];
    for (const product of products) {
      console.log(`🎨 [TEMPLATE_API] Processing product: ${product.title} (${product.handle})`);

      const result = await templateService.ensureProductTemplate(product.handle);
      results.push({
        productId: product.id,
        productHandle: product.handle,
        productTitle: product.title,
        templatePath: result.templatePath,
        created: result.created || false,
        success: result.success,
        error: result.error
      });

      console.log(`🎨 [TEMPLATE_API] Product ${product.handle}: ${result.success ? 'SUCCESS' : 'FAILED'} ${result.created ? '(CREATED)' : '(EXISTS)'}`);
    }

    const successCount = results.filter(r => r.success).length;
    const createdCount = results.filter(r => r.created).length;

    console.log(`🎨 [TEMPLATE_API] Template creation completed: ${successCount}/${results.length} successful, ${createdCount} created`);

    return json({
      success: true,
      message: `Template creation completed: ${successCount}/${results.length} successful, ${createdCount} new templates created`,
      results,
      summary: {
        totalProducts: products.length,
        successCount,
        createdCount,
        failedCount: results.length - successCount
      }
    });

  } catch (error) {
    console.error("🔥 [TEMPLATE_API] Error during template creation:", error);
    return json({
      success: false,
      error: (error as Error).message || "Template creation failed"
    }, { status: 500 });
  }
};