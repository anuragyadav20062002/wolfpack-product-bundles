/**
 * useBundlePricing Hook
 *
 * Manages bundle pricing and discount configuration including:
 * - Discount enable/disable
 * - Discount type selection
 * - Pricing rules management
 * - Progress bar and footer visibility
 * - Rule messaging
 */

import { useState, useCallback } from "react";
import { DiscountMethod, type PricingRule, createNewPricingRule } from "../types/pricing";

interface UseBundlePricingProps {
  initialPricing?: {
    enabled: boolean;
    method: DiscountMethod | string;
    rules: any;
    showProgressBar?: boolean;
    showFooter?: boolean;
  } | null;
}

export function useBundlePricing({ initialPricing }: UseBundlePricingProps) {
  // Pricing state
  const [discountEnabled, setDiscountEnabled] = useState(initialPricing?.enabled || false);
  const [discountType, setDiscountType] = useState<DiscountMethod>(
    (initialPricing?.method as DiscountMethod) || DiscountMethod.PERCENTAGE_OFF
  );
  const [discountRules, setDiscountRules] = useState<PricingRule[]>(
    Array.isArray(initialPricing?.rules) ? initialPricing.rules : []
  );
  const [showProgressBar, setShowProgressBar] = useState(initialPricing?.showProgressBar || false);
  const [showFooter, setShowFooter] = useState(initialPricing?.showFooter !== false);
  const [discountMessagingEnabled, setDiscountMessagingEnabled] = useState(true);

  // Rule messaging
  const [ruleMessages, setRuleMessages] = useState<Record<string, { discountText: string; successMessage: string }>>({});
  const [showVariables, setShowVariables] = useState(false);

  // Add a new discount rule
  const addDiscountRule = useCallback(() => {
    const newRule = createNewPricingRule(discountType);
    setDiscountRules(prev => [...prev, newRule]);

    // Initialize messaging for new rule
    setRuleMessages(prev => ({
      ...prev,
      [newRule.id]: {
        discountText: 'Add {{conditionText}} to get {{discountText}}',
        successMessage: 'Congratulations! You got {{discountText}} on {{bundleName}}! 🎉'
      }
    }));
  }, [discountType]);

  // Remove a discount rule
  const removeDiscountRule = useCallback((ruleId: string) => {
    setDiscountRules(prev => prev.filter(rule => rule.id !== ruleId));

    // Clean up messaging for removed rule
    setRuleMessages(prev => {
      const updated = { ...prev };
      delete updated[ruleId];
      return updated;
    });
  }, []);

  // Update a discount rule
  const updateDiscountRule = useCallback((ruleId: string, updates: Partial<PricingRule>) => {
    setDiscountRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  }, []);

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
  }, []);

  // Change discount type
  const changeDiscountType = useCallback((type: DiscountMethod) => {
    setDiscountType(type);
  }, []);

  // Toggle progress bar
  const toggleProgressBar = useCallback((show: boolean) => {
    setShowProgressBar(show);
  }, []);

  // Toggle footer
  const toggleFooter = useCallback((show: boolean) => {
    setShowFooter(show);
  }, []);

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
      showProgressBar,
      showFooter,
      discountMessagingEnabled,
      ruleMessages
    };
  }, [discountEnabled, discountType, discountRules, showProgressBar, showFooter, discountMessagingEnabled, ruleMessages]);

  return {
    // State
    discountEnabled,
    discountType,
    discountRules,
    showProgressBar,
    showFooter,
    discountMessagingEnabled,
    ruleMessages,
    showVariables,

    // Setters
    setDiscountEnabled,
    setDiscountType,
    setDiscountRules,
    setShowProgressBar,
    setShowFooter,
    setDiscountMessagingEnabled,
    setRuleMessages,
    setShowVariables,

    // Methods
    addDiscountRule,
    removeDiscountRule,
    updateDiscountRule,
    updateRuleMessage,
    toggleDiscountEnabled,
    changeDiscountType,
    toggleProgressBar,
    toggleFooter,
    toggleVariablesPanel,
    getPricingData,
  };
}
