/**
 * Metafield Synchronization Service
 *
 * Handles all metafield operations for bundle products including:
 * - Bundle product metafields
 * - Cart transform metafields
 * - Shop-level bundle metafields
 * - Component product metafields
 */

import db from "../../db.server";
import { isUUID, isValidShopifyProductId } from "../../utils/shopify-validators";
import { getFirstVariantId, getBundleProductVariantId } from "../../utils/variant-lookup.server";

// Helper function to safely parse JSON
export function safeJsonParse(json: any, defaultValue: any = []) {
  if (typeof json === 'string') {
    try {
      return JSON.parse(json);
    } catch (e) {
      return defaultValue;
    }
  }
  return json || defaultValue;
}

/**
 * Ensures bundle metafield definitions exist in Shopify
 */
export async function ensureBundleMetafieldDefinitions(admin: any) {
  const CREATE_METAFIELD_DEFINITION = `
    mutation CreateBundleMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
          namespace
          key
          ownerType
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  // Define metafield definition for cart transform bundles
  const definitions = [
    {
      name: "Cart Transform Bundle Config",
      namespace: "bundle_discounts",
      key: "cart_transform_config",
      description: "Cart transform bundle configuration data",
      type: "json",
      ownerType: "PRODUCT"
    }
  ];

  for (const definition of definitions) {
    try {
      const response = await admin.graphql(CREATE_METAFIELD_DEFINITION, {
        variables: { definition }
      });

      const data = await response.json();

      if (data.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
        const error = data.data.metafieldDefinitionCreate.userErrors[0];
        if (error.code !== "TAKEN") { // TAKEN means it already exists, which is OK
          console.error(`Metafield definition creation error for ${definition.key}:`, error);
          // Continue with other definitions even if one fails
        }
      }
    } catch (error) {
      console.error(`Error ensuring metafield definition for ${definition.key}:`, error);
      // Continue with other definitions even if one fails
    }
  }

  return true;
}

/**
 * Updates bundle product metafields with configuration data
 */
export async function updateBundleProductMetafields(
  admin: any,
  bundleProductId: string,
  bundleConfiguration: any
) {
  console.log("🔧 [METAFIELD] Starting bundle product metafield update");
  console.log("📦 [METAFIELD] Bundle Product ID:", bundleProductId);
  console.log("⚙️ [METAFIELD] Configuration size:", JSON.stringify(bundleConfiguration).length, "chars");

  await ensureBundleMetafieldDefinitions(admin);

  const SET_METAFIELDS = `
    mutation SetBundleMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          namespace
          value
          createdAt
          updatedAt
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const response = await admin.graphql(SET_METAFIELDS, {
    variables: {
      metafields: [
        {
          ownerId: bundleProductId,
          namespace: "bundle_discounts",
          key: 'cart_transform_config',
          type: "json",
          value: JSON.stringify(bundleConfiguration)
        }
      ]
    }
  });

  const data = await response.json();

  console.log("📡 [METAFIELD] GraphQL response received");
  console.log("✅ [METAFIELD] Metafields set:", data.data?.metafieldsSet?.metafields?.length || 0);

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    const error = data.data.metafieldsSet.userErrors[0];
    console.error("❌ [METAFIELD] Set error:", error);
    throw new Error(`Failed to update bundle metafields: ${error.message}`);
  }

  console.log("🎉 [METAFIELD] Bundle product metafields updated successfully");
  return data.data?.metafieldsSet?.metafields?.[0];
}

/**
 * Updates cart transform metafield with all active bundles
 */
