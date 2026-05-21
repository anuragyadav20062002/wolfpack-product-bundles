/**
 * useBundlePricing Hook
 *
 * Manages bundle pricing and discount configuration including:
 * - Discount enable/disable
 * - Discount type selection
 * - Pricing rules management
 * - Footer visibility
 * - Rule messaging
 */

import { useState, useCallback } from "react";
import {
  DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE,
  DEFAULT_DISCOUNT_RULE_TEXT,
  normalizePricingDisplayOptions,
  normalizePricingRuleMessages,
  serializePricingDisplayOptions,
} from "../lib/pricing-display-options";
import {
  DiscountMethod,
  type PricingDisplayOptions,
  type PricingProgressBarType,
  type PricingRule,
  createNewPricingRule,
} from "../types/pricing";

interface UseBundlePricingProps {
  initialPricing?: {
    enabled: boolean;
    method: DiscountMethod | string;
    rules: any;
    showFooter?: boolean;
    showDiscountProgressBar?: boolean;
    messages?: any;
  } | null;
  onStateChange?: () => void;
}

function createInitialPricingDisplayOptions(initialPricing: UseBundlePricingProps["initialPricing"]): PricingDisplayOptions {
  const normalized = normalizePricingDisplayOptions({
    rules: Array.isArray(initialPricing?.rules) ? initialPricing?.rules : [],
    messages: initialPricing?.messages || {},
    showProgressBar: initialPricing?.showDiscountProgressBar === true,
  });

  return serializePricingDisplayOptions({
    existingMessages: {},
    options: normalized,
  }).displayOptions as PricingDisplayOptions;
}

