/**
 * Standard Shopify Metafields Service
 *
 * Handles standard Shopify metafield operations for bundle products:
 * - Converting bundles to standard metafield format
 * - Updating product standard metafields
 * - Ensuring metafield definitions exist
 */

import { isUUID } from "../../utils/shopify-validators";
import { getFirstVariantId } from "../../utils/variant-lookup.server";
import type { ShopifyAdmin } from "../../lib/auth-guards.server";

type MetafieldError = {
  productId: string;
  title: string;
  error: string;
  step: string;
};

type ConversionResult = {
  metafields: any;
  errors: MetafieldError[];
};

/**
 * Convert bundle configuration to standard Shopify metafields
 * Returns { metafields, errors } where errors contains detailed information about failures
 */
export async function convertBundleToStandardMetafields(
  admin: ShopifyAdmin,
  bundle: any
): Promise<ConversionResult> {
  const standardMetafields: any = {};
  const errors: MetafieldError[] = [];

  // For bundle products (parent products), create component_reference and component_quantities
  if (bundle.steps && bundle.steps.length > 0) {
    const componentReferences: string[] = [];
    const componentQuantities: number[] = [];
    let totalProductsProcessed = 0;
    let successfulProducts = 0;

    // Extract all products from all steps
    for (const step of bundle.steps) {
      const stepName = step.name || step.pageTitle || `Step ${step.position || 'unknown'}`;

      if (step.StepProduct && Array.isArray(step.StepProduct)) {
        for (const stepProduct of step.StepProduct) {
          totalProductsProcessed++;

          // Get the actual first variant ID
          const result = await getFirstVariantId(admin, stepProduct.productId);
          if (result.success && result.variantId) {
            componentReferences.push(result.variantId);
            componentQuantities.push(step.minQuantity || 1);
            successfulProducts++;
          } else {
            errors.push({
              productId: result.productId,
              title: stepProduct.title || 'Unknown Product',
              error: result.error || 'Unknown error',
              step: stepName
            });
          }
        }
      }

      // Also handle products array if it exists
      if (step.products && Array.isArray(step.products)) {
        for (const product of step.products) {
          totalProductsProcessed++;
          const result = await getFirstVariantId(admin, product.id);
          if (result.success && result.variantId) {
            componentReferences.push(result.variantId);
            componentQuantities.push(step.minQuantity || 1);
            successfulProducts++;
          } else {
            errors.push({
              productId: result.productId,
              title: product.title || 'Unknown Product',
              error: result.error || 'Unknown error',
              step: stepName
            });
          }
        }
      }
    }

    console.log(`📊 [STANDARD_METAFIELD] Product Processing Summary:`);
    console.log(`   Total products: ${totalProductsProcessed}`);
    console.log(`   ✅ Successful: ${successfulProducts}`);
    console.log(`   ❌ Failed: ${errors.length}`);

    if (errors.length > 0) {
      console.error(`⚠️ [STANDARD_METAFIELD] ${errors.length} product(s) could not be processed:`);
      errors.forEach((err, idx) => {
        console.error(`   ${idx + 1}. "${err.title}" (ID: ${err.productId}) in ${err.step}: ${err.error}`);
      });
    }

    if (componentReferences.length > 0) {
      standardMetafields.componentVariants = componentReferences; // Array of variant GIDs for list.variant_reference (camelCase to match TOML)
      standardMetafields.componentQuantities = componentQuantities; // Array of integers for list.number_integer (camelCase to match TOML)
      console.log("✅ [STANDARD_METAFIELD] Component variant references:", componentReferences);
      console.log("✅ [STANDARD_METAFIELD] Component quantities:", componentQuantities);
    } else if (totalProductsProcessed > 0) {
      console.warn(`⚠️ [STANDARD_METAFIELD] No valid products found to create metafields (${totalProductsProcessed} products processed, all failed)`);
    }
  }

  // Add price adjustment if pricing is configured (NEW nested structure)
  if (bundle.pricing && bundle.pricing.enabled && bundle.pricing.rules) {
    const rules = Array.isArray(bundle.pricing.rules) ? bundle.pricing.rules : [];
    if (rules.length > 0) {
      const rule = rules[0]; // Use first rule for simplicity
      if (bundle.pricing.method === 'percentage_off' && rule.discount?.value) {
        // For number_decimal metafield type, store as number (not string)
        // Value is already 0-100 percentage in the new structure
        standardMetafields.priceAdjustment = parseFloat(rule.discount.value) || 0; // camelCase to match TOML
      }
    }
  }

  return { metafields: standardMetafields, errors };
}

