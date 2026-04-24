/**
 * Action Handlers for Product Page Bundle Configuration
 *
 * Extracted from the main route file for better organization.
 * Each handler processes a specific action intent from the route's action function.
 */

import { json } from "@remix-run/node";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import type { Session } from "@shopify/shopify-api";
import { AppLogger } from "../../../../lib/logger";
import db from "../../../../db.server";
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
import {
  normaliseShopifyProductId,
  safeJsonParse,
  handleUpdateBundleStatus,
  handleUpdateBundleProduct,
  handleGetPages,
  handleGetThemeTemplates,
  handleGetCurrentTheme,
  handleEnsureBundleTemplates,
} from "../../../../services/bundles/bundle-configure-handlers.server";
import { BundleStatus, BundleType } from "../../../../constants/bundle";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import { syncThemeColors } from "../../../../services/theme-colors.server";

// Re-export shared handlers so the barrel (index.ts) still works
export {
  safeJsonParse,
  handleUpdateBundleStatus,
  handleUpdateBundleProduct,
  handleGetPages,
  handleGetThemeTemplates,
  handleGetCurrentTheme,
  handleEnsureBundleTemplates,
};

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Sync bundle product status to Shopify. Non-fatal — logs errors but does not throw. */
async function syncBundleProductToShopify(
  admin: ShopifyAdmin,
  shopifyProductId: string,
  finalStatus: string,
  bundleId: string,
): Promise<void> {
  const shopifyStatus = finalStatus.toUpperCase();
  AppLogger.debug(`[PRODUCT_SYNC] Syncing status '${shopifyStatus}' to product ${shopifyProductId}`);

  const UPDATE_PRODUCT_STATUS = `
    mutation UpdateProductStatus($id: ID!, $status: ProductStatus!) {
      productUpdate(input: {id: $id, status: $status}) {
        product { id status }
        userErrors { field message }
      }
    }
  `;

  try {
    const response = await admin.graphql(UPDATE_PRODUCT_STATUS, {
      variables: { id: shopifyProductId, status: shopifyStatus }
    });
    const responseData = await response.json() as { data: Record<string, any>; errors?: unknown[] };

    if (responseData.errors?.length) {
      AppLogger.error("[PRODUCT_SYNC] GraphQL transport error updating product status:", {
        component: "app.bundles.product-page.configure", operation: "sync-product-status", productId: shopifyProductId,
      }, responseData.errors);
    } else if (responseData.data?.productUpdate?.userErrors?.length > 0) {
      AppLogger.error("[PRODUCT_SYNC] Shopify returned errors while updating product status:", {
        component: "app.bundles.product-page.configure", operation: "sync-product-status",
        productId: shopifyProductId, targetStatus: shopifyStatus,
      }, { errors: responseData.data.productUpdate.userErrors });
    } else {
      AppLogger.info("[PRODUCT_SYNC] Successfully synced product status to Shopify", {
        component: "app.bundles.product-page.configure", productId: shopifyProductId,
        requestedStatus: shopifyStatus, actualStatus: responseData.data?.productUpdate?.product?.status,
      });
    }
  } catch (error) {
    AppLogger.error("[PRODUCT_SYNC] Failed to sync product status (exception):", {
      component: "app.bundles.product-page.configure", operation: "sync-product-status",
      productId: shopifyProductId, targetStatus: shopifyStatus, bundleId,
    }, error as any);
  }
}