export function useBundlePricing({ initialPricing, onStateChange }: UseBundlePricingProps) {
  // Pricing state
  const [discountEnabled, setDiscountEnabledRaw] = useState(initialPricing?.enabled || false);
  const [discountType, setDiscountTypeRaw] = useState<DiscountMethod>(
    (initialPricing?.method as DiscountMethod) || DiscountMethod.PERCENTAGE_OFF
  );
  const [discountRules, setDiscountRulesRaw] = useState<PricingRule[]>(
    Array.isArray(initialPricing?.rules) ? initialPricing.rules : []
  );
  const [showFooter, setShowFooterRaw] = useState(initialPricing?.showFooter !== false);
  const [showDiscountProgressBar, setShowDiscountProgressBarRaw] = useState(initialPricing?.showDiscountProgressBar === true);
  const [discountMessagingEnabled, setDiscountMessagingEnabledRaw] = useState(initialPricing?.messages?.showDiscountMessaging === true);
  const [pricingDisplayOptions, setPricingDisplayOptionsRaw] = useState<PricingDisplayOptions>(() =>
    createInitialPricingDisplayOptions(initialPricing)
  );

  // Rule messaging
  const [ruleMessages, setRuleMessages] = useState<Record<string, { discountText: string; successMessage: string }>>(
    normalizePricingRuleMessages({
      rules: Array.isArray(initialPricing?.rules) ? initialPricing.rules : [],
      messages: initialPricing?.messages || {},
    })
  );
  const [showVariables, setShowVariables] = useState(false);

  // Wrapped setters that trigger dirty flag
  const setDiscountEnabled = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setDiscountEnabledRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  const setDiscountType = useCallback((value: DiscountMethod | ((prev: DiscountMethod) => DiscountMethod)) => {
    setDiscountTypeRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  const setDiscountRules = useCallback((value: PricingRule[] | ((prev: PricingRule[]) => PricingRule[])) => {
    setDiscountRulesRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  const setShowFooter = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setShowFooterRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  const setShowDiscountProgressBar = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setShowDiscountProgressBarRaw(value);
    setPricingDisplayOptionsRaw(prev => {
      const resolved = typeof value === "function" ? value(prev.progressBar.enabled) : value;
      return {
        ...prev,
        progressBar: {
          ...prev.progressBar,
          enabled: resolved,
        },
      };
    });
    onStateChange?.();
  }, [onStateChange]);

  const setDiscountMessagingEnabled = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setDiscountMessagingEnabledRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  const setPricingDisplayOptions = useCallback((value: PricingDisplayOptions | ((prev: PricingDisplayOptions) => PricingDisplayOptions)) => {
    setPricingDisplayOptionsRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  const setBundleQuantityOptionsEnabled = useCallback((enabled: boolean) => {
    setPricingDisplayOptions(prev => ({
      ...prev,
      bundleQuantityOptions: {
        ...prev.bundleQuantityOptions,
        enabled,
      },
    }));
  }, [setPricingDisplayOptions]);

  const setBundleQuantityDefaultRule = useCallback((ruleId: string | null) => {
    setPricingDisplayOptions(prev => ({
      ...prev,
      bundleQuantityOptions: {
        ...prev.bundleQuantityOptions,
        defaultRuleId: ruleId,
      },
    }));
  }, [setPricingDisplayOptions]);

  const updateBundleQuantityOption = useCallback((ruleId: string, updates: { label?: string; subtext?: string }) => {
    setPricingDisplayOptions(prev => ({
      ...prev,
      bundleQuantityOptions: {
        ...prev.bundleQuantityOptions,
        optionsByRuleId: {
          ...prev.bundleQuantityOptions.optionsByRuleId,
          [ruleId]: {
            ...(prev.bundleQuantityOptions.optionsByRuleId[ruleId] || { label: "", subtext: "" }),
            ...updates,
          },
        },
      },
    }));
  }, [setPricingDisplayOptions]);

  const setProgressBarType = useCallback((type: PricingProgressBarType) => {
    setPricingDisplayOptions(prev => ({
      ...prev,
      progressBar: {
        ...prev.progressBar,
        type,
      },
    }));
  }, [setPricingDisplayOptions]);

  const updateProgressBarOptions = useCallback((updates: Partial<PricingDisplayOptions["progressBar"]>) => {
    setPricingDisplayOptions(prev => ({
      ...prev,
      progressBar: {
        ...prev.progressBar,
        ...updates,
      },
    }));
  }, [setPricingDisplayOptions]);

  // Add a new discount rule
  const addDiscountRule = useCallback(() => {
    const newRule = createNewPricingRule(discountType);
    setDiscountRules(prev => [...prev, newRule]);

    // Initialize messaging for new rule
    setRuleMessages(prev => ({
      ...prev,
      [newRule.id]: {
        discountText: DEFAULT_DISCOUNT_RULE_TEXT,
        successMessage: DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE
      }
    }));
  }, [discountType, setDiscountRules]);

  // Remove a discount rule
  const removeDiscountRule = useCallback((ruleId: string) => {
    setDiscountRules(prev => prev.filter(rule => rule.id !== ruleId));

    // Clean up messaging for removed rule
    setRuleMessages(prev => {
      const updated = { ...prev };
      delete updated[ruleId];
      return updated;
    });
  }, [setDiscountRules]);

  // Update a discount rule
  const updateDiscountRule = useCallback((ruleId: string, updates: Partial<PricingRule>) => {
    setDiscountRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  }, [setDiscountRules]);

  // Update rule message
  const updateRuleMessage = useCallback((ruleId: string, field: 'discountText' | 'successMessage', value: string) => {
    setRuleMessages(prev => ({
      ...prev,
      [ruleId]: {
        ...(prev[ruleId] || { discountText: '', successMessage: '' }),
        [field]: value
      }
    }));
  }, []);

  // Toggle discount enabled
  const toggleDiscountEnabled = useCallback((enabled: boolean) => {
    setDiscountEnabled(enabled);
  }, [setDiscountEnabled]);

  // Change discount type
  const changeDiscountType = useCallback((type: DiscountMethod) => {
    setDiscountType(type);
  }, [setDiscountType]);

  // Toggle footer
  const toggleFooter = useCallback((show: boolean) => {
    setShowFooter(show);
  }, [setShowFooter]);

  // Toggle variables panel
  const toggleVariablesPanel = useCallback(() => {
    setShowVariables(prev => !prev);
  }, []);

  // Get pricing data for submission
  const getPricingData = useCallback(() => {
    return {
      discountEnabled,
      discountType,
      discountRules,
      showFooter,
      showDiscountProgressBar,
      discountMessagingEnabled,
      ruleMessages,
      pricingDisplayOptions
    };
  }, [discountEnabled, discountType, discountRules, showFooter, showDiscountProgressBar, discountMessagingEnabled, ruleMessages, pricingDisplayOptions]);

  return {
    // State
    discountEnabled,
    discountType,
    discountRules,
    showFooter,
    showDiscountProgressBar,
    discountMessagingEnabled,
    ruleMessages,
    pricingDisplayOptions,
    showVariables,

    // Setters
    setDiscountEnabled,
    setDiscountType,
    setDiscountRules,
    setShowFooter,
    setShowDiscountProgressBar,
    setDiscountMessagingEnabled,
    setPricingDisplayOptions,
    setRuleMessages,
    setShowVariables,

    // Methods
    addDiscountRule,
    removeDiscountRule,
    updateDiscountRule,
    updateRuleMessage,
    setBundleQuantityOptionsEnabled,
    setBundleQuantityDefaultRule,
    updateBundleQuantityOption,
    setProgressBarType,
    updateProgressBarOptions,
    toggleDiscountEnabled,
    changeDiscountType,
    toggleFooter,
    toggleVariablesPanel,
    getPricingData,
  };
}
