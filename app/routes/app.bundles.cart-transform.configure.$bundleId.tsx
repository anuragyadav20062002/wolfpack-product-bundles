import { useState, useEffect, useCallback } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { AppLogger } from "../lib/logger";
import {
  DiscountMethod,
  ConditionType,
  ConditionOperator,
  type PricingRule,
  type PricingConfiguration,
  createNewPricingRule,
  generateRulePreview,
  centsToAmount,
  amountToCents,
} from "../types/pricing";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Icon,
  Select,
  Badge,
  TextField,
  Tabs,
  Collapsible,
  FormLayout,
  Checkbox,
  Modal,
  Thumbnail,
  List,
} from "@shopify/polaris";
import {
  ViewIcon,
  SettingsIcon,
  DragHandleIcon,
  DeleteIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExternalIcon,
  ProductIcon,
  DuplicateIcon,
  CollectionIcon,
  ListNumberedIcon,
  DiscountIcon,
  RefreshIcon,
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
// Using modern App Bridge contextual save bar with data-save-bar attribute on form
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { ThemeTemplateService } from "../services/theme-template.server";
import { BundleIsolationService } from "../services/bundle-isolation.server";
import { BundleAutoInjectionService } from "../services/bundle-auto-injection.server";

// Removed - now using standardized PricingRule from app/types/pricing

interface LoaderData {
  bundle: {
    id: string;
    name: string;
    description?: string;
    shopId: string;
    shopifyProductId?: string;
    bundleType: string;
    status: string;
    templateName?: string;
    steps: Array<{
      id: string;
      name: string;
      collections?: any;
      StepProduct?: Array<{
        id: string;
        productId: string;
        title: string;
      }>;
    }>;
    pricing?: {
      id: string;
      enabled: boolean;
      method: string;
      rules: PricingRule[] | string;
      showFooter: boolean;
      showProgressBar: boolean;
      messages: any;
    };
  };
  bundleProduct?: any;
  shop: string;
}


export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const { bundleId } = params;

  if (!bundleId) {
    throw new Response("Bundle ID is required", { status: 400 });
  }

  // Fetch the bundle with all related data
  const bundle = await db.bundle.findUnique({
    where: {
      id: bundleId,
      shopId: session.shop,
      bundleType: 'cart_transform'
    },
    include: {
      steps: {
        include: {
          StepProduct: true
        }
      },
      pricing: true
    },
  });

  if (!bundle) {
    throw new Response("Bundle not found", { status: 404 });
  }

  AppLogger.debug('Bundle loaded from database', {
    component: 'bundle-config',
    bundleId: bundle.id,
    operation: 'load'
  }, { stepsCount: bundle.steps.length });

  // Fetch bundle product data from Shopify if it exists
  let bundleProduct = null;
  if (bundle.shopifyProductId) {
    try {
      const GET_BUNDLE_PRODUCT = `
        query GetBundleProduct($id: ID!) {
          product(id: $id) {
            id
            title
            handle
            status
            onlineStoreUrl
            onlineStorePreviewUrl
            description
            productType
            vendor
            tags
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  price
                }
              }
            }
          }
        }
      `;

      const productResponse = await admin.graphql(GET_BUNDLE_PRODUCT, {
        variables: {
          id: bundle.shopifyProductId
        }
      });

      const productData = await productResponse.json();
      bundleProduct = productData.data?.product;
    } catch (error) {
      AppLogger.warn("Failed to fetch bundle product", {
        component: 'bundle-config',
        bundleId: params.bundleId,
        operation: 'fetch-product'
      }, error);
      // Don't fail the entire request if we can't fetch the product
    }
  }

  return json({
    bundle,
    bundleProduct,
    shop: session.shop,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  try {
    const { session, admin } = await authenticate.admin(request);
    const { bundleId } = params;


    if (!session?.shop) {
      return json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (!bundleId) {
      return json({ success: false, error: "Bundle ID is required" }, { status: 400 });
    }

    switch (intent) {
      case "saveBundle":
        return await handleSaveBundle(admin, session, bundleId, formData);
      case "updateBundleStatus":
        return await handleUpdateBundleStatus(admin, session, bundleId, formData);
      case "syncProduct":
        return await handleSyncProduct(admin, session, bundleId, formData);
      case "getPages":
        return await handleGetPages(admin, session);
      case "getThemeTemplates":
        return await handleGetThemeTemplates(admin, session);
      case "getCurrentTheme":
        return await handleGetCurrentTheme(admin, session);
      case "cleanupDeletedBundles":
        return await handleCleanupDeletedBundles(admin, session);
      case "ensureBundleTemplates":
        return await handleEnsureBundleTemplates(admin, session);
      default:
        return json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    AppLogger.error("Action failed", {
      component: 'bundle-config',
      operation: 'action'
    }, error);
    return json({ success: false, error: (error as Error).message || "An error occurred" }, { status: 500 });
  }
};

// Utility function for safe JSON parsing
const safeJsonParse = (value: any, defaultValue: any = []) => {
  if (!value) return defaultValue;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      AppLogger.error("JSON parse failed", {
        component: 'bundle-config',
        operation: 'json-parse'
      }, error);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Helper function to create metafield definitions if they don't exist
async function ensureBundleMetafieldDefinitions(admin: any) {
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

  // Define both metafield definitions
  const definitions = [
    {
      name: "Bundle Config",
      namespace: "$app",
      key: "bundle_config",
      description: "Bundle configuration data for cart transform and theme display",
      type: "json",
      ownerType: "PRODUCT"
    },
    {
      name: "Component Parents",
      namespace: "$app",
      key: "component_parents",
      description: "Component parent bundle references for cart transform",
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
          AppLogger.error(`Metafield definition creation failed for ${definition.key}`, {
            component: 'metafield',
            operation: 'create-definition'
          }, error);
          // Continue with other definitions even if one fails
        }
      }
    } catch (error) {
      AppLogger.error(`Error ensuring metafield definition for ${definition.key}`, {
        component: 'metafield',
        operation: 'ensure-definition'
      }, error);
      // Continue with other definitions even if one fails
    }
  }

  return true;
}

// Helper function to update bundle product metafields
async function updateBundleProductMetafields(admin: any, bundleProductId: string, bundleConfiguration: any, bundleType: 'cart_transform' | 'discount_function' = 'cart_transform') {
  const endTimer = AppLogger.startTimer('Bundle product metafield update', {
    component: 'metafield',
    operation: 'update-bundle-product'
  });

  AppLogger.info('Starting bundle product metafield update', {
    component: 'metafield',
    operation: 'update-bundle-product'
  }, {
    bundleProductId,
    bundleType,
    configSize: JSON.stringify(bundleConfiguration).length
  });

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

  const metafieldKey = bundleType === 'cart_transform' ? 'cart_transform_config' : 'discount_function_config';

  const response = await admin.graphql(SET_METAFIELDS, {
    variables: {
      metafields: [
        {
          ownerId: bundleProductId,
          namespace: "$app",
          key: "bundle_config",
          type: "json",
          value: JSON.stringify(bundleConfiguration)
        }
      ]
    }
  });

  const data = await response.json();

  AppLogger.debug('GraphQL response received', {
    component: 'metafield',
    operation: 'update-bundle-product'
  }, {
    metafieldsSet: data.data?.metafieldsSet?.metafields?.length || 0
  });

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    const error = data.data.metafieldsSet.userErrors[0];
    AppLogger.error('Metafield set failed', {
      component: 'metafield',
      operation: 'update-bundle-product'
    }, error);
    throw new Error(`Failed to update bundle metafields: ${error.message}`);
  }

  AppLogger.info('Bundle product metafields updated successfully', {
    component: 'metafield',
    operation: 'update-bundle-product'
  });

  endTimer();
  return data.data?.metafieldsSet?.metafields?.[0];
}

// Helper function to get bundle product variant ID
async function getBundleProductVariantId(admin: any, shopifyProductId: string | null): Promise<string | null> {
  if (!shopifyProductId) {
    return null;
  }

  try {
    const GET_BUNDLE_PRODUCT_VARIANT = `
      query GetBundleProductVariant($id: ID!) {
        product(id: $id) {
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(GET_BUNDLE_PRODUCT_VARIANT, {
      variables: { id: shopifyProductId }
    });

    const data = await response.json();
    const variantId = data.data?.product?.variants?.edges?.[0]?.node?.id;

    AppLogger.debug('Product variant lookup completed', {
      component: 'variant-lookup',
      operation: 'get-variant'
    }, { shopifyProductId, variantId });
    return variantId || null;
  } catch (error) {
    AppLogger.error(`Failed to get variant for product ${shopifyProductId}`, {
      component: 'variant-lookup',
      operation: 'get-variant'
    }, error);
    return null;
  }
}

// Helper function to update cart transform metafields (Shopify recommended approach)
async function updateCartTransformMetafield(admin: any, shopId: string) {
  const endTimer = AppLogger.startTimer('Cart transform metafield update', {
    component: 'cart-transform',
    operation: 'update-metafield',
    shopId
  });

  AppLogger.info('Starting cart transform metafield update', {
    component: 'cart-transform',
    operation: 'update-metafield',
    shopId
  });

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
      AppLogger.error('No cart transform found - cannot update metafields', {
        component: 'cart-transform',
        operation: 'update-metafield'
      });
      return null;
    }

    AppLogger.debug('Found cart transform ID', {
      component: 'cart-transform',
      operation: 'update-metafield'
    }, { cartTransformId });

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

    AppLogger.info('Found published bundles', {
      component: 'cart-transform',
      operation: 'update-metafield'
    }, { bundleCount: allPublishedBundles.length });

    // Create MINIMAL optimized bundle configuration for cart transform performance
    const optimizedBundleConfigs = await Promise.all(allPublishedBundles.map(async (bundle) => {
      // Extract all product IDs from bundle steps for quick lookup
      // Use Set for O(1) deduplication instead of O(n) includes() check
      const allBundleProductIdsSet = new Set<string>();
      const stepConfigs: any[] = [];

      for (const step of bundle.steps) {
        const stepProductIds: string[] = [];

        // Add products from step configuration (collections/products JSON)
        const stepProducts = safeJsonParse(step.products, []);
        const stepCollections = safeJsonParse(step.collections, []);

        stepProducts.forEach((product: any) => {
          if (product.id) {
            stepProductIds.push(product.id);
            allBundleProductIdsSet.add(product.id);
          }
        });

        // Add products from StepProduct relations
        step.StepProduct.forEach(product => {
          if (product.productId) {
            stepProductIds.push(product.productId);
            allBundleProductIdsSet.add(product.productId);
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
        bundleId: bundle.id, // Add bundleId for compatibility
        name: bundle.name,
        templateName: bundle.templateName || null,
        bundleType: bundle.bundleType, // Use bundleType instead of type
        shopifyProductId: bundle.shopifyProductId, // Add shopifyProductId
        allBundleProductIds: Array.from(allBundleProductIdsSet), // Convert Set to Array for JSON serialization
        steps: stepConfigs,
        // Essential pricing data only
        pricing: bundle.pricing ? {
          enabled: bundle.pricing.enabled,
          method: bundle.pricing.method,
          rules: safeJsonParse(bundle.pricing.rules, []).map((rule: any) => ({
            id: rule.id,
            // Use clean field structure - NO BACKWARD COMPATIBILITY
            discountType: rule.discountType,
            condition: rule.conditionOperator,
            conditionType: rule.conditionType,
            value: rule.thresholdValue,
            // Map discount values based on discount type
            discountValue: rule.discountType === 'percentage_off' ? rule.percentageDiscount : rule.amountDiscount,
            fixedBundlePrice: rule.bundleFixedPrice
          })),
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
    AppLogger.info('Bundle configuration optimized', {
      component: 'cart-transform',
      operation: 'update-metafield'
    }, {
      originalSize,
      optimizedSize,
      reductionPercent: Math.round((1 - optimizedSize / originalSize) * 100),
      bundleCount: optimizedBundleConfigs.length
    });

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
            namespace: "$app",
            key: "all_bundles",
            type: "json",
            value: JSON.stringify(optimizedBundleConfigs)
          }
        ]
      }
    });

    const data = await response.json();
    AppLogger.debug('GraphQL response received', {
      component: 'cart-transform',
      operation: 'update-metafield'
    }, { hasData: !!data.data });

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      AppLogger.error('Cart transform metafield update failed', {
        component: 'cart-transform',
        operation: 'update-metafield'
      }, data.data.metafieldsSet.userErrors);
      return null;
    }

    AppLogger.info('Cart transform metafield updated successfully', {
      component: 'cart-transform',
      operation: 'update-metafield'
    });

    endTimer();
    return data.data?.metafieldsSet?.metafields?.[0];
  } catch (error) {
    AppLogger.error('Error updating cart transform metafield', {
      component: 'cart-transform',
      operation: 'update-metafield'
    }, error);

    endTimer();
    return null;
  }
}

// Helper function to update shop-level all_bundles metafield for Liquid extension (legacy)
async function updateShopBundlesMetafield(admin: any, shopId: string) {
  const endTimer = AppLogger.startTimer('Shop bundles metafield update', {
    component: 'shop-metafield',
    operation: 'update',
    shopId
  });

  AppLogger.info('Starting shop bundles metafield update', {
    component: 'shop-metafield',
    operation: 'update',
    shopId
  });

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
      AppLogger.error('Failed to get shop global ID', {
        component: 'shop-metafield',
        operation: 'update'
      });
      return null;
    }

    const shopGlobalId = shopData.data.shop.id;

    // Get all published cart transform bundles from database
    // Force refresh by including even draft bundles with steps for debugging
    AppLogger.debug('Querying database for cart transform bundles', {
      component: 'shop-metafield',
      operation: 'update'
    });
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

    AppLogger.info('Found bundles in database', {
      component: 'shop-metafield',
      operation: 'update'
    }, { bundleCount: allBundles.length });

    // Format bundles for Liquid extension and cart transform
    let formattedBundles;
    try {
      AppLogger.debug('Starting bundle formatting with variant lookups', {
        component: 'shop-metafield',
        operation: 'update'
      });
      // OPTIMIZED: Create minimal bundle data for cart transform (87% size reduction)
      const rawFormattedBundles = await Promise.all(allBundles.map(async (bundle) => {
        const bundleParentVariantId = await getBundleProductVariantId(admin, bundle.shopifyProductId);

        return {
          // ESSENTIAL FIELDS ONLY (for cart transform)
          id: bundle.id,
          name: bundle.name, // Keep for error logging
          bundleParentVariantId: bundleParentVariantId, // CRITICAL: Required for merge operations
          pricing: bundle.pricing ? {
            enabled: bundle.pricing.enabled,
            method: bundle.pricing.method,
            rules: (Array.isArray(bundle.pricing.rules) ? bundle.pricing.rules : []).map((rule: any) => ({
              condition: rule.condition || 'gte',
              conditionType: rule.type || 'quantity', // Map type to conditionType (FIXED)
              value: rule.value || 0, // Keep as decimal - widget will convert to cents
              discountValue: rule.discountValue || rule.percentageOff || rule.fixedAmountOff,
              fixedBundlePrice: rule.fixedBundlePrice || rule.price
            }))
          } : null

          // REMOVED FOR OPTIMIZATION (87% size reduction):
          // - name, description (display-only, not needed for cart transform)
          // - status (runtime filtering, not needed in metafield)
          // - bundleType (can filter during query)
          // - shopifyProductId (redundant)
          // - steps (widget-only data, huge payload)
          // - StepProduct arrays (widget-only, images, variants)
          // - showFooter, messages (widget-only)
          // - componentProductIds (can derive from cart lines)
        };

        // REMOVED: matching data (widget-only, not needed for cart transform)
        // This further reduces payload size and eliminates dependency on steps data
      }));

      AppLogger.debug('Bundle formatting complete, validating results', {
        component: 'shop-metafield',
        operation: 'update'
      });

      // Filter out bundles with missing/invalid bundleParentVariantId
      formattedBundles = rawFormattedBundles.filter(bundle => {
        if (!bundle.bundleParentVariantId) {
          AppLogger.warn(`Skipping bundle ${bundle.id} - missing bundleParentVariantId`, {
            component: 'shop-metafield',
            operation: 'update',
            bundleId: bundle.id
          });
          return false;
        }
        return true;
      });

      AppLogger.info('Bundle filtering completed', {
        component: 'shop-metafield',
        operation: 'update'
      }, {
        validBundles: formattedBundles.length,
        totalBundles: rawFormattedBundles.length
      });

      if (formattedBundles.length === 0) {
        AppLogger.error('No valid bundles to set - all bundles have invalid/missing Shopify products', {
          component: 'shop-metafield',
          operation: 'update'
        });
        return null;
      }
    } catch (error) {
      AppLogger.error('Error during bundle formatting', {
        component: 'shop-metafield',
        operation: 'update'
      }, error);
      throw error;
    }

    // Ensure metafield definition exists before setting value
    const ENSURE_METAFIELD_DEFINITION = `
      mutation {
        metafieldDefinitionCreate(definition: {
          name: "All Bundles"
          namespace: "custom"
          key: "all_bundles"
          type: "json"
          ownerType: SHOP
          access: {
            storefront: PUBLIC_READ
          }
        }) {
          createdDefinition {
            id
            name
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      AppLogger.debug('Ensuring metafield definition exists with proper access', {
        component: 'shop-metafield',
        operation: 'update'
      });

      // First, query existing definition with more specific search
      const QUERY_METAFIELD_DEF = `
        query {
          metafieldDefinitions(ownerType: SHOP, first: 250) {
            nodes {
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
          }
        }
      `;

      const queryDefResponse = await admin.graphql(QUERY_METAFIELD_DEF);
      const queryDefData = await queryDefResponse.json();

      // Look for existing definition with multiple possible namespace formats
      const existingDef = queryDefData.data?.metafieldDefinitions?.nodes?.find(
        (def: any) => {
          // Check both $app namespace and app--[app-id] namespace formats
          const isCustomNamespace = def.namespace === "custom";
          const isCorrectKey = def.key === "all_bundles";
          const isCorrectType = def.type === "json";

          if (isCustomNamespace && isCorrectKey) {
            AppLogger.debug(`Found potential definition: ${def.namespace}.${def.key}`, {
              component: 'shop-metafield',
              operation: 'update'
            }, { type: def.type });
            return isCorrectType;
          }
          return false;
        }
      );

      AppLogger.debug('Definition search completed', {
        component: 'shop-metafield',
        operation: 'update'
      }, { found: !!existingDef });
      if (existingDef) {
        AppLogger.debug(`Found definition: ${existingDef.namespace}.${existingDef.key}`, {
          component: 'shop-metafield',
          operation: 'update'
        });
      }

      if (existingDef) {
        AppLogger.info('Found existing metafield definition', {
          component: 'shop-metafield',
          operation: 'update'
        }, {
          definitionId: existingDef.id,
          currentAccess: existingDef.access
        });

        // Check if it has PUBLIC_READ access for storefront (needed for cart transform)
        if (existingDef.access?.storefront === 'PUBLIC_READ') {
          AppLogger.info('Definition already has correct access', {
            component: 'shop-metafield',
            operation: 'update'
          });
        } else {
          AppLogger.info('Definition exists but needs access update', {
            component: 'shop-metafield',
            operation: 'update'
          });
          // Try to update the existing definition with proper access
          const UPDATE_METAFIELD_DEFINITION = `
            mutation UpdateMetafieldDefinition($id: ID!) {
              metafieldDefinitionUpdate(id: $id, definition: {
                access: {
                  storefront: PUBLIC_READ
                }
              }) {
                updatedDefinition {
                  id
                  access {
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

          try {
            const updateResponse = await admin.graphql(UPDATE_METAFIELD_DEFINITION, {
              variables: { id: existingDef.id }
            });
            const updateData = await updateResponse.json();

            if (updateData.data?.metafieldDefinitionUpdate?.updatedDefinition) {
              AppLogger.info('Definition access updated successfully', {
                component: 'shop-metafield',
                operation: 'update'
              });
            } else if (updateData.data?.metafieldDefinitionUpdate?.userErrors?.length > 0) {
              AppLogger.error('Error updating definition access', {
                component: 'shop-metafield',
                operation: 'update'
              }, updateData.data.metafieldDefinitionUpdate.userErrors[0]);
            }
          } catch (updateError) {
            AppLogger.error('Failed to update definition access', {
              component: 'shop-metafield',
              operation: 'update'
            }, updateError);
          }
        }
      } else {
        // Create new definition only if none exists
        AppLogger.info('No existing definition found, creating new one', {
          component: 'shop-metafield',
          operation: 'update'
        });

        try {
          const defResponse = await admin.graphql(ENSURE_METAFIELD_DEFINITION);
          const defData = await defResponse.json();

          if (defData.data?.metafieldDefinitionCreate?.createdDefinition) {
            AppLogger.info('Metafield definition created', {
              component: 'shop-metafield',
              operation: 'update'
            }, { definitionId: defData.data.metafieldDefinitionCreate.createdDefinition.id });
          } else if (defData.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
            const error = defData.data.metafieldDefinitionCreate.userErrors[0];

            // Handle "Key is in use" error gracefully
            if (error.message.includes("Key is in use")) {
              AppLogger.info('Definition already exists (race condition), continuing', {
                component: 'shop-metafield',
                operation: 'update'
              });
              // This is fine - another process created it, we can still update the metafield value
            } else {
              AppLogger.error('Error creating definition', {
                component: 'shop-metafield',
                operation: 'update'
              }, error);
            }
          }
        } catch (createError) {
          AppLogger.error('Failed to create definition, continuing anyway', {
            component: 'shop-metafield',
            operation: 'update'
          }, createError);
        }
      }

      // CRITICAL: Verify definition has proper storefront access
      try {
        const verifyResponse = await admin.graphql(QUERY_METAFIELD_DEF);
        const verifyData = await verifyResponse.json();
        const bundleDefinition = verifyData.data?.metafieldDefinitions?.nodes?.find(
          (def: any) => def.namespace === "custom" && def.key === "all_bundles"
        );

        if (bundleDefinition) {
          if (bundleDefinition.access?.storefront === 'PUBLIC_READ') {
            AppLogger.info('Definition has proper storefront access', {
              component: 'shop-metafield',
              operation: 'update'
            });
          } else {
            AppLogger.error('CRITICAL: Definition lacks storefront access! This explains why cart transform receives null!', {
              component: 'shop-metafield',
              operation: 'update'
            }, { currentAccess: bundleDefinition.access });
          }
        } else {
          AppLogger.error('Definition not found after creation attempt', {
            component: 'shop-metafield',
            operation: 'update'
          });
        }
      } catch (verifyError) {
        AppLogger.error('Failed to verify definition access', {
          component: 'shop-metafield',
          operation: 'update'
        }, verifyError);
      }
    } catch (error) {
      AppLogger.error('Metafield definition check/update failed', {
        component: 'shop-metafield',
        operation: 'update'
      }, error);
      // Continue anyway - metafield value might still work
    }

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

    AppLogger.info('Setting shop metafield', {
      component: 'shop-metafield',
      operation: 'update'
    }, { bundleCount: formattedBundles.length });

    // Validate and stringify bundle data
    let bundlesJson;
    try {
      bundlesJson = JSON.stringify(formattedBundles);
      AppLogger.debug('Bundle data serialized successfully', {
        component: 'shop-metafield',
        operation: 'update'
      }, { sizeBytes: bundlesJson.length });

      // Validate JSON is valid by parsing it back
      const parsed = JSON.parse(bundlesJson);
      if (!Array.isArray(parsed) || parsed.length !== formattedBundles.length) {
        throw new Error("JSON serialization validation failed - array mismatch");
      }
      AppLogger.debug('JSON validation passed', {
        component: 'shop-metafield',
        operation: 'update'
      });
    } catch (error) {
      AppLogger.error('Failed to serialize bundle data to JSON', {
        component: 'shop-metafield',
        operation: 'update'
      }, {
        error,
        problematicBundles: formattedBundles.map(b => ({
          id: b.id,
          name: b.name,
          hasVariant: !!b.bundleParentVariantId
        }))
      });
      throw new Error(`Bundle data serialization failed: ${error}`);
    }

    const response = await admin.graphql(SET_SHOP_METAFIELD, {
      variables: {
        metafields: [
          {
            ownerId: shopGlobalId,
            namespace: "custom",
            key: "all_bundles",
            type: "json",
            value: bundlesJson
          }
        ]
      }
    });

    const data = await response.json();

    AppLogger.debug('GraphQL response received', {
      component: 'shop-metafield',
      operation: 'update'
    }, { metafieldsSet: data.data?.metafieldsSet?.metafields?.length || 0 });

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      const error = data.data.metafieldsSet.userErrors[0];
      AppLogger.error('Shop metafield set failed', {
        component: 'shop-metafield',
        operation: 'update'
      }, { error, fullResponse: data });
      throw new Error(`Failed to set shop metafield: ${error.message}`);
    }

    // Verify metafield was actually set
    if (!data.data?.metafieldsSet?.metafields?.[0]) {
      AppLogger.error('Metafield not created - no metafields in response', {
        component: 'shop-metafield',
        operation: 'update'
      }, { fullResponse: data });
      throw new Error("Metafield creation returned no metafields");
    }

    AppLogger.info('Shop bundles metafield updated successfully', {
      component: 'shop-metafield',
      operation: 'update'
    }, {
      metafieldId: data.data.metafieldsSet.metafields[0].id,
      valueLength: data.data.metafieldsSet.metafields[0].value?.length || 0,
      totalBundles: allBundles.length
    });

    endTimer();
    return data.data.metafieldsSet.metafields[0];

  } catch (error) {
    AppLogger.error('Error updating shop bundles metafield', {
      component: 'shop-metafield',
      operation: 'update'
    }, error);

    endTimer();
    return null;
  }
}

// Map frontend discount method values to schema enum values
function mapDiscountMethod(discountType: string): string {
  switch (discountType) {
    case 'fixed_bundle_price':
      return 'fixed_bundle_price';  // ✅ Keep distinct from fixed_amount_off
    case 'fixed_amount_off':
      return 'fixed_amount_off';
    case 'percentage_off':
      return 'percentage_off';
    case 'free_shipping':
      return 'free_shipping';
    default:
      return 'fixed_amount_off'; // Default fallback
  }
}

// Helper function to validate if a product ID is a valid Shopify numeric ID
function isValidShopifyProductId(productId: string): boolean {
  const cleanId = productId.replace('gid://shopify/Product/', '');
  // Shopify product IDs are numeric strings
  return /^\d+$/.test(cleanId);
}

// Helper function to get first variant ID for a product
async function getFirstVariantId(admin: any, productId: string): Promise<string | null> {
  try {
    // Remove gid prefix if present to get just the ID
    const cleanProductId = productId.replace('gid://shopify/Product/', '');

    // Validate that it's a proper Shopify product ID (numeric)
    if (!isValidShopifyProductId(productId)) {
      AppLogger.error(`Invalid product ID format (expected numeric, got "${cleanProductId}")`, {
        component: 'variant-lookup',
        operation: 'validate-id'
      });
      return null;
    }

    const PRODUCT_QUERY = `
      query GetProduct($id: ID!) {
        product(id: $id) {
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(PRODUCT_QUERY, {
      variables: {
        id: `gid://shopify/Product/${cleanProductId}`
      }
    });

    const data = await response.json();

    if (data.data?.product?.variants?.edges?.[0]?.node?.id) {
      return data.data.product.variants.edges[0].node.id;
    }

    AppLogger.error(`Product ${productId} not found in Shopify`, {
      component: 'variant-lookup',
      operation: 'fetch-product'
    });
    return null;
  } catch (error) {
    AppLogger.error(`Error fetching variant for ${productId}`, {
      component: 'variant-lookup',
      operation: 'fetch-variant'
    }, error);
    return null;
  }
}

// Helper function to calculate total undiscounted bundle price (for discount conversion)
// This calculates the AVERAGE expected bundle price based on one product selection per step
async function calculateBundleTotalPrice(admin: any, stepsData: any[]) {
  try {
    if (!stepsData || stepsData.length === 0) {
      AppLogger.debug("🔧 [BUNDLE_TOTAL_PRICE] No steps found, returning 0");
      return 0;
    }

    let totalPrice = 0;
    let stepCount = 0;

    // Calculate average price per step (customer selects ONE product per step)
    for (const step of stepsData) {
      if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
        let stepTotalPrice = 0;
        let validProductCount = 0;

        // Get prices for all products in this step
        for (const stepProduct of step.StepProduct) {
          try {
            const productPrice = await getProductPrice(admin, stepProduct.id);
            stepTotalPrice += parseFloat(productPrice);
            validProductCount++;
          } catch (error) {
            AppLogger.error(`🔧 [BUNDLE_TOTAL_PRICE] Error getting price for product ${stepProduct.id}:`, {}, error as any);
          }
        }

        // Calculate average price for this step
        if (validProductCount > 0) {
          const stepAveragePrice = stepTotalPrice / validProductCount;
          const quantity = parseInt(step.minQuantity) || 1;
          const stepContribution = stepAveragePrice * quantity;

          totalPrice += stepContribution;
          stepCount++;

          AppLogger.debug(`🔧 [BUNDLE_TOTAL_PRICE] Step ${stepCount}: avg ₹${stepAveragePrice.toFixed(2)} x ${quantity} = ₹${stepContribution.toFixed(2)} (from ${validProductCount} products)`);
        }
      }
    }

    AppLogger.debug(`🔧 [BUNDLE_TOTAL_PRICE] Total bundle price (${stepCount} steps): ₹${totalPrice.toFixed(2)}`);
    return totalPrice;
  } catch (error) {
    AppLogger.error("🔧 [BUNDLE_TOTAL_PRICE] Error calculating total bundle price:", {}, error as any);
    return 0;
  }
}

// Helper function to calculate bundle product price based on component products
async function calculateBundlePrice(admin: any, bundle: any) {
  try {
    if (!bundle.steps || bundle.steps.length === 0) {
      AppLogger.debug("🔧 [BUNDLE_PRICING] No steps found, using default price of 1.00");
      return "1.00";
    }

    let totalPrice = 0;
    let productCount = 0;

    // Get prices from all component products
    for (const step of bundle.steps) {
      if (step.StepProduct && Array.isArray(step.StepProduct)) {
        for (const stepProduct of step.StepProduct) {
          try {
            const productPrice = await getProductPrice(admin, stepProduct.productId);
            const quantity = step.minQuantity || 1;
            totalPrice += parseFloat(productPrice) * quantity;
            productCount++;
          } catch (error) {
            AppLogger.error(`🔧 [BUNDLE_PRICING] Error getting price for product ${stepProduct.productId}:`, {}, error as any);
          }
        }
      }
    }

    // Apply discount if configured
    if (bundle.pricing && bundle.pricing.enabled && bundle.pricing.rules) {
      const rules = Array.isArray(bundle.pricing.rules) ? bundle.pricing.rules : [];
      if (rules.length > 0 && bundle.pricing.method === 'percentage_off') {
        const discountPercent = parseFloat(rules[0].discountValue) || 0;
        totalPrice = totalPrice * (1 - discountPercent / 100);
      }
    }

    const finalPrice = Math.max(totalPrice, 0.01); // Minimum price 1 cent
    AppLogger.debug(`🔧 [BUNDLE_PRICING] Calculated bundle price: $${finalPrice.toFixed(2)} (${productCount} products)`);

    return finalPrice.toFixed(2);
  } catch (error) {
    AppLogger.error("🔧 [BUNDLE_PRICING] Error calculating bundle price:", {}, error as any);
    return "1.00"; // Fallback price
  }
}

// Helper function to get product variant price
async function getProductPrice(admin: any, productId: string) {
  try {
    const cleanProductId = productId.replace('gid://shopify/Product/', '');

    const PRODUCT_PRICE_QUERY = `
      query getProductPrice($id: ID!) {
        product(id: $id) {
          variants(first: 1) {
            edges {
              node {
                price
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(PRODUCT_PRICE_QUERY, {
      variables: {
        id: `gid://shopify/Product/${cleanProductId}`
      }
    });

    const data = await response.json();

    if (data.data?.product?.variants?.edges?.[0]?.node?.price) {
      return data.data.product.variants.edges[0].node.price;
    }

    // Fallback price
    return "10.00";
  } catch (error) {
    AppLogger.error('Error fetching product price:', {}, error as any);
    return "10.00"; // Fallback price
  }
}

// Helper function to update bundle product variant price
async function updateBundleProductPrice(admin: any, productId: string, newPrice: string) {
  try {
    AppLogger.debug(`🔧 [BUNDLE_PRICING] Updating bundle product ${productId} price to $${newPrice}`);

    // First, get the variant ID
    const PRODUCT_VARIANT_QUERY = `
      query getProductVariant($id: ID!) {
        product(id: $id) {
          variants(first: 1) {
            edges {
              node {
                id
                price
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(PRODUCT_VARIANT_QUERY, {
      variables: { id: productId }
    });

    const data = await response.json();
    const variantId = data.data?.product?.variants?.edges?.[0]?.node?.id;
    const currentPrice = data.data?.product?.variants?.edges?.[0]?.node?.price;

    if (!variantId) {
      throw new Error("No variant found for bundle product");
    }

    // Only update if price has changed
    if (currentPrice === newPrice) {
      AppLogger.debug(`🔧 [BUNDLE_PRICING] Price unchanged ($${currentPrice}), skipping update`);
      return;
    }

    // Update the variant price
    const UPDATE_VARIANT_PRICE = `
      mutation updateVariantPrice($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const updateResponse = await admin.graphql(UPDATE_VARIANT_PRICE, {
      variables: {
        input: {
          id: variantId,
          price: newPrice
        }
      }
    });

    const updateData = await updateResponse.json();

    if (updateData.data?.productVariantUpdate?.userErrors?.length > 0) {
      throw new Error(`Failed to update variant price: ${updateData.data.productVariantUpdate.userErrors[0].message}`);
    }

    AppLogger.debug(`🔧 [BUNDLE_PRICING] Successfully updated bundle product price from $${currentPrice} to $${newPrice}`);
  } catch (error) {
    AppLogger.error("🔧 [BUNDLE_PRICING] Error updating bundle product price:", {}, error as any);
    throw error;
  }
}

// Handle saving bundle configuration
// Helper function to convert bundle configuration to standard Shopify metafields
async function convertBundleToStandardMetafields(admin: any, bundle: any) {
  const standardMetafields: any = {};

  // For bundle products (parent products), create component_reference and component_quantities
  if (bundle.steps && bundle.steps.length > 0) {
    const componentReferences: string[] = []; // Product GIDs for list.product_reference
    const componentQuantities: number[] = [];

    // Extract all products from all steps
    for (const step of bundle.steps) {
      if (step.StepProduct && Array.isArray(step.StepProduct)) {
        for (const stepProduct of step.StepProduct) {
          // Check if this is a UUID (old data that needs migration)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stepProduct.productId);

          if (isUUID) {
            AppLogger.warn(`⚠️ [STANDARD_METAFIELD] Skipping UUID product ID (needs migration): ${stepProduct.productId} - Product: ${stepProduct.title}`);
            continue; // Skip UUID products entirely
          }

          // IMPORTANT: component_reference expects Product GIDs, not Variant GIDs
          // Shopify's list.product_reference type requires product references
          const productId = stepProduct.productId;
          if (productId && productId.includes('gid://shopify/Product/')) {
            componentReferences.push(productId);
            componentQuantities.push(step.minQuantity || 1);
          }
        }
      }

      // Also handle products array if it exists
      if (step.products && Array.isArray(step.products)) {
        for (const product of step.products) {
          // Ensure we're using Product GID, not Variant GID
          const productId = product.id;
          if (productId && productId.includes('gid://shopify/Product/')) {
            componentReferences.push(productId);
            componentQuantities.push(step.minQuantity || 1);
          }
        }
      }
    }

    if (componentReferences.length > 0) {
      standardMetafields.component_reference = componentReferences; // Array of Product GIDs for list.product_reference
      standardMetafields.component_quantities = componentQuantities; // Array of integers for list.number_integer
      AppLogger.debug("🔧 [STANDARD_METAFIELD] Component references (Product GIDs):", componentReferences);
      AppLogger.debug("🔧 [STANDARD_METAFIELD] Component quantities:", componentQuantities);
    }
  }

  // Add price adjustment if pricing is configured
  if (bundle.pricing && bundle.pricing.enabled && bundle.pricing.rules) {
    const rules = Array.isArray(bundle.pricing.rules) ? bundle.pricing.rules : [];
    if (rules.length > 0) {
      const rule = rules[0]; // Use first rule for simplicity
      if (bundle.pricing.method === 'percentage_off' && rule.discountValue) {
        // For number_decimal metafield type, store as number (not string)
        standardMetafields.price_adjustment = parseFloat(rule.discountValue) || 0;
      }
    }
  }

  return standardMetafields;
}

// Helper function to generate component_parents metafield for individual products
function generateComponentParentsMetafield(bundleConfig: any, productId: string) {
  const parents = [];

  // Check if this product is included in the bundle's steps
  if (bundleConfig.steps) {
    for (const step of bundleConfig.steps) {
      let isIncluded = false;

      // Check StepProduct array
      if (step.StepProduct && Array.isArray(step.StepProduct)) {
        isIncluded = step.StepProduct.some((sp: any) =>
          sp.productId === productId ||
          sp.productId === `gid://shopify/Product/${productId.replace('gid://shopify/Product/', '')}`
        );
      }

      // Check products array
      if (!isIncluded && step.products && Array.isArray(step.products)) {
        isIncluded = step.products.some((p: any) =>
          p.id === productId ||
          p.id === `gid://shopify/Product/${productId.replace('gid://shopify/Product/', '')}`
        );
      }

      if (isIncluded) {
        const parentConfig = {
          id: bundleConfig.bundleId,
          title: bundleConfig.name,
          parentVariantId: bundleConfig.bundleParentVariantId,
          components: [{
            merchandiseId: productId.startsWith('gid://')
              ? productId.replace('/Product/', '/ProductVariant/') + '/1'
              : `gid://shopify/ProductVariant/${productId}`,
            quantity: step.minQuantity || 1
          }]
        };

        // Add price adjustment if available
        if (bundleConfig.pricing && bundleConfig.pricing.enabled && bundleConfig.pricing.rules) {
          const rules = Array.isArray(bundleConfig.pricing.rules) ? bundleConfig.pricing.rules : [];
          if (rules.length > 0) {
            const rule = rules[0];
            if (bundleConfig.pricing.method === 'percentage_off' && rule.discountValue) {
              (parentConfig as any).price_adjustment = JSON.stringify({
                percentageDecrease: parseFloat(rule.discountValue) || 0
              });
            }
          }
        }

        parents.push(parentConfig);
      }
    }
  }

  return parents.length > 0 ? JSON.stringify(parents) : null;
}

// Helper function to update component products with component_parents metafield
async function updateComponentProductMetafields(admin: any, bundleProductId: string, bundleConfig: any) {
  AppLogger.debug("🔧 [COMPONENT_METAFIELD] Setting component_parents metafield on individual component products");

  if (!bundleConfig.steps || bundleConfig.steps.length === 0) {
    AppLogger.debug("🔧 [COMPONENT_METAFIELD] No steps found in bundle config");
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
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stepProduct.productId);

          if (isUUID) {
            AppLogger.warn(`⚠️ [COMPONENT_METAFIELD] Skipping UUID product ID (needs migration): ${stepProduct.productId} - Product: ${stepProduct.title}`);
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
            AppLogger.warn(`⚠️ [COMPONENT_METAFIELD] Skipping invalid product ID format: ${productId}`);
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
            AppLogger.warn(`⚠️ [COMPONENT_METAFIELD] Skipping invalid product ID: ${productId}`);
          }
        }
      }
    }
  }

  AppLogger.debug(`🔧 [COMPONENT_METAFIELD] Found ${componentProductIds.size} valid component products to update`);

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
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stepProduct.productId);

          if (isUUID) {
            AppLogger.warn(`⚠️ [COMPONENT_REFERENCE] Skipping UUID product ID (needs migration): ${stepProduct.productId} - Product: ${stepProduct.title}`);
            continue; // Skip UUID products entirely
          }

          // Get the actual first variant ID
          const variantId = await getFirstVariantId(admin, stepProduct.productId);
          if (variantId) {
            componentReferences.push(variantId);
            componentQuantities.push(step.minQuantity || 1);
          }
        }
      }
    }

    // Handle products array if it exists
    if (step.products && Array.isArray(step.products)) {
      for (const product of step.products) {
        if (product.id) {
          const variantId = await getFirstVariantId(admin, product.id);
          if (variantId) {
            componentReferences.push(variantId);
            componentQuantities.push(step.minQuantity || 1);
          }
        }
      }
    }
  }

  // Get the bundle product's first variant ID to use as the parent ID
  const bundleVariantId = await getFirstVariantId(admin, bundleProductId);

  if (!bundleVariantId) {
    AppLogger.error('❌ [COMPONENT_METAFIELD] Cannot update component products: bundle product variant not found');
    return;
  }

  // Create component_parents in OFFICIAL Shopify format
  const componentParentsData = [{
    id: bundleVariantId, // Use the bundle product variant ID as the parent ID
    component_reference: {
      value: componentReferences
    },
    component_quantities: {
      value: componentQuantities
    },
    ...(bundleConfig.pricing?.enabled && bundleConfig.pricing?.rules?.length > 0 && bundleConfig.pricing.method === 'percentage_off' ? {
      price_adjustment: {
        value: parseFloat(bundleConfig.pricing.rules[0]?.discountValue) || 0
      }
    } : {})
  }];

  AppLogger.debug("🔧 [COMPONENT_METAFIELD] Bundle variant ID:", {}, bundleVariantId);
  AppLogger.debug("🔧 [COMPONENT_METAFIELD] Component parents data:", {}, JSON.stringify(componentParentsData, null, 2));

  // Update each component product
  for (const productId of componentProductIds) {
    try {
      AppLogger.debug(`🔧 [COMPONENT_METAFIELD] Updating product: ${productId}`);

      // Create minimal bundle config matching the cart transform interface
      const minimalBundleConfig = {
        id: bundleConfig.id,
        bundleId: bundleConfig.id, // bundleId should match id for cart transform
        name: bundleConfig.name,
        bundleParentVariantId: bundleConfig.bundleParentVariantId,
        shopifyProductId: bundleConfig.shopifyProductId,
        pricing: bundleConfig.pricing ? {
          enabled: bundleConfig.pricing.enabled || bundleConfig.pricing.enabled,
          method: bundleConfig.pricing.method || bundleConfig.pricing.method,
          rules: bundleConfig.pricing.rules || []
        } : undefined,
        steps: bundleConfig.steps || []
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
        // CRITICAL: Add bundle_config so cart transform can access it from component products
        {
          ownerId: productId,
          namespace: "$app",
          key: "bundle_config",
          value: JSON.stringify(minimalBundleConfig),
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
        AppLogger.error(`🔧 [COMPONENT_METAFIELD] Error updating product ${productId}:`, {}, data.data.metafieldsSet.userErrors);
      } else {
        AppLogger.debug(`🔧 [COMPONENT_METAFIELD] Successfully updated product ${productId}`);
      }
    } catch (error) {
      AppLogger.error(`🔧 [COMPONENT_METAFIELD] Failed to update product ${productId}:`, {}, error as any);
    }
  }
}

