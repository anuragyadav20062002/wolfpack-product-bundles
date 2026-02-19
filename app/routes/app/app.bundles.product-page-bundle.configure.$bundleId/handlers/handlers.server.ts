/**
 * Action Handlers for Product Page Bundle Configuration
 *
 * Extracted from the main route file for better organization.
 * Each handler processes a specific action intent from the route's action function.
 */

import { json } from "@remix-run/node";
import { AppLogger } from "../../../../lib/logger";
import db from "../../../../db.server";
import { ThemeTemplateService } from "../../../../services/theme-template.server";
import { WidgetInstallationService } from "../../../../services/widget-installation.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../../services/bundles/metafield-sync.server";
import {
  calculateBundlePrice,
  updateBundleProductPrice,
} from "../../../../services/bundles/pricing-calculation.server";
import {
  convertBundleToStandardMetafields,
  updateProductStandardMetafields,
} from "../../../../services/bundles/standard-metafields.server";
import { getBundleProductVariantId } from "../../../../utils/variant-lookup.server";
import { mapDiscountMethod } from "../../../../utils/discount-mappers";

/**
 * Validate and normalise a Shopify product ID to the GID format.
 * Throws with a clear message for UUIDs (corrupted browser state) or unrecognised formats.
 * Called once at the boundary — callers can use the returned value directly.
 */
function normaliseShopifyProductId(raw: string, context: { title: string; stepName: string }): string {
  if (!raw || typeof raw !== "string") {
    throw new Error(`Invalid product ID: must be a non-empty string. Got: ${typeof raw}`);
  }
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (UUID_RE.test(raw)) {
    throw new Error(
      `Invalid product ID detected: UUID "${raw}" for product "${context.title}" in step "${context.stepName}". ` +
      `This indicates corrupted browser state. Please refresh the page and re-select the product using the product picker.`
    );
  }
  if (raw.startsWith("gid://shopify/Product/")) {
    const numericId = raw.replace("gid://shopify/Product/", "");
    if (!/^\d+$/.test(numericId)) {
      throw new Error(
        `Invalid product ID format: "${raw}" for product "${context.title}". ` +
        `Shopify product IDs must be numeric. Expected format: gid://shopify/Product/123456`
      );
    }
    return raw;
  }
  if (/^\d+$/.test(raw)) {
    return `gid://shopify/Product/${raw}`;
  }
  throw new Error(
    `Invalid product ID format: "${raw}" for product "${context.title}". ` +
    `Expected Shopify GID (gid://shopify/Product/123456) or numeric ID (123456).`
  );
}

