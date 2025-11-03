/**
 * Cart Transform Metafield Service
 *
 * Manages the lightweight cart transform configuration metafield
 * stored on bundle products. This is separate from the full widget
 * configuration to keep cart transform data minimal and performant.
 *
 * Architecture: Hybrid Approach (Architecture #3)
 * - Cart transform reads per-product metafield (~500 bytes)
 * - Widget queries Storefront API for fresh product data
 * - Shop index metafield for bundle discovery
 */

import { safeJsonParse } from "./metafield-sync.server";

export interface CartTransformConfig {
  id: string;                          // Bundle ID (cuid)
  parentVariantId: string;             // Bundle product variant GID
  name: string;                        // Bundle display name
  pricing: {
    enabled: boolean;
    method: 'percentage_off' | 'fixed_amount_off' | 'fixed_bundle_price';
    rules: Array<{
      condition: {
        type: 'quantity' | 'amount';
        operator: 'gte' | 'lte' | 'eq';
        value: number;
      };
      discount: {
        method: 'percentage_off' | 'fixed_amount_off' | 'fixed_bundle_price';
        value: number;
      };
    }>;
  };
}

/**
 * Creates or updates the cart transform config metafield on a bundle product
 */
export async function updateCartTransformConfigMetafield(
  admin: any,
  bundleProductId: string,
  config: CartTransformConfig
): Promise<void> {
  const configJson = JSON.stringify(config);
  const sizeBytes = new Blob([configJson]).size;

  console.log(`📊 [CART_TRANSFORM_CONFIG] Bundle: ${config.id}`);
  console.log(`📏 [CART_TRANSFORM_CONFIG] Size: ${sizeBytes} bytes`);

  // Validate size (should be under 2KB for safety, well under 10KB limit)
  if (sizeBytes > 2000) {
    throw new Error(
      `Cart transform config too large: ${sizeBytes} bytes. ` +
      `Maximum recommended: 2000 bytes. ` +
      `Reduce number of pricing rules or simplify configuration.`
    );
  }

  const SET_METAFIELD = `
    mutation SetCartTransformConfig($metafields: [MetafieldsSetInput!]!) {
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
          ownerId: bundleProductId,
          namespace: "$app",
          key: "cart_transform_config",
          type: "json",
          value: configJson
        }
      ]
    }
  });

  const data = await response.json();

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    const error = data.data.metafieldsSet.userErrors[0];
    console.error("❌ [CART_TRANSFORM_CONFIG] Error:", error);
    throw new Error(`Failed to set cart transform config: ${error.message}`);
  }

  console.log("✅ [CART_TRANSFORM_CONFIG] Metafield created successfully");
}

/**
 * Deletes the cart transform config metafield from a bundle product
 */
export async function deleteCartTransformConfigMetafield(
  admin: any,
  bundleProductId: string
): Promise<void> {
  console.log(`🗑️ [CART_TRANSFORM_CONFIG] Deleting metafield for product: ${bundleProductId}`);

  // Get the metafield ID first
  const GET_METAFIELD = `
    query GetCartTransformConfig($ownerId: ID!) {
      product(id: $ownerId) {
        metafield(namespace: "$app", key: "cart_transform_config") {
          id
        }
      }
    }
  `;

  const getResponse = await admin.graphql(GET_METAFIELD, {
    variables: { ownerId: bundleProductId }
  });

  const getData = await getResponse.json();
  const metafieldId = getData.data?.product?.metafield?.id;

  if (!metafieldId) {
    console.log("ℹ️ [CART_TRANSFORM_CONFIG] No metafield to delete");
    return;
  }

  // Delete the metafield
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
    console.error("❌ [CART_TRANSFORM_CONFIG] Delete error:", deleteData.data.metafieldDelete.userErrors);
    throw new Error("Failed to delete cart transform config metafield");
  }

  console.log("✅ [CART_TRANSFORM_CONFIG] Metafield deleted successfully");
}

/**
 * Builds cart transform config from bundle data
 * This creates a minimal configuration with only data needed by cart transform
 */
export function buildCartTransformConfig(
  bundleId: string,
  bundleName: string,
  parentVariantId: string,
  pricing: any
): CartTransformConfig {
  return {
    id: bundleId,
    parentVariantId: parentVariantId,  // Consistent naming (not bundleParentVariantId)
    name: bundleName,
    pricing: {
      enabled: pricing?.enabled || false,
      method: pricing?.method || 'percentage_off',
      rules: (safeJsonParse(pricing?.rules, []) as any[]).map(rule => ({
        condition: {
          type: rule.condition?.type || 'quantity',
          operator: rule.condition?.operator || 'gte',
          value: parseInt(rule.condition?.value) || 0
        },
        discount: {
          method: rule.discount?.method || pricing?.method || 'percentage_off',
          value: parseFloat(rule.discount?.value) || 0
        }
      }))
    }
  };
}
