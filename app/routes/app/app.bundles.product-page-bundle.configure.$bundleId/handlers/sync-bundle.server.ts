import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import db from "../../../../db.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../../services/bundles/metafield-sync.server";
import { calculateBundlePrice } from "../../../../services/bundles/pricing-calculation.server";
import {
  convertBundleToStandardMetafields,
  updateProductStandardMetafields,
} from "../../../../services/bundles/standard-metafields.server";
import { syncThemeColors } from "../../../../services/theme-colors.server";
import { buildBundleProductDescriptionHtml } from "../../../../lib/bundle-product-description.server";
import { buildBundleProductPlaceholderMediaInput } from "../../../../lib/bundle-product-media.server";
import { buildGeneratedBundleProductMetadata } from "../../../../lib/bundle-product-data.server";
import { publishProductToSalesChannels } from "../../../../services/shopify-publications.server";
import { buildSyncBundleConfiguration } from "./runtime-config.server";
import {
  loadShopName,
  syncBundleProductToShopify,
} from "./product-sync.server";

/**
 * Handle hard-reset sync of a product-page bundle:
 * Archives and deletes the Shopify product, then re-creates it, and re-runs all metafield
 * operations from the current DB state.
 */
export async function handleSyncBundle(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
) {
  AppLogger.info(
    "[SYNC_BUNDLE] Starting hard-reset sync for product-page bundle",
    { bundleId, shopId: session.shop },
  );

  try {
    // 1. Load bundle + steps + pricing from DB
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: {
          include: {
            StepProduct: { orderBy: { position: "asc" } },
            StepCategory: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { position: "asc" },
        },
        pricing: true,
      },
    });

    if (!bundle) {
      return json(
        { success: false, error: "Bundle not found" },
        { status: 404 },
      );
    }

    if (!bundle.shopifyProductId) {
      return json(
        {
          success: false,
          error:
            "Bundle has no Shopify product — save the bundle first to create a product",
        },
        { status: 400 },
      );
    }

    const oldProductId = bundle.shopifyProductId;

    // 2. Archive product (Shopify requires ARCHIVED status before deletion)
    const ARCHIVE_PRODUCT = `
      mutation ArchiveProduct($product: ProductUpdateInput!) {
        productUpdate(product: $product) {
          product { id status }
          userErrors { field message }
        }
      }
    `;

    const archiveResponse = await admin.graphql(ARCHIVE_PRODUCT, {
      variables: { product: { id: oldProductId, status: "ARCHIVED" } },
    });
    const archiveData = await archiveResponse.json();

    if (archiveData.data?.productUpdate?.userErrors?.length > 0) {
      const err = archiveData.data.productUpdate.userErrors[0];
      return json(
        {
          success: false,
          error: `Failed to archive Shopify product: ${err.message}`,
        },
        { status: 400 },
      );
    }

    AppLogger.info("[SYNC_BUNDLE] Shopify product archived", {
      bundleId,
      productId: oldProductId,
    });

    // 3. Delete Shopify product
    const DELETE_PRODUCT = `
      mutation DeleteProduct($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors { field message }
        }
      }
    `;

    const deleteResponse = await admin.graphql(DELETE_PRODUCT, {
      variables: { input: { id: oldProductId } },
    });
    const deleteData = await deleteResponse.json();

    if (deleteData.data?.productDelete?.userErrors?.length > 0) {
      const err = deleteData.data.productDelete.userErrors[0];
      return json(
        {
          success: false,
          error: `Failed to delete Shopify product: ${err.message}`,
        },
        { status: 400 },
      );
    }

    AppLogger.info("[SYNC_BUNDLE] Shopify product deleted", {
      bundleId,
      productId: oldProductId,
    });

    // 4. Clear product reference from DB
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyProductId: null },
    });

    // 5. Re-create the Shopify product
    const bundlePrice = await calculateBundlePrice(admin, bundle);

    const CREATE_PRODUCT = `
      mutation CreateBundleProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
        productCreate(product: $product, media: $media) {
          product {
            id title handle status productType vendor
            media(first: 10) {
              nodes {
                ... on MediaImage {
                  id
                  alt
                  image {
                    url
                    altText
                  }
                }
              }
            }
            variants(first: 1) { edges { node { id } } }
          }
          userErrors { field message }
        }
      }
    `;

    const shopName = await loadShopName(admin);
    const productMetadata = buildGeneratedBundleProductMetadata({
      bundleName: bundle.name,
      shopName,
    });
    const mediaInput = buildBundleProductPlaceholderMediaInput(
      process.env.SHOPIFY_APP_URL,
      bundle.name,
    );
    const createResponse = await admin.graphql(CREATE_PRODUCT, {
      variables: {
        product: {
          ...productMetadata,
          status: "DRAFT",
          descriptionHtml: buildBundleProductDescriptionHtml({
            bundleName: bundle.name,
            customDescription: bundle.description,
            status: bundle.status,
          }),
          tags: ["WP-Bundles"],
        },
        ...(mediaInput ? { media: mediaInput } : {}),
      },
    });

    const createData = await createResponse.json();

    if (createData.data?.productCreate?.userErrors?.length > 0) {
      const err = createData.data.productCreate.userErrors[0];
      throw new Error(`Failed to re-create Shopify product: ${err.message}`);
    }

    const createdProduct = createData.data?.productCreate?.product;
    const newProductId = createdProduct?.id;
    const productHandle = createdProduct?.handle || productMetadata.handle;

    // Set price and inventory policy on the auto-created default variant
    // (productVariantUpdate removed in API 2025-10, use productVariantsBulkUpdate)
    const defaultVariantId =
      createData.data?.productCreate?.product?.variants?.edges?.[0]?.node?.id;
    if (defaultVariantId && newProductId) {
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
            productId: newProductId,
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
    if (!newProductId) {
      throw new Error("Re-created product has no ID");
    }

    AppLogger.info("[SYNC_BUNDLE] Shopify product re-created", {
      bundleId,
      newProductId,
    });

    // 6. Update DB with new product ID and handle
    await db.bundle.update({
      where: { id: bundleId },
      data: {
        shopifyProductId: newProductId,
        shopifyProductHandle: productHandle,
      },
    });
    await publishProductToSalesChannels(
      admin,
      newProductId,
      "ppb-sync-bundle-recreate",
    );
    const productSyncResult = await syncBundleProductToShopify(
      admin,
      newProductId,
      bundle.status,
      bundle.name,
      bundle.description,
      bundleId,
      {
        shopName,
        mediaNodes: createdProduct?.media?.nodes,
        skipMediaSync: true,
      },
    );
    if (
      productSyncResult.handle &&
      productSyncResult.handle !== productHandle
    ) {
      await db.bundle.update({
        where: { id: bundleId },
        data: { shopifyProductHandle: productSyncResult.handle },
      });
    }

    // 7. Re-run metafield operations from DB-authoritative state, even when pricing is off.
    const bundleConfig = buildSyncBundleConfiguration(bundle, newProductId);

    AppLogger.info("[SYNC_BUNDLE] Re-running metafield operations", {
      bundleId,
      newProductId,
    });

    const [standardResult, componentResult, variantResult] =
      await Promise.allSettled([
        (async () => {
          const { metafields: standardMetafields } =
            await convertBundleToStandardMetafields(admin, bundleConfig);
          if (Object.keys(standardMetafields).length > 0) {
            await updateProductStandardMetafields(
              admin,
              newProductId,
              standardMetafields,
            );
          }
        })(),
        updateComponentProductMetafields(admin, newProductId, bundleConfig),
        updateBundleProductMetafields(admin, newProductId, bundleConfig),
      ]);

    if (standardResult.status === "rejected") {
      AppLogger.warn(
        "[SYNC_BUNDLE] Standard metafields update failed (non-critical)",
        { bundleId },
        standardResult.reason,
      );
    }
    if (componentResult.status === "rejected") {
      throw new Error(
        `Failed to update component metafields: ${componentResult.reason}`,
      );
    }
    if (variantResult.status === "rejected") {
      throw new Error(
        `Failed to update bundle variant metafields: ${variantResult.reason}`,
      );
    }

    AppLogger.info("[SYNC_BUNDLE] All metafields re-synced successfully", {
      bundleId,
    });

    // Sync theme colors for bundle widget color inheritance (non-critical, silent fail)
    syncThemeColors(admin, session.shop).catch(() => {
      /* swallowed — syncThemeColors handles logging */
    });

    return json({
      success: true,
      synced: true,
      message: "Bundle synced successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    AppLogger.error(
      "[SYNC_BUNDLE] Error during sync:",
      { bundleId },
      error as any,
    );
    return json(
      { success: false, error: `Sync failed: ${message}` },
      { status: 500 },
    );
  }
}
