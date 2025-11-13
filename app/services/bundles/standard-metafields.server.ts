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

// Cache to prevent redundant definition checks
let metafieldDefinitionsChecked = false;

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
  admin: any,
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

          // Check if this is a UUID (old data that needs migration)
          if (isUUID(stepProduct.productId)) {
            const error = `Legacy UUID product ID (needs data migration to Shopify product ID)`;
            console.warn(`⚠️ [STANDARD_METAFIELD] ${error}: ${stepProduct.productId} - Product: ${stepProduct.title}`);
            errors.push({
              productId: stepProduct.productId,
              title: stepProduct.title || 'Unknown Product',
              error,
              step: stepName
            });
            continue; // Skip UUID products entirely
          }

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
      standardMetafields.component_reference = componentReferences; // Array of GIDs for list.product_reference
      standardMetafields.component_quantities = componentQuantities; // Array of integers for list.number_integer
      console.log("✅ [STANDARD_METAFIELD] Component references:", componentReferences);
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
        standardMetafields.price_adjustment = parseFloat(rule.discount.value) || 0;
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

  // Ensure metafield definitions exist for the custom namespace
  await ensureStandardMetafieldDefinitions(admin);

  const metafieldsToSet: any[] = [];

  // Add each standard metafield with correct types and formats
  // CRITICAL: All metafield values must be JSON-encoded strings in Shopify GraphQL
  Object.keys(standardMetafields).forEach(key => {
    if (standardMetafields[key] !== null && standardMetafields[key] !== undefined) {
      let value = standardMetafields[key];
      let type = 'json'; // Default fallback

      // Use proper types for each metafield with correct value formats
      switch(key) {
        case 'component_reference':
          type = 'list.product_reference';
          // For list.product_reference, Shopify expects a JSON array string of GIDs
          // BUT the GIDs must be valid product variant references
          if (Array.isArray(value)) {
            // Validate that all entries are proper Shopify GIDs
            const validGids = value.filter(gid =>
              typeof gid === 'string' && gid.startsWith('gid://shopify/ProductVariant/')
            );
            if (validGids.length === 0) {
              console.warn(`⚠️ [STANDARD_METAFIELD] Skipping component_reference - no valid GIDs found`);
              return; // Skip this metafield entirely
            }
            value = JSON.stringify(validGids);
          } else {
            console.warn(`⚠️ [STANDARD_METAFIELD] Skipping component_reference - invalid value type`);
            return;
          }
          break;
        case 'component_quantities':
          type = 'list.number_integer';
          // For list types, value must be JSON-encoded array string
          value = JSON.stringify(Array.isArray(value) ? value : []);
          break;
        case 'component_parents':
          type = 'json';
          // Ensure it's a JSON string
          value = typeof value === 'string' ? value : JSON.stringify(value);
          break;
        case 'price_adjustment':
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

/**
 * Ensure standard metafield definitions exist
 */
export async function ensureStandardMetafieldDefinitions(admin: any) {
  // Skip if we've already checked/created definitions in this session
  if (metafieldDefinitionsChecked) {
    console.log("🔧 [STANDARD_METAFIELD] Definitions already verified this session, skipping");
    return;
  }

  console.log("🔧 [STANDARD_METAFIELD] Checking if definitions exist in app-reserved namespace");

  // Use app-reserved namespace to avoid type conflicts with existing custom namespace definitions
  const standardDefinitions = [
    {
      namespace: "$app",
      key: "bundle_config",
      name: "Bundle Configuration",
      description: "Complete bundle configuration for storefront display",
      type: "json",
      ownerType: "PRODUCT",
      access: {
        storefront: "PUBLIC_READ"
      }
    },
    // Bundle isolation metafields - MUST have storefront access for Liquid template to read them
    {
      namespace: "$app:bundle_isolation",
      key: "bundle_product_type",
      name: "Bundle Product Type",
      description: "Identifies the type of bundle product (cart_transform_bundle)",
      type: "single_line_text_field",
      ownerType: "PRODUCT",
      access: {
        storefront: "PUBLIC_READ"
      }
    },
    {
      namespace: "$app:bundle_isolation",
      key: "owns_bundle_id",
      name: "Owns Bundle ID",
      description: "The ID of the bundle this product owns/contains",
      type: "single_line_text_field",
      ownerType: "PRODUCT",
      access: {
        storefront: "PUBLIC_READ"
      }
    },
    {
      namespace: "$app:bundle_isolation",
      key: "isolation_created",
      name: "Isolation Created Timestamp",
      description: "Timestamp when bundle isolation was set up",
      type: "single_line_text_field",
      ownerType: "PRODUCT",
      access: {
        storefront: "PUBLIC_READ"
      }
    },
    {
      namespace: "$app", // App-reserved namespace avoids conflicts
      key: "component_reference",
      name: "Component Reference",
      description: "Bundle component variant IDs",
      type: "list.product_reference",
      ownerType: "PRODUCT",
      access: {
        storefront: "PUBLIC_READ"
      }
    },
    {
      namespace: "$app",
      key: "component_quantities",
      name: "Component Quantities",
      description: "Bundle component quantities",
      type: "list.number_integer",
      ownerType: "PRODUCT",
      access: {
        storefront: "PUBLIC_READ"
      }
    },
    {
      namespace: "$app",
      key: "component_parents",
      name: "Component Parents",
      description: "Bundle parent configurations",
      type: "json",
      ownerType: "PRODUCT",
      access: {
        storefront: "PUBLIC_READ"
      }
    },
    {
      namespace: "$app",
      key: "price_adjustment",
      name: "Price Adjustment",
      description: "Bundle price adjustment configuration",
      type: "number_decimal",
      ownerType: "PRODUCT",
      access: {
        storefront: "PUBLIC_READ"
      }
    }
  ];

  // First, check if definitions already exist
  const CHECK_DEFINITIONS = `
    query checkMetafieldDefinitions {
      metafieldDefinitions(first: 20, ownerType: PRODUCT, namespace: "$app") {
        edges {
          node {
            id
            key
            namespace
            access {
              admin
              storefront
            }
          }
        }
      }
    }
  `;

  try {
    const checkResponse = await admin.graphql(CHECK_DEFINITIONS);
    const checkData = await checkResponse.json();

    console.log(`🔧 [STANDARD_METAFIELD] Check definitions response:`, JSON.stringify(checkData, null, 2));

    const existingKeys = checkData.data?.metafieldDefinitions?.edges?.map((edge: any) => edge.node.key) || [];

    console.log(`🔧 [STANDARD_METAFIELD] Found ${existingKeys.length} existing definitions:`, existingKeys);

    // Create or update definitions as needed
    for (const definition of standardDefinitions) {
      // Check if this definition already exists
      const existingDef = checkData.data?.metafieldDefinitions?.edges?.find(
        (edge: any) => edge.node.key === definition.key
      )?.node;

      if (existingDef) {
        // Check if existing definition has the correct storefront access
        const hasCorrectAccess = definition.access?.storefront
          ? existingDef.access?.storefront === definition.access.storefront
          : true; // No access requirement, existing def is fine

        if (hasCorrectAccess) {
          console.log(`🔧 [STANDARD_METAFIELD] Definition for ${definition.key} already exists with correct access, skipping`);
          continue;
        }

        // Need to update the definition to add storefront access
        console.log(`🔧 [STANDARD_METAFIELD] Updating definition for ${definition.key} to add storefront access`);

        try {
          const UPDATE_METAFIELD_DEFINITION = `
            mutation updateMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) {
              metafieldDefinitionUpdate(definition: $definition) {
                updatedDefinition {
                  id
                  name
                  namespace
                  key
                  access {
                    admin
                    storefront
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          const updateResponse = await admin.graphql(UPDATE_METAFIELD_DEFINITION, {
            variables: {
              definition: {
                id: existingDef.id,
                access: definition.access
              }
            }
          });

          const updateData = await updateResponse.json();
          console.log(`🔧 [STANDARD_METAFIELD] Update response for ${definition.key}:`, JSON.stringify(updateData, null, 2));

          if (updateData.data?.metafieldDefinitionUpdate?.userErrors?.length > 0) {
            console.log(`🔧 [STANDARD_METAFIELD] Error updating definition for ${definition.key}:`,
              updateData.data.metafieldDefinitionUpdate.userErrors);
          } else {
            console.log(`🔧 [STANDARD_METAFIELD] ✅ Updated definition for ${definition.key} with storefront access`);
          }
        } catch (error) {
          console.log(`🔧 [STANDARD_METAFIELD] Error updating definition for ${definition.key}:`, error);
        }

        continue;
      }

      // Definition doesn't exist, create it
      try {
        const CREATE_METAFIELD_DEFINITION = `
          mutation createMetafieldDefinition($definition: MetafieldDefinitionInput!) {
            metafieldDefinitionCreate(definition: $definition) {
              createdDefinition {
                id
                name
                namespace
                key
                type {
                  name
                }
                access {
                  admin
                  storefront
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        console.log(`🔧 [STANDARD_METAFIELD] Creating definition for ${definition.key}:`, JSON.stringify(definition, null, 2));

        const response = await admin.graphql(CREATE_METAFIELD_DEFINITION, {
          variables: { definition }
        });

        const data = await response.json();
        console.log(`🔧 [STANDARD_METAFIELD] Response for ${definition.key}:`, JSON.stringify(data, null, 2));

        if (data.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
          const errors = data.data.metafieldDefinitionCreate.userErrors;
          // Only log if it's not a "already exists" error
          const isAlreadyExistsError = errors.some((e: any) => e.message.includes("in use"));
          if (!isAlreadyExistsError) {
            console.log(`🔧 [STANDARD_METAFIELD] Definition error for ${definition.key}:`, errors);
          } else {
            console.log(`🔧 [STANDARD_METAFIELD] Definition for ${definition.key} already exists (expected)`);
          }
        } else {
          const createdDef = data.data?.metafieldDefinitionCreate?.createdDefinition;
          console.log(`🔧 [STANDARD_METAFIELD] ✅ Created definition for ${definition.key} in $app namespace`);
          console.log(`🔧 [STANDARD_METAFIELD] Definition ID: ${createdDef?.id}, Storefront Access: ${createdDef?.access?.storefront}`);
        }
      } catch (error) {
        console.log(`🔧 [STANDARD_METAFIELD] Error creating definition for ${definition.key}:`, error);
      }
    }

    // Mark as checked so we don't repeat this on every save
    metafieldDefinitionsChecked = true;
  } catch (error) {
    console.error("🔧 [STANDARD_METAFIELD] Error checking definitions:", error);
  }
}
