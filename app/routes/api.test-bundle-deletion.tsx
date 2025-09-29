// API endpoint to test bundle deletion and metafield cleanup functionality
// This endpoint provides comprehensive testing and verification of the cleanup process

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { MetafieldCleanupService } from "../services/metafield-cleanup.server";
import { MetafieldValidationService } from "../services/metafield-validation.server";
import db from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const action = formData.get("action") as string;

    console.log(`🧪 [TEST_DELETION] Starting test action: ${action}`);

    switch (action) {
      case "audit_metafields": {
        console.log(`📊 [TEST_DELETION] Running metafield consistency audit`);

        const audit = await MetafieldValidationService.auditMetafieldConsistency(admin, session.shop);

        return json({
          success: true,
          action: "audit_metafields",
          data: audit,
          message: "Metafield audit completed successfully"
        });
      }

      case "validate_shop_metafields": {
        console.log(`🔍 [TEST_DELETION] Validating shop metafields`);

        const updated = await MetafieldValidationService.validateAndCleanShopMetafields(admin, session.shop);

        return json({
          success: true,
          action: "validate_shop_metafields",
          data: { updated },
          message: updated ? "Shop metafields updated" : "Shop metafields are already valid"
        });
      }

      case "bulk_validate_products": {
        console.log(`🔍 [TEST_DELETION] Bulk validating product metafields`);

        const result = await MetafieldValidationService.bulkValidateAllProductMetafields(admin, session.shop);

        return json({
          success: true,
          action: "bulk_validate_products",
          data: result,
          message: `Validated ${result.validatedCount} products, cleaned up ${result.cleanedCount} products`
        });
      }

      case "test_cleanup_service": {
        const bundleId = formData.get("bundleId") as string;
        const productId = formData.get("productId") as string;

        if (!bundleId || !productId) {
          return json({
            success: false,
            error: "bundleId and productId are required for cleanup service test"
          }, { status: 400 });
        }

        console.log(`🧪 [TEST_DELETION] Testing cleanup service for bundle ${bundleId}, product ${productId}`);

        await MetafieldCleanupService.cleanupBundleMetafields(admin, bundleId, productId);

        return json({
          success: true,
          action: "test_cleanup_service",
          data: { bundleId, productId },
          message: "Cleanup service test completed"
        });
      }

      case "verify_metafield_deletion": {
        const productId = formData.get("productId") as string;
        const namespace = formData.get("namespace") as string;
        const key = formData.get("key") as string;

        if (!productId || !namespace || !key) {
          return json({
            success: false,
            error: "productId, namespace, and key are required for verification"
          }, { status: 400 });
        }

        console.log(`🔍 [TEST_DELETION] Verifying metafield deletion: ${namespace}:${key} on product ${productId}`);

        const isDeleted = await MetafieldCleanupService.verifyCleanup(admin, productId, namespace, key);

        return json({
          success: true,
          action: "verify_metafield_deletion",
          data: { productId, namespace, key, isDeleted },
          message: isDeleted ? "Metafield successfully deleted" : "Metafield still exists"
        });
      }

      case "emergency_cleanup": {
        const confirm = formData.get("confirm") as string;

        if (confirm !== "YES_DELETE_ALL") {
          return json({
            success: false,
            error: "Emergency cleanup requires explicit confirmation: confirm=YES_DELETE_ALL"
          }, { status: 400 });
        }

        console.log(`🚨 [TEST_DELETION] EMERGENCY CLEANUP - Removing all bundle metafields`);

        await MetafieldCleanupService.emergencyCleanupAllBundleMetafields(admin);

        return json({
          success: true,
          action: "emergency_cleanup",
          data: {},
          message: "Emergency cleanup completed - all bundle metafields removed"
        });
      }

      case "get_bundle_metafields": {
        const productId = formData.get("productId") as string;

        if (!productId) {
          return json({
            success: false,
            error: "productId is required"
          }, { status: 400 });
        }

        const productGid = productId.startsWith('gid://')
          ? productId
          : `gid://shopify/Product/${productId}`;

        console.log(`🔍 [TEST_DELETION] Getting bundle metafields for product ${productGid}`);

        const response = await admin.graphql(`
          query GetProductBundleMetafields($id: ID!) {
            product(id: $id) {
              id
              title
              cartTransformConfig: metafield(namespace: "bundle_discounts", key: "cart_transform_config") {
                id
                value
              }
              discountFunctionConfig: metafield(namespace: "bundle_discounts", key: "discount_function_config") {
                id
                value
              }
              componentReference: metafield(namespace: "custom", key: "component_reference") {
                id
                value
              }
              componentQuantities: metafield(namespace: "custom", key: "component_quantities") {
                id
                value
              }
              componentParents: metafield(namespace: "custom", key: "component_parents") {
                id
                value
              }
              priceAdjustment: metafield(namespace: "custom", key: "price_adjustment") {
                id
                value
              }
              bundleDiscountData: metafield(namespace: "$app:bundle_discount", key: "bundle_discount_data") {
                id
                value
              }
            }
          }
        `, {
          variables: { id: productGid }
        });

        const data = await response.json();

        return json({
          success: true,
          action: "get_bundle_metafields",
          data: data.data?.product || null,
          message: "Bundle metafields retrieved successfully"
        });
      }

      case "get_shop_bundles_metafield": {
        console.log(`🔍 [TEST_DELETION] Getting shop bundles metafield`);

        const shopResponse = await admin.graphql(`
          query GetShopBundlesMetafield {
            shop {
              id
              allBundles: metafield(namespace: "$app", key: "all_bundles") {
                id
                value
              }
            }
          }
        `);

        const shopData = await shopResponse.json();

        const metafieldValue = shopData.data?.shop?.allBundles?.value;
        const parsedBundles = metafieldValue ? JSON.parse(metafieldValue) : [];

        return json({
          success: true,
          action: "get_shop_bundles_metafield",
          data: {
            shop: shopData.data?.shop,
            bundlesCount: parsedBundles.length,
            bundles: parsedBundles.map((b: any) => ({ id: b.id, name: b.name, status: b.status }))
          },
          message: `Found ${parsedBundles.length} bundles in shop metafield`
        });
      }

      case "compare_db_vs_metafields": {
        console.log(`📊 [TEST_DELETION] Comparing database vs metafields`);

        // Get database bundles
        const dbBundles = await db.bundle.findMany({
          where: { shopId: session.shop },
          select: { id: true, name: true, status: true }
        });

        // Get metafield bundles
        const shopResponse = await admin.graphql(`
          query GetShopBundlesMetafield {
            shop {
              allBundles: metafield(namespace: "$app", key: "all_bundles") {
                value
              }
            }
          }
        `);

        const shopData = await shopResponse.json();
        const metafieldValue = shopData.data?.shop?.allBundles?.value;
        const metafieldBundles = metafieldValue ? JSON.parse(metafieldValue) : [];

        // Compare
        const dbBundleIds = new Set(dbBundles.map(b => b.id));
        const metafieldBundleIds = new Set(metafieldBundles.map((b: any) => b.id));

        const onlyInDb = dbBundles.filter(b => !metafieldBundleIds.has(b.id));
        const onlyInMetafields = metafieldBundles.filter((b: any) => !dbBundleIds.has(b.id));
        const inBoth = dbBundles.filter(b => metafieldBundleIds.has(b.id));

        return json({
          success: true,
          action: "compare_db_vs_metafields",
          data: {
            database: {
              total: dbBundles.length,
              active: dbBundles.filter(b => b.status === 'active').length,
              bundles: dbBundles
            },
            metafields: {
              total: metafieldBundles.length,
              bundles: metafieldBundles.map((b: any) => ({ id: b.id, name: b.name, status: b.status }))
            },
            comparison: {
              onlyInDatabase: onlyInDb,
              onlyInMetafields: onlyInMetafields,
              inBoth: inBoth.length
            }
          },
          message: `Database: ${dbBundles.length}, Metafields: ${metafieldBundles.length}, Orphaned: ${onlyInMetafields.length}`
        });
      }

      default:
        return json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [TEST_DELETION] Error in test endpoint:', error);
    return json({
      success: false,
      error: `Test failed: ${(error as Error).message}`
    }, { status: 500 });
  }
}

export async function loader() {
  return json({
    message: "Bundle Deletion Test API",
    availableActions: [
      "audit_metafields",
      "validate_shop_metafields",
      "bulk_validate_products",
      "test_cleanup_service",
      "verify_metafield_deletion",
      "emergency_cleanup",
      "get_bundle_metafields",
      "get_shop_bundles_metafield",
      "compare_db_vs_metafields"
    ],
    usage: {
      method: "POST",
      body: "FormData with action and required parameters"
    }
  });
}