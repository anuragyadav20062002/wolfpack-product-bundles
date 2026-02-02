/**
 * Component Product Metafield Operations
 *
 * Updates component product variants with component_parents metafield
 */

import { isUUID } from "../../../../utils/shopify-validators";
import { getFirstVariantId, batchGetFirstVariants } from "../../../../utils/variant-lookup.server";
import { AppLogger } from "../../../../lib/logger";
import { checkMetafieldSize } from "../utils/size-check";
import type { PriceAdjustment, ComponentParentsData } from "../types";

/**
 * Updates component product variants with component_parents metafield (Shopify Standard)
 *
 * Sets component_parents metafield on each component product's first variant
 * to track which bundles they belong to.
 */
export async function updateComponentProductMetafields(
  admin: any,
  bundleProductId: string,
  bundleConfig: any
): Promise<void> {
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

  // PERFORMANCE OPTIMIZATION: Collect all product IDs first, then batch fetch variants
  const productIdMap: Array<{ productId: string; stepMinQuantity: number; source: string }> = [];

  for (const step of bundleConfig.steps) {
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
          console.warn(`⚠️ [COMPONENT_METAFIELD] Skipping UUID product ID: ${stepProduct.productId}`);
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
    }
  }

  // Batch fetch all variants in a single query
  if (productIdMap.length > 0) {
    const productIds = productIdMap.map(item => item.productId);
    console.log(`[COMPONENT_METAFIELD] Batch fetching variants for ${productIds.length} products`);

    const variantResults = await batchGetFirstVariants(admin, productIds);

    // Process results in order
    productIdMap.forEach(item => {
      const cleanId = item.productId.replace('gid://shopify/Product/', '');
      const result = variantResults.get(cleanId);

      if (result?.success && result.variantId) {
        componentReferences.push(result.variantId);
        componentQuantities.push(item.stepMinQuantity);
        componentVariantIds.add(result.variantId);
      } else {
        AppLogger.warn("Could not get variant for component product", {
          component: "metafield-sync",
          operation: "updateComponentProductMetafields",
          productId: item.productId,
          error: result?.error || 'unknown error'
        });
      }
    });
  }

  console.log(`🔧 [COMPONENT_METAFIELD] Found ${componentVariantIds.size} component variants to update`);

  // Build price_adjustment config for MERGE discount calculation
  const priceAdjustment: PriceAdjustment = {
    method: bundleConfig.pricing?.method, // Use global method as primary source
    value: 0
  };

  if (bundleConfig.pricing?.enabled && bundleConfig.pricing?.rules?.length > 0) {
    const rule = bundleConfig.pricing.rules[0];

    // Extract value from discount structure
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

  console.log("🔧 [COMPONENT_METAFIELD] Price adjustment for components:", JSON.stringify(priceAdjustment));
  console.log("🔧 [COMPONENT_METAFIELD] Pricing method:", priceAdjustment.method);
  console.log("🔧 [COMPONENT_METAFIELD] Pricing value:", priceAdjustment.value);
  console.log("🔧 [COMPONENT_METAFIELD] Has conditions:", !!priceAdjustment.conditions);

  // Create component_parents data in Shopify standard format with pricing info
  const componentParentsData: ComponentParentsData[] = [{
    id: bundleVariantId,
    component_reference: {
      value: componentReferences
    },
    component_quantities: {
      value: componentQuantities
    },
    price_adjustment: priceAdjustment // Include pricing for cart transform MERGE discount calculation
  }];

  console.log("🔧 [COMPONENT_METAFIELD] Component parents data structure:");
  console.log("   - Bundle variant ID:", bundleVariantId);
  console.log("   - Component references:", componentReferences.length);
  console.log("   - Component quantities:", componentQuantities);
  console.log("   - Price adjustment:", JSON.stringify(priceAdjustment));
  console.log("🔧 [COMPONENT_METAFIELD] Full component_parents JSON:", JSON.stringify(componentParentsData, null, 2));

  // Check metafield size before updating components
  const componentParentsSizeCheck = checkMetafieldSize(componentParentsData, 'component_parents', 'updateComponentProductMetafields');

  // Abort if metafield exceeds size limit
  if (!componentParentsSizeCheck.withinLimit) {
    throw new Error(`component_parents metafield exceeds Shopify's 64KB limit (size: ${componentParentsSizeCheck.size} bytes). Bundle has too many component products.`);
  }

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
