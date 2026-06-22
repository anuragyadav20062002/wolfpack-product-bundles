import { createContext, useCallback, useMemo, type ReactNode } from "react";
import {
  useAppStateStandalone,
  useBundleConfigurationState,
  useDesignSettingsState,
  usePreferencesState,
  useSubscriptionState,
  useToastState,
  useUIState,
} from "../hooks/useAppState";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addBundleStep,
  clearBundleConfiguration,
  markBundleConfigurationDirty,
  removeBundleStep,
  setBundleForm,
  setBundleSteps,
  setPricingSettings,
  setSelectedCollections,
  setStepConditions,
  updateBundleForm,
  updateBundleStep,
  updatePricingSettings,
} from "../store/slices/bundleConfigureSlice";
import {
  markDesignSettingsDirty,
  setDesignSettings as setDesignSettingsAction,
  setSelectedBundleType as setSelectedBundleTypeAction,
  updateDesignSetting as updateDesignSettingAction,
} from "../store/slices/designSettingsSlice";
import {
  addRecentBundle as addRecentBundleAction,
  setPreferences as setPreferencesAction,
} from "../store/slices/preferencesSlice";
import { setSubscription as setSubscriptionAction } from "../store/slices/subscriptionSlice";
import {
  closeModal as closeModalAction,
  openModal as openModalAction,
  setLoading as setLoadingAction,
  setNavigation,
  toggleModal as toggleModalAction,
} from "../store/slices/uiSlice";
import type {
  AppState,
  BundleFormData,
  BundleStep,
  Collection,
  ConditionRule,
  DesignSettings,
  NavigationState,
  PricingSettings,
  StateAction,
  StateSelector,
  SubscriptionState,
  UserPreferences,
} from "../types/state.types";

interface AppStateContextValue {
  state: AppState;
  dispatch: (action: StateAction) => void;
  setDesignSettings: (bundleType: "full_page" | "product_page", settings: DesignSettings) => void;
  updateDesignSetting: <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => void;
  setSelectedBundleType: (bundleType: "full_page" | "product_page") => void;
  setDesignSettingsDirty: (isDirty: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  showToast: (message: string, isError?: boolean) => string;
  hideToast: (toastId: string) => void;
  setNavigationState: (navigation: Partial<NavigationState>) => void;
  setLoading: (isLoading: boolean) => void;
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
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  addRecentBundle: (bundleId: string) => void;
  setSubscription: (subscription: SubscriptionState) => void;
  resetState: () => void;
  select: <T>(selector: StateSelector<T>) => T;
}

interface AppStateProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
}

export const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: AppStateProviderProps) {
  return <>{children}</>;
}

