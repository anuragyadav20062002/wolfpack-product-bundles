/**
 * Standalone State Hooks
 *
 * These hooks work directly with the AppStateService singleton without
 * requiring the React Context. They use React's useState and useEffect
 * to sync with the service's state changes.
 *
 * Use these hooks when:
 * - You need state access outside of the AppStateProvider
 * - You want simpler, more focused hooks
 * - You're migrating existing code gradually
 *
 * For full context-based state management, use hooks from AppStateContext.tsx
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AppStateService,
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
  UserPreferences,
  SubscriptionState,
  NavigationState,
  ToastState,
  StateSelector,
} from "../types/state.types";

// ============================================
// CORE STATE HOOK
// ============================================

/**
 * Main hook to access the full app state with automatic re-rendering
 * Works without the AppStateProvider
 */
export function useAppStateStandalone() {
  const [state, setState] = useState<AppState>(() => appStateService.getState());

  useEffect(() => {
    const unsubscribe = appStateService.subscribeToAll((newState) => {
      setState({ ...newState });
    });
    return unsubscribe;
  }, []);

  return {
    state,
    service: appStateService,
    dispatch: appStateService.dispatch.bind(appStateService),
  };
}

// ============================================
// DESIGN SETTINGS HOOKS
// ============================================

/**
 * Hook to access and manage design settings state
 */
export function useDesignSettingsState() {
  const [designSettings, setDesignSettings] = useState<DesignSettingsState>(
    () => appStateService.getDesignSettingsState()
  );

  useEffect(() => {
    const unsubscribe = appStateService.subscribe('designSettings', (newState) => {
      setDesignSettings({ ...newState });
    });
    return unsubscribe;
  }, []);

  const currentSettings = useMemo(() => {
    return designSettings.selectedBundleType === 'full_page'
      ? designSettings.fullPage
      : designSettings.productPage;
  }, [designSettings]);

  const updateSetting = useCallback(<K extends keyof DesignSettings>(
    key: K,
    value: DesignSettings[K]
  ) => {
    appStateService.updateDesignSetting(key, value);
  }, []);

  const setSettings = useCallback((
    bundleType: 'full_page' | 'product_page',
    settings: DesignSettings
  ) => {
    appStateService.setDesignSettings(bundleType, settings);
  }, []);

  const setBundleType = useCallback((bundleType: 'full_page' | 'product_page') => {
    appStateService.setSelectedBundleType(bundleType);
  }, []);

  const markDirty = useCallback((isDirty: boolean) => {
    appStateService.setDesignSettingsDirty(isDirty);
  }, []);

  return {
    state: designSettings,
    currentSettings,
    fullPageSettings: designSettings.fullPage,
    productPageSettings: designSettings.productPage,
    selectedBundleType: designSettings.selectedBundleType,
    isDirty: designSettings.isDirty,
    isLoading: designSettings.isLoading,
    updateSetting,
    setSettings,
    setBundleType,
    markDirty,
  };
}

/**
 * Hook for a single design setting value with setter
 */
export function useDesignSetting<K extends keyof DesignSettings>(key: K) {
  const { currentSettings, updateSetting } = useDesignSettingsState();

  const value = currentSettings?.[key] ?? null;

  const setValue = useCallback((newValue: DesignSettings[K]) => {
    updateSetting(key, newValue);
  }, [key, updateSetting]);

  return [value, setValue] as const;
}

// ============================================
// UI STATE HOOKS
// ============================================

/**
 * Hook to access and manage UI state
 */
export function useUIState() {
  const [uiState, setUIState] = useState<UIState>(() => appStateService.getUIState());

  useEffect(() => {
    const unsubscribe = appStateService.subscribe('ui', (newState) => {
      setUIState({ ...newState });
    });
    return unsubscribe;
  }, []);

  return {
    state: uiState,
    modals: uiState.modals,
    toasts: uiState.toasts,
    navigation: uiState.navigation,
    isLoading: uiState.isLoading,
  };
}

/**
 * Hook for managing a specific modal
 */
