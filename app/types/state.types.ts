/**
 * Centralized State Type Definitions
 *
 * This file contains all TypeScript interfaces for the centralized state management system.
 * It serves as the single source of truth for state types across the application.
 */

// ============================================
// DESIGN SETTINGS TYPES
// ============================================

/**
 * Global color settings that apply across the bundle widget
 */
export interface GlobalColorSettings {
  globalPrimaryButtonColor: string;
  globalButtonTextColor: string;
  globalPrimaryTextColor: string;
  globalSecondaryTextColor: string;
  globalFooterBgColor: string;
  globalFooterTextColor: string;
}

/**
 * Product card appearance settings
 */
export interface ProductCardSettings {
  // Background & Typography
  productCardBgColor: string;
  productCardFontColor: string;
  productCardFontSize: number;
  productCardFontWeight: number;
  productCardImageFit: string;
  productCardsPerRow: number | string; // Can be string from select component
  productTitleVisibility: boolean;
  productPriceVisibility: boolean;
  productPriceBgColor: string;

  // Price Typography
  productStrikePriceColor: string;
  productStrikeFontSize: number;
  productStrikeFontWeight: number;
  productFinalPriceColor: string;
  productFinalPriceFontSize: number;
  productFinalPriceFontWeight: number;

  // Layout & Dimensions
  productCardWidth: number;
  productCardHeight: number;
  productCardSpacing: number;
  productCardBorderRadius: number;
  productCardPadding: number;
  productCardMargin: number;
  productCardBorderWidth: number;
  productCardBorderColor: string;
  productCardShadow: string;
  productCardHoverShadow: string;

  // Product Image
  productImageHeight: number;
  productImageBorderRadius: number;
  productImageBgColor: string;
}

/**
 * Button appearance settings
 */
export interface ButtonSettings {
  buttonBgColor: string;
  buttonTextColor: string;
  buttonFontSize: number;
  buttonFontWeight: number;
  buttonBorderRadius: number;
  buttonHoverBgColor: string;
  buttonAddToCartText: string;
}

/**
 * Quantity selector settings
 */
export interface QuantitySelectorSettings {
  quantitySelectorBgColor: string;
  quantitySelectorTextColor: string;
  quantitySelectorFontSize: number;
  quantitySelectorBorderRadius: number;
}

/**
 * Variant selector settings
 */
export interface VariantSelectorSettings {
  variantSelectorBgColor: string;
  variantSelectorTextColor: string;
  variantSelectorBorderRadius: number;
}

/**
 * Modal appearance settings
 */
export interface ModalSettings {
  modalBgColor: string;
  modalBorderRadius: number;
  modalTitleFontSize: number;
  modalTitleFontWeight: number;
  modalPriceFontSize: number;
  modalVariantBorderRadius: number;
  modalButtonBgColor: string;
  modalButtonTextColor: string;
  modalButtonBorderRadius: number;
}

/**
 * Footer appearance settings
 */
export interface FooterSettings {
  // Background & Layout
  footerBgColor: string;
  footerTotalBgColor: string;
  footerBorderRadius: number;
  footerPadding: number;

  // Price Typography
  footerFinalPriceColor: string;
  footerFinalPriceFontSize: number;
  footerFinalPriceFontWeight: number;
  footerStrikePriceColor: string;
  footerStrikeFontSize: number;
  footerStrikeFontWeight: number;
  footerPriceVisibility: boolean;

  // Buttons
  footerBackButtonBgColor: string;
  footerBackButtonTextColor: string;
  footerBackButtonBorderColor: string;
  footerBackButtonBorderRadius: number;
  footerNextButtonBgColor: string;
  footerNextButtonTextColor: string;
  footerNextButtonBorderColor: string;
  footerNextButtonBorderRadius: number;

  // Discount & Progress
  footerDiscountTextVisibility: boolean;
  footerProgressBarFilledColor: string;
  footerProgressBarEmptyColor: string;
}

/**
 * Success message styling
 */
export interface SuccessMessageSettings {
  successMessageFontSize: number;
  successMessageFontWeight: number;
  successMessageTextColor: string;
  successMessageBgColor: string;
}

/**
 * Header/Tab settings
 */
export interface HeaderTabSettings {
  headerTabActiveBgColor: string;
  headerTabActiveTextColor: string;
  headerTabInactiveBgColor: string;
  headerTabInactiveTextColor: string;
  headerTabRadius: number;
  conditionsTextColor: string;
  conditionsTextFontSize: number;
  discountTextColor: string;
  discountTextFontSize: number;
}

/**
 * Step bar settings
 */
