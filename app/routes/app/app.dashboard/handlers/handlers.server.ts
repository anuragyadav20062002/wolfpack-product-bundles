/**
 * Dashboard Action Handlers
 *
 * Server-side handlers for dashboard actions (clone, delete, create bundles).
 * Extracted from the main route file for better organization.
 */

import { json } from "@remix-run/node";
import db from "../../../../db.server";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import { MetafieldCleanupService } from "../../../../services/metafield-cleanup.server";
import { WidgetInstallationService } from "../../../../services/widget-installation.server";
import { BundleStatus, BundleType, FullPageLayout } from "../../../../constants/bundle";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import { getBundleEditPath } from "../../../../lib/bundle-navigation";
import { ensureBundleParentProduct } from "../../../../services/bundles/bundle-parent-product.server";

const GET_PUBLICATIONS = `
  query {
    publications(first: 50) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const UPDATE_PRODUCT_STATUS = `
  mutation UpdateProductStatus($id: ID!) {
    productUpdate(input: {id: $id, status: DRAFT}) {
      product {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Discover all available sales channel publication IDs for a shop.
 * Returns publication IDs grouped by channel name.
 */
export async function discoverSalesChannels(admin: any): Promise<Array<{ id: string; name: string }>> {
  try {
    const publicationsResponse = await admin.graphql(GET_PUBLICATIONS);
    const publicationsData = await publicationsResponse.json();
    const edges = publicationsData.data?.publications?.edges || [];
    return edges.map((edge: any) => ({ id: edge.node.id, name: edge.node.name }));
  } catch (error) {
    AppLogger.error('Failed to discover sales channels', { component: 'app.dashboard' }, error);
    return [];
  }
}

/**
 * Handle cloning a bundle
 */
export async function handleCloneBundle(
  admin: ShopifyAdmin,
  session: { shop: string },
  formData: FormData
) {
  const bundleId = formData.get("bundleId") as string;

  try {
    const originalBundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: {
          include: {
            StepProduct: true
          }
        },
        pricing: true
      },
    });

    if (!originalBundle) {
      return json({ error: 'Bundle not found' }, { status: 404 });
    }

    const clonedBundleName = `${originalBundle.name} (Copy)`;

    // Clone the bundle
    const clonedBundle = await db.bundle.create({
      data: {
        name: clonedBundleName,
        description: originalBundle.description,
        shopId: session.shop,
        bundleType: originalBundle.bundleType,
        status: BundleStatus.DRAFT,
        shopifyProductId: null,
        templateName: originalBundle.templateName,
      },
    });
    await ensureBundleParentProduct({
      admin,
      shopDomain: session.shop,
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle: clonedBundle,
    });

    // Clone steps if they exist
    if (originalBundle.steps && originalBundle.steps.length > 0) {
      for (const step of originalBundle.steps) {
        const clonedStep = await db.bundleStep.create({
          data: {
            bundleId: clonedBundle.id,
            name: step.name,
            products: step.products || [],
            collections: step.collections || [],
            displayVariantsAsIndividual: step.displayVariantsAsIndividual,
            icon: step.icon,
            position: step.position,
            minQuantity: step.minQuantity,
            maxQuantity: step.maxQuantity,
            enabled: step.enabled,
            conditionType: step.conditionType,
            conditionOperator: step.conditionOperator,
            conditionValue: step.conditionValue,
            conditionOperator2: step.conditionOperator2,
            conditionValue2: step.conditionValue2,
          },
        });

        // Clone step products if they exist
        if (step.StepProduct && step.StepProduct.length > 0) {
          await db.stepProduct.createMany({
            data: step.StepProduct.map(stepProduct => ({
              stepId: clonedStep.id,
              productId: stepProduct.productId,
              title: stepProduct.title,
              variants: stepProduct.variants || [],
              imageUrl: stepProduct.imageUrl,
              minQuantity: stepProduct.minQuantity,
              maxQuantity: stepProduct.maxQuantity,
              position: stepProduct.position,
            })),
          });
        }
      }
    }

    // Clone pricing if it exists
    if (originalBundle.pricing) {
      await db.bundlePricing.create({
        data: {
          bundleId: clonedBundle.id,
          enabled: originalBundle.pricing.enabled,
          method: originalBundle.pricing.method,
          rules: originalBundle.pricing.rules || [],
          messages: originalBundle.pricing.messages || [],
          showFooter: originalBundle.pricing.showFooter,
        },
      });
    }

    return json({
      success: true,
      message: 'Bundle cloned successfully',
      bundleId: clonedBundle.id
    });

  } catch (error) {
    AppLogger.error("Failed to clone bundle", { component: "app.dashboard", operation: "clone-bundle" }, error);
    return json({ error: 'Failed to clone bundle' }, { status: 500 });
  }
}

/**
 * Handle deleting a bundle
 */
