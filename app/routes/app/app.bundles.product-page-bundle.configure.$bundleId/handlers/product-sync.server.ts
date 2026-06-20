import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import { BundleStatus } from "../../../../constants/bundle";
import { buildBundleProductDescriptionHtml } from "../../../../lib/bundle-product-description.server";
import {
  buildBundleProductMediaFileUpdates,
  buildBundleProductPlaceholderMediaInput,
  hasBundleProductPlaceholderMedia,
  type BundleProductMediaNode,
} from "../../../../lib/bundle-product-media.server";
import { buildGeneratedBundleProductMetadata } from "../../../../lib/bundle-product-data.server";

type ProductSyncResult = {
  handle?: string | null;
};

type ProductSyncOptions = {
  shopName?: string | null;
  mediaNodes?: BundleProductMediaNode[];
  skipMediaSync?: boolean;
};

export async function loadShopName(admin: ShopifyAdmin): Promise<string | null> {
  const GET_SHOP_NAME = `
    query GetShopName {
      shop {
        name
      }
    }
  `;

  const response = await admin.graphql(GET_SHOP_NAME);
  const data = await response.json() as { data?: { shop?: { name?: string | null } }; errors?: unknown[] };

  if (data.errors?.length) {
    AppLogger.warn("[PRODUCT_SYNC] Failed to fetch shop name for generated product vendor:", {
      component: "app.bundles.product-page.configure",
    }, data.errors);
    return null;
  }

  return data.data?.shop?.name?.trim() || null;
}

async function loadBundleProductMediaNodes(
  admin: ShopifyAdmin,
  productId: string,
): Promise<BundleProductMediaNode[]> {
  const GET_BUNDLE_PRODUCT_MEDIA = `
    query GetBundleProductMedia($id: ID!) {
      product(id: $id) {
        id
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
      }
    }
  `;

  const response = await admin.graphql(GET_BUNDLE_PRODUCT_MEDIA, {
    variables: { id: productId },
  });
  const data = await response.json() as { data?: { product?: { media?: { nodes?: BundleProductMediaNode[] } } }; errors?: unknown[] };
  if (data.errors?.length) {
    AppLogger.warn("[PRODUCT_SYNC] Failed to fetch generated product media:", {
      component: "app.bundles.product-page.configure",
      productId,
    }, data.errors);
    return [];
  }

  return data.data?.product?.media?.nodes || [];
}

async function addBundleProductPlaceholderMedia(
  admin: ShopifyAdmin,
  productId: string,
  bundleName: string,
): Promise<BundleProductMediaNode[]> {
  const mediaInput = buildBundleProductPlaceholderMediaInput(process.env.SHOPIFY_APP_URL, bundleName);
  if (!mediaInput) {
    return [];
  }

  const UPDATE_BUNDLE_PRODUCT_MEDIA = `
    mutation AddBundleProductMedia($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {
      productUpdate(product: $product, media: $media) {
        product {
          id
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
        }
        userErrors { field message }
      }
    }
  `;

  const response = await admin.graphql(UPDATE_BUNDLE_PRODUCT_MEDIA, {
    variables: {
      product: { id: productId },
      media: mediaInput,
    },
  });
  const data = await response.json() as {
    data?: { productUpdate?: { product?: { media?: { nodes?: BundleProductMediaNode[] } }; userErrors?: Array<{ field?: string[]; message: string }> } };
    errors?: unknown[];
  };
  const userErrors = data.data?.productUpdate?.userErrors || [];

  if (data.errors?.length || userErrors.length > 0) {
    AppLogger.warn("[PRODUCT_SYNC] Failed to add generated product media:", {
      component: "app.bundles.product-page.configure",
      productId,
    }, { errors: data.errors || userErrors });
    return [];
  }

  return data.data?.productUpdate?.product?.media?.nodes || [];
}

async function updateBundleProductMediaFiles(
  admin: ShopifyAdmin,
  files: Array<{ id: string; alt?: string; referencesToRemove?: string[] }>,
): Promise<void> {
  if (files.length === 0) return;

  const UPDATE_BUNDLE_PRODUCT_MEDIA_FILES = `
    mutation UpdateBundleProductMediaFiles($files: [FileUpdateInput!]!) {
      fileUpdate(files: $files) {
        files { id alt }
        userErrors { field message code }
      }
    }
  `;

  const response = await admin.graphql(UPDATE_BUNDLE_PRODUCT_MEDIA_FILES, {
    variables: { files },
  });
  const data = await response.json() as {
    data?: { fileUpdate?: { userErrors?: Array<{ field?: string[]; message: string; code?: string }> } };
    errors?: unknown[];
  };
  const userErrors = data.data?.fileUpdate?.userErrors || [];

  if (data.errors?.length || userErrors.length > 0) {
    AppLogger.warn("[PRODUCT_SYNC] Failed to update generated product media files:", {
      component: "app.bundles.product-page.configure",
      mediaIds: files.map((file) => file.id),
    }, { errors: data.errors || userErrors });
  }
}

