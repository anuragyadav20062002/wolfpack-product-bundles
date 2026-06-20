import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addBundleStep,
  clearBundleConfiguration,
  markBundleConfigurationDirty,
  removeBundleStep,
  setBundleForm,
  setBundleSteps,
  setPricingSettings,
  updateBundleForm,
  updateBundleStep,
  updatePricingSettings,
} from "../store/slices/bundleConfigureSlice";
import {
  markDesignSettingsDirty,
  setDesignSettings,
  setSelectedBundleType,
  updateDesignSetting,
} from "../store/slices/designSettingsSlice";
import { addRecentBundle, setPreferences } from "../store/slices/preferencesSlice";
import { setSubscription } from "../store/slices/subscriptionSlice";
import {
  closeModal,
  hideToast,
  openModal,
  setLoading,
  setNavigation,
  showToast,
  toggleModal,
} from "../store/slices/uiSlice";
import type {
  AppState,
  BundleFormData,
  BundleStep,
  DesignSettings,
  NavigationState,
  PricingSettings,
  StateAction,
  StateSelector,
  SubscriptionState,
  UserPreferences,
} from "../types/state.types";

function useReduxAppState(): AppState {
  return useAppSelector((state) => ({
    designSettings: state.designSettings,
    ui: state.ui,
    bundleConfiguration: state.bundleConfiguration,
    preferences: state.preferences,
    subscription: state.subscription,
    meta: state.meta,
  }));
}

function useStateActionDispatch() {
  const dispatch = useAppDispatch();

  return useCallback((action: StateAction) => {
    switch (action.type) {
      case "SET_DESIGN_SETTINGS":
        dispatch(setDesignSettings(action.payload));
        break;
      case "UPDATE_DESIGN_SETTING":
        dispatch(updateDesignSetting(action.payload));
        break;
      case "SET_SELECTED_BUNDLE_TYPE":
        dispatch(setSelectedBundleType(action.payload));
        break;
      case "SET_DESIGN_DIRTY":
        dispatch(markDesignSettingsDirty(action.payload));
        break;
      case "OPEN_MODAL":
        dispatch(openModal(action.payload));
        break;
      case "CLOSE_MODAL":
        dispatch(closeModal(action.payload));
        break;
      case "SHOW_TOAST":
        dispatch(showToast(action.payload));
        break;
      case "HIDE_TOAST":
        dispatch(hideToast(action.payload));
        break;
      case "SET_NAVIGATION":
        dispatch(setNavigation(action.payload));
        break;
      case "SET_BUNDLE_FORM":
        dispatch(setBundleForm(action.payload));
        break;
      case "UPDATE_BUNDLE_FORM":
        Object.entries(action.payload).forEach(([key, value]) => {
          dispatch(updateBundleForm({ key: key as keyof BundleFormData, value }));
        });
        break;
      case "SET_BUNDLE_STEPS":
        dispatch(setBundleSteps(action.payload));
        break;
      case "ADD_BUNDLE_STEP":
        dispatch(addBundleStep(action.payload));
        break;
      case "UPDATE_BUNDLE_STEP":
        dispatch(updateBundleStep(action.payload));
        break;
      case "REMOVE_BUNDLE_STEP":
        dispatch(removeBundleStep(action.payload));
        break;
      case "SET_PRICING":
        dispatch(setPricingSettings(action.payload));
        break;
      case "UPDATE_PRICING":
        dispatch(updatePricingSettings(action.payload));
        break;
      case "SET_PREFERENCES":
        dispatch(setPreferences(action.payload));
        break;
      case "SET_SUBSCRIPTION":
        dispatch(setSubscription(action.payload));
        break;
      case "SET_LOADING":
        dispatch(setLoading(action.payload.value));
        break;
      case "RESET_STATE":
        dispatch(clearBundleConfiguration());
        break;
      default:
        break;
    }
  }, [dispatch]);
}

