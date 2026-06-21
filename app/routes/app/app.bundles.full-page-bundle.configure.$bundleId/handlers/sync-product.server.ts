import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import db from "../../../../db.server";
import { updateBundleProductMetafields } from "../../../../services/bundles/metafield-sync.server";
import {
  calculateBundlePrice,
  updateBundleProductPrice,
} from "../../../../services/bundles/pricing-calculation.server";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import { buildFullPageBundleMetafieldConfig } from "./shared.server";

/**
 * Handle syncing bundle product
 */
export async function handleSyncProduct(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  _formData: FormData,
) {
  const bundle = await db.bundle.findUnique({
    where: {
      id: bundleId,
      shopId: session.shop,
    },
    include: {
      steps: true,
      pricing: true,
    },
  });

  if (!bundle) {
    return json(
      { success: false, error: ERROR_MESSAGES.BUNDLE_NOT_FOUND },
      { status: 404 },
    );
  }

  let productId = bundle.shopifyProductId;

  // If product exists, fetch latest data from Shopify and sync to database
  if (productId) {
    try {
      const GET_PRODUCT_FOR_SYNC = `
        query GetBundleProductForSync($id: ID!) {
          product(id: $id) {
            id
            title
            description
            descriptionHtml
            handle
            status
            productType
            vendor
            tags
            onlineStoreUrl
            featuredMedia {
              ... on MediaImage {
                id
                image {
                  url
                  altText
                }
              }
            }
            media(first: 10) {
              nodes {
                ... on MediaImage {
                  id
                  image {
                    url
                    altText
                  }
                }
              }
            }
            variants(first: 1) {
              nodes {
                id
                price
                compareAtPrice
                sku
                inventoryQuantity
              }
            }
            updatedAt
            createdAt
          }
        }
      `;

      const response = await admin.graphql(GET_PRODUCT_FOR_SYNC, {
        variables: { id: productId },
      });

      const data = (await response.json()) as {
        data: Record<string, any>;
        errors?: Array<{ message: string }>;
      };

      if (data.errors) {
        AppLogger.error("GraphQL errors:", {}, data.errors);
        return json(
          {
            success: false,
            error: `Failed to fetch product: ${data.errors[0].message}`,
          },
          { status: 400 },
        );
      }

      const shopifyProduct = data.data?.product;

      if (!shopifyProduct) {
        // Product no longer exists in Shopify, remove reference from bundle
        await db.bundle.update({
          where: { id: bundleId },
          data: { shopifyProductId: null },
        });

        return json(
          {
            success: false,
            error:
              "Product no longer exists in Shopify. Bundle product reference has been cleared.",
          },
          { status: 404 },
        );
      }

      // Check if bundle name has changed and optionally sync it
      let bundleNeedsSyncing = false;
      const updatedBundle: any = {};

      // Sync bundle description if changed in Shopify
      if (shopifyProduct.description !== bundle.description) {
        updatedBundle.description = shopifyProduct.description;
        bundleNeedsSyncing = true;
      }

      // Update bundle with synced data if needed
      if (bundleNeedsSyncing) {
        await db.bundle.update({
          where: { id: bundleId },
          data: updatedBundle,
        });
      }

      const bundleConfiguration = buildFullPageBundleMetafieldConfig(
        {
          ...bundle,
          ...updatedBundle,
          shopifyProductId: productId,
        },
        {
          lastSynced: new Date().toISOString(),
          shopifyProduct: {
            id: shopifyProduct.id,
            title: shopifyProduct.title,
            handle: shopifyProduct.handle,
            updatedAt: shopifyProduct.updatedAt,
          },
        },
      );

      await updateBundleProductMetafields(
        admin,
        productId,
        bundleConfiguration,
      );

      return json({
        success: true,
        productId,
        syncedData: {
          title: shopifyProduct.title,
          description: shopifyProduct.description,
          status: shopifyProduct.status,
          lastUpdated: shopifyProduct.updatedAt,
          changesDetected: bundleNeedsSyncing,
        },
        message: bundleNeedsSyncing
          ? "Bundle product synchronized successfully. Changes detected and updated."
          : "Bundle product synchronized successfully. No changes detected.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown sync error";
      AppLogger.error(
        "Sync error:",
        { component: "handlers.server", bundleId },
        error,
      );
      return json(
        {
          success: false,
          error: `Failed to sync product: ${message}`,
        },
        { status: 500 },
      );
    }
  }

  // Create product if it doesn't exist
  if (!productId) {
    // Calculate proper bundle price based on component products
    AppLogger.debug(
      "[BUNDLE_PRICING] Calculating bundle price for product creation",
    );
    const bundlePrice = await calculateBundlePrice(admin, bundle);

    const CREATE_PRODUCT = `
      mutation CreateBundleProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 1) {
              edges {
                node {
                  id
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

    const response = await admin.graphql(CREATE_PRODUCT, {
      variables: {
        input: {
          title: bundle.name,
          handle: `bundle-${bundle.id}`,
          productType: "Bundle",
          vendor: "Bundle Builder",
          status: "DRAFT",
          descriptionHtml:
            bundle.description || `${bundle.name} - Bundle Product`,
          tags: ["WP-Bundles"],
        },
      },
    });

    const data = await response.json();

    if (data.data?.productCreate?.userErrors?.length > 0) {
      const error = data.data.productCreate.userErrors[0];
      throw new Error(`Failed to create bundle product: ${error.message}`);
    }

    productId = data.data?.productCreate?.product?.id;

    // Set price and inventory policy on the auto-created default variant
    // (productVariantUpdate removed in API 2025-10, use productVariantsBulkUpdate)
    const defaultVariantId =
      data.data?.productCreate?.product?.variants?.edges?.[0]?.node?.id;
    if (defaultVariantId && productId) {
      await admin.graphql(
        `
        mutation UpdateBundleVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants { id price }
            userErrors { field message }
          }
        }
      `,
        {
          variables: {
            productId,
            variants: [
              {
                id: defaultVariantId,
                price: bundlePrice,
                inventoryPolicy: "CONTINUE",
              },
            ],
          },
        },
      );
    }

    // Update bundle with product ID and handle
    await db.bundle.update({
      where: { id: bundleId },
      data: {
        shopifyProductId: productId,
        shopifyProductHandle: `bundle-${bundleId}`,
      },
    });
  } else {
    // Update existing bundle product price if configuration changed
    try {
      AppLogger.debug(
        "[BUNDLE_PRICING] Updating existing bundle product price",
      );
      const bundlePrice = await calculateBundlePrice(admin, bundle);
      await updateBundleProductPrice(admin, productId, bundlePrice);
    } catch (error) {
      AppLogger.error(
        "[BUNDLE_PRICING] Error updating bundle product price:",
        {},
        error as any,
      );
      // Don't fail the whole operation for pricing update errors
    }
  }

  if (productId) {
    const bundleConfiguration = buildFullPageBundleMetafieldConfig({
      ...bundle,
      shopifyProductId: productId,
    });

    const configSize = JSON.stringify(bundleConfiguration).length;
    AppLogger.debug(
      "[METAFIELD] Sync optimized configuration size:",
      {},
      `${configSize} chars`,
    );

    await updateBundleProductMetafields(admin, productId, bundleConfiguration);
  }

  return json({
    success: true,
    productId,
    message: "Bundle product synchronized successfully",
  });
}
