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
 * Ensures variant-level bundle metafield definitions exist in Shopify
 * (Shopify Standard - Approach 1: Hybrid)
 *
 * Creates 5 metafield definitions for ProductVariant owner type with access controls:
 * - component_reference (list.variant_reference) - PUBLIC_READ for cart transform
 * - component_quantities (list.number_integer) - PUBLIC_READ for cart transform
 * - price_adjustment (json) - NONE (Functions API only)
 * - bundle_ui_config (json) - PUBLIC_READ for Liquid widget
 * - component_parents (json) - PUBLIC_READ for cart transform
 *
 * All definitions use:
 * - Namespace: $app (app-reserved)
 * - Admin access: MERCHANT_READ_WRITE
 * - API Version: 2025-04
 *
 * Reference: https://shopify.dev/docs/apps/build/custom-data/metafields/definitions/use-access-controls-metafields
 */
export async function ensureVariantBundleMetafieldDefinitions(admin: any) {
  const CREATE_METAFIELD_DEFINITION = `
    mutation CreateVariantMetafieldDefinition($definition: MetafieldDefinitionInput!) {
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

  // Define metafield definitions for variant-level bundle data (Shopify Standard)
  // API Version: 2025-04
  // Access controls added per: https://shopify.dev/docs/apps/build/custom-data/metafields/definitions/use-access-controls-metafields
  const definitions = [
    {
      name: "Bundle Component Variants",
      namespace: "$app",
      key: "component_reference",
      description: "Product variants included in this bundle (Shopify standard)",
      type: "list.variant_reference",
      ownerType: "PRODUCTVARIANT",
      access: {
        admin: "MERCHANT_READ_WRITE",
        storefront: "PUBLIC_READ"  // Required for cart transform to read component references
      }
    },
    {
      name: "Component Quantities",
      namespace: "$app",
      key: "component_quantities",
      description: "Quantity of each component in the bundle (Shopify standard)",
      type: "list.number_integer",
      ownerType: "PRODUCTVARIANT",
      validations: [
        {
          name: "min",
          value: "1"
        },
        {
          name: "max",
          value: "100"
        }
      ],
      access: {
        admin: "MERCHANT_READ_WRITE",
        storefront: "PUBLIC_READ"  // Required for cart transform to read quantities
      }
    },
    {
      name: "Bundle Price Adjustment",
      namespace: "$app",
      key: "price_adjustment",
      description: "Discount configuration for cart transform (method, value, conditions)",
      type: "json",
      ownerType: "PRODUCTVARIANT",
      access: {
        admin: "MERCHANT_READ_WRITE",
        storefront: "NONE"  // Cart transform only (Functions API), not needed in Liquid
      }
    },
    {
      name: "Bundle Widget Configuration",
      namespace: "$app",
      key: "bundle_ui_config",
      description: "UI configuration for storefront widget (steps, messaging, display settings)",
      type: "json",
      ownerType: "PRODUCTVARIANT",
      access: {
        admin: "MERCHANT_READ_WRITE",
        storefront: "PUBLIC_READ"  // CRITICAL: Required for Liquid widget to read configuration
      }
    },
    {
      name: "Component Parent Bundles",
      namespace: "$app",
      key: "component_parents",
      description: "Parent bundles this component belongs to (Shopify standard)",
      type: "json",
      ownerType: "PRODUCTVARIANT",
      access: {
        admin: "MERCHANT_READ_WRITE",
        storefront: "PUBLIC_READ"  // Required for cart transform MERGE operation
      }
    }
  ];

  console.log("📋 [METAFIELD_DEF] Creating variant-level metafield definitions");

  for (const definition of definitions) {
    try {
      const response = await admin.graphql(CREATE_METAFIELD_DEFINITION, {
        variables: { definition }
      });

      const data = await response.json();

      if (data.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
        const error = data.data.metafieldDefinitionCreate.userErrors[0];
        if (error.code === "TAKEN") {
          console.log(`✓ [METAFIELD_DEF] ${definition.key} already exists`);
        } else {
          console.error(`❌ [METAFIELD_DEF] Error creating ${definition.key}:`, error);
        }
      } else {
        console.log(`✓ [METAFIELD_DEF] Created ${definition.key}`);
      }
    } catch (error) {
      console.error(`❌ [METAFIELD_DEF] Failed to create ${definition.key}:`, error);
    }
  }

  console.log("✅ [METAFIELD_DEF] Finished ensuring variant metafield definitions");
  return true;
}

/**
 * Legacy function - kept for backwards compatibility
 */
export async function ensureBundleMetafieldDefinitions(admin: any) {
  // Delegate to the new variant-level function
  return ensureVariantBundleMetafieldDefinitions(admin);
}

/**
 * Updates bundle variant metafields with Shopify Standard structure (Approach 1: Hybrid)
 *
 * Creates 4 metafields on the bundle product's first variant:
 * - component_reference (list.variant_reference) - Shopify standard
 * - component_quantities (list.number_integer) - Shopify standard
 * - price_adjustment (json) - Shopify standard with our extension
 * - bundle_ui_config (json) - Custom for widget configuration
 */
export async function updateBundleProductMetafields(
  admin: any,
  bundleProductId: string,
  bundleConfiguration: any
) {
  console.log("🔧 [METAFIELD] Starting bundle variant metafield update (Shopify Standard)");
  console.log("📦 [METAFIELD] Bundle Product ID:", bundleProductId);
  console.log("⚙️ [METAFIELD] Configuration size:", JSON.stringify(bundleConfiguration).length, "chars");

  // Get the first variant ID for the bundle product
  const variantResult = await getFirstVariantId(admin, bundleProductId);
  if (!variantResult.success || !variantResult.variantId) {
    throw new Error(`Cannot update bundle metafields: ${variantResult.error || 'variant not found'}`);
  }

  const bundleVariantId = variantResult.variantId;
  console.log("🎯 [METAFIELD] Bundle variant ID:", bundleVariantId);

  // Extract component references and quantities from bundle configuration
  const componentReferences: string[] = [];
  const componentQuantities: number[] = [];

  if (bundleConfiguration.steps && Array.isArray(bundleConfiguration.steps)) {
    for (const step of bundleConfiguration.steps) {
      // Handle StepProduct entries
      if (step.StepProduct && Array.isArray(step.StepProduct)) {
        for (const stepProduct of step.StepProduct) {
          if (stepProduct.productId) {
            // Skip UUID products
            if (isUUID(stepProduct.productId)) {
              console.warn(`⚠️ [METAFIELD] Skipping UUID product ID: ${stepProduct.productId}`);
              continue;
            }

            // Get the actual first variant ID
            const result = await getFirstVariantId(admin, stepProduct.productId);
            if (result.success && result.variantId) {
              componentReferences.push(result.variantId);
              componentQuantities.push(step.minQuantity || 1);
            } else {
              console.warn(`⚠️ [METAFIELD] Could not get variant: ${result.error}`);
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
              console.warn(`⚠️ [METAFIELD] Could not get variant: ${result.error}`);
            }
          }
        }
      }
    }
  }

  console.log(`📊 [METAFIELD] Found ${componentReferences.length} component variants`);

  // Build price_adjustment config (Shopify standard with extensions)
  const priceAdjustment: any = {
    method: bundleConfiguration.pricing?.method || 'percentage_off',
    value: 0
  };

  if (bundleConfiguration.pricing?.enabled && bundleConfiguration.pricing?.rules?.length > 0) {
    const rule = bundleConfiguration.pricing.rules[0];

    // Extract value from nested discount structure
    if (rule.discount && typeof rule.discount.value !== 'undefined') {
      priceAdjustment.value = parseFloat(rule.discount.value) || 0;
    } else if (typeof rule.discountValue !== 'undefined') {
      priceAdjustment.value = parseFloat(rule.discountValue) || 0;
    }

    // Add conditions if present
    if (rule.condition) {
      priceAdjustment.conditions = {
        type: rule.condition.type || 'quantity',
        operator: rule.condition.operator || 'gte',
        value: parseFloat(rule.condition.value) || 0
      };
    }
  }

  console.log("💰 [METAFIELD] Price adjustment:", JSON.stringify(priceAdjustment));

  // Build bundle_ui_config for widget
  const bundleUiConfig = {
    id: bundleConfiguration.id || bundleConfiguration.bundleId, // Widget expects 'id' field
    bundleId: bundleConfiguration.id || bundleConfiguration.bundleId, // Keep for backwards compatibility
    name: bundleConfiguration.name,
    description: bundleConfiguration.description || '',
    status: bundleConfiguration.status || 'active', // Widget needs this for filtering
    bundleType: bundleConfiguration.bundleType || 'product_page', // Widget needs this for selection
    shopifyProductId: bundleConfiguration.shopifyProductId || null, // Product ID for matching
    steps: (bundleConfiguration.steps || []).map((step: any) => ({
      id: step.id,
      name: step.name,
      position: step.position || 0,
      minQuantity: step.minQuantity || 1,
      maxQuantity: step.maxQuantity || 1,
      products: (step.StepProduct || []).map((sp: any) => ({ id: sp.productId })).filter(p => p.id),
      conditionType: step.conditionType,
      conditionOperator: step.conditionOperator,
      conditionValue: step.conditionValue
    })),
    pricing: bundleConfiguration.pricing ? {
      enabled: bundleConfiguration.pricing.enabled || false,
      method: bundleConfiguration.pricing.method || 'percentage_off',
      rules: (bundleConfiguration.pricing.rules || []).map((rule: any) => ({
        condition: rule.condition ? {
          type: rule.condition.type || 'quantity',
          operator: rule.condition.operator || 'gte',
          value: parseFloat(rule.condition.value) || 0
        } : null,
        discount: rule.discount ? {
          value: parseFloat(rule.discount.value) || 0
        } : { value: parseFloat(rule.discountValue) || 0 }
      }))
    } : null,
    messaging: {
      progressTemplate: bundleConfiguration.messaging?.progressTemplate || 'Add {items} more items',
      successTemplate: bundleConfiguration.messaging?.successTemplate || 'Discount unlocked!',
      showProgressBar: bundleConfiguration.messaging?.showProgressBar !== false,
      showFooter: bundleConfiguration.messaging?.showFooter !== false
    }
  };

  console.log("🎨 [METAFIELD] UI config size:", JSON.stringify(bundleUiConfig).length, "chars");

  // DEBUG: Log the stringified value we're about to send
  const stringifiedValue = JSON.stringify(bundleUiConfig);
  console.log("🔍 [METAFIELD_DEBUG] Stringified value type:", typeof stringifiedValue);
  console.log("🔍 [METAFIELD_DEBUG] Stringified value (first 200 chars):", stringifiedValue.substring(0, 200));
  console.log("🔍 [METAFIELD_DEBUG] Is valid JSON string?", (() => {
    try {
      JSON.parse(stringifiedValue);
      return "YES ✅";
    } catch (e) {
      return `NO ❌ - ${e}`;
    }
  })());

  // Set all 4 metafields on the bundle variant
  const SET_METAFIELDS = `
    mutation SetBundleVariantMetafields($metafields: [MetafieldsSetInput!]!) {
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

  const metafields = [
    {
      ownerId: bundleVariantId,
      namespace: "$app",
      key: 'component_reference',
      type: "list.variant_reference",
      value: JSON.stringify(componentReferences)
    },
    {
      ownerId: bundleVariantId,
      namespace: "$app",
      key: 'component_quantities',
      type: "list.number_integer",
      value: JSON.stringify(componentQuantities)
    },
    {
      ownerId: bundleVariantId,
      namespace: "$app",
      key: 'price_adjustment',
      type: "json",
      value: JSON.stringify(priceAdjustment)
    },
    {
      ownerId: bundleVariantId,
      namespace: "$app",
      key: 'bundle_ui_config',
      type: "json",
      value: JSON.stringify(bundleUiConfig)
    }
  ];

  const response = await admin.graphql(SET_METAFIELDS, {
    variables: { metafields }
  });

  const data = await response.json();

  console.log("📡 [METAFIELD] GraphQL response received");
  console.log("✅ [METAFIELD] Metafields set:", data.data?.metafieldsSet?.metafields?.length || 0);

  // DEBUG: Log the actual value returned for bundle_ui_config
  const bundleConfigMetafield = data.data?.metafieldsSet?.metafields?.find((m: any) => m.key === 'bundle_ui_config');
  if (bundleConfigMetafield) {
    console.log("🔍 [METAFIELD_DEBUG] bundle_ui_config value type:", typeof bundleConfigMetafield.value);
    console.log("🔍 [METAFIELD_DEBUG] bundle_ui_config value (first 200 chars):", bundleConfigMetafield.value.substring(0, 200));
    console.log("🔍 [METAFIELD_DEBUG] Is valid JSON?", (() => {
      try {
        JSON.parse(bundleConfigMetafield.value);
        return "YES ✅";
      } catch (e) {
        return `NO ❌ - ${e}`;
      }
    })());
  }

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    const error = data.data.metafieldsSet.userErrors[0];
    console.error("❌ [METAFIELD] Set error:", error);
    throw new Error(`Failed to update bundle metafields: ${error.message}`);
  }

  console.log("🎉 [METAFIELD] Bundle variant metafields updated successfully");
  console.log("📊 [METAFIELD] Summary:");
  console.log("   - component_reference:", componentReferences.length, "variants");
  console.log("   - component_quantities:", componentQuantities.length, "values");
  console.log("   - price_adjustment: method =", priceAdjustment.method, ", value =", priceAdjustment.value);
  console.log("   - bundle_ui_config:", bundleUiConfig.steps.length, "steps");

  return data.data?.metafieldsSet?.metafields;
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
    console.log(`📏 [CART_TRANSFORM_METAFIELD] Size optimization: ${originalSize} → ${optimizedSize} chars (${Math.round((1 - optimizedSize / originalSize) * 100)}% reduction)`);
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
 * Updates component product variants with component_parents metafield (Shopify Standard)
 *
 * Sets component_parents metafield on each component product's first variant
 * to track which bundles they belong to.
 */
export async function updateComponentProductMetafields(admin: any, bundleProductId: string, bundleConfig: any) {
  console.log("🔧 [COMPONENT_METAFIELD] Setting component_parents on component variants (Shopify Standard)");

  if (!bundleConfig.steps || bundleConfig.steps.length === 0) {
    console.log("🔧 [COMPONENT_METAFIELD] No steps found in bundle config");
    return;
  }

  // Get the bundle product's first variant ID to use as the parent ID
  const bundleVariantResult = await getFirstVariantId(admin, bundleProductId);

  if (!bundleVariantResult.success || !bundleVariantResult.variantId) {
    console.error(`❌ [COMPONENT_METAFIELD] Cannot update components: ${bundleVariantResult.error || 'bundle variant not found'}`);
    return;
  }

  const bundleVariantId = bundleVariantResult.variantId;
  console.log("🔧 [COMPONENT_METAFIELD] Bundle variant ID:", bundleVariantId);

  // Extract component references and quantities
  const componentReferences: string[] = [];
  const componentQuantities: number[] = [];
  const componentVariantIds = new Set<string>();

  for (const step of bundleConfig.steps) {
    // Handle StepProduct entries
    if (step.StepProduct && Array.isArray(step.StepProduct)) {
      for (const stepProduct of step.StepProduct) {
        if (stepProduct.productId) {
          // Skip UUID products
          if (isUUID(stepProduct.productId)) {
            console.warn(`⚠️ [COMPONENT_METAFIELD] Skipping UUID product ID: ${stepProduct.productId}`);
            continue;
          }

          // Get the actual first variant ID
          const result = await getFirstVariantId(admin, stepProduct.productId);
          if (result.success && result.variantId) {
            componentReferences.push(result.variantId);
            componentQuantities.push(step.minQuantity || 1);
            componentVariantIds.add(result.variantId);
          } else {
            console.warn(`⚠️ [COMPONENT_METAFIELD] Could not get variant: ${result.error}`);
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
            componentVariantIds.add(result.variantId);
          } else {
            console.warn(`⚠️ [COMPONENT_METAFIELD] Could not get variant: ${result.error}`);
          }
        }
      }
    }
  }

  console.log(`🔧 [COMPONENT_METAFIELD] Found ${componentVariantIds.size} component variants to update`);

  // Create component_parents data in Shopify standard format
  const componentParentsData = [{
    id: bundleVariantId,
    component_reference: {
      value: componentReferences
    },
    component_quantities: {
      value: componentQuantities
    }
  }];

  console.log("🔧 [COMPONENT_METAFIELD] Component parents data:", JSON.stringify(componentParentsData, null, 2));

  // Update each component variant
  for (const variantId of componentVariantIds) {
    try {
      console.log(`🔧 [COMPONENT_METAFIELD] Updating variant: ${variantId}`);

      const SET_METAFIELDS = `
        mutation SetComponentMetafields($metafields: [MetafieldsSetInput!]!) {
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
        variables: {
          metafields: [
            {
              ownerId: variantId,
              namespace: "$app",
              key: "component_parents",
              value: JSON.stringify(componentParentsData),
              type: "json"
            }
          ]
        }
      });

      const data = await response.json();
      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        console.error(`🔧 [COMPONENT_METAFIELD] Error updating variant ${variantId}:`, data.data.metafieldsSet.userErrors);
      } else {
        console.log(`🔧 [COMPONENT_METAFIELD] Successfully updated variant ${variantId}`);
      }
    } catch (error) {
      console.error(`🔧 [COMPONENT_METAFIELD] Failed to update variant ${variantId}:`, error);
    }
  }

  console.log("🎉 [COMPONENT_METAFIELD] Finished updating component variants");
}