export function useAppStateStandalone() {
  const state = useReduxAppState();
  const dispatchAction = useStateActionDispatch();

  return {
    state,
    dispatch: dispatchAction,
  };
}

export function useDesignSettingsState() {
  const dispatch = useAppDispatch();
  const designSettings = useAppSelector((state) => state.designSettings);

  const currentSettings = useMemo(() => (
    designSettings.selectedBundleType === "full_page"
      ? designSettings.fullPage
      : designSettings.productPage
  ), [designSettings]);

  const updateSetting = useCallback(<K extends keyof DesignSettings>(
    key: K,
    value: DesignSettings[K],
  ) => {
    dispatch(updateDesignSetting({ key, value }));
  }, [dispatch]);

  const setSettings = useCallback((
    bundleType: "full_page" | "product_page",
    settings: DesignSettings,
  ) => {
    dispatch(setDesignSettings({ bundleType, settings }));
  }, [dispatch]);

  const setBundleType = useCallback((bundleType: "full_page" | "product_page") => {
    dispatch(setSelectedBundleType(bundleType));
  }, [dispatch]);

  const markDirty = useCallback((isDirty: boolean) => {
    dispatch(markDesignSettingsDirty(isDirty));
  }, [dispatch]);

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

export function useDesignSetting<K extends keyof DesignSettings>(key: K) {
  const { currentSettings, updateSetting } = useDesignSettingsState();
  const value = currentSettings?.[key] ?? null;
  const setValue = useCallback((newValue: DesignSettings[K]) => {
    updateSetting(key, newValue);
  }, [key, updateSetting]);

  return [value, setValue] as const;
}

export function useUIState() {
  const uiState = useAppSelector((state) => state.ui);

  return {
    state: uiState,
    modals: uiState.modals,
    toasts: uiState.toasts,
    navigation: uiState.navigation,
    isLoading: uiState.isLoading,
  };
}

export function useModal(modalId: string) {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.modals[modalId] || false);

  return {
    isOpen,
    open: useCallback(() => dispatch(openModal(modalId)), [dispatch, modalId]),
    close: useCallback(() => dispatch(closeModal(modalId)), [dispatch, modalId]),
    toggle: useCallback(() => dispatch(toggleModal(modalId)), [dispatch, modalId]),
  };
}

export function useToastState() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  const show = useCallback((message: string, isError = false) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    dispatch(showToast({ id, message, isError }));
    return id;
  }, [dispatch]);

  const hide = useCallback((toastId: string) => {
    dispatch(hideToast(toastId));
  }, [dispatch]);

  return {
    toasts,
    show,
    hide,
    showSuccess: useCallback((message: string) => show(message, false), [show]),
    showError: useCallback((message: string) => show(message, true), [show]),
  };
}

export function useNavigationState() {
  const dispatch = useAppDispatch();
  const navigation = useAppSelector((state) => state.ui.navigation);

  const setNavigationState = useCallback((updates: Partial<NavigationState>) => {
    dispatch(setNavigation(updates));
  }, [dispatch]);

  return {
    navigation,
    expandedSection: navigation.expandedSection,
    activeSubSection: navigation.activeSubSection,
    activeTabIndex: navigation.activeTabIndex,
    setNavigation: setNavigationState,
    setExpandedSection: useCallback((section: string | null) => {
      setNavigationState({ expandedSection: section });
    }, [setNavigationState]),
    setActiveSubSection: useCallback((subSection: string) => {
      setNavigationState({ activeSubSection: subSection });
    }, [setNavigationState]),
    setActiveTabIndex: useCallback((index: number) => {
      setNavigationState({ activeTabIndex: index });
    }, [setNavigationState]),
  };
}

export function useLoadingState() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.ui.isLoading);

  const setLoadingState = useCallback((loading: boolean) => {
    dispatch(setLoading(loading));
  }, [dispatch]);

  return {
    isLoading,
    setLoading: setLoadingState,
    startLoading: () => setLoadingState(true),
    stopLoading: () => setLoadingState(false),
  };
}

