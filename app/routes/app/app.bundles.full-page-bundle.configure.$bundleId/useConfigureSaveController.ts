import { useCallback, useEffect } from "react";
import { AppLogger } from "../../../lib/logger";
import { serializePricingDisplayOptions } from "../../../lib/pricing-display-options";
import { markBundlePreviewComplete } from "../../../lib/bundle-preview-readiness";
import { DiscountMethod } from "../../../types/pricing";
import { ADDON_MESSAGE_KEY } from "./configure-constants";
import type { ConfigureBundleFlowDraft } from "./configure-flow-types";
import { serializeFpbSaveSteps } from "./fpb-save-transport";

export function useConfigureSaveController(flow: ConfigureBundleFlowDraft) {
  const buildDefaultProductsData = useCallback(() => {
    return flow.normalizeDefaultProductsData(flow.defaultProductsData);
  }, [flow]);
  const closeDiscardModal = useCallback(() => {
    flow.setShowDiscardModal(false);
  }, [flow]);
  const handleSave = useCallback(async () => {
    try {
      const formData = new FormData();
      formData.append("intent", "saveBundle");
      formData.append("bundleName", flow.formState.bundleName);
      formData.append("bundleDescription", flow.formState.bundleDescription);
      formData.append("templateName", flow.formState.templateName);
      formData.append("bundleStatus", flow.formState.bundleStatus);
      const pricingMessages = serializePricingDisplayOptions({
        existingMessages: {
          showDiscountMessaging: flow.pricingState.discountMessagingEnabled,
          ruleMessages: flow.normalizedRuleMessages,
        },
        options: flow.normalizedPricingDisplayOptions,
      });
      formData.append(
        "stepsData",
        JSON.stringify(
          serializeFpbSaveSteps(flow.stepsState.steps, flow.selectedCollections),
        ),
      );
      const enrichedRuleMessages = Object.fromEntries(
        Object.entries(flow.normalizedRuleMessages).map(([id, msg]: any) => [
          id,
          {
            ...msg,
            successMessage: flow.globalSuccessMessage || msg.successMessage,
          },
        ]),
      );
      formData.append(
        "discountData",
        JSON.stringify({
          discountEnabled: flow.pricingState.discountEnabled,
          discountType: flow.pricingState.discountType,
          discountRules: flow.pricingState.discountRules,
          showFooter: flow.pricingState.showFooter,
          showDiscountProgressBar: flow.pricingState.showDiscountProgressBar,
          discountMessagingEnabled: flow.pricingState.discountMessagingEnabled,
          ruleMessages: enrichedRuleMessages,
          successMessage: flow.globalSuccessMessage,
          successMessageByLocale: flow.discountMessagingMultiLanguageEnabled
            ? flow.successMessageByLocale
            : null,
          pricingDisplayOptions: pricingMessages.displayOptions,
          discountMessagingMultiLanguageEnabled:
            flow.discountMessagingMultiLanguageEnabled,
          ruleMessagesByLocale: flow.discountMessagingMultiLanguageEnabled
            ? flow.ruleMessagesByLocale
            : null,
          tierTextByRuleId:
            Object.keys(flow.tierTextByRuleId).length > 0
              ? flow.tierTextByRuleId
              : null,
          tierTextByLocaleByRuleId:
            Object.keys(flow.tierTextByLocaleByRuleId).length > 0
              ? flow.tierTextByLocaleByRuleId
              : null,
        }),
      );
      formData.append(
        "stepConditions",
        JSON.stringify(flow.conditionsState.stepConditions),
      );
      formData.append("bundleProduct", JSON.stringify(flow.bundleProduct));
      formData.append("promoBannerBgImage", flow.promoBannerBgImage ?? "");
      formData.append("loadingGif", flow.loadingGif ?? "");
      formData.append(
        "floatingBadgeEnabled",
        String(flow.floatingBadgeEnabled),
      );
      formData.append("floatingBadgeText", flow.floatingBadgeText);
      formData.append("showProductPrices", String(flow.showProductPrices));
      formData.append("showCompareAtPrices", String(flow.showCompareAtPrices));
      formData.append(
        "cartRedirectToCheckout",
        String(flow.cartRedirectToCheckout),
      );
      formData.append(
        "allowQuantityChanges",
        String(flow.allowQuantityChanges),
      );
      formData.append("searchBarEnabled", String(flow.searchBarEnabled));
      formData.append(
        "variantSelectorEnabled",
        String(flow.variantSelectorEnabled),
      );
      formData.append(
        "showTextOnAddButton",
        String(flow.showTextOnPlusEnabled),
      );
      formData.append(
        "textOverrides",
        Object.keys(flow.textOverrides).length > 0
          ? JSON.stringify(flow.textOverrides)
          : "",
      );
      formData.append(
        "textOverridesByLocale",
        Object.keys(flow.textOverridesByLocale).length > 0
          ? JSON.stringify(flow.textOverridesByLocale)
          : "",
      );
      formData.append(
        "bundleTextConfig",
        JSON.stringify({
          bundleSummary: {
            title: flow.textOverrides.yourBundle ?? "",
            subTitle: flow.textOverrides.reviewBundle ?? "",
          },
        }),
      );
      const addonMessages = flow.ruleMessages[ADDON_MESSAGE_KEY] || null;
      const personalizationData = flow.buildPersonalizationDataFromDraft(
        flow.addonDraft,
        addonMessages,
      );
      formData.append(
        "personalizationData",
        personalizationData ? JSON.stringify(personalizationData) : "",
      );
      formData.append(
        "bundleUpsellConfig",
        JSON.stringify(flow.buildBundleUpsellConfig()),
      );
      formData.append("upsellWidgetEnabled", String(flow.upsellWidgetEnabled));
      formData.append("upsellWidgetDisplayMode", flow.upsellWidgetDisplayMode);
      formData.append("upsellWidgetDisplayOn", flow.upsellWidgetDisplayOn);
      formData.append(
        "autoSelectBrowsedProduct",
        String(flow.autoSelectBrowsedProduct),
      );
      formData.append("bundleBannerDesktopUrl", flow.bundleBannerDesktopUrl);
      formData.append("bundleBannerMobileUrl", flow.bundleBannerMobileUrl);
      formData.append("bundleLevelCss", flow.bundleLevelCss);
      formData.append("productSlotsEnabled", String(flow.productSlotsEnabled));
      formData.append("maxQtyPerProduct", flow.maxQtyPerProduct);
      formData.append("productSlotIconUrl", flow.productSlotIconUrl);
      formData.append(
        "validateQuantityPerProduct",
        JSON.stringify({
          isEnabled: flow.quantityValidationEnabled,
          allowedQuantity:
            Number.parseInt(flow.maxQtyPerProduct || "1", 10) || 1,
        }),
      );
      formData.append(
        "individualSellingPlanSelection",
        JSON.stringify({
          isEnabled:
            flow.pricingState.discountType === DiscountMethod.BUY_X_GET_Y
              ? false
              : flow.individualSellingPlanEnabled,
          showFor: flow.individualSellingPlanShowFor,
        }),
      );
      formData.append(
        "defaultProductsData",
        JSON.stringify(buildDefaultProductsData()),
      );
      flow.fetcher.submit(formData, { method: "post" });
      return;
    } catch (error) {
      AppLogger.error("Save failed:", {}, error as any);
      flow.shopify.toast.show(
        (error as Error).message || "Failed to save changes",
        {
          isError: true,
          duration: 5000,
        },
      );
    }
  }, [buildDefaultProductsData, flow]);

  useEffect(() => {
    if (flow.fetcher.data && flow.fetcher.state === "idle") {
      if (flow.fetcher.data === flow.lastProcessedFetcherDataRef.current) {
        return;
      }
      flow.lastProcessedFetcherDataRef.current = flow.fetcher.data;
      const result = flow.fetcher.data;
      if (result.success) {
        if ("bundle" in result && result.bundle) {
          flow.originalValuesRef.current = {
            status: flow.formState.bundleStatus,
            name: flow.formState.bundleName,
            description: flow.formState.bundleDescription,
            templateName: flow.formState.templateName,
            steps: JSON.stringify(flow.stepsState.steps),
            discountEnabled: flow.pricingState.discountEnabled,
            discountType: flow.pricingState.discountType,
            discountRules: JSON.stringify(flow.pricingState.discountRules),
            showFooter: flow.pricingState.showFooter,
            showDiscountProgressBar: flow.pricingState.showDiscountProgressBar,
            discountMessagingEnabled:
              flow.pricingState.discountMessagingEnabled,
            pricingDisplayOptions: JSON.stringify(
              flow.pricingState.pricingDisplayOptions,
            ),
            selectedCollections: JSON.stringify(flow.selectedCollections),
            ruleMessages: JSON.stringify(flow.normalizedRuleMessages),
            stepConditions: JSON.stringify(flow.conditionsState.stepConditions),
            bundleProduct: flow.bundleProduct || null,
            productStatus: flow.productStatus,
          };
          flow.originalPromoBannerBgImageRef.current = flow.promoBannerBgImage;
          flow.originalLoadingGifRef.current = flow.loadingGif;
          flow.originalShowStepTimelineRef.current = flow.showStepTimeline;
          flow.originalFloatingBadgeEnabledRef.current =
            flow.floatingBadgeEnabled;
          flow.originalFloatingBadgeTextRef.current = flow.floatingBadgeText;
          flow.originalSearchBarEnabledRef.current = flow.searchBarEnabled;
          flow.originalShowProductPricesRef.current = flow.showProductPrices;
          flow.originalShowCompareAtPricesRef.current =
            flow.showCompareAtPrices;
          flow.originalCartRedirectToCheckoutRef.current =
            flow.cartRedirectToCheckout;
          flow.originalAllowQuantityChangesRef.current =
            flow.allowQuantityChanges;
          flow.originalTextOverridesRef.current = flow.textOverrides;
          flow.originalTextOverridesByLocaleRef.current =
            flow.textOverridesByLocale;
          flow.originalAddonDraftRef.current = flow.addonDraft;
          flow.originalDiscountMessagingMultiLanguageEnabledRef.current =
            flow.discountMessagingMultiLanguageEnabled;
          flow.originalRuleMessagesByLocaleRef.current =
            flow.ruleMessagesByLocale;
          flow.originalUpsellWidgetEnabledRef.current =
            flow.upsellWidgetEnabled;
          flow.originalUpsellWidgetDisplayModeRef.current =
            flow.upsellWidgetDisplayMode;
          flow.originalUpsellWidgetDisplayOnRef.current =
            flow.upsellWidgetDisplayOn;
          flow.originalUpsellWidgetButtonTextRef.current =
            flow.upsellWidgetButtonText;
          flow.originalAutoSelectBrowsedProductRef.current =
            flow.autoSelectBrowsedProduct;
          flow.setIsDirty(false);
          flow.shopify.toast.show(
            ("message" in result ? result.message : null) ||
              "Changes saved successfully",
            { isError: false },
          );
        } else if ("productId" in result && result.productId) {
          const syncMessage =
            ("message" in result ? result.message : null) ||
            "Product synced successfully";
          flow.shopify.toast.show(syncMessage, { isError: false });
        } else if ("pages" in result && result.pages) {
          const pages = (result as any).pages || [];
          const formattedPages = pages.map((page: any) => ({
            handle: page.handle,
            title: page.title,
            type: "page",
            isPage: true,
          }));
          flow.setAvailablePages(formattedPages);
          flow.setIsLoadingPages(false);
        } else if ("templates" in result && result.templates) {
          const rawTemplates = (result as any).templates || [];
          const enhancedTemplates =
            flow.enhanceTemplateListWithUserSelection(rawTemplates);
          flow.setAvailablePages(enhancedTemplates);
          flow.setIsLoadingPages(false);
        } else if ("themeId" in result && result.themeId) {
          // No-op: handled by individual callbacks.
        } else if ("pageHandle" in result && result.pageHandle) {
          const pageUrl = (result as any).pageUrl;
          const createdHandle = (result as any).pageHandle as string;
          const slugAdjusted = Boolean((result as any).slugAdjusted);
          const installRequired = (result as any).widgetInstallationRequired;
          const installLink = (result as any).widgetInstallationLink;
          flow.setPageSlug(createdHandle);
          flow.originalPageSlugRef.current = createdHandle;
          flow.setHasManuallyEditedSlug(true);
          if (slugAdjusted && createdHandle !== flow.normalizedPageSlug) {
            flow.shopify.toast.show(
              `The slug '${flow.normalizedPageSlug}' was taken - using '${createdHandle}' instead.`,
              { duration: 6000 },
            );
          }
          if (installRequired && installLink) {
            flow.shopify.toast.show(
              "Page created! Activate the Wolfpack Bundle embed in Theme Settings to go live.",
              { isError: false, duration: 8000 },
            );
            window.open(installLink, "_blank");
          } else {
            flow.shopify.toast.show("Bundle page created successfully!", {
              isError: false,
            });
            if (pageUrl) {
              window.open(pageUrl, "_blank");
            }
          }
          flow.revalidator.revalidate();
        } else if (
          "shareablePreviewUrl" in result &&
          result.shareablePreviewUrl
        ) {
          flow.shopify.toast.show("Opening preview in new tab…", {
            duration: 2000,
          });
          window.open(result.shareablePreviewUrl as string, "_blank");
          markBundlePreviewComplete({
            bundleId: flow.bundle.id,
            storage: window.localStorage,
            setHasPreview: flow.setHasPreview,
          });
          flow.finishPreviewBundleLoading?.();
          flow.revalidator.revalidate();
        } else if ("synced" in result && result.synced) {
          flow.shopify.toast.show(
            ("message" in result ? result.message : null) ||
              "Bundle synced successfully",
            { isError: false },
          );
          flow.revalidator.revalidate();
          const syncInstallLink = (result as any).widgetInstallationLink;
          if (syncInstallLink) {
            setTimeout(() => window.open(syncInstallLink, "_blank"), 800);
          }
        } else {
          flow.shopify.toast.show(
            ("message" in result ? result.message : null) ||
              "Operation completed successfully",
            { isError: false },
          );
        }
      } else {
        const errorMessage =
          ("error" in result ? result.error : null) || "Operation failed";
        flow.shopify.toast.show(errorMessage, {
          isError: true,
          duration: 5000,
        });
        flow.finishPreviewBundleLoading?.();
        if (
          errorMessage.includes("pages") ||
          errorMessage.includes("templates")
        ) {
          flow.setIsLoadingPages(false);
        }
      }
    }
  }, [flow]);

  const handleDiscard = useCallback(() => {
    flow.hookHandleDiscard();
    flow.setPageSlug(flow.originalPageSlugRef.current);
    flow.setHasManuallyEditedSlug(Boolean(flow.bundle.shopifyPageHandle));
    flow.setPromoBannerBgImage(flow.originalPromoBannerBgImageRef.current);
    flow.setLoadingGif(flow.originalLoadingGifRef.current);
    flow.setShowStepTimeline(flow.originalShowStepTimelineRef.current);
    flow.setFloatingBadgeEnabled(flow.originalFloatingBadgeEnabledRef.current);
    flow.setFloatingBadgeText(flow.originalFloatingBadgeTextRef.current);
    flow.setSearchBarEnabled(flow.originalSearchBarEnabledRef.current);
    flow.setShowProductPrices(flow.originalShowProductPricesRef.current);
    flow.setShowCompareAtPrices(flow.originalShowCompareAtPricesRef.current);
    flow.setCartRedirectToCheckout(
      flow.originalCartRedirectToCheckoutRef.current,
    );
    flow.setAllowQuantityChanges(flow.originalAllowQuantityChangesRef.current);
    flow.setTextOverrides(flow.originalTextOverridesRef.current);
    flow.setTextOverridesByLocale(
      flow.originalTextOverridesByLocaleRef.current,
    );
    flow.setAddonDraft(flow.originalAddonDraftRef.current);
    flow.setDiscountMessagingMultiLanguageEnabled(
      flow.originalDiscountMessagingMultiLanguageEnabledRef.current,
    );
    flow.setRuleMessagesByLocale(flow.originalRuleMessagesByLocaleRef.current);
    flow.setUpsellWidgetEnabled(flow.originalUpsellWidgetEnabledRef.current);
    flow.setUpsellWidgetDisplayMode(
      flow.originalUpsellWidgetDisplayModeRef.current,
    );
    flow.setUpsellWidgetDisplayOn(
      flow.originalUpsellWidgetDisplayOnRef.current,
    );
    flow.setUpsellWidgetButtonText(
      flow.originalUpsellWidgetButtonTextRef.current,
    );
    flow.setAutoSelectBrowsedProduct(
      flow.originalAutoSelectBrowsedProductRef.current,
    );
  }, [flow]);
  const handleConfirmDiscard = useCallback(() => {
    closeDiscardModal();
    handleDiscard();
  }, [closeDiscardModal, handleDiscard]);

  Object.assign(flow, {
    buildDefaultProductsData,
    closeDiscardModal,
    handleConfirmDiscard,
    handleDiscard,
    handleSave,
    serializePricingDisplayOptions,
  });
}