export async function updateCartTransformMetafield(admin: any, shopId: string) {
  console.log("🔄 [CART_TRANSFORM_METAFIELD] Starting cart transform metafield update");
  console.log("🆔 [CART_TRANSFORM_METAFIELD] Shop ID:", shopId);

  try {
    // First get the existing cart transform ID
    const GET_CART_TRANSFORM = `
      query getCartTransform {
        cartTransforms(first: 1) {
          edges {
            node {
              id
              functionId
            }
          }
        }
      }
    `;

    const cartTransformResponse = await admin.graphql(GET_CART_TRANSFORM);
    const cartTransformData = await cartTransformResponse.json();

    const cartTransformId = cartTransformData.data?.cartTransforms?.edges?.[0]?.node?.id;

    if (!cartTransformId) {
      console.error('🔄 [CART_TRANSFORM_METAFIELD] No cart transform found - cannot update metafields');
      return null;
    }

    console.log("🔄 [CART_TRANSFORM_METAFIELD] Found cart transform ID:", cartTransformId);

    // Fetch all published bundles for this shop
    const allPublishedBundles = await db.bundle.findMany({
      where: {
        shopId: shopId,
        status: 'active'
      },
      include: {
        steps: {
          include: {
            StepProduct: true,
          },
        },
        pricing: true,
      },
    });

    console.log(`🔄 [CART_TRANSFORM_METAFIELD] Found ${allPublishedBundles.length} published bundles`);

    // Create MINIMAL optimized bundle configuration for cart transform performance
    const optimizedBundleConfigs = await Promise.all(allPublishedBundles.map(async (bundle) => {
      // Extract all product IDs from bundle steps for quick lookup
      const allBundleProductIds: string[] = [];
      const stepConfigs: any[] = [];

      for (const step of bundle.steps) {
        const stepProductIds: string[] = [];

        // Add products from step configuration (collections/products JSON)
        const stepProducts = safeJsonParse(step.products, []);
        const stepCollections = safeJsonParse(step.collections, []);

        stepProducts.forEach((product: any) => {
          if (product.id) {
            stepProductIds.push(product.id);
            if (!allBundleProductIds.includes(product.id)) {
              allBundleProductIds.push(product.id);
            }
          }
        });

        // Add products from StepProduct relations
        step.StepProduct.forEach(product => {
          if (product.productId) {
            stepProductIds.push(product.productId);
            if (!allBundleProductIds.includes(product.productId)) {
              allBundleProductIds.push(product.productId);
            }
          }
        });

        // Only include essential step data for cart transform
        stepConfigs.push({
          id: step.id,
          name: step.name,
          minQuantity: step.minQuantity,
          maxQuantity: step.maxQuantity,
          productIds: stepProductIds,
          collections: stepCollections.map((col: any) => col.id).filter(Boolean),
          // Include conditions for cart transform validation
          conditionType: step.conditionType,
          conditionOperator: step.conditionOperator,
          conditionValue: step.conditionValue
        });
      }

      // Only include essential bundle data for cart transform
      const optimizedBundle = {
        id: bundle.id,
        name: bundle.name,
        templateName: bundle.templateName || null,
        type: bundle.bundleType,
        allBundleProductIds, // All product IDs for quick bundle detection
        steps: stepConfigs,
        // Essential pricing data only
        pricing: bundle.pricing ? {
          enabled: bundle.pricing.enabled,
          method: bundle.pricing.method,
          rules: safeJsonParse(bundle.pricing.rules, []),
          // Include bundle variant IDs if available
          bundleVariantId: (bundle.pricing as any).bundleVariantId || null,
          fixedPrice: (bundle.pricing as any).fixedPrice || null
        } : null,
        // Include bundle parent variant if available - fetch from bundle product
        bundleParentVariantId: await getBundleProductVariantId(admin, bundle.shopifyProductId)
      };

      return optimizedBundle;
    }));

    const originalSize = JSON.stringify(allPublishedBundles).length;
    const optimizedSize = JSON.stringify(optimizedBundleConfigs).length;
    console.log(`📏 [CART_TRANSFORM_METAFIELD] Size optimization: ${originalSize} → ${optimizedSize} chars (${Math.round((1 - optimizedSize/originalSize) * 100)}% reduction)`);
    console.log(`🎯 [CART_TRANSFORM_METAFIELD] Optimized bundle configs:`, JSON.stringify(optimizedBundleConfigs, null, 2));

    // Update cart transform metafield using metafieldsSet
    const UPDATE_CART_TRANSFORM_METAFIELD = `
      mutation SetCartTransformMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
            owner {
              ... on CartTransform {
                id
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

    const response = await admin.graphql(UPDATE_CART_TRANSFORM_METAFIELD, {
      variables: {
        metafields: [
          {
            ownerId: cartTransformId,
            namespace: "bundle_discounts",
            key: "all_bundles_config",
            type: "json",
            value: JSON.stringify(optimizedBundleConfigs)
          }
        ]
      }
    });

    const data = await response.json();
    console.log("🔄 [CART_TRANSFORM_METAFIELD] GraphQL response:", JSON.stringify(data, null, 2));

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error("🔄 [CART_TRANSFORM_METAFIELD] User errors:", data.data.metafieldsSet.userErrors);
      return null;
    }

    console.log("🔄 [CART_TRANSFORM_METAFIELD] Cart transform metafield updated successfully");
    return data.data?.metafieldsSet?.metafields?.[0];
  } catch (error) {
    console.error("🔄 [CART_TRANSFORM_METAFIELD] Error updating cart transform metafield:", error);
    return null;
  }
}

/**
 * Updates shop-level all_bundles metafield for Liquid extension (legacy)
 */
export async function updateShopBundlesMetafield(admin: any, shopId: string) {
  console.log("🏪 [SHOP_METAFIELD] Starting shop bundles metafield update");
  console.log("🆔 [SHOP_METAFIELD] Shop ID:", shopId);

  try {
    // First get the shop's global ID
    const GET_SHOP_ID = `
      query getShopId {
        shop {
          id
        }
      }
    `;

    const shopResponse = await admin.graphql(GET_SHOP_ID);
    const shopData = await shopResponse.json();

    if (!shopData.data?.shop?.id) {
      console.error('Failed to get shop global ID');
      return null;
    }

    const shopGlobalId = shopData.data.shop.id;

    // Get all published cart transform bundles from database
    // Force refresh by including even draft bundles with steps for debugging
    console.log("📊 [SHOP_METAFIELD] Querying database for all cart transform bundles");
    const allBundles = await db.bundle.findMany({
      where: {
        shopId: shopId,
        bundleType: 'cart_transform'
        // Temporarily remove status filter to see all cart transform bundles
      },
      include: {
        steps: {
          include: {
            StepProduct: true
          }
        },
        pricing: true
      }
    });

    console.log("📦 [SHOP_METAFIELD] Found bundles in database:", allBundles.length);

    // Format bundles for Liquid extension
    const formattedBundles = allBundles.map(bundle => ({
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      status: bundle.status, // Include status for JavaScript filtering
      bundleType: bundle.bundleType, // Include bundle type for debugging
      shopifyProductId: bundle.shopifyProductId, // Include configured Bundle Product ID for matching
      steps: bundle.steps.map(step => ({
        id: step.id,
        name: step.name,
        position: step.position,
        minQuantity: step.minQuantity,
        maxQuantity: step.maxQuantity,
        enabled: step.enabled,
        displayVariantsAsIndividual: step.displayVariantsAsIndividual,
        products: step.products || [],
        collections: step.collections || [],
        StepProduct: (step.StepProduct || []).map((sp: any) => {
          const stepProductData = {
            id: sp.id,
            productId: sp.productId,
            title: sp.title,
            imageUrl: sp.imageUrl,
            variants: sp.variants,
            minQuantity: sp.minQuantity,
            maxQuantity: sp.maxQuantity,
            position: sp.position
          };
          console.log(`📸 [METAFIELD] StepProduct imageUrl for ${sp.title}:`, sp.imageUrl);
          return stepProductData;
        }),
        // Add condition data if needed
        conditionType: step.conditionType,
        conditionOperator: step.conditionOperator,
        conditionValue: step.conditionValue
      })),
      pricing: bundle.pricing ? {
        enabled: bundle.pricing.enabled,
        method: bundle.pricing.method,
        rules: safeJsonParse(bundle.pricing.rules, []),
        showFooter: bundle.pricing.showFooter,
        showProgressBar: bundle.pricing.showProgressBar,
        messages: safeJsonParse(bundle.pricing.messages, {})
      } : null,
      // Add matching data for JavaScript bundle selection
      matching: {
        // For cart transform bundles, we can match based on step products/collections
        products: bundle.steps.flatMap(step => step.StepProduct?.map(p => ({ id: p.productId })) || []),
        collections: bundle.steps.flatMap(step => (step.collections as any[]) || [])
      }
    }));

    const SET_SHOP_METAFIELD = `
      mutation SetShopBundlesMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
            namespace
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

    const response = await admin.graphql(SET_SHOP_METAFIELD, {
      variables: {
        metafields: [
          {
            ownerId: shopGlobalId,
            namespace: "custom",
            key: "all_bundles",
            type: "json",
            value: JSON.stringify(formattedBundles)
          }
        ]
      }
    });

    const data = await response.json();

    console.log("📡 [SHOP_METAFIELD] GraphQL response received");
    console.log("✅ [SHOP_METAFIELD] Metafields set:", data.data?.metafieldsSet?.metafields?.length || 0);

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      const error = data.data.metafieldsSet.userErrors[0];
      console.error("❌ [SHOP_METAFIELD] Set error:", error);
      // Don't throw error as this is not critical for bundle functionality
      return null;
    }

    console.log("🎉 [SHOP_METAFIELD] Shop bundles metafield updated successfully");
    console.log("📋 [SHOP_METAFIELD] Total bundles in metafield:", allBundles.length);
    return data.data?.metafieldsSet?.metafields?.[0];

  } catch (error) {
    console.error("❌ [SHOP_METAFIELD] Error updating shop bundles metafield:", error);
    return null;
  }
}