export function useBundleConfigurationState() {
  const dispatch = useAppDispatch();
  const bundleConfig = useAppSelector((state) => state.bundleConfiguration);

  return {
    state: bundleConfig,
    form: bundleConfig.form,
    steps: bundleConfig.steps,
    pricing: bundleConfig.pricing,
    stepConditions: bundleConfig.stepConditions,
    selectedCollections: bundleConfig.selectedCollections,
    isDirty: bundleConfig.isDirty,
    isLoading: bundleConfig.isLoading,
    setForm: useCallback((form: BundleFormData) => dispatch(setBundleForm(form)), [dispatch]),
    updateForm: useCallback(<K extends keyof BundleFormData>(key: K, value: BundleFormData[K]) => {
      dispatch(updateBundleForm({ key, value }));
    }, [dispatch]),
    setSteps: useCallback((steps: BundleStep[]) => dispatch(setBundleSteps(steps)), [dispatch]),
    addStep: useCallback((step: BundleStep) => dispatch(addBundleStep(step)), [dispatch]),
    updateStep: useCallback((stepId: string, updates: Partial<BundleStep>) => {
      dispatch(updateBundleStep({ stepId, updates }));
    }, [dispatch]),
    removeStep: useCallback((stepId: string) => dispatch(removeBundleStep(stepId)), [dispatch]),
    setPricing: useCallback((pricing: PricingSettings) => dispatch(setPricingSettings(pricing)), [dispatch]),
    updatePricing: useCallback((updates: Partial<PricingSettings>) => {
      dispatch(updatePricingSettings(updates));
    }, [dispatch]),
    markDirty: useCallback((isDirty: boolean) => {
      dispatch(markBundleConfigurationDirty(isDirty));
    }, [dispatch]),
    clear: useCallback(() => dispatch(clearBundleConfiguration()), [dispatch]),
  };
}

export function usePreferencesState() {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector((state) => state.preferences);

  const setPreferenceState = useCallback((updates: Partial<UserPreferences>) => {
    dispatch(setPreferences(updates));
  }, [dispatch]);

  return {
    preferences,
    recentBundles: preferences.recentBundles,
    sidebarCollapsed: preferences.sidebarCollapsed,
    theme: preferences.theme,
    showTips: preferences.showTips,
    setPreferences: setPreferenceState,
    addRecentBundle: useCallback((bundleId: string) => {
      dispatch(addRecentBundle(bundleId));
    }, [dispatch]),
    toggleSidebar: () => setPreferenceState({ sidebarCollapsed: !preferences.sidebarCollapsed }),
    setTheme: (theme: "light" | "dark" | "system") => setPreferenceState({ theme }),
    toggleTips: () => setPreferenceState({ showTips: !preferences.showTips }),
  };
}

export function useSubscriptionState() {
  const dispatch = useAppDispatch();
  const subscription = useAppSelector((state) => state.subscription);

  return {
    subscription,
    isActive: subscription?.isActive ?? false,
    canCreateBundle: subscription?.canCreateBundle ?? true,
    plan: subscription?.plan ?? "free",
    bundleLimit: subscription?.bundleLimit ?? 0,
    currentBundleCount: subscription?.currentBundleCount ?? 0,
    setSubscription: useCallback((sub: SubscriptionState) => {
      dispatch(setSubscription(sub));
    }, [dispatch]),
  };
}

export function useSelectorStandalone<T>(selector: StateSelector<T>): T {
  const state = useReduxAppState();
  return useMemo(() => selector(state), [state, selector]);
}

export function useStateInitialized(): boolean {
  return useAppSelector((state) => state.meta.initialized);
}

export function useResetState() {
  const dispatch = useAppDispatch();
  return useCallback(() => {
    dispatch(clearBundleConfiguration());
  }, [dispatch]);
}