export interface StepBarSettings {
  stepNameFontColor: string;
  stepNameFontSize: number;
  completedStepCheckMarkColor: string;
  completedStepBgColor: string;
  completedStepCircleBorderColor: string;
  completedStepCircleBorderRadius: number;
  incompleteStepBgColor: string;
  incompleteStepCircleStrokeColor: string;
  incompleteStepCircleStrokeRadius: number;
  stepBarProgressFilledColor: string;
  stepBarProgressEmptyColor: string;
}

/**
 * Tab component settings
 */
export interface TabSettings {
  tabsActiveBgColor: string;
  tabsActiveTextColor: string;
  tabsInactiveBgColor: string;
  tabsInactiveTextColor: string;
  tabsBorderColor: string;
  tabsBorderRadius: number;
}

/**
 * Empty state settings
 */
export interface EmptyStateSettings {
  emptyStateCardBgColor: string;
  emptyStateCardBorderColor: string;
  emptyStateTextColor: string;
  emptyStateBorderStyle: string;
}

/**
 * General/miscellaneous settings
 */
export interface GeneralSettings {
  drawerBgColor: string;
  addToCartButtonBgColor: string;
  addToCartButtonTextColor: string;
  addToCartButtonBorderRadius: number;
  // Discount Pill (on Add to Cart button)
  discountPillBgColor: string;
  discountPillTextColor: string;
  discountPillFontSize: number;
  discountPillFontWeight: number;
  discountPillBorderRadius: number;
  toastBgColor: string;
  toastTextColor: string;
  bundleBgColor: string;
  footerScrollBarColor: string;
  productPageTitleFontColor: string;
  productPageTitleFontSize: number;
  bundleUpsellButtonBgColor: string;
  bundleUpsellBorderColor: string;
  bundleUpsellTextColor: string;
  filterIconColor: string;
  filterBgColor: string;
  filterTextColor: string;
}

/**
 * Promo banner settings (full-page bundles)
 */
export interface PromoBannerSettings {
  promoBannerEnabled: boolean;
  promoBannerBgColor: string;
  promoBannerTitleColor: string;
  promoBannerTitleFontSize: number;
  promoBannerTitleFontWeight: number;
  promoBannerSubtitleColor: string;
  promoBannerSubtitleFontSize: number;
  promoBannerNoteColor: string;
  promoBannerNoteFontSize: number;
  promoBannerBorderRadius: number;
  promoBannerPadding: number;
}

/**
 * Complete design settings for a bundle type
 */
export interface DesignSettings extends
  GlobalColorSettings,
  ProductCardSettings,
  ButtonSettings,
  QuantitySelectorSettings,
  VariantSelectorSettings,
  ModalSettings,
  FooterSettings,
  SuccessMessageSettings,
  HeaderTabSettings,
  StepBarSettings,
  TabSettings,
  EmptyStateSettings,
  GeneralSettings,
  PromoBannerSettings {
  customCss: string;
}

/**
 * Design settings state for state service
 */
export interface DesignSettingsState {
  fullPage: DesignSettings | null;
  productPage: DesignSettings | null;
  selectedBundleType: 'full_page' | 'product_page';
  isDirty: boolean;
  isLoading: boolean;
}

// ============================================
// UI STATE TYPES
// ============================================

/**
 * Toast notification state
 */
export interface ToastState {
  id: string;
  message: string;
  isError: boolean;
  isVisible: boolean;
}

/**
 * Modal visibility state
 */
export interface ModalState {
  [key: string]: boolean;
}

/**
 * Navigation state for UI
 */
export interface NavigationState {
  expandedSection: string | null;
  activeSubSection: string;
  activeTabIndex: number;
}

/**
 * Complete UI state
 */
export interface UIState {
  modals: ModalState;
  toasts: ToastState[];
  navigation: NavigationState;
  isLoading: boolean;
}

// ============================================
// BUNDLE FORM STATE TYPES
// ============================================

export type BundleStatus = 'active' | 'draft' | 'archived';
export type BundleType = 'full_page' | 'product_page' | 'cart_transform';

/**
 * Basic bundle form data
 */
export interface BundleFormData {
  id: string;
  name: string;
  description: string;
  status: BundleStatus;
  bundleType: BundleType;
  templateName: string;
}

/**
 * Bundle step data
 */
export interface BundleStep {
  id: string;
  name: string;
  collections: Collection[];
  products: Product[];
  StepProduct: StepProduct[];
  displayVariantsAsIndividual: boolean;
  minQuantity: number;
  maxQuantity: number;
  enabled: boolean;
}

/**
 * Collection reference
 */
export interface Collection {
  id: string;
  title: string;
  handle: string;
  productsCount?: number;
}

