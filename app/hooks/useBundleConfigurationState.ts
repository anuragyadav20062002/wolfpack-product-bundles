/**
 * Bundle Configuration State Hook
 *
 * Unified state management for bundle configuration routes.
 * Wraps existing custom hooks and adds additional state for:
 * - Modal visibility
 * - Loading states
 * - UI navigation
 * - Bundle product data
 *
 * Used by both full-page and product-page bundle configuration routes.
 */

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { appState as appStateService } from "../services/app.state.service";
import { useBundleForm } from "./useBundleForm";
import { useBundleSteps } from "./useBundleSteps";
import { useBundleConditions } from "./useBundleConditions";
import { useBundlePricing } from "./useBundlePricing";

// ============================================
// TYPES
// ============================================

export type BundleStatus = 'active' | 'draft' | 'archived';

export interface BundleData {
  id: string;
  name: string;
  description?: string;
  status: BundleStatus;
  bundleType: string;
  templateName?: string;
  shopifyProductId?: string;
  shopifyPageHandle?: string;
  shopifyPageId?: string;
  steps: any[];
  pricing?: any;
}

export interface BundleProductData {
  id: string;
  title: string;
  handle?: string;
  status: string;
  featuredImage?: { url: string };
  images?: { originalSrc: string }[];
}

