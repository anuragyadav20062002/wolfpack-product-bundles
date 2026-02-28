/**
 * React Context for Application State
 *
 * This context wraps the AppStateService singleton and provides
 * React-style hooks for accessing and updating state with automatic
 * component re-renders on state changes.
 *
 * Usage:
 *   // Wrap your app with the provider
 *   <AppStateProvider>
 *     <App />
 *   </AppStateProvider>
 *
 *   // Use hooks in components
 *   const { state, dispatch, ...actions } = useAppState();
 *   const designSettings = useDesignSettings();
 *   const { openModal, closeModal } = useModals();
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { BundleType } from "../constants/bundle";
import type {
  AppStateService} from "../services/app.state.service";
import {
  appState as appStateService,
} from "../services/app.state.service";
import type {
  AppState,
  DesignSettings,
  DesignSettingsState,
  UIState,
  BundleConfigurationState,
  BundleFormData,
  BundleStep,
  PricingSettings,
  ConditionRule,
  Collection,
  UserPreferences,
  SubscriptionState,
  NavigationState,
  StateAction,
  StateSelector,
} from "../types/state.types";

// ============================================
// CONTEXT TYPES
// ============================================

interface AppStateContextValue {
  // Full state
  state: AppState;

  // Dispatch for reducer-style updates
  dispatch: (action: StateAction) => void;

  // Design Settings Actions
  setDesignSettings: (bundleType: BundleType, settings: DesignSettings) => void;
  updateDesignSetting: <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => void;
  setSelectedBundleType: (bundleType: BundleType) => void;
  setDesignSettingsDirty: (isDirty: boolean) => void;

  // UI Actions
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  showToast: (message: string, isError?: boolean) => string;
  hideToast: (toastId: string) => void;
  setNavigationState: (navigation: Partial<NavigationState>) => void;
  setLoading: (isLoading: boolean) => void;

  // Bundle Configuration Actions
  setBundleForm: (form: BundleFormData) => void;
  updateBundleForm: <K extends keyof BundleFormData>(key: K, value: BundleFormData[K]) => void;
  setBundleSteps: (steps: BundleStep[]) => void;
  addBundleStep: (step: BundleStep) => void;
  updateBundleStep: (stepId: string, updates: Partial<BundleStep>) => void;
  removeBundleStep: (stepId: string) => void;
  setPricingSettings: (pricing: PricingSettings) => void;
  updatePricingSettings: (updates: Partial<PricingSettings>) => void;
  setStepConditions: (stepId: string, conditions: ConditionRule[]) => void;
  setSelectedCollections: (stepId: string, collections: Collection[]) => void;
  setBundleConfigurationDirty: (isDirty: boolean) => void;
  clearBundleConfiguration: () => void;

  // Preferences Actions
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  addRecentBundle: (bundleId: string) => void;

  // Subscription Actions
  setSubscription: (subscription: SubscriptionState) => void;

  // Utility Actions
  resetState: () => void;

  // Selectors
  select: <T>(selector: StateSelector<T>) => T;
}

// ============================================
// CONTEXT CREATION
// ============================================

const AppStateContext = createContext<AppStateContextValue | null>(null);

// ============================================
// PROVIDER COMPONENT
// ============================================

interface AppStateProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
}

export function AppStateProvider({ children, initialState }: AppStateProviderProps) {
  // Local React state that syncs with the service
  const [state, setState] = useState<AppState>(() => appStateService.getState());

  // Subscribe to all state changes from the service
  useEffect(() => {
    const unsubscribe = appStateService.subscribeToAll((newState) => {
      setState({ ...newState });
    });

    // Apply initial state if provided
    if (initialState) {
      if (initialState.designSettings?.fullPage) {
        appStateService.setDesignSettings('full_page', initialState.designSettings.fullPage);
      }
      if (initialState.designSettings?.productPage) {
        appStateService.setDesignSettings('product_page', initialState.designSettings.productPage);
      }
      if (initialState.subscription) {
        appStateService.setSubscription(initialState.subscription);
      }
      if (initialState.preferences) {
        appStateService.setPreferences(initialState.preferences);
      }
    }

    return unsubscribe;
  }, []);

  // Memoized actions object
  const actions = useMemo(() => ({
    // Dispatch
    dispatch: (action: StateAction) => appStateService.dispatch(action),

    // Design Settings Actions
    setDesignSettings: (bundleType: BundleType, settings: DesignSettings) =>
      appStateService.setDesignSettings(bundleType, settings),
    updateDesignSetting: <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) =>
      appStateService.updateDesignSetting(key, value),
    setSelectedBundleType: (bundleType: BundleType) =>
      appStateService.setSelectedBundleType(bundleType),
    setDesignSettingsDirty: (isDirty: boolean) =>
      appStateService.setDesignSettingsDirty(isDirty),

    // UI Actions
    openModal: (modalId: string) => appStateService.openModal(modalId),
    closeModal: (modalId: string) => appStateService.closeModal(modalId),
    toggleModal: (modalId: string) => appStateService.toggleModal(modalId),
    showToast: (message: string, isError?: boolean) => appStateService.showToast(message, isError),
    hideToast: (toastId: string) => appStateService.hideToast(toastId),
    setNavigationState: (navigation: Partial<NavigationState>) =>
      appStateService.setNavigationState(navigation),
    setLoading: (isLoading: boolean) => appStateService.setLoading(isLoading),

    // Bundle Configuration Actions
    setBundleForm: (form: BundleFormData) => appStateService.setBundleForm(form),
    updateBundleForm: <K extends keyof BundleFormData>(key: K, value: BundleFormData[K]) =>
      appStateService.updateBundleForm(key, value),
    setBundleSteps: (steps: BundleStep[]) => appStateService.setBundleSteps(steps),
    addBundleStep: (step: BundleStep) => appStateService.addBundleStep(step),
    updateBundleStep: (stepId: string, updates: Partial<BundleStep>) =>
      appStateService.updateBundleStep(stepId, updates),
    removeBundleStep: (stepId: string) => appStateService.removeBundleStep(stepId),
    setPricingSettings: (pricing: PricingSettings) => appStateService.setPricingSettings(pricing),
    updatePricingSettings: (updates: Partial<PricingSettings>) =>
      appStateService.updatePricingSettings(updates),
    setStepConditions: (stepId: string, conditions: ConditionRule[]) =>
      appStateService.setStepConditions(stepId, conditions),
    setSelectedCollections: (stepId: string, collections: Collection[]) =>
      appStateService.setSelectedCollections(stepId, collections),
    setBundleConfigurationDirty: (isDirty: boolean) =>
      appStateService.setBundleConfigurationDirty(isDirty),
    clearBundleConfiguration: () => appStateService.clearBundleConfiguration(),

    // Preferences Actions
    setPreferences: (preferences: Partial<UserPreferences>) =>
      appStateService.setPreferences(preferences),
    addRecentBundle: (bundleId: string) => appStateService.addRecentBundle(bundleId),

    // Subscription Actions
    setSubscription: (subscription: SubscriptionState) =>
      appStateService.setSubscription(subscription),

    // Utility Actions
    resetState: () => appStateService.resetState(),

    // Selectors
    select: <T,>(selector: StateSelector<T>) => appStateService.select(selector),
  }), []);

  // Combine state and actions for context value
  const contextValue = useMemo(() => ({
    state,
    ...actions,
  }), [state, actions]);

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

/**
 * Main hook to access the full app state and actions
 */
