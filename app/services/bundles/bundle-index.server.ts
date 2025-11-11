/**
 * Bundle Index Service
 *
 * Manages the lightweight shop-level bundle index used for
 * bundle discovery by the widget. This replaces the heavy
 * all_bundles metafield with a minimal index.
 *
 * Architecture: Hybrid Approach (Architecture #3)
 * - Index stores only: id, productId, status (~50 bytes per bundle)
 * - Supports 200+ bundles within 10KB limit
 * - Used for widget discovery, not cart transform
 */

import db from "../../db.server";

export interface BundleIndexEntry {
  id: string;                    // Bundle ID (cuid)
  productId: string;             // Shopify Product GID
  status: 'active' | 'draft';    // Bundle status
}

export interface BundleIndex {
  bundles: BundleIndexEntry[];
  updatedAt: string;
}

/**
 * Updates the shop-level bundle index metafield
 */
export async function updateBundleIndex(
  admin: any,
  shopId: string
): Promise<void> {
  console.log("🔄 [BUNDLE_INDEX] Starting bundle index update");
  console.log("🆔 [BUNDLE_INDEX] Shop ID:", shopId);

  try {
    // Get shop global ID
    const GET_SHOP_ID = `
      query getShopId {
        shop {
          id
        }
      }
    `;

    const shopResponse = await admin.graphql(GET_SHOP_ID);
    const shopData = await shopResponse.json();
    const shopGlobalId = shopData.data?.shop?.id;

    if (!shopGlobalId) {
      throw new Error('Failed to get shop global ID');
    }

    // Get all cart_transform bundles with shopifyProductId
    const bundles = await db.bundle.findMany({
      where: {
        shopId: shopId,
        bundleType: 'cart_transform',
        shopifyProductId: { not: null }  // Only bundles with products
      },
      select: {
        id: true,
        shopifyProductId: true,
        status: true
      }
    });

    console.log("📦 [BUNDLE_INDEX] Found bundles:", bundles.length);

    // Build minimal index
    const index: BundleIndex = {
      bundles: bundles.map(bundle => ({
        id: bundle.id,
        productId: bundle.shopifyProductId!,
        status: bundle.status as 'active' | 'draft'
      })),
      updatedAt: new Date().toISOString()
    };

    const indexJson = JSON.stringify(index);
    const sizeBytes = new Blob([indexJson]).size;

    console.log(`📏 [BUNDLE_INDEX] Size: ${sizeBytes} bytes`);
    console.log(`📏 [BUNDLE_INDEX] Per bundle: ${Math.round(sizeBytes / bundles.length)} bytes`);

    // Validate size (should be under 10KB)
    if (sizeBytes > 10000) {
      throw new Error(
        `Bundle index too large: ${sizeBytes} bytes > 10KB limit. ` +
        `You have ${bundles.length} bundles. Maximum supported: ~200 bundles.`
      );
    }

    // Set metafield
    const SET_METAFIELD = `
      mutation SetBundleIndex($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await admin.graphql(SET_METAFIELD, {
      variables: {
        metafields: [
          {
            ownerId: shopGlobalId,
            namespace: "custom",
            key: "bundle_index",
            type: "json",
            value: indexJson
          }
        ]
      }
    });

    const data = await response.json();

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      const error = data.data.metafieldsSet.userErrors[0];
      console.error("❌ [BUNDLE_INDEX] Error:", error);
      throw new Error(`Failed to set bundle index: ${error.message}`);
    }

    console.log("✅ [BUNDLE_INDEX] Index updated successfully");
    console.log(`📋 [BUNDLE_INDEX] ${bundles.length} bundles indexed`);

  } catch (error) {
    console.error("❌ [BUNDLE_INDEX] Error updating bundle index:", error);
    throw error;
  }
}

/**
 * Deletes the bundle index metafield
 */
export async function deleteBundleIndex(
  admin: any
): Promise<void> {
  console.log("🗑️ [BUNDLE_INDEX] Deleting bundle index");

  // Get shop ID and metafield ID
  const GET_METAFIELD = `
    query GetBundleIndex {
      shop {
        id
        metafield(namespace: "custom", key: "bundle_index") {
          id
        }
      }
    }
  `;

  const getResponse = await admin.graphql(GET_METAFIELD);
  const getData = await getResponse.json();
  const metafieldId = getData.data?.shop?.metafield?.id;

  if (!metafieldId) {
    console.log("ℹ️ [BUNDLE_INDEX] No index to delete");
    return;
  }

  // Delete metafield
  const DELETE_METAFIELD = `
    mutation DeleteMetafield($input: MetafieldDeleteInput!) {
      metafieldDelete(input: $input) {
        deletedId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const deleteResponse = await admin.graphql(DELETE_METAFIELD, {
    variables: {
      input: { id: metafieldId }
    }
  });

  const deleteData = await deleteResponse.json();

  if (deleteData.data?.metafieldDelete?.userErrors?.length > 0) {
    console.error("❌ [BUNDLE_INDEX] Delete error:", deleteData.data.metafieldDelete.userErrors);
    throw new Error("Failed to delete bundle index");
  }

  console.log("✅ [BUNDLE_INDEX] Index deleted successfully");
}
