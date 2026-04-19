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
import { renamePageHandle, writeBundleConfigPageMetafield, publishPreviewPage, getPreviewPageUrl } from "../../../../services/widget-installation/widget-full-page-bundle.server";
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
import { BundleStatus, BundleType, FullPageLayout } from "../../../../constants/bundle";
import { validateTierConfig } from "../../../../lib/tier-config-validator.server";
import { SHOPIFY_REST_API_VERSION } from "../../../../constants/api";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import { syncThemeColors } from "../../../../services/theme-colors.server";
import { ensureProductBundleTemplate } from "../../../../services/widget-installation/widget-theme-template.server";

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

const FULL_PAGE_PRODUCT_TEMPLATE_SUFFIX = "product-page-bundle";
const DEFAULT_PROGRESS_MESSAGE = "Add {conditionText} to get {discountText}";
const DEFAULT_SUCCESS_MESSAGE = "Congratulations! You got {discountText}";

async function syncFullPageBundleProductTemplate(
  admin: ShopifyAdmin,
  session: Session,
  productId: string,
  bundleId: string,
  shopifyStatus?: string,
) {
  try {
    const apiKey = process.env.SHOPIFY_API_KEY ?? "";
    const templateResult = await ensureProductBundleTemplate(admin, session, apiKey);

    if (!templateResult.success) {
      AppLogger.warn("[PRODUCT_TEMPLATE] Could not ensure product bundle template (non-fatal)", {
        component: "app.bundles.full-page.configure",
        bundleId,
        productId,
        error: templateResult.error,
      });
      return;
    }

    const UPDATE_PRODUCT = shopifyStatus
      ? `
          mutation ApplyBundleTemplate($id: ID!, $status: ProductStatus!, $templateSuffix: String!) {
            productUpdate(input: {id: $id, status: $status, templateSuffix: $templateSuffix}) {
              product {
                id
                status
                templateSuffix
              }
              userErrors {
                field
                message
              }
            }
          }
        `
      : `
          mutation ApplyBundleTemplate($id: ID!, $templateSuffix: String!) {
            productUpdate(input: {id: $id, templateSuffix: $templateSuffix}) {
              product {
                id
                status
                templateSuffix
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

    const variables = shopifyStatus
      ? { id: productId, status: shopifyStatus, templateSuffix: FULL_PAGE_PRODUCT_TEMPLATE_SUFFIX }
      : { id: productId, templateSuffix: FULL_PAGE_PRODUCT_TEMPLATE_SUFFIX };

    const response = await admin.graphql(UPDATE_PRODUCT, { variables });
    const responseData = await response.json() as { data?: Record<string, any>; errors?: unknown[] };

    if (responseData.errors?.length) {
      AppLogger.error("[PRODUCT_TEMPLATE] GraphQL transport error updating product template", {
        component: "app.bundles.full-page.configure",
        bundleId,
        productId,
        shopifyStatus: shopifyStatus ?? null,
      }, responseData.errors);
      return;
    }

    const userErrors = responseData.data?.productUpdate?.userErrors ?? [];
    if (userErrors.length > 0) {
      AppLogger.error("[PRODUCT_TEMPLATE] Shopify returned errors while applying product template", {
        component: "app.bundles.full-page.configure",
        bundleId,
        productId,
        shopifyStatus: shopifyStatus ?? null,
      }, { userErrors });
      return;
    }

    AppLogger.info("[PRODUCT_TEMPLATE] Applied product template for full-page bundle", {
      component: "app.bundles.full-page.configure",
      bundleId,
      productId,
      shopifyStatus: responseData.data?.productUpdate?.product?.status ?? shopifyStatus ?? null,
      templateSuffix: responseData.data?.productUpdate?.product?.templateSuffix ?? FULL_PAGE_PRODUCT_TEMPLATE_SUFFIX,
    });
  } catch (error) {
    AppLogger.warn("[PRODUCT_TEMPLATE] Failed to apply full-page product template (non-fatal)", {
      component: "app.bundles.full-page.configure",
      bundleId,
      productId,
      shopifyStatus: shopifyStatus ?? null,
    }, error as Error);
  }
}

function buildFullPageBundlePricing(pricing: any) {
  if (!pricing) {
    return null;
  }

  const parsedMessages = safeJsonParse(pricing.messages, {});
  const ruleMessages = parsedMessages.ruleMessages || {};
  const firstRuleId = Object.keys(ruleMessages)[0];
  const firstRuleMessage = firstRuleId ? ruleMessages[firstRuleId] : null;

  return {
    enabled: pricing.enabled,
    method: pricing.method || "percentage_off",
    rules: safeJsonParse(pricing.rules, []).map((rule: any) => {
      const conditionValue = Number(
        rule.condition?.value ??
        rule.conditionValue ??
        rule.value ??
        0,
      ) || 0;
      const discountValue = Number(
        rule.discount?.value ??
        rule.discountValue ??
        0,
      ) || 0;
      const fixedBundlePrice = Number(rule.fixedBundlePrice ?? 0) || 0;
      const hasCondition =
        Boolean(rule.condition) ||
        Boolean(rule.conditionType) ||
        Boolean(rule.type) ||
        typeof rule.value !== "undefined";

      return {
        id: rule.id,
        condition: hasCondition
          ? {
              type: rule.condition?.type || rule.conditionType || rule.type || "quantity",
              operator: rule.condition?.operator || rule.operator || "gte",
              value: conditionValue,
            }
          : null,
        discount: {
          method: rule.discount?.method || pricing.method || "percentage_off",
          value: discountValue,
        },
        fixedBundlePrice,
        discountValue,
      };
    }),
    display: {
      showFooter: pricing.showFooter !== false,
    },
    messages: {
      progress: firstRuleMessage?.discountText || DEFAULT_PROGRESS_MESSAGE,
      qualified: firstRuleMessage?.successMessage || DEFAULT_SUCCESS_MESSAGE,
      showDiscountMessaging: parsedMessages.showDiscountMessaging || false,
    },
  };
}

function buildFullPageBundleMetafieldSteps(steps: any[] = []) {
  return steps.map((step: any, index: number) => {
    const rawStepProducts = Array.isArray(step.StepProduct) && step.StepProduct.length > 0
      ? step.StepProduct
      : Array.isArray(step.products)
        ? step.products
        : [];

    const stepProducts = rawStepProducts
      .map((product: any) => ({
        productId: product.productId || product.id || null,
        title: product.title || product.name || "Product",
        imageUrl: product.imageUrl || product.image?.url || null,
        variants: Array.isArray(product.variants) ? product.variants : null,
      }))
      .filter((product: { productId: string | null }) => Boolean(product.productId));

    return {
      id: step.id,
      name: step.name || `Step ${index + 1}`,
      position: step.position ?? index + 1,
      minQuantity: step.minQuantity || 1,
      maxQuantity: step.maxQuantity || 1,
      enabled: step.enabled !== false,
      conditionType: step.conditionType ?? null,
      conditionOperator: step.conditionOperator ?? null,
      conditionValue: step.conditionValue ?? null,
      conditionOperator2: step.conditionOperator2 ?? null,
      conditionValue2: step.conditionValue2 ?? null,
      StepProduct: stepProducts,
      products: stepProducts.map((product: any) => ({
        id: product.productId,
        title: product.title,
        imageUrl: product.imageUrl,
      })),
      collections: Array.isArray(step.collections)
        ? step.collections.map((collection: any) => ({
            id: collection.id,
            handle: collection.handle,
            title: collection.title || "Collection",
          }))
        : [],
    };
  });
}

/**
 * Create a Shopify URL redirect from /products/{productHandle} → /pages/{pageHandle}.
 * Shopify URL redirects are applied before theme routing, so this reliably sends
 * customers to the full-page bundle page even if the product still exists.
 * Non-fatal — logs warnings but never throws.
 */
async function createProductPageRedirect(
  admin: ShopifyAdmin,
  productId: string,
  pageHandle: string,
): Promise<void> {
  try {
    const productRes = await admin.graphql(`
      query GetProductHandle($id: ID!) {
        product(id: $id) { handle }
      }
    `, { variables: { id: productId } });
    const productData = await productRes.json() as { data?: { product?: { handle?: string } } };
    const productHandle = productData?.data?.product?.handle;

    if (!productHandle) {
      AppLogger.warn("[URL_REDIRECT] Could not resolve product handle — skipping redirect creation", { productId });
      return;
    }

    const path = `/products/${productHandle}`;
    const target = `/pages/${pageHandle}`;

    const redirectRes = await admin.graphql(`
      mutation CreateBundleRedirect($path: String!, $target: String!) {
        urlRedirectCreate(urlRedirect: { path: $path, target: $target }) {
          urlRedirect { id }
          userErrors { field message }
        }
      }
    `, { variables: { path, target } });
    const redirectData = await redirectRes.json() as any;
    const userErrors = redirectData?.data?.urlRedirectCreate?.userErrors ?? [];

    if (userErrors.length > 0) {
      AppLogger.warn("[URL_REDIRECT] userErrors creating product page redirect (may already exist)", {
        productId, path, target, userErrors,
      });
    } else {
      AppLogger.info("[URL_REDIRECT] Created product page redirect", { path, target });
    }
  } catch (error) {
    AppLogger.warn("[URL_REDIRECT] Failed to create product page redirect (non-fatal)", {
      productId, pageHandle,
    }, error as Error);
  }
}

function buildFullPageBundleMetafieldConfig(bundle: any, overrides: Record<string, unknown> = {}) {
  return {
    bundleId: bundle.id,
    id: bundle.id,
    name: bundle.name,
    description: bundle.description || "",
    status: bundle.status,
    bundleType: bundle.bundleType || BundleType.FULL_PAGE,
    fullPageLayout: bundle.fullPageLayout || FullPageLayout.FOOTER_BOTTOM,
    templateName: bundle.templateName || null,
    shopifyProductId: bundle.shopifyProductId || null,
    shopifyPageHandle: (
      overrides.shopifyPageHandle as string | null | undefined
    ) ?? bundle.shopifyPageHandle ?? null,
    promoBannerBgImage: bundle.promoBannerBgImage ?? null,
    promoBannerBgImageCrop: bundle.promoBannerBgImageCrop ?? null,
    loadingGif: bundle.loadingGif ?? null,
    type: "cart_transform",
    steps: buildFullPageBundleMetafieldSteps(bundle.steps || []),
    pricing: buildFullPageBundlePricing(bundle.pricing),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

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
    const fullPageLayout = formData.get("fullPageLayout") as string || FullPageLayout.FOOTER_BOTTOM;
    const promoBannerBgImageRaw = formData.get("promoBannerBgImage") as string;
    const promoBannerBgImage = promoBannerBgImageRaw || null;
    const promoBannerBgImageCropRaw = formData.get("promoBannerBgImageCrop") as string;
    const promoBannerBgImageCrop = promoBannerBgImageCropRaw || null;
    const loadingGifRaw = formData.get("loadingGif") as string;
    const loadingGif = loadingGifRaw || null;
    const tierConfigRaw = formData.get("tierConfigData") as string | null;
    const tierConfigParsed = tierConfigRaw ? JSON.parse(tierConfigRaw) : null;
    const showStepTimelineRaw = formData.get("showStepTimeline") as string | null;
    // Parse: "true" → true, "false" → false, null/missing → null
    const showStepTimelineParsed: boolean | null =
      showStepTimelineRaw === "true" ? true : showStepTimelineRaw === "false" ? false : null;
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

    // Get existing bundle to preserve shopifyProductId if not provided
    const existingBundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      select: { shopifyProductId: true }
    });

    // Reset showStepTimeline to null when < 2 tiers are active (no pills shown),
    // so the theme editor data attribute regains control (backward compat).
    const activeTierCount = Array.isArray(tierConfigParsed) ? tierConfigParsed.length : 0;
    const showStepTimelineForSave: boolean | null =
      activeTierCount >= 2 ? showStepTimelineParsed : null;

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
        fullPageLayout: fullPageLayout as any,
        promoBannerBgImage: promoBannerBgImage,
        promoBannerBgImageCrop: promoBannerBgImageCrop,
        loadingGif: loadingGif,
        tierConfig: tierConfigParsed
          ? await validateTierConfig(tierConfigParsed, session.shop, db)
          : null,
        showStepTimeline: showStepTimelineForSave,
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
                // Step image fields
                imageUrl: step.imageUrl ?? null,
                bannerImageUrl: step.bannerImageUrl ?? null,
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
      const shopifyStatus = finalStatus.toUpperCase();
      AppLogger.debug(`[PRODUCT_SYNC] Syncing status '${shopifyStatus}' + templateSuffix to product ${updatedBundle.shopifyProductId}`);
      await syncFullPageBundleProductTemplate(
        admin,
        session,
        updatedBundle.shopifyProductId,
        bundleId,
        shopifyStatus,
      );

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
        conditionOperator2: stepConditionsData[step.id]?.[1]?.operator || null,
        conditionValue2: stepConditionsData[step.id]?.[1]?.value ? parseInt(stepConditionsData[step.id][1].value) || null : null,
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
        fullPageLayout: updatedBundle.fullPageLayout || FullPageLayout.FOOTER_BOTTOM,
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
          },
          messages: (() => {
            // Build messages from ruleMessages (per-rule messaging from admin form)
            const firstRuleId = discountData.discountRules?.[0]?.id;
            const firstRuleMsg = firstRuleId && discountData.ruleMessages?.[firstRuleId];
            return {
              progress: firstRuleMsg?.discountText || 'Add {conditionText} to get {discountText}',
              qualified: firstRuleMsg?.successMessage || 'Congratulations! You got {discountText}',
              showDiscountMessaging: discountData.discountMessagingEnabled || false,
              showInCart: true
            };
          })()
        },
        // CRITICAL: Include bundle parent variant ID for cart transform merge operations
        bundleParentVariantId: bundleParentVariantId,
        shopifyProductId: updatedBundle.shopifyProductId, // Bundle product ID for querying metafield
        shopifyPageHandle: updatedBundle.shopifyPageHandle || null,
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

    // Keep page metafield cache in sync with every save so the storefront widget
    // reflects layout/config changes without requiring a manual "Sync Bundle".
    // Intentionally placed OUTSIDE the shopifyProductId guard: full-page bundles that
    // have no redirect product (shopifyProductId = null) still need the page metafield
    // updated so the storefront widget picks up layout changes.
    // Non-fatal: writeBundleConfigPageMetafield has its own try/catch and never throws.
    if (updatedBundle.shopifyPageId) {
      await writeBundleConfigPageMetafield(admin, updatedBundle.shopifyPageId, updatedBundle);
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

      await syncFullPageBundleProductTemplate(admin, session, productId, bundleId);

      const bundleConfiguration = buildFullPageBundleMetafieldConfig(
        {
          ...bundle,
          ...updatedBundle,
          shopifyProductId: productId,
        },
        {
          lastSynced: new Date().toISOString(),
          shopifyProduct: {
            id: shopifyProduct.id,
            title: shopifyProduct.title,
            handle: shopifyProduct.handle,
            updatedAt: shopifyProduct.updatedAt,
          },
        },
      );

      await updateBundleProductMetafields(admin, productId, bundleConfiguration);

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

  if (productId) {
    await syncFullPageBundleProductTemplate(admin, session, productId, bundleId);

    const bundleConfiguration = buildFullPageBundleMetafieldConfig({
      ...bundle,
      shopifyProductId: productId,
    });

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
 * Handle hard-reset sync of a full-page bundle:
 * Deletes the Shopify page and re-creates it, then re-runs all metafield operations
 * from the current DB state. DB child records (steps, pricing) are preserved in place.
 */
export async function handleSyncBundle(admin: ShopifyAdmin, session: Session, bundleId: string) {
  AppLogger.info('[SYNC_BUNDLE] Starting hard-reset sync for full-page bundle', { bundleId, shopId: session.shop });

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

    if (!bundle.shopifyPageId) {
      return json({
        success: false,
        error: 'Bundle has no Shopify page — save the bundle first to create a page',
      }, { status: 400 });
    }

    // 2. Delete Shopify page
    const DELETE_PAGE = `
      mutation DeletePage($id: ID!) {
        pageDelete(id: $id) {
          deletedPageId
          userErrors { field message }
        }
      }
    `;

    const deleteResponse = await admin.graphql(DELETE_PAGE, {
      variables: { id: bundle.shopifyPageId },
    });
    const deleteData = await deleteResponse.json();

    if (deleteData.data?.pageDelete?.userErrors?.length > 0) {
      const err = deleteData.data.pageDelete.userErrors[0];
      return json({ success: false, error: `Failed to delete Shopify page: ${err.message}` }, { status: 400 });
    }

    AppLogger.info('[SYNC_BUNDLE] Shopify page deleted', { bundleId, pageId: bundle.shopifyPageId });

    // 3. Clear page reference from DB so createFullPageBundle will create a fresh page
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyPageId: null, shopifyPageHandle: null },
    });

    // 4. Re-create the Shopify page via WidgetInstallationService
    const apiKey = process.env.SHOPIFY_API_KEY || '';
    const result = await WidgetInstallationService.createFullPageBundle(
      admin, session, apiKey, bundleId, bundle.name,
    );

    if (!result.success) {
      AppLogger.error('[SYNC_BUNDLE] Failed to re-create Shopify page', { bundleId }, result.error as any);
      return json({
        success: false,
        error: result.error || 'Failed to re-create Shopify page',
      }, { status: 500 });
    }

    AppLogger.info('[SYNC_BUNDLE] Shopify page re-created', { bundleId, pageId: result.pageId, pageHandle: result.pageHandle });

    // 5. Update DB with new page ID and handle
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyPageId: result.pageId, shopifyPageHandle: result.pageHandle },
    });

    // 5b. Write bundle config metafield on the new page (non-fatal)
    await writeBundleConfigPageMetafield(admin, result.pageId ?? null, bundle);

    // 6. Re-run metafield operations from DB-authoritative state (if shopifyProductId exists)
    const shopifyProductId = bundle.shopifyProductId;
    if (shopifyProductId) {
      await syncFullPageBundleProductTemplate(admin, session, shopifyProductId, bundleId);

      const bundleConfig = buildFullPageBundleMetafieldConfig({
        ...bundle,
        shopifyPageHandle: result.pageHandle,
      });

      AppLogger.info('[SYNC_BUNDLE] Re-running metafield operations', { bundleId, shopifyProductId });

      const [standardResult, componentResult, variantResult] = await Promise.allSettled([
        (async () => {
          const { metafields: standardMetafields } = await convertBundleToStandardMetafields(admin, bundleConfig);
          if (Object.keys(standardMetafields).length > 0) {
            await updateProductStandardMetafields(admin, shopifyProductId, standardMetafields);
          }
        })(),
        updateComponentProductMetafields(admin, shopifyProductId, bundleConfig),
        updateBundleProductMetafields(admin, shopifyProductId, bundleConfig),
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
      `https://${shop}/admin/api/${SHOPIFY_REST_API_VERSION}/themes/${themeId}/assets.json`,
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
export async function handleValidateWidgetPlacement(admin: ShopifyAdmin, session: Session, bundleId: string, desiredSlug?: string) {
  try {
    AppLogger.debug("[WIDGET_PLACEMENT] Validating widget placement (single-click flow)", { bundleId });

    // Load full bundle (steps + products + pricing) needed for the metafield config cache
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: { include: { StepProduct: true }, orderBy: { position: 'asc' } },
        pricing: true,
      },
    });

    if (!bundle) {
      return json({
        success: false,
        error: ERROR_MESSAGES.BUNDLE_NOT_FOUND
      }, { status: 404 });
    }

    // If a draft preview page exists, promote it to published instead of creating a new page.
    // This prevents duplicate Shopify pages when the merchant previewed before publishing.
    if (bundle.shopifyPreviewPageId) {
      const publishResult = await publishPreviewPage(admin, bundle.shopifyPreviewPageId);

      if (publishResult.success) {
        await db.bundle.update({
          where: { id: bundleId, shopId: session.shop },
          data: {
            shopifyPageHandle: bundle.shopifyPreviewPageHandle,
            shopifyPageId: bundle.shopifyPreviewPageId,
            shopifyPreviewPageId: null,
            shopifyPreviewPageHandle: null,
            status: BundleStatus.ACTIVE,
          },
        });

        await writeBundleConfigPageMetafield(admin, bundle.shopifyPreviewPageId, bundle);

        // Create URL redirect so /products/{handle} → /pages/{pageHandle} at routing level
        if (bundle.shopifyProductId && bundle.shopifyPreviewPageHandle) {
          createProductPageRedirect(admin, bundle.shopifyProductId, bundle.shopifyPreviewPageHandle).catch(() => {});
        }

        AppLogger.info("[WIDGET_PLACEMENT] Draft preview page promoted to published", {
          bundleId,
          pageId: bundle.shopifyPreviewPageId,
          pageHandle: bundle.shopifyPreviewPageHandle,
        });

        return json({
          success: true,
          pageHandle: bundle.shopifyPreviewPageHandle,
          pageId: bundle.shopifyPreviewPageId,
          pageUrl: `https://${session.shop.replace('.myshopify.com', '')}.myshopify.com/pages/${bundle.shopifyPreviewPageHandle}`,
          slugAdjusted: false,
          message: `Bundle page published successfully!`,
        });
      }

      // Promotion failed (page deleted externally) — clear stale preview refs and fall through
      AppLogger.warn("[WIDGET_PLACEMENT] Failed to promote draft preview page, falling back to create", {
        bundleId,
        previewPageId: bundle.shopifyPreviewPageId,
        error: publishResult.error,
      });
      await db.bundle.update({
        where: { id: bundleId, shopId: session.shop },
        data: { shopifyPreviewPageId: null, shopifyPreviewPageHandle: null },
      });
    }

    // UPDATED: Single-click workflow for full-page bundles
    // This will:
    // 1. Ensures page.full-page-bundle.json template exists in theme
    // 2. Creates page with bundle_id metafield and templateSuffix
    // 3. Returns storefront URL where bundle is live
    const apiKey = process.env.SHOPIFY_API_KEY || '';
    const result = await WidgetInstallationService.createFullPageBundle(
      admin,
      session,
      apiKey,
      bundleId,
      bundle.name,
      desiredSlug
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
        status: BundleStatus.ACTIVE  // CRITICAL: Activate bundle so widget can fetch it via API
      }
    });

    // Write bundle config as page metafield for zero-proxy widget initialisation (non-fatal)
    await writeBundleConfigPageMetafield(admin, result.pageId ?? null, bundle);

    // Create URL redirect so /products/{handle} → /pages/{pageHandle} at routing level (non-fatal)
    if (bundle.shopifyProductId && result.pageHandle) {
      createProductPageRedirect(admin, bundle.shopifyProductId, result.pageHandle).catch(() => {});
    }

    if (bundle.shopifyProductId) {
      try {
        await syncFullPageBundleProductTemplate(admin, session, bundle.shopifyProductId, bundleId);
        await updateBundleProductMetafields(
          admin,
          bundle.shopifyProductId,
          buildFullPageBundleMetafieldConfig(
            {
              ...bundle,
              status: BundleStatus.ACTIVE,
            },
            {
              shopifyPageHandle: result.pageHandle,
              status: BundleStatus.ACTIVE,
            },
          ),
        );
      } catch (metafieldError) {
        AppLogger.warn("[WIDGET_PLACEMENT] Failed to sync bundle product redirect metadata after page creation (non-fatal)", {
          bundleId,
          shopifyProductId: bundle.shopifyProductId,
          pageHandle: result.pageHandle,
        }, metafieldError as Error);
      }
    }

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
      slugAdjusted: result.slugAdjusted ?? false,
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