export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

/**
 * Hook to access design settings state
 */
export function useDesignSettings() {
  const { state, setDesignSettings, updateDesignSetting, setSelectedBundleType, setDesignSettingsDirty } = useAppState();

  const designSettingsState = state.designSettings;
  const currentSettings = designSettingsState.selectedBundleType === 'full_page'
    ? designSettingsState.fullPage
    : designSettingsState.productPage;

  return {
    state: designSettingsState,
    currentSettings,
    fullPageSettings: designSettingsState.fullPage,
    productPageSettings: designSettingsState.productPage,
    selectedBundleType: designSettingsState.selectedBundleType,
    isDirty: designSettingsState.isDirty,
    setDesignSettings,
    updateDesignSetting,
    setSelectedBundleType,
    setDesignSettingsDirty,
  };
}

/**
 * Hook to access UI state (modals, toasts, navigation)
 */
export function useUI() {
  const {
    state,
    openModal,
    closeModal,
    toggleModal,
    showToast,
    hideToast,
    setNavigationState,
    setLoading,
  } = useAppState();

  const uiState = state.ui;

  return {
    state: uiState,
    modals: uiState.modals,
    toasts: uiState.toasts,
    navigation: uiState.navigation,
    isLoading: uiState.isLoading,
    openModal,
    closeModal,
    toggleModal,
    showToast,
    hideToast,
    setNavigationState,
    setLoading,
    isModalOpen: (modalId: string) => uiState.modals[modalId] || false,
  };
}