/**
 * Product reference
 */
export interface Product {
  id: string;
  title: string;
  handle: string;
  images?: { url: string }[];
  variants?: ProductVariant[];
}

/**
 * Product variant
 */
export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  image?: { url: string };
}

/**
 * Step product association
 */
export interface StepProduct {
  id: string;
  productId: string;
  product?: Product;
}

/**
 * Condition rule for steps
 */
export interface ConditionRule {
  id: string;
  type: string;
  operator: string;
  value: string;
}

/**
 * Pricing rule
 */
export interface PricingRule {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  discountValue: number;
  discountType: string;
  discountText: string;
  successMessage: string;
}

/**
 * Pricing settings
 */
export interface PricingSettings {
  enabled: boolean;
  method: string;
  rules: PricingRule[];
  showFooter: boolean;
}

/**
 * Complete bundle configuration state
 */
export interface BundleConfigurationState {
  form: BundleFormData | null;
  steps: BundleStep[];
  pricing: PricingSettings | null;
  stepConditions: Record<string, ConditionRule[]>;
  selectedCollections: Record<string, Collection[]>;
  isDirty: boolean;
  isLoading: boolean;
}

// ============================================
// USER PREFERENCES
// ============================================

/**
 * User preferences stored client-side
 */
export interface UserPreferences {
  sidebarCollapsed: boolean;
  recentBundles: string[];
  theme: 'light' | 'dark' | 'system';
  showTips: boolean;
}

// ============================================
// SUBSCRIPTION STATE
// ============================================

/**
 * Subscription plan info
 */
export interface SubscriptionState {
  plan: string;
  status: string;
  isActive: boolean;
  bundleLimit: number;
  currentBundleCount: number;
  canCreateBundle: boolean;
}

// ============================================
// COMPLETE APP STATE
// ============================================

/**
 * Complete application state structure
 */
export interface AppState {
  // Design settings (cached from server)
  designSettings: DesignSettingsState;

  // UI states
  ui: UIState;

  // Current bundle being edited (if any)
  bundleConfiguration: BundleConfigurationState;

  // User preferences (persisted to localStorage)
  preferences: UserPreferences;

  // Subscription info (cached from server)
  subscription: SubscriptionState | null;

  // Meta state
  meta: {
    initialized: boolean;
    lastUpdated: number;
    version: string;
  };
}

// ============================================
// STATE ACTION TYPES
// ============================================

/**
 * State update action types for reducers
 */
export type StateAction =
  | { type: 'SET_DESIGN_SETTINGS'; payload: { bundleType: 'full_page' | 'product_page'; settings: DesignSettings } }
  | { type: 'UPDATE_DESIGN_SETTING'; payload: { key: keyof DesignSettings; value: any } }
  | { type: 'SET_SELECTED_BUNDLE_TYPE'; payload: 'full_page' | 'product_page' }
  | { type: 'SET_DESIGN_DIRTY'; payload: boolean }
  | { type: 'OPEN_MODAL'; payload: string }
  | { type: 'CLOSE_MODAL'; payload: string }
  | { type: 'SHOW_TOAST'; payload: Omit<ToastState, 'id' | 'isVisible'> }
  | { type: 'HIDE_TOAST'; payload: string }
  | { type: 'SET_NAVIGATION'; payload: Partial<NavigationState> }
  | { type: 'SET_BUNDLE_FORM'; payload: BundleFormData }
  | { type: 'UPDATE_BUNDLE_FORM'; payload: Partial<BundleFormData> }
  | { type: 'SET_BUNDLE_STEPS'; payload: BundleStep[] }
  | { type: 'ADD_BUNDLE_STEP'; payload: BundleStep }
  | { type: 'UPDATE_BUNDLE_STEP'; payload: { stepId: string; updates: Partial<BundleStep> } }
  | { type: 'REMOVE_BUNDLE_STEP'; payload: string }
  | { type: 'SET_PRICING'; payload: PricingSettings }
  | { type: 'UPDATE_PRICING'; payload: Partial<PricingSettings> }
  | { type: 'SET_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_SUBSCRIPTION'; payload: SubscriptionState }
  | { type: 'SET_LOADING'; payload: { key: string; value: boolean } }
  | { type: 'RESET_STATE' };

// ============================================
// STATE OBSERVER TYPES
// ============================================

/**
 * State change listener
 */
export type StateListener<T = any> = (state: T, prevState: T) => void;

/**
 * State selector function
 */
export type StateSelector<T> = (state: AppState) => T;

/**
 * Subscription cleanup function
 */
export type Unsubscribe = () => void;