/**
 * Updates component products with component_parents metafield
 */
export async function updateComponentProductMetafields(admin: any, bundleProductId: string, bundleConfig: any) {
  console.log("🔧 [COMPONENT_METAFIELD] Setting component_parents metafield on individual component products");

  if (!bundleConfig.steps || bundleConfig.steps.length === 0) {
    console.log("🔧 [COMPONENT_METAFIELD] No steps found in bundle config");
    return;
  }

  // Extract all component product IDs from bundle steps
  const componentProductIds = new Set<string>();

  for (const step of bundleConfig.steps) {
    // Handle StepProduct entries
    if (step.StepProduct && Array.isArray(step.StepProduct)) {
      for (const stepProduct of step.StepProduct) {
        if (stepProduct.productId) {
          // Check if this is a UUID (old data that needs migration)
          if (isUUID(stepProduct.productId)) {
            console.warn(`⚠️ [COMPONENT_METAFIELD] Skipping UUID product ID (needs migration): ${stepProduct.productId} - Product: ${stepProduct.title}`);
            continue; // Skip UUID products entirely
          }

          // Ensure we have a proper product GID
          const productId = stepProduct.productId.startsWith('gid://')
            ? stepProduct.productId
            : `gid://shopify/Product/${stepProduct.productId}`;

          // Only add if it's a valid Shopify product ID (numeric)
          if (isValidShopifyProductId(productId)) {
            componentProductIds.add(productId);
          } else {
            console.warn(`⚠️ [COMPONENT_METAFIELD] Skipping invalid product ID format: ${productId}`);
          }
        }
      }
    }

    // Handle products array if it exists
    if (step.products && Array.isArray(step.products)) {
      for (const product of step.products) {
        if (product.id) {
          const productId = product.id.startsWith('gid://')
            ? product.id
            : `gid://shopify/Product/${product.id}`;
          // Only add if it's a valid Shopify product ID (numeric)
          if (isValidShopifyProductId(productId)) {
            componentProductIds.add(productId);
          } else {
            console.warn(`⚠️ [COMPONENT_METAFIELD] Skipping invalid product ID: ${productId}`);
          }
        }
      }
    }
  }

  console.log(`🔧 [COMPONENT_METAFIELD] Found ${componentProductIds.size} valid component products to update`);

  // Create component_parents metafield data using OFFICIAL Shopify format
  // First, extract component references and quantities from bundle config
  const componentReferences: string[] = [];
  const componentQuantities: number[] = [];

  for (const step of bundleConfig.steps) {
    // Handle StepProduct entries
    if (step.StepProduct && Array.isArray(step.StepProduct)) {
      for (const stepProduct of step.StepProduct) {
        if (stepProduct.productId) {
          // Check if this is a UUID (old data that needs migration)
          if (isUUID(stepProduct.productId)) {
            console.warn(`⚠️ [COMPONENT_REFERENCE] Skipping UUID product ID (needs migration): ${stepProduct.productId} - Product: ${stepProduct.title}`);
            continue; // Skip UUID products entirely
          }

          // Get the actual first variant ID
          const result = await getFirstVariantId(admin, stepProduct.productId);
          if (result.success && result.variantId) {
            componentReferences.push(result.variantId);
            componentQuantities.push(step.minQuantity || 1);
          } else {
            console.warn(`⚠️ [COMPONENT_REFERENCE] Could not get variant for product "${stepProduct.title}" (${result.productId}): ${result.error}`);
          }
        }
      }
    }

    // Handle products array if it exists
    if (step.products && Array.isArray(step.products)) {
      for (const product of step.products) {
        if (product.id) {
          const result = await getFirstVariantId(admin, product.id);
          if (result.success && result.variantId) {
            componentReferences.push(result.variantId);
            componentQuantities.push(step.minQuantity || 1);
          } else {
            console.warn(`⚠️ [COMPONENT_REFERENCE] Could not get variant for product "${product.title || product.id}" (${result.productId}): ${result.error}`);
          }
        }
      }
    }
  }

  // Get the bundle product's first variant ID to use as the parent ID
  const bundleVariantResult = await getFirstVariantId(admin, bundleProductId);

  if (!bundleVariantResult.success || !bundleVariantResult.variantId) {
    console.error(`❌ [COMPONENT_METAFIELD] Cannot update component products: ${bundleVariantResult.error || 'bundle product variant not found'}`);
    return;
  }

  const bundleVariantId = bundleVariantResult.variantId;

  // Create component_parents in OFFICIAL Shopify format (NEW nested structure)
  const componentParentsData = [{
    id: bundleVariantId, // Use the bundle product variant ID as the parent ID
    component_reference: {
      value: componentReferences
    },
    component_quantities: {
      value: componentQuantities
    },
    ...(bundleConfig.pricing?.enabled && bundleConfig.pricing?.rules?.length > 0 ? {
      price_adjustment: {
        value: parseFloat(bundleConfig.pricing.rules[0]?.discount?.value) || 0,
        value_type: bundleConfig.pricing.method === 'percentage_off' ? 'percentage' : 'fixed_amount'
      }
    } : {})
  }];

  console.log("🔧 [COMPONENT_METAFIELD] Bundle variant ID:", bundleVariantId);
  console.log("🔧 [COMPONENT_METAFIELD] Component parents data:", JSON.stringify(componentParentsData, null, 2));

  // Update each component product
  for (const productId of componentProductIds) {
    try {
      console.log(`🔧 [COMPONENT_METAFIELD] Updating product: ${productId}`);

      // Create minimal bundle config for all_bundles_data (to avoid instruction count limit)
      // IMPORTANT: Use parentVariantId (not bundleParentVariantId) to match cart transform expectations
      const minimalBundleConfig = {
        id: bundleConfig.id || bundleConfig.bundleId,
        name: bundleConfig.name,
        parentVariantId: bundleVariantId, // Use the resolved variant ID, match cart transform field name
        pricing: bundleConfig.pricing // Include pricing for discounts
      };

      const metafieldsToSet = [
        // Standard Shopify component_parents metafield
        {
          ownerId: productId,
          namespace: "$app",
          key: "component_parents",
          value: JSON.stringify(componentParentsData),
          type: "json"
        },
        // CRITICAL: Also add bundle_config so cart transform can access it from component products
        // MUST use $app namespace to match cart-transform-input.graphql query
        {
          ownerId: productId,
          namespace: "$app",
          key: "cart_transform_config",
          value: JSON.stringify(minimalBundleConfig),
          type: "json"
        },
        // CRITICAL: Add all_bundles_data metafield for cart transform to access ALL bundles
        {
          ownerId: productId,
          namespace: "custom",
          key: "all_bundles_data",
          value: JSON.stringify([minimalBundleConfig]), // Store minimal config to avoid exceeding instruction limit
          type: "json"
        }
      ];

      const SET_METAFIELDS = `
        mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await admin.graphql(SET_METAFIELDS, {
        variables: { metafields: metafieldsToSet }
      });

      const data = await response.json();
      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        console.error(`🔧 [COMPONENT_METAFIELD] Error updating product ${productId}:`, data.data.metafieldsSet.userErrors);
      } else {
        console.log(`🔧 [COMPONENT_METAFIELD] Successfully updated product ${productId}`);
      }
    } catch (error) {
      console.error(`🔧 [COMPONENT_METAFIELD] Failed to update product ${productId}:`, error);
    }
  }
}
