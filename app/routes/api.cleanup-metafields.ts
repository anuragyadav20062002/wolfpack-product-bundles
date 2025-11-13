/**
 * API Route to cleanup unstructured metafields and recreate with definitions
 * GET /api/cleanup-metafields?productId=gid://shopify/Product/10305816199462
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { AppLogger } from "../lib/logger";
import { ensureStandardMetafieldDefinitions } from "../services/bundles/standard-metafields.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return json({ error: "productId parameter required" }, { status: 400 });
  }

  AppLogger.info('Starting metafield cleanup', {
    component: 'metafield-cleanup',
    operation: 'cleanup'
  }, { productId });

  try {
    // Step 1: Ensure metafield definitions exist FIRST
    AppLogger.info('Creating metafield definitions...', {
      component: 'metafield-cleanup',
      operation: 'create-definitions'
    });

    await ensureStandardMetafieldDefinitions(admin);

    // Step 2: Delete existing unstructured metafields
    AppLogger.info('Deleting unstructured metafields...', {
      component: 'metafield-cleanup',
      operation: 'delete-metafields'
    });

    const DELETE_METAFIELDS = `
      mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $metafields) {
          deletedMetafields {
            key
            namespace
            ownerId
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const metafieldsToDelete = [
      {
        ownerId: productId,
        namespace: "$app",
        key: "bundle_config"
      },
      {
        ownerId: productId,
        namespace: "$app:bundle_isolation",
        key: "bundle_product_type"
      },
      {
        ownerId: productId,
        namespace: "$app:bundle_isolation",
        key: "owns_bundle_id"
      },
      {
        ownerId: productId,
        namespace: "$app:bundle_isolation",
        key: "isolation_created"
      }
    ];

    const response = await admin.graphql(DELETE_METAFIELDS, {
      variables: { metafields: metafieldsToDelete }
    });

    const data = await response.json();

    if (data.data?.metafieldsDelete?.userErrors?.length > 0) {
      AppLogger.warn('Some metafields could not be deleted', {
        component: 'metafield-cleanup',
        operation: 'delete-metafields'
      }, data.data.metafieldsDelete.userErrors);
    }

    const deletedCount = data.data?.metafieldsDelete?.deletedMetafields?.length || 0;

    AppLogger.info('Metafield cleanup complete', {
      component: 'metafield-cleanup',
      operation: 'cleanup'
    }, { deletedCount });

    return json({
      success: true,
      message: `Cleanup complete. Deleted ${deletedCount} unstructured metafields. Metafield definitions are now in place.`,
      nextSteps: [
        "Go to Shopify Admin → Apps → Wolfpack: Product Bundles",
        "Open the bundle configuration",
        "Click 'Save' to write metafield VALUES to the now-properly-defined metafields",
        "Refresh the storefront product page to test"
      ],
      deletedMetafields: data.data?.metafieldsDelete?.deletedMetafields || []
    });

  } catch (error) {
    AppLogger.error('Error during metafield cleanup', {
      component: 'metafield-cleanup',
      operation: 'cleanup'
    }, error);

    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
