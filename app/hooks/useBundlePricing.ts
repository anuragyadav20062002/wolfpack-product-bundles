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
import { DiscountMethod, type PricingRule, createNewPricingRule } from "../types/pricing";

interface UseBundlePricingProps {
  initialPricing?: {
    enabled: boolean;
    method: DiscountMethod | string;
    rules: any;
    showFooter?: boolean;
  } | null;
  onStateChange?: () => void;
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
  const [discountMessagingEnabled, setDiscountMessagingEnabledRaw] = useState(true);

  // Rule messaging
  const [ruleMessages, setRuleMessages] = useState<Record<string, { discountText: string; successMessage: string }>>({});
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

  const setDiscountMessagingEnabled = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setDiscountMessagingEnabledRaw(value);
    onStateChange?.();
  }, [onStateChange]);

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
      discountMessagingEnabled,
      ruleMessages
    };
  }, [discountEnabled, discountType, discountRules, showFooter, discountMessagingEnabled, ruleMessages]);

  return {
    // State
    discountEnabled,
    discountType,
    discountRules,
    showFooter,
    discountMessagingEnabled,
    ruleMessages,
    showVariables,

    // Setters
    setDiscountEnabled,
    setDiscountType,
    setDiscountRules,
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
    toggleFooter,
    toggleVariablesPanel,
    getPricingData,
  };
}
