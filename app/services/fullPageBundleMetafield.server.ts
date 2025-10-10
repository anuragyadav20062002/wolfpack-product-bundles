// Full-Page Bundle Metafield Service
// Stores bundle configuration in shop metafields for liquid block access

/**
 * Save full-page bundle config to shop metafield
 * Stored as shop.metafields.wolfpack_bundles[bundleId]
 */
export async function saveBundleToMetafield(
  admin: any,
  shop: string,
  bundleId: string,
  bundleConfig: any
): Promise<void> {
  console.log(
    `💾 [BUNDLE_METAFIELD] Saving bundle config to metafield: ${bundleId}`
  );

  try {
    // Create metafield key from bundle ID (e.g., "fbp_1" from "FBP-1")
    const metafieldKey = bundleId.toLowerCase().replace(/-/g, "_");

    // First, get the shop's GID
    const SHOP_QUERY = `
      query {
        shop {
          id
        }
      }
    `;

    const shopResponse = await admin.graphql(SHOP_QUERY);
    const shopJson = await shopResponse.json();
    const shopGid = shopJson.data.shop.id;

    console.log(`🔍 [BUNDLE_METAFIELD] Shop GID retrieved: ${shopGid}`);

    const METAFIELD_SET_MUTATION = `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
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
          }
        }
      }
    `;

    const response = await admin.graphql(METAFIELD_SET_MUTATION, {
      variables: {
        metafields: [
          {
            ownerId: shopGid,
            namespace: "wolfpack_bundles",
            key: metafieldKey,
            type: "json",
            value: JSON.stringify(bundleConfig),
          },
        ],
      },
    });

    const responseJson = await response.json();

    if (
      responseJson.data?.metafieldsSet?.userErrors &&
      responseJson.data.metafieldsSet.userErrors.length > 0
    ) {
      console.error(
        `❌ [BUNDLE_METAFIELD] Error saving metafield:`,
        responseJson.data.metafieldsSet.userErrors
      );
      throw new Error(responseJson.data.metafieldsSet.userErrors[0].message);
    }

    console.log(
      `✅ [BUNDLE_METAFIELD] Bundle config saved to metafield successfully`
    );
  } catch (error) {
    console.error(`❌ [BUNDLE_METAFIELD] Error saving metafield:`, error);
    throw error;
  }
}

/**
 * Get bundle config from shop metafield
 */
export async function getBundleFromMetafield(
  admin: any,
  bundleId: string
): Promise<any | null> {
  console.log(
    `📖 [BUNDLE_METAFIELD] Retrieving bundle config from metafield: ${bundleId}`
  );

  try {
    const metafieldKey = bundleId.toLowerCase().replace(/-/g, "_");

    const SHOP_METAFIELD_QUERY = `
      query getShopMetafield($namespace: String!, $key: String!) {
        shop {
          metafield(namespace: $namespace, key: $key) {
            id
            namespace
            key
            value
          }
        }
      }
    `;

    const response = await admin.graphql(SHOP_METAFIELD_QUERY, {
      variables: {
        namespace: "wolfpack_bundles",
        key: metafieldKey,
      },
    });

    const responseJson = await response.json();

    const metafield = responseJson.data?.shop?.metafield;

    if (!metafield) {
      console.log(`⚠️ [BUNDLE_METAFIELD] Bundle config not found`);
      return null;
    }

    const bundleConfig = JSON.parse(metafield.value);

    console.log(
      `✅ [BUNDLE_METAFIELD] Bundle config retrieved successfully`
    );

    return bundleConfig;
  } catch (error) {
    console.error(`❌ [BUNDLE_METAFIELD] Error retrieving metafield:`, error);
    return null;
  }
}

/**
 * Delete bundle config from shop metafield
 */
export async function deleteBundleFromMetafield(
  admin: any,
  bundleId: string
): Promise<void> {
  console.log(
    `🗑️ [BUNDLE_METAFIELD] Deleting bundle config from metafield: ${bundleId}`
  );

  try {
    const metafieldKey = bundleId.toLowerCase().replace(/-/g, "_");

    // First, get the metafield ID
    const bundleConfig = await getBundleFromMetafield(admin, bundleId);

    if (!bundleConfig) {
      console.log(`⚠️ [BUNDLE_METAFIELD] Metafield not found, nothing to delete`);
      return;
    }

    const SHOP_METAFIELD_QUERY = `
      query getShopMetafieldId($namespace: String!, $key: String!) {
        shop {
          metafield(namespace: $namespace, key: $key) {
            id
          }
        }
      }
    `;

    const queryResponse = await admin.graphql(SHOP_METAFIELD_QUERY, {
      variables: {
        namespace: "wolfpack_bundles",
        key: metafieldKey,
      },
    });

    const queryJson = await queryResponse.json();
    const metafieldId = queryJson.data?.shop?.metafield?.id;

    if (!metafieldId) {
      console.log(`⚠️ [BUNDLE_METAFIELD] Metafield ID not found`);
      return;
    }

    // Delete the metafield
    const METAFIELD_DELETE_MUTATION = `
      mutation metafieldDelete($input: MetafieldDeleteInput!) {
        metafieldDelete(input: $input) {
          deletedId
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(METAFIELD_DELETE_MUTATION, {
      variables: {
        input: {
          id: metafieldId,
        },
      },
    });

    const responseJson = await response.json();

    if (
      responseJson.data?.metafieldDelete?.userErrors &&
      responseJson.data.metafieldDelete.userErrors.length > 0
    ) {
      console.error(
        `❌ [BUNDLE_METAFIELD] Error deleting metafield:`,
        responseJson.data.metafieldDelete.userErrors
      );
      throw new Error(
        responseJson.data.metafieldDelete.userErrors[0].message
      );
    }

    console.log(
      `✅ [BUNDLE_METAFIELD] Bundle config deleted from metafield successfully`
    );
  } catch (error) {
    console.error(`❌ [BUNDLE_METAFIELD] Error deleting metafield:`, error);
    throw error;
  }
}

/**
 * Format bundle data for storage in metafield
 * This is what the liquid block will receive
 */
export function formatBundleForMetafield(bundle: any): any {
  return {
    id: bundle.templateName, // Bundle ID (e.g., "FBP-1")
    bundleId: bundle.templateName, // Duplicate for compatibility
    name: bundle.name,
    bundleType: "full_page",
    shopifyProductId: bundle.shopifyProductId, // Product ID
    bundleParentVariantId: bundle.shopifyParentVariantId, // CRITICAL: Variant ID for cart transform
    parentProduct: {
      id: bundle.shopifyProductId,
      title: `EasyBundleId : ${bundle.templateName}`,
    },
    tabs: bundle.steps.map((step: any) => ({
      id: step.id,
      name: step.name,
      icon: step.icon || "box",
      position: step.position,
      requireSelection: step.requireSelection,
      minQuantity: step.minQuantity,
      maxQuantity: step.maxQuantity,
      displayVariantsAsIndividual: step.displayVariantsAsIndividual,
      products: step.products || [], // This should be populated with full product details
    })),
    discount: {
      enabled: bundle.pricing?.enableDiscount || false,
      method: bundle.pricing?.discountMethod || "fixed_amount_off",
      rules: bundle.pricing?.rules ? JSON.parse(JSON.stringify(bundle.pricing.rules)) : [],
    },
    settings: bundle.settings || {
      layout: "sidebar-right",
      preview_sticky: true,
      button_text: "Add To Cart",
      success_message: "Success! Your ₹{discount} discount has been applied!",
      grid_columns: 3,
      enable_loading_animation: true,
    },
  };
}