export function useAppState(): AppStateContextValue {
  const { state, dispatch: dispatchStateAction } = useAppStateStandalone();
  const dispatch = useAppDispatch();
  const toastState = useToastState();

  const showToast = useCallback((message: string, isError = false) => (
    toastState.show(message, isError)
  ), [toastState]);

  return useMemo(() => ({
    state,
    dispatch: dispatchStateAction,
    setDesignSettings: (bundleType: "full_page" | "product_page", settings: DesignSettings) =>
      dispatch(setDesignSettingsAction({ bundleType, settings })),
    updateDesignSetting: <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) =>
      dispatch(updateDesignSettingAction({ key, value })),
    setSelectedBundleType: (bundleType: "full_page" | "product_page") =>
      dispatch(setSelectedBundleTypeAction(bundleType)),
    setDesignSettingsDirty: (isDirty: boolean) => dispatch(markDesignSettingsDirty(isDirty)),
    openModal: (modalId: string) => dispatch(openModalAction(modalId)),
    closeModal: (modalId: string) => dispatch(closeModalAction(modalId)),
    toggleModal: (modalId: string) => dispatch(toggleModalAction(modalId)),
    showToast,
    hideToast: toastState.hide,
    setNavigationState: (navigation: Partial<NavigationState>) => dispatch(setNavigation(navigation)),
    setLoading: (isLoading: boolean) => dispatch(setLoadingAction(isLoading)),
    setBundleForm: (form: BundleFormData) => dispatch(setBundleForm(form)),
    updateBundleForm: <K extends keyof BundleFormData>(key: K, value: BundleFormData[K]) =>
      dispatch(updateBundleForm({ key, value })),
    setBundleSteps: (steps: BundleStep[]) => dispatch(setBundleSteps(steps)),
    addBundleStep: (step: BundleStep) => dispatch(addBundleStep(step)),
    updateBundleStep: (stepId: string, updates: Partial<BundleStep>) =>
      dispatch(updateBundleStep({ stepId, updates })),
    removeBundleStep: (stepId: string) => dispatch(removeBundleStep(stepId)),
    setPricingSettings: (pricing: PricingSettings) => dispatch(setPricingSettings(pricing)),
    updatePricingSettings: (updates: Partial<PricingSettings>) => dispatch(updatePricingSettings(updates)),
    setStepConditions: (stepId: string, conditions: ConditionRule[]) =>
      dispatch(setStepConditions({ stepId, conditions })),
    setSelectedCollections: (stepId: string, collections: Collection[]) =>
      dispatch(setSelectedCollections({ stepId, collections })),
    setBundleConfigurationDirty: (isDirty: boolean) => dispatch(markBundleConfigurationDirty(isDirty)),
    clearBundleConfiguration: () => dispatch(clearBundleConfiguration()),
    setPreferences: (preferences: Partial<UserPreferences>) => dispatch(setPreferencesAction(preferences)),
    addRecentBundle: (bundleId: string) => dispatch(addRecentBundleAction(bundleId)),
    setSubscription: (subscription: SubscriptionState) => dispatch(setSubscriptionAction(subscription)),
    resetState: () => dispatch(clearBundleConfiguration()),
    select: <T,>(selector: StateSelector<T>) => selector(state),
  }), [dispatch, dispatchStateAction, showToast, state, toastState.hide]);
}

export function useDesignSettings() {
  const designSettings = useDesignSettingsState();
  return {
    ...designSettings,
    setDesignSettings: designSettings.setSettings,
    updateDesignSetting: designSettings.updateSetting,
    setSelectedBundleType: designSettings.setBundleType,
    setDesignSettingsDirty: designSettings.markDirty,
  };
}

export function useUI() {
  const uiState = useUIState();
  const { openModal, closeModal, toggleModal, showToast, hideToast, setNavigationState, setLoading } = useAppState();
  return {
    ...uiState,
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

export function useToasts() {
  const toastState = useToastState();
  return {
    toasts: toastState.toasts,
    showToast: toastState.show,
    hideToast: toastState.hide,
    showSuccess: toastState.showSuccess,
    showError: toastState.showError,
  };
}

export function useBundleConfiguration() {
  const bundleConfig = useBundleConfigurationState();
  return {
    ...bundleConfig,
    setBundleForm: bundleConfig.setForm,
    updateBundleForm: bundleConfig.updateForm,
    setBundleSteps: bundleConfig.setSteps,
    addBundleStep: bundleConfig.addStep,
    updateBundleStep: bundleConfig.updateStep,
    removeBundleStep: bundleConfig.removeStep,
    setPricingSettings: bundleConfig.setPricing,
    updatePricingSettings: bundleConfig.updatePricing,
    setBundleConfigurationDirty: bundleConfig.markDirty,
    clearBundleConfiguration: bundleConfig.clear,
  };
}

export function usePreferences() {
  const preferences = usePreferencesState();
  return {
    preferences: preferences.preferences,
    setPreferences: preferences.setPreferences,
    addRecentBundle: preferences.addRecentBundle,
    recentBundles: preferences.recentBundles,
  };
}

export function useSubscription() {
  return useSubscriptionState();
}

export function useSelector<T>(selector: StateSelector<T>): T {
  return useAppSelector((state) => selector({
    designSettings: state.designSettings,
    ui: state.ui,
    bundleConfiguration: state.bundleConfiguration,
    preferences: state.preferences,
    subscription: state.subscription,
    meta: state.meta,
  }));
}

export type { AppStateContextValue, AppStateProviderProps };