async function syncGeneratedBundleProductMedia(
  admin: ShopifyAdmin,
  productId: string,
  bundleName: string,
  knownMediaNodes?: BundleProductMediaNode[],
): Promise<void> {
  try {
    let mediaNodes = knownMediaNodes || await loadBundleProductMediaNodes(admin, productId);
    if (!hasBundleProductPlaceholderMedia(mediaNodes, bundleName)) {
      const updatedMediaNodes = await addBundleProductPlaceholderMedia(admin, productId, bundleName);
      mediaNodes = updatedMediaNodes.length > 0 ? updatedMediaNodes : mediaNodes;
    }

    const fileUpdates = buildBundleProductMediaFileUpdates(productId, mediaNodes, bundleName);
    await updateBundleProductMediaFiles(admin, fileUpdates);
  } catch (error) {
    AppLogger.warn("[PRODUCT_SYNC] Generated product media sync failed:", {
      component: "app.bundles.product-page.configure",
      productId,
    }, error as any);
  }
}

/** Sync bundle product status to Shopify. Non-fatal — logs errors but does not throw. */
export async function syncBundleProductToShopify(
  admin: ShopifyAdmin,
  shopifyProductId: string,
  finalStatus: string,
  bundleName: string,
  bundleDescription: string | null,
  bundleId: string,
  options: ProductSyncOptions = {},
): Promise<ProductSyncResult> {
  const shopifyStatus = finalStatus === BundleStatus.UNLISTED ? "ACTIVE" : finalStatus.toUpperCase();
  const descriptionHtml = buildBundleProductDescriptionHtml({
    bundleName,
    customDescription: bundleDescription,
    status: finalStatus,
  });
  const shopName = options.shopName !== undefined ? options.shopName : await loadShopName(admin);
  const productMetadata = buildGeneratedBundleProductMetadata({ bundleName, shopName });
  const syncResult: ProductSyncResult = {};
  AppLogger.debug(`[PRODUCT_SYNC] Syncing status '${shopifyStatus}' to product ${shopifyProductId}`);

  const UPDATE_PRODUCT_STATUS = `
    mutation UpdateProductStatus($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product { id status handle vendor productType }
        userErrors { field message }
      }
    }
  `;

  try {
    const response = await admin.graphql(UPDATE_PRODUCT_STATUS, {
      variables: {
          product: {
            id: shopifyProductId,
            ...productMetadata,
            status: shopifyStatus,
            descriptionHtml,
          },
      },
    });
    const responseData = await response.json() as { data: Record<string, any>; errors?: unknown[] };
    const statusUserErrors = responseData.data?.productUpdate?.userErrors ?? [];

    if (responseData.errors?.length) {
      AppLogger.error("[PRODUCT_SYNC] GraphQL transport error updating product status:", {
        component: "app.bundles.product-page.configure", operation: "sync-product-status", productId: shopifyProductId,
      }, responseData.errors);
    } else if (statusUserErrors.length > 0) {
      AppLogger.error("[PRODUCT_SYNC] Shopify returned errors while updating product status:", {
        component: "app.bundles.product-page.configure", operation: "sync-product-status",
        productId: shopifyProductId, targetStatus: shopifyStatus,
      }, { errors: statusUserErrors });
    } else {
      syncResult.handle = responseData.data?.productUpdate?.product?.handle ?? null;
      AppLogger.info("[PRODUCT_SYNC] Successfully synced product status to Shopify", {
        component: "app.bundles.product-page.configure", productId: shopifyProductId,
        requestedStatus: shopifyStatus, actualStatus: responseData.data?.productUpdate?.product?.status,
      });
    }

    if (finalStatus === BundleStatus.UNLISTED && statusUserErrors.length === 0) {
      const unlistedResponse = await admin.graphql(UPDATE_PRODUCT_STATUS, {
        variables: {
          product: {
            id: shopifyProductId,
            ...productMetadata,
            status: "UNLISTED",
            descriptionHtml,
          },
        },
      });
      const unlistedData = await unlistedResponse.json() as { data: Record<string, any>; errors?: unknown[] };
      const unlistedErrors = unlistedData.data?.productUpdate?.userErrors ?? [];
      if (unlistedErrors.length > 0) {
        AppLogger.warn("[PRODUCT_SYNC] Shopify rejected UNLISTED status:", {
          component: "app.bundles.product-page.configure",
          productId: shopifyProductId,
        }, unlistedErrors);
      } else {
        syncResult.handle = unlistedData.data?.productUpdate?.product?.handle ?? syncResult.handle;
      }
    }

    if (!options.skipMediaSync) {
      await syncGeneratedBundleProductMedia(admin, shopifyProductId, bundleName, options.mediaNodes);
    }
  } catch (error) {
    AppLogger.error("[PRODUCT_SYNC] Failed to sync product status (exception):", {
      component: "app.bundles.product-page.configure", operation: "sync-product-status",
      productId: shopifyProductId, targetStatus: shopifyStatus, bundleId,
    }, error as any);
  }

  return syncResult;
}
