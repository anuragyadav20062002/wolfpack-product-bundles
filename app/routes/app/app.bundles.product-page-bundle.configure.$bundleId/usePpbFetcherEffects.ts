import { useEffect } from "react";

export function usePpbFetcherEffects({
  base,
  visibility,
  settings,
  templateState,
  sharedHandlers,
}: {
  base: any;
  visibility: any;
  settings: any;
  templateState: any;
  sharedHandlers: any;
}) {
  const { fetcher } = base;
  const { templateFetcher, lastTemplateRequestRef, lastTemplateResponseRef } =
    templateState;

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data === base.lastProcessedFetcherDataRef.current) {
        return;
      }
      base.lastProcessedFetcherDataRef.current = fetcher.data;
      const result = fetcher.data;
      if (result.success) {
        if ("bundle" in result && result.bundle) {
          base.originalLoadingGifRef.current = base.loadingGif;
          base.originalShowProductPricesRef.current = base.showProductPrices;
          base.originalShowCompareAtPricesRef.current =
            base.showCompareAtPrices;
          base.originalCartRedirectToCheckoutRef.current =
            base.cartRedirectToCheckout;
          base.originalAllowQuantityChangesRef.current =
            base.allowQuantityChanges;
          base.originalSdkModeRef.current = base.sdkMode;
          base.originalTextOverridesRef.current = base.textOverrides;
          base.originalTextOverridesByLocaleRef.current =
            base.textOverridesByLocale;
          settings.originalDefaultProductsDataRef.current =
            settings.defaultProductsData;
          visibility.originalUpsellWidgetEnabledRef.current =
            visibility.upsellWidgetEnabled;
          visibility.originalUpsellWidgetDisplayModeRef.current =
            visibility.upsellWidgetDisplayMode;
          visibility.originalUpsellWidgetDisplayOnRef.current =
            visibility.upsellWidgetDisplayOn;
          visibility.originalUpsellWidgetTitleRef.current =
            visibility.upsellWidgetTitle;
          visibility.originalUpsellWidgetDescriptionRef.current =
            visibility.upsellWidgetDescription;
          visibility.originalUpsellWidgetButtonTextRef.current =
            visibility.upsellWidgetButtonText;
          visibility.originalUpsellWidgetImageUrlRef.current =
            visibility.upsellWidgetImageUrl;
          visibility.originalAutoSelectBrowsedProductRef.current =
            visibility.autoSelectBrowsedProduct;
          visibility.originalBundleEmbedEnabledRef.current =
            visibility.bundleEmbedEnabled;
          visibility.originalBundleEmbedTitleRef.current =
            visibility.bundleEmbedTitle;
          visibility.originalBundleEmbedSubTitleRef.current =
            visibility.bundleEmbedSubTitle;
          visibility.originalBundleEmbedDisplayOnRef.current =
            visibility.bundleEmbedDisplayOn;
          visibility.originalBundleEmbedAddBrowsedProductRef.current =
            visibility.bundleEmbedAddBrowsedProduct;
          base.markAsSaved();
          base.shopify.toast.show(
            ("message" in result ? result.message : null) ||
              "Changes saved successfully",
            { isError: false },
          );
        } else if ("productId" in result && result.productId) {
          const syncMessage =
            ("message" in result ? result.message : null) ||
            "Product synced successfully";
          base.shopify.toast.show(syncMessage, { isError: false });
          if ("syncedData" in result && result.syncedData) {
            const syncedData = result.syncedData as any;
            const { changesDetected } = syncedData;
            if (changesDetected) {
              setTimeout(() => {
                base.shopify.toast.show(
                  "Bundle data updated with changes from Shopify product",
                  { isError: false },
                );
              }, 2000);
            }
          }
        } else if ("templates" in result && result.templates) {
          const rawTemplates = (result as any).templates || [];
          const enhancedTemplates =
            sharedHandlers.enhanceTemplateListWithUserSelection(rawTemplates);
          base.setAvailablePages(enhancedTemplates);
          base.setIsLoadingPages(false);
          templateState.setIsPreparingPlacementTemplates(false);
          if (templateState.pendingPlacementModalRef.current) {
            templateState.pendingPlacementModalRef.current = false;
            base.openPageSelectionModal();
          }
        } else if ("themeId" in result && result.themeId) {
          // Handled by individual callbacks.
        } else if ("synced" in result && result.synced) {
          base.shopify.toast.show(
            ("message" in result ? result.message : null) ||
              "Bundle synced successfully",
            { isError: false },
          );
          base.revalidator.revalidate();
        } else {
          base.shopify.toast.show(
            ("message" in result ? result.message : null) ||
              "Operation completed successfully",
            { isError: false },
          );
        }
      } else {
        const errorMessage =
          ("error" in result ? result.error : null) || "Operation failed";
        base.shopify.toast.show(errorMessage, {
          isError: true,
          duration: 5000,
        });
        if (
          errorMessage.includes("pages") ||
          errorMessage.includes("templates")
        ) {
          base.setIsLoadingPages(false);
          templateState.setIsPreparingPlacementTemplates(false);
          templateState.pendingPlacementModalRef.current = false;
        }
      }
    }
  }, [fetcher.data, fetcher.state]);

  useEffect(() => {
    if (templateFetcher.state !== "idle" || !lastTemplateRequestRef.current) {
      return;
    }
    if (templateFetcher.data === null || templateFetcher.data === undefined) {
      if (lastTemplateRequestRef.current) {
        templateState.setTemplateSaveError(
          "Unable to save template. Please try again.",
        );
      }
      return;
    }
    if (templateFetcher.data === lastTemplateResponseRef.current) {
      return;
    }
    lastTemplateResponseRef.current = templateFetcher.data;
    const response = templateFetcher.data as {
      success?: boolean;
      error?: string;
    };
    const request = lastTemplateRequestRef.current;
    if (response.success) {
      if (request) {
        templateState.setBundleDesignTemplate(request.template);
        templateState.setBundleDesignPresetId(request.presetId);
        templateState.setTemplateModalStep(
          base.appEmbedEnabled ? "confirm" : "enableThemeExtension",
        );
      }
      templateState.setTemplateSaveError(null);
      lastTemplateRequestRef.current = null;
      return;
    }
    const errorMessage = response.error || "Failed to save template settings.";
    templateState.setTemplateSaveError(errorMessage);
  }, [
    base.appEmbedEnabled,
    lastTemplateRequestRef,
    lastTemplateResponseRef,
    templateFetcher.data,
    templateFetcher.formData,
    templateFetcher.state,
    templateState,
  ]);
}
