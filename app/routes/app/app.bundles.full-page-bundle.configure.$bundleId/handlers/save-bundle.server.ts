import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import db from "../../../../db.server";
import { processCss } from "../../../../lib/css-sanitizer";
import { mapDiscountMethod } from "../../../../utils/discount-mappers";
import { normaliseShopifyProductId } from "../../../../services/bundles/bundle-configure-handlers.server";
import { BundleStatus, FullPageLayout } from "../../../../constants/bundle";
import { buildStepCategoryCreateInput } from "../../../../lib/bundle-config/category-persistence";
import {
  normalizePricingDisplayOptions,
  serializeBoxSelectionFromPricingDisplayOptions,
} from "../../../../lib/pricing-display-options";
import { parseConditionValue } from "../../../../lib/parse-condition-value";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import { parseIndividualSellingPlanSelection } from "./shared.server";
import { syncSavedFpbBundleStorefrontState } from "./save-metafields.server";

/**
 * Handle saving bundle configuration
 */
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
    // Parse form data
    const bundleName = formData.get("bundleName") as string;
    const bundleDescription = formData.get("bundleDescription") as string;
    const bundleStatus = formData.get("bundleStatus") as string;
    const templateName = (formData.get("templateName") as string) || null;
    const fullPageLayout =
      (formData.get("fullPageLayout") as string) ||
      FullPageLayout.FOOTER_BOTTOM;
    const promoBannerBgImageRaw = formData.get("promoBannerBgImage") as string;
    const promoBannerBgImage = promoBannerBgImageRaw || null;
    const loadingGifRaw = formData.get("loadingGif") as string;
    const loadingGif = loadingGifRaw || null;
    const searchBarEnabled = formData.get("searchBarEnabled") === "true";
    const showStepTimelineRaw = formData.get("showStepTimeline") as
      | string
      | null;
    // Parse: "true" → true, "false" → false, null/missing → null
    const showStepTimelineParsed: boolean | null =
      showStepTimelineRaw === "true"
        ? true
        : showStepTimelineRaw === "false"
          ? false
          : null;
    const floatingBadgeEnabled =
      formData.get("floatingBadgeEnabled") === "true";
    const floatingBadgeTextRaw =
      (formData.get("floatingBadgeText") as string) ?? "";
    const floatingBadgeText = floatingBadgeTextRaw.slice(0, 60);
    const showProductPrices = formData.get("showProductPrices") !== "false";
    const showCompareAtPrices = formData.get("showCompareAtPrices") === "true";
    const cartRedirectToCheckout =
      formData.get("cartRedirectToCheckout") === "true";
    const allowQuantityChanges =
      formData.get("allowQuantityChanges") !== "false";
    const variantSelectorEnabled =
      formData.get("variantSelectorEnabled") !== "false";
    const showTextOnAddButton = formData.get("showTextOnAddButton") === "true";
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
    const bundleTextConfigRaw = formData.get("bundleTextConfig") as
      | string
      | null;
    const bundleTextConfig = bundleTextConfigRaw
      ? JSON.parse(bundleTextConfigRaw)
      : null;
    const personalizationDataRaw = formData.get("personalizationData") as
      | string
      | null;
    const personalizationData = personalizationDataRaw
      ? JSON.parse(personalizationDataRaw)
      : null;
    const bundleUpsellConfigRaw = formData.get("bundleUpsellConfig") as
      | string
      | null;
    const bundleUpsellConfig = bundleUpsellConfigRaw
      ? JSON.parse(bundleUpsellConfigRaw)
      : null;
    const upsellWidgetEnabled = formData.get("upsellWidgetEnabled") === "true";
    const upsellWidgetDisplayMode =
      (formData.get("upsellWidgetDisplayMode") as string | null) ?? "block";
    const upsellWidgetDisplayOn =
      (formData.get("upsellWidgetDisplayOn") as string | null) ?? "all";
    const autoSelectBrowsedProduct =
      formData.get("autoSelectBrowsedProduct") === "true";
    const bundleBannerDesktopUrlRaw = formData.get("bundleBannerDesktopUrl") as
      | string
      | null;
    const bundleBannerDesktopUrl = bundleBannerDesktopUrlRaw || null;
    const bundleBannerMobileUrlRaw = formData.get("bundleBannerMobileUrl") as
      | string
      | null;
    const bundleBannerMobileUrl = bundleBannerMobileUrlRaw || null;
    const bundleLevelCssRaw = formData.get("bundleLevelCss") as string | null;
    const bundleLevelCssInput =
      typeof bundleLevelCssRaw === "string" ? bundleLevelCssRaw : "";
    const { sanitizedCss: sanitizedBundleLevelCss } =
      processCss(bundleLevelCssInput);
    const bundleLevelCss = sanitizedBundleLevelCss.trim() || null;
    const productSlotsEnabled = formData.get("productSlotsEnabled") === "true";
    const maxQtyPerProductRaw = formData.get("maxQtyPerProduct") as
      | string
      | null;
    const maxQtyPerProduct = maxQtyPerProductRaw
      ? parseInt(maxQtyPerProductRaw, 10) || null
      : null;
    const productSlotIconUrlRaw = formData.get("productSlotIconUrl") as
      | string
      | null;
    const productSlotIconUrl = productSlotIconUrlRaw || null;
    const validateQuantityPerProductRaw = formData.get(
      "validateQuantityPerProduct",
    ) as string | null;
    const validateQuantityPerProduct = validateQuantityPerProductRaw
      ? JSON.parse(validateQuantityPerProductRaw)
      : { isEnabled: false, allowedQuantity: 1 };
    const individualSellingPlanSelection =
      parseIndividualSellingPlanSelection(formData);
    const defaultProductsDataRaw = formData.get("defaultProductsData") as
      | string
      | null;
    const defaultProductsData = defaultProductsDataRaw
      ? JSON.parse(defaultProductsDataRaw)
      : null;
    const quantityValidationEnabled =
      validateQuantityPerProduct?.isEnabled === true;
    const stepsData = JSON.parse(formData.get("stepsData") as string);
    const discountData = JSON.parse(formData.get("discountData") as string);
    const stepConditionsData = formData.get("stepConditions")
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

      // For fixed_bundle_price, keep the original price value in a special field
      // The cart transform will read this and calculate discount based on actual cart total
      const processedRules = (discountData.discountRules || []).map(
        (rule: any) => {
          const fixedPrice = parseFloat(rule.price || 0);
          AppLogger.debug(
            `[FIXED_BUNDLE_PRICE] Rule fixed price: ${fixedPrice}`,
          );

          // Store the fixed price in a dedicated field for runtime calculation
          return {
            ...rule,
            fixedBundlePrice: fixedPrice, // The target bundle price
            // Don't set discountValue here - it will be calculated at runtime
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
      messages: { displayOptions: discountData.pricingDisplayOptions || null },
      showProgressBar: discountData.showDiscountProgressBar === true,
      method: discountData.discountType,
    });
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

    // Automatically set status to 'active' if bundle has configured steps
    let finalStatus = bundleStatus as any;
    if (
      bundleStatus === BundleStatus.DRAFT &&
      stepsData &&
      stepsData.length > 0
    ) {
      const hasConfiguredSteps = stepsData.some((step: any) => {
        const hasCategoryContent =
          Array.isArray(step.StepCategory) &&
          step.StepCategory.some(
            (category: any) =>
              (Array.isArray(category.products) &&
                category.products.length > 0) ||
              (Array.isArray(category.selectedProducts) &&
                category.selectedProducts.length > 0) ||
              (Array.isArray(category.collections) &&
                category.collections.length > 0) ||
              (Array.isArray(category.collectionsData) &&
                category.collectionsData.length > 0) ||
              (Array.isArray(category.collectionsSelectedData) &&
                category.collectionsSelectedData.length > 0),
          );

        return (
          (Array.isArray(step.StepProduct) && step.StepProduct.length > 0) ||
          (Array.isArray(step.collections) && step.collections.length > 0) ||
          hasCategoryContent
        );
      });
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

    // Get existing bundle to preserve shopifyProductId if not provided
    const existingBundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      select: { shopifyProductId: true },
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
        // Preserve existing shopifyProductId if not provided in form
        shopifyProductId:
          bundleProductData?.id || existingBundle?.shopifyProductId || null,
        templateName: templateName,
        fullPageLayout: fullPageLayout as any,
        promoBannerBgImage: promoBannerBgImage,
        loadingGif: loadingGif,
        showStepTimeline: showStepTimelineParsed,
        floatingBadgeEnabled,
        floatingBadgeText,
        showProductPrices,
        showCompareAtPrices,
        cartRedirectToCheckout,
        allowQuantityChanges,
        variantSelectorEnabled,
        showTextOnAddButton,
        searchBarEnabled,
        textOverrides,
        textOverridesByLocale,
        bundleTextConfig,
        personalizationData,
        boxSelection,
        bundleUpsellConfig,
        upsellWidgetEnabled,
        upsellWidgetDisplayMode,
        upsellWidgetDisplayOn,
        autoSelectBrowsedProduct,
        bundleBannerDesktopUrl,
        bundleBannerMobileUrl,
        bundleLevelCss,
        productSlotsEnabled,
        maxQtyPerProduct,
        productSlotIconUrl,
        validateQuantityPerProduct,
        individualSellingPlanSelection,
        ...(defaultProductsData !== null && { defaultProductsData }),
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
                position: index + 1, // Map stepNumber to position field
                products: step.products || [],
                collections: step.collections || [],
                displayVariantsAsIndividual:
                  step.displayVariantsAsIndividual ?? false,
                minQuantity: parseInt(step.minQuantity) || 1,
                maxQuantity: parseInt(step.maxQuantity) || 1,
                enabled: step.enabled !== false, // Default to true unless explicitly false
                multiLangData: step.multiLangData ?? null,
                // Free gift / add-on step fields
                isFreeGift: step.isFreeGift === true,
                freeGiftName: step.freeGiftName || null,
                addonLabel: step.addonLabel ?? null,
                addonTitle: step.addonTitle ?? null,
                addonAddText: step.addonAddText ?? null,
                addonReplaceText: step.addonReplaceText ?? null,
                addonIconUrl: step.addonIconUrl ?? null,
                addonDisplayFree: step.addonDisplayFree === true,
                addonTiers: Array.isArray(step.addonTiers)
                  ? step.addonTiers
                  : null,
                addonUnlockAfterCompletion:
                  step.addonUnlockAfterCompletion !== false,
                isDefault: step.isDefault === true,
                defaultVariantId: step.defaultVariantId || null,
                // Step image fields
                imageUrl: step.imageUrl ?? null,
                bannerImageUrl: step.bannerImageUrl ?? null,
                timelineIconUrl: step.stepImage ?? null,
                pageTitle: step.pageTitle ?? null,
                // Category filter tabs configured by merchant
                filters: Array.isArray(step.filters) ? step.filters : null,
                // Apply condition data if available
                conditionType: firstCondition?.type || null,
                conditionOperator: firstCondition?.operator || null,
                conditionValue: parseConditionValue(firstCondition?.value),
                conditionOperator2: secondCondition?.operator || null,
                conditionValue2: parseConditionValue(secondCondition?.value),
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
                showProgressBar: discountData.showDiscountProgressBar === true,
                messages: {
                  showDiscountDisplay: true,
                  showDiscountMessaging:
                    discountData.discountMessagingEnabled || false,
                  ruleMessages: discountData.ruleMessages || {},
                  displayOptions: discountData.pricingDisplayOptions || null,
                  tierTextByRuleId: discountData.tierTextByRuleId || null,
                  tierTextByLocaleByRuleId:
                    discountData.tierTextByLocaleByRuleId || null,
                },
                ruleMessagesByLocale: discountData.ruleMessagesByLocale ?? null,
              },
              update: {
                enabled: discountData.discountEnabled,
                method: mapDiscountMethod(discountData.discountType),
                rules: discountData.discountRules || [],
                showFooter: discountData.showFooter !== false,
                showProgressBar: discountData.showDiscountProgressBar === true,
                messages: {
                  showDiscountDisplay: true,
                  showDiscountMessaging:
                    discountData.discountMessagingEnabled || false,
                  ruleMessages: discountData.ruleMessages || {},
                  displayOptions: discountData.pricingDisplayOptions || null,
                  tierTextByRuleId: discountData.tierTextByRuleId || null,
                  tierTextByLocaleByRuleId:
                    discountData.tierTextByLocaleByRuleId || null,
                },
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

    await syncSavedFpbBundleStorefrontState({
      admin,
      bundleId,
      directBoxSelection,
      discountData,
      finalStatus: finalStatus as BundleStatus,
      stepConditionsData,
      stepsData,
      updatedBundle,
    });

    // BUNDLE INDEX: No longer needed
    // Cart transform now queries variant metafields directly (Shopify Standard)
    // Shop-level bundle index has been removed for better performance and simplicity

    // Note: Widget now only displays when manually added to theme via app blocks
    // Merchants add the bundle-builder block through the theme editor (guided by onboarding flow)
    // Auto-injection removed to comply with Shopify App Store requirements

    return json({
      success: true,
      bundle: updatedBundle,
      message: "Bundle configuration saved successfully",
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