/**
 * Update standard Shopify metafields on a product
 */
export async function updateProductStandardMetafields(
  admin: any,
  productId: string,
  standardMetafields: any
) {
  console.log("🔧 [STANDARD_METAFIELD] Setting standard Shopify metafields on product:", productId);
  console.log("📋 [STANDARD_METAFIELD] Metafields:", standardMetafields);

  // Metafield definitions are now managed via shopify.app.toml
  // No need to programmatically create definitions

  const metafieldsToSet: any[] = [];

  // Add each standard metafield with correct types and formats
  // CRITICAL: All metafield values must be JSON-encoded strings in Shopify GraphQL
  Object.keys(standardMetafields).forEach(key => {
    if (standardMetafields[key] !== null && standardMetafields[key] !== undefined) {
      let value = standardMetafields[key];
      let type = 'json'; // Default fallback

      // Use proper types for each metafield with correct value formats
      // CRITICAL: Keys must match TOML definitions (camelCase)
      switch (key) {
        case 'componentVariants':
          type = 'list.variant_reference';
          // For list.variant_reference, Shopify expects a JSON array string of ProductVariant GIDs
          if (Array.isArray(value)) {
            // Validate that all entries are proper Shopify ProductVariant GIDs
            const validGids = value.filter(gid =>
              typeof gid === 'string' && gid.startsWith('gid://shopify/ProductVariant/')
            );
            if (validGids.length === 0) {
              console.warn(`⚠️ [STANDARD_METAFIELD] Skipping componentVariants - no valid ProductVariant GIDs found`);
              return; // Skip this metafield entirely
            }
            value = JSON.stringify(validGids);
          } else {
            console.warn(`⚠️ [STANDARD_METAFIELD] Skipping componentVariants - invalid value type`);
            return;
          }
          break;
        case 'componentQuantities':
          type = 'list.number_integer';
          // For list types, value must be JSON-encoded array string
          value = JSON.stringify(Array.isArray(value) ? value : []);
          break;
        case 'componentParents':
          type = 'json';
          // Ensure it's a JSON string
          value = typeof value === 'string' ? value : JSON.stringify(value);
          break;
        case 'priceAdjustment':
          type = 'number_decimal';
          // Numbers must be strings
          value = typeof value === 'number' ? value.toString() : parseFloat(value || '0').toString();
          break;
        default:
          // For any other metafields, convert to JSON string
          value = typeof value === 'string' ? value : JSON.stringify(value);
      }

      metafieldsToSet.push({
        ownerId: productId,
        namespace: "$app", // Use app-reserved namespace
        key: key,
        type: type,
        value: value
      });
    }
  });

  if (metafieldsToSet.length === 0) {
    console.log("🔧 [STANDARD_METAFIELD] No standard metafields to set");
    return null;
  }

  // Log what we're about to send for debugging
  console.log("🔧 [STANDARD_METAFIELD] Setting metafields:", metafieldsToSet.map(m => ({
    key: m.key,
    type: m.type,
    valuePreview: m.type.startsWith('list.') ? `Array[${JSON.parse(m.value).length}]` : m.value.substring(0, 50)
  })));

  const SET_STANDARD_METAFIELDS = `
    mutation SetStandardMetafields($metafields: [MetafieldsSetInput!]!) {
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

  const response = await admin.graphql(SET_STANDARD_METAFIELDS, {
    variables: { metafields: metafieldsToSet }
  });

  const data = await response.json();

  // Only log errors, not the full response
  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error("🔧 [STANDARD_METAFIELD] GraphQL errors:", JSON.stringify(data.data.metafieldsSet.userErrors, null, 2));
  } else {
    console.log("🔧 [STANDARD_METAFIELD] ✅ Successfully set", data.data?.metafieldsSet?.metafields?.length || 0, "metafields");
  }

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error("🔧 [STANDARD_METAFIELD] User errors:", data.data.metafieldsSet.userErrors);
    throw new Error(`Failed to set standard metafields: ${data.data.metafieldsSet.userErrors[0].message}`);
  }

  console.log("🔧 [STANDARD_METAFIELD] Standard metafields set successfully");
  return data.data?.metafieldsSet?.metafields;
}

// NOTE: Metafield definitions are now managed declaratively via shopify.app.toml
// The ensureStandardMetafieldDefinitions() function has been removed as it's no longer needed
