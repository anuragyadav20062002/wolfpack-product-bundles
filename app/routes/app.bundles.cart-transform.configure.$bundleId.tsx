import { useState, useEffect, useCallback } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { AppLogger } from "../lib/logger";
import {
  DiscountMethod,
  ConditionType,
  ConditionOperator,
  type PricingRule,
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
  Spinner,
  Divider,
  Banner,
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
  EditIcon,
  ImageIcon,
} from "@shopify/polaris-icons";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
// Using modern App Bridge contextual save bar with data-save-bar attribute on form
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { ThemeTemplateService } from "../services/theme-template.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../services/bundles/metafield-sync.server";
import {
  calculateBundlePrice,
  updateBundleProductPrice,
} from "../services/bundles/pricing-calculation.server";
import {
  convertBundleToStandardMetafields,
  updateProductStandardMetafields,
} from "../services/bundles/standard-metafields.server";
import { getBundleProductVariantId } from "../utils/variant-lookup.server";
import { mapDiscountMethod } from "../utils/discount-mappers";
import { useBundleForm } from "../hooks/useBundleForm";
import { useBundleSteps } from "../hooks/useBundleSteps";
import { useBundleConditions } from "../hooks/useBundleConditions";
import { useBundlePricing } from "../hooks/useBundlePricing";

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
  apiKey: string;
  blockHandle: string;
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
      // Note: bundleType filter removed - not needed for single bundle lookup
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

  // CRITICAL: Use app's API key (client_id from shopify.app.toml), NOT extension UUID
  // Per Shopify docs: addAppBlockId={api_key}/{handle}
  // Reference: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
  const apiKey = process.env.SHOPIFY_API_KEY;
  // Block handle must match the liquid filename (without .liquid extension)
  // File: extensions/bundle-builder/blocks/bundle.liquid
  const blockHandle = 'bundle';

  return json({
    bundle,
    bundleProduct,
    shop: session.shop,
    apiKey,
    blockHandle,
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
      case "updateBundleProduct":
        return await handleUpdateBundleProduct(admin, session, bundleId, formData);
      case "getPages":
        return await handleGetPages(admin, session);
      case "getThemeTemplates":
        return await handleGetThemeTemplates(admin, session);
      case "getCurrentTheme":
        return await handleGetCurrentTheme(admin, session);
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

// Constants removed - these are defined in the pricing-calculation service if needed

// ===== EXTRACTED FUNCTIONS =====
// The following functions have been extracted to service files:
// - ensureBundleMetafieldDefinitions -> services/bundles/metafield-sync.server.ts
// - updateBundleProductMetafields -> services/bundles/metafield-sync.server.ts
// - getBundleProductVariantId -> utils/variant-lookup.server.ts
// - buildCartTransformConfig -> services/bundles/cart-transform-metafield.server.ts (NEW: Hybrid Architecture)
// - updateCartTransformConfigMetafield -> services/bundles/cart-transform-metafield.server.ts (NEW: Hybrid Architecture)
// - updateBundleIndex -> services/bundles/bundle-index.server.ts (NEW: Hybrid Architecture)
// - mapDiscountMethod -> utils/discount-mappers.ts
// - isUUID -> utils/shopify-validators.ts
// - isValidShopifyProductId -> utils/shopify-validators.ts
// - getFirstVariantId -> utils/variant-lookup.server.ts
// - calculateBundleTotalPrice -> services/bundles/pricing-calculation.server.ts
// - calculateBundlePrice -> services/bundles/pricing-calculation.server.ts
// - getProductPrice -> services/bundles/pricing-calculation.server.ts
// - updateBundleProductPrice -> services/bundles/pricing-calculation.server.ts
// - convertBundleToStandardMetafields -> services/bundles/standard-metafields.server.ts
// - updateComponentProductMetafields -> services/bundles/metafield-sync.server.ts
// - updateProductStandardMetafields -> services/bundles/standard-metafields.server.ts

// Handler functions start here
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
                name: step.name,
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
      // SYNC_PRODUCT_STATUS: Sync bundle status to Shopify product
      try {
        const shopifyStatus = finalStatus.toUpperCase();
        AppLogger.debug(`🔄 [PRODUCT_SYNC] Syncing status '${shopifyStatus}' to product ${updatedBundle.shopifyProductId}`);

        const UPDATE_PRODUCT_STATUS = `
          mutation UpdateProductStatus($input: ProductInput!) {
            productUpdate(input: $input) {
              product {
                id
                status
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        await admin.graphql(UPDATE_PRODUCT_STATUS, {
          variables: {
            input: {
              id: updatedBundle.shopifyProductId,
              status: shopifyStatus
            }
          }
        });
      } catch (error) {
        AppLogger.error("❌ [PRODUCT_SYNC] Failed to sync product status:", {}, error as any);
      }

      // Create optimized configuration with only essential data for functions
      const optimizedSteps = (stepsData || []).map((step: any) => ({
        id: step.id,
        name: step.name || 'Step',
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
            // Use new nested structure - already standardized from form
            return {
              id: rule.id,
              condition: rule.condition || {
                type: rule.conditionType || 'quantity',
                operator: rule.operator || 'gte',
                value: rule.value || 0
              },
              discount: rule.discount || {
                method: discountData.discountType,
                value: rule.discountValue || rule.value || 0
              }
            };
          }),
          display: {
            showFooter: discountData.showFooter !== false,
            showProgressBar: discountData.showProgressBar || false
          },
          messages: discountData.messages || {
            progress: 'Add {conditionText} to get {discountText}',
            qualified: 'Congratulations! You got {discountText}',
            showInCart: true
          }
        },
        // CRITICAL: Include bundle parent variant ID for cart transform merge operations
        bundleParentVariantId: bundleParentVariantId,
        shopifyProductId: updatedBundle.shopifyProductId, // Bundle product ID for querying metafield
        updatedAt: new Date().toISOString()
      };

      const configSize = JSON.stringify(baseConfiguration).length;
      AppLogger.debug("📏 [METAFIELD] Optimized configuration size:", {}, `${configSize} chars (vs 12KB+ before)`);

      try {
        // STANDARD METAFIELDS: For Shopify cart transform compatibility
        AppLogger.debug("🔧 [STANDARD_METAFIELD] Updating standard Shopify metafields for bundle product");
        try {
          const { metafields: standardMetafields, errors: conversionErrors } = await convertBundleToStandardMetafields(admin, baseConfiguration);
          if (conversionErrors.length > 0) {
            AppLogger.warn("⚠️ [STANDARD_METAFIELD] Some products could not be processed:", conversionErrors);
          }
          if (Object.keys(standardMetafields).length > 0) {
            await updateProductStandardMetafields(admin, updatedBundle.shopifyProductId, standardMetafields);
            AppLogger.debug("✅ [STANDARD_METAFIELD] Standard metafields updated successfully");
          } else {
            AppLogger.debug("ℹ️ [STANDARD_METAFIELD] No standard metafields to update");
          }
        } catch (error) {
          AppLogger.debug("⚠️ [STANDARD_METAFIELD] Skipping standard metafields (optional):", {}, (error as Error).message);
        }

        // COMPONENT METAFIELDS: Update component products with component_parents metafield
        AppLogger.debug("🔧 [COMPONENT_METAFIELD] Updating component products with component_parents metafield");
        const fullBundleConfig = {
          ...baseConfiguration,
          steps: updatedBundle.steps  // Use database steps with StepProduct array
        };
        await updateComponentProductMetafields(admin, updatedBundle.shopifyProductId, fullBundleConfig);
        AppLogger.debug("✅ [COMPONENT_METAFIELD] Component product metafields updated successfully");

        // BUNDLE VARIANT METAFIELDS: Set bundle_ui_config and other variant-level metafields
        // This is CRITICAL - without this, the widget cannot load on the storefront
        AppLogger.debug("🔧 [BUNDLE_VARIANT_METAFIELD] Updating bundle variant metafields (bundle_ui_config, component_reference, etc.)");
        await updateBundleProductMetafields(admin, updatedBundle.shopifyProductId, fullBundleConfig);
        AppLogger.debug("✅ [BUNDLE_VARIANT_METAFIELD] Bundle variant metafields updated successfully");

      } catch (error) {
        AppLogger.error("Failed to update bundle product metafields:", {}, error as any);
        // Don't fail the entire operation - just log the error
      }
    }

    // BUNDLE INDEX: No longer needed
    // Cart transform now queries variant metafields directly (Shopify Standard)
    // Shop-level bundle index has been removed for better performance and simplicity

    // Note: Widget now only displays when manually added to theme via app blocks
    // Merchants add the bundle-builder block through the theme editor (guided by onboarding flow)
    // Auto-injection removed to comply with Shopify App Store requirements

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
async function handleUpdateBundleStatus(admin: any, session: any, bundleId: string, formData: FormData) {
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

  // SYNC_PRODUCT_STATUS: Sync bundle status to Shopify product
  if (updatedBundle.shopifyProductId) {
    try {
      const shopifyStatus = status.toUpperCase();
      AppLogger.debug(`🔄 [PRODUCT_SYNC] Syncing status '${shopifyStatus}' to product ${updatedBundle.shopifyProductId}`);

      const UPDATE_PRODUCT_STATUS = `
        mutation UpdateProductStatus($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      await admin.graphql(UPDATE_PRODUCT_STATUS, {
        variables: {
          input: {
            id: updatedBundle.shopifyProductId,
            status: shopifyStatus
          }
        }
      });
    } catch (error) {
      AppLogger.error("❌ [PRODUCT_SYNC] Failed to sync product status:", {}, error as any);
    }
  }

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

// Handle updating bundle product details (title and image)
async function handleUpdateBundleProduct(admin: any, session: any, bundleId: string, formData: FormData) {
  try {
    const productId = formData.get("productId") as string;
    const productTitle = formData.get("productTitle") as string;
    const productImageUrl = formData.get("productImageUrl") as string;

    if (!productId) {
      return json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    AppLogger.debug("🔄 [PRODUCT_UPDATE] Updating product details", {
      productId,
      productTitle,
      hasImageUrl: !!productImageUrl
    });

    // Update product title
    const UPDATE_PRODUCT = `
      mutation UpdateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const updateResponse = await admin.graphql(UPDATE_PRODUCT, {
      variables: {
        input: {
          id: productId,
          title: productTitle
        }
      }
    });

    const updateData = await updateResponse.json();

    if (updateData.data?.productUpdate?.userErrors?.length > 0) {
      const error = updateData.data.productUpdate.userErrors[0];
      throw new Error(`Failed to update product: ${error.message}`);
    }

    // Add/update product image if provided (using productCreateMedia - API 2025-04+)
    if (productImageUrl) {
      const CREATE_MEDIA = `
        mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
          productCreateMedia(productId: $productId, media: $media) {
            media {
              alt
              mediaContentType
              status
            }
            mediaUserErrors {
              field
              message
            }
          }
        }
      `;

      const imageResponse = await admin.graphql(CREATE_MEDIA, {
        variables: {
          productId: productId,
          media: [
            {
              originalSource: productImageUrl,
              alt: `${productTitle} - Bundle`,
              mediaContentType: "IMAGE"
            }
          ]
        }
      });

      const imageData = await imageResponse.json();

      if (imageData.data?.productCreateMedia?.mediaUserErrors?.length > 0) {
        const error = imageData.data.productCreateMedia.mediaUserErrors[0];
        AppLogger.error("❌ [PRODUCT_UPDATE] Image update failed:", {}, error);
        // Don't fail the entire operation for image update errors
      } else {
        AppLogger.debug("✅ [PRODUCT_UPDATE] Image added successfully");
      }
    }

    AppLogger.info("✅ [PRODUCT_UPDATE] Product details updated successfully");

    return json({
      success: true,
      message: "Product details updated successfully"
    });

  } catch (error) {
    AppLogger.error("❌ [PRODUCT_UPDATE] Error updating product:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Failed to update product"
    }, { status: 500 });
  }
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
  const { bundle, bundleProduct: loadedBundleProduct, shop, apiKey, blockHandle } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();

  // ===== CUSTOM HOOKS =====
  // Form state management
  const formState = useBundleForm({
    initialData: {
      name: bundle.name,
      description: bundle.description || "",
      status: bundle.status,
      templateName: bundle.templateName || ""
    }
  });

  // Step conditions initialization
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

  // Condition rules management
  const conditionsState = useBundleConditions({
    initialStepConditions: initializeStepConditions(),
    onTriggerSaveBar: formState.triggerSaveBar
  });

  AppLogger.debug("[DEBUG] Initial step conditions state:", conditionsState.stepConditions);

  // Transform StepProduct to use productId as id (not the database UUID)
  const transformedSteps = (bundle.steps || []).map((step: any) => ({
    ...step,
    StepProduct: (step.StepProduct || []).map((sp: any) => ({
      ...sp,
      id: sp.productId,  // Use productId (Shopify GID) as id, not database UUID
    }))
  }));

  // Steps management
  const stepsState = useBundleSteps({
    initialSteps: transformedSteps,
    onTriggerSaveBar: formState.triggerSaveBar,
    shopify
  });

  // Pricing management
  const pricingState = useBundlePricing({
    initialPricing: bundle.pricing,
    onTriggerSaveBar: formState.triggerSaveBar
  });


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

  // State for bundle product editing
  const [isEditingProductDetails, setIsEditingProductDetails] = useState(false);
  const [productTitle, setProductTitle] = useState(loadedBundleProduct?.title || "");
  const [productImageUrl, setProductImageUrl] = useState(loadedBundleProduct?.featuredImage?.url || loadedBundleProduct?.images?.[0]?.originalSrc || "");

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

  // NOTE: Discount & pricing state now managed by pricingState hook above
  // NOTE: Rule-specific messaging still uses local state (not extracted to hook yet)
  const [ruleMessages, setRuleMessages] = useState<Record<string, { discountText: string; successMessage: string }>>({});

  // UI state for section navigation (expandedSteps and selectedTab now from stepsState hook)
  const [activeSection, setActiveSection] = useState('step_setup');

  // Track original values for change detection - initialize with loaded data to prevent false positives
  const [originalValues, setOriginalValues] = useState({
    status: formState.bundleStatus,
    name: formState.bundleName,
    description: formState.bundleDescription,
    templateName: formState.templateName,
    steps: JSON.stringify(
      (bundle.steps || []).map((step: any) => ({
        ...step,
        StepProduct: (step.StepProduct || []).map((sp: any) => ({
          ...sp,
          id: sp.productId,  // Transform to use Shopify GID, not database UUID
        }))
      }))
    ),
    discountEnabled: pricingState.discountEnabled,
    discountType: pricingState.discountType,
    discountRules: JSON.stringify(pricingState.discountRules),
    showProgressBar: pricingState.showProgressBar,
    showFooter: pricingState.showFooter,
    discountMessagingEnabled: pricingState.discountMessagingEnabled,
    selectedCollections: JSON.stringify({}),
    ruleMessages: JSON.stringify({}),
    stepConditions: JSON.stringify(conditionsState.stepConditions),
    bundleProduct: loadedBundleProduct || null,
    productStatus: loadedBundleProduct?.status || "ACTIVE",
  });

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // NOTE: triggerSaveBar and dismissSaveBar are now provided by formState hook

  // Check for changes whenever form values change
  useEffect(() => {
    // Helper function to safely compare bundle products
    const compareBundleProducts = (current: any, original: any) => {
      if (!current && !original) return true;
      if (!current || !original) return false;
      return current.id === original.id;
    };

    const stepSetupChanges = (
      formState.bundleName !== originalValues.name ||
      formState.bundleDescription !== originalValues.description ||
      formState.templateName !== originalValues.templateName ||
      JSON.stringify(stepsState.steps) !== originalValues.steps ||
      JSON.stringify(selectedCollections) !== originalValues.selectedCollections ||
      JSON.stringify(conditionsState.stepConditions) !== originalValues.stepConditions ||
      !compareBundleProducts(bundleProduct, originalValues.bundleProduct) ||
      productStatus !== originalValues.productStatus
    );

    const discountPricingChanges = (
      pricingState.discountEnabled !== originalValues.discountEnabled ||
      pricingState.discountType !== originalValues.discountType ||
      JSON.stringify(pricingState.discountRules) !== originalValues.discountRules ||
      pricingState.showProgressBar !== originalValues.showProgressBar ||
      pricingState.showFooter !== originalValues.showFooter ||
      pricingState.discountMessagingEnabled !== originalValues.discountMessagingEnabled ||
      JSON.stringify(ruleMessages) !== originalValues.ruleMessages
    );

    const bundleStatusChanges = (
      formState.bundleStatus !== originalValues.status
    );

    const hasChanges = stepSetupChanges || discountPricingChanges || bundleStatusChanges;

    setHasUnsavedChanges(hasChanges);

    // Note: SaveBar visibility is now controlled declaratively via the component
    // No need for imperative show/hide calls which cause flashing
  }, [
    formState.bundleStatus,
    formState.bundleName,
    formState.bundleDescription,
    formState.templateName,
    stepsState.steps,
    pricingState.discountEnabled,
    pricingState.discountType,
    pricingState.discountRules,
    pricingState.showProgressBar,
    pricingState.showFooter,
    pricingState.discountMessagingEnabled,
    ruleMessages,
    selectedCollections,
    conditionsState.stepConditions,
    bundleProduct,
    productStatus,
    originalValues
    // Removed 'shopify' from dependencies - it's stable and doesn't need to trigger re-runs
  ]);

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      // Prepare form data for submission
      const formData = new FormData();
      formData.append("intent", "saveBundle");
      formData.append("bundleName", formState.bundleName);
      formData.append("bundleDescription", formState.bundleDescription);
      formData.append("templateName", formState.templateName);
      formData.append("bundleStatus", formState.bundleStatus);
      // Merge collections data into steps before saving
      const stepsWithCollections = stepsState.steps.map(step => ({
        ...step,
        collections: selectedCollections[step.id] || step.collections || []
      }));

      formData.append("stepsData", JSON.stringify(stepsWithCollections));
      formData.append("discountData", JSON.stringify({
        discountEnabled: pricingState.discountEnabled,
        discountType: pricingState.discountType,
        discountRules: pricingState.discountRules,
        discountMessagingEnabled: pricingState.discountMessagingEnabled,
        ruleMessages
      }));
      formData.append("stepConditions", JSON.stringify(conditionsState.stepConditions));
      formData.append("bundleProduct", JSON.stringify(bundleProduct));
      AppLogger.debug("[DEBUG] Submitting step conditions to server:", conditionsState.stepConditions);
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
  }, [
    formState.bundleStatus,
    formState.bundleName,
    formState.bundleDescription,
    formState.templateName,
    stepsState.steps,
    pricingState.discountEnabled,
    pricingState.discountType,
    pricingState.discountRules,
    pricingState.showProgressBar,
    pricingState.showFooter,
    pricingState.discountMessagingEnabled,
    ruleMessages,
    selectedCollections,
    conditionsState.stepConditions,
    bundleProduct,
    productStatus,
    shopify
  ]);

  // Function to enhance template list with user's selected template
  const enhanceTemplateListWithUserSelection = useCallback((templates: any[]) => {
    if (!formState.templateName || formState.templateName.trim() === '') {
      return templates;
    }

    const userTemplateHandle = formState.templateName.startsWith('product.') ? formState.templateName : `product.${formState.templateName}`;

    // Check if user's template already exists in the list
    const templateExists = templates.some(t => t.handle === userTemplateHandle || t.handle === formState.templateName);

    if (!templateExists) {
      // Add user's selected template at the top of the list
      const userTemplate = {
        id: userTemplateHandle,
        title: `🎯 ${formState.templateName} (Your Selection)`,
        handle: userTemplateHandle,
        description: `Custom template "${formState.templateName}" - your selected bundle container template`,
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
      if (t.handle === userTemplateHandle || t.handle === formState.templateName) {
        return {
          ...t,
          title: `🎯 ${t.title} (Your Selection)`,
          recommended: true,
          isUserSelected: true
        };
      }
      return t;
    });
  }, [formState.templateName]);

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
            status: formState.bundleStatus,
            name: formState.bundleName,
            description: formState.bundleDescription,
            templateName: formState.templateName,
            steps: JSON.stringify(stepsState.steps),
            discountEnabled: pricingState.discountEnabled,
            discountType: pricingState.discountType,
            discountRules: JSON.stringify(pricingState.discountRules),
            showProgressBar: pricingState.showProgressBar,
            showFooter: pricingState.showFooter,
            discountMessagingEnabled: pricingState.discountMessagingEnabled,
            selectedCollections: JSON.stringify(selectedCollections),
            ruleMessages: JSON.stringify(ruleMessages),
            stepConditions: JSON.stringify(conditionsState.stepConditions),
            bundleProduct: bundleProduct || null,
            productStatus: productStatus,
          });

          // SaveBar will hide automatically when hasUnsavedChanges becomes false
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
  }, [
    fetcher.data,
    fetcher.state,
    formState.bundleStatus,
    formState.bundleName,
    formState.bundleDescription,
    formState.templateName,
    stepsState.steps,
    pricingState.discountEnabled,
    pricingState.discountType,
    pricingState.discountRules,
    pricingState.showProgressBar,
    pricingState.showFooter,
    pricingState.discountMessagingEnabled,
    selectedCollections,
    ruleMessages,
    conditionsState.stepConditions,
    bundleProduct,
    productStatus,
    shopify,
    enhanceTemplateListWithUserSelection
  ]);

  // Discard handler
  const handleDiscard = useCallback(() => {
    try {
      // Reset to original values using hook setters
      formState.setBundleStatus(originalValues.status);
      formState.setBundleName(originalValues.name);
      formState.setBundleDescription(originalValues.description);
      formState.setTemplateName(originalValues.templateName);
      stepsState.setSteps(JSON.parse(originalValues.steps));
      pricingState.setDiscountEnabled(originalValues.discountEnabled);
      pricingState.setDiscountType(originalValues.discountType as DiscountMethod);
      pricingState.setDiscountRules(JSON.parse(originalValues.discountRules));
      pricingState.setShowProgressBar(originalValues.showProgressBar);
      pricingState.setShowFooter(originalValues.showFooter);
      pricingState.setDiscountMessagingEnabled(originalValues.discountMessagingEnabled);
      setSelectedCollections(JSON.parse(originalValues.selectedCollections));
      setRuleMessages(JSON.parse(originalValues.ruleMessages));
      conditionsState.setStepConditions(JSON.parse(originalValues.stepConditions));
      // Keep the loaded bundle product instead of resetting to null
      setBundleProduct(originalValues.bundleProduct || loadedBundleProduct || null);
      setProductStatus(originalValues.productStatus);

      // SaveBar will hide automatically when hasUnsavedChanges becomes false
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

    setActiveSection(section);
  }, [hasUnsavedChanges, activeSection, shopify]);

  // Modal handlers for products and collections view
  // handleShowProducts and handleShowCollections removed - modals managed inline

  const handleCloseProductsModal = useCallback(() => {
    setIsProductsModalOpen(false);
    setCurrentModalStepId('');
  }, []);

  const handleCloseCollectionsModal = useCallback(() => {
    setIsCollectionsModalOpen(false);
    setCurrentModalStepId('');
  }, []);

  // Step management functions


  // NOTE: toggleStepExpansion, getUniqueProductCount, updateStepField, addConditionRule,
  // removeConditionRule, updateConditionRule are now provided by stepsState and conditionsState hooks

  // Product selection handlers
  const handleProductSelection = useCallback(async (stepId: string) => {
    try {
      const step = stepsState.steps.find(s => s.id === stepId);
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

      AppLogger.debug("🔍 [PRODUCT_SELECTION] Total items in StepProduct:", {}, `${currentProducts.length}`);
      AppLogger.debug("🔍 [PRODUCT_SELECTION] Selection IDs being sent to picker:", {}, `${selectionIds.length}`);
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
        stepsState.setSteps(stepsState.steps.map(step =>
          step.id === stepId
            ? { ...step, StepProduct: transformedProducts }
            : step
        ) as any);

        // Trigger save bar for product selection changes
        formState.triggerSaveBar();

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
  }, [stepsState.steps, stepsState.setSteps, shopify, formState.triggerSaveBar]);

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
        const selectedProduct = products[0] as any;
        setBundleProduct(selectedProduct);
        setProductTitle(selectedProduct.title || "");
        setProductImageUrl(selectedProduct.featuredImage?.url || selectedProduct.images?.[0]?.originalSrc || "");

        // Trigger save bar immediately after bundle product selection
        formState.triggerSaveBar();

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

  // Handle product image upload
  const handleProductImageUpload = useCallback(async () => {
    try {
      if (!bundleProduct?.id) {
        shopify.toast.show("Please select a bundle product first", { isError: true });
        return;
      }

      // Use Shopify's resource picker to select an image or upload new one
      const imageUrl = window.prompt("Enter image URL (or we'll add file upload in next version):");

      if (imageUrl) {
        setProductImageUrl(imageUrl);
        shopify.toast.show("Image will be updated when you save changes", { isError: false });
        formState.triggerSaveBar();
      }
    } catch (error) {
      AppLogger.error("Image upload failed:", {}, error as any);
      shopify.toast.show("Failed to upload image", { isError: true });
    }
  }, [bundleProduct, shopify, formState.triggerSaveBar]);

  // Handle product title update
  const handleSaveProductDetails = useCallback(async () => {
    try {
      if (!bundleProduct?.id) {
        shopify.toast.show("No bundle product to update", { isError: true });
        return;
      }

      const formData = new FormData();
      formData.append("intent", "updateBundleProduct");
      formData.append("productId", bundleProduct.id);
      formData.append("productTitle", productTitle);
      formData.append("productImageUrl", productImageUrl);

      fetcher.submit(formData, { method: "post" });
      setIsEditingProductDetails(false);

      shopify.toast.show("Updating product details...", { isError: false });
    } catch (error) {
      AppLogger.error("Product update failed:", {}, error as any);
      shopify.toast.show("Failed to update product details", { isError: true });
    }
  }, [bundleProduct, productTitle, productImageUrl, fetcher, shopify]);

  // Step management handlers
  const cloneStep = useCallback((stepId: string) => {
    const stepToClone = stepsState.steps.find(step => step.id === stepId);
    if (stepToClone) {
      const newStep = {
        ...stepToClone,
        id: `step-${Date.now()}`,
        name: `${stepToClone.name} (Copy)`,
        StepProduct: stepToClone.StepProduct || []
      };
      stepsState.setSteps(prev => {
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
  }, [stepsState.steps, stepsState.setSteps, shopify]);

  const deleteStep = useCallback((stepId: string) => {
    if (stepsState.steps.length <= 1) {
      shopify.toast.show("Cannot delete the last step", { isError: true });
      return;
    }

    // Use hook's removeStep which handles expandedSteps cleanup
    stepsState.removeStep(stepId);

    // Manual DOM manipulation for immediate save bar trigger
    setTimeout(() => {
      const stepsInput = document.querySelector('input[name="stepsData"]') as HTMLInputElement;
      if (stepsInput) {
        stepsInput.value = JSON.stringify(stepsState.steps.filter(s => s.id !== stepId));
        const event = new Event('input', { bubbles: true });
        stepsInput.dispatchEvent(event);
      }
    }, 0);
  }, [stepsState]);

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

    const dragIndex = stepsState.steps.findIndex(step => step.id === draggedStep);

    if (dragIndex !== -1 && dragIndex !== dropIndex) {
      stepsState.setSteps(prev => {
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
  }, [draggedStep, stepsState.steps, stepsState.setSteps, shopify]);

  // NOTE: addStep is now provided by stepsState hook

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
        formState.triggerSaveBar();

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
        formState.triggerSaveBar();
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
  }, [shopify, formState.triggerSaveBar, selectedCollections]);

  // NOTE: Discount rule management (addDiscountRule, removeDiscountRule, updateDiscountRule)
  // is now provided by pricingState hook

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
    formState.triggerSaveBar();
  }, [formState.triggerSaveBar]);

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

      // Use app API key and block handle from loader data (passed from server)
      // CRITICAL: Must use app's API key (client_id), not extension UUID
      if (!apiKey || !blockHandle) {
        AppLogger.error('🚨 [THEME_EDITOR] Missing app configuration');
        shopify.toast.show("App configuration missing. Please check app setup.", { isError: true });
        return;
      }

      const appBlockId = `${apiKey}/${blockHandle}`;

      AppLogger.debug(`🔧 [THEME_EDITOR] Using app block ID: ${appBlockId}`, {
        apiKey,
        blockHandle,
        bundleId: bundle.id
      });

      // Generate deep link following Shopify's official documentation with bundle ID
      // Official format: template + addAppBlockId + target + bundleId (for auto-population)
      // See: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/deep-links
      //
      // Adding bundleId parameter allows the widget's Liquid code to auto-detect and populate
      // the bundle_id setting in the theme editor, making setup seamless for merchants
      const themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=${template.handle}&addAppBlockId=${appBlockId}&target=newAppsSection&bundleId=${bundle.id}`;

      AppLogger.debug(`🔗 [THEME_EDITOR] Generated deep link with bundleId:`, {
        template: template.handle,
        bundleId: bundle.id,
        url: themeEditorUrl
      });

      setSelectedPage(template);
      setIsPageSelectionModalOpen(false);

      // Use App Bridge redirect (not window.open) to avoid popup blockers
      // This navigates the entire app frame to the theme editor
      shopify.toast.show(`Opening theme editor for "${template.title}". You'll be able to add the bundle widget to your theme.`, { isError: false, duration: 5000 });
      AppLogger.debug(`✅ [THEME_EDITOR] Navigating to theme editor via App Bridge`);

      // Use App Bridge redirect - this avoids popup blockers
      window.open(themeEditorUrl, '_top');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      AppLogger.error('🚨 [THEME_EDITOR] Error in handlePageSelection:', { errorMessage }, error as any);
      shopify.toast.show(`Failed to open theme editor: ${errorMessage}`, { isError: true });
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
    { label: "Unlisted", value: "archived" },
  ];


  return (
    <Page
      title={`Configure: ${formState.bundleName}`}
      subtitle="Set up your cart transform bundle configuration"
      backAction={{
        content: "Cart Transform Bundles",
        onAction: handleBackClick,
      }}
      primaryAction={{
        content: "Preview Bundle",
        onAction: handlePreviewBundle,
        icon: ViewIcon,
        disabled: !bundleProduct || stepsState.steps.length === 0,
      }}
    >
      {/* Modern App Bridge contextual save bar using form with data-save-bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        onReset={(e) => {
          e.preventDefault();
          handleDiscard();
        }}
      >
        {/* SaveBar component - controlled declaratively via hasUnsavedChanges state */}
        {hasUnsavedChanges && (
          <SaveBar id="bundle-save-bar">
            <button
              variant="primary"
              onClick={handleSave}
              loading={fetcher.state !== "idle" ? "" : undefined}
              disabled={fetcher.state !== "idle"}
            >
              Save
            </button>
            <button
              onClick={handleDiscard}
              disabled={fetcher.state !== "idle"}
            >
              Discard
            </button>
          </SaveBar>
        )}
        {/* Hidden inputs for form submission - values will be updated by React state changes */}
        <input type="hidden" name="bundleName" value={formState.bundleName} />
        <input type="hidden" name="bundleDescription" value={formState.bundleDescription} />
        <input type="hidden" name="templateName" value={formState.templateName} />
        <input type="hidden" name="bundleStatus" value={formState.bundleStatus} />
        <input type="hidden" name="bundleProduct" value={JSON.stringify(bundleProduct)} />
        <input type="hidden" name="stepsData" value={JSON.stringify(stepsState.steps)} />
        <input type="hidden" name="discountData" value={JSON.stringify({
          discountEnabled: pricingState.discountEnabled,
          discountType: pricingState.discountType,
          discountRules: pricingState.discountRules,
          showFooter: pricingState.showFooter,
          showProgressBar: pricingState.showProgressBar,
          discountMessagingEnabled: pricingState.discountMessagingEnabled,
          ruleMessages
        })} />
        <input type="hidden" name="stepConditions" value={JSON.stringify(conditionsState.stepConditions)} />



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
                    <BlockStack gap="300">
                      <InlineStack gap="300" blockAlign="center">
                        <Thumbnail
                          source={productImageUrl || "/bundle.png"}
                          alt={productTitle || "Bundle Product"}
                          size="medium"
                        />
                        <BlockStack gap="200">
                          {isEditingProductDetails ? (
                            <>
                              <TextField
                                label="Product Title"
                                value={productTitle}
                                onChange={setProductTitle}
                                autoComplete="off"
                                labelHidden
                              />
                              <InlineStack gap="200">
                                <Button
                                  size="slim"
                                  onClick={handleSaveProductDetails}
                                  variant="primary"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="slim"
                                  onClick={() => {
                                    setIsEditingProductDetails(false);
                                    setProductTitle(bundleProduct.title || "");
                                    setProductImageUrl(bundleProduct.featuredImage?.url || bundleProduct.images?.[0]?.originalSrc || "");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </InlineStack>
                            </>
                          ) : (
                            <>
                              <InlineStack gap="200" blockAlign="center">
                                <Button
                                  variant="plain"
                                  url={`https://admin.shopify.com/store/${shop?.replace('.myshopify.com', '')}/products/${bundleProduct.legacyResourceId || bundleProduct.id?.split('/').pop()}`}
                                  external
                                  icon={ExternalIcon}
                                >
                                  {productTitle || bundleProduct.title || "Untitled Product"}
                                </Button>
                              </InlineStack>
                              <InlineStack gap="200">
                                <Button
                                  size="slim"
                                  onClick={() => setIsEditingProductDetails(true)}
                                  icon={EditIcon}
                                >
                                  Edit Details
                                </Button>
                                <Button
                                  size="slim"
                                  onClick={handleProductImageUpload}
                                  icon={ImageIcon}
                                >
                                  Change Image
                                </Button>
                                <Button
                                  variant="tertiary"
                                  size="slim"
                                  icon={RefreshIcon}
                                  onClick={handleBundleProductSelect}
                                  accessibilityLabel="Change bundle product"
                                />
                              </InlineStack>
                            </>
                          )}
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>
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
                      value={formState.bundleStatus}
                      onChange={(selected: string) => formState.setBundleStatus(selected as 'active' | 'draft' | 'archived')}
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

                  {/* Installation Guide Banner */}
                  <Banner tone="info">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">
                        <strong>New to installing bundles?</strong> Check out our comprehensive installation guide
                        with step-by-step instructions, screenshots, and troubleshooting tips.
                      </Text>
                      <InlineStack gap="200">
                        <Button
                          onClick={() => navigate('/app/installation-guide')}
                          icon={ExternalIcon}
                        >
                          View Installation Guide
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Banner>

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
                      value={formState.templateName}
                      onChange={formState.setTemplateName}
                      placeholder="e.g., cart-transform, product, bundle-special"
                      helpText="Enter the template name for bundle container products. Leave empty to use the default product template."
                      labelHidden
                      autoComplete="off"
                    />
                  </BlockStack>

                  {/* Quick Setup Action */}
                  <BlockStack gap="300">
                    <Divider />

                    <InlineStack align="space-between" blockAlign="center" gap="400">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          Install Widget in Theme
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Opens theme editor with bundle widget pre-selected. Simply drag & drop to position.
                        </Text>
                      </BlockStack>
                      <Button
                        variant="primary"
                        icon={SettingsIcon}
                        onClick={handlePlaceWidget}
                        size="large"
                      >
                        Place Widget
                      </Button>
                    </InlineStack>
                  </BlockStack>

                  {/* Pro Tip */}
                  <Banner tone="success">
                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={RefreshIcon} />
                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                          💡 Pro Tip: Custom Templates
                        </Text>
                      </InlineStack>
                      <Text as="p" variant="bodySm">
                        Create a custom product template named "cart-transform" specifically for bundle products.
                        This gives you better control and keeps bundle products separate from regular products.
                      </Text>
                    </BlockStack>
                  </Banner>
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
                    {stepsState.steps.map((step, index) => (
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
                                  icon={stepsState.expandedSteps.has(step.id) ? ChevronUpIcon : ChevronDownIcon}
                                  onClick={() => stepsState.toggleStepExpansion(step.id)}
                                  accessibilityLabel={stepsState.expandedSteps.has(step.id) ? "Collapse step" : "Expand step"}
                                />
                              </InlineStack>
                            </InlineStack>

                            {/* Expanded Step Content */}
                            <Collapsible id={`step-${step.id}`} open={stepsState.expandedSteps.has(step.id)}>
                              <BlockStack gap="400">
                                {/* Step Name and Page Title */}
                                <FormLayout>
                                  <TextField
                                    label="Step Name"
                                    value={step.name}
                                    onChange={(value) => stepsState.updateStepField(step.id, 'name', value)}
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
                                        badge: step.StepProduct && step.StepProduct.length > 0 ? stepsState.getUniqueProductCount(step.StepProduct).toString() : undefined,
                                      },
                                      {
                                        id: 'collections',
                                        content: 'Collections',
                                      },
                                    ]}
                                    selected={stepsState.selectedTab}
                                    onSelect={stepsState.setSelectedTab}
                                  />

                                  {stepsState.selectedTab === 0 && (
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
                                        {step.StepProduct && step.StepProduct.length > 0 && (
                                          <Badge tone="info">
                                            {`${stepsState.getUniqueProductCount(step.StepProduct)} Selected`}
                                          </Badge>
                                        )}
                                      </InlineStack>
                                      <Checkbox
                                        label="Display variants as individual products"
                                        checked={step.displayVariantsAsIndividual || false}
                                        onChange={(checked) => stepsState.updateStepField(step.id, 'displayVariantsAsIndividual', checked)}
                                      />
                                    </BlockStack>
                                  )}

                                  {stepsState.selectedTab === 1 && (
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
                                  {(conditionsState.stepConditions[step.id] || []).map((rule: any, ruleIndex: any) => (
                                    <Card key={rule.id} background="bg-surface-secondary">
                                      <BlockStack gap="200">
                                        <InlineStack align="space-between" blockAlign="center">
                                          <Text as="h5" variant="bodyMd" fontWeight="medium">
                                            Condition #{ruleIndex + 1}
                                          </Text>
                                          <Button
                                            variant="plain"
                                            tone="critical"
                                            onClick={() => conditionsState.removeConditionRule(step.id, rule.id)}
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
                                            onChange={(value) => conditionsState.updateConditionRule(step.id, rule.id, 'type', value)}
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
                                            onChange={(value) => conditionsState.updateConditionRule(step.id, rule.id, 'operator', value)}
                                          />
                                          <TextField
                                            label="Value"
                                            value={rule.value}
                                            onChange={(value) => conditionsState.updateConditionRule(step.id, rule.id, 'value', value)}
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
                                    onClick={() => conditionsState.addConditionRule(step.id)}
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
                      onClick={stepsState.addStep}
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
                      checked={pricingState.discountEnabled}
                      onChange={pricingState.setDiscountEnabled}
                    />
                  </FormLayout>

                  {pricingState.discountEnabled && (
                    <BlockStack gap="400">
                      {/* Discount Type */}
                      <Select
                        label="Discount Type"
                        options={[
                          { label: 'Percentage Off', value: DiscountMethod.PERCENTAGE_OFF },
                          { label: 'Fixed Amount Off', value: DiscountMethod.FIXED_AMOUNT_OFF },
                          { label: 'Fixed Bundle Price', value: DiscountMethod.FIXED_BUNDLE_PRICE },
                        ]}
                        value={pricingState.discountType}
                        onChange={(value) => {
                          pricingState.setDiscountType(value as DiscountMethod);
                          // Clear existing rules when discount type changes
                          pricingState.setDiscountRules([]);
                          // Clear rule messages when discount type changes
                          setRuleMessages({});
                        }}
                      />

                      {/* Discount Rules - New Standardized Structure */}
                      <BlockStack gap="300">
                        {pricingState.discountRules.map((rule, index) => (
                          <Card key={rule.id} background="bg-surface-secondary">
                            <BlockStack gap="300">
                              <InlineStack align="space-between" blockAlign="center">
                                <Text as="h4" variant="bodyMd" fontWeight="medium">
                                  Rule #{index + 1}
                                </Text>
                                <Button
                                  variant="plain"
                                  tone="critical"
                                  onClick={() => pricingState.removeDiscountRule(rule.id)}
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
                                    onChange={(value) => pricingState.updateDiscountRule(rule.id, {
                                      condition: { ...rule.condition, type: value as any }
                                    })}
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
                                    onChange={(value) => pricingState.updateDiscountRule(rule.id, {
                                      condition: { ...rule.condition, operator: value as any }
                                    })}
                                  />
                                  <TextField
                                    label={rule.condition.type === ConditionType.AMOUNT ? "Amount" : "Quantity"}
                                    value={String(rule.condition.type === ConditionType.AMOUNT ? centsToAmount(rule.condition.value) : rule.condition.value)}
                                    onChange={(value) => {
                                      const numValue = Number(value) || 0;
                                      const finalValue = rule.condition.type === ConditionType.AMOUNT ? amountToCents(numValue) : numValue;
                                      pricingState.updateDiscountRule(rule.id, {
                                        condition: { ...rule.condition, value: finalValue }
                                      });
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
                                    pricingState.updateDiscountRule(rule.id, {
                                      discount: { ...rule.discount, value: finalValue }
                                    });
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

                        {pricingState.discountRules.length < 4 && (
                          <Button
                            variant="tertiary"
                            fullWidth
                            icon={PlusIcon}
                            onClick={pricingState.addDiscountRule}
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
                            checked={pricingState.discountMessagingEnabled}
                            onChange={pricingState.setDiscountMessagingEnabled}
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
                              <strong>Essential (Most Used):</strong><br />
                              <code>{'{{conditionText}}'}</code> - "₹100" or "2 items"<br />
                              <code>{'{{discountText}}'}</code> - "₹50 off" or "20% off"<br />
                              <code>{'{{bundleName}}'}</code> - Bundle name
                            </div>

                            {/* Specific Variables */}
                            <div style={{ marginBottom: '12px' }}>
                              <strong>Specific:</strong><br />
                              <code>{'{{amountNeeded}}'}</code> - Amount needed (for spend-based)<br />
                              <code>{'{{itemsNeeded}}'}</code> - Items needed (for quantity-based)<br />
                              <code>{'{{progressPercentage}}'}</code> - Progress % (0-100)
                            </div>

                            {/* Pricing Variables */}
                            <div style={{ marginBottom: '12px' }}>
                              <strong>Pricing:</strong><br />
                              <code>{'{{currentAmount}}'}</code> - Current total<br />
                              <code>{'{{finalPrice}}'}</code> - Price after discount<br />
                              <code>{'{{savingsAmount}}'}</code> - Amount saved
                            </div>

                            {/* Quick Examples */}
                            <div style={{ borderTop: '1px solid #e1e3e5', paddingTop: '8px', fontSize: '12px', color: '#6c757d' }}>
                              <strong>Quick Examples:</strong><br />
                              💰 <em>"Add {'{{conditionText}}'} to get {'{{discountText}}'}"</em><br />
                              📊 <em>"{'{{progressPercentage}}'} % complete - {'{{conditionText}}'} more needed"</em><br />
                              🎉 <em>"You saved {'{{savingsAmount}}'} on {'{{bundleName}}'}"</em>
                            </div>
                          </div>
                        </details>

                        {/* Dynamic rule-based messaging */}
                        {pricingState.discountMessagingEnabled && (Array.isArray(pricingState.discountRules) ? pricingState.discountRules : []).length > 0 && (
                          <BlockStack gap="300">
                            {(Array.isArray(pricingState.discountRules) ? pricingState.discountRules : []).map((rule: any, index: number) => (
                              <BlockStack key={rule.id} gap="300">
                                <Card background="bg-surface-secondary">
                                  <BlockStack gap="200">
                                    <Text as="h4" variant="bodyMd" fontWeight="medium">
                                      Rule #{index + 1} Messages
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
                        {pricingState.discountMessagingEnabled && pricingState.discountRules.length === 0 && (
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
        title="Place Widget"
        primaryAction={{
          content: "Cancel",
          onAction: () => setIsPageSelectionModalOpen(false),
        }}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" variant="bodySm" tone="subdued">
              Select a template to open the theme editor with widget placement.
            </Text>

            {isLoadingPages ? (
              <BlockStack gap="300" inlineAlign="center">
                <Spinner size="small" />
                <Text as="p" variant="bodySm" tone="subdued">Loading templates...</Text>
              </BlockStack>
            ) : availablePages.length > 0 ? (
              <BlockStack gap="200">
                {availablePages.map((template) => (
                  <Card key={template.id} padding="300">
                    <InlineStack wrap={false} gap="300" align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="span" variant="bodyMd" fontWeight="medium">
                            {template.title}
                          </Text>
                          {template.recommended && (
                            <Badge tone="success">Bundle Product</Badge>
                          )}
                        </InlineStack>
                        {template.description && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            {template.description}
                          </Text>
                        )}
                      </BlockStack>
                      <Button
                        onClick={() => handlePageSelection(template)}
                        variant={template.recommended ? "primary" : "secondary"}
                        icon={ExternalIcon}
                        size="slim"
                      >
                        Select
                      </Button>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            ) : (
              <Card padding="400">
                <BlockStack gap="300" inlineAlign="center">
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    No templates available
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
              const currentStep = stepsState.steps.find(step => step.id === currentModalStepId);
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