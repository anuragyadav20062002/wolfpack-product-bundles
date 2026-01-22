/**
 * Design Control Panel State Hook
 *
 * This hook manages all design settings state for the Design Control Panel.
 * It wraps the centralized AppStateService and provides a simplified API
 * for the DCP component.
 *
 * Features:
 * - Initializes state from loader data
 * - Syncs state when bundle type changes
 * - Tracks unsaved changes (isDirty)
 * - Provides discard functionality
 * - Provides settings collection for save
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { appState as appStateService } from "../services/app.state.service";
import type { DesignSettings } from "../types/state.types";

// ============================================
// TYPES
// ============================================

export type BundleType = "product_page" | "full_page";

/**
 * LoaderSettings type - properties are optional because Remix's useLoaderData
 * returns Jsonified data where properties can be undefined.
 * The hook handles missing settings by falling back to defaults.
 */
export interface LoaderSettings {
  product_page?: DesignSettings | null;
  full_page?: DesignSettings | null;
}

export interface DCPNavigationState {
  expandedSection: string | null;
  activeSubSection: string;
}

// ============================================
// DEFAULT VALUES
// ============================================

const getDefaultSettings = (bundleType: BundleType): DesignSettings => {
  const isFullPage = bundleType === "full_page";

  return {
    // Global Colors
    globalPrimaryButtonColor: isFullPage ? "#7132FF" : "#000000",
    globalButtonTextColor: "#FFFFFF",
    globalPrimaryTextColor: isFullPage ? "#111827" : "#000000",
    globalSecondaryTextColor: isFullPage ? "#9CA3AF" : "#6B7280",
    globalFooterBgColor: isFullPage ? "#F9FAFB" : "#FFFFFF",
    globalFooterTextColor: isFullPage ? "#111827" : "#000000",

    // Product Card
    productCardBgColor: isFullPage ? "#F9FAFB" : "#FFFFFF",
    productCardFontColor: isFullPage ? "#111827" : "#000000",
    productCardFontSize: isFullPage ? 18 : 16,
    productCardFontWeight: isFullPage ? 500 : 400,
    productCardImageFit: isFullPage ? "contain" : "cover",
    productCardsPerRow: isFullPage ? 4 : 3,
    productTitleVisibility: true,
    productPriceVisibility: true,
    productPriceBgColor: isFullPage ? "#F9FAFB" : "#F0F8F0",

    // Product Card Typography
    productStrikePriceColor: isFullPage ? "#9CA3AF" : "#8D8D8D",
    productStrikeFontSize: isFullPage ? 16 : 14,
    productStrikeFontWeight: 400,
    productFinalPriceColor: isFullPage ? "#111827" : "#000000",
    productFinalPriceFontSize: isFullPage ? 20 : 18,
    productFinalPriceFontWeight: 700,

    // Product Card Dimensions
    productCardWidth: 280,
    productCardHeight: 420,
    productCardSpacing: 20,
    productCardBorderRadius: 8,
    productCardPadding: 12,
    productCardBorderWidth: 1,
    productCardBorderColor: "rgba(0,0,0,0.08)",
    productCardShadow: "0 2px 8px rgba(0,0,0,0.04)",
    productCardHoverShadow: "0 8px 24px rgba(0,0,0,0.12)",

    // Product Image
    productImageHeight: 280,
    productImageBorderRadius: 6,
    productImageBgColor: "#F8F8F8",

    // Button
    buttonBgColor: isFullPage ? "#7132FF" : "#000000",
    buttonTextColor: "#FFFFFF",
    buttonFontSize: isFullPage ? 18 : 16,
    buttonFontWeight: isFullPage ? 700 : 600,
    buttonBorderRadius: isFullPage ? 12 : 8,
    buttonAddToCartText: "Add to bundle",

    // Quantity Selector
    quantitySelectorBgColor: isFullPage ? "#7132FF" : "#000000",
    quantitySelectorTextColor: "#FFFFFF",
    quantitySelectorFontSize: isFullPage ? 18 : 16,
    quantitySelectorBorderRadius: isFullPage ? 12 : 8,

    // Variant Selector
    variantSelectorBgColor: "#FFFFFF",
    variantSelectorTextColor: isFullPage ? "#111827" : "#000000",
    variantSelectorBorderRadius: isFullPage ? 12 : 8,

    // Modal
    modalBgColor: "#FFFFFF",
    modalBorderRadius: 12,
    modalTitleFontSize: 28,
    modalTitleFontWeight: 700,
    modalPriceFontSize: 22,
    modalVariantBorderRadius: 8,
    modalButtonBgColor: "#000000",
    modalButtonTextColor: "#FFFFFF",
    modalButtonBorderRadius: 8,

    // Footer
    footerBgColor: "#FFFFFF",
    footerTotalBgColor: isFullPage ? "#F9FAFB" : "#F6F6F6",
    footerBorderRadius: isFullPage ? 12 : 8,
    footerPadding: isFullPage ? 20 : 16,
    footerFinalPriceColor: isFullPage ? "#111827" : "#000000",
    footerFinalPriceFontSize: isFullPage ? 20 : 18,
    footerFinalPriceFontWeight: 700,
    footerStrikePriceColor: isFullPage ? "#9CA3AF" : "#8D8D8D",
    footerStrikeFontSize: isFullPage ? 16 : 14,
    footerStrikeFontWeight: 400,
    footerPriceVisibility: true,
    footerBackButtonBgColor: "#FFFFFF",
    footerBackButtonTextColor: isFullPage ? "#111827" : "#000000",
    footerBackButtonBorderColor: isFullPage ? "#E5E7EB" : "#E3E3E3",
    footerBackButtonBorderRadius: isFullPage ? 12 : 8,
    footerNextButtonBgColor: isFullPage ? "#7132FF" : "#000000",
    footerNextButtonTextColor: "#FFFFFF",
    footerNextButtonBorderColor: isFullPage ? "#7132FF" : "#000000",
    footerNextButtonBorderRadius: isFullPage ? 12 : 8,
    footerDiscountTextVisibility: true,
    footerProgressBarFilledColor: isFullPage ? "#7132FF" : "#000000",
    footerProgressBarEmptyColor: isFullPage ? "#E5E7EB" : "#E3E3E3",

    // Success Message
    successMessageFontSize: 16,
    successMessageFontWeight: 600,
    successMessageTextColor: "#065F46",
    successMessageBgColor: "#D1FAE5",

    // Header Tabs
    headerTabActiveBgColor: "#000000",
    headerTabActiveTextColor: "#FFFFFF",
    headerTabInactiveBgColor: "#FFFFFF",
    headerTabInactiveTextColor: "#000000",
    headerTabRadius: 67,
    conditionsTextColor: "#FFFFFF",
    conditionsTextFontSize: 16,
    discountTextColor: isFullPage ? "#111827" : "#000000",
    discountTextFontSize: 14,

    // Step Bar
    stepNameFontColor: isFullPage ? "#111827" : "#000000",
    stepNameFontSize: isFullPage ? 18 : 16,
    completedStepCheckMarkColor: "#FFFFFF",
    completedStepBgColor: isFullPage ? "#7132FF" : "#000000",
    completedStepCircleBorderColor: isFullPage ? "#7132FF" : "#000000",
    completedStepCircleBorderRadius: 50,
    incompleteStepBgColor: isFullPage ? "#F9FAFB" : "#FFFFFF",
    incompleteStepCircleStrokeColor: isFullPage ? "#9CA3AF" : "#000000",
    incompleteStepCircleStrokeRadius: 50,
    stepBarProgressFilledColor: isFullPage ? "#7132FF" : "#000000",
    stepBarProgressEmptyColor: isFullPage ? "#E5E7EB" : "#C6C6C6",

    // Tabs
    tabsActiveBgColor: isFullPage ? "#7132FF" : "#000000",
    tabsActiveTextColor: "#FFFFFF",
    tabsInactiveBgColor: isFullPage ? "#F9FAFB" : "#FFFFFF",
    tabsInactiveTextColor: isFullPage ? "#111827" : "#000000",
    tabsBorderColor: isFullPage ? "#E5E7EB" : "#000000",
    tabsBorderRadius: isFullPage ? 12 : 8,

    // Empty State
    emptyStateCardBgColor: isFullPage ? "#F9FAFB" : "#FFFFFF",
    emptyStateCardBorderColor: isFullPage ? "#E5E7EB" : "#F6F6F6",
    emptyStateTextColor: "#9CA3AF",
    emptyStateBorderStyle: "dashed",

    // General
    drawerBgColor: isFullPage ? "#F9FAFB" : "#FFFFFF",
    addToCartButtonBgColor: isFullPage ? "#7132FF" : "#000000",
    addToCartButtonTextColor: "#FFFFFF",
    addToCartButtonBorderRadius: 67,
    toastBgColor: isFullPage ? "#7132FF" : "#000000",
    toastTextColor: "#FFFFFF",
    bundleBgColor: isFullPage ? "#F9FAFB" : "#FFFFFF",
    footerScrollBarColor: isFullPage ? "#7132FF" : "#000000",
    productPageTitleFontColor: isFullPage ? "#111827" : "#000000",
    productPageTitleFontSize: isFullPage ? 28 : 24,
    bundleUpsellButtonBgColor: isFullPage ? "#7132FF" : "#000000",
    bundleUpsellBorderColor: isFullPage ? "#7132FF" : "#000000",
    bundleUpsellTextColor: "#FFFFFF",
    filterIconColor: isFullPage ? "#111827" : "#000000",
    filterBgColor: isFullPage ? "#F9FAFB" : "#FFFFFF",
    filterTextColor: isFullPage ? "#111827" : "#000000",

    // Custom CSS
    customCss: "",
  };
};

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useDesignControlPanelState(loaderSettings: LoaderSettings) {
  // Bundle type selection
  const [selectedBundleType, setSelectedBundleType] = useState<BundleType>("product_page");

  // Navigation state
  const [expandedSection, setExpandedSection] = useState<string | null>("productCard");
  const [activeSubSection, setActiveSubSection] = useState<string>("productCard");

  // Original settings from server (for dirty check and discard)
  const [originalSettings, setOriginalSettings] = useState<LoaderSettings>(loaderSettings);

  // Current working settings
  const [currentSettings, setCurrentSettings] = useState<DesignSettings>(
    () => loaderSettings[selectedBundleType] || getDefaultSettings(selectedBundleType)
  );

  // Toast state
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);

  // Custom CSS help modal state
  const [customCssHelpOpen, setCustomCssHelpOpen] = useState(false);

  // Sync with loader data when it changes
  useEffect(() => {
    setOriginalSettings(loaderSettings);
  }, [loaderSettings]);

  // Update current settings when bundle type changes
  useEffect(() => {
    const newSettings = loaderSettings[selectedBundleType] || getDefaultSettings(selectedBundleType);
    setCurrentSettings(newSettings);

    // Also sync to state service
    appStateService.setDesignSettings(
      selectedBundleType === "full_page" ? "full_page" : "product_page",
      newSettings
    );
    appStateService.setSelectedBundleType(
      selectedBundleType === "full_page" ? "full_page" : "product_page"
    );
  }, [selectedBundleType, loaderSettings]);

  // Generic setting updater
  const updateSetting = useCallback(<K extends keyof DesignSettings>(
    key: K,
    value: DesignSettings[K]
  ) => {
    setCurrentSettings(prev => ({
      ...prev,
      [key]: value,
    }));

    // Also update state service
    appStateService.updateDesignSetting(key, value);
  }, []);

  // Bulk update settings
  const updateSettings = useCallback((updates: Partial<DesignSettings>) => {
    setCurrentSettings(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const original = originalSettings[selectedBundleType];
    if (!original) return false;

    // Compare all keys
    const keys = Object.keys(currentSettings) as (keyof DesignSettings)[];
    return keys.some(key => {
      const currentValue = currentSettings[key];
      const originalValue = original[key];

      // Handle special cases
      if (key === "productCardsPerRow") {
        return String(currentValue) !== String(originalValue);
      }
      if (key === "customCss") {
        return (currentValue || "") !== (originalValue || "");
      }

      return currentValue !== originalValue;
    });
  }, [currentSettings, originalSettings, selectedBundleType]);

  // Discard changes and revert to saved values
  const handleDiscard = useCallback(() => {
    const savedSettings = originalSettings[selectedBundleType] || getDefaultSettings(selectedBundleType);
    setCurrentSettings(savedSettings);

    // Also update state service
    appStateService.setDesignSettings(
      selectedBundleType === "full_page" ? "full_page" : "product_page",
      savedSettings
    );
    appStateService.setDesignSettingsDirty(false);
  }, [originalSettings, selectedBundleType]);

  // Get settings formatted for save (API submission)
  const getSettingsForSave = useCallback(() => {
    return {
      ...currentSettings,
      productCardsPerRow: typeof currentSettings.productCardsPerRow === 'string'
        ? parseInt(currentSettings.productCardsPerRow, 10)
        : currentSettings.productCardsPerRow,
      buttonHoverBgColor: currentSettings.buttonBgColor, // Derived value
    };
  }, [currentSettings]);

  // Mark settings as saved (after successful API call)
  const markAsSaved = useCallback(() => {
    setOriginalSettings(prev => ({
      ...prev,
      [selectedBundleType]: { ...currentSettings },
    }));
    appStateService.setDesignSettingsDirty(false);
  }, [currentSettings, selectedBundleType]);

  // Navigation helpers
  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  const handleSubSectionClick = useCallback((subSection: string) => {
    setActiveSubSection(subSection);
  }, []);

  // Toast helpers
  const showToast = useCallback((message: string, isError: boolean = false) => {
    setToastMessage(message);
    setToastError(isError);
    setToastActive(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastActive(false);
  }, []);

  // Return the hook API
  return {
    // Bundle type
    selectedBundleType,
    setSelectedBundleType,

    // Current settings (all values)
    settings: currentSettings,

    // Individual value access (for convenience)
    ...currentSettings,

    // Update functions
    updateSetting,
    updateSettings,

    // Dirty state
    hasUnsavedChanges,

    // Actions
    handleDiscard,
    getSettingsForSave,
    markAsSaved,

    // Navigation
    expandedSection,
    setExpandedSection,
    activeSubSection,
    setActiveSubSection,
    toggleSection,
    handleSubSectionClick,

    // Toast
    toastActive,
    toastMessage,
    toastError,
    showToast,
    hideToast,
    setToastActive,
    setToastMessage,
    setToastError,

    // Custom CSS help
    customCssHelpOpen,
    setCustomCssHelpOpen,

    // Original settings (for reference)
    originalSettings,
  };
}

// ============================================
// INDIVIDUAL SETTER HOOKS (for backward compatibility)
// ============================================

/**
 * Creates individual setter functions for each design setting.
 * This provides backward compatibility with the original useState pattern.
 */
export function createSettingSetters(
  updateSetting: <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => void
) {
  return {
    // Global Colors
    setGlobalPrimaryButtonColor: (v: string) => updateSetting("globalPrimaryButtonColor", v),
    setGlobalButtonTextColor: (v: string) => updateSetting("globalButtonTextColor", v),
    setGlobalPrimaryTextColor: (v: string) => updateSetting("globalPrimaryTextColor", v),
    setGlobalSecondaryTextColor: (v: string) => updateSetting("globalSecondaryTextColor", v),
    setGlobalFooterBgColor: (v: string) => updateSetting("globalFooterBgColor", v),
    setGlobalFooterTextColor: (v: string) => updateSetting("globalFooterTextColor", v),

    // Product Card
    setProductCardBgColor: (v: string) => updateSetting("productCardBgColor", v),
    setProductCardFontColor: (v: string) => updateSetting("productCardFontColor", v),
    setProductCardFontSize: (v: number) => updateSetting("productCardFontSize", v),
    setProductCardFontWeight: (v: number) => updateSetting("productCardFontWeight", v),
    setProductCardImageFit: (v: string) => updateSetting("productCardImageFit", v),
    setProductCardsPerRow: (v: string | number) => updateSetting("productCardsPerRow", v),
    setProductTitleVisibility: (v: boolean) => updateSetting("productTitleVisibility", v),
    setProductPriceVisibility: (v: boolean) => updateSetting("productPriceVisibility", v),
    setProductPriceBgColor: (v: string) => updateSetting("productPriceBgColor", v),

    // Product Card Typography
    setProductStrikePriceColor: (v: string) => updateSetting("productStrikePriceColor", v),
    setProductStrikeFontSize: (v: number) => updateSetting("productStrikeFontSize", v),
    setProductStrikeFontWeight: (v: number) => updateSetting("productStrikeFontWeight", v),
    setProductFinalPriceColor: (v: string) => updateSetting("productFinalPriceColor", v),
    setProductFinalPriceFontSize: (v: number) => updateSetting("productFinalPriceFontSize", v),
    setProductFinalPriceFontWeight: (v: number) => updateSetting("productFinalPriceFontWeight", v),

    // Product Card Dimensions
    setProductCardWidth: (v: number) => updateSetting("productCardWidth", v),
    setProductCardHeight: (v: number) => updateSetting("productCardHeight", v),
    setProductCardSpacing: (v: number) => updateSetting("productCardSpacing", v),
    setProductCardBorderRadius: (v: number) => updateSetting("productCardBorderRadius", v),
    setProductCardPadding: (v: number) => updateSetting("productCardPadding", v),
    setProductCardBorderWidth: (v: number) => updateSetting("productCardBorderWidth", v),
    setProductCardBorderColor: (v: string) => updateSetting("productCardBorderColor", v),
    setProductCardShadow: (v: string) => updateSetting("productCardShadow", v),
    setProductCardHoverShadow: (v: string) => updateSetting("productCardHoverShadow", v),

    // Product Image
    setProductImageHeight: (v: number) => updateSetting("productImageHeight", v),
    setProductImageBorderRadius: (v: number) => updateSetting("productImageBorderRadius", v),
    setProductImageBgColor: (v: string) => updateSetting("productImageBgColor", v),

    // Button
    setButtonBgColor: (v: string) => updateSetting("buttonBgColor", v),
    setButtonTextColor: (v: string) => updateSetting("buttonTextColor", v),
    setButtonFontSize: (v: number) => updateSetting("buttonFontSize", v),
    setButtonFontWeight: (v: number) => updateSetting("buttonFontWeight", v),
    setButtonBorderRadius: (v: number) => updateSetting("buttonBorderRadius", v),
    setButtonAddToCartText: (v: string) => updateSetting("buttonAddToCartText", v),

    // Quantity Selector
    setQuantitySelectorBgColor: (v: string) => updateSetting("quantitySelectorBgColor", v),
    setQuantitySelectorTextColor: (v: string) => updateSetting("quantitySelectorTextColor", v),
    setQuantitySelectorFontSize: (v: number) => updateSetting("quantitySelectorFontSize", v),
    setQuantitySelectorBorderRadius: (v: number) => updateSetting("quantitySelectorBorderRadius", v),

    // Variant Selector
    setVariantSelectorBgColor: (v: string) => updateSetting("variantSelectorBgColor", v),
    setVariantSelectorTextColor: (v: string) => updateSetting("variantSelectorTextColor", v),
    setVariantSelectorBorderRadius: (v: number) => updateSetting("variantSelectorBorderRadius", v),

    // Modal
    setModalBgColor: (v: string) => updateSetting("modalBgColor", v),
    setModalBorderRadius: (v: number) => updateSetting("modalBorderRadius", v),
    setModalTitleFontSize: (v: number) => updateSetting("modalTitleFontSize", v),
    setModalTitleFontWeight: (v: number) => updateSetting("modalTitleFontWeight", v),
    setModalPriceFontSize: (v: number) => updateSetting("modalPriceFontSize", v),
    setModalVariantBorderRadius: (v: number) => updateSetting("modalVariantBorderRadius", v),
    setModalButtonBgColor: (v: string) => updateSetting("modalButtonBgColor", v),
    setModalButtonTextColor: (v: string) => updateSetting("modalButtonTextColor", v),
    setModalButtonBorderRadius: (v: number) => updateSetting("modalButtonBorderRadius", v),

    // Footer
    setFooterBgColor: (v: string) => updateSetting("footerBgColor", v),
    setFooterTotalBgColor: (v: string) => updateSetting("footerTotalBgColor", v),
    setFooterBorderRadius: (v: number) => updateSetting("footerBorderRadius", v),
    setFooterPadding: (v: number) => updateSetting("footerPadding", v),
    setFooterFinalPriceColor: (v: string) => updateSetting("footerFinalPriceColor", v),
    setFooterFinalPriceFontSize: (v: number) => updateSetting("footerFinalPriceFontSize", v),
    setFooterFinalPriceFontWeight: (v: number) => updateSetting("footerFinalPriceFontWeight", v),
    setFooterStrikePriceColor: (v: string) => updateSetting("footerStrikePriceColor", v),
    setFooterStrikeFontSize: (v: number) => updateSetting("footerStrikeFontSize", v),
    setFooterStrikeFontWeight: (v: number) => updateSetting("footerStrikeFontWeight", v),
    setFooterPriceVisibility: (v: boolean) => updateSetting("footerPriceVisibility", v),
    setFooterBackButtonBgColor: (v: string) => updateSetting("footerBackButtonBgColor", v),
    setFooterBackButtonTextColor: (v: string) => updateSetting("footerBackButtonTextColor", v),
    setFooterBackButtonBorderColor: (v: string) => updateSetting("footerBackButtonBorderColor", v),
    setFooterBackButtonBorderRadius: (v: number) => updateSetting("footerBackButtonBorderRadius", v),
    setFooterNextButtonBgColor: (v: string) => updateSetting("footerNextButtonBgColor", v),
    setFooterNextButtonTextColor: (v: string) => updateSetting("footerNextButtonTextColor", v),
    setFooterNextButtonBorderColor: (v: string) => updateSetting("footerNextButtonBorderColor", v),
    setFooterNextButtonBorderRadius: (v: number) => updateSetting("footerNextButtonBorderRadius", v),
    setFooterDiscountTextVisibility: (v: boolean) => updateSetting("footerDiscountTextVisibility", v),
    setFooterProgressBarFilledColor: (v: string) => updateSetting("footerProgressBarFilledColor", v),
    setFooterProgressBarEmptyColor: (v: string) => updateSetting("footerProgressBarEmptyColor", v),

    // Success Message
    setSuccessMessageFontSize: (v: number) => updateSetting("successMessageFontSize", v),
    setSuccessMessageFontWeight: (v: number) => updateSetting("successMessageFontWeight", v),
    setSuccessMessageTextColor: (v: string) => updateSetting("successMessageTextColor", v),
    setSuccessMessageBgColor: (v: string) => updateSetting("successMessageBgColor", v),

    // Header Tabs
    setHeaderTabActiveBgColor: (v: string) => updateSetting("headerTabActiveBgColor", v),
    setHeaderTabActiveTextColor: (v: string) => updateSetting("headerTabActiveTextColor", v),
    setHeaderTabInactiveBgColor: (v: string) => updateSetting("headerTabInactiveBgColor", v),
    setHeaderTabInactiveTextColor: (v: string) => updateSetting("headerTabInactiveTextColor", v),
    setHeaderTabRadius: (v: number) => updateSetting("headerTabRadius", v),
    setConditionsTextColor: (v: string) => updateSetting("conditionsTextColor", v),
    setConditionsTextFontSize: (v: number) => updateSetting("conditionsTextFontSize", v),
    setDiscountTextColor: (v: string) => updateSetting("discountTextColor", v),
    setDiscountTextFontSize: (v: number) => updateSetting("discountTextFontSize", v),

    // Step Bar
    setStepNameFontColor: (v: string) => updateSetting("stepNameFontColor", v),
    setStepNameFontSize: (v: number) => updateSetting("stepNameFontSize", v),
    setCompletedStepCheckMarkColor: (v: string) => updateSetting("completedStepCheckMarkColor", v),
    setCompletedStepBgColor: (v: string) => updateSetting("completedStepBgColor", v),
    setCompletedStepCircleBorderColor: (v: string) => updateSetting("completedStepCircleBorderColor", v),
    setCompletedStepCircleBorderRadius: (v: number) => updateSetting("completedStepCircleBorderRadius", v),
    setIncompleteStepBgColor: (v: string) => updateSetting("incompleteStepBgColor", v),
    setIncompleteStepCircleStrokeColor: (v: string) => updateSetting("incompleteStepCircleStrokeColor", v),
    setIncompleteStepCircleStrokeRadius: (v: number) => updateSetting("incompleteStepCircleStrokeRadius", v),
    setStepBarProgressFilledColor: (v: string) => updateSetting("stepBarProgressFilledColor", v),
    setStepBarProgressEmptyColor: (v: string) => updateSetting("stepBarProgressEmptyColor", v),

    // Tabs
    setTabsActiveBgColor: (v: string) => updateSetting("tabsActiveBgColor", v),
    setTabsActiveTextColor: (v: string) => updateSetting("tabsActiveTextColor", v),
    setTabsInactiveBgColor: (v: string) => updateSetting("tabsInactiveBgColor", v),
    setTabsInactiveTextColor: (v: string) => updateSetting("tabsInactiveTextColor", v),
    setTabsBorderColor: (v: string) => updateSetting("tabsBorderColor", v),
    setTabsBorderRadius: (v: number) => updateSetting("tabsBorderRadius", v),

    // Empty State
    setEmptyStateCardBgColor: (v: string) => updateSetting("emptyStateCardBgColor", v),
    setEmptyStateCardBorderColor: (v: string) => updateSetting("emptyStateCardBorderColor", v),
    setEmptyStateTextColor: (v: string) => updateSetting("emptyStateTextColor", v),
    setEmptyStateBorderStyle: (v: string) => updateSetting("emptyStateBorderStyle", v),

    // General
    setDrawerBgColor: (v: string) => updateSetting("drawerBgColor", v),
    setAddToCartButtonBgColor: (v: string) => updateSetting("addToCartButtonBgColor", v),
    setAddToCartButtonTextColor: (v: string) => updateSetting("addToCartButtonTextColor", v),
    setAddToCartButtonBorderRadius: (v: number) => updateSetting("addToCartButtonBorderRadius", v),
    setToastBgColor: (v: string) => updateSetting("toastBgColor", v),
    setToastTextColor: (v: string) => updateSetting("toastTextColor", v),
    setBundleBgColor: (v: string) => updateSetting("bundleBgColor", v),
    setFooterScrollBarColor: (v: string) => updateSetting("footerScrollBarColor", v),
    setProductPageTitleFontColor: (v: string) => updateSetting("productPageTitleFontColor", v),
    setProductPageTitleFontSize: (v: number) => updateSetting("productPageTitleFontSize", v),
    setBundleUpsellButtonBgColor: (v: string) => updateSetting("bundleUpsellButtonBgColor", v),
    setBundleUpsellBorderColor: (v: string) => updateSetting("bundleUpsellBorderColor", v),
    setBundleUpsellTextColor: (v: string) => updateSetting("bundleUpsellTextColor", v),
    setFilterIconColor: (v: string) => updateSetting("filterIconColor", v),
    setFilterBgColor: (v: string) => updateSetting("filterBgColor", v),
    setFilterTextColor: (v: string) => updateSetting("filterTextColor", v),

    // Custom CSS
    setCustomCss: (v: string) => updateSetting("customCss", v),
  };
}

export type SettingSetters = ReturnType<typeof createSettingSetters>;