export async function handleDeleteBundle(
  admin: ShopifyAdmin,
  session: { shop: string },
  formData: FormData
) {
  const bundleId = formData.get("bundleId") as string;

  try {
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: {
          include: {
            StepProduct: true
          }
        }
      }
    });

    if (!bundle) {
      return json({ success: false, error: ERROR_MESSAGES.BUNDLE_NOT_FOUND }, { status: 404 });
    }

    // Clean up metafields and set product to draft
    if (bundle.shopifyProductId) {
      await MetafieldCleanupService.updateShopMetafieldsAfterDeletion(admin, bundleId);

      try {
        await admin.graphql(UPDATE_PRODUCT_STATUS, {
          variables: { id: bundle.shopifyProductId }
        });
      } catch (productError) {
        AppLogger.error("Error updating Shopify product status",
          { component: "app.dashboard", operation: "delete-bundle" },
          productError);
      }
    }

    // Delete the bundle from database (cascade will handle related records)
    await db.bundle.delete({
      where: { id: bundleId, shopId: session.shop },
    });

    AppLogger.info("Bundle deleted successfully",
      { component: "app.dashboard", operation: "delete-bundle", bundleId });

    return json({ success: true, message: "Bundle deleted successfully" });
  } catch (error) {
    AppLogger.error("Failed to delete bundle", { component: "app.dashboard", operation: "delete-bundle" }, error);
    return json({ success: false, error: "Failed to delete bundle" }, { status: 500 });
  }
}

/**
 * Handle creating a new bundle
 */
export async function handleCreateBundle(
  admin: ShopifyAdmin,
  session: { shop: string },
  formData: FormData
) {
  const bundleName = formData.get("bundleName");
  const bundleType = formData.get("bundleType");

  if (typeof bundleName !== 'string' || bundleName.length === 0) {
    return json({ error: 'Bundle name is required' }, { status: 400 });
  }
  if (bundleType !== BundleType.PRODUCT_PAGE && bundleType !== BundleType.FULL_PAGE) {
    return json({ error: 'Bundle type is required' }, { status: 400 });
  }

  try {
    const shopRecord = await db.shop.findUnique({
      where: { shopDomain: session.shop },
      select: { firstCreateTourEligible: true },
    });
    const showFirstLoadTour = shopRecord?.firstCreateTourEligible === true;

    // Check if this is the first bundle (for auto-placement)
    const existingBundleCount = await db.bundle.count({
      where: {
        shopId: session.shop,
        status: {
          in: [BundleStatus.ACTIVE, BundleStatus.DRAFT, BundleStatus.UNLISTED]
        }
      }
    });

    const isFirstBundle = existingBundleCount === 0;

    const newBundle = await db.bundle.create({
      data: {
        name: bundleName,
        shopId: session.shop,
        bundleType: bundleType as any,
        fullPageLayout: bundleType === BundleType.FULL_PAGE ? FullPageLayout.FOOTER_BOTTOM : null,
        bundleDesignTemplate: bundleType === BundleType.FULL_PAGE ? "FBP_SIDE_FOOTER" : null,
        bundleDesignPresetId: bundleType === BundleType.FULL_PAGE ? "STANDARD" : null,
        status: BundleStatus.DRAFT,
        shopifyProductId: null,
        shopifyProductHandle: null,
      },
    });
    const parent = await ensureBundleParentProduct({
      admin,
      shopDomain: session.shop,
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle: newBundle,
    });

    if (showFirstLoadTour) {
      await db.shop.update({
        where: { shopDomain: session.shop },
        data: { firstCreateTourEligible: false },
      });
    }

    // Check widget installation status for product bundles (production mode)
    let widgetCheckResult = null;
    if (isFirstBundle) {
      const apiKey = process.env.SHOPIFY_API_KEY || '';
      AppLogger.info('Checking widget installation for first bundle', {
        component: 'app.dashboard',
        operation: 'create-bundle',
        bundleId: newBundle.id
      });

      widgetCheckResult = await WidgetInstallationService.validateProductBundleWidgetSetup(
        admin,
        session.shop,
        apiKey,
        newBundle.id,
        parent.productId
      );

      AppLogger.info('Widget check result', {
        component: 'app.dashboard',
        operation: 'create-bundle',
        widgetInstalled: widgetCheckResult.widgetInstalled,
        requiresOneTimeSetup: widgetCheckResult.requiresOneTimeSetup,
        message: widgetCheckResult.message
      });
    }

    const redirectUrl = `${getBundleEditPath(newBundle.id, bundleType)}?mode=create`;

    return json({
      success: true,
      bundleId: newBundle.id,
      bundleProductId: parent.productId,
      redirectTo: redirectUrl,
      showFirstLoadTour,
      widgetStatus: widgetCheckResult ? {
        checked: true,
        widgetInstalled: widgetCheckResult.widgetInstalled,
        requiresOneTimeSetup: widgetCheckResult.requiresOneTimeSetup,
        message: widgetCheckResult.message,
        installationLink: widgetCheckResult.installationLink,
        productUrl: widgetCheckResult.productUrl
      } : {
        checked: false
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    AppLogger.error("Failed to create bundle", { component: "app.dashboard", operation: "create-bundle" }, error);
    return json({ error: `Failed to create bundle: ${errorMessage}` }, { status: 500 });
  }
}