export function useModal(modalId: string) {
  const { modals } = useUIState();

  const isOpen = modals[modalId] || false;

  const open = useCallback(() => {
    appStateService.openModal(modalId);
  }, [modalId]);

  const close = useCallback(() => {
    appStateService.closeModal(modalId);
  }, [modalId]);

  const toggle = useCallback(() => {
    appStateService.toggleModal(modalId);
  }, [modalId]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Hook for managing toasts
 */
export function useToastState() {
  const { toasts } = useUIState();

  const show = useCallback((message: string, isError: boolean = false) => {
    return appStateService.showToast(message, isError);
  }, []);

  const hide = useCallback((toastId: string) => {
    appStateService.hideToast(toastId);
  }, []);

  const showSuccess = useCallback((message: string) => {
    return show(message, false);
  }, [show]);

  const showError = useCallback((message: string) => {
    return show(message, true);
  }, [show]);

  return {
    toasts,
    show,
    hide,
    showSuccess,
    showError,
  };
}

/**
 * Hook for managing navigation state
 */
export function useNavigationState() {
  const { navigation } = useUIState();

  const setNavigation = useCallback((updates: Partial<NavigationState>) => {
    appStateService.setNavigationState(updates);
  }, []);

  const setExpandedSection = useCallback((section: string | null) => {
    setNavigation({ expandedSection: section });
  }, [setNavigation]);

  const setActiveSubSection = useCallback((subSection: string) => {
    setNavigation({ activeSubSection: subSection });
  }, [setNavigation]);

  const setActiveTabIndex = useCallback((index: number) => {
    setNavigation({ activeTabIndex: index });
  }, [setNavigation]);

  return {
    navigation,
    expandedSection: navigation.expandedSection,
    activeSubSection: navigation.activeSubSection,
    activeTabIndex: navigation.activeTabIndex,
    setNavigation,
    setExpandedSection,
    setActiveSubSection,
    setActiveTabIndex,
  };
}

/**
 * Hook for loading state
 */
export function useLoadingState() {
  const { isLoading } = useUIState();

  const setLoading = useCallback((loading: boolean) => {
    appStateService.setLoading(loading);
  }, []);

  return {
    isLoading,
    setLoading,
    startLoading: () => setLoading(true),
    stopLoading: () => setLoading(false),
  };
}

// ============================================
// BUNDLE CONFIGURATION HOOKS
// ============================================

/**
 * Hook to access and manage bundle configuration state
 */
export function useBundleConfigurationState() {
  const [bundleConfig, setBundleConfig] = useState<BundleConfigurationState>(
    () => appStateService.getBundleConfigurationState()
  );

  useEffect(() => {
    const unsubscribe = appStateService.subscribe('bundleConfiguration', (newState) => {
      setBundleConfig({ ...newState });
    });
    return unsubscribe;
  }, []);

  const setForm = useCallback((form: BundleFormData) => {
    appStateService.setBundleForm(form);
  }, []);

  const updateForm = useCallback(<K extends keyof BundleFormData>(
    key: K,
    value: BundleFormData[K]
  ) => {
    appStateService.updateBundleForm(key, value);
  }, []);

  const setSteps = useCallback((steps: BundleStep[]) => {
    appStateService.setBundleSteps(steps);
  }, []);

  const addStep = useCallback((step: BundleStep) => {
    appStateService.addBundleStep(step);
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<BundleStep>) => {
    appStateService.updateBundleStep(stepId, updates);
  }, []);

  const removeStep = useCallback((stepId: string) => {
    appStateService.removeBundleStep(stepId);
  }, []);

  const setPricing = useCallback((pricing: PricingSettings) => {
    appStateService.setPricingSettings(pricing);
  }, []);

  const updatePricing = useCallback((updates: Partial<PricingSettings>) => {
    appStateService.updatePricingSettings(updates);
  }, []);

  const markDirty = useCallback((isDirty: boolean) => {
    appStateService.setBundleConfigurationDirty(isDirty);
  }, []);

  const clear = useCallback(() => {
    appStateService.clearBundleConfiguration();
  }, []);

  return {
    state: bundleConfig,
    form: bundleConfig.form,
    steps: bundleConfig.steps,
    pricing: bundleConfig.pricing,
    stepConditions: bundleConfig.stepConditions,
    selectedCollections: bundleConfig.selectedCollections,
    isDirty: bundleConfig.isDirty,
    isLoading: bundleConfig.isLoading,
    setForm,
    updateForm,
    setSteps,
    addStep,
    updateStep,
    removeStep,
    setPricing,
    updatePricing,
    markDirty,
    clear,
  };
}

// ============================================
// PREFERENCES HOOKS
// ============================================

/**
 * Hook to access and manage user preferences
 */
export function usePreferencesState() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(
    () => appStateService.getPreferences()
  );

  useEffect(() => {
    const unsubscribe = appStateService.subscribe('preferences', (newState) => {
      setPreferencesState({ ...newState });
    });
    return unsubscribe;
  }, []);

  const setPreferences = useCallback((updates: Partial<UserPreferences>) => {
    appStateService.setPreferences(updates);
  }, []);

  const addRecentBundle = useCallback((bundleId: string) => {
    appStateService.addRecentBundle(bundleId);
  }, []);

  return {
    preferences,
    recentBundles: preferences.recentBundles,
    sidebarCollapsed: preferences.sidebarCollapsed,
    theme: preferences.theme,
    showTips: preferences.showTips,
    setPreferences,
    addRecentBundle,
    toggleSidebar: () => setPreferences({ sidebarCollapsed: !preferences.sidebarCollapsed }),
    setTheme: (theme: 'light' | 'dark' | 'system') => setPreferences({ theme }),
    toggleTips: () => setPreferences({ showTips: !preferences.showTips }),
  };
}

// ============================================
// SUBSCRIPTION HOOKS
// ============================================

/**
 * Hook to access subscription state
 */
export function useSubscriptionState() {
  const [subscription, setSubscriptionState] = useState<SubscriptionState | null>(
    () => appStateService.getSubscription()
  );

  useEffect(() => {
    const unsubscribe = appStateService.subscribe('subscription', (newState) => {
      setSubscriptionState(newState ? { ...newState } : null);
    });
    return unsubscribe;
  }, []);

  const setSubscription = useCallback((sub: SubscriptionState) => {
    appStateService.setSubscription(sub);
  }, []);

  return {
    subscription,
    isActive: subscription?.isActive ?? false,
    canCreateBundle: subscription?.canCreateBundle ?? true,
    plan: subscription?.plan ?? 'free',
    bundleLimit: subscription?.bundleLimit ?? 0,
    currentBundleCount: subscription?.currentBundleCount ?? 0,
    setSubscription,
  };
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook for selecting specific state with memoization
 */
export function useSelectorStandalone<T>(selector: StateSelector<T>): T {
  const { state } = useAppStateStandalone();
  return useMemo(() => selector(state), [state, selector]);
}

/**
 * Hook to get the state service instance directly
 */
export function useStateServiceInstance(): AppStateService {
  return appStateService;
}

/**
 * Hook to check if state is initialized
 */
export function useStateInitialized(): boolean {
  const { state } = useAppStateStandalone();
  return state.meta.initialized;
}

/**
 * Hook to reset all state
 */
export function useResetState() {
  return useCallback(() => {
    appStateService.resetState();
  }, []);
}

// ============================================
// EXPORTS
// ============================================

export {
  appStateService,
  AppStateService,
};
