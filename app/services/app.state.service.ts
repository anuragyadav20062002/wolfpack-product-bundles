/**
 * Centralized Application State Service
 *
 * This service acts as a single source of truth for all application state.
 * It provides getter and setter methods with type safety, subscription
 * mechanisms for state changes, and localStorage persistence for preferences.
 *
 * Usage:
 * - Use AppStateService.getInstance() to get the singleton instance
 * - Use getter methods to access state
 * - Use setter methods to update state
 * - Subscribe to state changes using subscribe()
 *
 * This service can be used standalone or integrated with React Context
 * for component-level reactivity.
 */

import type {
  AppState,
  DesignSettings,
  DesignSettingsState,
  UIState,
  ToastState,
  ModalState,
  NavigationState,
  BundleConfigurationState,
  BundleFormData,
  BundleStep,
  PricingSettings,
  ConditionRule,
  Collection,
  UserPreferences,
  SubscriptionState,
  StateListener,
  StateSelector,
  Unsubscribe,
  StateAction,
} from "../types/state.types";
import { BundleType } from "../constants/bundle";

// ============================================
// DEFAULT STATE VALUES
// ============================================

const DEFAULT_PREFERENCES: UserPreferences = {
  sidebarCollapsed: false,
  recentBundles: [],
  theme: 'system',
  showTips: true,
};

const DEFAULT_UI_STATE: UIState = {
  modals: {},
  toasts: [],
  navigation: {
    expandedSection: null,
    activeSubSection: '',
    activeTabIndex: 0,
  },
  isLoading: false,
};

const DEFAULT_DESIGN_SETTINGS_STATE: DesignSettingsState = {
  fullPage: null,
  productPage: null,
  selectedBundleType: BundleType.PRODUCT_PAGE,
  isDirty: false,
  isLoading: false,
};

const DEFAULT_BUNDLE_CONFIGURATION_STATE: BundleConfigurationState = {
  form: null,
  steps: [],
  pricing: null,
  stepConditions: {},
  selectedCollections: {},
  isDirty: false,
  isLoading: false,
};

const DEFAULT_APP_STATE: AppState = {
  designSettings: DEFAULT_DESIGN_SETTINGS_STATE,
  ui: DEFAULT_UI_STATE,
  bundleConfiguration: DEFAULT_BUNDLE_CONFIGURATION_STATE,
  preferences: DEFAULT_PREFERENCES,
  subscription: null,
  meta: {
    initialized: false,
    lastUpdated: Date.now(),
    version: '1.0.0',
  },
};

// ============================================
// LOCAL STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  PREFERENCES: 'wolfpack_user_preferences',
  RECENT_BUNDLES: 'wolfpack_recent_bundles',
};

// ============================================
// STATE SERVICE CLASS
// ============================================

/**
 * Singleton class for centralized state management
 */
export class AppStateService {
  private static instance: AppStateService | null = null;
  private state: AppState;
  private listeners: Map<string, Set<StateListener<any>>> = new Map();
  private globalListeners: Set<StateListener<AppState>> = new Set();

  private constructor() {
    this.state = { ...DEFAULT_APP_STATE };
    this.loadPersistedState();
  }

  /**
   * Get the singleton instance of AppStateService
   */
  public static getInstance(): AppStateService {
    if (!AppStateService.instance) {
      AppStateService.instance = new AppStateService();
    }
    return AppStateService.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    AppStateService.instance = null;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Load persisted state from localStorage (client-side only)
   */
  private loadPersistedState(): void {
    if (typeof window === 'undefined') return;

    try {
      const preferencesJson = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (preferencesJson) {
        const preferences = JSON.parse(preferencesJson) as Partial<UserPreferences>;
        this.state.preferences = { ...DEFAULT_PREFERENCES, ...preferences };
      }

      const recentBundlesJson = localStorage.getItem(STORAGE_KEYS.RECENT_BUNDLES);
      if (recentBundlesJson) {
        this.state.preferences.recentBundles = JSON.parse(recentBundlesJson);
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }

    this.state.meta.initialized = true;
  }

  /**
   * Persist preferences to localStorage
   */
  private persistPreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(this.state.preferences));
      localStorage.setItem(STORAGE_KEYS.RECENT_BUNDLES, JSON.stringify(this.state.preferences.recentBundles));
    } catch (error) {
      console.warn('Failed to persist preferences:', error);
    }
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners<T>(key: string, newValue: T, prevValue: T): void {
    // Notify specific key listeners
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(listener => listener(newValue, prevValue));
    }