/** Build the base bundle configuration object passed to metafield update functions. */
function buildBundleBaseConfig(
  updatedBundle: { id: string; name: string; description: string | null; status: string; bundleType: string; templateName: string | null; shopifyProductId: string | null },
  stepsData: any[],
  stepConditionsData: Record<string, any[]>,
  discountData: any,
  bundleParentVariantId: string | null,
): Record<string, unknown> {
  const optimizedSteps = (stepsData || []).map((step: any) => ({
    id: step.id,
    name: step.name || 'Step',
    minQuantity: parseInt(step.minQuantity) || 1,
    maxQuantity: parseInt(step.maxQuantity) || 1,
    enabled: step.enabled !== false,
    conditionType: stepConditionsData[step.id]?.[0]?.type || null,
    conditionOperator: stepConditionsData[step.id]?.[0]?.operator || null,
    conditionValue: stepConditionsData[step.id]?.[0]?.value ? parseInt(stepConditionsData[step.id][0].value) || null : null,
    conditionOperator2: stepConditionsData[step.id]?.[1]?.operator || null,
    conditionValue2: stepConditionsData[step.id]?.[1]?.value ? parseInt(stepConditionsData[step.id][1].value) || null : null,
    products: (step.StepProduct || []).map((product: any) => ({
      id: product.id,
      title: product.title || product.name || 'Product',
      imageUrl: product.imageUrl || product.image?.url || null,
    })),
    collections: (step.collections || []).map((collection: any) => ({
      id: collection.id,
      title: collection.title || 'Collection',
    })),
  }));

  const firstRuleId = discountData.discountRules?.[0]?.id;
  const firstRuleMsg = firstRuleId && discountData.ruleMessages?.[firstRuleId];

  return {
    bundleId: updatedBundle.id,
    id: updatedBundle.id,
    name: updatedBundle.name,
    description: updatedBundle.description,
    status: updatedBundle.status,
    bundleType: updatedBundle.bundleType,
    templateName: updatedBundle.templateName,
    steps: optimizedSteps,
    pricing: {
      enabled: discountData.discountEnabled,
      method: discountData.discountType,
      rules: (discountData.discountRules || []).map((rule: any) => ({
        id: rule.id,
        condition: rule.condition || { type: rule.conditionType || 'quantity', operator: rule.operator || 'gte', value: rule.value || 0 },
        discount: rule.discount || { method: discountData.discountType, value: rule.discountValue || rule.value || 0 },
      })),
      display: { showFooter: discountData.showFooter !== false },
      messages: {
        progress: firstRuleMsg?.discountText || 'Add {conditionText} to get {discountText}',
        qualified: firstRuleMsg?.successMessage || 'Congratulations! You got {discountText}',
        showDiscountMessaging: discountData.discountMessagingEnabled || false,
        showInCart: true,
      },
    },
    bundleParentVariantId: bundleParentVariantId,
    shopifyProductId: updatedBundle.shopifyProductId,
    updatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle saving bundle configuration
 */
export async function handleSaveBundle(admin: ShopifyAdmin, session: Session, bundleId: string, formData: FormData) {
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
    const loadingGifRaw = formData.get("loadingGif") as string;
    const loadingGif = loadingGifRaw || null;
    const showProductPrices = formData.get("showProductPrices") !== "false";
    const showCompareAtPrices = formData.get("showCompareAtPrices") === "true";
    const cartRedirectToCheckout = formData.get("cartRedirectToCheckout") === "true";
    const allowQuantityChanges = formData.get("allowQuantityChanges") !== "false";
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
    if (bundleStatus === BundleStatus.DRAFT && stepsData && stepsData.length > 0) {
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
        finalStatus = BundleStatus.ACTIVE;
        AppLogger.debug("[BUNDLE_CONFIG] Auto-activating bundle with configured steps");
      }
    }

    // Get existing bundle to preserve shopifyProductId/Handle if not provided
    const existingBundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      select: { shopifyProductId: true, shopifyProductHandle: true }
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
        // Preserve existing shopifyProductId/Handle if not provided in form
        shopifyProductId: bundleProductData?.id || existingBundle?.shopifyProductId || null,
        shopifyProductHandle: bundleProductData?.handle || existingBundle?.shopifyProductHandle || null,
        templateName: templateName,
        loadingGif: loadingGif,
        showProductPrices,
        showCompareAtPrices,
        cartRedirectToCheckout,
        allowQuantityChanges,
        // Update steps if provided
        ...(stepsData && {
          steps: {
            deleteMany: {},
            create: stepsData.map((step: any, index: number) => {
              // Get conditions for this step from stepConditionsData
              const stepConditions = stepConditionsData[step.id] || [];
              const firstCondition = stepConditions.length > 0 ? stepConditions[0] : null;
              const secondCondition = stepConditions.length > 1 ? stepConditions[1] : null;
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
                // Free gift & default product fields
                isFreeGift: step.isFreeGift === true,
                freeGiftName: step.freeGiftName || null,
                isDefault: step.isDefault === true,
                defaultVariantId: step.defaultVariantId || null,
                // Apply condition data if available
                conditionType: firstCondition?.type || null,
                conditionOperator: firstCondition?.operator || null,
                conditionValue: firstCondition?.value ? parseInt(firstCondition.value) || null : null,
                conditionOperator2: secondCondition?.operator || null,
                conditionValue2: secondCondition?.value ? parseInt(secondCondition.value) || null : null,
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
      // Sync product status to Shopify
      await syncBundleProductToShopify(admin, updatedBundle.shopifyProductId, finalStatus, bundleId);

      // Get the bundle product's first variant ID for cart transform merge operations
      const bundleParentVariantId = await getBundleProductVariantId(admin, updatedBundle.shopifyProductId);
      AppLogger.debug(`[BUNDLE_CONFIG] Bundle parent variant ID: ${bundleParentVariantId}`);

      const baseConfiguration = buildBundleBaseConfig(
        updatedBundle, stepsData, stepConditionsData, discountData, bundleParentVariantId
      );

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

      // Validate at least one step has products (or collections that resolve to products)
      const hasProducts = fullBundleConfig.steps.some((step: any) =>
        (step.StepProduct && step.StepProduct.length > 0) ||
        (step.products && step.products.length > 0) ||
        (Array.isArray(step.collections) && step.collections.length > 0)
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
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_SAVE_CONFIGURATION;
    AppLogger.error("[BUNDLE_CONFIG] Error saving bundle:", { component: "handlers.server", bundleId }, error);
    return json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * Handle syncing bundle product
 */
export async function handleSyncProduct(admin: ShopifyAdmin, session: Session, bundleId: string, _formData: FormData) {
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
    return json({ success: false, error: ERROR_MESSAGES.BUNDLE_NOT_FOUND }, { status: 404 });
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

      const data = await response.json() as { data: Record<string, any>; errors?: Array<{ message: string }> };

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

        const syncMsgs = safeJsonParse(bundle.pricing.messages, {});
        const syncRuleMessages = syncMsgs.ruleMessages || {};
        const syncFirstRuleId = Object.keys(syncRuleMessages)[0];
        const syncFirstRuleMsg = syncFirstRuleId ? syncRuleMessages[syncFirstRuleId] : null;

        const bundleConfiguration = {
          bundleId: bundle.id,
          name: bundle.name,
          templateName: bundle.templateName || null,
          bundleType: bundle.bundleType || BundleType.PRODUCT_PAGE,
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
            })),
            messages: {
              progress: syncFirstRuleMsg?.discountText || 'Add {conditionText} to get {discountText}',
              qualified: syncFirstRuleMsg?.successMessage || 'Congratulations! You got {discountText}',
              showDiscountMessaging: syncMsgs.showDiscountMessaging || false,
            }
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
            variants(first: 1) {
              edges {
                node {
                  id
                }
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

    const response = await admin.graphql(CREATE_PRODUCT, {
      variables: {
        input: {
          title: bundle.name,
          handle: `bundle-${bundle.id}`,
          productType: "Bundle",
          vendor: "Bundle Builder",
          status: "ACTIVE",
          descriptionHtml: bundle.description || `${bundle.name} - Bundle Product`,
          tags: ["WP-Bundles"]
        }
      }
    });

    const data = await response.json();

    if (data.data?.productCreate?.userErrors?.length > 0) {
      const error = data.data.productCreate.userErrors[0];
      throw new Error(`Failed to create bundle product: ${error.message}`);
    }

    productId = data.data?.productCreate?.product?.id;

    // Set price and inventory policy on the auto-created default variant
    // (productVariantUpdate removed in API 2025-10, use productVariantsBulkUpdate)
    const defaultVariantId = data.data?.productCreate?.product?.variants?.edges?.[0]?.node?.id;
    if (defaultVariantId && productId) {
      await admin.graphql(`
        mutation UpdateBundleVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants { id price }
            userErrors { field message }
          }
        }
      `, {
        variables: {
          productId,
          variants: [{
            id: defaultVariantId,
            price: bundlePrice,
            inventoryPolicy: "CONTINUE"
          }]
        }
      });
    }

    // Update bundle with product ID and handle
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyProductId: productId, shopifyProductHandle: `bundle-${bundleId}` }
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

    const syncMsgs = safeJsonParse(bundle.pricing.messages, {});
    const syncRuleMessages = syncMsgs.ruleMessages || {};
    const syncFirstRuleId = Object.keys(syncRuleMessages)[0];
    const syncFirstRuleMsg = syncFirstRuleId ? syncRuleMessages[syncFirstRuleId] : null;

    const bundleConfiguration = {
      bundleId: bundle.id,
      name: bundle.name,
      templateName: bundle.templateName || null,
      bundleType: bundle.bundleType || BundleType.PRODUCT_PAGE,
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
        })),
        messages: {
          progress: syncFirstRuleMsg?.discountText || 'Add {conditionText} to get {discountText}',
          qualified: syncFirstRuleMsg?.successMessage || 'Congratulations! You got {discountText}',
          showDiscountMessaging: syncMsgs.showDiscountMessaging || false,
        }
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
 * Handle hard-reset sync of a product-page bundle:
 * Archives and deletes the Shopify product, then re-creates it, and re-runs all metafield
 * operations from the current DB state.
 */
export async function handleSyncBundle(admin: ShopifyAdmin, session: Session, bundleId: string) {
  AppLogger.info('[SYNC_BUNDLE] Starting hard-reset sync for product-page bundle', { bundleId, shopId: session.shop });

  try {
    // 1. Load bundle + steps + pricing from DB
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: { include: { StepProduct: true }, orderBy: { position: 'asc' } },
        pricing: true,
      },
    });

    if (!bundle) {
      return json({ success: false, error: 'Bundle not found' }, { status: 404 });
    }

    if (!bundle.shopifyProductId) {
      return json({
        success: false,
        error: 'Bundle has no Shopify product — save the bundle first to create a product',
      }, { status: 400 });
    }

    const oldProductId = bundle.shopifyProductId;

    // 2. Archive product (Shopify requires ARCHIVED status before deletion)
    const ARCHIVE_PRODUCT = `
      mutation ArchiveProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id status }
          userErrors { field message }
        }
      }
    `;

    const archiveResponse = await admin.graphql(ARCHIVE_PRODUCT, {
      variables: { input: { id: oldProductId, status: 'ARCHIVED' } },
    });
    const archiveData = await archiveResponse.json();

    if (archiveData.data?.productUpdate?.userErrors?.length > 0) {
      const err = archiveData.data.productUpdate.userErrors[0];
      return json({ success: false, error: `Failed to archive Shopify product: ${err.message}` }, { status: 400 });
    }

    AppLogger.info('[SYNC_BUNDLE] Shopify product archived', { bundleId, productId: oldProductId });

    // 3. Delete Shopify product
    const DELETE_PRODUCT = `
      mutation DeleteProduct($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors { field message }
        }
      }
    `;

    const deleteResponse = await admin.graphql(DELETE_PRODUCT, {
      variables: { input: { id: oldProductId } },
    });
    const deleteData = await deleteResponse.json();

    if (deleteData.data?.productDelete?.userErrors?.length > 0) {
      const err = deleteData.data.productDelete.userErrors[0];
      return json({ success: false, error: `Failed to delete Shopify product: ${err.message}` }, { status: 400 });
    }

    AppLogger.info('[SYNC_BUNDLE] Shopify product deleted', { bundleId, productId: oldProductId });

    // 4. Clear product reference from DB
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyProductId: null },
    });

    // 5. Re-create the Shopify product
    const bundlePrice = await calculateBundlePrice(admin, bundle);

    const CREATE_PRODUCT = `
      mutation CreateBundleProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id title handle status
            variants(first: 1) { edges { node { id } } }
          }
          userErrors { field message }
        }
      }
    `;

    const createResponse = await admin.graphql(CREATE_PRODUCT, {
      variables: {
        input: {
          title: bundle.name,
          handle: `bundle-${bundle.id}`,
          productType: 'Bundle',
          vendor: 'Bundle Builder',
          status: 'ACTIVE',
          descriptionHtml: bundle.description || `${bundle.name} - Bundle Product`,
          tags: ['WP-Bundles'],
        },
      },
    });

    const createData = await createResponse.json();

    if (createData.data?.productCreate?.userErrors?.length > 0) {
      const err = createData.data.productCreate.userErrors[0];
      throw new Error(`Failed to re-create Shopify product: ${err.message}`);
    }

    const newProductId = createData.data?.productCreate?.product?.id;

    // Set price and inventory policy on the auto-created default variant
    // (productVariantUpdate removed in API 2025-10, use productVariantsBulkUpdate)
    const defaultVariantId = createData.data?.productCreate?.product?.variants?.edges?.[0]?.node?.id;
    if (defaultVariantId && newProductId) {
      await admin.graphql(`
        mutation UpdateBundleVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants { id price }
            userErrors { field message }
          }
        }
      `, {
        variables: {
          productId: newProductId,
          variants: [{
            id: defaultVariantId,
            price: bundlePrice,
            inventoryPolicy: 'CONTINUE'
          }]
        }
      });
    }
    if (!newProductId) {
      throw new Error('Re-created product has no ID');
    }

    AppLogger.info('[SYNC_BUNDLE] Shopify product re-created', { bundleId, newProductId });

    // 6. Update DB with new product ID and handle
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyProductId: newProductId, shopifyProductHandle: `bundle-${bundleId}` },
    });

    // 7. Re-run metafield operations from DB-authoritative state
    if (bundle.pricing) {
      const optimizedSteps = bundle.steps.map((step: any) => ({
        id: step.id,
        name: step.name,
        minQuantity: step.minQuantity || 1,
        maxQuantity: step.maxQuantity || 1,
        enabled: step.enabled !== false,
        conditionType: step.conditionType,
        conditionOperator: step.conditionOperator,
        conditionValue: step.conditionValue,
        products: (step.StepProduct || []).map((product: any) => ({
          id: product.productId,
          title: product.title || 'Product',
          imageUrl: product.imageUrl || null,
        })),
        collections: (step.collections || []).map((collection: any) => ({
          id: collection.id,
          title: collection.title || 'Collection',
        })),
      }));

      const syncMsgs = safeJsonParse(bundle.pricing.messages, {});
      const syncRuleMessages = syncMsgs.ruleMessages || {};
      const syncFirstRuleId = Object.keys(syncRuleMessages)[0];
      const syncFirstRuleMsg = syncFirstRuleId ? syncRuleMessages[syncFirstRuleId] : null;

      const bundleConfig = {
        bundleId: bundle.id,
        name: bundle.name,
        templateName: bundle.templateName || null,
        bundleType: bundle.bundleType || BundleType.PRODUCT_PAGE,
        type: 'cart_transform',
        steps: optimizedSteps,
        pricing: {
          enabled: bundle.pricing.enabled,
          method: bundle.pricing.method,
          rules: safeJsonParse(bundle.pricing.rules, []).map((rule: any) => ({
            id: rule.id,
            conditionType: rule.type || 'quantity',
            value: rule.value || 0,
            discountValue: rule.discountValue || 0,
            fixedBundlePrice: rule.fixedBundlePrice || 0,
          })),
          messages: {
            progress: syncFirstRuleMsg?.discountText || 'Add {conditionText} to get {discountText}',
            qualified: syncFirstRuleMsg?.successMessage || 'Congratulations! You got {discountText}',
            showDiscountMessaging: syncMsgs.showDiscountMessaging || false,
          },
        },
        updatedAt: new Date().toISOString(),
      };

      AppLogger.info('[SYNC_BUNDLE] Re-running metafield operations', { bundleId, newProductId });

      const [standardResult, componentResult, variantResult] = await Promise.allSettled([
        (async () => {
          const { metafields: standardMetafields } = await convertBundleToStandardMetafields(admin, bundleConfig);
          if (Object.keys(standardMetafields).length > 0) {
            await updateProductStandardMetafields(admin, newProductId, standardMetafields);
          }
        })(),
        updateComponentProductMetafields(admin, newProductId, bundleConfig),
        updateBundleProductMetafields(admin, newProductId, bundleConfig),
      ]);

      if (standardResult.status === 'rejected') {
        AppLogger.warn('[SYNC_BUNDLE] Standard metafields update failed (non-critical)', { bundleId }, standardResult.reason);
      }
      if (componentResult.status === 'rejected') {
        throw new Error(`Failed to update component metafields: ${componentResult.reason}`);
      }
      if (variantResult.status === 'rejected') {
        throw new Error(`Failed to update bundle variant metafields: ${variantResult.reason}`);
      }

      AppLogger.info('[SYNC_BUNDLE] All metafields re-synced successfully', { bundleId });
    }

    // Sync theme colors for bundle widget color inheritance (non-critical, silent fail)
    syncThemeColors(admin, session.shop).catch(() => { /* swallowed — syncThemeColors handles logging */ });

    return json({ success: true, synced: true, message: 'Bundle synced successfully' });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    AppLogger.error('[SYNC_BUNDLE] Error during sync:', { bundleId }, error as any);
    return json({ success: false, error: `Sync failed: ${message}` }, { status: 500 });
  }
}

/**
 * Handle widget placement validation for product page bundles
 */
export async function handleValidateWidgetPlacement(admin: ShopifyAdmin, session: Session, bundleId: string) {
  try {
    AppLogger.debug("[WIDGET_PLACEMENT] Validating widget placement", { bundleId });

    // Get bundle data
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop }
    });

    if (!bundle) {
      return json({
        success: false,
        error: ERROR_MESSAGES.BUNDLE_NOT_FOUND
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