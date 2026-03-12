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
import { BundleType } from "../constants/bundle";
import { getDefaultSettings } from "../components/design-control-panel/config/defaultSettings";

// ============================================
// TYPES
// ============================================

export type { BundleType };

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
// HOOK IMPLEMENTATION
// ============================================

export function useDesignControlPanelState(loaderSettings: LoaderSettings) {
  // Bundle type selection
  const [selectedBundleType, setSelectedBundleType] = useState<BundleType>(BundleType.PRODUCT_PAGE);

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
      selectedBundleType === BundleType.FULL_PAGE ? BundleType.FULL_PAGE : BundleType.PRODUCT_PAGE,
      newSettings
    );
    appStateService.setSelectedBundleType(
      selectedBundleType === BundleType.FULL_PAGE ? BundleType.FULL_PAGE : BundleType.PRODUCT_PAGE
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

  // Bulk update settings (used for batch updates to prevent flicker)
  const updateSettings = useCallback((updates: Partial<DesignSettings>) => {
    setCurrentSettings(prev => ({
      ...prev,
      ...updates,
    }));

    // Also update state service for each setting
    Object.entries(updates).forEach(([key, value]) => {
      appStateService.updateDesignSetting(key as keyof DesignSettings, value);
    });
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
      selectedBundleType === BundleType.FULL_PAGE ? BundleType.FULL_PAGE : BundleType.PRODUCT_PAGE,
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
