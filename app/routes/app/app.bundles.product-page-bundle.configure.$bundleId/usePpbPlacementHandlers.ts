import { useCallback } from "react";
import { AppLogger } from "../../../lib/logger";
import { openThemeEditorInNewTab } from "../../../lib/theme-editor-navigation.client";
import {
  buildProductPageThemeEditorDeepLink,
  resolveProductPageTemplateSuffix,
} from "../../../lib/bundle-config/product-page-admin-sections";
import {
  buildVisibilitySelectionIds,
  getVisibilityPickerSelection,
  normalizeVisibilityCollectionForDisplayConfiguration,
  normalizeVisibilityCollectionPageTarget,
  normalizeVisibilityProductForDisplayConfiguration,
  normalizeVisibilityProductPageTarget,
} from "./ConfigureBundleFlow.helpers";

export function usePpbPlacementHandlers({
  base,
  visibility,
  templateState,
}: {
  base: any;
  visibility: any;
  templateState: any;
}) {
  const handleCloseProductsModal = useCallback(() => {
    base.closeProductsModal();
    base.setCurrentModalStepId("");
  }, [base]);
  const handleCloseCollectionsModal = useCallback(() => {
    base.closeCollectionsModal();
    base.setCurrentModalStepId("");
  }, [base]);
  const loadAvailablePages = useCallback(() => {
    base.setIsLoadingPages(true);
    try {
      const formData = new FormData();
      formData.append("intent", "getThemeTemplates");
      base.fetcher.submit(formData, { method: "post" });
    } catch (error) {
      AppLogger.error("Failed to load theme templates:", {}, error as any);
      base.shopify.toast.show("Failed to load theme templates", {
        isError: true,
        duration: 5000,
      });
      base.setIsLoadingPages(false);
      templateState.setIsPreparingPlacementTemplates(false);
      templateState.pendingPlacementModalRef.current = false;
    }
  }, [base, templateState]);
  const handlePlaceWidget = useCallback(() => {
    try {
      templateState.pendingPlacementModalRef.current = true;
      templateState.setIsPreparingPlacementTemplates(true);
      loadAvailablePages();
    } catch (error) {
      AppLogger.error("Error opening page selection:", {}, error as any);
      base.shopify.toast.show("Failed to open page selection", {
        isError: true,
        duration: 5000,
      });
      templateState.setIsPreparingPlacementTemplates(false);
      templateState.pendingPlacementModalRef.current = false;
    }
  }, [base, loadAvailablePages, templateState]);
  const openVisibilityProductPicker = useCallback(
    async (target: "widget" | "embed") => {
      const currentProducts =
        target === "widget"
          ? visibility.upsellWidgetSelectedProducts
          : visibility.bundleEmbedSelectedProducts;
      const picked = await (base.shopify as any).resourcePicker({
        type: "product",
        multiple: true,
        action: "select",
        selectionIds: buildVisibilitySelectionIds(currentProducts),
      });
      const selection = getVisibilityPickerSelection(picked);
      if (!selection) return;
      const selectedProducts = selection.map(
        normalizeVisibilityProductForDisplayConfiguration,
      );
      const pageTargets = selectedProducts.map(
        normalizeVisibilityProductPageTarget,
      );
      if (target === "widget") {
        visibility.setUpsellWidgetSelectedProducts(selectedProducts);
        visibility.setUpsellWidgetSpecificProductPages(pageTargets);
      } else {
        visibility.setBundleEmbedSelectedProducts(selectedProducts);
        visibility.setBundleEmbedSpecificProductPages(pageTargets);
      }
      base.markAsDirty();
    },
    [base, visibility],
  );
  const openVisibilityCollectionPicker = useCallback(
    async (target: "widget" | "embed") => {
      const currentCollections =
        target === "widget"
          ? visibility.upsellWidgetCollectionsSelectedData
          : visibility.bundleEmbedCollectionsSelectedData;
      const picked = await (base.shopify as any).resourcePicker({
        type: "collection",
        multiple: true,
        action: "select",
        selectionIds: buildVisibilitySelectionIds(currentCollections),
      });
      const selection = getVisibilityPickerSelection(picked);
      if (!selection) return;
      const collectionsSelectedData = selection.map(
        normalizeVisibilityCollectionForDisplayConfiguration,
      );
      const pageTargets = collectionsSelectedData.map(
        normalizeVisibilityCollectionPageTarget,
      );
      if (target === "widget") {
        visibility.setUpsellWidgetCollectionsSelectedData(
          collectionsSelectedData,
        );
        visibility.setUpsellWidgetSpecificCollectionPages(pageTargets);
      } else {
        visibility.setBundleEmbedCollectionsSelectedData(
          collectionsSelectedData,
        );
        visibility.setBundleEmbedSpecificCollectionPages(pageTargets);
      }
      base.markAsDirty();
    },
    [base, visibility],
  );
  const removeVisibilityProductTarget = useCallback(
    (target: "widget" | "embed", indexToRemove: number) => {
      if (target === "widget") {
        visibility.setUpsellWidgetSelectedProducts((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
        visibility.setUpsellWidgetSpecificProductPages((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
      } else {
        visibility.setBundleEmbedSelectedProducts((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
        visibility.setBundleEmbedSpecificProductPages((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
      }
      base.markAsDirty();
    },
    [base, visibility],
  );
  const removeVisibilityCollectionTarget = useCallback(
    (target: "widget" | "embed", indexToRemove: number) => {
      if (target === "widget") {
        visibility.setUpsellWidgetCollectionsSelectedData((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
        visibility.setUpsellWidgetSpecificCollectionPages((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
      } else {
        visibility.setBundleEmbedCollectionsSelectedData((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
        visibility.setBundleEmbedSpecificCollectionPages((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
      }
      base.markAsDirty();
    },
    [base, visibility],
  );
  const handlePageSelection = useCallback(
    async (template: any) => {
      try {
        if (!template || !template.handle) {
          AppLogger.error(
            "🚨 [THEME_EDITOR] Invalid template object:",
            {},
            template,
          );
          base.shopify.toast.show("Template data is invalid", {
            isError: true,
            duration: 5000,
          });
          return;
        }
        base.shopify.toast.show(
          `Preparing theme editor for "${template.title}"...`,
          { isError: false, duration: 3000 },
        );
        if (!base.apiKey || !base.blockHandle) {
          AppLogger.error("🚨 [THEME_EDITOR] Missing app configuration");
          base.shopify.toast.show(
            "App configuration missing. Please check app setup.",
            { isError: true, duration: 5000 },
          );
          return;
        }
        const placementBlockHandle =
          base.activeSection === "bundle_widget"
            ? visibility.upsellWidgetDisplayMode === "button"
              ? "bundle-upsell-button"
              : "bundle-upsell-block"
            : base.blockHandle;
        const productIdForTemplate =
          base.bundleProduct?.id ??
          (base.bundle as any).shopifyProductId ??
          null;
        const productTemplateSuffix =
          resolveProductPageTemplateSuffix(template);
        if (productIdForTemplate) {
          const formData = new FormData();
          formData.append("intent", "assignProductTemplate");
          formData.append("productId", productIdForTemplate);
          formData.append("templateSuffix", productTemplateSuffix ?? "");
          const response = await fetch(window.location.href, {
            method: "POST",
            body: formData,
          });
          const result = await response.json().catch(() => null);
          if (!response.ok || result?.success === false) {
            throw new Error(
              result?.error ||
                "Failed to assign the selected template to the bundle parent product",
            );
          }
        }
        const pageProductHandle =
          base.bundleProduct?.handle ?? base.bundle.shopifyProductHandle;
        const themeEditorUrl = buildProductPageThemeEditorDeepLink({
          shop: base.shop,
          apiKey: base.apiKey,
          blockHandle: placementBlockHandle,
          bundleId: base.bundle.id,
          productHandle: pageProductHandle,
          productPreviewUrl: base.bundleProduct?.onlineStorePreviewUrl,
          template,
        });
        base.setSelectedPage(template);
        base.closePageSelectionModal();
        base.shopify.toast.show(
          `Opening theme editor for "${template.title}". You'll be able to add the bundle widget to your theme.`,
          { isError: false, duration: 5000 },
        );
        openThemeEditorInNewTab(themeEditorUrl);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        AppLogger.error(
          "🚨 [THEME_EDITOR] Error in handlePageSelection:",
          { errorMessage },
          error as any,
        );
        base.shopify.toast.show(
          `Failed to open theme editor: ${errorMessage}`,
          {
            isError: true,
            duration: 5000,
          },
        );
      }
    },
    [base, visibility.upsellWidgetDisplayMode],
  );

  return {
    handleCloseProductsModal,
    handleCloseCollectionsModal,
    loadAvailablePages,
    handlePlaceWidget,
    openVisibilityProductPicker,
    openVisibilityCollectionPicker,
    removeVisibilityProductTarget,
    removeVisibilityCollectionTarget,
    handlePageSelection,
  };
}