// Utility function for safe JSON parsing
export const safeJsonParse = (value: any, defaultValue: any = []) => {
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

/**
 * Handle saving bundle configuration
 */
export async function handleSaveBundle(admin: any, session: any, bundleId: string, formData: FormData) {
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

    AppLogger.debug("Parsed form data:", {
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

    // DEBUG: Log all product IDs being submitted
    AppLogger.debug("[DEBUG] Steps data received from form:");
    stepsData.forEach((step: any, idx: number) => {
      AppLogger.debug(`  Step ${idx + 1}: "${step.name}" (step.id: ${step.id})`);
      if (step.StepProduct && Array.isArray(step.StepProduct)) {
        step.StepProduct.forEach((product: any, pidx: number) => {
          AppLogger.debug(`    Product ${pidx + 1}: "${product.title}" → product.id: ${product.id}`);
        });
      }
    });

    // VALIDATION + NORMALISATION: Validate and normalise all product IDs in one pass at the boundary.
    // normaliseShopifyProductId rejects UUIDs (corrupted browser state) and converts numeric IDs to GIDs.
    // IDs are mutated in place so the Prisma .map() below can use product.id directly.
    for (const step of stepsData) {
      if (!step.StepProduct || !Array.isArray(step.StepProduct)) continue;
      for (const product of step.StepProduct) {
        product.id = normaliseShopifyProductId(product.id, {
          title: product.title || product.name || "unknown",
          stepName: step.name,
        });
      }
    }

    AppLogger.debug("[VALIDATION] All product IDs are valid Shopify GIDs");

    // FIXED_BUNDLE_PRICE: Store the fixed price directly (NO conversion)
    // The cart transform will calculate the percentage dynamically based on actual cart total
    if (discountData.discountEnabled && discountData.discountType === 'fixed_bundle_price') {
      AppLogger.debug("[FIXED_BUNDLE_PRICE] Storing fixed bundle price (will be converted at runtime)");

      // For fixed_bundle_price, keep the original price value in a special field
      // The cart transform will read this and calculate discount based on actual cart total
      const processedRules = (discountData.discountRules || []).map((rule: any) => {
        const fixedPrice = parseFloat(rule.price || 0);
        AppLogger.debug(`[FIXED_BUNDLE_PRICE] Rule fixed price: ${fixedPrice}`);

        // Store the fixed price in a dedicated field for runtime calculation
        return {
          ...rule,
          fixedBundlePrice: fixedPrice,  // The target bundle price
          // Don't set discountValue here - it will be calculated at runtime
        };
      });

      discountData.discountRules = processedRules;
      AppLogger.debug("[FIXED_BUNDLE_PRICE] Stored fixed price for runtime calculation:", processedRules);
    }

    // Automatically set status to 'active' if bundle has configured steps
    let finalStatus = bundleStatus as any;
    if (bundleStatus === 'draft' && stepsData && stepsData.length > 0) {
      const hasConfiguredSteps = stepsData.some((step: any) =>
        (step.StepProduct && step.StepProduct.length > 0) ||
        (step.collections && step.collections.length > 0)
      );
      AppLogger.debug("[BUNDLE_CONFIG] Status evaluation:", {
        originalStatus: bundleStatus,
        hasConfiguredSteps,
        stepsCount: stepsData.length
      });
      if (hasConfiguredSteps) {
        finalStatus = 'active';
        AppLogger.debug("[BUNDLE_CONFIG] Auto-activating bundle with configured steps");
      }
    }

    // Get existing bundle to preserve shopifyProductId if not provided
    const existingBundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      select: { shopifyProductId: true }
    });

    // Update bundle in database
    AppLogger.debug("[BUNDLE_CONFIG] Updating bundle in database");
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
                    // IDs already validated and normalised at the boundary above
                    return {
                      productId: product.id,
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
        AppLogger.debug(`[PRODUCT_SYNC] Syncing status '${shopifyStatus}' to product ${updatedBundle.shopifyProductId}`);

        const UPDATE_PRODUCT_STATUS = `
          mutation UpdateProductStatus($id: ID!, $status: ProductStatus!) {
            productUpdate(input: {id: $id, status: $status}) {
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

        const response = await admin.graphql(UPDATE_PRODUCT_STATUS, {
          variables: {
            id: updatedBundle.shopifyProductId,
            status: shopifyStatus
          }
        });

        const responseData = await response.json();

        // Layer 1: Transport errors
        if (responseData.errors?.length) {
          AppLogger.error("[PRODUCT_SYNC] GraphQL transport error updating product status:", {
            component: "app.bundles.product-page.configure",
            operation: "sync-product-status",
            productId: updatedBundle.shopifyProductId,
          }, responseData.errors);
        }

        // Layer 2: Mutation user errors
        if (responseData.data?.productUpdate?.userErrors?.length > 0) {
          const errors = responseData.data.productUpdate.userErrors;
          AppLogger.error("[PRODUCT_SYNC] Shopify returned errors while updating product status:", {
            component: "app.bundles.product-page.configure",
            operation: "sync-product-status",
            productId: updatedBundle.shopifyProductId,
            targetStatus: shopifyStatus
          }, { errors });
        } else {
          const actualStatus = responseData.data?.productUpdate?.product?.status;
          AppLogger.info("[PRODUCT_SYNC] Successfully synced product status to Shopify", {
            component: "app.bundles.product-page.configure",
            productId: updatedBundle.shopifyProductId,
            requestedStatus: shopifyStatus,
            actualStatus: actualStatus
          });
        }
      } catch (error) {
        AppLogger.error("[PRODUCT_SYNC] Failed to sync product status (exception):", {
          component: "app.bundles.product-page.configure",
          operation: "sync-product-status",
          productId: updatedBundle.shopifyProductId,
          targetStatus: finalStatus.toUpperCase()
        }, error as any);
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
      AppLogger.debug(`[BUNDLE_CONFIG] Bundle parent variant ID: ${bundleParentVariantId}`);

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
          messages: (() => {
            // Build messages from ruleMessages (per-rule messaging from admin form)
            const firstRuleId = discountData.discountRules?.[0]?.id;
            const firstRuleMsg = firstRuleId && discountData.ruleMessages?.[firstRuleId];
            return {
              progress: firstRuleMsg?.discountText || 'Add {conditionText} to get {discountText}',
              qualified: firstRuleMsg?.successMessage || 'Congratulations! You got {discountText}',
              showDiscountMessaging: discountData.discountMessagingEnabled || false,
              showProgressBar: discountData.showProgressBar || false,
              showInCart: true
            };
          })()
        },
        // CRITICAL: Include bundle parent variant ID for cart transform merge operations
        bundleParentVariantId: bundleParentVariantId,
        shopifyProductId: updatedBundle.shopifyProductId, // Bundle product ID for querying metafield
        updatedAt: new Date().toISOString()
      };

      const configSize = JSON.stringify(baseConfiguration).length;
      AppLogger.debug("[METAFIELD] Optimized configuration size:", {}, `${configSize} chars`);

      // VALIDATION: Check bundle has steps and products BEFORE attempting metafield updates
      // This validation must fail the save operation if not met
      const fullBundleConfig = {
        ...baseConfiguration,
        steps: updatedBundle.steps  // Use database steps with StepProduct array
      };

      if (!fullBundleConfig.steps || fullBundleConfig.steps.length === 0) {
        AppLogger.error("[VALIDATION] Cannot save bundle: No steps defined");
        throw new Error("Please add at least one step to your bundle before saving");
      }

      // Validate at least one step has products
      const hasProducts = fullBundleConfig.steps.some((step: any) =>
        (step.StepProduct && step.StepProduct.length > 0) ||
        (step.products && step.products.length > 0)
      );

      if (!hasProducts) {
        AppLogger.error("[VALIDATION] Cannot save bundle: No products found in any step");
        throw new Error("Please add products to at least one step before saving");
      }

      // Ensure shopifyProductId exists for metafield updates
      if (!updatedBundle.shopifyProductId) {
        AppLogger.error("[VALIDATION] Cannot update metafields: No Shopify product ID");
        throw new Error("Bundle must have a Shopify product ID to update metafields");
      }

      // Extract shopifyProductId to a const for TypeScript type narrowing
      const shopifyProductId = updatedBundle.shopifyProductId;

      // Parallelize independent metafield updates for better performance
      AppLogger.debug("[METAFIELDS] Updating all metafields in parallel");
      const [standardResult, componentResult, variantResult] = await Promise.allSettled([
        // STANDARD METAFIELDS: For Shopify cart transform compatibility (non-critical)
        (async () => {
          AppLogger.debug("[STANDARD_METAFIELD] Updating standard Shopify metafields for bundle product");
          const { metafields: standardMetafields, errors: conversionErrors } = await convertBundleToStandardMetafields(admin, baseConfiguration);
          if (conversionErrors.length > 0) {
            AppLogger.warn("[STANDARD_METAFIELD] Some products could not be processed:", conversionErrors);
          }
          if (Object.keys(standardMetafields).length > 0) {
            await updateProductStandardMetafields(admin, shopifyProductId, standardMetafields);
            AppLogger.debug("[STANDARD_METAFIELD] Standard metafields updated successfully");
          } else {
            AppLogger.debug("[STANDARD_METAFIELD] No standard metafields to update");
          }
        })(),
        // COMPONENT METAFIELDS: CRITICAL for cart transform MERGE operation
        updateComponentProductMetafields(admin, shopifyProductId, fullBundleConfig),
        // BUNDLE VARIANT METAFIELDS: CRITICAL — without this, the widget cannot load on the storefront
        updateBundleProductMetafields(admin, shopifyProductId, fullBundleConfig),
      ]);

      // Standard metafields: non-critical, warn only
      if (standardResult.status === "rejected") {
        AppLogger.warn("[STANDARD_METAFIELD] Standard metafields update failed (non-critical):", {
          component: "handlers.server",
          shopifyProductId,
        }, standardResult.reason);
      }
      // Component metafields: CRITICAL for cart transform — propagate failure
      if (componentResult.status === "rejected") {
        throw new Error(`Failed to update component metafields (cart transform will break): ${componentResult.reason}`);
      }
      // Bundle variant metafields: CRITICAL for widget load — propagate failure
      if (variantResult.status === "rejected") {
        throw new Error(`Failed to update bundle variant metafields (widget will not load): ${variantResult.reason}`);
      }

      AppLogger.debug("[METAFIELDS] All metafields updated successfully");
    }

    return json({
      success: true,
      bundle: updatedBundle,
      message: "Bundle configuration saved successfully"
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save bundle configuration";
    AppLogger.error("[BUNDLE_CONFIG] Error saving bundle:", { component: "handlers.server", bundleId }, error);
    return json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * Handle updating bundle status
 */
export async function handleUpdateBundleStatus(admin: any, session: any, bundleId: string, formData: FormData) {
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
      AppLogger.debug(`[PRODUCT_SYNC] Syncing status '${shopifyStatus}' to product ${updatedBundle.shopifyProductId}`);

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

      const statusResponse = await admin.graphql(UPDATE_PRODUCT_STATUS, {
        variables: {
          input: {
            id: updatedBundle.shopifyProductId,
            status: shopifyStatus
          }
        }
      });
      const statusData = await statusResponse.json();
      if (statusData.errors?.length) {
        AppLogger.error("[PRODUCT_SYNC] GraphQL transport error updating product status:", {
          component: "handlers.server",
          productId: updatedBundle.shopifyProductId,
        }, statusData.errors);
      }
      const statusUserErrors = statusData.data?.productUpdate?.userErrors ?? [];
      if (statusUserErrors.length > 0) {
        AppLogger.warn("[PRODUCT_SYNC] Shopify rejected status update:", {
          component: "handlers.server",
          productId: updatedBundle.shopifyProductId,
        }, statusUserErrors);
      }
    } catch (error) {
      AppLogger.error("[PRODUCT_SYNC] Failed to sync product status:", {}, error as any);
    }
  }

  return json({
    success: true,
    bundle: updatedBundle,
    message: `Bundle status updated to ${status}`
  });
}

/**
 * Handle syncing bundle product
 */
export async function handleSyncProduct(admin: any, session: any, bundleId: string, _formData: FormData) {
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
          bundleType: bundle.bundleType || 'product_page',
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
      const message = error instanceof Error ? error.message : "Unknown sync error";
      AppLogger.error("Sync error:", { component: "handlers.server", bundleId }, error);
      return json({
        success: false,
        error: `Failed to sync product: ${message}`
      }, { status: 500 });
    }
  }

  // Create product if it doesn't exist
  if (!productId) {
    // Calculate proper bundle price based on component products
    AppLogger.debug("[BUNDLE_PRICING] Calculating bundle price for product creation");
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
      AppLogger.debug("[BUNDLE_PRICING] Updating existing bundle product price");
      const bundlePrice = await calculateBundlePrice(admin, bundle);
      await updateBundleProductPrice(admin, productId, bundlePrice);
    } catch (error) {
      AppLogger.error("[BUNDLE_PRICING] Error updating bundle product price:", {}, error as any);
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
      bundleType: bundle.bundleType || 'product_page',
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
    AppLogger.debug("[METAFIELD] Sync optimized configuration size:", {}, `${configSize} chars`);

    await updateBundleProductMetafields(admin, productId, bundleConfiguration);
  }

  return json({
    success: true,
    productId,
    message: "Bundle product synchronized successfully"
  });
}

/**
 * Handle updating bundle product details (title and image)
 */
export async function handleUpdateBundleProduct(admin: any, session: any, bundleId: string, formData: FormData) {
  try {
    const productId = formData.get("productId") as string;
    const productTitle = formData.get("productTitle") as string;
    const productImageUrl = formData.get("productImageUrl") as string;

    if (!productId) {
      return json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    AppLogger.debug("[PRODUCT_UPDATE] Updating product details", {
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
        AppLogger.error("[PRODUCT_UPDATE] Image update failed:", {}, error);
        // Don't fail the entire operation for image update errors
      } else {
        AppLogger.debug("[PRODUCT_UPDATE] Image added successfully");
      }
    }

    AppLogger.info("[PRODUCT_UPDATE] Product details updated successfully");

    return json({
      success: true,
      message: "Product details updated successfully"
    });

  } catch (error) {
    AppLogger.error("[PRODUCT_UPDATE] Error updating product:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Failed to update product"
    }, { status: 500 });
  }
}

/**
 * Handle getting available pages for widget placement
 */
export async function handleGetPages(admin: any, _session: any) {
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

/**
 * Handle getting theme templates
 */
export async function handleGetThemeTemplates(admin: any, session: any) {
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

      AppLogger.debug(`[TEMPLATE_FILTER] Found ${activeBundles.length} active bundles with container products`);

      // Get bundle container products from Shopify
      if (activeBundles.length > 0) {
        const productIds = activeBundles
          .filter(bundle => bundle.shopifyProductId)
          .map(bundle => bundle.shopifyProductId);

        if (productIds.length > 0) {
          AppLogger.debug(`[TEMPLATE_FILTER] Product IDs to query:`, productIds);
          AppLogger.debug(`[TEMPLATE_FILTER] Fetching products with IDs: ${productIds.join(', ')}`);

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

          AppLogger.debug(`[TEMPLATE_FILTER] Fetched ${bundleContainerProducts.length} bundle container products from Shopify`);
        }
      }
    } catch (error) {
      AppLogger.warn("[TEMPLATE_FILTER] Could not fetch bundle container products:", {}, error as any);
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

    AppLogger.debug(`[TEMPLATE_FILTER] Filtered to ${templates.length} product templates`);

    // PRIORITIZE: Bundle container product specific templates with auto-creation
    const bundleSpecificTemplates: any[] = [];
    if (bundleContainerProducts.length > 0) {
      AppLogger.debug(`[TEMPLATE_FILTER] Creating ${bundleContainerProducts.length} bundle-specific template recommendations`);

      const templateService = new ThemeTemplateService(admin, session);

      for (const product of bundleContainerProducts) {
        // Check if template exists, create if it doesn't
        const templateResult = await templateService.ensureProductTemplate(product.handle);

        bundleSpecificTemplates.push({
          id: `product.${product.handle}`,
          title: `${product.title} (Bundle Container)`,
          handle: `product.${product.handle}`,
          description: templateResult.created
            ? `NEW TEMPLATE CREATED for ${product.title} - Widget automatically configured!`
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

        AppLogger.debug(`[TEMPLATE_FILTER] Product ${product.handle}: Template ${templateResult.success ? 'ready' : 'failed'} ${templateResult.created ? '(created)' : '(exists)'}`);
      }
    }

    // COMBINE: Bundle-specific templates first, then general product templates
    const allTemplates = [
      ...bundleSpecificTemplates,
      ...templates.filter((t: any) => !bundleSpecificTemplates.some((bt: any) => bt.handle === t.handle))
    ];

    AppLogger.debug(`[TEMPLATE_FILTER] Final template list: ${allTemplates.length} templates (${bundleSpecificTemplates.length} bundle-specific)`);

    // Add general product template as fallback if not already present
    const hasGeneralProductTemplate = allTemplates.some(t => t.handle === 'product');
    if (!hasGeneralProductTemplate) {
      allTemplates.push({
        id: 'product',
        title: 'All Product Pages (General)',
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

/**
 * Handle getting current theme for deep linking
 */
export async function handleGetCurrentTheme(admin: any, _session: any) {
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

/**
 * Handle ensuring bundle templates exist
 */
export async function handleEnsureBundleTemplates(admin: any, session: any) {
  try {
    AppLogger.debug("[TEMPLATE_HANDLER] Ensuring bundle templates exist");

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

    AppLogger.debug(`[TEMPLATE_HANDLER] Found ${activeBundles.length} active bundles`);

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

    AppLogger.debug(`[TEMPLATE_HANDLER] Found ${products.length} bundle container products`);

    // Create templates for each bundle container product
    const results = [];
    for (const product of products) {
      AppLogger.debug(`[TEMPLATE_HANDLER] Processing product: ${product.title} (${product.handle})`);

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

      AppLogger.debug(`[TEMPLATE_HANDLER] Product ${product.handle}: ${result.success ? 'SUCCESS' : 'FAILED'} ${result.created ? '(CREATED)' : '(EXISTS)'}`);
    }

    const successCount = results.filter(r => r.success).length;
    const createdCount = results.filter(r => r.created).length;

    AppLogger.debug(`[TEMPLATE_HANDLER] Template creation completed: ${successCount}/${results.length} successful, ${createdCount} created`);

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
    AppLogger.error("[TEMPLATE_HANDLER] Error during template creation:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Template creation failed"
    }, { status: 500 });
  }
}

/**
 * Handle widget placement validation for product page bundles
 */
export async function handleValidateWidgetPlacement(admin: any, session: any, bundleId: string) {
  try {
    AppLogger.debug("[WIDGET_PLACEMENT] Validating widget placement", { bundleId });

    // Get bundle data
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop }
    });

    if (!bundle) {
      return json({
        success: false,
        error: "Bundle not found"
      }, { status: 404 });
    }

    // Production-ready widget validation (no theme modifications)
    const apiKey = process.env.SHOPIFY_API_KEY || '';
    const result = await WidgetInstallationService.validateProductBundleWidgetSetup(
      admin,
      session.shop,
      apiKey,
      bundleId,
      bundle.shopifyProductId || undefined
    );

    // Return appropriate response based on widget installation status
    if (result.requiresOneTimeSetup) {
      return json({
        success: false,
        requiresOneTimeSetup: true,
        installationLink: result.installationLink,
        message: result.message
      }, { status: 400 });
    }

    return json({
      success: true,
      productUrl: result.productUrl,
      configurationLink: result.configurationLink,
      message: result.message
    });

  } catch (error) {
    AppLogger.error("[WIDGET_PLACEMENT] Error validating widget placement:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Widget placement validation failed"
    }, { status: 500 });
  }
}