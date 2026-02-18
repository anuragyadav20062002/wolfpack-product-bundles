/**
 * Metafield Definition Operations
 *
 * Creates and ensures metafield definitions exist in Shopify
 */

/**
 * Ensures variant-level bundle metafield definitions exist in Shopify
 * (Shopify Standard - Approach 1: Hybrid)
 *
 * Creates 6 metafield definitions for ProductVariant owner type with access controls:
 * - component_reference (list.variant_reference) - PUBLIC_READ for cart transform
 * - component_quantities (list.number_integer) - PUBLIC_READ for cart transform
 * - price_adjustment (json) - NONE (Functions API only)
 * - bundle_ui_config (json) - PUBLIC_READ for Liquid widget
 * - component_parents (json) - PUBLIC_READ for cart transform
 * - component_pricing (json) - PUBLIC_READ for cart transform
 *
 * All definitions use:
 * - Namespace: $app (app-reserved)
 * - Admin access: MERCHANT_READ_WRITE
 * - API Version: 2025-04
 *
 * Reference: https://shopify.dev/docs/apps/build/custom-data/metafields/definitions/use-access-controls-metafields
 */
export async function ensureVariantBundleMetafieldDefinitions(admin: any): Promise<boolean> {
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
    },
    {
      name: "Component Pricing",
      namespace: "$app",
      key: "component_pricing",
      description: "Per-component pricing breakdown for expanded bundle checkout display (cents)",
      type: "json",
      ownerType: "PRODUCTVARIANT",
      access: {
        admin: "MERCHANT_READ_WRITE",
        storefront: "PUBLIC_READ"  // Required for cart transform to add pricing attributes
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
