/**
 * Metafield Definition Operations
 *
 * Creates and ensures metafield definitions exist in Shopify
 */

import { METAFIELD_NAMESPACE, METAFIELD_KEYS } from "../../../../constants/metafields";

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
      namespace: METAFIELD_NAMESPACE,
      key: METAFIELD_KEYS.COMPONENT_REFERENCE,
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
      namespace: METAFIELD_NAMESPACE,
      key: METAFIELD_KEYS.COMPONENT_QUANTITIES,
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
      namespace: METAFIELD_NAMESPACE,
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
      namespace: METAFIELD_NAMESPACE,
      key: METAFIELD_KEYS.BUNDLE_UI_CONFIG,
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
      namespace: METAFIELD_NAMESPACE,
      key: METAFIELD_KEYS.COMPONENT_PARENTS,
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
      namespace: METAFIELD_NAMESPACE,
      key: METAFIELD_KEYS.COMPONENT_PRICING,
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

/**
 * Ensures the PAGE-level bundle_id metafield definition exists with PUBLIC_READ storefront access.
 *
 * Without this definition, `page.metafields['$app'].bundle_id` returns null in Liquid even
 * if the metafield value has been set via metafieldsSet. Shopify requires a MetafieldDefinition
 * with storefront: PUBLIC_READ for the value to be readable in theme extensions.
 *
 * If the definition already exists (TAKEN), this function also updates it to ensure
 * storefront: PUBLIC_READ is set — in case it was originally created without that access.
 *
 * Called during afterAuth and whenever a full-page bundle page is created.
 */
/**
 * Ensure a PAGE metafield definition exists for custom:bundle_id with PUBLIC_READ access.
 * The 'custom' namespace is readable in Liquid via page.metafields.custom.bundle_id
 * (unlike '$app' which expands to an internal namespace and is unreliable in Liquid).
 */
export async function ensureCustomPageBundleIdDefinition(admin: any): Promise<boolean> {
  // NOTE: The 'custom' namespace does not support setting storefront access via the API —
  // Shopify makes custom namespace metafields readable in Liquid by default without any
  // definition. We create the definition only for type safety and admin UI labelling.
  const CREATE_DEF = `
    mutation CreateCustomPageBundleIdDef($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id }
        userErrors { field message code }
      }
    }
  `;

  try {
    const response = await admin.graphql(CREATE_DEF, {
      variables: {
        definition: {
          name: "Bundle ID",
          namespace: "custom",
          key: "bundle_id",
          description: "Links a Shopify page to a full-page bundle in the app",
          type: "single_line_text_field",
          ownerType: "PAGE",
        }
      }
    });

    const data = await response.json();
    const errors = data.data?.metafieldDefinitionCreate?.userErrors ?? [];

    if (errors.length > 0) {
      const error = errors[0];
      if (error.code === "TAKEN") {
        console.log("✓ [METAFIELD_DEF] custom:bundle_id PAGE definition already exists");
      } else {
        console.error("❌ [METAFIELD_DEF] Error creating custom:bundle_id definition:", error);
      }
    } else {
      console.log("✓ [METAFIELD_DEF] Created custom:bundle_id PAGE definition");
    }
  } catch (error) {
    console.error("❌ [METAFIELD_DEF] Failed to create custom:bundle_id definition:", error);
  }

  return true;
}

export async function ensurePageBundleIdMetafieldDefinition(admin: any): Promise<boolean> {
  const CREATE_METAFIELD_DEFINITION = `
    mutation CreatePageMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const QUERY_METAFIELD_DEFINITION = `
    query GetPageBundleIdDefinition {
      metafieldDefinitions(ownerType: PAGE, namespace: "$app", key: "bundle_id", first: 1) {
        edges {
          node {
            id
            access {
              storefront
            }
          }
        }
      }
    }
  `;

  const UPDATE_METAFIELD_DEFINITION = `
    mutation UpdatePageMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!, $id: ID!) {
      metafieldDefinitionUpdate(definition: $definition, id: $id) {
        updatedDefinition {
          id
          access {
            storefront
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(CREATE_METAFIELD_DEFINITION, {
      variables: {
        definition: {
          name: "Bundle ID",
          namespace: "$app",
          key: "bundle_id",
          description: "Full-page bundle ID — links a Shopify page to a bundle in the app",
          type: "single_line_text_field",
          ownerType: "PAGE",
          access: {
            admin: "MERCHANT_READ_WRITE",
            storefront: "PUBLIC_READ"  // CRITICAL: Required for Liquid to read page.metafields['$app'].bundle_id
          }
        }
      }
    });

    const data = await response.json();
    const errors = data.data?.metafieldDefinitionCreate?.userErrors ?? [];

    if (errors.length > 0) {
      const error = errors[0];
      if (error.code === "TAKEN") {
        // Definition already exists — query it and ensure storefront access is PUBLIC_READ.
        // If it was originally created without PUBLIC_READ, Liquid will silently return null.
        console.log("[METAFIELD_DEF] PAGE bundle_id definition already exists — verifying storefront access...");

        const queryResponse = await admin.graphql(QUERY_METAFIELD_DEFINITION);
        const queryData = await queryResponse.json();
        const existingDef = queryData.data?.metafieldDefinitions?.edges?.[0]?.node;

        if (!existingDef) {
          console.warn("⚠️ [METAFIELD_DEF] Could not query existing PAGE bundle_id definition");
          return true;
        }

        const currentStorefrontAccess = existingDef.access?.storefront;
        if (currentStorefrontAccess === "PUBLIC_READ") {
          console.log("✓ [METAFIELD_DEF] PAGE bundle_id definition already has PUBLIC_READ storefront access");
          return true;
        }

        // Access is not PUBLIC_READ — update it
        console.log(`[METAFIELD_DEF] PAGE bundle_id storefront access is '${currentStorefrontAccess}' — updating to PUBLIC_READ...`);
        const updateResponse = await admin.graphql(UPDATE_METAFIELD_DEFINITION, {
          variables: {
            id: existingDef.id,
            definition: {
              access: {
                admin: "MERCHANT_READ_WRITE",
                storefront: "PUBLIC_READ"
              }
            }
          }
        });
        const updateData = await updateResponse.json();
        const updateErrors = updateData.data?.metafieldDefinitionUpdate?.userErrors ?? [];
        if (updateErrors.length > 0) {
          console.error("❌ [METAFIELD_DEF] Failed to update PAGE bundle_id storefront access:", updateErrors[0]);
        } else {
          console.log("✓ [METAFIELD_DEF] Updated PAGE bundle_id definition to PUBLIC_READ storefront access");
        }
      } else {
        console.error("❌ [METAFIELD_DEF] Error creating PAGE bundle_id definition:", error);
      }
    } else {
      console.log("✓ [METAFIELD_DEF] Created PAGE bundle_id definition with PUBLIC_READ storefront access");
    }
  } catch (error) {
    console.error("❌ [METAFIELD_DEF] Failed to create PAGE bundle_id definition:", error);
  }

  return true;
}