/**
 * Hook to manage modals
 */
export function useModals() {
  const { state, openModal, closeModal, toggleModal } = useAppState();

  return {
    modals: state.ui.modals,
    openModal,
    closeModal,
    toggleModal,
    isOpen: (modalId: string) => state.ui.modals[modalId] || false,
  };
}

/**
 * Hook to manage toasts
 */
export function useToasts() {
  const { state, showToast, hideToast } = useAppState();

  return {
    toasts: state.ui.toasts,
    showToast,
    hideToast,
    showSuccess: (message: string) => showToast(message, false),
    showError: (message: string) => showToast(message, true),
  };
}

/**
 * Hook to access bundle configuration state
 */
export function useBundleConfiguration() {
  const {
    state,
    setBundleForm,
    updateBundleForm,
    setBundleSteps,
    addBundleStep,
    updateBundleStep,
    removeBundleStep,
    setPricingSettings,
    updatePricingSettings,
    setStepConditions,
    setSelectedCollections,
    setBundleConfigurationDirty,
    clearBundleConfiguration,
  } = useAppState();

  const bundleConfig = state.bundleConfiguration;

  return {
    state: bundleConfig,
    form: bundleConfig.form,
    steps: bundleConfig.steps,
    pricing: bundleConfig.pricing,
    stepConditions: bundleConfig.stepConditions,
    selectedCollections: bundleConfig.selectedCollections,
    isDirty: bundleConfig.isDirty,
    isLoading: bundleConfig.isLoading,
    setBundleForm,
    updateBundleForm,
    setBundleSteps,
    addBundleStep,
    updateBundleStep,
    removeBundleStep,
    setPricingSettings,
    updatePricingSettings,
    setStepConditions,
    setSelectedCollections,
    setBundleConfigurationDirty,
    clearBundleConfiguration,
  };
}

/**
 * Hook to access user preferences
 */
export function usePreferences() {
  const { state, setPreferences, addRecentBundle } = useAppState();

  return {
    preferences: state.preferences,
    setPreferences,
    addRecentBundle,
    recentBundles: state.preferences.recentBundles,
  };
}

/**
 * Hook to access subscription state
 */
export function useSubscription() {
  const { state, setSubscription } = useAppState();

  return {
    subscription: state.subscription,
    setSubscription,
    isActive: state.subscription?.isActive ?? false,
    canCreateBundle: state.subscription?.canCreateBundle ?? true,
    plan: state.subscription?.plan ?? 'free',
  };
}

/**
 * Hook to create a selector that only re-renders when selected value changes
 */
export function useSelector<T>(selector: StateSelector<T>): T {
  const { state } = useAppState();
  return useMemo(() => selector(state), [state, selector]);
}

/**
 * Hook to access the state service directly (for advanced usage)
 */
export function useStateService(): AppStateService {
  return appStateService;
}

// ============================================
// EXPORTS
// ============================================

export { AppStateContext };
export type { AppStateContextValue, AppStateProviderProps };