/**
 * Create (or re-open) a draft Shopify preview page for a full-page bundle.
 *
 * Called by the "Preview on Storefront" button before the merchant has added the bundle
 * to their storefront. Creates a draft page on first click; returns the cached
 * shareablePreviewUrl on subsequent clicks. Falls back to creating a fresh draft if
 * the existing one was deleted externally.
 */
export async function handleCreatePreviewPage(admin: ShopifyAdmin, session: Session, bundleId: string) {
  try {
    AppLogger.debug("[PREVIEW_PAGE] Creating/retrieving preview page", { bundleId });

    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: { include: { StepProduct: true }, orderBy: { position: 'asc' } },
        pricing: true,
      },
    });

    if (!bundle) {
      return json({ success: false, error: ERROR_MESSAGES.BUNDLE_NOT_FOUND }, { status: 404 });
    }

    // If an existing draft preview page is tracked, return its shareablePreviewUrl directly
    if (bundle.shopifyPreviewPageId) {
      const urlResult = await getPreviewPageUrl(admin, bundle.shopifyPreviewPageId);

      if (urlResult.success) {
        AppLogger.info("[PREVIEW_PAGE] Returning existing draft preview URL", {
          bundleId,
          previewPageId: bundle.shopifyPreviewPageId,
        });
        return json({ success: true, shareablePreviewUrl: urlResult.shareablePreviewUrl });
      }

      // Page was deleted externally — clear stale refs and create a fresh draft below
      AppLogger.warn("[PREVIEW_PAGE] Existing draft page not found, recreating", {
        bundleId,
        previewPageId: bundle.shopifyPreviewPageId,
      });
      await db.bundle.update({
        where: { id: bundleId, shopId: session.shop },
        data: { shopifyPreviewPageId: null, shopifyPreviewPageHandle: null },
      });
    }

    // Create a new draft page
    const apiKey = process.env.SHOPIFY_API_KEY || '';
    const result = await WidgetInstallationService.createFullPageBundle(
      admin,
      session,
      apiKey,
      bundleId,
      `[Preview] ${bundle.name}`,
      undefined,
      false   // isPublished: false → draft page
    );

    if (!result.success) {
      AppLogger.error("[PREVIEW_PAGE] Draft page creation failed", { bundleId, error: result.error });
      return json({ success: false, error: result.error }, { status: 400 });
    }

    // Cache bundle config on draft page (non-fatal — preview still works via proxy fallback)
    await writeBundleConfigPageMetafield(admin, result.pageId ?? null, bundle);

    // Persist draft page refs on bundle
    await db.bundle.update({
      where: { id: bundleId, shopId: session.shop },
      data: {
        shopifyPreviewPageId: result.pageId,
        shopifyPreviewPageHandle: result.pageHandle,
      },
    });

    AppLogger.info("[PREVIEW_PAGE] Draft preview page created", {
      bundleId,
      previewPageId: result.pageId,
      previewPageHandle: result.pageHandle,
    });

    return json({ success: true, shareablePreviewUrl: result.shareablePreviewUrl });

  } catch (error) {
    AppLogger.error("[PREVIEW_PAGE] Unexpected error", {}, error as Error);
    return json({
      success: false,
      error: (error as Error).message || "Failed to create preview page",
    }, { status: 500 });
  }
}

