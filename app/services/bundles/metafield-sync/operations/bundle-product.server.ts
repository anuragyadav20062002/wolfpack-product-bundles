/**
 * Bundle Product Metafield Operations
 *
 * Updates bundle variant metafields with Shopify Standard structure
 */

import { isUUID } from "../../../../utils/shopify-validators";
import { getFirstVariantId, batchGetFirstVariantsWithPrices } from "../../../../utils/variant-lookup.server";
import { AppLogger } from "../../../../lib/logger";
import { checkMetafieldSize } from "../utils/size-check";
import { calculateComponentPricing } from "../utils/pricing";
import type { PriceAdjustment, BundleUiConfig, ComponentPricing } from "../types";
import { BundleStatus, BundleType } from "../../../../constants/bundle";

/**
 * Updates bundle variant metafields with Shopify Standard structure (Approach 1: Hybrid)
 *
 * Creates 5 metafields on the bundle product's first variant:
 * - component_reference (list.variant_reference) - Shopify standard
 * - component_quantities (list.number_integer) - Shopify standard
 * - price_adjustment (json) - Shopify standard with our extension
 * - bundle_ui_config (json) - Custom for widget configuration
 * - component_pricing (json) - Per-component pricing for expanded checkout display (cents)
 */
export async function updateBundleProductMetafields(
  admin: any,
  bundleProductId: string,
  bundleConfiguration: any
): Promise<any[] | undefined> {
  AppLogger.debug("[METAFIELD] Starting bundle variant metafield update", {
    component: "bundle-product.server",
    bundleProductId,
    configSize: JSON.stringify(bundleConfiguration).length,
  });

  // Get the first variant ID for the bundle product
  const variantResult = await getFirstVariantId(admin, bundleProductId);
  if (!variantResult.success || !variantResult.variantId) {
    throw new Error(`Cannot update bundle metafields: ${variantResult.error || 'variant not found'}`);
  }

  const bundleVariantId = variantResult.variantId;

  // Extract component references and quantities from bundle configuration
  const componentReferences: string[] = [];
  const componentQuantities: number[] = [];

  // PERFORMANCE OPTIMIZATION: Collect all product IDs first, then batch fetch variants
  const productIdMap: Array<{ productId: string; stepMinQuantity: number; source: string }> = [];

  if (bundleConfiguration.steps && Array.isArray(bundleConfiguration.steps)) {
    for (const step of bundleConfiguration.steps) {
      // CRITICAL FIX: Process ONLY ONE source to prevent duplicates
      // Priority: StepProduct (database relation) > products array (UI config)

      if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
        // Use StepProduct entries from database
        for (const stepProduct of step.StepProduct) {
          if (stepProduct.productId && !isUUID(stepProduct.productId)) {
            productIdMap.push({
              productId: stepProduct.productId,
              stepMinQuantity: step.minQuantity || 1,
              source: 'StepProduct'
            });
          } else if (stepProduct.productId) {
            AppLogger.warn("[METAFIELD] Skipping UUID product ID", {
              component: "bundle-product.server",
              productId: stepProduct.productId,
            });
          }
        }
      } else if (step.products && Array.isArray(step.products) && step.products.length > 0) {
        // Fallback: Use products array from UI config (only if StepProduct is empty)
        for (const product of step.products) {
          if (product.id && !isUUID(product.id)) {
            productIdMap.push({
              productId: product.id,
              stepMinQuantity: step.minQuantity || 1,
              source: 'products'
            });
          }
        }
      } else {
        AppLogger.warn("[METAFIELD] Step has no StepProduct entries", {
          component: "bundle-product.server",
          stepName: step.name,
        });
      }

      // COLLECTION FIX: Also fetch products from collection handles
      // Collections are stored as JSON array of { id, handle, title } in step.collections
      const stepCollections = Array.isArray(step.collections)
        ? step.collections
        : [];

      if (stepCollections.length > 0) {
        for (const collection of stepCollections) {
          const handle = collection.handle;
          if (!handle) continue;

          try {
            const collResponse = await admin.graphql(`
              query getCollectionProductIds($handle: String!) {
                collection(handle: $handle) {
                  products(first: 250) {
                    edges {
                      node { id }
                    }
                  }
                }
              }
            `, { variables: { handle } });

            const collData = await collResponse.json();
            const collProductEdges = collData.data?.collection?.products?.edges || [];

            for (const edge of collProductEdges) {
              const productId = edge.node?.id;
              if (productId && !isUUID(productId)) {
                // Avoid duplicates already added from StepProduct
                const alreadyAdded = productIdMap.some(item => item.productId === productId);
                if (!alreadyAdded) {
                  productIdMap.push({
                    productId,
                    stepMinQuantity: step.minQuantity || 1,
                    source: `collection:${handle}`
                  });
                }
              }
            }

            AppLogger.debug("[METAFIELD] Fetched products from collection", {
              component: "bundle-product.server",
              handle,
              count: collProductEdges.length,
            });
          } catch (collError) {
            AppLogger.warn("Could not fetch products from collection", {
              component: "metafield-sync",
              operation: "updateBundleProductMetafields",
              handle,
            });
          }
        }
      }
    }
  }

  // Batch fetch all variants WITH PRICES in a single query (for component pricing)
  // Array to collect component data for pricing calculation
  const componentPricingData: Array<{ variantId: string; priceCents: number; quantity: number; title?: string }> = [];

  if (productIdMap.length > 0) {
    const productIds = productIdMap.map(item => item.productId);
    AppLogger.debug("[METAFIELD] Batch fetching variants with prices", {
      component: "bundle-product.server",
      count: productIds.length,
    });

    const variantResults = await batchGetFirstVariantsWithPrices(admin, productIds);

    // Process results in order
    productIdMap.forEach(item => {
      const cleanId = item.productId.replace('gid://shopify/Product/', '');
      const result = variantResults.get(cleanId);

      if (result?.success && result.variantId) {
        componentReferences.push(result.variantId);
        componentQuantities.push(item.stepMinQuantity);

        // Collect pricing data for component_pricing calculation
        componentPricingData.push({
          variantId: result.variantId,
          priceCents: result.priceCents || 0,
          quantity: item.stepMinQuantity,
          title: result.title
        });
      } else {
        AppLogger.warn("Could not get variant for bundle product", {
          component: "metafield-sync",
          operation: "updateBundleProductMetafields",
          productId: item.productId,
          error: result?.error || 'unknown error'
        });
      }
    });
  }

  // Build price_adjustment config (Shopify standard with extensions)
  const priceAdjustment: PriceAdjustment = {
    method: bundleConfiguration.pricing?.method || 'percentage_off',
    value: 0
  };

  if (bundleConfiguration.pricing?.enabled && bundleConfiguration.pricing?.rules?.length > 0) {
    const rule = bundleConfiguration.pricing.rules[0];

    // Extract method and value from nested discount structure
    if (rule.discount) {
      // Use discount.method if available, otherwise fall back to pricing.method
      priceAdjustment.method = rule.discount.method || bundleConfiguration.pricing.method;
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

  // Calculate per-component pricing for expanded bundle checkout display
  const componentPricing: ComponentPricing[] = calculateComponentPricing(
    componentPricingData,
    priceAdjustment.method,
    priceAdjustment.value
  );

  // Build bundle_ui_config for widget
  const bundleUiConfig: BundleUiConfig = {
    id: bundleConfiguration.id || bundleConfiguration.bundleId, // Widget expects 'id' field
    bundleId: bundleConfiguration.id || bundleConfiguration.bundleId, // Keep for backwards compatibility
    name: bundleConfiguration.name,
    description: bundleConfiguration.description || '',
    status: bundleConfiguration.status || BundleStatus.ACTIVE, // Widget needs this for filtering
    bundleType: bundleConfiguration.bundleType || BundleType.PRODUCT_PAGE, // Widget needs this for selection
    shopifyProductId: bundleConfiguration.shopifyProductId || null, // Product ID for matching
    fullPagePageHandle: bundleConfiguration.bundleType === BundleType.FULL_PAGE
      ? (bundleConfiguration.shopifyPageHandle || null)
      : null,
    bundleVariantId: bundleVariantId, // Bundle parent variant ID for cart transform EXPAND operation
    steps: (bundleConfiguration.steps || []).map((step: any) => ({
      id: step.id,
      name: step.name,
      position: step.position || 0,
      minQuantity: step.minQuantity || 1,
      maxQuantity: step.maxQuantity || 1,
      products: (step.StepProduct || []).map((sp: any) => ({ id: sp.productId })).filter((p: { id: string }) => p.id),
      collections: Array.isArray(step.collections) ? step.collections : [],
      conditionType: step.conditionType,
      conditionOperator: step.conditionOperator,
      conditionValue: step.conditionValue,
      conditionOperator2: step.conditionOperator2,
      conditionValue2: step.conditionValue2,
      // Free gift + default step fields — required by widget to detect step type
      // and by cart transform to tag _bundle_step_type: free_gift on line properties
      isFreeGift: step.isFreeGift || false,
      freeGiftName: step.freeGiftName || null,
      isDefault: step.isDefault || false,
      defaultVariantId: step.defaultVariantId || null,
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
          method: rule.discount.method || bundleConfiguration.pricing.method,
          value: parseFloat(rule.discount.value) || 0
        } : {
          method: bundleConfiguration.pricing.method,
          value: parseFloat(rule.discountValue) || 0
        }
      }))
    } : null,
    messaging: {
      progressTemplate: bundleConfiguration.pricing?.messages?.progress || bundleConfiguration.messaging?.progressTemplate || 'Add {conditionText} to get {discountText}',
      successTemplate: bundleConfiguration.pricing?.messages?.qualified || bundleConfiguration.messaging?.successTemplate || 'Congratulations! You got {discountText}',
      showDiscountMessaging: bundleConfiguration.pricing?.messages?.showDiscountMessaging || false,
      showFooter: bundleConfiguration.pricing?.display?.showFooter !== false && bundleConfiguration.messaging?.showFooter !== false
    },
    promoBannerBgImage: bundleConfiguration.promoBannerBgImage ?? null,
    promoBannerBgImageCrop: bundleConfiguration.promoBannerBgImageCrop ?? null,
    loadingGif: bundleConfiguration.loadingGif ?? null,
  };

  // Check metafield sizes and log warnings
  const uiConfigSizeCheck = checkMetafieldSize(bundleUiConfig, 'bundle_ui_config', 'updateBundleProductMetafields');
  const priceAdjustmentSizeCheck = checkMetafieldSize(priceAdjustment, 'price_adjustment', 'updateBundleProductMetafields');
  const componentPricingSizeCheck = checkMetafieldSize(componentPricing, 'component_pricing', 'updateBundleProductMetafields');

  // Abort if any metafield exceeds size limit
  if (!uiConfigSizeCheck.withinLimit) {
    throw new Error(`bundle_ui_config metafield exceeds Shopify's 64KB limit (size: ${uiConfigSizeCheck.size} bytes). Bundle has too many products or complex configuration.`);
  }

  if (!priceAdjustmentSizeCheck.withinLimit) {
    throw new Error(`price_adjustment metafield exceeds Shopify's 64KB limit (size: ${priceAdjustmentSizeCheck.size} bytes).`);
  }

  if (!componentPricingSizeCheck.withinLimit) {
    throw new Error(`component_pricing metafield exceeds Shopify's 64KB limit (size: ${componentPricingSizeCheck.size} bytes). Bundle has too many components.`);
  }

  // Set all 5 metafields on the bundle variant
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
    },
    {
      ownerId: bundleVariantId,
      namespace: "$app",
      key: 'component_pricing',
      type: "json",
      value: JSON.stringify(componentPricing)
    }
  ];

  const response = await admin.graphql(SET_METAFIELDS, {
    variables: { metafields }
  });

  const data = await response.json();

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    const error = data.data.metafieldsSet.userErrors[0];
    throw new Error(`Failed to update bundle metafields: ${error.message}`);
  }

  AppLogger.info("[METAFIELD] Bundle variant metafields updated", {
    component: "bundle-product.server",
    bundleProductId,
    componentCount: componentReferences.length,
    stepCount: bundleUiConfig.steps.length,
    pricingMethod: priceAdjustment.method,
  });

  return data.data?.metafieldsSet?.metafields;
}
