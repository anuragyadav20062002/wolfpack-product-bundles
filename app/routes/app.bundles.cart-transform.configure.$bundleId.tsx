import { useState, useEffect, useCallback } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
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

  // Debug: Log existing step conditions from database
  console.log("[DEBUG] Bundle loaded from DB:", {
    id: bundle.id,
    stepsCount: bundle.steps.length,
    steps: bundle.steps.map(step => ({
      id: step.id,
      name: step.name,
      conditionType: step.conditionType,
      conditionOperator: step.conditionOperator,
      conditionValue: step.conditionValue
    }))
  });

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
      console.warn("Failed to fetch bundle product:", error);
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
      default:
        return json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Action error:", error);
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
      console.error("JSON parse error:", error);
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
      name: "Cart Transform Bundle Config",
      namespace: "bundle_discounts",
      key: "cart_transform_config",
      description: "Cart transform bundle configuration data",
      type: "json",
      ownerType: "PRODUCT"
    },
    {
      name: "Discount Function Bundle Config",
      namespace: "bundle_discounts", 
      key: "discount_function_config",
      description: "Discount function bundle configuration data",
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

// Helper function to update bundle product metafields
async function updateBundleProductMetafields(admin: any, bundleProductId: string, bundleConfiguration: any, bundleType: 'cart_transform' | 'discount_function' = 'cart_transform') {
  console.log("🔧 [METAFIELD] Starting bundle product metafield update");
  console.log("📦 [METAFIELD] Bundle Product ID:", bundleProductId);
  console.log("📋 [METAFIELD] Bundle Type:", bundleType);
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

  const metafieldKey = bundleType === 'cart_transform' ? 'cart_transform_config' : 'discount_function_config';
  
  const response = await admin.graphql(SET_METAFIELDS, {
    variables: {
      metafields: [
        {
          ownerId: bundleProductId,
          namespace: "bundle_discounts",
          key: metafieldKey,
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

// Helper function to update cart transform metafields (Shopify recommended approach)
async function updateCartTransformMetafield(admin: any, shopId: string) {
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
    const optimizedBundleConfigs = allPublishedBundles.map((bundle) => {
      // Extract all product IDs from bundle steps for quick lookup
      const allBundleProductIds = [];
      const stepConfigs = [];

      for (const step of bundle.steps) {
        const stepProductIds = [];
        
        // Add products from step configuration (collections/products JSON)
        const stepProducts = safeJsonParse(step.products, []);
        const stepCollections = safeJsonParse(step.collections, []);
        
        stepProducts.forEach(product => {
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
          collections: stepCollections.map(col => col.id).filter(Boolean),
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
        type: bundle.bundleType,
        allBundleProductIds, // All product IDs for quick bundle detection
        steps: stepConfigs,
        // Essential pricing data only
        pricing: bundle.pricing ? {
          enableDiscount: bundle.pricing.enableDiscount,
          discountMethod: bundle.pricing.discountMethod,
          rules: safeJsonParse(bundle.pricing.rules, []),
          // Include bundle variant IDs if available
          bundleVariantId: bundle.pricing.bundleVariantId,
          fixedPrice: bundle.pricing.fixedPrice
        } : null,
        // Include bundle parent variant if available
        bundleParentVariantId: bundle.shopifyProductId ? 
          `gid://shopify/ProductVariant/${bundle.shopifyProductId}` : null
      };

      return optimizedBundle;
    });

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

// Helper function to update shop-level all_bundles metafield for Liquid extension (legacy)
async function updateShopBundlesMetafield(admin: any, shopId: string) {
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
        StepProduct: step.StepProduct || [],
        // Add condition data if needed
        conditionType: step.conditionType,
        conditionOperator: step.conditionOperator,
        conditionValue: step.conditionValue
      })),
      pricing: bundle.pricing ? {
        enabled: bundle.pricing.enableDiscount,
        method: bundle.pricing.discountMethod,
        rules: bundle.pricing.rules || [],
        showFooter: bundle.pricing.showFooter,
        messages: bundle.pricing.messages || {}
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

// Map frontend discount method values to schema enum values
function mapDiscountMethod(discountType: string): string {
  switch (discountType) {
    case 'fixed_bundle_price':
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

// Handle saving bundle configuration
// Helper function to convert bundle configuration to standard Shopify metafields
function convertBundleToStandardMetafields(bundle: any) {
  const standardMetafields: any = {};
  
  // For bundle products (parent products), create component_reference and component_quantities
  if (bundle.steps && bundle.steps.length > 0) {
    const componentReferences: string[] = [];
    const componentQuantities: number[] = [];
    
    // Extract all products from all steps
    for (const step of bundle.steps) {
      if (step.StepProduct && Array.isArray(step.StepProduct)) {
        for (const stepProduct of step.StepProduct) {
          // Convert product ID to variant ID format if needed
          const variantId = stepProduct.productId.startsWith('gid://') 
            ? stepProduct.productId.replace('/Product/', '/ProductVariant/') + '/' + (stepProduct.variants?.[0]?.id || '1')
            : `gid://shopify/ProductVariant/${stepProduct.productId}`;
          
          componentReferences.push(variantId);
          componentQuantities.push(step.minQuantity || 1);
        }
      }
      
      // Also handle products array if it exists
      if (step.products && Array.isArray(step.products)) {
        for (const product of step.products) {
          const variantId = product.id.startsWith('gid://') 
            ? product.id.replace('/Product/', '/ProductVariant/') + '/' + (product.variants?.[0]?.id || '1')
            : `gid://shopify/ProductVariant/${product.id}`;
          
          componentReferences.push(variantId);
          componentQuantities.push(step.minQuantity || 1);
        }
      }
    }
    
    if (componentReferences.length > 0) {
      standardMetafields.component_reference = JSON.stringify(componentReferences);
      standardMetafields.component_quantities = JSON.stringify(componentQuantities);
    }
  }
  
  // Add price adjustment if pricing is configured
  if (bundle.pricing && bundle.pricing.enabled && bundle.pricing.rules) {
    const rules = Array.isArray(bundle.pricing.rules) ? bundle.pricing.rules : [];
    if (rules.length > 0) {
      const rule = rules[0]; // Use first rule for simplicity
      if (bundle.pricing.method === 'percentage_off' && rule.discountValue) {
        standardMetafields.price_adjustment = JSON.stringify({
          percentageDecrease: parseFloat(rule.discountValue) || 0
        });
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
              parentConfig.price_adjustment = JSON.stringify({
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

// Helper function to update standard Shopify metafields on products
async function updateProductStandardMetafields(admin: any, productId: string, standardMetafields: any) {
  console.log("🔧 [STANDARD_METAFIELD] Setting standard Shopify metafields on product:", productId);
  console.log("📋 [STANDARD_METAFIELD] Metafields:", standardMetafields);

  // Ensure metafield definitions exist for the custom namespace
  await ensureStandardMetafieldDefinitions(admin);
  
  const metafieldsToSet = [];
  
  // Add each standard metafield
  Object.keys(standardMetafields).forEach(key => {
    if (standardMetafields[key]) {
      metafieldsToSet.push({
        ownerId: productId,
        namespace: "custom",
        key: key,
        type: "json",
        value: standardMetafields[key]
      });
    }
  });
  
  if (metafieldsToSet.length === 0) {
    console.log("🔧 [STANDARD_METAFIELD] No standard metafields to set");
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
  console.log("🔧 [STANDARD_METAFIELD] GraphQL response:", JSON.stringify(data, null, 2));

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error("🔧 [STANDARD_METAFIELD] User errors:", data.data.metafieldsSet.userErrors);
    throw new Error(`Failed to set standard metafields: ${data.data.metafieldsSet.userErrors[0].message}`);
  }

  console.log("🔧 [STANDARD_METAFIELD] Standard metafields set successfully");
  return data.data?.metafieldsSet?.metafields;
}

// Helper function to ensure standard metafield definitions exist
async function ensureStandardMetafieldDefinitions(admin: any) {
  const standardDefinitions = [
    {
      namespace: "custom",
      key: "component_reference", 
      name: "Component Reference",
      description: "Bundle component variant IDs",
      type: "json"
    },
    {
      namespace: "custom",
      key: "component_quantities",
      name: "Component Quantities", 
      description: "Bundle component quantities",
      type: "json"
    },
    {
      namespace: "custom",
      key: "component_parents",
      name: "Component Parents",
      description: "Bundle parent configurations",
      type: "json"  
    },
    {
      namespace: "custom",
      key: "price_adjustment",
      name: "Price Adjustment",
      description: "Bundle price adjustment configuration",
      type: "json"
    }
  ];

  const CREATE_DEFINITIONS = `
    mutation CreateMetafieldDefinitions($definitions: [MetafieldDefinitionInput!]!) {
      metafieldDefinitionCreate(definitions: $definitions) {
        createdDefinitions {
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

  try {
    const response = await admin.graphql(CREATE_DEFINITIONS, {
      variables: {
        definitions: standardDefinitions.map(def => ({
          ...def,
          ownerType: "PRODUCT"
        }))
      }
    });

    const data = await response.json();
    if (data.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
      // Ignore "already exists" errors
      const realErrors = data.data.metafieldDefinitionCreate.userErrors.filter(
        (error: any) => !error.message.includes("already been taken")
      );
      if (realErrors.length > 0) {
        console.error("🔧 [STANDARD_METAFIELD] Definition errors:", realErrors);
      }
    }
  } catch (error) {
    console.error("🔧 [STANDARD_METAFIELD] Failed to create definitions:", error);
    // Don't fail the entire process
  }
}

async function handleSaveBundle(admin: any, session: any, bundleId: string, formData: FormData) {
  console.log("🚀 [BUNDLE_CONFIG] Starting bundle save process");
  console.log("🆔 [BUNDLE_CONFIG] Bundle ID:", bundleId);
  console.log("🏪 [BUNDLE_CONFIG] Shop:", session.shop);
  
  // Parse form data
  const bundleName = formData.get("bundleName") as string;
  const bundleDescription = formData.get("bundleDescription") as string;
  const bundleStatus = formData.get("bundleStatus") as string;
  const stepsData = JSON.parse(formData.get("stepsData") as string);
  const discountData = JSON.parse(formData.get("discountData") as string);
  const stepConditionsData = formData.get("stepConditions") ? JSON.parse(formData.get("stepConditions") as string) : {};
  const bundleProductData = formData.get("bundleProduct") ? JSON.parse(formData.get("bundleProduct") as string) : null;
  
  console.log("📝 [BUNDLE_CONFIG] Parsed form data:", {
    bundleName,
    bundleDescription,
    bundleStatus,
    stepsCount: stepsData.length,
    discountEnabled: discountData.discountEnabled,
    discountType: discountData.discountType,
    hasConditions: Object.keys(stepConditionsData).length > 0,
    hasBundleProduct: !!bundleProductData
  });
  
  console.log("[DEBUG] Step Conditions Data from form:", stepConditionsData);
  console.log("[DEBUG] Bundle Product Data from form:", bundleProductData);

  // Automatically set status to 'active' if bundle has configured steps
  let finalStatus = bundleStatus as any;
  if (bundleStatus === 'draft' && stepsData && stepsData.length > 0) {
    const hasConfiguredSteps = stepsData.some((step: any) => 
      (step.StepProduct && step.StepProduct.length > 0) || 
      (step.collections && step.collections.length > 0)
    );
    console.log("📊 [BUNDLE_CONFIG] Status evaluation:", {
      originalStatus: bundleStatus,
      hasConfiguredSteps,
      stepsCount: stepsData.length
    });
    if (hasConfiguredSteps) {
      finalStatus = 'active';
      console.log("🔄 [BUNDLE_CONFIG] Auto-activating bundle with configured steps");
    }
  }

  // Update bundle in database
  console.log("💾 [BUNDLE_CONFIG] Updating bundle in database");
  const updatedBundle = await db.bundle.update({
    where: { 
      id: bundleId, 
      shopId: session.shop 
    },
    data: {
      name: bundleName,
      description: bundleDescription,
      status: finalStatus,
      shopifyProductId: bundleProductData?.id || null,
      // Update steps if provided
      ...(stepsData && {
        steps: {
          deleteMany: {},
          create: stepsData.map((step: any, index: number) => {
            // Get conditions for this step from stepConditionsData
            const stepConditions = stepConditionsData[step.id] || [];
            const firstCondition = stepConditions.length > 0 ? stepConditions[0] : null;
            console.log(`[DEBUG] Step ${step.id} conditions:`, stepConditions);
            console.log(`[DEBUG] Step ${step.id} first condition:`, firstCondition);
            console.log(`[DEBUG] Will save to DB - conditionType: ${firstCondition?.type || null}, conditionOperator: ${firstCondition?.operator || null}, conditionValue: ${firstCondition?.value ? parseInt(firstCondition.value) || null : null}`);
            
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
              create: (step.StepProduct || []).map((product: any, productIndex: number) => ({
                productId: product.id,
                title: product.title || product.name || 'Unnamed Product',
                imageUrl: product.image?.url || product.imageUrl || null,
                variants: product.variants || null,
                minQuantity: parseInt(product.minQuantity) || 1,
                maxQuantity: parseInt(product.maxQuantity) || 10,
                position: productIndex + 1
              }))
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
              enableDiscount: discountData.discountEnabled,
              discountMethod: mapDiscountMethod(discountData.discountType),
              rules: discountData.discountRules || [],
              messages: {
                showDiscountDisplay: discountData.discountDisplayEnabled || false,
                showDiscountMessaging: discountData.discountMessagingEnabled || false,
                ruleMessages: discountData.ruleMessages || {}
              }
            },
            update: {
              enableDiscount: discountData.discountEnabled,
              discountMethod: mapDiscountMethod(discountData.discountType),
              rules: discountData.discountRules || [],
              messages: {
                showDiscountDisplay: discountData.discountDisplayEnabled || false,
                showDiscountMessaging: discountData.discountMessagingEnabled || false,
                ruleMessages: discountData.ruleMessages || {}
              }
            }
          }
        }
      })
    },
    include: {
      steps: true,
      pricing: true
    }
  });

  // If bundle has a Shopify product and discount is enabled, update its metafields
  if (updatedBundle.shopifyProductId && discountData?.discountEnabled) {
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
      // Only store essential product data (IDs and titles, no descriptions/images)
      products: (step.StepProduct || []).map((product: any) => ({
        id: product.id,
        title: product.title || product.name || 'Product'
      })),
      // Only store essential collection data
      collections: (step.collections || []).map((collection: any) => ({
        id: collection.id,
        title: collection.title || 'Collection'
      }))
    }));

    const baseConfiguration = {
      bundleId: updatedBundle.id,
      name: updatedBundle.name,
      steps: optimizedSteps,
      pricing: {
        enabled: discountData.discountEnabled,
        method: discountData.discountType,
        rules: discountData.discountRules || []
      },
      updatedAt: new Date().toISOString()
    };

    const configSize = JSON.stringify(baseConfiguration).length;
    console.log("📏 [METAFIELD] Optimized configuration size:", configSize, "chars (vs 12KB+ before)");

    try {
      // Save cart transform configuration
      const cartTransformConfig = {
        ...baseConfiguration,
        type: "cart_transform"
      };
      await updateBundleProductMetafields(admin, updatedBundle.shopifyProductId, cartTransformConfig, 'cart_transform');

      // Save discount function configuration
      const discountFunctionConfig = {
        ...baseConfiguration,
        type: "discount_function"
      };
      await updateBundleProductMetafields(admin, updatedBundle.shopifyProductId, discountFunctionConfig, 'discount_function');

      // ALSO update standard Shopify metafields for cart transform compatibility
      console.log("🔧 [STANDARD_METAFIELD] Updating standard Shopify metafields for bundle product");
      const standardMetafields = convertBundleToStandardMetafields(baseConfiguration);
      if (Object.keys(standardMetafields).length > 0) {
        await updateProductStandardMetafields(admin, updatedBundle.shopifyProductId, standardMetafields);
        console.log("🔧 [STANDARD_METAFIELD] Standard metafields updated successfully");
      } else {
        console.log("🔧 [STANDARD_METAFIELD] No standard metafields to update");
      }

    } catch (error) {
      console.error("Failed to update bundle product metafields:", error);
      // Don't fail the entire operation - just log the error
    }
  }

  // ALWAYS update cart transform metafields (Shopify recommended approach)
  // This ensures cart transform functions get updated bundle data immediately
  try {
    await updateCartTransformMetafield(admin, session.shop);
  } catch (error) {
    console.error("Failed to update cart transform metafield:", error);
    // Don't fail the entire operation - just log the error
  }

  // ALSO update shop-level all_bundles metafield for Liquid extension (legacy compatibility)
  // This ensures the widget gets updated bundle data immediately
  try {
    await updateShopBundlesMetafield(admin, session.shop);
  } catch (error) {
    console.error("Failed to update shop bundles metafield:", error);
    // Don't fail the entire operation - just log the error
  }

  return json({ 
    success: true, 
    bundle: updatedBundle,
    message: "Bundle configuration saved successfully"
  });
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
        console.error("GraphQL errors:", data.errors);
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
      if (bundle.pricing?.enableDiscount) {
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
          // Only store essential product data (IDs only, no full objects)
          products: (step.products || []).map((product: any) => ({
            id: product.id,
            title: product.title || 'Product'
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
          type: "cart_transform",
          steps: optimizedSteps,
          pricing: {
            enabled: bundle.pricing.enableDiscount,
            method: bundle.pricing.discountMethod,
            rules: bundle.pricing.rules || []
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
      console.error("Sync error:", error);
      return json({ 
        success: false, 
        error: `Failed to sync product: ${(error as Error).message}` 
      }, { status: 500 });
    }
  }

  // Create product if it doesn't exist
  if (!productId) {
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
          descriptionHtml: bundle.description || "",
          variants: [
            {
              price: "0.00",
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
  }

  // Update metafields with current bundle configuration
  if (productId && bundle.pricing?.enableDiscount) {
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
      // Only store essential product data (IDs only, no full objects)
      products: (step.products || []).map((product: any) => ({
        id: product.id,
        title: product.title || 'Product'
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
      type: "cart_transform",
      steps: optimizedSteps,
      pricing: {
        enabled: bundle.pricing.enableDiscount,
        method: bundle.pricing.discountMethod,
        rules: bundle.pricing.rules || []
      },
      updatedAt: new Date().toISOString()
    };

    const configSize = JSON.stringify(bundleConfiguration).length;
    console.log("📏 [METAFIELD] Sync optimized configuration size:", configSize, "chars");

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
      console.error("No themes returned from GraphQL:", themesData);
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
      console.error("Assets response error:", {
        status: assetsResponse.status,
        statusText: assetsResponse.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch theme assets: ${assetsResponse.status} ${assetsResponse.statusText}`);
    }

    const assetsData = await assetsResponse.json();
    
    // Filter for template files and organize them
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

        if (templateName === 'index') {
          title = 'Homepage';
          description = 'Main landing page of your store';
          recommended = true;
        } else if (templateName.startsWith('product')) {
          title = templateName === 'product' ? 'Product Pages' : `Product - ${templateName.replace('product.', '')}`;
          description = 'Individual product detail pages';
          recommended = templateName === 'product';
        } else if (templateName.startsWith('collection')) {
          title = templateName === 'collection' ? 'Collection Pages' : `Collection - ${templateName.replace('collection.', '')}`;
          description = 'Product collection listing pages';
          recommended = templateName === 'collection';
        } else if (templateName === 'page') {
          title = 'Static Pages';
          description = 'Custom content pages (About, Contact, etc.)';
          recommended = true;
        } else if (templateName === 'cart') {
          title = 'Cart Page';
          description = 'Shopping cart page';
          recommended = false;
        } else if (templateName === 'search') {
          title = 'Search Results';
          description = 'Search results page';
          recommended = false;
        } else {
          title = templateName.charAt(0).toUpperCase() + templateName.slice(1);
          description = `${title} template`;
          recommended = false;
        }

        return {
          id: templateName,
          title,
          handle: templateName,
          description,
          recommended,
          fileType: isJson ? 'JSON' : 'Liquid',
          fullKey: asset.key
        };
      })
      .sort((a: any, b: any) => {
        // Sort by recommended first, then alphabetically
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return a.title.localeCompare(b.title);
      });

    return json({ 
      success: true, 
      templates,
      themeId,
      themeName: publishedTheme.name
    });

  } catch (error) {
    console.error("Error fetching theme templates:", error);
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

export default function ConfigureBundleFlow() {
  const { bundle, bundleProduct: loadedBundleProduct, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();
  
  // State for form controls
  const [bundleStatus, setBundleStatus] = useState(bundle.status);
  const [activeSection, setActiveSection] = useState("step_setup");
  const [bundleName, setBundleName] = useState(bundle.name);
  const [bundleDescription, setBundleDescription] = useState(bundle.description || "");
  
  // State for step management
  const [steps, setSteps] = useState(bundle.steps || []);
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
  console.log("[DEBUG] Initial step conditions state:", stepConditions);
  
  
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
  
  // State for discount & pricing
  const [discountEnabled, setDiscountEnabled] = useState(bundle.pricing?.enableDiscount || false);
  const [discountType, setDiscountType] = useState(bundle.pricing?.discountMethod || 'fixed_bundle_price');
  const [discountRules, setDiscountRules] = useState(bundle.pricing?.rules || []);
  const [discountDisplayEnabled, setDiscountDisplayEnabled] = useState(true);
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
    steps: JSON.stringify(bundle.steps || []),
    discountEnabled: bundle.pricing?.enableDiscount || false,
    discountType: bundle.pricing?.discountMethod || 'fixed_bundle_price',
    discountRules: JSON.stringify(bundle.pricing?.rules || []),
    discountDisplayEnabled: true,
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
        console.error('Error triggering save bar:', error);
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
          console.error('Fallback save bar trigger also failed:', fallbackError);
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
        console.error('Error dismissing save bar:', error);
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
      case 'bundleStatus':
        return bundleStatus;
      case 'stepsData':
        return JSON.stringify(steps);
      case 'discountData':
        return JSON.stringify({discountEnabled, discountType, discountRules});
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
  }, [bundleName, bundleDescription, bundleStatus, steps, discountEnabled, discountType, discountRules, selectedCollections, stepConditions, bundleProduct, productStatus]);

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
      discountDisplayEnabled !== originalValues.discountDisplayEnabled ||
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
    bundleStatus, bundleName, bundleDescription, steps, 
    discountEnabled, discountType, discountRules, 
    discountDisplayEnabled, discountMessagingEnabled, ruleMessages,
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
        discountDisplayEnabled,
        discountMessagingEnabled,
        ruleMessages
      }));
      formData.append("stepConditions", JSON.stringify(stepConditions));
      formData.append("bundleProduct", JSON.stringify(bundleProduct));
      console.log("[DEBUG] Submitting step conditions to server:", stepConditions);
      console.log("[DEBUG] Submitting bundle product to server:", bundleProduct);

      // Submit to server action using fetcher
      
      fetcher.submit(formData, { method: "post" });
      
      // Note: With useFetcher, we need to handle the response via useEffect
      // The immediate return here will be handled by the fetcher response
      return;
    } catch (error) {
      console.error("Save failed:", error);
      shopify.toast.show((error as Error).message || "Failed to save changes", { isError: true });
    }
  }, [bundleStatus, bundleName, bundleDescription, steps, discountEnabled, discountType, discountRules, discountDisplayEnabled, discountMessagingEnabled, ruleMessages, selectedCollections, stepConditions, bundleProduct, productStatus, shopify]);

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
            steps: JSON.stringify(steps),
            discountEnabled: discountEnabled,
            discountType: discountType,
            discountRules: JSON.stringify(discountRules),
            discountDisplayEnabled: discountDisplayEnabled,
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
            console.log('Sync data:', { title, status, lastUpdated, changesDetected });
            
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
          setAvailablePages((result as any).templates || []);
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
  }, [fetcher.data, fetcher.state, bundleStatus, bundleName, bundleDescription, steps, discountEnabled, discountType, discountRules, discountDisplayEnabled, discountMessagingEnabled, selectedCollections, ruleMessages, stepConditions, bundleProduct, productStatus, shopify]);

  // Discard handler
  const handleDiscard = useCallback(() => {
    try {
      // Reset to original values
      setBundleStatus(originalValues.status);
      setBundleName(originalValues.name);
      setBundleDescription(originalValues.description);
      setSteps(JSON.parse(originalValues.steps));
      setDiscountEnabled(originalValues.discountEnabled);
      setDiscountType(originalValues.discountType);
      setDiscountRules(JSON.parse(originalValues.discountRules));
      setDiscountDisplayEnabled(originalValues.discountDisplayEnabled);
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
      console.error("Error discarding changes:", error);
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

    console.log('Bundle product data for preview:', {
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
      console.error('Bundle product data:', bundleProduct);
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
    console.log(`[DEBUG] Adding condition rule for step ${stepId}:`, newRule);
    setStepConditions(prev => {
      const updated = {
        ...prev,
        [stepId]: [...(prev[stepId] || []), newRule],
      };
      console.log(`[DEBUG] Updated step conditions state:`, updated);
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
    console.log(`[DEBUG] Updating condition rule - Step: ${stepId}, Rule: ${ruleId}, Field: ${field}, Value: ${value}`);
    setStepConditions(prev => {
      const updated = {
        ...prev,
        [stepId]: (prev[stepId] || []).map(rule =>
          rule.id === ruleId ? { ...rule, [field]: value } : rule
        ),
      };
      console.log(`[DEBUG] Updated step conditions after field update:`, updated);
      return updated;
    });
    
    // Modern App Bridge will automatically detect form changes
    setHasUnsavedChanges(true);
  }, [triggerSaveBar]);

  // Product selection handlers
  const handleProductSelection = useCallback(async (stepId: string) => {
    try {
      const step = steps.find(s => s.id === stepId);
      const currentProducts = step?.StepProduct || [];
      
      const products = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: currentProducts.map((p) => ({ id: p.id })),
      });

      if (products && products.selection) {
        // Update the step with selected products
        setSteps(steps.map(step => 
          step.id === stepId 
            ? { ...step, StepProduct: products.selection }
            : step
        ) as any);
        
        // Trigger save bar for product selection changes
        triggerSaveBar();
        
        shopify.toast.show("Products updated successfully!");
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      console.log("Product selection cancelled or failed:", error);
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
      console.error("Product sync failed:", error);
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
      console.log("Bundle product selection cancelled or failed:", error);
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
      const collections = await shopify.resourcePicker({
        type: "collection",
        multiple: true,
      });
      
      if (collections && collections.length > 0) {
        setSelectedCollections(prev => ({
          ...prev,
          [stepId]: collections as any
        }));
        
        // Trigger save bar for collection selection changes
        triggerSaveBar();
        
        shopify.toast.show("Collections updated successfully", { isError: false });
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      console.log("Collection selection cancelled or failed:", error);
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

  // Discount rule management
  const addDiscountRule = useCallback(() => {
    let newRule;
    
    if (discountType === 'fixed_bundle_price') {
      newRule = {
        id: `rule-${Date.now()}`,
        numberOfProducts: 0,
        price: 0,
      };
    } else {
      // For percentage_off and fixed_amount_off
      newRule = {
        id: `rule-${Date.now()}`,
        type: 'amount', // amount or quantity
        condition: 'greater_than_equal_to', // greater_than_equal_to, less_than_equal_to, equal_to
        value: 0,
        discountValue: 0, // percentage or fixed amount
      };
    }
    
    setDiscountRules([...(discountRules as any[]), newRule]);
    
    // Initialize messaging for new rule
    setRuleMessages(prev => ({
      ...prev,
      [newRule.id]: {
        discountText: 'Add {{discountConditionDiff}} {{discountUnit}} to get the bundle at {{discountValueUnit}}{{discountValue}}',
        successMessage: 'Congratulations 🎉 you have gotten the best offer on your bundle!'
      }
    }));
    
    // Trigger save bar for adding discount rule
    triggerSaveBar();
  }, [discountRules, discountType, triggerSaveBar]);

  const removeDiscountRule = useCallback((ruleId: string) => {
    setDiscountRules((discountRules as any[]).filter((rule: any) => rule.id !== ruleId));
    // Remove messaging for deleted rule
    setRuleMessages(prev => {
      const updated = { ...prev };
      delete updated[ruleId];
      return updated;
    });
    
    // Trigger save bar for removing discount rule
    triggerSaveBar();
  }, [discountRules, triggerSaveBar]);

  const updateDiscountRule = useCallback((ruleId: string, field: string, value: any) => {
    // Ensure numeric values are never negative
    let processedValue = value;
    if (['numberOfProducts', 'price', 'value', 'discountValue'].includes(field)) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      processedValue = Math.max(0, numValue || 0);
    }
    
    setDiscountRules((discountRules as any[]).map((rule: any) => 
      rule.id === ruleId ? { ...rule, [field]: processedValue } : rule
    ));
    
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
      console.error("Failed to load theme templates:", error);
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
      console.error('Error opening page selection:', error);
      shopify.toast.show("Failed to open page selection", { isError: true });
    }
  }, [loadAvailablePages, shopify]);

  const handlePageSelection = useCallback((template: any) => {
    try {
      
      if (!template || !template.handle) {
        console.error('Invalid template object:', template);
        shopify.toast.show("Template data is invalid", { isError: true });
        return;
      }

      const shopDomain = shop.includes('.myshopify.com') 
        ? shop.replace('.myshopify.com', '') 
        : shop;

      // Use correct app block ID format: {client_id}/{block_handle}
      // The block handle is the filename without .liquid (bundle.liquid -> bundle)
      const appBlockId = 'bfda5624970c7ada838998eb951e9e85/bundle';
      
      // Generate theme editor deep link for template with app block and bundle ID
      // Include bundle ID so the placed widget automatically loads this specific cart transform bundle
      const themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=${template.handle}&addAppBlockId=${appBlockId}&bundleId=${bundle.id}`;


      setSelectedPage(template);
      setIsPageSelectionModalOpen(false);

      // Open theme editor in new tab
      window.open(themeEditorUrl, '_blank', 'noopener,noreferrer');
      
      shopify.toast.show(`Theme editor opened for "${template.title}". Look for "Bundle Builder" in the Apps section and drag it to your desired location.`, { isError: false, duration: 6000 });
      
    } catch (error) {
      console.error('Error opening theme editor:', error);
      shopify.toast.show("Failed to open theme editor", { isError: true });
    }
  }, [shop, shopify]);

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
        <input type="hidden" name="bundleStatus" value={bundleStatus} />
        <input type="hidden" name="bundleProduct" value={JSON.stringify(bundleProduct)} />
        <input type="hidden" name="stepsData" value={JSON.stringify(steps)} />
        <input type="hidden" name="discountData" value={JSON.stringify({ discountEnabled, discountType, discountRules })} />
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
                                  badge: step.StepProduct?.length > 0 ? step.StepProduct.length.toString() : undefined,
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
                                <Text variant="bodyMd" tone="subdued">
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
                                      <Button
                                        variant="plain"
                                        size="micro"
                                        onClick={() => handleShowProducts(step.id)}
                                      >
                                        {step.StepProduct.length} Selected
                                      </Button>
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
                                <Text variant="bodyMd" tone="subdued">
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
                                      <Button
                                        variant="plain"
                                        size="micro"
                                        onClick={() => handleShowCollections(step.id)}

>
                                        {selectedCollections[step.id].length} Selected
                                      </Button>
                                    </Badge>
                                  )}
                                </InlineStack>

                                {/* Display selected collections */}
                                {selectedCollections[step.id]?.length > 0 && (
                                  <BlockStack gap="100">
                                    <Text variant="bodyMd" fontWeight="medium">
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
                                          <Text variant="bodyMd">{collection.title}</Text>
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
                              <Text variant="bodyMd" tone="subdued">
                                Create Conditions based on amount or quantity of products added on this step.
                              </Text>
                              <Text variant="bodySm" tone="subdued">
                                Note: Conditions are only valid on this step
                              </Text>
                            </BlockStack>
                            
                            {/* Existing Condition Rules */}
                            {(stepConditions[step.id] || []).map((rule, ruleIndex) => (
                              <Card key={rule.id} background="bg-surface-secondary">
                                <BlockStack gap="200">
                                  <InlineStack align="space-between" blockAlign="center">
                                    <Text variant="bodyMd" fontWeight="medium">
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
                                      options={[
                                        { label: 'Quantity', value: 'quantity' },
                                        { label: 'Amount', value: 'amount' },
                                      ]}
                                      value={rule.type}
                                      onChange={(value) => updateConditionRule(step.id, rule.id, 'type', value)}
                                    />
                                    <Select
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
                    variant="dashed" 
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
                  <Text variant="bodyMd" tone="subdued">
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
                        { label: 'Fixed Bundle Price', value: 'fixed_bundle_price' },
                        { label: 'Percentage Off', value: 'percentage_off' },
                        { label: 'Fixed Amount Off', value: 'fixed_amount_off' },
                      ]}
                      value={discountType}
                      onChange={(value) => {
                        setDiscountType(value);
                        // Clear existing rules when discount type changes since field structure is different
                        setDiscountRules([]);
                        // Clear rule messages when discount type changes
                        setRuleMessages({});
                      }}
                    />

                    {/* Discount Rules */}
                    <BlockStack gap="300">
                      {discountRules.map((rule, index) => (
                        <Card key={rule.id} background="bg-surface-secondary">
                          <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                              <Text variant="bodyMd" fontWeight="medium">
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
                            
                            {/* Render different fields based on discount type */}
                            {discountType === 'fixed_bundle_price' ? (
                              <InlineStack gap="200" align="start">
                                <TextField
                                  label="Number of Products in Bundle"
                                  value={String(rule.numberOfProducts || 0)}
                                  onChange={(value) => updateDiscountRule(rule.id, 'numberOfProducts', parseInt(value) || 0)}
                                  type="number"
                                  min="0"
                                  autoComplete="off"
                                />
                                <TextField
                                  label="Price"
                                  value={String(rule.price || 0)}
                                  onChange={(value) => updateDiscountRule(rule.id, 'price', parseFloat(value) || 0)}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  prefix="₹"
                                  autoComplete="off"
                                />
                              </InlineStack>
                            ) : (
                              <BlockStack gap="300">
                                <InlineStack gap="200" align="start">
                                  <Select
                                    label="Type"
                                    options={[
                                      { label: 'Amount', value: 'amount' },
                                      { label: 'Quantity', value: 'quantity' },
                                    ]}
                                    value={rule.type || 'amount'}
                                    onChange={(value) => updateDiscountRule(rule.id, 'type', value)}
                                  />
                                  <Select
                                    label="Condition"
                                    options={[
                                      { label: 'Greater than & equal to', value: 'greater_than_equal_to' },
                                      { label: 'Less than & equal to', value: 'less_than_equal_to' },
                                      { label: 'Equal to', value: 'equal_to' },
                                    ]}
                                    value={rule.condition || 'greater_than_equal_to'}
                                    onChange={(value) => updateDiscountRule(rule.id, 'condition', value)}
                                  />
                                  <TextField
                                    label="Value"
                                    value={String(rule.value || 0)}
                                    onChange={(value) => updateDiscountRule(rule.id, 'value', parseFloat(value) || 0)}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    autoComplete="off"
                                  />
                                </InlineStack>
                                <TextField
                                  label={discountType === 'percentage_off' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                                  value={String(rule.discountValue || 0)}
                                  onChange={(value) => updateDiscountRule(rule.id, 'discountValue', parseFloat(value) || 0)}
                                  type="number"
                                  min="0"
                                  max={discountType === 'percentage_off' ? "100" : undefined}
                                  step="0.01"
                                  prefix={discountType === 'fixed_amount_off' ? '₹' : undefined}
                                  suffix={discountType === 'percentage_off' ? '%' : undefined}
                                  autoComplete="off"
                                />
                              </BlockStack>
                            )}
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

                    {/* Discount Display Options */}
                    <BlockStack gap="300">
                      <Text variant="headingSm" as="h4">
                        Discount Display Options
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        Choose how discounts are displayed
                      </Text>
                      <Checkbox
                        label="Discount Display Options"
                        checked={discountDisplayEnabled}
                        onChange={setDiscountDisplayEnabled}
                      />
                    </BlockStack>

                    {/* Discount Messaging */}
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Text variant="headingSm" as="h4">
                            Discount Messaging
                          </Text>
                          <Text variant="bodyMd" tone="subdued">
                            Edit how discount messages appear above the subtotal.
                          </Text>
                        </BlockStack>
                        <Checkbox
                          label="Discount Messaging"
                          checked={discountMessagingEnabled}
                          onChange={setDiscountMessagingEnabled}
                        />
                      </InlineStack>

                      <Button 
                        variant="plain"
                        onClick={() => setShowVariables(!showVariables)}
                      >
                        Show Variables
                      </Button>

                      {/* Show available variables when toggled */}
                      {showVariables && (
                        <Card background="bg-surface-secondary">
                          <BlockStack gap="300">
                            <Text variant="headingSm" as="h4">
                              Variables
                            </Text>
                            <BlockStack gap="200">
                              <InlineStack align="space-between" blockAlign="center">
                                <Text variant="bodyMd">
                                  Discount Condition Difference
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                  {'{{discountConditionDiff}}'}
                                </Text>
                              </InlineStack>
                              
                              <InlineStack align="space-between" blockAlign="center">
                                <Text variant="bodyMd">
                                  Discount Unit
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                  {'{{discountUnit}}'}
                                </Text>
                              </InlineStack>
                              
                              <InlineStack align="space-between" blockAlign="center">
                                <Text variant="bodyMd">
                                  Discount Value
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                  {'{{discountValue}}'}
                                </Text>
                              </InlineStack>
                              
                              <InlineStack align="space-between" blockAlign="center">
                                <Text variant="bodyMd">
                                  Discount Value Unit
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                  {'{{discountValueUnit}}'}
                                </Text>
                              </InlineStack>
                            </BlockStack>
                          </BlockStack>
                        </Card>
                      )}

                      {/* Dynamic rule-based messaging */}
                      {discountMessagingEnabled && discountRules.length > 0 && (
                        <BlockStack gap="300">
                          {discountRules.map((rule, index) => (
                            <BlockStack key={rule.id} gap="300">
                              <Card background="bg-surface-secondary">
                                <BlockStack gap="200">
                                  <Text variant="bodyMd" fontWeight="medium">
                                    Rule #{index + 1}
                                  </Text>
                                  <Text variant="bodySm" tone="subdued">
                                    Discount Text
                                  </Text>
                                  <TextField
                                    value={ruleMessages[rule.id]?.discountText || 'Add {{discountConditionDiff}} {{discountUnit}} to get the bundle at {{discountValueUnit}}{{discountValue}}'}
                                    onChange={(value) => updateRuleMessage(rule.id, 'discountText', value)}
                                    multiline={2}
                                    autoComplete="off"
                                    helpText="This message appears when the customer is close to qualifying for the discount"
                                  />
                                </BlockStack>
                              </Card>

                              <Card background="bg-surface-secondary">
                                <BlockStack gap="200">
                                  <Text variant="bodyMd" fontWeight="medium">
                                    Success Message
                                  </Text>
                                  <TextField
                                    value={ruleMessages[rule.id]?.successMessage || 'Congratulations 🎉 you have gotten the best offer on your bundle!'}
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
                            <Text variant="bodyMd" tone="subdued" alignment="center">
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
            <Text variant="bodyMd">
              Choose a page template where you want to place the Bundle Builder widget. The theme editor will open with the selected template ready for widget configuration. Look for the "Bundle Builder" app block in the Apps section and drag it to your desired location.
            </Text>
            
            {isLoadingPages ? (
              <BlockStack gap="200" inlineAlign="center">
                <Text variant="bodyMd" tone="subdued">Loading templates...</Text>
              </BlockStack>
            ) : availablePages.length > 0 ? (
              <BlockStack gap="200">
                {availablePages.map((template) => (
                  <Card key={template.id} sectioned>
                    <InlineStack wrap={false} gap="300" align="space-between">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Text variant="bodyMd" fontWeight="medium">
                            {template.title}
                          </Text>
                          {template.recommended && (
                            <Badge tone="success">Recommended</Badge>
                          )}
                          {template.fileType && (
                            <Badge tone="info">{template.fileType}</Badge>
                          )}
                        </InlineStack>
                        <Text variant="bodySm" tone="subdued">
                          {template.description}
                        </Text>
                        <Text variant="bodyXs" tone="subdued">
                          Template: {template.handle}
                        </Text>
                      </BlockStack>
                      <Button
                        onClick={() => handlePageSelection(template)}
                        primary
                        icon={ExternalIcon}
                      >
                        Select Template
                      </Button>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            ) : (
              <Card sectioned>
                <BlockStack gap="200" inlineAlign="center">
                  <Text variant="bodyMd" tone="subdued" alignment="center">
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
                  <Text variant="bodyMd" fontWeight="medium">
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected for this step:
                  </Text>
                  <Card>
                    <List type="bullet">
                      {selectedProducts.map((product: any, index: number) => (
                        <List.Item key={product.id || index}>
                          <InlineStack gap="200" align="space-between">
                            <BlockStack gap="050">
                              <Text variant="bodyMd" fontWeight="medium">
                                {product.title || product.name || 'Unnamed Product'}
                              </Text>
                              {product.variants && product.variants.length > 0 && (
                                <Text variant="bodySm" tone="subdued">
                                  {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''} available
                                </Text>
                              )}
                            </BlockStack>
                            <Badge tone="info">Product</Badge>
                          </InlineStack>
                        </List.Item>
                      ))}
                    </List>
                  </Card>
                </BlockStack>
              ) : (
                <BlockStack gap="200" inlineAlign="center">
                  <Text variant="bodyMd" tone="subdued">
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
                  <Text variant="bodyMd" fontWeight="medium">
                    {collections.length} collection{collections.length !== 1 ? 's' : ''} selected for this step:
                  </Text>
                  <Card>
                    <List type="bullet">
                      {collections.map((collection: any, index: number) => (
                        <List.Item key={collection.id || index}>
                          <InlineStack gap="200" align="space-between">
                            <BlockStack gap="050">
                              <Text variant="bodyMd" fontWeight="medium">
                                {collection.title || 'Unnamed Collection'}
                              </Text>
                              {collection.handle && (
                                <Text variant="bodySm" tone="subdued">
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
                  <Text variant="bodyMd" tone="subdued">
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