import { useCallback, useEffect, useMemo } from "react";
import { type BundleReadinessItem } from "../../../components/bundle-configure/BundleReadinessOverlay";
import { DiscountMethod } from "../../../types/pricing";
import {
  normalizePricingDisplayOptions,
  normalizePricingRuleMessages,
} from "../../../lib/pricing-display-options";
import fullPageBundleStyles from "../../../styles/routes/full-page-bundle-configure.module.css";
import { FPB_DESIGN_CONTROL_PANEL_URL } from "./configure-constants";
import { buildVisibilityDisplayConfiguration } from "./visibility-helpers";
import type { ConfigureBundleFlowDraft } from "./configure-flow-types";

export function useConfigureTemplatePricingController(
  flow: ConfigureBundleFlowDraft,
) {
  const {
    appEmbedEnabled,
    autoSelectBrowsedProduct,
    bundle,
    bundleDesignPresetId,
    bundleDesignTemplate,
    formState,
    isSelectTemplateModalOpen,
    lastTemplateRequestRef,
    lastTemplateResponseRef,
    loadedBundleProduct,
    navigate,
    pendingDesignPresetId,
    pendingDesignTemplate,
    pricingState,
    productStatus,
    ruleMessages,
    savedBundleUpsellConfig,
    selectTemplateModalRef,
    selectTemplateOpenButtonRef,
    setBundleDesignPresetId,
    setBundleDesignTemplate,
    setIsSelectTemplateModalOpen,
    setPendingDesignPresetId,
    setPendingDesignTemplate,
    setTemplateModalStep,
    setTemplateSaveError,
    stepsState,
    templateFetcher,
    upsellWidgetButtonText,
    upsellWidgetCollectionsSelectedData,
    upsellWidgetDescription,
    upsellWidgetDisplayOn,
    upsellWidgetEnabled,
    upsellWidgetImageUrl,
    upsellWidgetLanguageMode,
    upsellWidgetSelectedProducts,
    upsellWidgetSpecificCollectionPages,
    upsellWidgetSpecificProductPages,
    upsellWidgetTitle,
  } = flow;

  const closeSelectTemplateModal = useCallback(() => {
    setIsSelectTemplateModalOpen(false);
    setTemplateModalStep("templates");
    setTemplateSaveError(null);
    lastTemplateRequestRef.current = null;
    lastTemplateResponseRef.current = null;
    requestAnimationFrame(() => {
      selectTemplateOpenButtonRef.current?.focus();
    });
  }, [
    lastTemplateRequestRef,
    lastTemplateResponseRef,
    selectTemplateOpenButtonRef,
    setIsSelectTemplateModalOpen,
    setTemplateModalStep,
    setTemplateSaveError,
  ]);
  const getTemplateDialogFocusableElements = useCallback((): HTMLElement[] => {
    if (!selectTemplateModalRef.current) {
      return [];
    }
    return Array.from(
      selectTemplateModalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (element) =>
        !element.hasAttribute("disabled") &&
        element.tabIndex >= 0 &&
        window.getComputedStyle(element).display !== "none" &&
        window.getComputedStyle(element).visibility !== "hidden",
    );
  }, [selectTemplateModalRef]);
  const handleSelectTemplateDialogKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeSelectTemplateModal();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const focusableElements = getTemplateDialogFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }
      const activeElement = document.activeElement as HTMLElement | null;
      const activeElementIndex = activeElement
        ? focusableElements.indexOf(activeElement)
        : -1;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (activeElementIndex === -1) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && activeElementIndex === 0) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (
        !event.shiftKey &&
        activeElementIndex === focusableElements.length - 1
      ) {
        event.preventDefault();
        first.focus();
      }
    },
    [closeSelectTemplateModal, getTemplateDialogFocusableElements],
  );
  const handleSelectTemplateBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        closeSelectTemplateModal();
      }
    },
    [closeSelectTemplateModal],
  );
  const openSelectTemplateModal = useCallback(() => {
    setPendingDesignTemplate(bundleDesignTemplate);
    setPendingDesignPresetId(bundleDesignPresetId);
    setTemplateModalStep("templates");
    setTemplateSaveError(null);
    lastTemplateRequestRef.current = null;
    lastTemplateResponseRef.current = null;
    setIsSelectTemplateModalOpen(true);
  }, [
    bundleDesignPresetId,
    bundleDesignTemplate,
    lastTemplateRequestRef,
    lastTemplateResponseRef,
    setIsSelectTemplateModalOpen,
    setPendingDesignPresetId,
    setPendingDesignTemplate,
    setTemplateModalStep,
    setTemplateSaveError,
  ]);
  const openDesignControlPanel = useCallback(() => {
    navigate(FPB_DESIGN_CONTROL_PANEL_URL);
  }, [navigate]);

  useEffect(() => {
    if (isSelectTemplateModalOpen) {
      selectTemplateModalRef.current?.focus();
    }
  }, [isSelectTemplateModalOpen, selectTemplateModalRef]);

  useEffect(() => {
    if (templateFetcher.state !== "idle" || !lastTemplateRequestRef.current) {
      return;
    }
    if (templateFetcher.data == null) {
      if (lastTemplateRequestRef.current) {
        setTemplateSaveError("Unable to save template. Please try again.");
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
        setBundleDesignTemplate(request.template);
        setBundleDesignPresetId(request.presetId);
        setTemplateModalStep(
          appEmbedEnabled ? "confirm" : "enableThemeExtension",
        );
      }
      setTemplateSaveError(null);
      lastTemplateRequestRef.current = null;
      return;
    }
    setTemplateSaveError(response.error || "Failed to save template settings.");
  }, [
    appEmbedEnabled,
    lastTemplateRequestRef,
    lastTemplateResponseRef,
    setBundleDesignPresetId,
    setBundleDesignTemplate,
    setTemplateModalStep,
    setTemplateSaveError,
    templateFetcher.data,
    templateFetcher.formData,
    templateFetcher.state,
  ]);

  const handleTemplateNext = useCallback(() => {
    if (!pendingDesignTemplate || !pendingDesignPresetId) {
      return;
    }
    setTemplateSaveError(null);
    lastTemplateRequestRef.current = {
      template: pendingDesignTemplate,
      presetId: pendingDesignPresetId,
    };
    lastTemplateResponseRef.current = null;
    const fd = new FormData();
    fd.append("intent", "updateBundleDesignTemplate");
    fd.append("bundleDesignTemplate", pendingDesignTemplate ?? "");
    fd.append("bundleDesignPresetId", pendingDesignPresetId ?? "");
    templateFetcher.submit(fd, { method: "POST" });
  }, [
    lastTemplateRequestRef,
    lastTemplateResponseRef,
    pendingDesignPresetId,
    pendingDesignTemplate,
    setTemplateSaveError,
    templateFetcher,
  ]);
  function buildBundleUpsellConfig() {
    return {
      multiLangText: savedBundleUpsellConfig?.multiLangText ?? {},
      languageMode: upsellWidgetLanguageMode,
      widgetConfiguration: {
        isEnabled: upsellWidgetEnabled,
        type: "OFFER_WIDGET",
        imageUrl: upsellWidgetImageUrl,
        title: upsellWidgetTitle,
        description: upsellWidgetDescription,
        buttonText: upsellWidgetButtonText,
        displayConfiguration: buildVisibilityDisplayConfiguration(
          upsellWidgetDisplayOn,
          upsellWidgetSelectedProducts,
          upsellWidgetSpecificProductPages,
          upsellWidgetCollectionsSelectedData,
          upsellWidgetSpecificCollectionPages,
        ),
        useLinkProductAsDefaultProduct: autoSelectBrowsedProduct,
        languageMode: upsellWidgetLanguageMode,
      },
    };
  }
  const normalizedPricingDisplayOptions = useMemo(
    () =>
      normalizePricingDisplayOptions({
        rules: pricingState.discountRules,
        messages: { displayOptions: pricingState.pricingDisplayOptions },
        showProgressBar: pricingState.showDiscountProgressBar,
        steps: stepsState.steps.map((step: any) => ({
          id: step.id,
          enabled: step.enabled,
          maxQuantity: step.maxQuantity,
        })),
      }),
    [
      pricingState.discountRules,
      pricingState.pricingDisplayOptions,
      pricingState.showDiscountProgressBar,
      stepsState.steps,
    ],
  );
  const normalizedRuleMessages = useMemo(
    () =>
      normalizePricingRuleMessages({
        rules: pricingState.discountRules,
        messages: { ruleMessages },
        method: pricingState.discountType,
      }),
    [pricingState.discountRules, pricingState.discountType, ruleMessages],
  );
  const bundleQuantityOptionsEligible =
    pricingState.discountType !== DiscountMethod.BUY_X_GET_Y &&
    pricingState.discountRules.length > 0 &&
    pricingState.discountRules.every(
      (rule: any) => rule.conditionType === "quantity",
    );
  const displayOptionsInactive =
    !pricingState.discountEnabled || pricingState.discountRules.length === 0;

  useEffect(() => {
    if (
      !bundleQuantityOptionsEligible &&
      pricingState.pricingDisplayOptions.bundleQuantityOptions.enabled
    ) {
      pricingState.setBundleQuantityOptionsEnabled(false);
    }
  }, [
    bundleQuantityOptionsEligible,
    pricingState.pricingDisplayOptions.bundleQuantityOptions.enabled,
    pricingState.setBundleQuantityOptionsEnabled,
  ]);

  const readinessItems = useMemo<BundleReadinessItem[]>(() => {
    const hasProducts =
      stepsState.steps.reduce((totalProducts: number, step: any) => {
        const legacyProducts = Array.isArray(step.StepProduct)
          ? step.StepProduct.length
          : 0;
        const categoryProductCount = Array.isArray((step as any).StepCategory)
          ? ((step as any).StepCategory as any[]).reduce(
              (count: number, category: any) =>
                count +
                (Array.isArray(category?.products)
                  ? category.products.length
                  : 0),
              0,
            )
          : 0;
        return totalProducts + legacyProducts + categoryProductCount;
      }, 0) >= 3;
    const hasBundleVisibility = Boolean(
      bundle.shopifyPageId ||
        bundle.shopifyPageHandle ||
        formState.bundleStatus === "active",
    );
    const parentProductActive =
      String(
        productStatus || loadedBundleProduct?.status || "",
      ).toLowerCase() === "active";
    return [
      {
        key: "embed",
        label: "App Embed Enabled",
        description: "Needed for your bundle to show up on store",
        points: 15,
        done: appEmbedEnabled,
      },
      {
        key: "products",
        label: "Minimum 3 Products Added",
        description: "Add more products to build a better bundle",
        points: 20,
        done: hasProducts,
      },
      {
        key: "discount",
        label: "Set Up Discount",
        description: "Bundles with offers tend to sell better",
        points: 15,
        done: pricingState.discountEnabled,
      },
      {
        key: "preview",
        label: "Preview Bundle",
        description: "Check your bundle looks and works right",
        points: 10,
        done: flow.hasPreview,
      },
      {
        key: "visible",
        label: "Set Up Bundle Visibility",
        description: "Put your bundle where shoppers can find it",
        points: 25,
        done: hasBundleVisibility,
      },
      {
        key: "product_active",
        label: "Set Parent Product to Active",
        description: "Unlisted bundles won't show in search",
        points: 15,
        done: parentProductActive,
      },
    ];
  }, [
    appEmbedEnabled,
    bundle.shopifyPageHandle,
    bundle.shopifyPageId,
    flow.hasPreview,
    formState.bundleStatus,
    loadedBundleProduct?.status,
    pricingState.discountEnabled,
    productStatus,
    stepsState.steps,
  ]);
  const readinessScore = readinessItems.reduce(
    (sum, item) => sum + (item.done ? item.points : 0),
    0,
  );
  const readinessClassName =
    readinessScore >= 80
      ? fullPageBundleStyles.readinessButtonHigh
      : readinessScore >= 40
        ? fullPageBundleStyles.readinessButtonMedium
        : fullPageBundleStyles.readinessButtonLow;

  Object.assign(flow, {
    buildBundleUpsellConfig,
    buildVisibilityDisplayConfiguration,
    bundleQuantityOptionsEligible,
    closeSelectTemplateModal,
    displayOptionsInactive,
    FPB_DESIGN_CONTROL_PANEL_URL,
    fullPageBundleStyles,
    getTemplateDialogFocusableElements,
    handleSelectTemplateBackdropClick,
    handleSelectTemplateDialogKeyDown,
    handleTemplateNext,
    normalizedPricingDisplayOptions,
    normalizedRuleMessages,
    normalizePricingDisplayOptions,
    normalizePricingRuleMessages,
    openDesignControlPanel,
    openSelectTemplateModal,
    readinessClassName,
    readinessItems,
    readinessScore,
  });
}
