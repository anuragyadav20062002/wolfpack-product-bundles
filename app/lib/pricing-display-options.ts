import {
  ConditionType,
  DiscountMethod,
  type PricingDisplayOptions,
  type PricingProgressBarType,
  type PricingRule,
} from "../types/pricing";

export interface PricingDisplayStep {
  id: string;
  enabled?: boolean;
  maxQuantity?: number | null;
}

export interface NormalizedBundleQuantityOption {
  ruleId: string;
  quantity: number;
  label: string;
  subtext: string;
  isDefault: boolean;
  compatibility: {
    status: "compatible" | "blocked" | "unchecked";
    reason?: string;
  };
}

export interface NormalizedProgressMilestone {
  ruleId: string;
  conditionType: "quantity" | "amount";
  value: number;
  label: string;
}

export interface NormalizedPricingDisplayOptions {
  bundleQuantityOptions: {
    enabled: boolean;
    defaultRuleId: string | null;
    options: NormalizedBundleQuantityOption[];
  };
  progressBar: {
    enabled: boolean;
    type: PricingProgressBarType;
    progressText: string;
    successText: string;
    milestones: NormalizedProgressMilestone[];
  };
}

export const DEFAULT_PROGRESS_BAR_PROGRESS_TEXT = "Add {{conditionText}} to unlock {{discountText}}";
export const DEFAULT_PROGRESS_BAR_SUCCESS_TEXT = "{{discountText}} unlocked";

interface NormalizeInput {
  rules?: PricingRule[] | null;
  messages?: any;
  showProgressBar?: boolean;
  steps?: PricingDisplayStep[];
  currencySymbol?: string;
}

interface SerializeInput {
  existingMessages?: Record<string, unknown> | null;
  options: NormalizedPricingDisplayOptions;
}

function isQuantityRule(rule: PricingRule): boolean {
  return rule.condition?.type === ConditionType.QUANTITY || String(rule.condition?.type) === "quantity";
}

function isAmountRule(rule: PricingRule): boolean {
  return rule.condition?.type === ConditionType.AMOUNT || String(rule.condition?.type) === "amount";
}

function getDisplayOptions(messages: any): Partial<PricingDisplayOptions> {
  return messages && typeof messages === "object" && messages.displayOptions
    ? messages.displayOptions
    : {};
}

function formatDiscountText(rule: PricingRule, currencySymbol: string): string {
  const method = rule.discount?.method;
  const value = Number(rule.discount?.value ?? 0) || 0;

  if (method === DiscountMethod.PERCENTAGE_OFF || method === "percentage_off") {
    return `${value}% off`;
  }

  if (method === DiscountMethod.FIXED_AMOUNT_OFF || method === "fixed_amount_off") {
    return `${currencySymbol}${(value / 100).toFixed(2)} off`;
  }

  if (method === DiscountMethod.FIXED_BUNDLE_PRICE || method === "fixed_bundle_price") {
    return `Bundle for ${currencySymbol}${(value / 100).toFixed(2)}`;
  }

  return `${value} off`;
}

function getStepQuantityCapacity(steps?: PricingDisplayStep[]): number | null {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  return steps
    .filter((step) => step.enabled !== false)
    .reduce((sum, step) => sum + Math.max(0, Number(step.maxQuantity ?? 0) || 0), 0);
}

function getCompatibility(quantity: number, steps?: PricingDisplayStep[]): NormalizedBundleQuantityOption["compatibility"] {
  const capacity = getStepQuantityCapacity(steps);

  if (capacity === null) {
    return { status: "unchecked" };
  }

  if (capacity < quantity) {
    return {
      status: "blocked",
      reason: `Configured steps allow up to ${capacity} items, below this ${quantity} item option.`,
    };
  }

  return { status: "compatible" };
}

function normalizeProgressType(value: unknown): PricingProgressBarType {
  return value === "simple" ? "simple" : "step_based";
}

function normalizeTemplate(value: unknown, defaultValue: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : defaultValue;
}

export function normalizePricingDisplayOptions({
  rules = [],
  messages = {},
  showProgressBar = false,
  steps,
  currencySymbol = "$",
}: NormalizeInput): NormalizedPricingDisplayOptions {
  const safeRules = Array.isArray(rules) ? rules : [];
  const displayOptions = getDisplayOptions(messages);
  const savedQuantityOptions = displayOptions.bundleQuantityOptions;
  const savedOptionsByRuleId = savedQuantityOptions?.optionsByRuleId || {};
  const quantityRules = safeRules
    .filter(isQuantityRule)
    .sort((a, b) => (Number(a.condition?.value ?? 0) || 0) - (Number(b.condition?.value ?? 0) || 0));
  const quantityRuleIds = new Set(quantityRules.map((rule) => rule.id));
  const savedDefaultRuleId = savedQuantityOptions?.defaultRuleId || null;
  const defaultRuleId = savedDefaultRuleId && quantityRuleIds.has(savedDefaultRuleId)
    ? savedDefaultRuleId
    : quantityRules[0]?.id || null;

  const quantityOptions = quantityRules.map((rule) => {
    const quantity = Number(rule.condition?.value ?? 0) || 0;
    const savedOption = savedOptionsByRuleId[rule.id] || {};

    return {
      ruleId: rule.id,
      quantity,
      label: savedOption.label || `Box of ${quantity}`,
      subtext: savedOption.subtext || formatDiscountText(rule, currencySymbol),
      isDefault: rule.id === defaultRuleId,
      compatibility: getCompatibility(quantity, steps),
    };
  });

  const progressOptions = displayOptions.progressBar;
  const milestones = safeRules
    .filter((rule) => isQuantityRule(rule) || isAmountRule(rule))
    .sort((a, b) => (Number(a.condition?.value ?? 0) || 0) - (Number(b.condition?.value ?? 0) || 0))
    .map((rule) => ({
      ruleId: rule.id,
      conditionType: isAmountRule(rule) ? "amount" as const : "quantity" as const,
      value: Number(rule.condition?.value ?? 0) || 0,
      label: formatDiscountText(rule, currencySymbol),
    }));

  return {
    bundleQuantityOptions: {
      enabled: savedQuantityOptions?.enabled === true,
      defaultRuleId,
      options: quantityOptions,
    },
    progressBar: {
      enabled: progressOptions?.enabled === true || showProgressBar === true,
      type: normalizeProgressType(progressOptions?.type),
      progressText: normalizeTemplate(progressOptions?.progressText, DEFAULT_PROGRESS_BAR_PROGRESS_TEXT),
      successText: normalizeTemplate(progressOptions?.successText, DEFAULT_PROGRESS_BAR_SUCCESS_TEXT),
      milestones,
    },
  };
}

export function serializePricingDisplayOptions({
  existingMessages = {},
  options,
}: SerializeInput): Record<string, unknown> {
  const optionsByRuleId = options.bundleQuantityOptions.options.reduce<Record<string, { label: string; subtext: string }>>(
    (acc, option) => {
      acc[option.ruleId] = {
        label: option.label,
        subtext: option.subtext,
      };
      return acc;
    },
    {},
  );

  return {
    ...(existingMessages || {}),
    displayOptions: {
      bundleQuantityOptions: {
        enabled: options.bundleQuantityOptions.enabled,
        defaultRuleId: options.bundleQuantityOptions.defaultRuleId,
        optionsByRuleId,
      },
      progressBar: {
        enabled: options.progressBar.enabled,
        type: options.progressBar.type,
        progressText: options.progressBar.progressText,
        successText: options.progressBar.successText,
      },
    },
  };
}
