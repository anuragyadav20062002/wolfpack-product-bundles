import { useCallback } from "react";
import { AppLogger } from "../../../lib/logger";
import { DiscountMethod } from "../../../types/pricing";
import { normalizeDefaultProductsData } from "../../../lib/bundle-config/default-products";
import { buildVisibilityDisplayConfiguration } from "./ConfigureBundleFlow.helpers";

export function usePpbSaveHandlers({
  base,
  visibility,
  display,
  settings,
}: {
  base: any;
  visibility: any;
  display: any;
  settings: any;
}) {
  const buildDefaultProductsData = useCallback(() => {
    return normalizeDefaultProductsData(settings.defaultProductsData);
  }, [settings.defaultProductsData]);

  const buildBundleUpsellConfig = useCallback(() => {
    return {
      multiLangText: visibility.savedBundleUpsellConfig?.multiLangText ?? {},
      widgetConfiguration: {
        isEnabled: visibility.upsellWidgetEnabled,
        type: "OFFER_WIDGET",
        imageUrl: visibility.upsellWidgetImageUrl,
        title: visibility.upsellWidgetTitle,
        description: visibility.upsellWidgetDescription,
        buttonText: visibility.upsellWidgetButtonText,
        displayConfiguration: buildVisibilityDisplayConfiguration(
          visibility.upsellWidgetDisplayOn,
          visibility.upsellWidgetSelectedProducts,
          visibility.upsellWidgetSpecificProductPages,
          visibility.upsellWidgetCollectionsSelectedData,
          visibility.upsellWidgetSpecificCollectionPages,
        ),
        useLinkProductAsDefaultProduct: visibility.autoSelectBrowsedProduct,
      },
      upsellConfiguration: {
        isEnabled: visibility.bundleEmbedEnabled,
        title: visibility.bundleEmbedTitle,
        subTitle: visibility.bundleEmbedSubTitle,
        displayConfiguration: buildVisibilityDisplayConfiguration(
          visibility.bundleEmbedDisplayOn,
          visibility.bundleEmbedSelectedProducts,
          visibility.bundleEmbedSpecificProductPages,
          visibility.bundleEmbedCollectionsSelectedData,
          visibility.bundleEmbedSpecificCollectionPages,
        ),
        useLinkProductAsDefaultProduct: visibility.bundleEmbedAddBrowsedProduct,
      },
    };
  }, [
    visibility.autoSelectBrowsedProduct,
    visibility.bundleEmbedAddBrowsedProduct,
    visibility.bundleEmbedCollectionsSelectedData,
    visibility.bundleEmbedDisplayOn,
    visibility.bundleEmbedEnabled,
    visibility.bundleEmbedSelectedProducts,
    visibility.bundleEmbedSpecificCollectionPages,
    visibility.bundleEmbedSpecificProductPages,
    visibility.bundleEmbedSubTitle,
    visibility.bundleEmbedTitle,
    visibility.savedBundleUpsellConfig?.multiLangText,
    visibility.upsellWidgetButtonText,
    visibility.upsellWidgetCollectionsSelectedData,
    visibility.upsellWidgetDescription,
    visibility.upsellWidgetDisplayOn,
    visibility.upsellWidgetEnabled,
    visibility.upsellWidgetImageUrl,
    visibility.upsellWidgetSelectedProducts,
    visibility.upsellWidgetSpecificCollectionPages,
    visibility.upsellWidgetSpecificProductPages,
    visibility.upsellWidgetTitle,
  ]);

  const handleSave = useCallback(async () => {
    try {
      const formData = new FormData();
      formData.append("intent", "saveBundle");
      formData.append("bundleName", base.formState.bundleName);
      formData.append("bundleDescription", base.formState.bundleDescription);
      formData.append("templateName", base.formState.templateName);
      formData.append("bundleStatus", base.formState.bundleStatus);
      const stepsWithCollections = base.stepsState.steps.map((step: any) => ({
        ...step,
        collections:
          base.selectedCollections[step.id] || step.collections || [],
      }));
      formData.append("stepsData", JSON.stringify(stepsWithCollections));
      const enrichedRuleMessages = Object.fromEntries(
        Object.entries(base.ruleMessages).map(([id, msg]: [string, any]) => [
          id,
          {
            ...msg,
            successMessage: display.globalSuccessMessage || msg.successMessage,
          },
        ]),
      );
      formData.append(
        "discountData",
        JSON.stringify({
          discountEnabled: base.pricingState.discountEnabled,
          discountType: base.pricingState.discountType,
          discountRules: base.pricingState.discountRules,
          showFooter: base.pricingState.showFooter,
          discountMessagingEnabled: base.pricingState.discountMessagingEnabled,
          ruleMessages: enrichedRuleMessages,
          successMessage: display.globalSuccessMessage,
          successMessageByLocale: display.discountMessagingMultiLanguageEnabled
            ? display.successMessageByLocale
            : null,
          discountMessagingMultiLanguageEnabled:
            display.discountMessagingMultiLanguageEnabled,
          ruleMessagesByLocale: display.discountMessagingMultiLanguageEnabled
            ? display.ruleMessagesByLocale
            : null,
          tierTextByRuleId:
            Object.keys(display.tierTextByRuleId).length > 0
              ? display.tierTextByRuleId
              : null,
          tierTextByLocaleByRuleId:
            Object.keys(display.tierTextByLocaleByRuleId).length > 0
              ? display.tierTextByLocaleByRuleId
              : null,
          displayOptions: {
            bundleQuantityOptions: {
              enabled: display.qtyOptionsEnabled,
              defaultRuleId: display.qtyOptionsDefaultRuleId,
              optionsByRuleId: Object.fromEntries(
                base.pricingState.discountRules.map((r: any) => [
                  r.id,
                  {
                    label:
                      display.qtyRuleLabels[r.id] ??
                      `Box of ${r.conditionValue ?? ""}`,
                    subtext: display.qtyRuleSubtexts[r.id] ?? "",
                  },
                ]),
              ),
              optionsByLocaleByRuleId: display.qtyRuleTextsByLocaleByRuleId,
            },
            progressBar: {
              enabled: display.progressBarEnabled,
              type: display.progressBarType,
              progressText: display.progressBarProgressText,
              successText: display.progressBarSuccessText,
            },
          },
        }),
      );
      formData.append(
        "stepConditions",
        JSON.stringify(base.conditionsState.stepConditions),
      );
      formData.append("bundleProduct", JSON.stringify(base.bundleProduct));
      formData.append("loadingGif", base.loadingGif ?? "");
      formData.append("showProductPrices", String(base.showProductPrices));
      formData.append("showCompareAtPrices", String(base.showCompareAtPrices));
      formData.append(
        "cartRedirectToCheckout",
        String(base.cartRedirectToCheckout),
      );
      formData.append(
        "allowQuantityChanges",
        String(base.allowQuantityChanges),
      );
      formData.append("sdkMode", String(base.sdkMode));
      formData.append(
        "textOverrides",
        Object.keys(base.textOverrides).length > 0
          ? JSON.stringify(base.textOverrides)
          : "",
      );
      formData.append(
        "textOverridesByLocale",
        Object.keys(base.textOverridesByLocale).length > 0
          ? JSON.stringify(base.textOverridesByLocale)
          : "",
      );
      formData.append(
        "upsellWidgetEnabled",
        String(visibility.upsellWidgetEnabled),
      );
      formData.append(
        "upsellWidgetDisplayMode",
        visibility.upsellWidgetDisplayMode,
      );
      formData.append(
        "upsellWidgetDisplayOn",
        visibility.upsellWidgetDisplayOn,
      );
      formData.append(
        "autoSelectBrowsedProduct",
        String(visibility.autoSelectBrowsedProduct),
      );
      formData.append(
        "preSelectedProductVariantId",
        settings.preSelectedProductVariantId,
      );
      formData.append("maxQtyPerProduct", settings.maxQtyPerProduct);
      formData.append(
        "variantSelectorEnabled",
        String(settings.variantSelectorEnabled),
      );
      formData.append(
        "showTextOnAddButton",
        String(settings.showTextOnAddButton),
      );
      formData.append("bundleCartTitle", settings.bundleCartTitle);
      formData.append("bundleCartSubtitle", settings.bundleCartSubtitle);
      formData.append(
        "bundleBannerDesktopUrl",
        settings.bundleBannerDesktopUrl,
      );
      formData.append("bundleBannerMobileUrl", settings.bundleBannerMobileUrl);
      formData.append("bundleLevelCss", settings.bundleLevelCss);
      formData.append(
        "defaultProductsData",
        JSON.stringify(buildDefaultProductsData()),
      );
      formData.append(
        "validateQuantityPerProduct",
        JSON.stringify({
          isEnabled: settings.quantityValidationEnabled,
          allowedQuantity:
            Number.parseInt(settings.maxQtyPerProduct || "1", 10) || 1,
        }),
      );
      formData.append(
        "individualSellingPlanSelection",
        JSON.stringify({
          isEnabled:
            base.pricingState.discountType === DiscountMethod.BUY_X_GET_Y
              ? false
              : settings.individualSellingPlanEnabled,
          showFor: settings.individualSellingPlanShowFor,
        }),
      );
      formData.append(
        "bundleTextConfig",
        JSON.stringify({
          bundleSummary: {
            title: settings.bundleCartTitle,
            subTitle: settings.bundleCartSubtitle,
          },
        }),
      );
      formData.append(
        "boxSelection",
        (base.bundle as any).boxSelection
          ? JSON.stringify((base.bundle as any).boxSelection)
          : "",
      );
      formData.append(
        "bundleUpsellConfig",
        JSON.stringify(buildBundleUpsellConfig()),
      );
      formData.append(
        "discountDisplayOverride",
        (base.bundle as any).discountDisplayOverride
          ? JSON.stringify((base.bundle as any).discountDisplayOverride)
          : "",
      );
      formData.append(
        "useSingleStepCategoriesAsBundleSteps",
        String(
          (base.bundle as any).useSingleStepCategoriesAsBundleSteps ?? false,
        ),
      );
      base.fetcher.submit(formData, { method: "post" });
      return;
    } catch (error) {
      AppLogger.error("Save failed:", {}, error as any);
      base.shopify.toast.show(
        (error as Error).message || "Failed to save changes",
        {
          isError: true,
          duration: 5000,
        },
      );
    }
  }, [
    base,
    buildBundleUpsellConfig,
    buildDefaultProductsData,
    display,
    settings,
    visibility,
  ]);

  const handleDiscard = useCallback(() => {
    base.hookHandleDiscard();
    base.setLoadingGif(base.originalLoadingGifRef.current);
    base.setShowProductPrices(base.originalShowProductPricesRef.current);
    base.setShowCompareAtPrices(base.originalShowCompareAtPricesRef.current);
    base.setCartRedirectToCheckout(
      base.originalCartRedirectToCheckoutRef.current,
    );
    base.setAllowQuantityChanges(base.originalAllowQuantityChangesRef.current);
    base.setSdkMode(base.originalSdkModeRef.current);
    base.setTextOverrides(base.originalTextOverridesRef.current);
    base.setTextOverridesByLocale(
      base.originalTextOverridesByLocaleRef.current,
    );
    settings.setDefaultProductsData(
      settings.originalDefaultProductsDataRef.current,
    );
    visibility.setUpsellWidgetEnabled(
      visibility.originalUpsellWidgetEnabledRef.current,
    );
    visibility.setUpsellWidgetDisplayMode(
      visibility.originalUpsellWidgetDisplayModeRef.current,
    );
    visibility.setUpsellWidgetDisplayOn(
      visibility.originalUpsellWidgetDisplayOnRef.current,
    );
    visibility.setUpsellWidgetTitle(
      visibility.originalUpsellWidgetTitleRef.current,
    );
    visibility.setUpsellWidgetDescription(
      visibility.originalUpsellWidgetDescriptionRef.current,
    );
    visibility.setUpsellWidgetButtonText(
      visibility.originalUpsellWidgetButtonTextRef.current,
    );
    visibility.setUpsellWidgetImageUrl(
      visibility.originalUpsellWidgetImageUrlRef.current,
    );
    visibility.setAutoSelectBrowsedProduct(
      visibility.originalAutoSelectBrowsedProductRef.current,
    );
    visibility.setBundleEmbedEnabled(
      visibility.originalBundleEmbedEnabledRef.current,
    );
    visibility.setBundleEmbedTitle(
      visibility.originalBundleEmbedTitleRef.current,
    );
    visibility.setBundleEmbedSubTitle(
      visibility.originalBundleEmbedSubTitleRef.current,
    );
    visibility.setBundleEmbedDisplayOn(
      visibility.originalBundleEmbedDisplayOnRef.current,
    );
    visibility.setBundleEmbedAddBrowsedProduct(
      visibility.originalBundleEmbedAddBrowsedProductRef.current,
    );
  }, [base, settings, visibility]);

  return {
    buildDefaultProductsData,
    buildBundleUpsellConfig,
    handleSave,
    handleDiscard,
  };
}