/**
 * Handle renaming the Shopify page handle for an already-placed full-page bundle.
 * Called when the merchant edits the slug and saves from the configure page.
 */
export async function handleRenamePageSlug(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  newSlug: string
) {
  try {
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: { include: { StepProduct: true }, orderBy: { position: 'asc' } },
        pricing: true,
      },
    });

    if (!bundle) {
      return json({ success: false, error: ERROR_MESSAGES.BUNDLE_NOT_FOUND }, { status: 404 });
    }

    if (!bundle.shopifyPageId) {
      return json(
        { success: false, error: "Bundle page has not been placed yet." },
        { status: 400 }
      );
    }

    const result = await renamePageHandle(
      admin,
      bundle.shopifyPageId,
      newSlug,
      bundle.shopifyPageHandle ?? ''
    );

    if (!result.success) {
      return json({ success: false, error: result.error }, { status: 400 });
    }

    await db.bundle.update({
      where: { id: bundleId, shopId: session.shop },
      data: { shopifyPageHandle: result.newHandle }
    });

    if (bundle.shopifyProductId) {
      try {
        await updateBundleProductMetafields(
          admin,
          bundle.shopifyProductId,
          buildFullPageBundleMetafieldConfig(bundle, {
            shopifyPageHandle: result.newHandle,
          }),
        );
      } catch (metafieldError) {
        AppLogger.warn("[RENAME_PAGE_SLUG] Failed to sync bundle product redirect metadata after slug rename (non-fatal)", {
          bundleId,
          shopifyProductId: bundle.shopifyProductId,
          newHandle: result.newHandle,
        }, metafieldError as Error);
      }
    }

    AppLogger.info("[RENAME_PAGE_SLUG] Page handle renamed successfully", {
      bundleId,
      oldHandle: bundle.shopifyPageHandle,
      newHandle: result.newHandle
    });

    return json({
      success: true,
      newHandle: result.newHandle,
      adjusted: result.adjusted ?? false
    });

  } catch (error) {
    AppLogger.error("[RENAME_PAGE_SLUG] Error renaming page slug:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Failed to rename page slug"
    }, { status: 500 });
  }
}
