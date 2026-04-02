/**
 * Component Product Metafield Operations
 *
 * Updates component product variants with component_parents metafield
 */

import { isUUID } from "../../../../utils/shopify-validators";
import { getFirstVariantId, batchGetFirstVariants } from "../../../../utils/variant-lookup.server";
import { AppLogger } from "../../../../lib/logger";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { checkMetafieldSize } from "../utils/size-check";
import { METAFIELD_NAMESPACE, METAFIELD_KEYS } from "../../../../constants/metafields";
import type { PriceAdjustment, ComponentParentsData } from "../types";

/**
 * Updates component product variants with component_parents metafield (Shopify Standard)
 *
 * Sets component_parents metafield on each component product's first variant
 * to track which bundles they belong to.
 */
export async function updateComponentProductMetafields(
  admin: ShopifyAdmin,
  bundleProductId: string,
  bundleConfig: any
): Promise<void> {
  AppLogger.debug("[COMPONENT_METAFIELD] Setting component_parents on component variants", {
    component: "component-product.server",
    bundleProductId,
  });

  if (!bundleConfig.steps || bundleConfig.steps.length === 0) {
    AppLogger.debug("[COMPONENT_METAFIELD] No steps found in bundle config — skipping", {
      component: "component-product.server",
      bundleProductId,
    });
    return;
  }

  // Get the bundle product's first variant ID to use as the parent ID
  const bundleVariantResult = await getFirstVariantId(admin, bundleProductId);

  if (!bundleVariantResult.success || !bundleVariantResult.variantId) {
    // CRITICAL: throw instead of returning undefined — callers use Promise.allSettled
    // and rely on rejection to detect this failure. A silent return causes the
    // "fulfilled" path to be taken even though the metafield was never written.
    throw new Error(
      `Cannot update component metafields: bundle variant not found for ${bundleProductId}. ` +
      `Error: ${bundleVariantResult.error ?? "unknown"}`
    );
  }

  const bundleVariantId = bundleVariantResult.variantId;

  // Extract component references and quantities
  const componentReferences: string[] = [];
  const componentQuantities: number[] = [];
  const componentVariantIds = new Set<string>();

  // Products that need a Shopify API call to discover their variants (no cached variant data)
  const productIdMap: Array<{ productId: string; stepMinQuantity: number; source: string }> = [];

  for (const step of bundleConfig.steps) {
    // Priority: StepProduct (database relation) > products array (UI config)

    if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
      for (const stepProduct of step.StepProduct) {
        if (!stepProduct.productId || isUUID(stepProduct.productId)) {
          if (stepProduct.productId) {
            AppLogger.warn("[COMPONENT_METAFIELD] Skipping UUID product ID", {
              component: "component-product.server",
              productId: stepProduct.productId,
            });
          }
          continue;
        }

        const dbVariants = Array.isArray(stepProduct.variants) ? stepProduct.variants : [];
        if (dbVariants.length > 0) {
          // Use ALL variant IDs already stored in the DB — no extra API call needed.
          // Writing component_parents to every variant ensures Cart Transform can apply
          // the bundle discount regardless of which variant the customer selects.
          for (const variant of dbVariants) {
            if (variant.id && !isUUID(variant.id)) {
              componentVariantIds.add(variant.id);
              componentReferences.push(variant.id);
              componentQuantities.push(step.minQuantity || 1);
            }
          }
        } else {
          // No variants cached in DB — fall back to fetching the first variant from Shopify
          productIdMap.push({
            productId: stepProduct.productId,
            stepMinQuantity: step.minQuantity || 1,
            source: 'StepProduct-fallback'
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
    }
  }

  // Batch fetch first variants only for products where no variant data was cached in the DB
  if (productIdMap.length > 0) {
    const productIds = productIdMap.map(item => item.productId);
    AppLogger.debug("[COMPONENT_METAFIELD] Batch fetching variants (no DB cache)", {
      component: "component-product.server",
      count: productIds.length,
    });

    const variantResults = await batchGetFirstVariants(admin, productIds);

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

  // Build price_adjustment config for MERGE discount calculation
  // IMPORTANT: Always provide a fallback for method to ensure cart transform works correctly
  const priceAdjustment: PriceAdjustment = {
    method: bundleConfig.pricing?.method || 'percentage_off', // Fallback to percentage_off
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

  // Check metafield size before updating components
  const componentParentsSizeCheck = checkMetafieldSize(componentParentsData, 'component_parents', 'updateComponentProductMetafields');

  // Abort if metafield exceeds size limit
  if (!componentParentsSizeCheck.withinLimit) {
    throw new Error(`component_parents metafield exceeds Shopify's 64KB limit (size: ${componentParentsSizeCheck.size} bytes). Bundle has too many component products.`);
  }

  // Update each component variant
  for (const variantId of componentVariantIds) {
    try {
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
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEYS.COMPONENT_PARENTS,
              value: JSON.stringify(componentParentsData),
              type: "json"
            }
          ]
        }
      });

      const data = await response.json();
      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        AppLogger.error("[COMPONENT_METAFIELD] Error updating variant", {
          component: "component-product.server",
          variantId,
        }, data.data.metafieldsSet.userErrors);
      }
    } catch (error) {
      AppLogger.error("[COMPONENT_METAFIELD] Failed to update variant", {
        component: "component-product.server",
        variantId,
      }, error);
    }
  }

  AppLogger.info("[COMPONENT_METAFIELD] Finished updating component variants", {
    component: "component-product.server",
    bundleProductId,
    variantCount: componentVariantIds.size,
  });
}
