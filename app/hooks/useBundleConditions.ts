/**
 * useBundleConditions Hook
 *
 * Manages bundle step condition rules including:
 * - Adding/removing/updating condition rules
 * - Condition validation
 * - Rule state management
 */

import { useState, useCallback } from "react";

interface ConditionRule {
  id: string;
  type: string;
  operator: string;
  value: string;
}

interface UseBundleConditionsProps {
  initialStepConditions: Record<string, ConditionRule[]>;
}

export function useBundleConditions({ initialStepConditions }: UseBundleConditionsProps) {
  const [stepConditions, setStepConditions] = useState<Record<string, ConditionRule[]>>(initialStepConditions);

  // Add a new condition rule for a step
  const addConditionRule = useCallback((stepId: string) => {
    const newRule: ConditionRule = {
      id: `rule-${Date.now()}`,
      type: 'quantity',
      operator: 'equal_to',
      value: '0',
    };

    setStepConditions(prev => ({
      ...prev,
      [stepId]: [...(prev[stepId] || []), newRule],
    }));
  }, []);

  // Remove a condition rule
  const removeConditionRule = useCallback((stepId: string, ruleId: string) => {
    setStepConditions(prev => ({
      ...prev,
      [stepId]: (prev[stepId] || []).filter(rule => rule.id !== ruleId),
    }));
  }, []);

  // Update a condition rule field
  const updateConditionRule = useCallback((stepId: string, ruleId: string, field: string, value: string) => {
    setStepConditions(prev => ({
      ...prev,
      [stepId]: (prev[stepId] || []).map(rule =>
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      ),
    }));
  }, []);

  // Get conditions for a specific step
  const getStepConditions = useCallback((stepId: string): ConditionRule[] => {
    return stepConditions[stepId] || [];
  }, [stepConditions]);

  // Check if a step has conditions
  const hasStepConditions = useCallback((stepId: string): boolean => {
    return (stepConditions[stepId] || []).length > 0;
  }, [stepConditions]);

  // Clear all conditions for a step
  const clearStepConditions = useCallback((stepId: string) => {
    setStepConditions(prev => ({
      ...prev,
      [stepId]: [],
    }));
  }, []);

  return {
    // State
    stepConditions,

    // Setters
    setStepConditions,

    // Methods
    addConditionRule,
    removeConditionRule,
    updateConditionRule,
    getStepConditions,
    hasStepConditions,
    clearStepConditions,
  };
}
