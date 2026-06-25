import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { AppLogger } from "../../../lib/logger";
import { validateSlug } from "../../../lib/slug-utils";
import { useEnablePreviewGate } from "../../../hooks/useEnablePreviewGate";
import { useSharedBundleHandlers } from "../../../hooks/useSharedBundleHandlers";
import { type TourStep } from "../../../components/bundle-configure/tourSteps";
import type { ConfigureBundleFlowDraft } from "./configure-flow-types";
import { useConfigureAddonActionHandlers } from "./useConfigureAddonActionHandlers";
import { useConfigureVisibilityActionHandlers } from "./useConfigureVisibilityActionHandlers";

export function useConfigureActionController(flow: ConfigureBundleFlowDraft) {
  const [isPreviewBundleLoading, setIsPreviewBundleLoading] = useState(false);
  const sharedHandlers = useSharedBundleHandlers({
    stepsState: flow.stepsState,
    formState: flow.formState,
    selectedCollections: flow.selectedCollections,
    setSelectedCollections: flow.setSelectedCollections,
    setRuleMessages: flow.setRuleMessages,
    setBundleProduct: flow.setBundleProduct,
    setProductTitle: flow.setProductTitle,
    setProductImageUrl: flow.setProductImageUrl,
    markAsDirty: flow.markAsDirty,
    activeTabIndex: flow.activeTabIndex,
    setActiveTabIndex: flow.setActiveTabIndex,
    shopify: flow.shopify,
    fetcher: flow.fetcher,
    setIsSyncModalOpen: flow.setIsSyncModalOpen,
    setSlideDir: flow.setSlideDir,
    setSlideKey: flow.setSlideKey,
    setShowIconPickerForStep: flow.setShowIconPickerForStep,
  });
  Object.assign(flow, sharedHandlers);
  const addonActionHandlers = useConfigureAddonActionHandlers(flow);
  const visibilityActionHandlers = useConfigureVisibilityActionHandlers(flow);

  const promptSaveBarBeforeNavigation = useCallback(() => {
    flow.shopify.toast.show(
      "Save or discard your changes before moving to another section.",
      { isError: true, duration: 5000 },
    );
    void (flow.shopify as any).saveBar?.leaveConfirmation?.();
  }, [flow]);
  const handleBackClick = useCallback(() => {
    if (flow.isDirty && !flow.forceNavigation) {
      promptSaveBarBeforeNavigation();
      return;
    }
    flow.navigate("/app/dashboard");
  }, [flow, promptSaveBarBeforeNavigation]);
  const enablePreviewGate = useEnablePreviewGate({
    appEmbedEnabled: flow.appEmbedEnabled,
    themeEditorUrl: flow.themeEditorUrl,
    onSilentBlock: () =>
      flow.shopify.toast.show("Theme editor is unavailable for this shop.", {
        isError: true,
      }),
    sessionKey: flow.bundle.id,
    autoShowOnMount:
      flow.loaderData.configureMode === "edit" &&
      flow.isBundleVisibilityPending,
    onSetupVisibility: () => flow.setActiveSection("bundle_visibility"),
  });
  useEffect(() => {
    if (!isPreviewBundleLoading || flow.fetcher.state !== "idle") return;
    const timeout = window.setTimeout(() => setIsPreviewBundleLoading(false), 500);
    return () => window.clearTimeout(timeout);
  }, [flow.fetcher.state, isPreviewBundleLoading]);
  const handlePreviewBundle = useCallback(() => {
    if (flow.isDirty) {
      flow.shopify.toast.show(
        "Please save your changes before previewing the bundle",
        { isError: true, duration: 4000 },
      );
      return false;
    }
    const executePreviewBundle = () => {
      setIsPreviewBundleLoading(true);
      if (flow.bundle.bundleType === "full_page") {
        if (!flow.bundle.shopifyPageHandle) {
          const formData = new FormData();
          formData.append("intent", "createPreviewPage");
          flow.fetcher.submit(formData, { method: "post" });
          return true;
        }
        const shopDomain = flow.shop.includes(".myshopify.com")
          ? flow.shop.replace(".myshopify.com", "")
          : flow.shop.split(".")[0];
        const pageUrl = `https://${shopDomain}.myshopify.com/pages/${flow.bundle.shopifyPageHandle}`;
        open(pageUrl, "_blank");
        flow.shopify.toast.show("Bundle page opened in new tab", {
          isError: false,
        });
        return true;
      }
      let productUrl = null;
      const productHandle =
        flow.bundleProduct?.handle || flow.bundle.shopifyProductHandle;
      if (flow.bundleProduct) {
        if (flow.bundleProduct.onlineStorePreviewUrl) {
          productUrl = flow.bundleProduct.onlineStorePreviewUrl;
        } else if (flow.bundleProduct.onlineStoreUrl) {
          productUrl = flow.bundleProduct.onlineStoreUrl;
        }
      }
      if (!productUrl && productHandle) {
        if (flow.shop.includes("shopifypreview.com")) {
          productUrl = `https://${flow.shop}/products/${productHandle}`;
        } else {
          const shopDomain = flow.shop.includes(".myshopify.com")
            ? flow.shop.replace(".myshopify.com", "")
            : flow.shop;
          productUrl = `https://${shopDomain}.myshopify.com/products/${productHandle}`;
        }
      } else if (!productUrl && flow.bundleProduct?.id) {
        const productId = flow.bundleProduct.id.includes(
          "gid://shopify/Product/",
        )
          ? flow.bundleProduct.id.split("/").pop()
          : flow.bundleProduct.id;
        const shopDomain = flow.shop.includes(".myshopify.com")
          ? flow.shop.replace(".myshopify.com", "")
          : flow.shop.split(".")[0];
        productUrl = `https://admin.shopify.com/store/${shopDomain}/products/${productId}`;
      }
      if (productUrl) {
        open(productUrl, "_blank");
        const isPreviewUrl =
          flow.bundleProduct &&
          productUrl === flow.bundleProduct.onlineStorePreviewUrl;
        const message = isPreviewUrl
          ? "Bundle product preview opened in new tab"
          : "Bundle product opened in new tab";
        flow.shopify.toast.show(message, { isError: false });
      } else {
        AppLogger.error("Bundle product data:", {}, flow.bundleProduct);
        flow.shopify.toast.show(
          "Unable to determine bundle product URL. Please check bundle product configuration.",
          { isError: true, duration: 5000 },
        );
      }
      return true;
    };
    if (flow.bundle.bundleType === "full_page") {
      return executePreviewBundle();
    }
    return enablePreviewGate.requestPreview(executePreviewBundle) === true;
  }, [enablePreviewGate, flow]);
  const handleSectionChange = useCallback(
    (section: string) => {
      if (section === flow.activeSection) return;
      if (flow.isDirty) {
        promptSaveBarBeforeNavigation();
        return;
      }
      flow.setActiveSection(section);
    },
    [flow, promptSaveBarBeforeNavigation],
  );
  const openProductInAdmin = useCallback(
    (productId: string) => {
      const numericProductId = productId.startsWith("gid://")
        ? (productId.split("/").pop() ?? productId)
        : productId;
      const productGid = productId.startsWith("gid://")
        ? productId
        : `gid://shopify/Product/${productId}`;
      const storeHandle = flow.shop?.replace(".myshopify.com", "");
      const adminProductUrl = `https://admin.shopify.com/store/${storeHandle}/products/${numericProductId}`;
      const openFallback = () => {
        try {
          flow.shopify.navigate(adminProductUrl);
        } catch (error) {
          AppLogger.warn(
            "Falling back to a new tab for Admin product navigation",
            { productId },
            error as any,
          );
          window.open(adminProductUrl, "_blank");
        }
        flow.refreshParentProductStatusFromShopify();
      };
      const intentsApi = (flow.shopify as any).intents;
      if (typeof intentsApi?.invoke === "function") {
        try {
          const intentResult = intentsApi.invoke("edit:shopify/Product", {
            type: "shopify/Product",
            value: productGid,
          });
          flow.refreshParentProductStatusFromShopify();
          if (typeof intentResult?.catch === "function") {
            void intentResult.catch((error: unknown) => {
              AppLogger.warn(
                "Falling back after Product editor intent failed",
                { productId },
                error as any,
              );
              openFallback();
            });
          }
          return;
        } catch (error) {
          AppLogger.warn(
            "Falling back after Product editor intent failed",
            { productId },
            error as any,
          );
        }
      }
      openFallback();
    },
    [flow],
  );
  const handleReadinessItemClick = useCallback(
    (key: string) => {
      flow.setReadinessOpen(false);
      switch (key) {
        case "embed":
          if (flow.themeEditorUrl) window.open(flow.themeEditorUrl, "_blank");
          break;
        case "products":
          handleSectionChange("step_setup");
          break;
        case "discount":
          handleSectionChange("discount_pricing");
          break;
        case "preview":
          void handlePreviewBundle();
          localStorage.setItem(`wpb_preview_${flow.bundle.id}`, "1");
          flow.setHasPreview(true);
          break;
        case "visible":
          handleSectionChange("bundle_visibility");
          break;
        case "product_active": {
          const productId =
            flow.bundleProduct?.legacyResourceId ||
            flow.bundleProduct?.id?.split("/").pop() ||
            flow.bundle.shopifyProductId?.split("/").pop();
          if (productId) {
            openProductInAdmin(productId);
          }
          break;
        }
        default:
          break;
      }
    },
    [flow, handlePreviewBundle, handleSectionChange, openProductInAdmin],
  );
  const handleGuidedTourStepChange = useCallback(
    (step: TourStep) => {
      if (step.sectionId) {
        flow.setActiveSection(step.sectionId);
      }
      flow.setReadinessOpen(step.targetSection === "fpb-readiness-score");
    },
    [flow],
  );
  const handleTemplatePreview = useCallback(() => {
    const previewStarted = handlePreviewBundle();
    if (previewStarted) {
      window.setTimeout(flow.closeSelectTemplateModal, 500);
    }
  }, [flow, handlePreviewBundle]);
  const handlePageSelectionBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.currentTarget === event.target) {
        flow.closePageSelectionModal();
      }
    },
    [flow],
  );
  const handleAddNewStep = useCallback(() => {
    flow.stepsState.addStep();
    flow.setSlideDir("forward");
    flow.setSlideKey((prev: number) => prev + 1);
    flow.setActiveTabIndex(flow.stepsState.steps.length);
  }, [flow]);
  const loadAvailablePages = useCallback(() => {
    flow.setIsLoadingPages(true);
    try {
      const formData = new FormData();
      if (flow.bundle.bundleType === "full_page") {
        formData.append("intent", "getPages");
      } else {
        formData.append("intent", "getThemeTemplates");
      }
      flow.fetcher.submit(formData, { method: "post" });
    } catch (error) {
      const resourceType =
        flow.bundle.bundleType === "full_page" ? "pages" : "theme templates";
      AppLogger.error(`Failed to load ${resourceType}:`, {}, error as any);
      flow.shopify.toast.show(`Failed to load ${resourceType}`, {
        isError: true,
        duration: 5000,
      });
      flow.setIsLoadingPages(false);
    }
  }, [flow]);
  const handleAddToStorefront = useCallback(async () => {
    try {
      const normalizedSlugError = validateSlug(flow.normalizedPageSlug);
      if (normalizedSlugError) {
        flow.shopify.toast.show(normalizedSlugError, {
          isError: true,
          duration: 5000,
        });
        return;
      }
      const formData = new FormData();
      formData.append("intent", "validateWidgetPlacement");
      formData.append("desiredSlug", flow.normalizedPageSlug);
      flow.fetcher.submit(formData, { method: "post" });
    } catch (error) {
      AppLogger.error("Error creating bundle page:", {}, error as any);
      flow.shopify.toast.show("Failed to create bundle page", {
        isError: true,
        duration: 5000,
      });
    }
  }, [flow]);
  const handlePlaceWidget = useCallback(() => {
    try {
      flow.openPageSelectionModal();
      loadAvailablePages();
    } catch (error) {
      AppLogger.error("Error opening page selection:", {}, error as any);
      flow.shopify.toast.show("Failed to open page selection", {
        isError: true,
        duration: 5000,
      });
    }
  }, [flow, loadAvailablePages]);
  Object.assign(flow, {
    ...addonActionHandlers,
    ...visibilityActionHandlers,
    enablePreviewGate,
    handleAddNewStep,
    handleAddToStorefront,
    handleBackClick,
    handleGuidedTourStepChange,
    handlePageSelectionBackdropClick,
    handlePlaceWidget,
    handlePreviewBundle,
    isPreviewBundleLoading,
    handleReadinessItemClick,
    handleSectionChange,
    handleTemplatePreview,
    loadAvailablePages,
    openProductInAdmin,
    promptSaveBarBeforeNavigation,
  });
}