// Helper function to update standard Shopify metafields on products
async function updateProductStandardMetafields(admin: any, productId: string, standardMetafields: any) {
  AppLogger.debug("🔧 [STANDARD_METAFIELD] Setting standard Shopify metafields on product:", {}, productId);
  AppLogger.debug("📋 [STANDARD_METAFIELD] Metafields:", standardMetafields);

  // Ensure metafield definitions exist for the custom namespace
  await ensureStandardMetafieldDefinitions(admin);

  const metafieldsToSet: any[] = [];

  // Add each standard metafield with correct types and formats
  // CRITICAL: All metafield values must be JSON-encoded strings in Shopify GraphQL
  Object.keys(standardMetafields).forEach(key => {
    if (standardMetafields[key] !== null && standardMetafields[key] !== undefined) {
      let value = standardMetafields[key];
      let type = 'json'; // Default fallback

      // Use proper types for each metafield and ensure all values are strings
      switch (key) {
        case 'component_reference':
          type = 'list.product_reference';
          // Arrays must be JSON-encoded strings
          value = JSON.stringify(Array.isArray(value) ? value : []);
          break;
        case 'component_quantities':
          type = 'list.number_integer';
          // Arrays must be JSON-encoded strings
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
    AppLogger.debug("🔧 [STANDARD_METAFIELD] No standard metafields to set");
    return null;
  }

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
  AppLogger.debug("🔧 [STANDARD_METAFIELD] GraphQL response:", {}, JSON.stringify(data, null, 2));

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    AppLogger.error("🔧 [STANDARD_METAFIELD] User errors:", {}, data.data.metafieldsSet.userErrors);
    throw new Error(`Failed to set standard metafields: ${data.data.metafieldsSet.userErrors[0].message}`);
  }

  AppLogger.debug("🔧 [STANDARD_METAFIELD] Standard metafields set successfully");
  return data.data?.metafieldsSet?.metafields;
}

// Helper function to ensure standard metafield definitions exist
async function ensureStandardMetafieldDefinitions(admin: any) {
  AppLogger.debug("🔧 [STANDARD_METAFIELD] Creating definitions in app-reserved namespace");

  // Use app-reserved namespace to avoid type conflicts with existing custom namespace definitions
  const standardDefinitions = [
    {
      namespace: "$app", // App-reserved namespace avoids conflicts
      key: "component_reference",
      name: "Component Reference",
      description: "Bundle component variant IDs",
      type: "list.product_reference",
      ownerType: "PRODUCT"
    },
    {
      namespace: "$app",
      key: "component_quantities",
      name: "Component Quantities",
      description: "Bundle component quantities",
      type: "list.number_integer",
      ownerType: "PRODUCT"
    },
    {
      namespace: "$app",
      key: "component_parents",
      name: "Component Parents",
      description: "Bundle parent configurations",
      type: "json",
      ownerType: "PRODUCT"
    },
    {
      namespace: "$app",
      key: "price_adjustment",
      name: "Price Adjustment",
      description: "Bundle price adjustment configuration",
      type: "number_decimal",
      ownerType: "PRODUCT"
    }
  ];

  for (const definition of standardDefinitions) {
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
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await admin.graphql(CREATE_METAFIELD_DEFINITION, {
        variables: { definition }
      });

      const data = await response.json();
      if (data.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
        const errors = data.data.metafieldDefinitionCreate.userErrors;
        AppLogger.debug(`🔧 [STANDARD_METAFIELD] Definition error for ${definition.key}:`, errors);
        // Don't throw - definitions might already exist
      } else {
        AppLogger.debug(`🔧 [STANDARD_METAFIELD] Created definition for ${definition.key} in $app namespace`);
      }
    } catch (error) {
      AppLogger.debug(`🔧 [STANDARD_METAFIELD] Error creating definition for ${definition.key}:`, {}, error as any);
    }
  }
}

async function handleSaveBundle(admin: any, session: any, bundleId: string, formData: FormData) {
  const endTimer = AppLogger.startTimer('Bundle save process', {
    component: 'bundle-config',
    operation: 'save',
    bundleId,
    shopId: session.shop
  });

  AppLogger.info('Starting enhanced bundle save process', {
    component: 'bundle-config',
    operation: 'save',
    bundleId,
    shopId: session.shop
  });

  try {

    // Parse form data
    const bundleName = formData.get("bundleName") as string;
    const bundleDescription = formData.get("bundleDescription") as string;
    const bundleStatus = formData.get("bundleStatus") as string;
    const templateName = formData.get("templateName") as string || null;
    const stepsData = JSON.parse(formData.get("stepsData") as string);
    const discountData = JSON.parse(formData.get("discountData") as string);
    const stepConditionsData = formData.get("stepConditions") ? JSON.parse(formData.get("stepConditions") as string) : {};
    const bundleProductData = formData.get("bundleProduct") ? JSON.parse(formData.get("bundleProduct") as string) : null;

    AppLogger.debug("📝 [BUNDLE_CONFIG] Parsed form data:", {
      bundleName,
      bundleDescription,
      bundleStatus,
      stepsCount: stepsData.length,
      discountEnabled: discountData.discountEnabled,
      discountType: discountData.discountType,
      hasConditions: Object.keys(stepConditionsData).length > 0,
      hasBundleProduct: !!bundleProductData
    });

    AppLogger.debug("[DEBUG] Step Conditions Data from form:", stepConditionsData);
    AppLogger.debug("[DEBUG] Bundle Product Data from form:", bundleProductData);

    // 🔍 DEBUG: Log all product IDs being submitted
    AppLogger.debug("🔍 [DEBUG] Steps data received from form:");
    stepsData.forEach((step: any, idx: number) => {
      AppLogger.debug(`  Step ${idx + 1}: "${step.name}" (step.id: ${step.id})`);
      if (step.StepProduct && Array.isArray(step.StepProduct)) {
        step.StepProduct.forEach((product: any, pidx: number) => {
          AppLogger.debug(`    Product ${pidx + 1}: "${product.title}" → product.id: ${product.id}`);
        });
      }
    });

    // 🛡️ VALIDATION: Check for UUID product IDs and reject them
    // This prevents corrupted browser state from creating invalid data
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const step of stepsData) {
      if (!step.StepProduct || !Array.isArray(step.StepProduct)) continue;

      for (const product of step.StepProduct) {
        if (uuidRegex.test(product.id)) {
          const errorMsg = `❌ Invalid product ID detected: UUID "${product.id}" for product "${product.title || product.name}" in step "${step.name}". ` +
            `This indicates corrupted browser state. Please refresh the page and re-select the product using the product picker.`;
          AppLogger.error(errorMsg);
          throw new Error(errorMsg);
        }
      }
    }

    AppLogger.debug("✅ [VALIDATION] All product IDs are valid Shopify GIDs");

    // ✅ FIXED_BUNDLE_PRICE: Store the fixed price directly (NO conversion)
    // The cart transform will calculate the percentage dynamically based on actual cart total
    if (discountData.discountEnabled && discountData.discountType === 'fixed_bundle_price') {
      AppLogger.debug("💰 [FIXED_BUNDLE_PRICE] Storing fixed bundle price (will be converted at runtime)");

      // For fixed_bundle_price, keep the original price value in a special field
      // The cart transform will read this and calculate discount based on actual cart total
      const processedRules = (discountData.discountRules || []).map((rule: any) => {
        const fixedPrice = parseFloat(rule.price || 0);
        AppLogger.debug(`💰 [FIXED_BUNDLE_PRICE] Rule fixed price: ₹${fixedPrice}`);

        // Store the fixed price in a dedicated field for runtime calculation
        return {
          ...rule,
          fixedBundlePrice: fixedPrice,  // The target bundle price (e.g., ₹30)
          // Don't set discountValue here - it will be calculated at runtime
        };
      });

      discountData.discountRules = processedRules;
      AppLogger.debug("✅ [FIXED_BUNDLE_PRICE] Stored fixed price for runtime calculation:", processedRules);
    }

    // Automatically set status to 'active' if bundle has configured steps
    let finalStatus = bundleStatus as any;
    if (bundleStatus === 'draft' && stepsData && stepsData.length > 0) {
      const hasConfiguredSteps = stepsData.some((step: any) =>
        (step.StepProduct && step.StepProduct.length > 0) ||
        (step.collections && step.collections.length > 0)
      );
      AppLogger.debug("📊 [BUNDLE_CONFIG] Status evaluation:", {
        originalStatus: bundleStatus,
        hasConfiguredSteps,
        stepsCount: stepsData.length
      });
      if (hasConfiguredSteps) {
        finalStatus = 'active';
        AppLogger.debug("🔄 [BUNDLE_CONFIG] Auto-activating bundle with configured steps");
      }
    }

    // Get existing bundle to preserve shopifyProductId if not provided
    const existingBundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      select: { shopifyProductId: true }
    });

    // Update bundle in database
    AppLogger.debug("💾 [BUNDLE_CONFIG] Updating bundle in database");
    const updatedBundle = await db.bundle.update({
      where: {
        id: bundleId,
        shopId: session.shop
      },
      data: {
        name: bundleName,
        description: bundleDescription,
        status: finalStatus,
        // Preserve existing shopifyProductId if not provided in form
        shopifyProductId: bundleProductData?.id || existingBundle?.shopifyProductId || null,
        templateName: templateName,
        // Update steps if provided
        ...(stepsData && {
          steps: {
            deleteMany: {},
            create: stepsData.map((step: any, index: number) => {
              // Get conditions for this step from stepConditionsData
              const stepConditions = stepConditionsData[step.id] || [];
              const firstCondition = stepConditions.length > 0 ? stepConditions[0] : null;
              AppLogger.debug(`[DEBUG] Step ${step.id} conditions:`, stepConditions);
              AppLogger.debug(`[DEBUG] Step ${step.id} first condition:`, firstCondition);
              AppLogger.debug(`[DEBUG] Will save to DB - conditionType: ${firstCondition?.type || null}, conditionOperator: ${firstCondition?.operator || null}, conditionValue: ${firstCondition?.value ? parseInt(firstCondition.value) || null : null}`);

              return {
                name: step.pageTitle || step.name, // Use pageTitle as name if available
                position: index + 1, // Map stepNumber to position field
                products: step.products || [],
                collections: step.collections || [],
                displayVariantsAsIndividual: step.displayVariantsAsIndividualProducts || false,
                minQuantity: parseInt(step.minQuantity) || 1,
                maxQuantity: parseInt(step.maxQuantity) || 1,
                enabled: step.enabled !== false, // Default to true unless explicitly false
                // Apply condition data if available
                conditionType: firstCondition?.type || null,
                conditionOperator: firstCondition?.operator || null,
                conditionValue: firstCondition?.value ? parseInt(firstCondition.value) || null : null,
                // Create StepProduct records for selected products
                StepProduct: {
                  create: (step.StepProduct || []).map((product: any, productIndex: number) => {
                    // STRICT VALIDATION: Only allow Shopify GIDs
                    let productId = product.id;

                    if (!productId || typeof productId !== 'string') {
                      throw new Error(`Invalid product ID: Product ID is required and must be a string. Got: ${typeof productId}`);
                    }

                    // Check if it's a UUID (reject immediately)
                    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
                    if (isUUID) {
                      throw new Error(
                        `Invalid product ID: UUID detected "${productId}" for product "${product.title || product.name}". ` +
                        `Only Shopify product IDs are allowed. Please re-select the product using the product picker.`
                      );
                    }

                    // Normalize to Shopify GID format
                    if (productId.startsWith('gid://shopify/Product/')) {
                      // Already in correct format - validate it's numeric after the prefix
                      const numericId = productId.replace('gid://shopify/Product/', '');
                      if (!/^\d+$/.test(numericId)) {
                        throw new Error(
                          `Invalid product ID format: "${productId}" for product "${product.title || product.name}". ` +
                          `Shopify product IDs must be numeric. Expected format: gid://shopify/Product/123456`
                        );
                      }
                      // Valid Shopify GID
                    } else if (/^\d+$/.test(productId)) {
                      // Numeric ID - convert to GID
                      productId = `gid://shopify/Product/${productId}`;
                    } else {
                      // Invalid format - reject
                      throw new Error(
                        `Invalid product ID format: "${productId}" for product "${product.title || product.name}". ` +
                        `Expected Shopify GID (gid://shopify/Product/123456) or numeric ID (123456).`
                      );
                    }

                    return {
                      productId: productId,
                      title: product.title || product.name || 'Unnamed Product',
                      imageUrl: product.imageUrl || product.images?.[0]?.originalSrc || product.images?.[0]?.url || product.image?.url || null,
                      variants: product.variants || null,
                      minQuantity: parseInt(product.minQuantity) || 1,
                      maxQuantity: parseInt(product.maxQuantity) || 10,
                      position: productIndex + 1
                    };
                  })
                }
              };
            })
          }
        }),
        // Update pricing if provided
        ...(discountData && {
          pricing: {
            upsert: {
              create: {
                enabled: discountData.discountEnabled,
                method: mapDiscountMethod(discountData.discountType),
                rules: discountData.discountRules || [],
                showFooter: discountData.showFooter !== false,
                showProgressBar: discountData.showProgressBar || false,
                messages: {
                  showDiscountDisplay: true,
                  showDiscountMessaging: discountData.discountMessagingEnabled || false,
                  ruleMessages: discountData.ruleMessages || {}
                }
              },
              update: {
                enabled: discountData.discountEnabled,
                method: mapDiscountMethod(discountData.discountType),
                rules: discountData.discountRules || [],
                showFooter: discountData.showFooter !== false,
                showProgressBar: discountData.showProgressBar || false,
                messages: {
                  showDiscountDisplay: true,
                  showDiscountMessaging: discountData.discountMessagingEnabled || false,
                  ruleMessages: discountData.ruleMessages || {}
                }
              }
            }
          }
        })
      },
      include: {
        steps: {
          include: {
            StepProduct: true  // Include StepProduct for component metafield updates
          }
        },
        pricing: true
      }
    });

    // If bundle has a Shopify product, update its metafields (needed for cart transform even without discounts)
    if (updatedBundle.shopifyProductId) {
      // Create optimized configuration with only essential data for functions
      const optimizedSteps = (stepsData || []).map((step: any) => ({
        id: step.id,
        name: step.name || step.pageTitle || 'Step',
        minQuantity: parseInt(step.minQuantity) || 1,
        maxQuantity: parseInt(step.maxQuantity) || 1,
        enabled: step.enabled !== false,
        conditionType: stepConditionsData[step.id]?.[0]?.type || null,
        conditionOperator: stepConditionsData[step.id]?.[0]?.operator || null,
        conditionValue: stepConditionsData[step.id]?.[0]?.value ? parseInt(stepConditionsData[step.id][0].value) || null : null,
        // Store essential product data (IDs, titles, and images)
        products: (step.StepProduct || []).map((product: any) => ({
          id: product.id,
          title: product.title || product.name || 'Product',
          imageUrl: product.imageUrl || product.image?.url || null
        })),
        // Only store essential collection data
        collections: (step.collections || []).map((collection: any) => ({
          id: collection.id,
          title: collection.title || 'Collection'
        }))
      }));

      // Get the bundle product's first variant ID for cart transform merge operations
      const bundleParentVariantId = await getBundleProductVariantId(admin, updatedBundle.shopifyProductId);
      AppLogger.debug(`🔍 [BUNDLE_CONFIG] Bundle parent variant ID: ${bundleParentVariantId}`);

      const baseConfiguration = {
        bundleId: updatedBundle.id,
        id: updatedBundle.id, // Also include as 'id' for easier matching
        name: updatedBundle.name,
        description: updatedBundle.description,
        status: updatedBundle.status,
        bundleType: updatedBundle.bundleType,
        templateName: updatedBundle.templateName,
        steps: optimizedSteps,
        pricing: {
          enabled: discountData.discountEnabled,
          method: discountData.discountType,
          rules: (discountData.discountRules || []).map((rule: any) => {
            // Map long-form condition names to shorthand for widget compatibility
            const conditionMap: Record<string, string> = {
              'greater_than_equal_to': 'gte',
              'greater_than': 'gt',
              'less_than_equal_to': 'lte',
              'less_than': 'lt',
              'equal_to': 'eq'
            };
            const condition = conditionMap[rule.condition] || rule.condition;

            // Build rule with method-specific fields for cart transform
            const baseRule: any = {
              id: rule.id,
              condition,
              conditionType: rule.type,
              value: rule.value
            };

            // Add discount fields based on pricing method
            if (discountData.discountType === 'percentage_off') {
              baseRule.percentageOff = rule.discountValue; // Cart transform expects percentageOff
              baseRule.discountValue = rule.discountValue; // Widget expects discountValue
            } else if (discountData.discountType === 'fixed_amount_off') {
              baseRule.fixedAmountOff = rule.discountValue; // Cart transform expects fixedAmountOff
              baseRule.discountValue = rule.discountValue; // Widget expects discountValue
            } else if (discountData.discountType === 'fixed_bundle_price') {
              baseRule.fixedBundlePrice = rule.fixedBundlePrice || rule.price; // Both expect this
            }

            return baseRule;
          })
        },
        // CRITICAL: Include bundle parent variant ID for cart transform merge operations
        bundleParentVariantId: bundleParentVariantId,
        shopifyProductId: updatedBundle.shopifyProductId, // Bundle product ID for querying metafield
        updatedAt: new Date().toISOString()
      };

      const configSize = JSON.stringify(baseConfiguration).length;
      AppLogger.debug("📏 [METAFIELD] Optimized configuration size:", {}, `${configSize} chars (vs 12KB+ before)`);

      try {
        // OPTIMIZED: Use SINGLE metafield ($app:bundle_config) for ALL purposes
        // This metafield is used by:
        // 1. Widget (storefront) - loads bundle UI
        // 2. Cart Transform function - applies discounts at checkout
        // 3. Auto-injection service - identifies bundle products
        // Memory savings: 66% reduction (15KB → 5KB per bundle)
        AppLogger.debug("🔧 [METAFIELD] Creating $app:bundle_config (single source of truth)");
        await BundleIsolationService.updateBundleProductMetafield(admin, updatedBundle.shopifyProductId, baseConfiguration);
        AppLogger.debug("✅ [METAFIELD] $app:bundle_config created successfully");

        // ALSO update standard Shopify metafields for cart transform compatibility


        AppLogger.debug("🔧 [STANDARD_METAFIELD] Updating standard Shopify metafields for bundle product");


        try {


          const standardMetafields = await convertBundleToStandardMetafields(admin, baseConfiguration);


          if (Object.keys(standardMetafields).length > 0) {


            await updateProductStandardMetafields(admin, updatedBundle.shopifyProductId, standardMetafields);


            AppLogger.debug("🔧 [STANDARD_METAFIELD] Standard metafields updated successfully");


          } else {


            AppLogger.debug("🔧 [STANDARD_METAFIELD] No standard metafields to update (products may be using UUIDs)");


          }


        } catch (error) {


          AppLogger.debug("🔧 [STANDARD_METAFIELD] Skipping standard metafields (optional feature):", {}, (error as Error).message);


          // Don't throw - standard metafields are optional, custom metafields are what actually matter


        }

        // CRITICAL: Also update component products with component_parents metafield
        AppLogger.debug("🔧 [COMPONENT_METAFIELD] Updating component products with component_parents metafield");
        // Pass the FULL bundle configuration with StepProduct data from database
        const fullBundleConfig = {
          ...baseConfiguration,
          steps: updatedBundle.steps  // Use database steps with StepProduct array
        };
        await updateComponentProductMetafields(admin, updatedBundle.shopifyProductId, fullBundleConfig);
        AppLogger.debug("🔧 [COMPONENT_METAFIELD] Component product metafields updated successfully");

      } catch (error) {
        AppLogger.error("Failed to update bundle product metafields:", {}, error as any);
        // Don't fail the entire operation - just log the error
      }
    }

    // ALWAYS update cart transform metafields (Shopify recommended approach)
    // This ensures cart transform functions get updated bundle data immediately
    try {
      await updateCartTransformMetafield(admin, session.shop);
    } catch (error) {
      AppLogger.error("Failed to update cart transform metafield:", {}, error as any);
      // Don't fail the entire operation - just log the error
    }

    // ALSO update shop-level all_bundles metafield for cart transform and Liquid extension
    // This ensures the cart transform and widget get updated bundle data immediately
    try {
      AppLogger.debug("🔄 [BUNDLE_SAVE] About to update shop metafield for cart transform...");
      const metafieldResult = await updateShopBundlesMetafield(admin, session.shop);

      if (metafieldResult) {
        AppLogger.debug("✅ [BUNDLE_SAVE] Shop metafield update completed successfully");
      } else {
        AppLogger.warn("⚠️ [BUNDLE_SAVE] Shop metafield update returned null - check logs above for errors");
      }
    } catch (error) {
      AppLogger.error("❌ [BUNDLE_SAVE] Failed to update shop bundles metafield:", {}, error as any);
      // Don't fail the entire operation - just log the error
      // But this is critical for cart transform to work
    }

    // Helper function to create bundle product isolation metafields
    async function createBundleProductIsolationMetafields(admin: any, bundleProductId: string, bundleId: string) {
      AppLogger.debug(`🏷️ [ISOLATION_METAFIELDS] Creating isolation metafields for bundle product: ${bundleProductId}`);

      try {
        const metafields = [
          {
            ownerId: bundleProductId,
            namespace: "$app:bundle_isolation",
            key: "bundle_id",
            type: "single_line_text_field",
            value: bundleId
          },
          {
            ownerId: bundleProductId,
            namespace: "$app:bundle_isolation",
            key: "bundle_type",
            type: "single_line_text_field",
            value: "cart_transform"
          },
          {
            ownerId: bundleProductId,
            namespace: "$app:bundle_isolation",
            key: "owns_bundle_id",
            type: "single_line_text_field",
            value: bundleId
          },
          {
            ownerId: bundleProductId,
            namespace: "$app:bundle_isolation",
            key: "bundle_product_type",
            type: "single_line_text_field",
            value: "cart_transform_bundle"
          },
          {
            ownerId: bundleProductId,
            namespace: "$app:bundle_isolation",
            key: "auto_injection_enabled",
            type: "single_line_text_field",
            value: "true"
          },
          {
            ownerId: bundleProductId,
            namespace: "$app:bundle_isolation",
            key: "created_at",
            type: "single_line_text_field",
            value: new Date().toISOString()
          }
        ];

        const SET_METAFIELDS_MUTATION = `
        mutation SetIsolationMetafields($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              key
              namespace
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

        const response = await admin.graphql(SET_METAFIELDS_MUTATION, {
          variables: { metafields }
        });

        const data = await response.json();

        if (data.data?.metafieldsSet?.userErrors?.length > 0) {
          AppLogger.error('❌ [ISOLATION_METAFIELDS] Metafield errors:', {}, data.data.metafieldsSet.userErrors);
          return false;
        }

        AppLogger.debug(`✅ [ISOLATION_METAFIELDS] Created ${data.data?.metafieldsSet?.metafields?.length || 0} isolation metafields`);
        return true;

      } catch (error) {
        AppLogger.error('❌ [ISOLATION_METAFIELDS] Error creating isolation metafields:', {}, error as any);
        return false;
      }
    }

    // Helper function to set up automatic bundle extension injection
    async function setupBundleAutoInjection(admin: any, bundleProductId: string, bundleId: string) {
      AppLogger.debug(`🎯 [AUTO_INJECTION] Setting up automatic bundle extension injection for product: ${bundleProductId}`);

      try {
        // Use the auto-injection service
        const result = await BundleAutoInjectionService.injectBundleExtensionIntoProduct(
          admin,
          bundleProductId,
          bundleId
        );

        if (result.success) {
          AppLogger.debug(`✅ [AUTO_INJECTION] Successfully set up automatic bundle extension injection`);
        } else {
          AppLogger.debug(`⚠️ [AUTO_INJECTION] Auto-injection setup warning: ${result.error}`);
          // Note: This is not a fatal error - the bundle widget will still work via JavaScript detection
        }

        return result.success;

      } catch (error) {
        AppLogger.error(`❌ [AUTO_INJECTION] Error setting up auto-injection:`, {}, error as any);
        // Don't throw - this is not critical for bundle functionality
        return false;
      }
    }

    // 🎯 BUNDLE PRODUCT ISOLATION SETUP: Set up automatic bundle extension injection
    if (bundleProductData?.id && updatedBundle.id) {
      AppLogger.debug("🎯 [BUNDLE_ISOLATION] Setting up bundle product isolation for automatic extension display");
      try {
        // Create isolation metafields for automatic bundle detection
        await createBundleProductIsolationMetafields(admin, bundleProductData.id, updatedBundle.id);

        // Set up automatic bundle extension injection
        await setupBundleAutoInjection(admin, bundleProductData.id, updatedBundle.id);

        AppLogger.debug("✅ [BUNDLE_ISOLATION] Bundle product isolation setup completed successfully");
      } catch (error) {
        AppLogger.error("❌ [BUNDLE_ISOLATION] Bundle product isolation setup failed:", {}, error as any);
        // Don't fail the entire operation - this is not critical for core functionality
      }
    }

    return json({
      success: true,
      bundle: updatedBundle,
      message: "Bundle configuration saved successfully"
    });

  } catch (error) {
    AppLogger.error("❌ [BUNDLE_CONFIG] Error saving bundle:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Failed to save bundle configuration"
    }, { status: 500 });
  }
}

// Handle updating bundle status
async function handleUpdateBundleStatus(_admin: any, session: any, bundleId: string, formData: FormData) {
  const status = formData.get("status") as string;

  const updatedBundle = await db.bundle.update({
    where: {
      id: bundleId,
      shopId: session.shop
    },
    data: { status: status as any },
    include: {
      steps: true,
      pricing: true
    }
  });

  return json({
    success: true,
    bundle: updatedBundle,
    message: `Bundle status updated to ${status}`
  });
}

// Handle syncing bundle product
async function handleSyncProduct(admin: any, session: any, bundleId: string, _formData: FormData) {
  const bundle = await db.bundle.findUnique({
    where: {
      id: bundleId,
      shopId: session.shop
    },
    include: {
      steps: true,
      pricing: true
    }
  });

  if (!bundle) {
    return json({ success: false, error: "Bundle not found" }, { status: 404 });
  }

  let productId = bundle.shopifyProductId;

  // If product exists, fetch latest data from Shopify and sync to database
  if (productId) {
    try {
      const GET_PRODUCT_FOR_SYNC = `
        query GetBundleProductForSync($id: ID!) {
          product(id: $id) {
            id
            title
            description
            descriptionHtml
            handle
            status
            productType
            vendor
            tags
            onlineStoreUrl
            featuredMedia {
              ... on MediaImage {
                id
                image {
                  url
                  altText
                }
              }
            }
            media(first: 10) {
              nodes {
                ... on MediaImage {
                  id
                  image {
                    url
                    altText
                  }
                }
              }
            }
            variants(first: 1) {
              nodes {
                id
                price
                compareAtPrice
                sku
                inventoryQuantity
              }
            }
            updatedAt
            createdAt
          }
        }
      `;

      const response = await admin.graphql(GET_PRODUCT_FOR_SYNC, {
        variables: { id: productId }
      });

      const data = await response.json();

      if (data.errors) {
        AppLogger.error("GraphQL errors:", {}, data.errors);
        return json({
          success: false,
          error: `Failed to fetch product: ${data.errors[0].message}`
        }, { status: 400 });
      }

      const shopifyProduct = data.data?.product;

      if (!shopifyProduct) {
        // Product no longer exists in Shopify, remove reference from bundle
        await db.bundle.update({
          where: { id: bundleId },
          data: { shopifyProductId: null }
        });

        return json({
          success: false,
          error: "Product no longer exists in Shopify. Bundle product reference has been cleared."
        }, { status: 404 });
      }

      // Check if bundle name has changed and optionally sync it
      let bundleNeedsSyncing = false;
      const updatedBundle: any = {};

      // If Shopify product title differs from bundle name, you could sync it back
      // (Optional: uncomment if you want to sync title back to bundle)
      // if (shopifyProduct.title !== bundle.name) {
      //   updatedBundle.name = shopifyProduct.title;
      //   bundleNeedsSyncing = true;
      // }

      // Sync bundle description if changed in Shopify
      if (shopifyProduct.description !== bundle.description) {
        updatedBundle.description = shopifyProduct.description;
        bundleNeedsSyncing = true;
      }

      // Update bundle with synced data if needed
      if (bundleNeedsSyncing) {
        await db.bundle.update({
          where: { id: bundleId },
          data: updatedBundle
        });
      }

      // Update metafields with current bundle configuration
      if (bundle.pricing?.enabled) {
        // Create optimized configuration with only essential data for functions
        const optimizedSteps = bundle.steps.map((step: any) => ({
          id: step.id,
          name: step.name,
          position: step.position,
          minQuantity: step.minQuantity,
          maxQuantity: step.maxQuantity,
          enabled: step.enabled,
          conditionType: step.conditionType,
          conditionOperator: step.conditionOperator,
          conditionValue: step.conditionValue,
          // Store essential product data (IDs, titles, and images)
          products: (step.products || []).map((product: any) => ({
            id: product.id,
            title: product.title || 'Product',
            imageUrl: product.imageUrl || null
          })),
          // Only store essential collection data
          collections: (step.collections || []).map((collection: any) => ({
            id: collection.id,
            title: collection.title || 'Collection'
          }))
        }));

        const bundleConfiguration = {
          bundleId: bundle.id,
          name: bundle.name,
          templateName: bundle.templateName || null,
          type: "cart_transform",
          steps: optimizedSteps,
          pricing: {
            enabled: bundle.pricing.enabled,
            method: bundle.pricing.method,
            rules: safeJsonParse(bundle.pricing.rules, []).map((rule: any) => ({
              id: rule.id,
              conditionType: rule.type || 'quantity', // Map type to conditionType (FIXED)
              value: rule.value || 0, // Keep as decimal - widget will convert to cents
              discountValue: rule.discountValue || 0,
              fixedBundlePrice: rule.fixedBundlePrice || 0
            }))
          },
          lastSynced: new Date().toISOString(),
          shopifyProduct: {
            id: shopifyProduct.id,
            title: shopifyProduct.title,
            handle: shopifyProduct.handle,
            updatedAt: shopifyProduct.updatedAt
          }
        };

        await updateBundleProductMetafields(admin, productId, bundleConfiguration);
      }

      return json({
        success: true,
        productId,
        syncedData: {
          title: shopifyProduct.title,
          description: shopifyProduct.description,
          status: shopifyProduct.status,
          lastUpdated: shopifyProduct.updatedAt,
          changesDetected: bundleNeedsSyncing
        },
        message: bundleNeedsSyncing
          ? "Bundle product synchronized successfully. Changes detected and updated."
          : "Bundle product synchronized successfully. No changes detected."
      });

    } catch (error) {
      AppLogger.error("Sync error:", {}, error as any);
      return json({
        success: false,
        error: `Failed to sync product: ${(error as Error).message}`
      }, { status: 500 });
    }
  }

  // Create product if it doesn't exist
  if (!productId) {
    // Calculate proper bundle price based on component products
    AppLogger.debug("🔧 [BUNDLE_PRICING] Calculating bundle price for product creation");
    const bundlePrice = await calculateBundlePrice(admin, bundle);

    const CREATE_PRODUCT = `
      mutation CreateBundleProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(CREATE_PRODUCT, {
      variables: {
        input: {
          title: bundle.name,
          handle: `bundle-${bundle.id}`,
          productType: "Bundle",
          vendor: "Bundle Builder",
          status: "ACTIVE",
          descriptionHtml: bundle.description || `${bundle.name} - Bundle Product`,
          tags: ["bundle", "cart-transform"],
          variants: [
            {
              price: bundlePrice,
              inventoryManagement: "NOT_MANAGED",
              inventoryPolicy: "CONTINUE"
            }
          ]
        }
      }
    });

    const data = await response.json();


    if (data.data?.productCreate?.userErrors?.length > 0) {
      const error = data.data.productCreate.userErrors[0];
      throw new Error(`Failed to create bundle product: ${error.message}`);
    }

    productId = data.data?.productCreate?.product?.id;


    // Update bundle with product ID
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyProductId: productId }
    });
  } else {
    // Update existing bundle product price if configuration changed
    try {
      AppLogger.debug("🔧 [BUNDLE_PRICING] Updating existing bundle product price");
      const bundlePrice = await calculateBundlePrice(admin, bundle);
      await updateBundleProductPrice(admin, productId, bundlePrice);
    } catch (error) {
      AppLogger.error("🔧 [BUNDLE_PRICING] Error updating bundle product price:", {}, error as any);
      // Don't fail the whole operation for pricing update errors
    }
  }

  // Update metafields with current bundle configuration
  if (productId && bundle.pricing?.enabled) {
    // Create optimized configuration with only essential data for functions
    const optimizedSteps = (bundle.steps || []).map((step: any) => ({
      id: step.id,
      name: step.name,
      minQuantity: step.minQuantity || 1,
      maxQuantity: step.maxQuantity || 1,
      enabled: step.enabled !== false,
      conditionType: step.conditionType,
      conditionOperator: step.conditionOperator,
      conditionValue: step.conditionValue,
      // Store essential product data (IDs, titles, and images)
      products: (step.products || []).map((product: any) => ({
        id: product.id,
        title: product.title || 'Product',
        imageUrl: product.imageUrl || null
      })),
      // Only store essential collection data
      collections: (step.collections || []).map((collection: any) => ({
        id: collection.id,
        title: collection.title || 'Collection'
      }))
    }));

    const bundleConfiguration = {
      bundleId: bundle.id,
      name: bundle.name,
      templateName: bundle.templateName || null,
      type: "cart_transform",
      steps: optimizedSteps,
      pricing: {
        enabled: bundle.pricing.enabled,
        method: bundle.pricing.method,
        rules: safeJsonParse(bundle.pricing.rules, []).map((rule: any) => ({
          id: rule.id,
          conditionType: rule.type || 'quantity', // Map type to conditionType (FIXED)
          value: rule.value || 0, // Keep as decimal - widget will convert to cents
          discountValue: rule.discountValue || 0,
          fixedBundlePrice: rule.fixedBundlePrice || 0
        }))
      },
      updatedAt: new Date().toISOString()
    };

    const configSize = JSON.stringify(bundleConfiguration).length;
    AppLogger.debug("📏 [METAFIELD] Sync optimized configuration size:", {}, `${configSize} chars`);

    await updateBundleProductMetafields(admin, productId, bundleConfiguration);
  }

  return json({
    success: true,
    productId,
    message: "Bundle product synchronized successfully"
  });
}