export interface UseBundleConfigurationProps {
  bundle: BundleData;
  bundleProduct: BundleProductData | null;
  shopify: any;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useBundleConfigurationState({
  bundle,
  bundleProduct: loadedBundleProduct,
  shopify,
}: UseBundleConfigurationProps) {
  // ===== DIRTY FLAG SYSTEM =====
  const [isDirty, setIsDirty] = useState(false);
  const isResettingRef = useRef(false);
  const lastProcessedFetcherDataRef = useRef<any>(null);

  const markAsDirty = useCallback(() => {
    if (!isResettingRef.current) {
      setIsDirty(true);
    }
  }, []);

  // ===== CUSTOM HOOKS =====
  // Form state management
  const formState = useBundleForm({
    initialData: {
      name: bundle.name,
      description: bundle.description || "",
      status: bundle.status,
      templateName: bundle.templateName || ""
    },
    onStateChange: markAsDirty
  });

  // Step conditions initialization
  const initializeStepConditions = () => {
    const initialConditions: Record<string, any[]> = {};
    (bundle.steps || []).forEach((step: any) => {
      if (step.conditionType && step.conditionOperator && step.conditionValue !== null) {
        initialConditions[step.id] = [{
          id: `condition_${step.id}_${Date.now()}`,
          type: step.conditionType,
          operator: step.conditionOperator,
          value: step.conditionValue.toString()
        }];
      }
    });
    return initialConditions;
  };

  // Condition rules management
  const conditionsState = useBundleConditions({
    initialStepConditions: initializeStepConditions(),
    onStateChange: markAsDirty
  });

  // Transform steps for the hook
  const transformedSteps = useMemo(() =>
    (bundle.steps || []).map((step: any) => ({
      ...step,
      StepProduct: (step.StepProduct || []).map((sp: any) => ({
        ...sp,
        id: sp.productId,
      }))
    }))
  , [bundle.steps]);

  // Steps management
  const stepsState = useBundleSteps({
    initialSteps: transformedSteps,
    shopify,
    onStateChange: markAsDirty
  });

  // Pricing management
  const pricingState = useBundlePricing({
    initialPricing: bundle.pricing,
    onStateChange: markAsDirty
  });

  // ===== MODAL STATES =====
  const [isPageSelectionModalOpen, setIsPageSelectionModalOpen] = useState(false);
  const [isWidgetInstallModalOpen, setIsWidgetInstallModalOpen] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
  const [currentModalStepId, setCurrentModalStepId] = useState<string>('');

  // Modal handlers
  const openPageSelectionModal = useCallback(() => {
    setIsPageSelectionModalOpen(true);
    appStateService.openModal('bundleConfig_pageSelection');
  }, []);

  const closePageSelectionModal = useCallback(() => {
    setIsPageSelectionModalOpen(false);
    appStateService.closeModal('bundleConfig_pageSelection');
  }, []);

  const openWidgetInstallModal = useCallback(() => {
    setIsWidgetInstallModalOpen(true);
    appStateService.openModal('bundleConfig_widgetInstall');
  }, []);

  const closeWidgetInstallModal = useCallback(() => {
    setIsWidgetInstallModalOpen(false);
    appStateService.closeModal('bundleConfig_widgetInstall');
  }, []);

  const openProductsModal = useCallback((stepId: string) => {
    setCurrentModalStepId(stepId);
    setIsProductsModalOpen(true);
    appStateService.openModal('bundleConfig_products');
  }, []);

  const closeProductsModal = useCallback(() => {
    setIsProductsModalOpen(false);
    appStateService.closeModal('bundleConfig_products');
  }, []);

  const openCollectionsModal = useCallback((stepId: string) => {
    setCurrentModalStepId(stepId);
    setIsCollectionsModalOpen(true);
    appStateService.openModal('bundleConfig_collections');
  }, []);

  const closeCollectionsModal = useCallback(() => {
    setIsCollectionsModalOpen(false);
    appStateService.closeModal('bundleConfig_collections');
  }, []);

  // ===== LOADING STATES =====
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  // ===== DATA STATES =====
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<any>(null);

  // Bundle product state
  const [bundleProduct, setBundleProductRaw] = useState<any>(loadedBundleProduct || null);
  const [productStatus, setProductStatusRaw] = useState(loadedBundleProduct?.status || "ACTIVE");
  const [productTitle, setProductTitle] = useState(loadedBundleProduct?.title || "");
  const [productImageUrl, setProductImageUrl] = useState(
    loadedBundleProduct?.featuredImage?.url ||
    loadedBundleProduct?.images?.[0]?.originalSrc || ""
  );

  // Wrapped setters that trigger dirty flag
  const setBundleProduct = useCallback((value: any) => {
    setBundleProductRaw(value);
    markAsDirty();
  }, [markAsDirty]);

  const setProductStatus = useCallback((value: string) => {
    setProductStatusRaw(value);
    markAsDirty();
  }, [markAsDirty]);

  // Collections state
  const [selectedCollections, setSelectedCollectionsRaw] = useState<Record<string, any[]>>(() => {
    const collections: Record<string, any[]> = {};
    bundle.steps?.forEach(step => {
      if (step.collections && Array.isArray(step.collections) && step.collections.length > 0) {
        collections[step.id] = step.collections;
      }
    });
    return collections;
  });

  const setSelectedCollections = useCallback((
    value: Record<string, any[]> | ((prev: Record<string, any[]>) => Record<string, any[]>)
  ) => {
    setSelectedCollectionsRaw(value);
    markAsDirty();
  }, [markAsDirty]);

  // Rule messages state: ruleId → locale → { discountText, successMessage }
  const [ruleMessages, setRuleMessagesRaw] = useState<Record<string, Record<string, { discountText: string; successMessage: string }>>>({});

  const setRuleMessages = useCallback((
    value: Record<string, Record<string, { discountText: string; successMessage: string }>> |
    ((prev: Record<string, Record<string, { discountText: string; successMessage: string }>>) =>
      Record<string, Record<string, { discountText: string; successMessage: string }>>)
  ) => {
    setRuleMessagesRaw(value);
    markAsDirty();
  }, [markAsDirty]);

  // ===== UI STATES =====
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [activeSection, setActiveSection] = useState('step_setup');
  const [forceNavigation, setForceNavigation] = useState(false);

  // Banner states
  const [showAutoPlacementBanner, setShowAutoPlacementBanner] = useState(false);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  // ===== ORIGINAL VALUES REF (for discard) =====
  const originalValuesRef = useRef({
    status: formState.bundleStatus,
    name: formState.bundleName,
    description: formState.bundleDescription,
    templateName: formState.templateName,
    steps: JSON.stringify(transformedSteps),
    discountEnabled: pricingState.discountEnabled,
    discountType: pricingState.discountType,
    discountRules: JSON.stringify(pricingState.discountRules),
    showProgressBar: pricingState.showProgressBar,
    showFooter: pricingState.showFooter,
    discountMessagingEnabled: pricingState.discountMessagingEnabled,
    selectedCollections: JSON.stringify({}),
    ruleMessages: JSON.stringify({}),
    stepConditions: JSON.stringify(conditionsState.stepConditions),
    bundleProduct: loadedBundleProduct || null,
    productStatus: loadedBundleProduct?.status || "ACTIVE",
  });

  // ===== DISCARD HANDLER =====
  const handleDiscard = useCallback(() => {
    try {
      isResettingRef.current = true;
      const originalValues = originalValuesRef.current;

      // Reset form state
      formState.setBundleStatus(originalValues.status);
      formState.setBundleName(originalValues.name);
      formState.setBundleDescription(originalValues.description);
      formState.setTemplateName(originalValues.templateName);

      // Reset steps
      const originalSteps = JSON.parse(originalValues.steps);
      stepsState.setSteps(originalSteps);

      // Reset pricing
      pricingState.setDiscountEnabled(originalValues.discountEnabled);
      pricingState.setDiscountType(originalValues.discountType);
      pricingState.setDiscountRules(JSON.parse(originalValues.discountRules));
      pricingState.setShowProgressBar(originalValues.showProgressBar);
      pricingState.setShowFooter(originalValues.showFooter);
      pricingState.setDiscountMessagingEnabled(originalValues.discountMessagingEnabled);

      // Reset collections
      setSelectedCollections(JSON.parse(originalValues.selectedCollections));

      // Reset rule messages
      setRuleMessages(JSON.parse(originalValues.ruleMessages));

      // Reset conditions
      conditionsState.setStepConditions(JSON.parse(originalValues.stepConditions));

      // Reset bundle product
      setBundleProduct(originalValues.bundleProduct || loadedBundleProduct || null);
      setProductStatus(originalValues.productStatus);

      isResettingRef.current = false;
      setIsDirty(false);

      shopify.toast.show("Changes discarded", { isError: false });
    } catch (error) {
      isResettingRef.current = false;
      shopify.toast.show("Error discarding changes", { isError: true, duration: 5000 });
    }
  }, [
    loadedBundleProduct,
    shopify,
    formState,
    stepsState,
    pricingState,
    conditionsState,
    setBundleProduct,
    setProductStatus,
    setSelectedCollections,
    setRuleMessages
  ]);

  // ===== MARK AS SAVED =====
  const markAsSaved = useCallback(() => {
    // Update original values ref with current state
    originalValuesRef.current = {
      status: formState.bundleStatus,
      name: formState.bundleName,
      description: formState.bundleDescription,
      templateName: formState.templateName,
      steps: JSON.stringify(stepsState.steps),
      discountEnabled: pricingState.discountEnabled,
      discountType: pricingState.discountType,
      discountRules: JSON.stringify(pricingState.discountRules),
      showProgressBar: pricingState.showProgressBar,
      showFooter: pricingState.showFooter,
      discountMessagingEnabled: pricingState.discountMessagingEnabled,
      selectedCollections: JSON.stringify(selectedCollections),
      ruleMessages: JSON.stringify(ruleMessages),
      stepConditions: JSON.stringify(conditionsState.stepConditions),
      bundleProduct: bundleProduct,
      productStatus: productStatus,
    };
    setIsDirty(false);
  }, [
    formState,
    stepsState.steps,
    pricingState,
    selectedCollections,
    ruleMessages,
    conditionsState.stepConditions,
    bundleProduct,
    productStatus
  ]);

  // ===== RETURN UNIFIED STATE =====
  return {
    // Dirty state
    isDirty,
    setIsDirty,
    markAsDirty,
    markAsSaved,
    handleDiscard,
    isResettingRef,
    lastProcessedFetcherDataRef,

    // Form state (from useBundleForm)
    formState,

    // Steps state (from useBundleSteps)
    stepsState,

    // Conditions state (from useBundleConditions)
    conditionsState,

    // Pricing state (from useBundlePricing)
    pricingState,

    // Modal states
    isPageSelectionModalOpen,
    openPageSelectionModal,
    closePageSelectionModal,
    isWidgetInstallModalOpen,
    openWidgetInstallModal,
    closeWidgetInstallModal,
    isProductsModalOpen,
    openProductsModal,
    closeProductsModal,
    isCollectionsModalOpen,
    openCollectionsModal,
    closeCollectionsModal,
    currentModalStepId,
    setCurrentModalStepId,

    // Loading states
    isLoadingPages,
    setIsLoadingPages,

    // Page selection data
    availablePages,
    setAvailablePages,
    selectedPage,
    setSelectedPage,

    // Bundle product data
    bundleProduct,
    setBundleProduct,
    productStatus,
    setProductStatus,
    productTitle,
    setProductTitle,
    productImageUrl,
    setProductImageUrl,

    // Collections
    selectedCollections,
    setSelectedCollections,

    // Rule messages
    ruleMessages,
    setRuleMessages,

    // UI states
    activeTabIndex,
    setActiveTabIndex,
    activeSection,
    setActiveSection,
    forceNavigation,
    setForceNavigation,

    // Banner states
    showAutoPlacementBanner,
    setShowAutoPlacementBanner,
    dismissedBanners,
    setDismissedBanners,

    // Original values ref
    originalValuesRef,
  };
}
