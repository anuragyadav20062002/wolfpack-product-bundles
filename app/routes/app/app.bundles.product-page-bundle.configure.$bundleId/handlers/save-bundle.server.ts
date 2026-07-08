import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import db from "../../../../db.server";
import { parseConditionValue } from "../../../../lib/parse-condition-value";
import { mapDiscountMethod } from "../../../../utils/discount-mappers";
import { parsePPBBundleVisibility, parsePPBBundleSettings } from "./parsers";
import { normaliseShopifyProductId } from "../../../../services/bundles/bundle-configure-handlers.server";
import { BundleStatus } from "../../../../constants/bundle";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import { buildStepCategoryCreateInput } from "../../../../lib/bundle-config/category-persistence";
import {
  normalizePricingDisplayOptions,
  serializeBoxSelectionFromPricingDisplayOptions,
} from "../../../../lib/pricing-display-options";
import {
  compactBundleForConfigureResponse,
  syncBundleStorefrontNow,
} from "../../../../services/bundles/storefront-sync.server";

export async function handleSaveBundle(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  formData: FormData,
) {
  const endTimer = AppLogger.startTimer("Bundle save process", {
    component: "bundle-config",
    operation: "save",
    bundleId,
    shopId: session.shop,
  });

  AppLogger.info("Starting enhanced bundle save process", {
    component: "bundle-config",
    operation: "save",
    bundleId,
    shopId: session.shop,
  });

  try {
    const bundleName = formData.get("bundleName") as string;
    const bundleDescription = formData.get("bundleDescription") as string;
    const bundleStatus = formData.get("bundleStatus") as string;
    const templateName = (formData.get("templateName") as string) || null;
    if (!Object.values(BundleStatus).includes(bundleStatus as BundleStatus)) {
      return json(
        { success: false, error: "Invalid bundle status" },
        { status: 400 },
      );
    }

    const loadingGifRaw = formData.get("loadingGif") as string;
    const loadingGif = loadingGifRaw || null;
    const showProductPrices = formData.get("showProductPrices") !== "false";
    const showCompareAtPrices = formData.get("showCompareAtPrices") === "true";
    const cartRedirectToCheckout =
      formData.get("cartRedirectToCheckout") === "true";
    const allowQuantityChanges =
      formData.get("allowQuantityChanges") !== "false";
    const sdkMode = formData.get("sdkMode") === "true";
    const textOverridesRaw = formData.get("textOverrides") as string | null;
    const textOverridesByLocaleRaw = formData.get("textOverridesByLocale") as
      | string
      | null;
    const textOverrides = textOverridesRaw
      ? JSON.parse(textOverridesRaw)
      : null;
    const textOverridesByLocale = textOverridesByLocaleRaw
      ? JSON.parse(textOverridesByLocaleRaw)
      : null;
    const stepsData = JSON.parse(formData.get("stepsData") as string);
    const discountData = JSON.parse(formData.get("discountData") as string);
    const stepConditionsData: Record<string, any[]> = formData.get("stepConditions")
      ? JSON.parse(formData.get("stepConditions") as string)
      : {};
    const bundleProductData = formData.get("bundleProduct")
      ? JSON.parse(formData.get("bundleProduct") as string)
      : null;

    AppLogger.debug("Parsed form data:", {
      bundleName,
      bundleDescription,
      bundleStatus,
      stepsCount: stepsData.length,
      discountEnabled: discountData.discountEnabled,
      discountType: discountData.discountType,
      hasConditions: Object.keys(stepConditionsData).length > 0,
      hasBundleProduct: !!bundleProductData,
    });

    AppLogger.debug(
      "[DEBUG] Step Conditions Data from form:",
      stepConditionsData,
    );
    AppLogger.debug(
      "[DEBUG] Bundle Product Data from form:",
      bundleProductData,
    );

    // DEBUG: Log all product IDs being submitted
    AppLogger.debug("[DEBUG] Steps data received from form:");
    stepsData.forEach((step: any, idx: number) => {
      AppLogger.debug(
        `  Step ${idx + 1}: "${step.name}" (step.id: ${step.id})`,
      );
      if (step.StepProduct && Array.isArray(step.StepProduct)) {
        step.StepProduct.forEach((product: any, pidx: number) => {
          AppLogger.debug(
            `    Product ${pidx + 1}: "${product.title}" → product.id: ${product.id}`,
          );
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
    if (
      discountData.discountEnabled &&
      discountData.discountType === "fixed_bundle_price"
    ) {
      AppLogger.debug(
        "[FIXED_BUNDLE_PRICE] Storing fixed bundle price (will be converted at runtime)",
      );

      // For fixed_bundle_price, keep the target bundle price in cents.
      // The pricing editor stores the current target price in discountValue.
      const processedRules = (discountData.discountRules || []).map(
        (rule: any) => {
          const fixedPrice = Number(rule.discountValue ?? 0) || 0;
          AppLogger.debug(
            `[FIXED_BUNDLE_PRICE] Rule fixed price: ${fixedPrice}`,
          );

          // Store the fixed price in a dedicated field for runtime calculation
          return {
            ...rule,
            fixedBundlePrice: fixedPrice, // The target bundle price
          };
        },
      );

      discountData.discountRules = processedRules;
      AppLogger.debug(
        "[FIXED_BUNDLE_PRICE] Stored fixed price for runtime calculation:",
        processedRules,
      );
    }

    const normalizedPricingDisplayOptions = normalizePricingDisplayOptions({
      rules: discountData.discountRules || [],
      messages: { displayOptions: discountData.displayOptions || null },
      showProgressBar:
        discountData.displayOptions?.progressBar?.enabled === true,
      method: discountData.discountType,
    });
    const parsedBundleSettings = parsePPBBundleSettings(formData);
    const quantityValidationEnabled =
      parsedBundleSettings.validateQuantityPerProduct?.isEnabled === true;
    const directBoxSelection =
      discountData.discountEnabled === true &&
      discountData.discountType !== "buy_x_get_y"
        ? serializeBoxSelectionFromPricingDisplayOptions(
            normalizedPricingDisplayOptions,
          )
        : null;
    const boxSelection = directBoxSelection
      ? {
          ...directBoxSelection,
          validateBoxSelectionQuantity: quantityValidationEnabled,
        }
      : null;
    const pricingMessages = {
      showDiscountDisplay: true,
      showDiscountMessaging: discountData.discountMessagingEnabled || false,
      ruleMessages: discountData.ruleMessages || {},
      successMessage: discountData.successMessage ?? null,
      successMessageByLocale: discountData.successMessageByLocale ?? null,
      displayOptions: discountData.displayOptions ?? null,
      tierTextByRuleId: discountData.tierTextByRuleId ?? null,
      tierTextByLocaleByRuleId: discountData.tierTextByLocaleByRuleId ?? null,
    };

    // Automatically set status to 'active' if bundle has configured steps
    let finalStatus = bundleStatus as BundleStatus;
    if (
      bundleStatus === BundleStatus.DRAFT &&
      stepsData &&
      stepsData.length > 0
    ) {
      const hasConfiguredSteps = stepsData.some(
        (step: any) =>
          (step.StepProduct && step.StepProduct.length > 0) ||
          (step.collections && step.collections.length > 0) ||
          (Array.isArray(step.StepCategory) &&
            step.StepCategory.some(
              (cat: any) =>
                (cat.products && cat.products.length > 0) ||
                (cat.collections && cat.collections.length > 0),
            )),
      );
      AppLogger.debug("[BUNDLE_CONFIG] Status evaluation:", {
        originalStatus: bundleStatus,
        hasConfiguredSteps,
        stepsCount: stepsData.length,
      });
      if (hasConfiguredSteps) {
        finalStatus = BundleStatus.ACTIVE;
        AppLogger.debug(
          "[BUNDLE_CONFIG] Auto-activating bundle with configured steps",
        );
      }
    }

    // Get existing bundle to preserve shopifyProductId/Handle if not provided
    const existingBundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      select: { shopifyProductId: true, shopifyProductHandle: true },
    });

    // Update bundle in database
    AppLogger.debug("[BUNDLE_CONFIG] Updating bundle in database");
    const updatedBundle = await db.bundle.update({
      where: {
        id: bundleId,
        shopId: session.shop,
      },
      data: {
        name: bundleName,
        description: bundleDescription,
        status: finalStatus,
        // Preserve existing shopifyProductId/Handle if not provided in form
        shopifyProductId:
          bundleProductData?.id || existingBundle?.shopifyProductId || null,
        shopifyProductHandle:
          bundleProductData?.handle ||
          existingBundle?.shopifyProductHandle ||
          null,
        templateName: templateName,
        loadingGif: loadingGif,
        showProductPrices,
        showCompareAtPrices,
        cartRedirectToCheckout,
        allowQuantityChanges,
        sdkMode,
        textOverrides,
        textOverridesByLocale,
        ...parsePPBBundleVisibility(formData),
        ...parsedBundleSettings,
        boxSelection,
        // Update steps if provided
        ...(stepsData && {
          steps: {
            deleteMany: {},
            create: stepsData.map((step: any, index: number) => {
              // Get conditions for this step from stepConditionsData
              const stepConditions = stepConditionsData[step.id] || [];
              const firstCondition =
                stepConditions.length > 0 ? stepConditions[0] : null;
              const secondCondition =
                stepConditions.length > 1 ? stepConditions[1] : null;
              AppLogger.debug(
                `[DEBUG] Step ${step.id} conditions:`,
                stepConditions,
              );
              AppLogger.debug(
                `[DEBUG] Step ${step.id} first condition:`,
                firstCondition,
              );
              AppLogger.debug(
                `[DEBUG] Will save to DB - conditionType: ${firstCondition?.type || null}, conditionOperator: ${firstCondition?.operator || null}, conditionValue: ${firstCondition?.value ? parseInt(firstCondition.value) || null : null}`,
              );

              return {
                name: step.name,
                pageTitle: step.pageTitle ?? null,
                multiLangData: step.multiLangData ?? null,
                position: index + 1, // Map stepNumber to position field
                products: step.products || [],
                collections: step.collections || [],
                displayVariantsAsIndividual:
                  step.displayVariantsAsIndividualProducts || false,
                minQuantity: parseInt(step.minQuantity) || 1,
                maxQuantity: parseInt(step.maxQuantity) || 1,
                enabled: step.enabled !== false, // Default to true unless explicitly false
                // Free gift / add-on step fields
                isFreeGift: step.isFreeGift === true,
                freeGiftName: step.freeGiftName || null,
                addonLabel: step.addonLabel ?? null,
                addonTitle: step.addonTitle ?? null,
                addonAddText: step.addonAddText ?? null,
                addonReplaceText: step.addonReplaceText ?? null,
                addonIconUrl: step.addonIconUrl ?? null,
                addonDisplayFree: step.addonDisplayFree === true,
                addonUnlockAfterCompletion:
                  step.addonUnlockAfterCompletion !== false,
                isDefault: step.isDefault === true,
                defaultVariantId: step.defaultVariantId || null,
                // Apply condition data if available
                conditionType: firstCondition?.type || null,
                conditionOperator: firstCondition?.operator || null,
                conditionValue: parseConditionValue(firstCondition?.value),
                conditionOperator2: secondCondition?.operator || null,
                conditionValue2: parseConditionValue(secondCondition?.value),
                filters: Array.isArray(step.filters) ? step.filters : null,
                imageUrl: step.imageUrl ?? null,
                bannerImageUrl: step.bannerImageUrl ?? null,
                timelineIconUrl: step.stepImage ?? null,
                // Create StepProduct records for selected products
                StepProduct: {
                  create: (step.StepProduct || []).map(
                    (product: any, productIndex: number) => {
                      // IDs already validated and normalised at the boundary above
                      return {
                        productId: product.id,
                        title:
                          product.title || product.name || "Unnamed Product",
                        imageUrl:
                          product.imageUrl ||
                          product.images?.[0]?.originalSrc ||
                          product.images?.[0]?.url ||
                          product.image?.url ||
                          null,
                        variants: product.variants || null,
                        minQuantity: parseInt(product.minQuantity) || 1,
                        maxQuantity: parseInt(product.maxQuantity) || 10,
                        position: productIndex + 1,
                      };
                    },
                  ),
                },
                // Create StepCategory records for merchant-defined categories
                StepCategory: {
                  create: Array.isArray(step.StepCategory)
                    ? step.StepCategory.map(
                        (cat: Record<string, unknown>, catIndex: number) =>
                          buildStepCategoryCreateInput(cat, catIndex),
                      )
                    : [],
                },
              };
            }),
          },
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
                displayOptions: discountData.displayOptions ?? null,
                messages: pricingMessages,
                ruleMessagesByLocale: discountData.ruleMessagesByLocale ?? null,
              },
              update: {
                enabled: discountData.discountEnabled,
                method: mapDiscountMethod(discountData.discountType),
                rules: discountData.discountRules || [],
                showFooter: discountData.showFooter !== false,
                displayOptions: discountData.displayOptions ?? null,
                messages: pricingMessages,
                ruleMessagesByLocale: discountData.ruleMessagesByLocale ?? null,
              },
            },
          },
        }),
      },
      include: {
        steps: {
          include: {
            StepProduct: true,
            StepCategory: { orderBy: { sortOrder: "asc" } },
          },
        },
        pricing: true,
      },
    });

    await syncBundleStorefrontNow({
      admin,
      shopDomain: session.shop,
      bundleId,
      bundleType: "product_page",
      reason: "save",
    });

    return json({
      success: true,
      statusCode: 200,
      bundle: compactBundleForConfigureResponse(updatedBundle),
      message: "Updated Successfully!",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : ERROR_MESSAGES.FAILED_TO_SAVE_CONFIGURATION;
    AppLogger.error(
      "[BUNDLE_CONFIG] Error saving bundle:",
      { component: "handlers.server", bundleId },
      error,
    );
    return json({ success: false, error: message }, { status: 500 });
  }
}