// Handle getting available pages for widget placement
async function handleGetPages(admin: any, _session: any) {
  const GET_PAGES = `
    query getPages($first: Int!) {
      pages(first: $first) {
        nodes {
          id
          title
          handle
          createdAt
          updatedAt
        }
      }
    }
  `;

  const response = await admin.graphql(GET_PAGES, {
    variables: { first: 50 } // Get first 50 pages
  });

  const data = await response.json();

  if (data.data?.pages?.nodes) {
    return json({
      success: true,
      pages: data.data.pages.nodes
    });
  } else {
    return json({
      success: false,
      error: "Failed to fetch pages"
    });
  }
}

// Handle getting theme templates
async function handleGetThemeTemplates(admin: any, session: any) {
  try {
    // Get the published theme directly
    const GET_PUBLISHED_THEME = `
      query getPublishedTheme {
        themes(first: 1, roles: [MAIN]) {
          nodes {
            id
            name
            role
          }
        }
      }
    `;

    const themesResponse = await admin.graphql(GET_PUBLISHED_THEME);

    const themesData = await themesResponse.json();

    if (!themesData.data?.themes?.nodes) {
      return json({
        success: false,
        error: "Failed to fetch themes"
      });
    }

    // Get the published theme (should be the first and only one)
    const publishedTheme = themesData.data.themes.nodes[0];

    if (!publishedTheme) {
      AppLogger.error("No themes returned from GraphQL:", {}, themesData);
      return json({
        success: false,
        error: "No published theme found"
      });
    }


    // Extract theme ID (remove gid prefix if present)
    const themeId = publishedTheme.id.replace('gid://shopify/OnlineStoreTheme/', '');

    // Now fetch theme assets using REST API (since GraphQL doesn't expose theme assets)
    const shop = session.shop;
    const accessToken = session.accessToken;

    const assetsUrl = `https://${shop}/admin/api/2025-01/themes/${themeId}/assets.json`;

    const assetsResponse = await fetch(assetsUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!assetsResponse.ok) {
      const errorText = await assetsResponse.text();
      AppLogger.error("Assets response error:", {
        status: assetsResponse.status,
        statusText: assetsResponse.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch theme assets: ${assetsResponse.status} ${assetsResponse.statusText}`);
    }

    const assetsData = await assetsResponse.json();

    // Get active bundle container products for this shop
    let bundleContainerProducts = [];
    try {
      // First, get active bundles from database to get their product IDs
      const activeBundles = await db.bundle.findMany({
        where: {
          shopId: session.shop,
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          shopifyProductId: true
        }
      });

      AppLogger.debug(`🎯 [TEMPLATE_FILTER] Found ${activeBundles.length} active bundles with container products`);

      // Get bundle container products from Shopify
      if (activeBundles.length > 0) {
        const productIds = activeBundles
          .filter(bundle => bundle.shopifyProductId)
          .map(bundle => bundle.shopifyProductId);

        if (productIds.length > 0) {
          AppLogger.debug(`🎯 [TEMPLATE_FILTER] Product IDs to query:`, productIds);
          AppLogger.debug(`🎯 [TEMPLATE_FILTER] Fetching products with IDs: ${productIds.join(', ')}`);

          const GET_BUNDLE_PRODUCTS = `
            query getBundleContainerProducts($ids: [ID!]!) {
              nodes(ids: $ids) {
                ... on Product {
                  id
                  title
                  handle
                  legacyResourceId
                  featuredImage {
                    url
                  }
                  metafields(first: 5, namespace: "$app") {
                    nodes {
                      key
                      value
                    }
                  }
                }
              }
            }
          `;

          const bundleProductsResponse = await admin.graphql(GET_BUNDLE_PRODUCTS, {
            variables: { ids: productIds }
          });
          const bundleProductsData = await bundleProductsResponse.json();
          bundleContainerProducts = bundleProductsData.data?.nodes?.filter((node: any) => node) || [];

          AppLogger.debug(`🎯 [TEMPLATE_FILTER] Fetched ${bundleContainerProducts.length} bundle container products from Shopify`);
        }
      }
    } catch (error) {
      AppLogger.warn("🎯 [TEMPLATE_FILTER] Could not fetch bundle container products:", {}, error as any);
    }

    // Filter for template files and organize them with bundle context
    const templates = assetsData.assets
      .filter((asset: any) => asset.key.startsWith('templates/') &&
        (asset.key.endsWith('.liquid') || asset.key.endsWith('.json')))
      .map((asset: any) => {
        const templateName = asset.key.replace('templates/', '').replace(/\.(liquid|json)$/, '');
        const isJson = asset.key.endsWith('.json');

        // Determine template type and description
        let title = templateName;
        let description = '';
        let recommended = false;
        let bundleRelevant = false;

        if (templateName === 'index') {
          title = 'Homepage';
          description = 'Main landing page of your store - useful for promoting bundles';
          recommended = false;
          bundleRelevant = true;
        } else if (templateName.startsWith('product')) {
          // Product templates are most relevant for bundle widgets
          title = templateName === 'product' ? 'Product Pages (Default)' : `Product - ${templateName.replace('product.', '')}`;
          description = 'Individual product detail pages - ideal for bundle widgets';
          recommended = templateName === 'product';
          bundleRelevant = true;
        } else if (templateName.startsWith('collection')) {
          title = templateName === 'collection' ? 'Collection Pages' : `Collection - ${templateName.replace('collection.', '')}`;
          description = 'Product collection listing pages - can promote bundle collections';
          recommended = false;
          bundleRelevant = true;
        } else if (templateName === 'page') {
          title = 'Static Pages';
          description = 'Custom content pages (About, Contact, etc.) - useful for bundle explanations';
          recommended = false;
          bundleRelevant = false;
        } else if (templateName === 'cart') {
          title = 'Cart Page';
          description = 'Shopping cart page - not recommended for bundle widgets (cart transforms handle this)';
          recommended = false;
          bundleRelevant = false;
        } else if (templateName === 'search') {
          title = 'Search Results';
          description = 'Search results page - can show bundle products in search';
          recommended = false;
          bundleRelevant = false;
        } else {
          title = templateName.charAt(0).toUpperCase() + templateName.slice(1);
          description = `${title} template`;
          recommended = false;
          bundleRelevant = false;
        }

        return {
          id: templateName,
          title,
          handle: templateName,
          description,
          recommended,
          bundleRelevant,
          fileType: isJson ? 'JSON' : 'Liquid',
          fullKey: asset.key
        };
      })
      // ENHANCED FILTERING: Show only product templates for bundle widgets
      .filter((template: any) => {
        // Only show product templates - bundles work best on product pages
        return template.handle.startsWith('product');
      })
      .sort((a: any, b: any) => {
        // Sort by recommended first, then alphabetically
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return a.title.localeCompare(b.title);
      });

    AppLogger.debug(`🎯 [TEMPLATE_FILTER] Filtered to ${templates.length} product templates`);

    // PRIORITIZE: Bundle container product specific templates with auto-creation
    const bundleSpecificTemplates: any[] = [];
    if (bundleContainerProducts.length > 0) {
      AppLogger.debug(`🎯 [TEMPLATE_FILTER] Creating ${bundleContainerProducts.length} bundle-specific template recommendations`);

      const templateService = new ThemeTemplateService(admin, session);

      for (const product of bundleContainerProducts) {
        // Check if template exists, create if it doesn't
        const templateResult = await templateService.ensureProductTemplate(product.handle);

        bundleSpecificTemplates.push({
          id: `product.${product.handle}`,
          title: `📦 ${product.title} (Bundle Container)`,
          handle: `product.${product.handle}`,
          description: templateResult.created
            ? `✨ NEW TEMPLATE CREATED for ${product.title} - Widget automatically configured!`
            : `Dedicated template for ${product.title} - Widget will be placed here`,
          recommended: true,
          bundleRelevant: true,
          fileType: templateResult.created ? 'NEW' : 'Existing',
          fullKey: templateResult.templatePath || `templates/product.${product.handle}.json`,
          bundleProduct: product, // Store product data for preview path
          isBundleContainer: true,
          templateCreated: templateResult.created,
          templateExists: templateResult.success
        });

        AppLogger.debug(`🎯 [TEMPLATE_FILTER] Product ${product.handle}: Template ${templateResult.success ? 'ready' : 'failed'} ${templateResult.created ? '(created)' : '(exists)'}`);
      }
    }

    // COMBINE: Bundle-specific templates first, then general product templates
    const allTemplates = [
      ...bundleSpecificTemplates,
      ...templates.filter((t: any) => !bundleSpecificTemplates.some((bt: any) => bt.handle === t.handle))
    ];

    AppLogger.debug(`🎯 [TEMPLATE_FILTER] Final template list: ${allTemplates.length} templates (${bundleSpecificTemplates.length} bundle-specific)`);

    // Add general product template as fallback if not already present
    const hasGeneralProductTemplate = allTemplates.some(t => t.handle === 'product');
    if (!hasGeneralProductTemplate) {
      allTemplates.push({
        id: 'product',
        title: '🛍️ All Product Pages (General)',
        handle: 'product',
        description: 'Default product template - widget will appear on all product pages',
        recommended: bundleSpecificTemplates.length === 0, // Only recommend if no bundle products
        bundleRelevant: true,
        fileType: 'General',
        fullKey: 'templates/product.liquid',
        isBundleContainer: false
      });
    }

    return json({
      success: true,
      templates: allTemplates,
      themeId,
      themeName: publishedTheme.name,
      bundleContainerCount: bundleSpecificTemplates.length
    });

  } catch (error) {
    AppLogger.error("Error fetching theme templates:", {}, error as any);
    return json({
      success: false,
      error: "Failed to fetch theme templates"
    });
  }
}

// Handle getting current theme for deep linking
async function handleGetCurrentTheme(admin: any, _session: any) {
  const GET_CURRENT_THEME = `
    query getCurrentTheme {
      themes(first: 1, query: "role:main") {
        nodes {
          id
          name
          role
        }
      }
    }
  `;

  const response = await admin.graphql(GET_CURRENT_THEME);
  const data = await response.json();

  if (data.data?.themes?.nodes?.[0]) {
    const theme = data.data.themes.nodes[0];
    return json({
      success: true,
      themeId: theme.id.replace('gid://shopify/Theme/', ''),
      themeName: theme.name
    });
  } else {
    return json({
      success: false,
      error: "Failed to fetch current theme"
    });
  }
}

// Handle cleanup of deleted bundle metafields
async function handleCleanupDeletedBundles(admin: any, session: any) {
  try {
    AppLogger.debug("🧹 [CLEANUP] Starting cleanup of deleted bundle metafields");

    // Get all active bundles from database
    const activeBundles = await db.bundle.findMany({
      where: {
        shopId: session.shop
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    });

    AppLogger.debug(`🧹 [CLEANUP] Found ${activeBundles.length} active bundles in database`);

    // Get current shop metafield data
    const SHOP_METAFIELD_QUERY = `
      query getShopBundleMetafield {
        shop {
          metafield(namespace: "custom", key: "all_bundles") {
            id
            value
          }
        }
      }
    `;

    const metafieldResponse = await admin.graphql(SHOP_METAFIELD_QUERY);
    const metafieldData = await metafieldResponse.json();

    let currentBundleData = {};
    if (metafieldData.data?.shop?.metafield?.value) {
      try {
        currentBundleData = JSON.parse(metafieldData.data.shop.metafield.value);
        AppLogger.debug(`🧹 [CLEANUP] Current metafield contains ${Object.keys(currentBundleData).length} bundle entries`);
      } catch (error) {
        AppLogger.error("🧹 [CLEANUP] Error parsing current metafield data:", {}, error as any);
      }
    }

    // Create cleaned bundle data with only active bundles
    const cleanedBundleData: Record<string, any> = {};
    const activeBundleIds = new Set(activeBundles.map(b => b.id));

    for (const [bundleId, bundleConfig] of Object.entries(currentBundleData)) {
      if (activeBundleIds.has(bundleId)) {
        cleanedBundleData[bundleId] = bundleConfig;
        AppLogger.debug(`🧹 [CLEANUP] Keeping bundle: ${bundleId}`);
      } else {
        AppLogger.debug(`🧹 [CLEANUP] Removing deleted bundle: ${bundleId}`);
      }
    }

    const removedCount = Object.keys(currentBundleData).length - Object.keys(cleanedBundleData).length;
    AppLogger.debug(`🧹 [CLEANUP] Removed ${removedCount} deleted bundle entries`);

    // Update shop metafield with cleaned data if needed
    if (removedCount > 0) {
      const UPDATE_SHOP_METAFIELD = `
        mutation updateShopMetafield($metafields: [MetafieldInput!]!) {
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
            }
          }
        }
      `;

      const metafieldInput = [{
        namespace: "custom",
        key: "all_bundles",
        type: "json",
        value: JSON.stringify(cleanedBundleData),
        ownerId: `gid://shopify/Shop/${session.shop.split('.')[0]}`
      }];

      const updateResponse = await admin.graphql(UPDATE_SHOP_METAFIELD, {
        variables: { metafields: metafieldInput }
      });

      const updateData = await updateResponse.json();

      if (updateData.data?.metafieldsSet?.userErrors?.length > 0) {
        AppLogger.error("🧹 [CLEANUP] Error updating shop metafield:", {}, updateData.data.metafieldsSet.userErrors);
        return json({
          success: false,
          error: "Failed to update shop metafield",
          details: updateData.data.metafieldsSet.userErrors
        }, { status: 500 });
      }

      AppLogger.debug("🧹 [CLEANUP] Shop metafield updated successfully");
    }

    return json({
      success: true,
      message: `Cleanup completed. Removed ${removedCount} deleted bundle entries.`,
      activeBundlesCount: activeBundles.length,
      removedBundlesCount: removedCount
    });

  } catch (error) {
    AppLogger.error("🧹 [CLEANUP] Error during cleanup:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Cleanup failed"
    }, { status: 500 });
  }
}

