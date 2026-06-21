import { useCallback } from "react";
import { useSharedBundleHandlers } from "../../../hooks/useSharedBundleHandlers";
import { ppbConfigureFlowStaticExports } from "./ppbConfigureFlowStaticExports";
import { usePpbBaseConfigureState } from "./usePpbBaseConfigureState";
import { usePpbVisibilityState } from "./usePpbVisibilityState";
import { usePpbDisplayOptionsState } from "./usePpbDisplayOptionsState";
import { usePpbBundleSettingsState } from "./usePpbBundleSettingsState";
import { usePpbTemplateUiState } from "./usePpbTemplateUiState";
import { usePpbMultiLanguageHandlers } from "./usePpbMultiLanguageHandlers";
import { usePpbCategoryHandlers } from "./usePpbCategoryHandlers";
import { usePpbSaveHandlers } from "./usePpbSaveHandlers";
import { usePpbFetcherEffects } from "./usePpbFetcherEffects";
import { usePpbPreviewReadinessHandlers } from "./usePpbPreviewReadinessHandlers";
import { usePpbPlacementHandlers } from "./usePpbPlacementHandlers";
import { usePpbModalAndTemplateController } from "./usePpbModalAndTemplateController";

export function usePpbConfigureFlow() {
  const base = usePpbBaseConfigureState();
  const visibility = usePpbVisibilityState({
    bundle: base.bundle,
    textOverrides: base.textOverrides,
  });
  const display = usePpbDisplayOptionsState({
    bundle: base.bundle,
    shopLocales: base.shopLocales,
    pricingState: base.pricingState,
    markAsDirty: base.markAsDirty,
  });
  const settings = usePpbBundleSettingsState({ bundle: base.bundle });
  const templateState = usePpbTemplateUiState({ bundle: base.bundle });
  const multiLanguage = usePpbMultiLanguageHandlers({
    shopLocales: base.shopLocales,
    stepsState: base.stepsState,
    textOverridesByLocale: base.textOverridesByLocale,
    setTextOverridesByLocale: base.setTextOverridesByLocale,
    markAsDirty: base.markAsDirty,
  });
  const categoryHandlers = usePpbCategoryHandlers({
    stepsState: base.stepsState,
    markAsDirty: base.markAsDirty,
  });
  const saveHandlers = usePpbSaveHandlers({
    base,
    visibility,
    display,
    settings,
  });
  const sharedHandlers = useSharedBundleHandlers({
    stepsState: base.stepsState,
    formState: base.formState,
    selectedCollections: base.selectedCollections,
    setSelectedCollections: base.setSelectedCollections,
    setRuleMessages: base.setRuleMessages,
    setBundleProduct: base.setBundleProduct,
    setProductTitle: base.setProductTitle,
    setProductImageUrl: base.setProductImageUrl,
    markAsDirty: base.markAsDirty,
    activeTabIndex: templateState.activeTabIndex,
    setActiveTabIndex: templateState.setActiveTabIndex,
    shopify: base.shopify,
    fetcher: base.fetcher,
    setIsSyncModalOpen: templateState.setIsSyncModalOpen,
    setSlideDir: templateState.setSlideDir,
    setSlideKey: templateState.setSlideKey,
  });
  usePpbFetcherEffects({
    base,
    visibility,
    settings,
    templateState,
    sharedHandlers,
  });
  const handleAddToStorefront = useCallback(() => {
    const embedLink = `https://${base.shop}/admin/themes/current/editor?context=apps&activateAppId=${base.apiKey}/bundle-app-embed`;
    open(embedLink, "_blank");
    base.shopify.toast.show(
      "Activate the Wolfpack Bundle embed in Theme Settings to go live.",
      { isError: false, duration: 8000 },
    );
  }, [base.apiKey, base.shop, base.shopify]);
  const previewReadiness = usePpbPreviewReadinessHandlers({
    base,
    visibility,
    templateState,
  });
  const placement = usePpbPlacementHandlers({
    base,
    visibility,
    templateState,
  });
  const modalAndTemplate = usePpbModalAndTemplateController({
    base,
    display,
    templateState,
    placement,
    previewReadiness,
    saveHandlers,
  });

  return {
    ...ppbConfigureFlowStaticExports,
    ...base,
    ...visibility,
    ...display,
    ...settings,
    ...templateState,
    ...multiLanguage,
    ...categoryHandlers,
    ...saveHandlers,
    ...sharedHandlers,
    handleAddToStorefront,
    ...previewReadiness,
    ...placement,
    ...modalAndTemplate,
  };
}
