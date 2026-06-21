import { useCallback, useRef, type SyntheticEvent } from "react";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { handleAdminSaveLockedEvent } from "../../../lib/admin-save-lock";
import { getParentProductStatusUi } from "../../../lib/parent-product-status-ui";
import { useBundleConfigurationState } from "../../../hooks/useBundleConfigurationState";
import { useEnsureProductTemplateMutation } from "../../../store/api/adminApi";
import type { LoaderData } from "./types";
import type { ConfigureBundleFlowDraft } from "./configure-flow-types";

export function useConfigureBundleController(): ConfigureBundleFlowDraft {
  const loaderData = useLoaderData<LoaderData>();
  const bundle =
    loaderData.bundle as unknown as import("../../../hooks/useBundleConfigurationState").BundleData & {
      promoBannerBgImage?: string | null;
      loadingGif?: string | null;
      shopifyProductHandle?: string;
    };
  const {
    bundleProduct: loadedBundleProduct,
    availableBundles,
    shop,
    apiKey,
    blockHandle,
    shopLocales = [],
    appEmbedEnabled = true,
    themeEditorUrl = null,
  } = loaderData as any;
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher<any>();
  const revalidator = useRevalidator();
  const [ensureProductTemplate] = useEnsureProductTemplateMutation();
  const isSaveInFlight = fetcher.state !== "idle";
  const saveBarRef = useRef<UISaveBarElement | null>(null);
  const triggerSaveBarIrritation = useCallback(() => {
    void saveBarRef.current?.show?.();
  }, []);
  const blockConfigurationChangeWhileSaving = useCallback(
    (event: SyntheticEvent) => {
      handleAdminSaveLockedEvent(
        event,
        isSaveInFlight,
        triggerSaveBarIrritation,
      );
    },
    [isSaveInFlight, triggerSaveBarIrritation],
  );
  const configState = useBundleConfigurationState({
    bundle,
    bundleProduct: loadedBundleProduct,
    shopify,
  });
  const {
    isDirty,
    setIsDirty,
    markAsDirty,
    markAsSaved,
    handleDiscard: hookHandleDiscard,
    isResettingRef,
    lastProcessedFetcherDataRef,
    formState,
    stepsState,
    conditionsState,
    pricingState,
    isPageSelectionModalOpen,
    openPageSelectionModal,
    closePageSelectionModal,
    isProductsModalOpen,
    openProductsModal,
    closeProductsModal,
    isCollectionsModalOpen,
    openCollectionsModal,
    closeCollectionsModal,
    currentModalStepId,
    setCurrentModalStepId,
    isLoadingPages,
    setIsLoadingPages,
    availablePages,
    setAvailablePages,
    selectedPage,
    setSelectedPage,
    bundleProduct,
    setBundleProduct,
    productStatus,
    setProductStatus,
    productTitle,
    setProductTitle,
    productImageUrl,
    setProductImageUrl,
    selectedCollections,
    setSelectedCollections,
    ruleMessages,
    setRuleMessages,
    activeTabIndex,
    setActiveTabIndex,
    activeSection,
    setActiveSection,
    forceNavigation,
    setForceNavigation,
    originalValuesRef,
  } = configState;
  const suppressTopAppEmbedBannerForVisibility =
    activeSection === "bundle_visibility" || activeSection === "bundle_widget";
  const parentProductStatusUi = getParentProductStatusUi(
    productStatus || bundleProduct?.status || loadedBundleProduct?.status,
  );
  const refreshParentProductStatusFromShopify = useCallback(() => {
    const revalidateNow = () => {
      revalidator.revalidate();
    };
    let cleanup = () => {};
    const revalidateOnReturn = () => {
      revalidateNow();
      cleanup();
    };
    const revalidateOnVisible = () => {
      if (document.visibilityState === "visible") {
        revalidateOnReturn();
      }
    };
    cleanup = () => {
      window.removeEventListener("focus", revalidateOnReturn);
      document.removeEventListener("visibilitychange", revalidateOnVisible);
    };
    [1000, 3000, 6000].forEach((delay) => {
      window.setTimeout(revalidateNow, delay);
    });
    window.addEventListener("focus", revalidateOnReturn, { once: true });
    document.addEventListener("visibilitychange", revalidateOnVisible);
    window.setTimeout(cleanup, 30000);
  }, [revalidator]);

  return {
    activeSection,
    activeTabIndex,
    apiKey,
    appEmbedEnabled,
    availableBundles,
    availablePages,
    blockConfigurationChangeWhileSaving,
    blockHandle,
    bundle,
    bundleProduct,
    closeCollectionsModal,
    closePageSelectionModal,
    closeProductsModal,
    conditionsState,
    configState,
    currentModalStepId,
    ensureProductTemplate,
    fetcher,
    forceNavigation,
    formState,
    hookHandleDiscard,
    isCollectionsModalOpen,
    isDirty,
    isLoadingPages,
    isPageSelectionModalOpen,
    isProductsModalOpen,
    isResettingRef,
    isSaveInFlight,
    lastProcessedFetcherDataRef,
    loadedBundleProduct,
    loaderData,
    markAsDirty,
    markAsSaved,
    navigate,
    openCollectionsModal,
    openPageSelectionModal,
    openProductsModal,
    originalValuesRef,
    parentProductStatusUi,
    pricingState,
    productImageUrl,
    productStatus,
    productTitle,
    refreshParentProductStatusFromShopify,
    revalidator,
    ruleMessages,
    saveBarRef,
    selectedCollections,
    selectedPage,
    setActiveSection,
    setActiveTabIndex,
    setAvailablePages,
    setBundleProduct,
    setCurrentModalStepId,
    setForceNavigation,
    setIsDirty,
    setIsLoadingPages,
    setProductImageUrl,
    setProductStatus,
    setProductTitle,
    setRuleMessages,
    setSelectedCollections,
    setSelectedPage,
    shop,
    shopify,
    shopLocales,
    stepsState,
    suppressTopAppEmbedBannerForVisibility,
    themeEditorUrl,
    triggerSaveBarIrritation,
  };
}