    // Notify global listeners
    this.globalListeners.forEach(listener => listener(this.state, { ...this.state, [key]: prevValue } as AppState));
  }

  /**
   * Generate unique ID for toasts
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // GETTERS - Complete State
  // ============================================

  /**
   * Get the complete application state
   */
  public getState(): AppState {
    return { ...this.state };
  }

  /**
   * Get state using a selector function
   */
  public select<T>(selector: StateSelector<T>): T {
    return selector(this.state);
  }

  // ============================================
  // GETTERS - Design Settings
  // ============================================

  /**
   * Get design settings state
   */
  public getDesignSettingsState(): DesignSettingsState {
    return { ...this.state.designSettings };
  }

  /**
   * Get design settings for a specific bundle type
   */
  public getDesignSettings(bundleType: 'full_page' | 'product_page'): DesignSettings | null {
    return this.state.designSettings[bundleType === 'full_page' ? 'fullPage' : 'productPage'];
  }

  /**
   * Get current design settings based on selected bundle type
   */
  public getCurrentDesignSettings(): DesignSettings | null {
    const bundleType = this.state.designSettings.selectedBundleType;
    return this.getDesignSettings(bundleType);
  }

  /**
   * Get selected bundle type for design settings
   */
  public getSelectedBundleType(): 'full_page' | 'product_page' {
    return this.state.designSettings.selectedBundleType;
  }

  /**
   * Check if design settings have unsaved changes
   */
  public isDesignSettingsDirty(): boolean {
    return this.state.designSettings.isDirty;
  }

  // ============================================
  // GETTERS - UI State
  // ============================================

  /**
   * Get complete UI state
   */
  public getUIState(): UIState {
    return { ...this.state.ui };
  }

  /**
   * Check if a specific modal is open
   */
  public isModalOpen(modalId: string): boolean {
    return this.state.ui.modals[modalId] || false;
  }

  /**
   * Get all toast notifications
   */
  public getToasts(): ToastState[] {
    return [...this.state.ui.toasts];
  }

  /**
   * Get navigation state
   */
  public getNavigationState(): NavigationState {
    return { ...this.state.ui.navigation };
  }

  /**
   * Check if app is in loading state
   */
  public isLoading(): boolean {
    return this.state.ui.isLoading;
  }

  // ============================================
  // GETTERS - Bundle Configuration
  // ============================================

  /**
   * Get bundle configuration state
   */
  public getBundleConfigurationState(): BundleConfigurationState {
    return { ...this.state.bundleConfiguration };
  }

  /**
   * Get current bundle form data
   */
  public getBundleForm(): BundleFormData | null {
    return this.state.bundleConfiguration.form;
  }

  /**
   * Get bundle steps
   */
  public getBundleSteps(): BundleStep[] {
    return [...this.state.bundleConfiguration.steps];
  }

  /**
   * Get pricing settings
   */
  public getPricingSettings(): PricingSettings | null {
    return this.state.bundleConfiguration.pricing;
  }

  /**
   * Get step conditions
   */
  public getStepConditions(stepId?: string): Record<string, ConditionRule[]> | ConditionRule[] {
    if (stepId) {
      return this.state.bundleConfiguration.stepConditions[stepId] || [];
    }
    return { ...this.state.bundleConfiguration.stepConditions };
  }

  /**
   * Get selected collections for a step
   */
  public getSelectedCollections(stepId?: string): Record<string, Collection[]> | Collection[] {
    if (stepId) {
      return this.state.bundleConfiguration.selectedCollections[stepId] || [];
    }
    return { ...this.state.bundleConfiguration.selectedCollections };
  }

  /**
   * Check if bundle configuration has unsaved changes
   */
  public isBundleConfigurationDirty(): boolean {
    return this.state.bundleConfiguration.isDirty;
  }

  // ============================================
  // GETTERS - User Preferences
  // ============================================

  /**
   * Get user preferences
   */
  public getPreferences(): UserPreferences {
    return { ...this.state.preferences };
  }

  /**
   * Get recent bundles
   */
  public getRecentBundles(): string[] {
    return [...this.state.preferences.recentBundles];
  }

  // ============================================
  // GETTERS - Subscription
  // ============================================

  /**
   * Get subscription state
   */
  public getSubscription(): SubscriptionState | null {
    return this.state.subscription;
  }

  /**
   * Check if user can create more bundles
   */
  public canCreateBundle(): boolean {
    return this.state.subscription?.canCreateBundle ?? true;
  }

  // ============================================
  // SETTERS - Design Settings
  // ============================================

  /**
   * Set design settings for a bundle type
   */
  public setDesignSettings(bundleType: 'full_page' | 'product_page', settings: DesignSettings): void {
    const prevState = { ...this.state.designSettings };
    const key = bundleType === 'full_page' ? 'fullPage' : 'productPage';

    this.state.designSettings = {
      ...this.state.designSettings,
      [key]: { ...settings },
      isDirty: false,
    };

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('designSettings', this.state.designSettings, prevState);
  }

  /**
   * Update a specific design setting
   */
  public updateDesignSetting<K extends keyof DesignSettings>(key: K, value: DesignSettings[K]): void {
    const bundleType = this.state.designSettings.selectedBundleType;
    const settingsKey = bundleType === 'full_page' ? 'fullPage' : 'productPage';
    const currentSettings = this.state.designSettings[settingsKey];

    if (!currentSettings) return;

    const prevState = { ...this.state.designSettings };

    this.state.designSettings = {
      ...this.state.designSettings,
      [settingsKey]: {
        ...currentSettings,
        [key]: value,
      },
      isDirty: true,
    };

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('designSettings', this.state.designSettings, prevState);
  }

  /**
   * Set selected bundle type for design settings
   */
  public setSelectedBundleType(bundleType: 'full_page' | 'product_page'): void {
    const prevState = { ...this.state.designSettings };

    this.state.designSettings = {
      ...this.state.designSettings,
      selectedBundleType: bundleType,
    };

    this.notifyListeners('designSettings', this.state.designSettings, prevState);
  }

  /**
   * Mark design settings as dirty/clean
   */
  public setDesignSettingsDirty(isDirty: boolean): void {
    const prevState = { ...this.state.designSettings };

    this.state.designSettings = {
      ...this.state.designSettings,
      isDirty,
    };

    this.notifyListeners('designSettings', this.state.designSettings, prevState);
  }

  // ============================================
  // SETTERS - UI State
  // ============================================

  /**
   * Open a modal
   */
  public openModal(modalId: string): void {
    const prevState = { ...this.state.ui };

    this.state.ui = {
      ...this.state.ui,
      modals: {
        ...this.state.ui.modals,
        [modalId]: true,
      },
    };

    this.notifyListeners('ui', this.state.ui, prevState);
  }

  /**
   * Close a modal
   */
  public closeModal(modalId: string): void {
    const prevState = { ...this.state.ui };

    this.state.ui = {
      ...this.state.ui,
      modals: {
        ...this.state.ui.modals,
        [modalId]: false,
      },
    };

    this.notifyListeners('ui', this.state.ui, prevState);
  }

  /**
   * Toggle a modal
   */
  public toggleModal(modalId: string): void {
    if (this.isModalOpen(modalId)) {
      this.closeModal(modalId);
    } else {
      this.openModal(modalId);
    }
  }

  /**
   * Show a toast notification
   */
  public showToast(message: string, isError: boolean = false): string {
    const prevState = { ...this.state.ui };
    const id = this.generateId();

    const toast: ToastState = {
      id,
      message,
      isError,
      isVisible: true,
    };

    this.state.ui = {
      ...this.state.ui,
      toasts: [...this.state.ui.toasts, toast],
    };

    this.notifyListeners('ui', this.state.ui, prevState);
    return id;
  }

  /**
   * Hide a toast notification
   */
  public hideToast(toastId: string): void {
    const prevState = { ...this.state.ui };

    this.state.ui = {
      ...this.state.ui,
      toasts: this.state.ui.toasts.filter(t => t.id !== toastId),
    };

    this.notifyListeners('ui', this.state.ui, prevState);
  }

  /**
   * Update navigation state
   */
  public setNavigationState(navigation: Partial<NavigationState>): void {
    const prevState = { ...this.state.ui };

    this.state.ui = {
      ...this.state.ui,
      navigation: {
        ...this.state.ui.navigation,
        ...navigation,
      },
    };

    this.notifyListeners('ui', this.state.ui, prevState);
  }

  /**
   * Set loading state
   */
  public setLoading(isLoading: boolean): void {
    const prevState = { ...this.state.ui };

    this.state.ui = {
      ...this.state.ui,
      isLoading,
    };

    this.notifyListeners('ui', this.state.ui, prevState);
  }

  // ============================================
  // SETTERS - Bundle Configuration
  // ============================================

  /**
   * Set bundle form data
   */
  public setBundleForm(form: BundleFormData): void {
    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = {
      ...this.state.bundleConfiguration,
      form: { ...form },
    };

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  /**
   * Update bundle form field
   */
  public updateBundleForm<K extends keyof BundleFormData>(key: K, value: BundleFormData[K]): void {
    if (!this.state.bundleConfiguration.form) return;

    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = {
      ...this.state.bundleConfiguration,
      form: {
        ...this.state.bundleConfiguration.form,
        [key]: value,
      },
      isDirty: true,
    };

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  /**
   * Set bundle steps
   */
  public setBundleSteps(steps: BundleStep[]): void {
    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = {
      ...this.state.bundleConfiguration,
      steps: [...steps],
    };

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  /**
   * Add a bundle step
   */
  public addBundleStep(step: BundleStep): void {
    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = {
      ...this.state.bundleConfiguration,
      steps: [...this.state.bundleConfiguration.steps, { ...step }],
      isDirty: true,
    };

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  /**
   * Update a bundle step
   */
  public updateBundleStep(stepId: string, updates: Partial<BundleStep>): void {
    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = {
      ...this.state.bundleConfiguration,
      steps: this.state.bundleConfiguration.steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
      isDirty: true,
    };

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  /**
   * Remove a bundle step
   */
  public removeBundleStep(stepId: string): void {
    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = {
      ...this.state.bundleConfiguration,
      steps: this.state.bundleConfiguration.steps.filter(step => step.id !== stepId),
      isDirty: true,
    };

    // Clean up related data
    const { [stepId]: _, ...remainingConditions } = this.state.bundleConfiguration.stepConditions;
    const { [stepId]: __, ...remainingCollections } = this.state.bundleConfiguration.selectedCollections;

    this.state.bundleConfiguration.stepConditions = remainingConditions;
    this.state.bundleConfiguration.selectedCollections = remainingCollections;

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  /**
   * Set pricing settings
   */
  public setPricingSettings(pricing: PricingSettings): void {
    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = {
      ...this.state.bundleConfiguration,
      pricing: { ...pricing },
    };

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  /**
   * Update pricing settings
   */
  public updatePricingSettings(updates: Partial<PricingSettings>): void {
    if (!this.state.bundleConfiguration.pricing) return;

    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = {
      ...this.state.bundleConfiguration,
      pricing: {
        ...this.state.bundleConfiguration.pricing,
        ...updates,
      },
      isDirty: true,
    };

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  /**
   * Set step conditions
   */
  public setStepConditions(stepId: string, conditions: ConditionRule[]): void {
    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = {
      ...this.state.bundleConfiguration,
      stepConditions: {
        ...this.state.bundleConfiguration.stepConditions,
        [stepId]: [...conditions],
      },
      isDirty: true,
    };

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  /**
   * Set selected collections for a step
   */
  public setSelectedCollections(stepId: string, collections: Collection[]): void {
    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = {
      ...this.state.bundleConfiguration,
      selectedCollections: {
        ...this.state.bundleConfiguration.selectedCollections,
        [stepId]: [...collections],
      },
      isDirty: true,
    };

    this.state.meta.lastUpdated = Date.now();
    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  /**
   * Mark bundle configuration as dirty/clean
   */
  public setBundleConfigurationDirty(isDirty: boolean): void {
    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = {
      ...this.state.bundleConfiguration,
      isDirty,
    };

    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  /**
   * Clear bundle configuration state
   */
  public clearBundleConfiguration(): void {
    const prevState = { ...this.state.bundleConfiguration };

    this.state.bundleConfiguration = { ...DEFAULT_BUNDLE_CONFIGURATION_STATE };

    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState);
  }

  // ============================================
  // SETTERS - User Preferences
  // ============================================

  /**
   * Update user preferences
   */
  public setPreferences(preferences: Partial<UserPreferences>): void {
    const prevState = { ...this.state.preferences };

    this.state.preferences = {
      ...this.state.preferences,
      ...preferences,
    };

    this.persistPreferences();
    this.notifyListeners('preferences', this.state.preferences, prevState);
  }

  /**
   * Add a bundle to recent bundles list
   */
  public addRecentBundle(bundleId: string): void {
    const prevState = { ...this.state.preferences };
    const recentBundles = this.state.preferences.recentBundles.filter(id => id !== bundleId);
    recentBundles.unshift(bundleId);

    // Keep only the last 10 recent bundles
    this.state.preferences = {
      ...this.state.preferences,
      recentBundles: recentBundles.slice(0, 10),
    };

    this.persistPreferences();
    this.notifyListeners('preferences', this.state.preferences, prevState);
  }

  // ============================================
  // SETTERS - Subscription
  // ============================================

  /**
   * Set subscription state
   */
  public setSubscription(subscription: SubscriptionState): void {
    const prevState = this.state.subscription;

    this.state.subscription = { ...subscription };

    this.notifyListeners('subscription', this.state.subscription, prevState);
  }

  // ============================================
  // SUBSCRIPTION METHODS
  // ============================================

  /**
   * Subscribe to changes on a specific state key
   */
  public subscribe<K extends keyof AppState>(key: K, listener: StateListener<AppState[K]>): Unsubscribe {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(listener);

    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener);
      }
    };
  }

  /**
   * Subscribe to all state changes
   */
  public subscribeToAll(listener: StateListener<AppState>): Unsubscribe {
    this.globalListeners.add(listener);

    return () => {
      this.globalListeners.delete(listener);
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Reset entire state to defaults
   */
  public resetState(): void {
    const prevState = { ...this.state };

    this.state = { ...DEFAULT_APP_STATE };
    this.state.meta.initialized = true;
    this.state.meta.lastUpdated = Date.now();

    // Preserve preferences from localStorage
    this.loadPersistedState();

    this.notifyListeners('designSettings', this.state.designSettings, prevState.designSettings);
    this.notifyListeners('ui', this.state.ui, prevState.ui);
    this.notifyListeners('bundleConfiguration', this.state.bundleConfiguration, prevState.bundleConfiguration);
    this.notifyListeners('preferences', this.state.preferences, prevState.preferences);
    this.notifyListeners('subscription', this.state.subscription, prevState.subscription);
  }

  /**
   * Dispatch an action (reducer-style)
   */
  public dispatch(action: StateAction): void {
    switch (action.type) {
      case 'SET_DESIGN_SETTINGS':
        this.setDesignSettings(action.payload.bundleType, action.payload.settings);
        break;
      case 'UPDATE_DESIGN_SETTING':
        this.updateDesignSetting(action.payload.key, action.payload.value);
        break;
      case 'SET_SELECTED_BUNDLE_TYPE':
        this.setSelectedBundleType(action.payload);
        break;
      case 'SET_DESIGN_DIRTY':
        this.setDesignSettingsDirty(action.payload);
        break;
      case 'OPEN_MODAL':
        this.openModal(action.payload);
        break;
      case 'CLOSE_MODAL':
        this.closeModal(action.payload);
        break;
      case 'SHOW_TOAST':
        this.showToast(action.payload.message, action.payload.isError);
        break;
      case 'HIDE_TOAST':
        this.hideToast(action.payload);
        break;
      case 'SET_NAVIGATION':
        this.setNavigationState(action.payload);
        break;
      case 'SET_BUNDLE_FORM':
        this.setBundleForm(action.payload);
        break;
      case 'UPDATE_BUNDLE_FORM':
        Object.entries(action.payload).forEach(([key, value]) => {
          this.updateBundleForm(key as keyof BundleFormData, value);
        });
        break;
      case 'SET_BUNDLE_STEPS':
        this.setBundleSteps(action.payload);
        break;
      case 'ADD_BUNDLE_STEP':
        this.addBundleStep(action.payload);
        break;
      case 'UPDATE_BUNDLE_STEP':
        this.updateBundleStep(action.payload.stepId, action.payload.updates);
        break;
      case 'REMOVE_BUNDLE_STEP':
        this.removeBundleStep(action.payload);
        break;
      case 'SET_PRICING':
        this.setPricingSettings(action.payload);
        break;
      case 'UPDATE_PRICING':
        this.updatePricingSettings(action.payload);
        break;
      case 'SET_PREFERENCES':
        this.setPreferences(action.payload);
        break;
      case 'SET_SUBSCRIPTION':
        this.setSubscription(action.payload);
        break;
      case 'SET_LOADING':
        this.setLoading(action.payload.value);
        break;
      case 'RESET_STATE':
        this.resetState();
        break;
      default:
        console.warn('Unknown action type:', (action as any).type);
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

/**
 * Get the singleton instance of AppStateService
 */
export const appState = AppStateService.getInstance();

/**
 * Export default getters for convenience
 */
export const getState = () => appState.getState();
export const getDesignSettings = (bundleType: 'full_page' | 'product_page') => appState.getDesignSettings(bundleType);
export const getBundleSteps = () => appState.getBundleSteps();
export const getPreferences = () => appState.getPreferences();
export const isModalOpen = (modalId: string) => appState.isModalOpen(modalId);
export const showToast = (message: string, isError?: boolean) => appState.showToast(message, isError);