// Handle ensuring bundle templates exist
async function handleEnsureBundleTemplates(admin: any, session: any) {
  try {
    AppLogger.debug("🎨 [TEMPLATE_HANDLER] Ensuring bundle templates exist");

    const templateService = new ThemeTemplateService(admin, session);

    // Get all active bundles with container products
    const activeBundles = await db.bundle.findMany({
      where: {
        shopId: session.shop,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        shopifyProductId: true
      }
    });

    AppLogger.debug(`🎨 [TEMPLATE_HANDLER] Found ${activeBundles.length} active bundles`);

    if (activeBundles.length === 0) {
      return json({
        success: true,
        message: "No active bundles found - no templates to create",
        results: []
      });
    }

    // Get product handles from Shopify
    const productIds = activeBundles
      .filter(bundle => bundle.shopifyProductId)
      .map(bundle => bundle.shopifyProductId);

    if (productIds.length === 0) {
      return json({
        success: true,
        message: "No bundle container products found",
        results: []
      });
    }

    const GET_BUNDLE_PRODUCTS = `
      query getBundleContainerProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            handle
            title
            legacyResourceId
          }
        }
      }
    `;

    const response = await admin.graphql(GET_BUNDLE_PRODUCTS, {
      variables: { ids: productIds }
    });
    const data = await response.json();
    const products = data.data?.nodes?.filter((node: any) => node) || [];

    AppLogger.debug(`🎨 [TEMPLATE_HANDLER] Found ${products.length} bundle container products`);

    // Create templates for each bundle container product
    const results = [];
    for (const product of products) {
      AppLogger.debug(`🎨 [TEMPLATE_HANDLER] Processing product: ${product.title} (${product.handle})`);

      const result = await templateService.ensureProductTemplate(product.handle);
      results.push({
        productId: product.id,
        productHandle: product.handle,
        productTitle: product.title,
        templatePath: result.templatePath,
        created: result.created || false,
        success: result.success,
        error: result.error
      });

      AppLogger.debug(`🎨 [TEMPLATE_HANDLER] Product ${product.handle}: ${result.success ? 'SUCCESS' : 'FAILED'} ${result.created ? '(CREATED)' : '(EXISTS)'}`);
    }

    const successCount = results.filter(r => r.success).length;
    const createdCount = results.filter(r => r.created).length;

    AppLogger.debug(`🎨 [TEMPLATE_HANDLER] Template creation completed: ${successCount}/${results.length} successful, ${createdCount} created`);

    return json({
      success: true,
      message: `Template creation completed: ${successCount}/${results.length} successful, ${createdCount} new templates created`,
      results,
      summary: {
        totalProducts: products.length,
        successCount,
        createdCount,
        failedCount: results.length - successCount
      }
    });

  } catch (error) {
    AppLogger.error("🔥 [TEMPLATE_HANDLER] Error during template creation:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Template creation failed"
    }, { status: 500 });
  }
}

