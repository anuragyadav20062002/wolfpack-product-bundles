/**
 * Action Handlers for Full Page Bundle Configuration
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
    const promoBannerBgImageRaw = formData.get("promoBannerBgImage") as string;
    const promoBannerBgImage = promoBannerBgImageRaw || null;
    const promoBannerBgImageCropRaw = formData.get("promoBannerBgImageCrop") as string;
    const promoBannerBgImageCrop = promoBannerBgImageCropRaw || null;
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
        promoBannerBgImage: promoBannerBgImage,
        promoBannerBgImageCrop: promoBannerBgImageCrop,
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

        const responseData = await response.json() as { data: Record<string, any>; errors?: unknown[] };

        // Layer 1: Transport errors
        if (responseData.errors?.length) {
          AppLogger.error("[PRODUCT_SYNC] GraphQL transport error updating product status:", {
            component: "app.bundles.cart-transform.configure",
            operation: "sync-product-status",
            productId: updatedBundle.shopifyProductId,
          }, responseData.errors);
        }

        // Layer 2: Mutation user errors
        if (responseData.data?.productUpdate?.userErrors?.length > 0) {
          const errors = responseData.data.productUpdate.userErrors;
          AppLogger.error("[PRODUCT_SYNC] Shopify returned errors while updating product status:", {
            component: "app.bundles.cart-transform.configure",
            operation: "sync-product-status",
            productId: updatedBundle.shopifyProductId,
            targetStatus: shopifyStatus
          }, { errors });
        } else {
          const actualStatus = responseData.data?.productUpdate?.product?.status;
          AppLogger.info("[PRODUCT_SYNC] Successfully synced product status to Shopify", {
            component: "app.bundles.cart-transform.configure",
            productId: updatedBundle.shopifyProductId,
            requestedStatus: shopifyStatus,
            actualStatus: actualStatus
          });
        }
      } catch (error) {
        AppLogger.error("[PRODUCT_SYNC] Failed to sync product status (exception):", {
          component: "app.bundles.cart-transform.configure",
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
      AppLogger.debug("[METAFIELD] Optimized configuration size:", {}, `${configSize} chars (vs 12KB+ before)`);

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
    const message = error instanceof Error ? error.message : "Failed to save bundle configuration";
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

        const bundleConfiguration = {
          bundleId: bundle.id,
          name: bundle.name,
          templateName: bundle.templateName || null,
          bundleType: bundle.bundleType || 'full_page',
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
      bundleType: bundle.bundleType || 'full_page',
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
 * Check if full-page-bundle template exists in the theme
 */
export async function handleCheckFullPageTemplate(admin: ShopifyAdmin, session: Session) {
  try {
    AppLogger.debug("[TEMPLATE_CHECK] Checking for full-page-bundle template");

    // Get current theme
    const GET_THEME = `
      query {
        themes(first: 1, roles: MAIN) {
          nodes {
            id
            name
            role
          }
        }
      }
    `;

    const themeResponse = await admin.graphql(GET_THEME);
    const themeData = await themeResponse.json();
    const theme = themeData.data?.themes?.nodes?.[0];

    if (!theme) {
      return json({
        success: false,
        templateExists: false,
        error: "No active theme found"
      });
    }

    const themeId = theme.id.split('/').pop();

    // Fetch theme assets using session credentials (admin.rest not available with removeRest: true)
    const { accessToken, shop } = session;

    const assetsResponse = await fetch(
      `https://${shop}/admin/api/2024-10/themes/${themeId}/assets.json`,
      {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': accessToken ?? "",
          'Content-Type': 'application/json',
        },
      }
    );

    if (!assetsResponse.ok) {
      throw new Error(`Failed to fetch theme assets: ${assetsResponse.status}`);
    }

    const assetsData = await assetsResponse.json();

    // Check if full-page-bundle template exists
    const templateExists = assetsData.assets.some((asset: any) =>
      asset.key === 'templates/page.full-page-bundle.json' ||
      asset.key === 'templates/page.full-page-bundle.liquid'
    );

    AppLogger.debug(`[TEMPLATE_CHECK] Template exists: ${templateExists}`);

    return json({
      success: true,
      templateExists,
      themeName: theme.name,
      themeId: theme.id
    });

  } catch (error) {
    AppLogger.error("[TEMPLATE_CHECK] Error checking template:", {}, error as any);
    return json({
      success: false,
      templateExists: false,
      error: (error as Error).message || "Failed to check template"
    }, { status: 500 });
  }
}

/**
 * Handle widget placement validation with automated page creation
 */
export async function handleValidateWidgetPlacement(admin: ShopifyAdmin, session: Session, bundleId: string) {
  try {
    AppLogger.debug("[WIDGET_PLACEMENT] Validating widget placement (single-click flow)", { bundleId });

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

    // UPDATED: Single-click workflow for full-page bundles
    // This will:
    // 1. Create page with bundle_id metafield immediately
    // 2. Check if widget is installed in theme
    // 3. If NOT installed: Return page info + installation link to specific page
    // 4. If installed: Return storefront URL where bundle is live
    // NO THEME MODIFICATIONS - App Store compliant
    const apiKey = process.env.SHOPIFY_API_KEY || '';
    const result = await WidgetInstallationService.createFullPageBundle(
      admin,
      session.shop,
      apiKey,
      bundleId,
      bundle.name
    );

    if (!result.success) {
      return json({
        success: false,
        error: result.error,
        errorType: result.errorType,
        widgetInstallationRequired: result.widgetInstallationRequired,
        widgetInstallationLink: result.widgetInstallationLink
      }, { status: 400 });
    }

    // UPDATED: Save page handle, page ID, and activate bundle
    // This happens EVEN if widget installation is required
    // Setting status to 'active' ensures the bundle is available via the API endpoint
    await db.bundle.update({
      where: { id: bundleId, shopId: session.shop },
      data: {
        shopifyPageHandle: result.pageHandle,
        shopifyPageId: result.pageId,
        status: 'active'  // CRITICAL: Activate bundle so widget can fetch it via API
      }
    });

    AppLogger.info("[WIDGET_PLACEMENT] Page created successfully (single-click mode)", {
      bundleId,
      pageId: result.pageId,
      pageHandle: result.pageHandle,
      pageUrl: result.pageUrl,
      widgetInstallationRequired: result.widgetInstallationRequired
    });

    // Return success with page info and optional installation link
    return json({
      success: true,
      pageUrl: result.pageUrl,
      pageId: result.pageId,
      pageHandle: result.pageHandle,
      widgetInstallationRequired: result.widgetInstallationRequired,
      widgetInstallationLink: result.widgetInstallationLink,
      message: result.widgetInstallationRequired
        ? `Page created successfully! Complete setup by adding the widget to your page.`
        : `Bundle page created successfully! View at: ${result.pageUrl}`
    });

  } catch (error) {
    AppLogger.error("[WIDGET_PLACEMENT] Error in widget placement:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Widget placement validation failed"
    }, { status: 500 });
  }
}