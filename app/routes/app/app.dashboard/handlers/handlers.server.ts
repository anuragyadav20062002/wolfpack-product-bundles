/**
 * Dashboard Action Handlers
 *
 * Server-side handlers for dashboard actions (clone, delete, create bundles).
 * Extracted from the main route file for better organization.
 */

import { json } from "@remix-run/node";
import db from "../../../../db.server";
import { AppLogger } from "../../../../lib/logger";
import { MetafieldCleanupService } from "../../../../services/metafield-cleanup.server";
import { SubscriptionGuard } from "../../../../services/subscription-guard.server";
import { WidgetInstallationService } from "../../../../services/widget-installation.server";
import { BundleStatus, BundleType, FullPageLayout } from "../../../../constants/bundle";
import { ERROR_MESSAGES } from "../../../../constants/errors";

// GraphQL Mutations
const CREATE_BUNDLE_PRODUCT = `
  mutation CreateBundleProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CREATE_BUNDLE_PRODUCT_WITH_MEDIA = `
  mutation CreateBundleProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
      product {
        id
        title
        handle
        status
        variants(first: 1) {
          edges {
            node {
              id
              title
              price
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_PUBLICATIONS = `
  query {
    publications(first: 10) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const PUBLISH_PRODUCT = `
  mutation publishToOnlineStore($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        availablePublicationsCount {
          count
        }
      }
      userErrors {
        field
        message
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
 * Publish a product to Online Store sales channel
 */
async function publishToOnlineStore(admin: any, shopifyProductId: string, operation: string) {
  try {
    const publicationsResponse = await admin.graphql(GET_PUBLICATIONS);
    const publicationsData = await publicationsResponse.json();

    const onlineStorePublication = publicationsData.data?.publications?.edges?.find(
      (edge: any) => edge.node.name === 'Online Store'
    );

    if (onlineStorePublication) {
      const publishResponse = await admin.graphql(PUBLISH_PRODUCT, {
        variables: {
          id: shopifyProductId,
          input: [{ publicationId: onlineStorePublication.node.id }]
        }
      });

      const publishData = await publishResponse.json();

      if (publishData.data?.publishablePublish?.userErrors?.length > 0) {
        AppLogger.warn('Product publish had errors', {
          component: 'app.dashboard',
          operation,
          errors: publishData.data.publishablePublish.userErrors
        });
      } else {
        AppLogger.info('Product published to Online Store', {
          component: 'app.dashboard',
          operation,
          productId: shopifyProductId
        });
      }
    }
  } catch (publishError) {
    AppLogger.error('Failed to publish product to Online Store', {
      component: 'app.dashboard',
      operation
    }, publishError);
    // Continue even if publishing fails
  }
}

/**
 * Handle cloning a bundle
 */
export async function handleCloneBundle(
  admin: any,
  session: { shop: string },
  formData: FormData
) {
  const limitCheck = await SubscriptionGuard.enforceBundleLimit(session.shop);
  if (limitCheck) {
    return limitCheck;
  }

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

    let shopifyProductId = null;
    const clonedBundleName = `${originalBundle.name} (Copy)`;

    // Only create Shopify product for product_page bundles
    if (originalBundle.bundleType === BundleType.PRODUCT_PAGE) {
      const productResponse = await admin.graphql(CREATE_BUNDLE_PRODUCT, {
        variables: {
          input: {
            title: clonedBundleName,
            descriptionHtml: originalBundle.description || `${clonedBundleName} - Bundle Product`,
            productType: "Bundle",
            vendor: "Wolfpack: Product Bundles",
            status: "DRAFT",
            tags: ["bundle", "Wolfpack: Product Bundles"],
            variants: [
              {
                price: "0.00",
                inventoryPolicy: "DENY",
                inventoryManagement: null,
                requiresShipping: true,
                taxable: true,
                weight: 0,
                weightUnit: "POUNDS"
              }
            ]
          }
        }
      });

      const productData = await productResponse.json();

      if (productData.data?.productCreate?.userErrors?.length > 0) {
        AppLogger.error("Product creation failed", { component: "app.dashboard", operation: "clone-bundle" }, { errors: productData.data.productCreate.userErrors });
        return json({ error: 'Failed to create bundle product in Shopify' }, { status: 500 });
      }

      shopifyProductId = productData.data?.productCreate?.product?.id;

      // Publish to Online Store
      await publishToOnlineStore(admin, shopifyProductId, 'clone-bundle');
    }

    // Clone the bundle
    const clonedBundle = await db.bundle.create({
      data: {
        name: clonedBundleName,
        description: originalBundle.description,
        shopId: session.shop,
        bundleType: originalBundle.bundleType,
        status: BundleStatus.DRAFT,
        shopifyProductId: shopifyProductId,
        templateName: originalBundle.templateName,
      },
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
  admin: any,
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
  admin: any,
  session: { shop: string },
  formData: FormData
) {
  const limitCheck = await SubscriptionGuard.enforceBundleLimit(session.shop);
  if (limitCheck) {
    return limitCheck;
  }

  const bundleName = formData.get("bundleName");
  const description = formData.get("description");
  const bundleType = (formData.get("bundleType") as string) || BundleType.PRODUCT_PAGE;
  const fullPageLayout = (formData.get("fullPageLayout") as string) || null;

  if (typeof bundleName !== 'string' || bundleName.length === 0) {
    return json({ error: 'Bundle name is required' }, { status: 400 });
  }

  try {
    const productInput: any = {
      title: bundleName,
      descriptionHtml: description || `<h2>${bundleName}</h2><p>${description || 'Complete bundle package with curated products.'}</p><p>Build your perfect bundle by selecting from our hand-picked collection of products.</p>`,
      productType: "Bundle",
      vendor: "Wolfpack: Product Bundles",
      status: "DRAFT",
      tags: ["bundle", "cart-transform"],
    };

    const appUrl = process.env.SHOPIFY_APP_URL;
    const mediaInput = appUrl ? [
      {
        originalSource: `${appUrl}/bundle.png`,
        alt: `${bundleName} - Bundle`,
        mediaContentType: "IMAGE"
      }
    ] : undefined;

    const productResponse = await admin.graphql(CREATE_BUNDLE_PRODUCT_WITH_MEDIA, {
      variables: {
        product: productInput,
        ...(mediaInput && { media: mediaInput })
      }
    });

    const productData = await productResponse.json();

    if (productData.data?.productCreate?.userErrors?.length > 0) {
      const errors = productData.data.productCreate.userErrors;
      const errorMessages = errors.map((e: any) => e.message).join(', ');
      AppLogger.error("Product creation failed", { component: "app.dashboard", operation: "create-bundle" }, { errors });
      return json({ error: `Shopify API error: ${errorMessages}` }, { status: 500 });
    }

    const shopifyProductId = productData.data?.productCreate?.product?.id;

    if (!shopifyProductId) {
      AppLogger.error("No product ID returned from Shopify", { component: "app.dashboard", operation: "create-bundle" });
      return json({ error: 'Failed to get product ID from Shopify' }, { status: 500 });
    }

    // Publish to Online Store
    await publishToOnlineStore(admin, shopifyProductId, 'create-bundle');

    // Check if this is the first bundle (for auto-placement)
    const existingBundleCount = await db.bundle.count({
      where: {
        shopId: session.shop,
        status: {
          in: [BundleStatus.ACTIVE, BundleStatus.DRAFT]
        }
      }
    });

    const isFirstBundle = existingBundleCount === 0;

    const newBundle = await db.bundle.create({
      data: {
        name: bundleName,
        description: typeof description === 'string' ? description : `${bundleName} - Bundle Product`,
        shopId: session.shop,
        bundleType: bundleType as any,
        fullPageLayout: bundleType === BundleType.FULL_PAGE ? (fullPageLayout as any || FullPageLayout.FOOTER_BOTTOM) : null,
        status: BundleStatus.DRAFT,
        shopifyProductId: shopifyProductId,
      },
    });

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
        shopifyProductId
      );

      AppLogger.info('Widget check result', {
        component: 'app.dashboard',
        operation: 'create-bundle',
        widgetInstalled: widgetCheckResult.widgetInstalled,
        requiresOneTimeSetup: widgetCheckResult.requiresOneTimeSetup,
        message: widgetCheckResult.message
      });
    }

    // Build redirect URL based on bundle type
    const routeBase = bundleType === BundleType.FULL_PAGE ? 'full-page-bundle' : 'product-page-bundle';
    const redirectUrl = `/app/bundles/${routeBase}/configure/${newBundle.id}`;

    return json({
      success: true,
      bundleId: newBundle.id,
      bundleProductId: shopifyProductId,
      redirectTo: redirectUrl,
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