export default function ConfigureBundleFlow() {
  const { bundle, bundleProduct: loadedBundleProduct, shop } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();

  // State for form controls
  const [bundleStatus, setBundleStatus] = useState(bundle.status);
  const [activeSection, setActiveSection] = useState("step_setup");
  const [bundleName, setBundleName] = useState(bundle.name);
  const [bundleDescription, setBundleDescription] = useState(bundle.description || "");
  const [templateName, setTemplateName] = useState(bundle.templateName || "");

  // State for step management
  // 🔧 FIX: Transform StepProduct to use productId as id (not the database UUID)
  const [steps, setSteps] = useState(
    (bundle.steps || []).map((step: any) => ({
      ...step,
      StepProduct: (step.StepProduct || []).map((sp: any) => ({
        ...sp,
        id: sp.productId,  // Use productId (Shopify GID) as id, not database UUID
        // Keep other fields intact
      }))
    }))
  );
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState(0);

  // Initialize step conditions from bundle data
  const initializeStepConditions = () => {
    const initialConditions: Record<string, any[]> = {};
    (bundle.steps || []).forEach((step: any) => {
      if (step.conditionType && step.conditionOperator && step.conditionValue !== null) {
        initialConditions[step.id] = [{
          id: `condition_${step.id}_${Date.now()}`,
          type: step.conditionType,
          operator: step.conditionOperator,
          value: step.conditionValue.toString()
        }];
      }
    });
    return initialConditions;
  };

  const [stepConditions, setStepConditions] = useState<Record<string, any[]>>(initializeStepConditions);
  AppLogger.debug("[DEBUG] Initial step conditions state:", stepConditions);


  // State for page selection modal
  const [isPageSelectionModalOpen, setIsPageSelectionModalOpen] = useState(false);
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);

  // State for products/collections view modals
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
  const [currentModalStepId, setCurrentModalStepId] = useState<string>('');

  // State for bundle product - initialize with loaded data
  const [bundleProduct, setBundleProduct] = useState<any>(loadedBundleProduct || null);
  const [productStatus, setProductStatus] = useState(loadedBundleProduct?.status || "ACTIVE");

  // State for collections - initialize with data from loaded bundle steps
  const [selectedCollections, setSelectedCollections] = useState<Record<string, any[]>>(() => {
    const collections: Record<string, any[]> = {};
    bundle.steps?.forEach(step => {
      if (step.collections && Array.isArray(step.collections) && step.collections.length > 0) {
        collections[step.id] = step.collections;
      }
    });
    return collections;
  });

  // State for discount & pricing - using new standardized structure
  const [discountEnabled, setDiscountEnabled] = useState(bundle.pricing?.enabled || false);
  const [discountType, setDiscountType] = useState<DiscountMethod>(
    (bundle.pricing?.method as DiscountMethod) || DiscountMethod.PERCENTAGE_OFF
  );
  const [discountRules, setDiscountRules] = useState<PricingRule[]>(
    Array.isArray(bundle.pricing?.rules) ? bundle.pricing.rules : []
  );
  const [showProgressBar, setShowProgressBar] = useState(bundle.pricing?.showProgressBar || false);
  const [showFooter, setShowFooter] = useState(bundle.pricing?.showFooter !== false);
  const [discountMessagingEnabled, setDiscountMessagingEnabled] = useState(true);

  // State for rule-specific messaging
  const [ruleMessages, setRuleMessages] = useState<Record<string, { discountText: string; successMessage: string }>>({});
  const [showVariables, setShowVariables] = useState(false);

  // Section-specific change tracking
  const [sectionChanges, setSectionChanges] = useState<Record<string, boolean>>({
    step_setup: false,
    discount_pricing: false
  });

  // Track original values for change detection - initialize with loaded data to prevent false positives
  const [originalValues, setOriginalValues] = useState({
    status: bundle.status,
    name: bundle.name,
    description: bundle.description || "",
    templateName: bundle.templateName || "",
    steps: JSON.stringify(
      (bundle.steps || []).map((step: any) => ({
        ...step,
        StepProduct: (step.StepProduct || []).map((sp: any) => ({
          ...sp,
          id: sp.productId,  // Transform to use Shopify GID, not database UUID
        }))
      }))
    ),
    discountEnabled: bundle.pricing?.enabled || false,
    discountType: bundle.pricing?.method || DiscountMethod.PERCENTAGE_OFF,
    discountRules: JSON.stringify(bundle.pricing?.rules || []),
    showProgressBar: bundle.pricing?.showProgressBar || false,
    showFooter: bundle.pricing?.showFooter !== false,
    discountMessagingEnabled: true,
    selectedCollections: JSON.stringify({}),
    ruleMessages: JSON.stringify({}),
    stepConditions: JSON.stringify(initializeStepConditions()),
    bundleProduct: loadedBundleProduct || null, // Initialize with loaded data, ensuring null if undefined
    productStatus: loadedBundleProduct?.status || "ACTIVE",
  });

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Helper function to trigger contextual save bar
  const triggerSaveBar = useCallback(() => {
    // Use requestAnimationFrame for better performance and timing
    requestAnimationFrame(() => {
      try {
        // Find the form with data-save-bar attribute
        const form = document.querySelector('form[data-save-bar]') as HTMLFormElement;
        if (!form) {
          // Retry after a short delay if form is not found
          setTimeout(() => {
            const retryForm = document.querySelector('form[data-save-bar]') as HTMLFormElement;
            if (retryForm) {
              const retryInputs = retryForm.querySelectorAll('input');
              if (retryInputs.length > 0) {
                const changeEvent = new Event('change', { bubbles: true, cancelable: true });
                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                const visibleInput = Array.from(retryInputs).find(input =>
                  input.type !== 'hidden' && input.offsetParent !== null
                ) || retryInputs[0];
                visibleInput.dispatchEvent(inputEvent);
                visibleInput.dispatchEvent(changeEvent);
              }
            }
          }, 100);
          return;
        }

        // Get all input elements in the form
        const formInputs = form.querySelectorAll('input');
        if (formInputs.length === 0) {
          return;
        }

        // Trigger multiple event types to ensure App Bridge detects changes
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });

        // Try triggering on first visible input
        const visibleInput = Array.from(formInputs).find(input =>
          input.type !== 'hidden' && input.offsetParent !== null
        ) || formInputs[0];

        visibleInput.dispatchEvent(inputEvent);
        visibleInput.dispatchEvent(changeEvent);

      } catch (error) {
        AppLogger.error('Error triggering save bar:', {}, error as any);
        // Fallback: Try to trigger on any form element
        try {
          const anyForm = document.querySelector('form') as HTMLFormElement;
          if (anyForm) {
            const anyInputs = anyForm.querySelectorAll('input');
            if (anyInputs.length > 0) {
              const changeEvent = new Event('change', { bubbles: true, cancelable: true });
              const inputEvent = new Event('input', { bubbles: true, cancelable: true });
              const visibleInput = Array.from(anyInputs).find(input =>
                input.type !== 'hidden' && input.offsetParent !== null
              ) || anyInputs[0];
              visibleInput.dispatchEvent(inputEvent);
              visibleInput.dispatchEvent(changeEvent);
            }
          }
        } catch (fallbackError) {
          AppLogger.error('Fallback save bar trigger also failed:', {}, fallbackError as any);
        }
      }
    });
  }, []);

  // Helper function to dismiss contextual save bar when no changes exist
  const dismissSaveBar = useCallback(() => {
    // Use requestAnimationFrame for better performance and timing
    requestAnimationFrame(() => {
      try {
        // Find the form with data-save-bar attribute
        const form = document.querySelector('form[data-save-bar]') as HTMLFormElement;
        if (!form) {
          return;
        }

        // For modern App Bridge (4.x.x), we don't need to manually dismiss the save bar
        // It automatically dismisses when form inputs return to their original values
        // We just need to ensure the hidden inputs reflect the current state correctly
        const formInputs = form.querySelectorAll('input[type="hidden"]');
        formInputs.forEach((input) => {
          const htmlInput = input as HTMLInputElement;
          // Update hidden inputs to current values without triggering events
          if (htmlInput.name) {
            // Update the value silently to reflect current state
            const currentValue = getCurrentValueForField(htmlInput.name);
            if (currentValue !== undefined) {
              htmlInput.value = currentValue;
            }
          }
        });

      } catch (error) {
        AppLogger.error('Error dismissing save bar:', {}, error as any);
      }
    });
  }, []);

  // Helper function to get current value for a field
  const getCurrentValueForField = useCallback((fieldName: string): string => {
    switch (fieldName) {
      case 'bundleName':
        return bundleName;
      case 'bundleDescription':
        return bundleDescription;
      case 'templateName':
        return templateName;
      case 'bundleStatus':
        return bundleStatus;
      case 'stepsData':
        return JSON.stringify(steps);
      case 'discountData':
        return JSON.stringify({ discountEnabled, discountType, discountRules });
      case 'selectedCollections':
        return JSON.stringify(selectedCollections);
      case 'stepConditions':
        return JSON.stringify(stepConditions);
      case 'bundleProduct':
        return JSON.stringify(bundleProduct);
      case 'productStatus':
        return productStatus;
      default:
        return '';
    }
  }, [bundleName, bundleDescription, templateName, bundleStatus, steps, discountEnabled, discountType, discountRules, showProgressBar, showFooter, selectedCollections, stepConditions, bundleProduct, productStatus]);

  // Check for changes whenever form values change
  useEffect(() => {
    // Helper function to safely compare bundle products
    const compareBundleProducts = (current: any, original: any) => {
      if (!current && !original) return true;
      if (!current || !original) return false;
      return current.id === original.id;
    };

    const stepSetupChanges = (
      bundleName !== originalValues.name ||
      bundleDescription !== originalValues.description ||
      templateName !== originalValues.templateName ||
      JSON.stringify(steps) !== originalValues.steps ||
      JSON.stringify(selectedCollections) !== originalValues.selectedCollections ||
      JSON.stringify(stepConditions) !== originalValues.stepConditions ||
      !compareBundleProducts(bundleProduct, originalValues.bundleProduct) ||
      productStatus !== originalValues.productStatus
    );

    const discountPricingChanges = (
      discountEnabled !== originalValues.discountEnabled ||
      discountType !== originalValues.discountType ||
      JSON.stringify(discountRules) !== originalValues.discountRules ||
      showProgressBar !== originalValues.showProgressBar ||
      showFooter !== originalValues.showFooter ||
      discountMessagingEnabled !== originalValues.discountMessagingEnabled ||
      JSON.stringify(ruleMessages) !== originalValues.ruleMessages
    );

    const bundleStatusChanges = (
      bundleStatus !== originalValues.status
    );

    const hasChanges = stepSetupChanges || discountPricingChanges || bundleStatusChanges;

    // Update section-specific changes
    setSectionChanges({
      step_setup: stepSetupChanges,
      discount_pricing: discountPricingChanges
    });

    setHasUnsavedChanges(hasChanges);

    // Simplified save bar management - no timeout
    if (hasChanges) {
      triggerSaveBar();
    } else {
      dismissSaveBar();
    }
  }, [
    bundleStatus, bundleName, bundleDescription, templateName, steps,
    discountEnabled, discountType, discountRules, showProgressBar, showFooter,
    discountMessagingEnabled, ruleMessages,
    selectedCollections, stepConditions, bundleProduct, productStatus,
    originalValues
  ]);

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      // Prepare form data for submission
      const formData = new FormData();
      formData.append("intent", "saveBundle");
      formData.append("bundleName", bundleName);
      formData.append("bundleDescription", bundleDescription);
      formData.append("templateName", templateName);
      formData.append("bundleStatus", bundleStatus);
      // Merge collections data into steps before saving
      const stepsWithCollections = steps.map(step => ({
        ...step,
        collections: selectedCollections[step.id] || step.collections || []
      }));

      formData.append("stepsData", JSON.stringify(stepsWithCollections));
      formData.append("discountData", JSON.stringify({
        discountEnabled,
        discountType,
        discountRules,
        discountMessagingEnabled,
        ruleMessages
      }));
      formData.append("stepConditions", JSON.stringify(stepConditions));
      formData.append("bundleProduct", JSON.stringify(bundleProduct));
      AppLogger.debug("[DEBUG] Submitting step conditions to server:", stepConditions);
      AppLogger.debug("[DEBUG] Submitting bundle product to server:", bundleProduct);

      // Submit to server action using fetcher

      fetcher.submit(formData, { method: "post" });

      // Note: With useFetcher, we need to handle the response via useEffect
      // The immediate return here will be handled by the fetcher response
      return;
    } catch (error) {
      AppLogger.error("Save failed:", {}, error as any);
      shopify.toast.show((error as Error).message || "Failed to save changes", { isError: true });
    }
  }, [bundleStatus, bundleName, bundleDescription, templateName, steps, discountEnabled, discountType, discountRules, showProgressBar, showFooter, discountMessagingEnabled, ruleMessages, selectedCollections, stepConditions, bundleProduct, productStatus, shopify]);

  // Function to enhance template list with user's selected template
  const enhanceTemplateListWithUserSelection = useCallback((templates: any[]) => {
    if (!templateName || templateName.trim() === '') {
      return templates;
    }

    const userTemplateHandle = templateName.startsWith('product.') ? templateName : `product.${templateName}`;

    // Check if user's template already exists in the list
    const templateExists = templates.some(t => t.handle === userTemplateHandle || t.handle === templateName);

    if (!templateExists) {
      // Add user's selected template at the top of the list
      const userTemplate = {
        id: userTemplateHandle,
        title: `🎯 ${templateName} (Your Selection)`,
        handle: userTemplateHandle,
        description: `Custom template "${templateName}" - your selected bundle container template`,
        recommended: true,
        bundleRelevant: true,
        fileType: 'User Selected',
        fullKey: `templates/${userTemplateHandle}.liquid`,
        isBundleContainer: true,
        isUserSelected: true
      };

      return [userTemplate, ...templates];
    }

    // If template exists, mark it as user selected
    return templates.map(t => {
      if (t.handle === userTemplateHandle || t.handle === templateName) {
        return {
          ...t,
          title: `🎯 ${t.title} (Your Selection)`,
          recommended: true,
          isUserSelected: true
        };
      }
      return t;
    });
  }, [templateName]);

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      const result = fetcher.data;

      // Handle different action types based on the response or form data
      if (result.success) {
        // Check if this was a save bundle action by looking for bundle data in response
        if ('bundle' in result && result.bundle) {
          // This is a save bundle response
          setOriginalValues({
            status: bundleStatus,
            name: bundleName,
            description: bundleDescription,
            templateName: templateName,
            steps: JSON.stringify(steps),
            discountEnabled: discountEnabled,
            discountType: discountType,
            discountRules: JSON.stringify(discountRules),
            showProgressBar: showProgressBar,
            showFooter: showFooter,
            discountMessagingEnabled: discountMessagingEnabled,
            selectedCollections: JSON.stringify(selectedCollections),
            ruleMessages: JSON.stringify(ruleMessages),
            stepConditions: JSON.stringify(stepConditions),
            bundleProduct: bundleProduct || null,
            productStatus: productStatus,
          });

          // Reset section changes after successful save
          setSectionChanges({
            step_setup: false,
            discount_pricing: false
          });

          shopify.toast.show(('message' in result ? result.message : null) || "Changes saved successfully", { isError: false });
        } else if ('productId' in result && result.productId) {
          // This is a sync product response
          const syncMessage = ('message' in result ? result.message : null) || "Product synced successfully";
          shopify.toast.show(syncMessage, { isError: false });

          // Show detailed sync information if available
          if ('syncedData' in result && result.syncedData) {
            const syncedData = result.syncedData as any;
            const { title, status, lastUpdated, changesDetected } = syncedData;
            AppLogger.debug('Sync data:', { title, status, lastUpdated, changesDetected });

            // If changes were detected and applied, show additional notification
            if (changesDetected) {
              setTimeout(() => {
                shopify.toast.show("Bundle data updated with changes from Shopify product", { isError: false });
              }, 2000);
            }
          }

          // Note: Removed forced page reload to preserve unsaved UI changes
          // The sync updates metafields but doesn't affect the current UI state
        } else if ('templates' in result && result.templates) {
          // This is a get theme templates response
          const rawTemplates = (result as any).templates || [];
          const enhancedTemplates = enhanceTemplateListWithUserSelection(rawTemplates);
          setAvailablePages(enhancedTemplates);
          setIsLoadingPages(false);
        } else if ('themeId' in result && result.themeId) {
          // This is a get current theme response - handled by individual callbacks
        } else {
          // Generic success response
          shopify.toast.show(('message' in result ? result.message : null) || "Operation completed successfully", { isError: false });
        }
      } else {
        // Handle errors based on action type
        const errorMessage = ('error' in result ? result.error : null) || "Operation failed";
        shopify.toast.show(errorMessage, { isError: true });

        // Handle specific error cases
        if (errorMessage.includes("pages") || errorMessage.includes("templates")) {
          setIsLoadingPages(false);
        }
      }
    }
  }, [fetcher.data, fetcher.state, bundleStatus, bundleName, bundleDescription, templateName, steps, discountEnabled, discountType, discountRules, showProgressBar, showFooter, discountMessagingEnabled, selectedCollections, ruleMessages, stepConditions, bundleProduct, productStatus, shopify, enhanceTemplateListWithUserSelection]);

  // Discard handler
  const handleDiscard = useCallback(() => {
    try {
      // Reset to original values
      setBundleStatus(originalValues.status);
      setBundleName(originalValues.name);
      setBundleDescription(originalValues.description);
      setTemplateName(originalValues.templateName);
      setSteps(JSON.parse(originalValues.steps));
      setDiscountEnabled(originalValues.discountEnabled);
      setDiscountType(originalValues.discountType as DiscountMethod);
      setDiscountRules(JSON.parse(originalValues.discountRules));
      setShowProgressBar(originalValues.showProgressBar);
      setShowFooter(originalValues.showFooter);
      setDiscountMessagingEnabled(originalValues.discountMessagingEnabled);
      setSelectedCollections(JSON.parse(originalValues.selectedCollections));
      setRuleMessages(JSON.parse(originalValues.ruleMessages));
      setStepConditions(JSON.parse(originalValues.stepConditions));
      // Keep the loaded bundle product instead of resetting to null
      setBundleProduct(originalValues.bundleProduct || loadedBundleProduct || null);
      setProductStatus(originalValues.productStatus);

      // Reset section changes after discard
      setSectionChanges({
        step_setup: false,
        discount_pricing: false
      });

      shopify.toast.show("Changes discarded", { isError: false });
    } catch (error) {
      AppLogger.error("Error discarding changes:", {}, error as any);
      shopify.toast.show("Error discarding changes", { isError: true });
    }
  }, [originalValues, loadedBundleProduct, shopify]);

  // Emergency force navigation state for escape hatch
  const [forceNavigation, setForceNavigation] = useState(false);

  // Navigation handlers with unsaved changes check
  const handleBackClick = useCallback(() => {
    if (hasUnsavedChanges && !forceNavigation) {
      // Show user-friendly message about unsaved changes with force option
      const proceed = confirm(
        "You have unsaved changes. Are you sure you want to leave this page?\n\n" +
        "Click 'OK' to leave anyway (changes will be lost)\n" +
        "Click 'Cancel' to stay and save your changes"
      );

      if (proceed) {
        setForceNavigation(true);
        // Force navigation even with unsaved changes
        navigate("/app/bundles/cart-transform");
      } else {
        shopify.toast.show("Save or discard your changes to continue", {
          isError: true,
          duration: 4000
        });
      }
      return;
    }
    navigate("/app/bundles/cart-transform");
  }, [hasUnsavedChanges, forceNavigation, navigate, shopify]);

  const handlePreviewBundle = useCallback(() => {
    if (hasUnsavedChanges) {
      // Show user-friendly message about unsaved changes
      shopify.toast.show("Please save your changes before previewing the bundle", {
        isError: true,
        duration: 4000
      });
      return;
    }

    // Check if bundle product exists
    if (!bundleProduct) {
      shopify.toast.show("Bundle product not found. Please select a bundle product first.", {
        isError: true,
        duration: 4000
      });
      return;
    }

    // Try different URL construction methods
    let productUrl = null;

    AppLogger.debug('Bundle product data for preview:', {
      id: bundleProduct.id,
      handle: bundleProduct.handle,
      status: bundleProduct.status,
      publishedOnCurrentPublication: bundleProduct.status === 'ACTIVE',
      onlineStoreUrl: bundleProduct.onlineStoreUrl,
      onlineStorePreviewUrl: bundleProduct.onlineStorePreviewUrl,
      shop: shop
    });

    // Method 1: Use onlineStorePreviewUrl first (works for both published and draft products)
    if (bundleProduct.onlineStorePreviewUrl) {
      productUrl = bundleProduct.onlineStorePreviewUrl;
    }
    // Method 2: Fallback to onlineStoreUrl if preview URL not available
    else if (bundleProduct.onlineStoreUrl) {
      productUrl = bundleProduct.onlineStoreUrl;
    }
    // Method 3: Construct URL based on shop type (development vs live store)
    else if (bundleProduct.handle) {
      if (shop.includes('shopifypreview.com')) {
        // For development stores with shopifypreview.com domain
        productUrl = `https://${shop}/products/${bundleProduct.handle}`;
      } else {
        // For live stores or development stores with myshopify.com
        const shopDomain = shop.includes('.myshopify.com')
          ? shop.replace('.myshopify.com', '')
          : shop;
        productUrl = `https://${shopDomain}.myshopify.com/products/${bundleProduct.handle}`;
      }
    }
    // Method 4: Fallback - Extract ID and use admin URL
    else if (bundleProduct.id) {
      const productId = bundleProduct.id.includes('gid://shopify/Product/')
        ? bundleProduct.id.split('/').pop()
        : bundleProduct.id;

      const shopDomain = shop.includes('.myshopify.com')
        ? shop.replace('.myshopify.com', '')
        : shop.split('.')[0]; // Extract first part of domain

      productUrl = `https://admin.shopify.com/store/${shopDomain}/products/${productId}`;
    }

    if (productUrl) {
      window.open(productUrl, '_blank');

      // Show appropriate success message based on the URL type used
      const isPreviewUrl = productUrl === bundleProduct.onlineStorePreviewUrl;
      const message = isPreviewUrl
        ? "Bundle product preview opened in new tab"
        : "Bundle product opened in new tab";

      shopify.toast.show(message, { isError: false });
    } else {
      AppLogger.error('Bundle product data:', {}, bundleProduct);
      shopify.toast.show("Unable to determine bundle product URL. Please check bundle product configuration.", {
        isError: true,
        duration: 5000
      });
    }
  }, [hasUnsavedChanges, bundleProduct, shop, shopify]);

  const handleSectionChange = useCallback((section: string) => {
    if (hasUnsavedChanges) {
      // Show user-friendly message about unsaved changes
      shopify.toast.show("Please save or discard your changes before switching sections", {
        isError: true,
        duration: 4000
      });
      return;
    }

    // Clear section-specific changes when successfully navigating
    setSectionChanges(prev => ({
      ...prev,
      [activeSection]: false,
      [section]: false
    }));

    setActiveSection(section);
  }, [hasUnsavedChanges, activeSection, shopify]);

  // Modal handlers for products and collections view
  const handleShowProducts = useCallback((stepId: string) => {
    setCurrentModalStepId(stepId);
    setIsProductsModalOpen(true);
  }, []);

  const handleShowCollections = useCallback((stepId: string) => {
    setCurrentModalStepId(stepId);
    setIsCollectionsModalOpen(true);
  }, []);

  const handleCloseProductsModal = useCallback(() => {
    setIsProductsModalOpen(false);
    setCurrentModalStepId('');
  }, []);

  const handleCloseCollectionsModal = useCallback(() => {
    setIsCollectionsModalOpen(false);
    setCurrentModalStepId('');
  }, []);

  // Step management functions


  const toggleStepExpansion = useCallback((stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  }, [expandedSteps]);

  const updateStepField = useCallback((stepId: string, field: string, value: any) => {
    setSteps(prev => {
      const newSteps = prev.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step
      ) as any;

      // Trigger save bar for step field changes
      triggerSaveBar();

      return newSteps;
    });
  }, [triggerSaveBar]);

  // Condition management functions
  const addConditionRule = useCallback((stepId: string) => {
    const newRule = {
      id: `rule-${Date.now()}`,
      type: 'quantity',
      operator: 'equal_to',
      value: '0',
    };
    AppLogger.debug(`[DEBUG] Adding condition rule for step ${stepId}:`, newRule);
    setStepConditions(prev => {
      const updated = {
        ...prev,
        [stepId]: [...(prev[stepId] || []), newRule],
      };
      AppLogger.debug(`[DEBUG] Updated step conditions state:`, updated);
      return updated;
    });

    // Modern App Bridge will automatically detect form changes
    setHasUnsavedChanges(true);
  }, [triggerSaveBar]);

  const removeConditionRule = useCallback((stepId: string, ruleId: string) => {
    setStepConditions(prev => ({
      ...prev,
      [stepId]: (prev[stepId] || []).filter(rule => rule.id !== ruleId),
    }));

    // Modern App Bridge will automatically detect form changes
    setHasUnsavedChanges(true);
  }, [triggerSaveBar]);

  const updateConditionRule = useCallback((stepId: string, ruleId: string, field: string, value: string) => {
    AppLogger.debug(`[DEBUG] Updating condition rule - Step: ${stepId}, Rule: ${ruleId}, Field: ${field}, Value: ${value}`);
    setStepConditions(prev => {
      const updated = {
        ...prev,
        [stepId]: (prev[stepId] || []).map(rule =>
          rule.id === ruleId ? { ...rule, [field]: value } : rule
        ),
      };
      AppLogger.debug(`[DEBUG] Updated step conditions after field update:`, updated);
      return updated;
    });

    // Modern App Bridge will automatically detect form changes
    setHasUnsavedChanges(true);
  }, [triggerSaveBar]);

  // Helper function to get unique product count
  // When variants are displayed as individual products, the same product ID may appear multiple times
  const getUniqueProductCount = useCallback((stepProducts: any[]) => {
    if (!stepProducts || stepProducts.length === 0) return 0;
    const uniqueProductIds = new Set(stepProducts.map((p) => p.id));
    return uniqueProductIds.size;
  }, []);

  // Product selection handlers
  const handleProductSelection = useCallback(async (stepId: string) => {
    try {
      const step = steps.find(s => s.id === stepId);
      const currentProducts = step?.StepProduct || [];

      // Build selectionIds from StepProduct
      // When loaded from DB: use productId field
      // When from resource picker: use id field
      // If variants exist and are selected, include them in the format needed by resource picker
      const selectionIds = currentProducts.map((p: any) => {
        const productGid = p.productId || p.id; // productId from DB, id from picker
        AppLogger.debug(`🔍 [SELECTION_ID] Product: ${p.title}, productId: ${p.productId}, id: ${p.id}, using: ${productGid}`);

        // Check if this product has specific variants selected
        // If variants array exists and has items, include them in selectionIds
        if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
          const variantIds = p.variants.map((v: any) => ({ id: v.id }));
          AppLogger.debug(`🔍 [SELECTION_ID] Product ${p.title} has ${p.variants.length} variants:`, variantIds);
          return {
            id: productGid,
            variants: variantIds
          };
        }

        return { id: productGid };
      });

      AppLogger.debug("🔍 [PRODUCT_SELECTION] Total items in StepProduct:", currentProducts.length);
      AppLogger.debug("🔍 [PRODUCT_SELECTION] Selection IDs being sent to picker:", selectionIds.length);
      AppLogger.debug("🔍 [PRODUCT_SELECTION] StepProduct data structure:", {}, currentProducts.length > 0 ? Object.keys(currentProducts[0]) : 'empty');
      AppLogger.debug("🔍 [PRODUCT_SELECTION] StepProduct sample:", {}, JSON.stringify(currentProducts.slice(0, 2), null, 2));
      AppLogger.debug("🔍 [PRODUCT_SELECTION] Selection IDs being sent to resource picker:", {}, JSON.stringify(selectionIds, null, 2));

      AppLogger.debug("🚀 [RESOURCE_PICKER] Opening resource picker with config:", {
        type: "product",
        multiple: true,
        selectionIds: selectionIds
      });

      const products = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: selectionIds,
      });

      AppLogger.debug("✅ [RESOURCE_PICKER] Resource picker closed. Received selection:", {}, products ? "YES" : "NO");

      if (products && products.selection) {
        AppLogger.debug("🔍 [PRODUCT_SELECTION] Previous products count:", {}, currentProducts.length);
        AppLogger.debug("🔍 [PRODUCT_SELECTION] New products count:", {}, products.selection.length);
        AppLogger.debug("🔍 [PRODUCT_SELECTION] Full response from picker:", {}, JSON.stringify(products, null, 2));
        AppLogger.debug("🔍 [PRODUCT_SELECTION] Raw products from resource picker:", {}, JSON.stringify(products.selection.slice(0, 2), null, 2));

        // Transform products to include imageUrl from images array
        const transformedProducts = products.selection.map((product: any) => {
          const imageUrl = product.images?.[0]?.originalSrc || product.images?.[0]?.url || product.image?.url || null;
          AppLogger.debug(`📸 [PRODUCT_SELECTION] Transforming ${product.title}: images array =`, {}, `${JSON.stringify(product.images)} → imageUrl = ${imageUrl}`);
          return {
            ...product,
            imageUrl: imageUrl
          };
        });

        AppLogger.debug("🔍 [PRODUCT_SELECTION] Transformed products with imageUrl:", {}, JSON.stringify(transformedProducts.slice(0, 2), null, 2));

        // Update the step with selected products (this replaces the entire selection)
        // Deselected products will not be in the selection array, so they're automatically removed
        setSteps(steps.map(step =>
          step.id === stepId
            ? { ...step, StepProduct: transformedProducts }
            : step
        ) as any);

        // Trigger save bar for product selection changes
        triggerSaveBar();

        const addedCount = transformedProducts.length - currentProducts.length;
        const message = addedCount > 0
          ? `Added ${addedCount} product${addedCount !== 1 ? 's' : ''}!`
          : addedCount < 0
            ? `Removed ${Math.abs(addedCount)} product${Math.abs(addedCount) !== 1 ? 's' : ''}!`
            : transformedProducts.length === 0
              ? "All products removed"
              : "Products updated successfully!";

        shopify.toast.show(message);
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      AppLogger.debug("Product selection cancelled or failed:", {}, error as any);
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error :
        (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : '';

      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
        errorMessage?.toLowerCase().includes('abort') ||
        errorMessage?.toLowerCase().includes('dismiss') ||
        errorMessage?.toLowerCase().includes('close') ||
        error === null || error === undefined;

      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show("Failed to select products", { isError: true });
      }
    }
  }, [steps, shopify, triggerSaveBar]);

  const handleSyncProduct = useCallback(() => {
    try {

      // Show loading toast
      shopify.toast.show("Syncing bundle product with Shopify...", { isError: false });

      // Prepare form data for sync operation
      const formData = new FormData();
      formData.append("intent", "syncProduct");

      // Submit to server action using fetcher
      fetcher.submit(formData, { method: "post" });

      // Response will be handled by the existing useEffect
    } catch (error) {
      AppLogger.error("Product sync failed:", {}, error as any);
      shopify.toast.show((error as Error).message || "Failed to sync product", { isError: true });
    }
  }, [fetcher, shopify]);

  const handleBundleProductSelect = useCallback(async () => {
    try {
      const products = await shopify.resourcePicker({
        type: "product",
        multiple: false,
      });

      if (products && products.length > 0) {
        const selectedProduct = products[0];
        setBundleProduct(selectedProduct);

        // Trigger save bar immediately after bundle product selection
        triggerSaveBar();

        shopify.toast.show("Bundle product updated successfully", { isError: false });
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      AppLogger.debug("Bundle product selection cancelled or failed:", {}, error as any);
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error :
        (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : '';

      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
        errorMessage?.toLowerCase().includes('abort') ||
        errorMessage?.toLowerCase().includes('dismiss') ||
        errorMessage?.toLowerCase().includes('close') ||
        error === null || error === undefined;

      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show("Failed to select bundle product", { isError: true });
      }
    }
  }, [shopify]);


  // Step management handlers
  const cloneStep = useCallback((stepId: string) => {
    const stepToClone = steps.find(step => step.id === stepId);
    if (stepToClone) {
      const newStep = {
        ...stepToClone,
        id: `step-${Date.now()}`,
        name: `${stepToClone.name} (Copy)`,
        StepProduct: stepToClone.StepProduct || []
      };
      setSteps(prev => {
        const stepIndex = prev.findIndex(step => step.id === stepId);
        const newSteps = [...prev];
        newSteps.splice(stepIndex + 1, 0, newStep);

        // Update the hidden form input immediately to trigger save bar
        setTimeout(() => {
          const stepsInput = document.querySelector('input[name="stepsData"]') as HTMLInputElement;
          if (stepsInput) {
            stepsInput.value = JSON.stringify(newSteps);
            // Trigger an input event to notify App Bridge of the change
            const event = new Event('input', { bubbles: true });
            stepsInput.dispatchEvent(event);
          }
        }, 0);

        return newSteps;
      });
      shopify.toast.show("Step cloned successfully", { isError: false });
    }
  }, [steps, shopify]);

  const deleteStep = useCallback((stepId: string) => {
    if (steps.length <= 1) {
      shopify.toast.show("Cannot delete the last step", { isError: true });
      return;
    }
    setSteps(prev => {
      const newSteps = prev.filter(step => step.id !== stepId);

      // Update the hidden form input immediately to trigger save bar
      setTimeout(() => {
        const stepsInput = document.querySelector('input[name="stepsData"]') as HTMLInputElement;
        if (stepsInput) {
          stepsInput.value = JSON.stringify(newSteps);
          // Trigger an input event to notify App Bridge of the change
          const event = new Event('input', { bubbles: true });
          stepsInput.dispatchEvent(event);
        }
      }, 0);

      return newSteps;
    });
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(stepId);
      return newSet;
    });
    shopify.toast.show("Step deleted successfully", { isError: false });
  }, [steps, shopify]);

  // Drag and drop state
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, stepId: string, _index: number) => {
    setDraggedStep(stepId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", stepId);

    // Add visual feedback by setting drag image
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "0.5";
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedStep(null);
    setDragOverIndex(null);

    // Reset visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "1";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedStep) return;

    const dragIndex = steps.findIndex(step => step.id === draggedStep);

    if (dragIndex !== -1 && dragIndex !== dropIndex) {
      setSteps(prev => {
        const newSteps = [...prev];
        const draggedStepData = newSteps[dragIndex];
        newSteps.splice(dragIndex, 1);
        newSteps.splice(dropIndex, 0, draggedStepData);

        // Update the hidden form input immediately to trigger save bar
        setTimeout(() => {
          const stepsInput = document.querySelector('input[name="stepsData"]') as HTMLInputElement;
          if (stepsInput) {
            stepsInput.value = JSON.stringify(newSteps);
            // Trigger an input event to notify App Bridge of the change
            const event = new Event('input', { bubbles: true });
            stepsInput.dispatchEvent(event);
          }
        }, 0);

        return newSteps;
      });

      shopify.toast.show("Step reordered successfully", { isError: false });
    }

    setDraggedStep(null);
    setDragOverIndex(null);
  }, [draggedStep, steps, shopify]);

  const addStep = useCallback(() => {
    const newStep = {
      id: `step-${Date.now()}`,
      name: `Step ${steps.length + 1}`,
      pageTitle: '',
      collections: [],
      products: [],
      StepProduct: [],
      displayVariantsAsIndividual: false
    };
    setSteps(prev => {
      const newSteps = [...prev, newStep as any];
      // Trigger save bar for adding step
      triggerSaveBar();
      return newSteps;
    });
    setExpandedSteps(prev => new Set([...prev, newStep.id]));
    shopify.toast.show("Step added successfully", { isError: false });
  }, [steps, shopify]);

  // Collection management handlers
  const handleCollectionSelection = useCallback(async (stepId: string) => {
    try {
      const currentCollections = selectedCollections[stepId] || [];

      const collections = await shopify.resourcePicker({
        type: "collection",
        multiple: true,
        selectionIds: currentCollections.map((c: any) => ({ id: c.id })),
      });

      if (collections && collections.length > 0) {
        AppLogger.debug("🔍 [COLLECTION_SELECTION] Previous collections count:", {}, currentCollections.length);
        AppLogger.debug("🔍 [COLLECTION_SELECTION] New collections count:", {}, collections.length);

        setSelectedCollections(prev => ({
          ...prev,
          [stepId]: collections as any
        }));

        // Trigger save bar for collection selection changes
        triggerSaveBar();

        const addedCount = collections.length - currentCollections.length;
        const message = addedCount > 0
          ? `Added ${addedCount} collection${addedCount !== 1 ? 's' : ''}!`
          : addedCount < 0
            ? `Removed ${Math.abs(addedCount)} collection${Math.abs(addedCount) !== 1 ? 's' : ''}!`
            : "Collections updated successfully!";

        shopify.toast.show(message, { isError: false });
      } else if (collections && collections.length === 0) {
        // User deselected all collections
        setSelectedCollections(prev => ({
          ...prev,
          [stepId]: []
        }));
        triggerSaveBar();
        shopify.toast.show("All collections removed", { isError: false });
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      AppLogger.debug("Collection selection cancelled or failed:", {}, error as any);
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error :
        (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : '';

      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
        errorMessage?.toLowerCase().includes('abort') ||
        errorMessage?.toLowerCase().includes('dismiss') ||
        errorMessage?.toLowerCase().includes('close') ||
        error === null || error === undefined;

      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show("Failed to select collections", { isError: true });
      }
    }
  }, [shopify, triggerSaveBar]);

  // Discount rule management - using new standardized structure
  const addDiscountRule = useCallback(() => {
    const newRule = createNewPricingRule(discountType);
    setDiscountRules([...discountRules, newRule]);

    // Initialize messaging for new rule
    setRuleMessages(prev => ({
      ...prev,
      [newRule.id]: {
        discountText: 'Add {{conditionText}} to get {{discountText}}',
        successMessage: 'Congratulations! You got {{discountText}} on {{bundleName}}! 🎉'
      }
    }));

    // Trigger save bar for adding discount rule
    triggerSaveBar();
  }, [discountRules, discountType, triggerSaveBar]);

  const removeDiscountRule = useCallback((ruleId: string) => {
    setDiscountRules(discountRules.filter(rule => rule.id !== ruleId));
    // Remove messaging for deleted rule
    setRuleMessages(prev => {
      const updated = { ...prev };
      delete updated[ruleId];
      return updated;
    });

    // Trigger save bar for removing discount rule
    triggerSaveBar();
  }, [discountRules, triggerSaveBar]);

  const updateDiscountRule = useCallback((ruleId: string, path: string, value: any) => {
    setDiscountRules(discountRules.map(rule => {
      if (rule.id !== ruleId) return rule;

      // Handle nested updates for condition and discount objects
      if (path.startsWith('condition.')) {
        const field = path.split('.')[1] as keyof PricingRule['condition'];
        return {
          ...rule,
          condition: {
            ...rule.condition,
            [field]: field === 'value' ? Math.max(0, Number(value) || 0) : value
          }
        };
      }

      if (path.startsWith('discount.')) {
        const field = path.split('.')[1] as keyof PricingRule['discount'];
        return {
          ...rule,
          discount: {
            ...rule.discount,
            [field]: field === 'value' ? Math.max(0, Number(value) || 0) : value
          }
        };
      }

      return rule;
    }));

    // Trigger save bar for updating discount rule
    triggerSaveBar();
  }, [discountRules, triggerSaveBar]);

  // Rule message management
  const updateRuleMessage = useCallback((ruleId: string, field: 'discountText' | 'successMessage', value: string) => {
    setRuleMessages(prev => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [field]: value
      }
    }));

    // Trigger save bar for rule message changes
    triggerSaveBar();
  }, [triggerSaveBar]);

  // Function to load available theme templates
  const loadAvailablePages = useCallback(() => {
    setIsLoadingPages(true);
    try {
      const formData = new FormData();
      formData.append("intent", "getThemeTemplates");

      fetcher.submit(formData, { method: "post" });
      // Response will be handled by the existing useEffect
    } catch (error) {
      AppLogger.error("Failed to load theme templates:", {}, error as any);
      shopify.toast.show("Failed to load theme templates", { isError: true });
      setIsLoadingPages(false);
    }
  }, [fetcher, shopify]);

  // Place widget handlers with page selection modal
  const handlePlaceWidget = useCallback(() => {
    try {
      setIsPageSelectionModalOpen(true);
      loadAvailablePages();
    } catch (error) {
      AppLogger.error('Error opening page selection:', {}, error as any);
      shopify.toast.show("Failed to open page selection", { isError: true });
    }
  }, [loadAvailablePages, shopify]);

  const handlePageSelection = useCallback(async (template: any) => {
    try {
      if (!template || !template.handle) {
        AppLogger.error('🚨 [THEME_EDITOR] Invalid template object:', {}, template);
        shopify.toast.show("Template data is invalid", { isError: true });
        return;
      }

      const shopDomain = shop.includes('.myshopify.com')
        ? shop.replace('.myshopify.com', '')
        : shop;

      shopify.toast.show(`Preparing theme editor for "${template.title}"...`, { isError: false, duration: 3000 });
      AppLogger.debug(`🎯 [THEME_EDITOR] Starting widget placement for template: ${template.handle}`);

      // Create a theme template service instance
      // Note: We'll need to refactor this to get admin from a fetcher since this is client-side
      // For now, we'll use the existing approach but add template creation via API call

      // Check if this is a bundle-specific template that needs to be created
      if (template.isBundleContainer && template.bundleProduct) {
        AppLogger.debug(`🏗️ [THEME_EDITOR] Ensuring template exists for bundle product: ${template.bundleProduct.handle}`);

        // Make API call to create template if needed
        const createTemplateResponse = await fetch(`/api/ensure-product-template`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productHandle: template.bundleProduct.handle,
            bundleId: bundle.id
          })
        });

        if (!createTemplateResponse.ok) {
          AppLogger.error('🚨 [THEME_EDITOR] Failed to ensure template exists', {});
          shopify.toast.show("Failed to prepare product template", { isError: true });
          return;
        }

        const templateResult = await createTemplateResponse.json();
        AppLogger.debug(`✅ [THEME_EDITOR] Template preparation result:`, templateResult);

        if (templateResult.created) {
          shopify.toast.show(`Created new template for ${template.bundleProduct.handle}`, { isError: false, duration: 4000 });
        }
      }

      // Use correct extension UUID - this should match your shopify.extension.toml
      const extensionUuid = 'b8292d0c-3be5-4416-8a0d-4f6490e5e271'; // From SHOPIFY_BUNDLE_BUILDER_ID
      const blockHandle = 'bundle';
      const appBlockId = `${extensionUuid}/${blockHandle}`;

      AppLogger.debug(`🔧 [THEME_EDITOR] Using app block ID: ${appBlockId}`);

      // Generate optimized theme editor deep link
      const previewPath = template.bundleProduct ? `/products/${template.bundleProduct.handle}` : '';
      const themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=${template.handle}&addAppBlockId=${appBlockId}&target=newAppsSection&bundleId=${bundle.id}${previewPath ? `&previewPath=${encodeURIComponent(previewPath)}` : ''}`;

      AppLogger.debug(`🔗 [THEME_EDITOR] Generated deep link:`, {}, themeEditorUrl);

      setSelectedPage(template);
      setIsPageSelectionModalOpen(false);

      // Open theme editor in new tab with enhanced debugging
      const editorWindow = window.open(themeEditorUrl, '_blank', 'noopener,noreferrer');

      if (editorWindow) {
        shopify.toast.show(`Theme editor opened for "${template.title}". Widget will be automatically placed with Bundle ID ${bundle.id}.`, { isError: false, duration: 8000 });
        AppLogger.debug(`✅ [THEME_EDITOR] Successfully opened theme editor window`);
      } else {
        shopify.toast.show("Theme editor popup was blocked. Please allow popups and try again.", { isError: true });
        AppLogger.error('🚨 [THEME_EDITOR] Popup was blocked', {});
      }

    } catch (error) {
      AppLogger.error('🚨 [THEME_EDITOR] Error in handlePageSelection:', {}, error as any);
      shopify.toast.show("Failed to open theme editor", { isError: true });
    }
  }, [shop, shopify, bundle.id]);

  // Bundle setup navigation items
  const bundleSetupItems = [
    { id: "step_setup", label: "Step Setup", icon: ListNumberedIcon },
    { id: "discount_pricing", label: "Discount & Pricing", icon: DiscountIcon },
    // Bundle Upsell and Bundle Settings disabled for later release
    // { id: "bundle_upsell", label: "Bundle Upsell", icon: SettingsIcon },
    // { id: "bundle_settings", label: "Bundle Settings", icon: SettingsIcon },
  ];

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Draft", value: "draft" },
    { label: "Archived", value: "archived" },
  ];


  return (
    <Page
      title={`Configure: ${bundleName}`}
      subtitle="Set up your cart transform bundle configuration"
      backAction={{
        content: "Cart Transform Bundles",
        onAction: handleBackClick,
      }}
      primaryAction={{
        content: "Preview Bundle",
        onAction: handlePreviewBundle,
        icon: ViewIcon,
        disabled: !bundleProduct || steps.length === 0,
      }}
    >
      {/* Modern App Bridge contextual save bar using form with data-save-bar */}
      <form
        data-save-bar
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        onReset={(e) => {
          e.preventDefault();
          handleDiscard();
        }}
      >
        {/* Hidden inputs for form submission - values will be updated by React state changes */}
        <input type="hidden" name="bundleName" value={bundleName} />
        <input type="hidden" name="bundleDescription" value={bundleDescription} />
        <input type="hidden" name="templateName" value={templateName} />
        <input type="hidden" name="bundleStatus" value={bundleStatus} />
        <input type="hidden" name="bundleProduct" value={JSON.stringify(bundleProduct)} />
        <input type="hidden" name="stepsData" value={JSON.stringify(steps)} />
        <input type="hidden" name="discountData" value={JSON.stringify({ discountEnabled, discountType, discountRules, showFooter, showProgressBar, discountMessagingEnabled, ruleMessages })} />
        <input type="hidden" name="stepConditions" value={JSON.stringify(stepConditions)} />

        {/* Invisible trigger input for App Bridge save bar - required for proper change detection */}
        <input
          type="text"
          name="changeDetector"
          value={hasUnsavedChanges ? "changed" : "unchanged"}
          style={{
            position: 'absolute',
            left: '-9999px',
            opacity: 0,
            width: '1px',
            height: '1px',
            pointerEvents: 'none'
          }}
          tabIndex={-1}
          readOnly
        />

        <Layout>
          {/* Left Sidebar */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              {/* Bundle Setup Navigation Card */}
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingSm" as="h3">
                    Bundle Setup
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Set-up your bundle builder
                  </Text>

                  <BlockStack gap="100">
                    {bundleSetupItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={activeSection === item.id ? "primary" : "tertiary"}
                        fullWidth
                        textAlign="start"
                        icon={item.icon}
                        disabled={false}
                        onClick={() => handleSectionChange(item.id)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Bundle Product Card */}
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingSm" as="h3">
                      Bundle Product
                    </Text>
                    <Button
                      variant="plain"
                      tone="critical"
                      onClick={handleSyncProduct}
                    >
                      Sync Product
                    </Button>
                  </InlineStack>

                  {bundleProduct ? (
                    <InlineStack gap="300" blockAlign="center">
                      <Thumbnail
                        source={bundleProduct.featuredImage?.url || bundleProduct.images?.[0]?.originalSrc || "/bundle.png"}
                        alt={bundleProduct.title || "Bundle Product"}
                        size="small"
                      />
                      <InlineStack gap="200" blockAlign="center">
                        <Button
                          variant="plain"
                          url={`https://admin.shopify.com/store/${shop?.replace('.myshopify.com', '')}/products/${bundleProduct.legacyResourceId || bundleProduct.id?.split('/').pop()}`}
                          external
                          icon={ExternalIcon}
                        >
                          {bundleProduct.title || "Untitled Product"}
                        </Button>
                        <Button
                          variant="tertiary"
                          size="micro"
                          icon={RefreshIcon}
                          onClick={handleBundleProductSelect}
                          accessibilityLabel="Change bundle product"
                        />
                      </InlineStack>
                    </InlineStack>
                  ) : (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '80px',
                      border: '1px dashed #ccc',
                      borderRadius: '8px'
                    }}>
                      <BlockStack gap="100" inlineAlign="center">
                        <Icon source={ProductIcon} />
                        <Button
                          variant="plain"
                          onClick={handleBundleProductSelect}
                        >
                          Select Bundle Product
                        </Button>
                      </BlockStack>
                    </div>
                  )}

                  {/* Bundle Status Dropdown */}
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Bundle Status
                    </Text>
                    <Select
                      label="Bundle Status"
                      options={statusOptions}
                      value={bundleStatus}
                      onChange={(selected: string) => setBundleStatus(selected as 'active' | 'draft' | 'archived')}
                      labelHidden
                    />
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Take your bundle live Card */}
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingSm" as="h3">
                    Take your bundle live
                  </Text>

                  {/* Green recommendation banner for manual template creation */}
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#e8f5e8',
                    border: '1px solid #4caf50',
                    borderRadius: '8px'
                  }}>
                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={RefreshIcon} tone="success" />
                        <Text as="span" variant="bodyMd" fontWeight="medium" tone="success">
                          💡 Pro Tip: Manual Template Creation
                        </Text>
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued">
                        For optimal bundle widget placement, manually create a product template named "cart-transform"
                        in your theme's templates folder. This allows precise control over bundle widget positioning
                        and ensures consistent styling across your store.
                      </Text>
                      <Text as="p" variant="bodyXs" tone="subdued">
                        <strong>Video Tutorial:</strong> See our detailed video guide for step-by-step template creation instructions.
                      </Text>
                    </BlockStack>
                  </div>

                  {/* Template Selection */}
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Bundle Container Template
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Select which product template will display this bundle widget
                    </Text>
                    <TextField
                      label="Template Name"
                      value={templateName}
                      onChange={setTemplateName}
                      placeholder="e.g., cart-transform, product, bundle-special"
                      helpText="Enter the template name for bundle container products. Leave empty to use the default product template."
                      labelHidden
                      autoComplete="off"
                    />
                  </BlockStack>

                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodyMd" as="p">
                      Place on theme
                    </Text>
                    <Button
                      icon={SettingsIcon}
                      onClick={handlePlaceWidget}
                    >
                      Place Widget
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          {/* Main Content Area */}
          <Layout.Section>
            {activeSection === "step_setup" && (
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Bundle Steps
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Create steps for your multi-step bundle here. Select product options for each step below
                    </Text>
                  </BlockStack>

                  {/* Steps List */}
                  <BlockStack gap="300">
                    {steps.map((step, index) => (
                      <Card
                        key={step.id}
                        background="bg-surface-secondary"
                      >
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, step.id, index)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          style={{
                            cursor: draggedStep === step.id ? 'grabbing' : 'grab',
                            transition: 'all 0.2s ease',
                            transform: dragOverIndex === index && draggedStep !== step.id ? 'translateY(-4px)' : 'translateY(0)',
                            boxShadow: dragOverIndex === index && draggedStep !== step.id
                              ? '0 8px 16px rgba(0,0,0,0.15), 0 0 0 2px rgba(33, 150, 243, 0.3)'
                              : draggedStep === step.id
                                ? '0 4px 12px rgba(0,0,0,0.2)'
                                : 'none',
                            opacity: draggedStep === step.id ? 0.6 : 1,
                            border: dragOverIndex === index && draggedStep !== step.id
                              ? '2px dashed rgba(33, 150, 243, 0.5)'
                              : '2px solid transparent',
                            borderRadius: '8px',
                            position: 'relative' as const,
                            zIndex: draggedStep === step.id ? 1000 : 1,
                            background: dragOverIndex === index && draggedStep !== step.id
                              ? 'rgba(33, 150, 243, 0.05)'
                              : undefined
                          }}
                        >
                          <BlockStack gap="300">
                            {/* Step Header */}
                            <InlineStack align="space-between" blockAlign="center" gap="300">
                              <InlineStack gap="200" blockAlign="center">
                                <Icon source={DragHandleIcon} tone="subdued" />
                                <Text variant="bodyMd" fontWeight="medium" as="p">
                                  Step {index + 1}
                                </Text>
                              </InlineStack>

                              <InlineStack gap="100">
                                <Button
                                  variant="tertiary"
                                  size="micro"
                                  icon={DuplicateIcon}
                                  onClick={() => cloneStep(step.id)}
                                  accessibilityLabel="Clone step"
                                />
                                <Button
                                  variant="tertiary"
                                  size="micro"
                                  tone="critical"
                                  icon={DeleteIcon}
                                  onClick={() => deleteStep(step.id)}
                                  accessibilityLabel="Delete step"
                                />
                                <Button
                                  variant="tertiary"
                                  size="micro"
                                  icon={expandedSteps.has(step.id) ? ChevronUpIcon : ChevronDownIcon}
                                  onClick={() => toggleStepExpansion(step.id)}
                                  accessibilityLabel={expandedSteps.has(step.id) ? "Collapse step" : "Expand step"}
                                />
                              </InlineStack>
                            </InlineStack>

                            {/* Expanded Step Content */}
                            <Collapsible id={`step-${step.id}`} open={expandedSteps.has(step.id)}>
                              <BlockStack gap="400">
                                {/* Step Name and Page Title */}
                                <FormLayout>
                                  <TextField
                                    label="Step Name"
                                    value={step.name}
                                    onChange={(value) => updateStepField(step.id, 'name', value)}
                                    autoComplete="off"
                                  />
                                  <TextField
                                    label="Step Page Title"
                                    value={step.pageTitle || ''}
                                    onChange={(value) => updateStepField(step.id, 'pageTitle', value)}
                                    autoComplete="off"
                                  />
                                </FormLayout>

                                {/* Products/Collections Tabs */}
                                <BlockStack gap="300">
                                  <Tabs
                                    tabs={[
                                      {
                                        id: 'products',
                                        content: 'Products',
                                        badge: step.StepProduct?.length > 0 ? getUniqueProductCount(step.StepProduct).toString() : undefined,
                                      },
                                      {
                                        id: 'collections',
                                        content: 'Collections',
                                      },
                                    ]}
                                    selected={selectedTab}
                                    onSelect={setSelectedTab}
                                  />

                                  {selectedTab === 0 && (
                                    <BlockStack gap="200">
                                      <Text as="p" variant="bodyMd" tone="subdued">
                                        Products selected here will be displayed on this step
                                      </Text>
                                      <InlineStack gap="200" align="start">
                                        <Button
                                          variant="primary"
                                          size="medium"
                                          onClick={() => handleProductSelection(step.id)}
                                        >
                                          Add Products
                                        </Button>
                                        {step.StepProduct?.length > 0 && (
                                          <Badge tone="info">
                                            {`${getUniqueProductCount(step.StepProduct)} Selected`}
                                          </Badge>
                                        )}
                                      </InlineStack>
                                      <Checkbox
                                        label="Display variants as individual products"
                                        checked={step.displayVariantsAsIndividual || false}
                                        onChange={(checked) => updateStepField(step.id, 'displayVariantsAsIndividual', checked)}
                                      />
                                    </BlockStack>
                                  )}

                                  {selectedTab === 1 && (
                                    <BlockStack gap="200">
                                      <Text as="p" variant="bodyMd" tone="subdued">
                                        Collections selected here will be displayed on this step
                                      </Text>
                                      <InlineStack gap="200" align="start">
                                        <Button
                                          variant="primary"
                                          size="medium"
                                          icon={CollectionIcon}
                                          onClick={() => handleCollectionSelection(step.id)}
                                        >
                                          Add Collections
                                        </Button>
                                        {selectedCollections[step.id]?.length > 0 && (
                                          <Badge tone="info">
                                            {`${selectedCollections[step.id].length} Selected`}
                                          </Badge>
                                        )}
                                      </InlineStack>

                                      {/* Display selected collections */}
                                      {selectedCollections[step.id]?.length > 0 && (
                                        <BlockStack gap="100">
                                          <Text as="h5" variant="bodyMd" fontWeight="medium">
                                            Selected Collections:
                                          </Text>
                                          <BlockStack gap="100">
                                            {selectedCollections[step.id].map((collection: any) => (
                                              <InlineStack key={collection.id} gap="200" blockAlign="center">
                                                <Thumbnail
                                                  source={collection.image?.url || "/bundle.png"}
                                                  alt={collection.title}
                                                  size="small"
                                                />
                                                <Text as="span" variant="bodyMd">{collection.title}</Text>
                                                <Button
                                                  variant="plain"
                                                  size="micro"
                                                  tone="critical"
                                                  onClick={() => {
                                                    setSelectedCollections(prev => ({
                                                      ...prev,
                                                      [step.id]: prev[step.id]?.filter(c => c.id !== collection.id) || []
                                                    }));
                                                  }}
                                                >
                                                  Remove
                                                </Button>
                                              </InlineStack>
                                            ))}
                                          </BlockStack>
                                        </BlockStack>
                                      )}
                                    </BlockStack>
                                  )}
                                </BlockStack>

                                {/* Conditions Section */}
                                <BlockStack gap="300">
                                  <BlockStack gap="100">
                                    <Text variant="headingSm" as="h4">
                                      Conditions
                                    </Text>
                                    <Text as="p" variant="bodyMd" tone="subdued">
                                      Create Conditions based on amount or quantity of products added on this step.
                                    </Text>
                                    <Text as="p" variant="bodySm" tone="subdued">
                                      Note: Conditions are only valid on this step
                                    </Text>
                                  </BlockStack>

                                  {/* Existing Condition Rules */}
                                  {(stepConditions[step.id] || []).map((rule, ruleIndex) => (
                                    <Card key={rule.id} background="bg-surface-secondary">
                                      <BlockStack gap="200">
                                        <InlineStack align="space-between" blockAlign="center">
                                          <Text as="h5" variant="bodyMd" fontWeight="medium">
                                            Condition #{ruleIndex + 1}
                                          </Text>
                                          <Button
                                            variant="plain"
                                            tone="critical"
                                            onClick={() => removeConditionRule(step.id, rule.id)}
                                          >
                                            Remove
                                          </Button>
                                        </InlineStack>

                                        <InlineStack gap="200" align="start">
                                          <Select
                                            label="Condition Type"
                                            options={[
                                              { label: 'Quantity', value: 'quantity' },
                                              { label: 'Amount', value: 'amount' },
                                            ]}
                                            value={rule.type}
                                            onChange={(value) => updateConditionRule(step.id, rule.id, 'type', value)}
                                          />
                                          <Select
                                            label="Operator"
                                            options={[
                                              { label: 'is equal to', value: 'equal_to' },
                                              { label: 'is greater than', value: 'greater_than' },
                                              { label: 'is less than', value: 'less_than' },
                                              { label: 'is greater than or equal to', value: 'greater_than_or_equal_to' },
                                              { label: 'is less than or equal to', value: 'less_than_or_equal_to' },
                                            ]}
                                            value={rule.operator}
                                            onChange={(value) => updateConditionRule(step.id, rule.id, 'operator', value)}
                                          />
                                          <TextField
                                            label="Value"
                                            value={rule.value}
                                            onChange={(value) => updateConditionRule(step.id, rule.id, 'value', value)}
                                            autoComplete="off"
                                            type="number"
                                            min="0"
                                          />
                                        </InlineStack>
                                      </BlockStack>
                                    </Card>
                                  ))}

                                  <Button
                                    variant="tertiary"
                                    fullWidth
                                    icon={PlusIcon}
                                    onClick={() => addConditionRule(step.id)}
                                  >
                                    Add Rule
                                  </Button>
                                </BlockStack>
                              </BlockStack>
                            </Collapsible>
                          </BlockStack>
                        </div>
                      </Card>
                    ))}

                    {/* Add Step Button */}
                    <Button
                      variant="plain"
                      fullWidth
                      icon={PlusIcon}
                      onClick={addStep}
                    >
                      Add Step
                    </Button>
                  </BlockStack>
                </BlockStack>
              </Card>
            )}

            {activeSection === "discount_pricing" && (
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Discount & Pricing
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Set up to 4 discount rules, applied from lowest to highest.
                    </Text>
                  </BlockStack>

                  {/* Discount Enable Toggle */}
                  <FormLayout>
                    <Checkbox
                      label="Discount & Pricing"
                      checked={discountEnabled}
                      onChange={setDiscountEnabled}
                    />
                  </FormLayout>

                  {discountEnabled && (
                    <BlockStack gap="400">
                      {/* Discount Type */}
                      <Select
                        label="Discount Type"
                        options={[
                          { label: 'Percentage Off', value: DiscountMethod.PERCENTAGE_OFF },
                          { label: 'Fixed Amount Off', value: DiscountMethod.FIXED_AMOUNT_OFF },
                          { label: 'Fixed Bundle Price', value: DiscountMethod.FIXED_BUNDLE_PRICE },
                        ]}
                        value={discountType}
                        onChange={(value) => {
                          setDiscountType(value as DiscountMethod);
                          // Clear existing rules when discount type changes
                          setDiscountRules([]);
                          // Clear rule messages when discount type changes
                          setRuleMessages({});
                        }}
                      />

                      {/* Discount Rules - New Standardized Structure */}
                      <BlockStack gap="300">
                        {discountRules.map((rule, index) => (
                          <Card key={rule.id} background="bg-surface-secondary">
                            <BlockStack gap="300">
                              <InlineStack align="space-between" blockAlign="center">
                                <Text as="h4" variant="bodyMd" fontWeight="medium">
                                  Rule #{index + 1}
                                </Text>
                                <Button
                                  variant="plain"
                                  tone="critical"
                                  onClick={() => removeDiscountRule(rule.id)}
                                >
                                  Remove
                                </Button>
                              </InlineStack>

                              {/* Condition Section */}
                              <BlockStack gap="200">
                                <Text as="p" variant="bodyMd" fontWeight="semibold">When:</Text>
                                <InlineStack gap="200" align="start">
                                  <Select
                                    label="Type"
                                    options={[
                                      { label: 'Quantity', value: ConditionType.QUANTITY },
                                      { label: 'Amount', value: ConditionType.AMOUNT },
                                    ]}
                                    value={rule.condition.type}
                                    onChange={(value) => updateDiscountRule(rule.id, 'condition.type', value)}
                                  />
                                  <Select
                                    label="Operator"
                                    options={[
                                      { label: 'Greater than or equal (≥)', value: ConditionOperator.GTE },
                                      { label: 'Greater than (>)', value: ConditionOperator.GT },
                                      { label: 'Less than or equal (≤)', value: ConditionOperator.LTE },
                                      { label: 'Less than (<)', value: ConditionOperator.LT },
                                      { label: 'Equal to (=)', value: ConditionOperator.EQ },
                                    ]}
                                    value={rule.condition.operator}
                                    onChange={(value) => updateDiscountRule(rule.id, 'condition.operator', value)}
                                  />
                                  <TextField
                                    label={rule.condition.type === ConditionType.AMOUNT ? "Amount" : "Quantity"}
                                    value={String(rule.condition.type === ConditionType.AMOUNT ? centsToAmount(rule.condition.value) : rule.condition.value)}
                                    onChange={(value) => {
                                      const numValue = Number(value) || 0;
                                      const finalValue = rule.condition.type === ConditionType.AMOUNT ? amountToCents(numValue) : numValue;
                                      updateDiscountRule(rule.id, 'condition.value', finalValue);
                                    }}
                                    type="number"
                                    min="0"
                                    step={rule.condition.type === ConditionType.AMOUNT ? 0.01 : 1}
                                    helpText={rule.condition.type === ConditionType.AMOUNT ? "Amount in shop's currency" : undefined}
                                    autoComplete="off"
                                  />
                                </InlineStack>
                              </BlockStack>

                              {/* Discount Section */}
                              <BlockStack gap="200">
                                <Text as="p" variant="bodyMd" fontWeight="semibold">Apply:</Text>
                                <TextField
                                  label={
                                    rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? 'Discount Percentage' :
                                    rule.discount.method === DiscountMethod.FIXED_AMOUNT_OFF ? 'Discount Amount' :
                                    'Bundle Price'
                                  }
                                  value={String(
                                    rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? rule.discount.value :
                                    centsToAmount(rule.discount.value)
                                  )}
                                  onChange={(value) => {
                                    const numValue = Number(value) || 0;
                                    const finalValue = rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? numValue : amountToCents(numValue);
                                    updateDiscountRule(rule.id, 'discount.value', finalValue);
                                  }}
                                  type="number"
                                  min="0"
                                  max={rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? "100" : undefined}
                                  step={rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? 1 : 0.01}
                                  suffix={rule.discount.method === DiscountMethod.PERCENTAGE_OFF ? "%" : undefined}
                                  helpText={rule.discount.method !== DiscountMethod.PERCENTAGE_OFF ? "Amount in shop's currency" : undefined}
                                  autoComplete="off"
                                />
                              </BlockStack>

                              {/* Preview */}
                              <Text as="p" variant="bodySm" tone="subdued">
                                Preview: {generateRulePreview(rule)}
                              </Text>
                            </BlockStack>
                          </Card>
                        ))}

                        {discountRules.length < 4 && (
                          <Button
                            variant="tertiary"
                            fullWidth
                            icon={PlusIcon}
                            onClick={addDiscountRule}
                          >
                            Add rule
                          </Button>
                        )}
                      </BlockStack>


                      {/* Discount Messaging */}
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center">
                          <BlockStack gap="100">
                            <Text variant="headingSm" as="h4">
                              Discount Messaging
                            </Text>
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Edit how discount messages appear above the subtotal.
                            </Text>
                          </BlockStack>
                          <Checkbox
                            label="Discount Messaging"
                            checked={discountMessagingEnabled}
                            onChange={setDiscountMessagingEnabled}
                          />
                        </InlineStack>

                        {/* Integrated Variables Helper */}
                        <details>
                          <summary style={{ cursor: 'pointer', color: '#007ace', fontSize: '14px', fontWeight: '500' }}>
                            Show Variables
                          </summary>
                          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '13px' }}>
                            {/* Essential Variables */}
                            <div style={{ marginBottom: '12px' }}>
                              <strong>Essential (Most Used):</strong><br/>
                              <code>{'{{conditionText}}'}</code> - "₹100" or "2 items"<br/>
                              <code>{'{{discountText}}'}</code> - "₹50 off" or "20% off"<br/>
                              <code>{'{{bundleName}}'}</code> - Bundle name
                            </div>
                            
                            {/* Specific Variables */}
                            <div style={{ marginBottom: '12px' }}>
                              <strong>Specific:</strong><br/>
                              <code>{'{{amountNeeded}}'}</code> - Amount needed (for spend-based)<br/>
                              <code>{'{{itemsNeeded}}'}</code> - Items needed (for quantity-based)<br/>
                              <code>{'{{progressPercentage}}'}</code> - Progress % (0-100)
                            </div>
                            
                            {/* Pricing Variables */}
                            <div style={{ marginBottom: '12px' }}>
                              <strong>Pricing:</strong><br/>
                              <code>{'{{currentAmount}}'}</code> - Current total<br/>
                              <code>{'{{finalPrice}}'}</code> - Price after discount<br/>
                              <code>{'{{savingsAmount}}'}</code> - Amount saved
                            </div>
                            
                            {/* Quick Examples */}
                            <div style={{ borderTop: '1px solid #e1e3e5', paddingTop: '8px', fontSize: '12px', color: '#6c757d' }}>
                              <strong>Quick Examples:</strong><br/>
                              💰 <em>"Add {'{{conditionText}}'} to get {'{{discountText}}'}"</em><br/>
                              📊 <em>"{'{{progressPercentage}}'} % complete - {'{{conditionText}}'} more needed"</em><br/>
                              🎉 <em>"You saved {'{{savingsAmount}}'} on {'{{bundleName}}'}"</em>
                            </div>
                          </div>
                        </details>

                        {/* Dynamic rule-based messaging */}
                        {discountMessagingEnabled && (Array.isArray(discountRules) ? discountRules : []).length > 0 && (
                          <BlockStack gap="300">
                            {(Array.isArray(discountRules) ? discountRules : []).map((rule: any, index: number) => (
                              <BlockStack key={rule.id} gap="300">
                                <Card background="bg-surface-secondary">
                                  <BlockStack gap="200">
                                    <Text as="h4" variant="bodyMd" fontWeight="medium">
                                      Rule #{index + 1}
                                    </Text>
                                    <Text as="p" variant="bodySm" tone="subdued">
                                      Discount Text
                                    </Text>
                                    <TextField
                                      label="Discount Text"
                                      value={ruleMessages[rule.id]?.discountText || 'Add {{conditionText}} to get {{discountText}}'}
                                      onChange={(value) => updateRuleMessage(rule.id, 'discountText', value)}
                                      multiline={2}
                                      autoComplete="off"
                                      helpText="This message appears when the customer is close to qualifying for the discount"
                                    />
                                  </BlockStack>
                                </Card>

                                <Card background="bg-surface-secondary">
                                  <BlockStack gap="200">
                                    <Text as="h4" variant="bodyMd" fontWeight="medium">
                                      Success Message
                                    </Text>
                                    <TextField
                                      label="Success Message"
                                      value={ruleMessages[rule.id]?.successMessage || 'Congratulations! You got {{discountText}} on {{bundleName}}! 🎉'}
                                      onChange={(value) => updateRuleMessage(rule.id, 'successMessage', value)}
                                      multiline={2}
                                      autoComplete="off"
                                      helpText="This message appears when the customer qualifies for the discount"
                                    />
                                  </BlockStack>
                                </Card>
                              </BlockStack>
                            ))}
                          </BlockStack>
                        )}

                        {/* Show message when no rules exist */}
                        {discountMessagingEnabled && discountRules.length === 0 && (
                          <Card background="bg-surface-secondary">
                            <BlockStack gap="200" inlineAlign="center">
                              <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                                Add discount rules to configure messaging
                              </Text>
                            </BlockStack>
                          </Card>
                        )}
                      </BlockStack>
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>
            )}
          </Layout.Section>
        </Layout>
      </form>

      {/* Page Selection Modal */}
      <Modal
        open={isPageSelectionModalOpen}
        onClose={() => setIsPageSelectionModalOpen(false)}
        title="Select Template for Widget Placement"
        primaryAction={{
          content: "Cancel",
          onAction: () => setIsPageSelectionModalOpen(false),
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              Choose a page template where you want to place the Bundle Builder widget. The theme editor will open with automatic widget placement and configuration. Bundle container products are highlighted as recommended templates for optimal bundle widget placement.
            </Text>

            {isLoadingPages ? (
              <BlockStack gap="200" inlineAlign="center">
                <Text as="p" variant="bodyMd" tone="subdued">Loading templates...</Text>
              </BlockStack>
            ) : availablePages.length > 0 ? (
              <BlockStack gap="200">
                {availablePages.map((template) => (
                  <Card key={template.id}>
                    <InlineStack wrap={false} gap="300" align="space-between">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="h4" variant="bodyMd" fontWeight="medium">
                            {template.title}
                          </Text>
                          {template.recommended && (
                            <Badge tone="success">Recommended</Badge>
                          )}
                          {template.fileType && (
                            <Badge tone="info">{template.fileType}</Badge>
                          )}
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {template.description}
                        </Text>
                        <Text as="p" variant="bodyXs" tone="subdued">
                          Template: {template.handle}
                        </Text>
                      </BlockStack>
                      <Button
                        onClick={() => handlePageSelection(template)}
                        variant="primary"
                        icon={ExternalIcon}
                      >
                        Select Template
                      </Button>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            ) : (
              <Card>
                <BlockStack gap="200" inlineAlign="center">
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    No pages found in your store. You can create pages in your Shopify admin and return here to place the widget.
                  </Text>
                  <Button
                    url="https://admin.shopify.com/admin/pages"
                    external
                  >
                    Create Page
                  </Button>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Selected Products Modal */}
      <Modal
        open={isProductsModalOpen}
        onClose={handleCloseProductsModal}
        title="Selected Products"
        primaryAction={{
          content: "Close",
          onAction: handleCloseProductsModal,
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {(() => {
              const currentStep = steps.find(step => step.id === currentModalStepId);
              const selectedProducts = currentStep?.StepProduct || [];

              return selectedProducts.length > 0 ? (
                <BlockStack gap="300">
                  <Text as="h4" variant="bodyMd" fontWeight="medium">
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected for this step:
                  </Text>
                  <Card>
                    <List type="bullet">
                      {selectedProducts.map((product: any, index: number) => (
                        <List.Item key={product.id || index}>
                          <InlineStack gap="200" align="space-between" blockAlign="center">
                            <InlineStack gap="300" blockAlign="center">
                              <Thumbnail
                                source={product.imageUrl || product.image?.url || "/bundle.png"}
                                alt={product.title || product.name || 'Product'}
                                size="small"
                              />
                              <BlockStack gap="050">
                                <Text as="h5" variant="bodyMd" fontWeight="medium">
                                  {product.title || product.name || 'Unnamed Product'}
                                </Text>
                                {product.variants && product.variants.length > 0 && (
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''} available
                                  </Text>
                                )}
                              </BlockStack>
                            </InlineStack>
                            <Badge tone="info">Product</Badge>
                          </InlineStack>
                        </List.Item>
                      ))}
                    </List>
                  </Card>
                </BlockStack>
              ) : (
                <BlockStack gap="200" inlineAlign="center">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No products selected for this step yet.
                  </Text>
                </BlockStack>
              );
            })()}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Selected Collections Modal */}
      <Modal
        open={isCollectionsModalOpen}
        onClose={handleCloseCollectionsModal}
        title="Selected Collections"
        primaryAction={{
          content: "Close",
          onAction: handleCloseCollectionsModal,
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {(() => {
              const collections = selectedCollections[currentModalStepId] || [];

              return collections.length > 0 ? (
                <BlockStack gap="300">
                  <Text as="h4" variant="bodyMd" fontWeight="medium">
                    {collections.length} collection{collections.length !== 1 ? 's' : ''} selected for this step:
                  </Text>
                  <Card>
                    <List type="bullet">
                      {collections.map((collection: any, index: number) => (
                        <List.Item key={collection.id || index}>
                          <InlineStack gap="200" align="space-between">
                            <BlockStack gap="050">
                              <Text as="h5" variant="bodyMd" fontWeight="medium">
                                {collection.title || 'Unnamed Collection'}
                              </Text>
                              {collection.handle && (
                                <Text as="p" variant="bodySm" tone="subdued">
                                  Handle: {collection.handle}
                                </Text>
                              )}
                            </BlockStack>
                            <Badge tone="success">Collection</Badge>
                          </InlineStack>
                        </List.Item>
                      ))}
                    </List>
                  </Card>
                </BlockStack>
              ) : (
                <BlockStack gap="200" inlineAlign="center">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No collections selected for this step yet.
                  </Text>
                </BlockStack>
              );
            })()}
          </BlockStack>
        </Modal.Section>
      </Modal>

    </Page>
  );
}