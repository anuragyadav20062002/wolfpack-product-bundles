/**
 * API Route to cleanup unstructured metafields and recreate with definitions
 *
 * Purpose: Fixes the issue where metafields were created BEFORE definitions,
 * resulting in "unstructured" metafields that lack storefront access.
 *
 * Usage:
 * GET /api/cleanup-metafields?productId=gid://shopify/Product/10305816199462
 *
 * Process:
 * 1. Ensure metafield definitions exist FIRST (with storefront access)
 * 2. Delete existing unstructured metafield values
 * 3. Return instructions to re-save bundle (which writes values to proper definitions)
 *
 * When to use:
 * - After deploying metafield definition changes
 * - When metafields show as "Unstructured" in Shopify Admin
 * - When Liquid templates can't access metafields on storefront
 * - Before re-saving a bundle configuration
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { AppLogger } from "../../lib/logger";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await requireAdminSession(request);

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
    // Metafield definitions are managed declaratively in shopify.app.toml
    // Delete existing unstructured metafields
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
        key: "bundleConfig"
      },
      {
        ownerId: productId,
        namespace: "$app",
        key: "bundleProductType"
      },
      {
        ownerId: productId,
        namespace: "$app",
        key: "ownsBundleId"
      },
      {
        ownerId: productId,
        namespace: "$app",
        key: "isolationCreated"
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
