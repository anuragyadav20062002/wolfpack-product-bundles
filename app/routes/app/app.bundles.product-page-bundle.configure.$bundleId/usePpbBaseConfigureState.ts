import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getParentProductStatusUi } from "../../../lib/parent-product-status-ui";
import { handleAdminSaveLockedEvent } from "../../../lib/admin-save-lock";
import { openThemeEditorInNewTab } from "../../../lib/theme-editor-navigation.client";
import {
  checkAppEmbedStatusFromCurrentRoute,
  resolveAppEmbedStatusThemeEditorUrl,
} from "../../../lib/app-embed-status-check.client";
import { useBundleConfigurationState } from "../../../hooks/useBundleConfigurationState";
import type { LoaderData } from "./types";

declare global {
  interface Window {
    shopify?: { config?: { shop?: string } };
  }
}

interface SubscriptionValidationResponse {
  success: boolean;
  isValid?: boolean;
  productCount?: number;
  plans?: Array<{ id: string; name: string }>;
  message?: string | null;
  error?: string;
}

export function usePpbBaseConfigureState() {
  const loaderData = useLoaderData<LoaderData>();
  const bundle =
    loaderData.bundle as unknown as import("../../../hooks/useBundleConfigurationState").BundleData & {
      loadingGif?: string | null;
      shopifyProductHandle?: string;
    };
  const {
    bundleProduct: loadedBundleProduct,
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
  const subscriptionFetcher = useFetcher<SubscriptionValidationResponse>();
  const [currentAppEmbedEnabled, setCurrentAppEmbedEnabled] =
    useState(appEmbedEnabled);
  const [currentThemeEditorUrl, setCurrentThemeEditorUrl] =
    useState(themeEditorUrl);
  const [appEmbedBannerFeedbackTrigger, setAppEmbedBannerFeedbackTrigger] =
    useState(0);
  const [showSubscriptionSetupGuide, setShowSubscriptionSetupGuide] =
    useState(false);
  const revalidator = useRevalidator();
  const isBundleVisibilityPending = !currentAppEmbedEnabled;
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
    activeSection,
    setActiveSection,
    forceNavigation,
    originalValuesRef,
  } = configState;
  const parentProductStatusUi = getParentProductStatusUi(
    productStatus || bundleProduct?.status || loadedBundleProduct?.status,
  );
  useEffect(() => {
    setCurrentAppEmbedEnabled(appEmbedEnabled);
    setCurrentThemeEditorUrl(themeEditorUrl);
  }, [appEmbedEnabled, themeEditorUrl]);
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
  const openThemeEditorForAppEmbed = useCallback(() => {
    if (!currentThemeEditorUrl) return;
    setCurrentAppEmbedEnabled(true);
    openThemeEditorInNewTab(currentThemeEditorUrl);
  }, [currentThemeEditorUrl]);
  const triggerAppEmbedBannerFeedback = useCallback(() => {
    setAppEmbedBannerFeedbackTrigger((value) => value + 1);
  }, []);
  const checkAppEmbedStatusBeforePreview = useCallback(async () => {
    const status = await checkAppEmbedStatusFromCurrentRoute();
    setCurrentAppEmbedEnabled(status.appEmbedEnabled);
    setCurrentThemeEditorUrl((currentUrl) =>
      resolveAppEmbedStatusThemeEditorUrl(currentUrl, status.themeEditorUrl),
    );
    return status.appEmbedEnabled;
  }, []);
  const [loadingGif, setLoadingGif] = useState<string | null>(
    bundle.loadingGif ?? null,
  );
  const originalLoadingGifRef = useRef<string | null>(
    bundle.loadingGif ?? null,
  );
  const [showProductPrices, setShowProductPrices] = useState<boolean>(
    (bundle as any).showProductPrices ?? true,
  );
  const originalShowProductPricesRef = useRef<boolean>(
    (bundle as any).showProductPrices ?? true,
  );
  const [showCompareAtPrices, setShowCompareAtPrices] = useState<boolean>(
    (bundle as any).showCompareAtPrices ?? false,
  );
  const originalShowCompareAtPricesRef = useRef<boolean>(
    (bundle as any).showCompareAtPrices ?? false,
  );
  const [cartRedirectToCheckout, setCartRedirectToCheckout] = useState<boolean>(
    (bundle as any).cartRedirectToCheckout ?? false,
  );
  const originalCartRedirectToCheckoutRef = useRef<boolean>(
    (bundle as any).cartRedirectToCheckout ?? false,
  );
  const [allowQuantityChanges, setAllowQuantityChanges] = useState<boolean>(
    (bundle as any).allowQuantityChanges ?? true,
  );
  const originalAllowQuantityChangesRef = useRef<boolean>(
    (bundle as any).allowQuantityChanges ?? true,
  );
  const [sdkMode, setSdkMode] = useState<boolean>(
    (bundle as any).sdkMode ?? false,
  );
  const originalSdkModeRef = useRef<boolean>((bundle as any).sdkMode ?? false);
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>(
    ((bundle as any).textOverrides as Record<string, string>) ?? {},
  );
  const originalTextOverridesRef = useRef<Record<string, string>>(
    ((bundle as any).textOverrides as Record<string, string>) ?? {},
  );
  const [textOverridesByLocale, setTextOverridesByLocale] = useState<
    Record<string, Record<string, string>>
  >(
    ((bundle as any).textOverridesByLocale as Record<
      string,
      Record<string, string>
    >) ?? {},
  );
  const originalTextOverridesByLocaleRef = useRef<
    Record<string, Record<string, string>>
  >(
    ((bundle as any).textOverridesByLocale as Record<
      string,
      Record<string, string>
    >) ?? {},
  );
  return {
    loaderData,
    bundle,
    loadedBundleProduct,
    shop,
    apiKey,
    blockHandle,
    shopLocales,
    appEmbedBannerFeedbackTrigger,
    appEmbedEnabled: currentAppEmbedEnabled,
    themeEditorUrl: currentThemeEditorUrl,
    openThemeEditorForAppEmbed,
    checkAppEmbedStatusBeforePreview,
    triggerAppEmbedBannerFeedback,
    navigate,
    shopify,
    fetcher,
    subscriptionFetcher,
    showSubscriptionSetupGuide,
    setShowSubscriptionSetupGuide,
    revalidator,
    isBundleVisibilityPending,
    isSaveInFlight,
    saveBarRef,
    triggerSaveBarIrritation,
    blockConfigurationChangeWhileSaving,
    configState,
    isDirty,
    setIsDirty,
    markAsDirty,
    markAsSaved,
    hookHandleDiscard,
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
    activeSection,
    setActiveSection,
    forceNavigation,
    originalValuesRef,
    parentProductStatusUi,
    refreshParentProductStatusFromShopify,
    loadingGif,
    setLoadingGif,
    originalLoadingGifRef,
    showProductPrices,
    setShowProductPrices,
    originalShowProductPricesRef,
    showCompareAtPrices,
    setShowCompareAtPrices,
    originalShowCompareAtPricesRef,
    cartRedirectToCheckout,
    setCartRedirectToCheckout,
    originalCartRedirectToCheckoutRef,
    allowQuantityChanges,
    setAllowQuantityChanges,
    originalAllowQuantityChangesRef,
    sdkMode,
    setSdkMode,
    originalSdkModeRef,
    textOverrides,
    setTextOverrides,
    originalTextOverridesRef,
    textOverridesByLocale,
    setTextOverridesByLocale,
    originalTextOverridesByLocaleRef,
  };
}
