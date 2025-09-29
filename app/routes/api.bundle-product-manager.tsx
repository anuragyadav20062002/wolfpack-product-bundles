// Enhanced Bundle Product Manager API
// Handles proper bundle product creation, publishing, and isolation

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BundleProductManagerService } from "../services/bundle-product-manager.server";
import { BundleIsolationService } from "../services/bundle-isolation.server";
import db from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const action = formData.get("action") as string;

    console.log(`📦 [BUNDLE_PRODUCT_API] Processing action: ${action}`);

    switch (action) {
      case "create_bundle_product": {
        const bundleId = formData.get("bundleId") as string;

        if (!bundleId) {
          return json({
            success: false,
            error: "bundleId is required"
          }, { status: 400 });
        }

        console.log(`📦 [CREATE_BUNDLE_PRODUCT] Creating bundle product for bundle: ${bundleId}`);

        // Get bundle from database
        const bundle = await db.bundle.findUnique({
          where: { id: bundleId, shopId: session.shop },
          include: {
            steps: {
              include: {
                StepProduct: true
              }
            },
            pricing: true
          }
        });

        if (!bundle) {
          return json({
            success: false,
            error: "Bundle not found"
          }, { status: 404 });
        }

        // Check if bundle already has a product
        if (bundle.shopifyProductId) {
          return json({
            success: false,
            error: "Bundle already has a bundle product"
          }, { status: 400 });
        }

        // Collect component products
        const componentProducts = bundle.steps.flatMap(step =>
          step.StepProduct?.map(sp => ({
            id: sp.productId,
            title: sp.title,
            minQuantity: sp.minQuantity,
            maxQuantity: sp.maxQuantity
          })) || []
        );

        if (componentProducts.length === 0) {
          return json({
            success: false,
            error: "Bundle must have at least one component product"
          }, { status: 400 });
        }

        // Create and publish bundle product
        const bundleProduct = await BundleProductManagerService.createAndPublishBundleProduct(
          admin,
          bundle,
          componentProducts
        );

        if (!bundleProduct) {
          return json({
            success: false,
            error: "Failed to create bundle product"
          }, { status: 500 });
        }

        // Update bundle in database with product ID
        await db.bundle.update({
          where: { id: bundleId },
          data: { shopifyProductId: bundleProduct.id }
        });

        // Set up isolation metafields
        await BundleIsolationService.createBundleProductIsolationMetafields(
          admin,
          bundleProduct.id,
          bundleId
        );

        // Update shop metafields with isolation
        await BundleIsolationService.updateShopBundlesWithIsolation(admin, session.shop);

        console.log(`✅ [CREATE_BUNDLE_PRODUCT] Bundle product created successfully: ${bundleProduct.id}`);

        return json({
          success: true,
          bundleProduct: {
            id: bundleProduct.id,
            title: bundleProduct.title,
            handle: bundleProduct.handle,
            status: bundleProduct.status
          },
          message: "Bundle product created and published successfully"
        });
      }

      case "update_bundle_product": {
        const bundleId = formData.get("bundleId") as string;

        if (!bundleId) {
          return json({
            success: false,
            error: "bundleId is required"
          }, { status: 400 });
        }

        console.log(`🔄 [UPDATE_BUNDLE_PRODUCT] Updating bundle product for bundle: ${bundleId}`);

        // Get bundle from database
        const bundle = await db.bundle.findUnique({
          where: { id: bundleId, shopId: session.shop },
          include: {
            steps: {
              include: {
                StepProduct: true
              }
            },
            pricing: true
          }
        });

        if (!bundle) {
          return json({
            success: false,
            error: "Bundle not found"
          }, { status: 404 });
        }

        if (!bundle.shopifyProductId) {
          return json({
            success: false,
            error: "Bundle does not have a bundle product to update"
          }, { status: 400 });
        }

        // Collect component products
        const componentProducts = bundle.steps.flatMap(step =>
          step.StepProduct?.map(sp => ({
            id: sp.productId,
            title: sp.title,
            minQuantity: sp.minQuantity,
            maxQuantity: sp.maxQuantity
          })) || []
        );

        // Update bundle product configuration
        const success = await BundleProductManagerService.updateBundleProductConfiguration(
          admin,
          bundle.shopifyProductId,
          bundle,
          componentProducts
        );

        if (!success) {
          return json({
            success: false,
            error: "Failed to update bundle product"
          }, { status: 500 });
        }

        // Update shop metafields with isolation
        await BundleIsolationService.updateShopBundlesWithIsolation(admin, session.shop);

        console.log(`✅ [UPDATE_BUNDLE_PRODUCT] Bundle product updated successfully`);

        return json({
          success: true,
          message: "Bundle product updated successfully"
        });
      }

      case "get_bundle_for_product": {
        const productId = formData.get("productId") as string;

        if (!productId) {
          return json({
            success: false,
            error: "productId is required"
          }, { status: 400 });
        }

        console.log(`🔍 [GET_BUNDLE_FOR_PRODUCT] Getting bundle for product: ${productId}`);

        const bundle = await BundleIsolationService.getBundleForProduct(
          admin,
          productId,
          session.shop
        );

        return json({
          success: true,
          bundle: bundle,
          message: bundle ? "Bundle found for product" : "No bundle found for product"
        });
      }

      case "audit_bundle_isolation": {
        console.log(`📊 [AUDIT_ISOLATION] Running bundle isolation audit`);

        const audit = await BundleIsolationService.auditBundleIsolation(admin, session.shop);

        return json({
          success: true,
          audit: audit,
          message: "Bundle isolation audit completed"
        });
      }

      case "fix_bundle_product_publishing": {
        const bundleId = formData.get("bundleId") as string;

        if (!bundleId) {
          return json({
            success: false,
            error: "bundleId is required"
          }, { status: 400 });
        }

        console.log(`🔧 [FIX_PUBLISHING] Fixing bundle product publishing for bundle: ${bundleId}`);

        // Get bundle from database
        const bundle = await db.bundle.findUnique({
          where: { id: bundleId, shopId: session.shop }
        });

        if (!bundle || !bundle.shopifyProductId) {
          return json({
            success: false,
            error: "Bundle or bundle product not found"
          }, { status: 404 });
        }

        // Get online store publication ID and publish
        const PUBLICATIONS_QUERY = `
          query GetPublications {
            publications(first: 10) {
              edges {
                node {
                  id
                  name
                  app {
                    id
                  }
                }
              }
            }
          }
        `;

        const pubResponse = await admin.graphql(PUBLICATIONS_QUERY);
        const pubData = await pubResponse.json();

        const onlineStorePublication = pubData.data?.publications?.edges?.find(
          (edge: any) => edge.node.app === null
        );

        if (!onlineStorePublication) {
          return json({
            success: false,
            error: "Online store publication not found"
          }, { status: 500 });
        }

        // Publish to online store
        const PUBLISH_MUTATION = `
          mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
            publishablePublish(id: $id, input: $input) {
              publishable {
                availablePublicationCount
                publicationCount
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const publishResponse = await admin.graphql(PUBLISH_MUTATION, {
          variables: {
            id: bundle.shopifyProductId,
            input: [{
              publicationId: onlineStorePublication.node.id,
              publishDate: new Date().toISOString()
            }]
          }
        });

        const publishData = await publishResponse.json();

        if (publishData.data?.publishablePublish?.userErrors?.length > 0) {
          return json({
            success: false,
            error: `Publishing failed: ${publishData.data.publishablePublish.userErrors[0].message}`
          }, { status: 500 });
        }

        console.log(`✅ [FIX_PUBLISHING] Bundle product published to online store successfully`);

        return json({
          success: true,
          message: "Bundle product published to online store successfully"
        });
      }

      case "validate_bundle_isolation": {
        const productId = formData.get("productId") as string;
        const bundleId = formData.get("bundleId") as string;

        if (!productId || !bundleId) {
          return json({
            success: false,
            error: "productId and bundleId are required"
          }, { status: 400 });
        }

        console.log(`🔍 [VALIDATE_ISOLATION] Validating bundle ${bundleId} for product ${productId}`);

        // Get bundle from shop metafield
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

        if (!metafieldValue) {
          return json({
            success: false,
            error: "No shop bundles metafield found"
          }, { status: 404 });
        }

        const allBundles = JSON.parse(metafieldValue);
        const bundle = allBundles.find((b: any) => b.id === bundleId);

        if (!bundle) {
          return json({
            success: false,
            error: "Bundle not found in shop metafield"
          }, { status: 404 });
        }

        const isValid = BundleIsolationService.validateBundleForProduct(bundle, productId);

        return json({
          success: true,
          isValid: isValid,
          bundle: {
            id: bundle.id,
            name: bundle.name,
            shopifyProductId: bundle.shopifyProductId,
            isolation: bundle.isolation
          },
          message: isValid ? "Bundle is valid for product" : "Bundle should not show on this product"
        });
      }

      default:
        return json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [BUNDLE_PRODUCT_API] Error:', error);
    return json({
      success: false,
      error: `API error: ${(error as Error).message}`
    }, { status: 500 });
  }
}

export async function loader() {
  return json({
    message: "Bundle Product Manager API",
    availableActions: [
      "create_bundle_product",
      "update_bundle_product",
      "get_bundle_for_product",
      "audit_bundle_isolation",
      "fix_bundle_product_publishing",
      "validate_bundle_isolation"
    ],
    usage: {
      method: "POST",
      body: "FormData with action and required parameters"
    }
  });
}