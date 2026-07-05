import {
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
    optionsByLocaleByRuleId: Record<string, Record<string, { label: string; subtext: string }>>;
  };
  progressBar: {
    enabled: boolean;
    type: PricingProgressBarType;
    progressText: string;
    successText: string;
    milestones: NormalizedProgressMilestone[];
  };
}

export interface SerializedBoxSelection {
  isEnabled: true;
  validateBoxSelectionQuantity: false;
  rules: Array<{
    ruleId: string;
    boxQuantity: number;
    boxLabel: string;
    boxSubtext: string;
    isDefaultSelected: boolean;
  }>;
}

export interface NormalizedRuleMessageInput {
  rules?: PricingRule[] | null;
  messages?: any;
  method?: DiscountMethod | string;
}

export const DEFAULT_PROGRESS_BAR_PROGRESS_TEXT = "Add {{conditionText}} to unlock {{discountText}}";
export const DEFAULT_PROGRESS_BAR_SUCCESS_TEXT = "{{discountText}} unlocked";
export const DEFAULT_DISCOUNT_RULE_TEXT = "Add {{discountConditionDiff}} product(s) to save {{discountValue}}{{discountValueUnit}}!";
export const DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE = "Success! Your {{discountValue}}{{discountValueUnit}} discount has been applied to your cart.";
export const DEFAULT_FIXED_AMOUNT_RULE_TEXT = "Add {{discountConditionDiff}} product(s) to save {{discountValueUnit}}{{discountValue}}!";
export const DEFAULT_FIXED_AMOUNT_RULE_SUCCESS_MESSAGE = "Success! Your {{discountValueUnit}}{{discountValue}} discount has been applied to your cart.";
export const DEFAULT_DISCOUNT_RULE_TEXT_BXY = "Add {{discountConditionDiff}} product(s) to get {{discountedItems}} of them at {{discountValue}}{{discountValueUnit}} off!";
export const DEFAULT_DISCOUNT_RULE_TEXT_BXY_MORE = "Add {{discountConditionDiff}} more to get {{discountedItems}} of them at {{discountValue}}{{discountValueUnit}} off!";
export const DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE_BXY = "Success! You got {{discountedItems}} product(s) at {{discountValue}}{{discountValueUnit}} off";

export function getDefaultDiscountRuleText(method?: DiscountMethod | string, ruleIndex = 0): string {
  if (method === DiscountMethod.BUY_X_GET_Y) {
    return ruleIndex === 0 ? DEFAULT_DISCOUNT_RULE_TEXT_BXY : DEFAULT_DISCOUNT_RULE_TEXT_BXY_MORE;
  }

  if (method === DiscountMethod.FIXED_AMOUNT_OFF) {
    return DEFAULT_FIXED_AMOUNT_RULE_TEXT;
  }

  return DEFAULT_DISCOUNT_RULE_TEXT;
}

export function getDefaultDiscountRuleSuccessMessage(method?: DiscountMethod | string): string {
  if (method === DiscountMethod.BUY_X_GET_Y) {
    return DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE_BXY;
  }

  if (method === DiscountMethod.FIXED_AMOUNT_OFF) {
    return DEFAULT_FIXED_AMOUNT_RULE_SUCCESS_MESSAGE;
  }

  return DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE;
}

interface NormalizeInput {
  rules?: PricingRule[] | null;
  messages?: any;
  showProgressBar?: boolean;
  steps?: PricingDisplayStep[];
  currencySymbol?: string;
  method?: string;
}

interface SerializeInput {
  existingMessages?: Record<string, unknown> | null;
  options: NormalizedPricingDisplayOptions;
}

function isQuantityRule(rule: PricingRule): boolean {
  return rule.conditionType === "quantity";
}

function isAmountRule(rule: PricingRule): boolean {
  return rule.conditionType === "amount";
}

function getDisplayOptions(messages: any): Partial<PricingDisplayOptions> {
  return messages && typeof messages === "object" && messages.displayOptions
    ? messages.displayOptions
    : {};
}

function formatDiscountText(rule: PricingRule, method: DiscountMethod | string, currencySymbol: string): string {
  const value = Number(rule.discountValue ?? 0) || 0;

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

function containsPercentageValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const percentIndex = value.indexOf("%");
  if (percentIndex === -1) return false;

  return value
    .slice(0, percentIndex)
    .split("")
    .some((character) => character >= "0" && character <= "9");
}

function canUseSavedBundleQuantitySubtext(
  value: unknown,
  method: DiscountMethod | string,
): value is string {
  if (typeof value !== "string" || value.trim().length === 0) return false;

  if (
    (method === DiscountMethod.FIXED_AMOUNT_OFF || method === "fixed_amount_off") &&
    containsPercentageValue(value)
  ) {
    return false;
  }

  return true;
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

export function normalizePricingRuleMessages({
  rules = [],
  messages = {},
  method,
}: NormalizedRuleMessageInput): Record<string, { discountText: string; successMessage: string }> {
  const safeRules = Array.isArray(rules) ? rules : [];
  const savedRuleMessages = messages && typeof messages === "object" && messages.ruleMessages
    ? messages.ruleMessages
    : {};
  const defaultSuccessMessage = getDefaultDiscountRuleSuccessMessage(method);

  return safeRules.reduce<Record<string, { discountText: string; successMessage: string }>>((acc, rule, index) => {
    const defaultDiscountText = getDefaultDiscountRuleText(method, index);
    const savedMessage = savedRuleMessages?.[rule.id];
    if (!savedMessage || typeof savedMessage !== "object") {
      acc[rule.id] = {
        discountText: defaultDiscountText,
        successMessage: defaultSuccessMessage,
      };
      return acc;
    }

    const discountText = typeof savedMessage.discountText === "string" && savedMessage.discountText.trim().length > 0
      ? savedMessage.discountText
      : defaultDiscountText;
    const successMessage = typeof savedMessage.successMessage === "string" && savedMessage.successMessage.trim().length > 0
      ? savedMessage.successMessage
      : defaultSuccessMessage;

    acc[rule.id] = { discountText, successMessage };
    return acc;
  }, {});
}

export function normalizePricingDisplayOptions({
  rules = [],
  messages = {},
  showProgressBar,
  steps,
  currencySymbol = "$",
  method = "percentage_off",
}: NormalizeInput): NormalizedPricingDisplayOptions {
  const safeRules = Array.isArray(rules) ? rules : [];
  const displayOptions = getDisplayOptions(messages);
  const savedQuantityOptions = displayOptions.bundleQuantityOptions;
  const savedOptionsByRuleId = savedQuantityOptions?.optionsByRuleId || {};
  const savedOptionsByLocaleByRuleId = savedQuantityOptions?.optionsByLocaleByRuleId || {};
  const quantityRules = safeRules
    .filter(isQuantityRule)
    .sort((a, b) => (Number(a.conditionValue ?? 0) || 0) - (Number(b.conditionValue ?? 0) || 0));
  const quantityRuleIds = new Set(quantityRules.map((rule) => rule.id));
  const savedDefaultRuleId = savedQuantityOptions?.defaultRuleId || null;
  const defaultRuleId = savedDefaultRuleId && quantityRuleIds.has(savedDefaultRuleId)
    ? savedDefaultRuleId
    : quantityRules[0]?.id || null;

  const quantityOptions = quantityRules.map((rule) => {
    const quantity = Number(rule.conditionValue ?? 0) || 0;
    const savedOption = savedOptionsByRuleId[rule.id] || {};

    return {
      ruleId: rule.id,
      quantity,
      label: savedOption.label || `Box of ${quantity}`,
      subtext: canUseSavedBundleQuantitySubtext(savedOption.subtext, method)
        ? savedOption.subtext
        : formatDiscountText(rule, method, currencySymbol),
      isDefault: rule.id === defaultRuleId,
      compatibility: getCompatibility(quantity, steps),
    };
  });

  const progressOptions = displayOptions.progressBar;
  const milestones = safeRules
    .filter((rule) => isQuantityRule(rule) || isAmountRule(rule))
    .sort((a, b) => (Number(a.conditionValue ?? 0) || 0) - (Number(b.conditionValue ?? 0) || 0))
    .map((rule) => ({
      ruleId: rule.id,
      conditionType: isAmountRule(rule) ? "amount" as const : "quantity" as const,
      value: Number(rule.conditionValue ?? 0) || 0,
      label: formatDiscountText(rule, method, currencySymbol),
    }));

  return {
    bundleQuantityOptions: {
      enabled: savedQuantityOptions?.enabled === true,
      defaultRuleId,
      options: quantityOptions,
      optionsByLocaleByRuleId: savedOptionsByLocaleByRuleId,
    },
    progressBar: {
      enabled: typeof showProgressBar === "boolean"
        ? showProgressBar
        : progressOptions?.enabled === true,
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
        optionsByLocaleByRuleId: options.bundleQuantityOptions.optionsByLocaleByRuleId,
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

export function serializeBoxSelectionFromPricingDisplayOptions(
  options: NormalizedPricingDisplayOptions,
): SerializedBoxSelection | null {
  if (options.bundleQuantityOptions.enabled !== true) return null;

  const rules = options.bundleQuantityOptions.options
    .filter((option) => option.quantity > 0)
    .map((option) => ({
      ruleId: option.ruleId,
      boxQuantity: option.quantity,
      boxLabel: option.label,
      boxSubtext: option.subtext,
      isDefaultSelected: option.isDefault,
    }));

  if (rules.length === 0) return null;

  return {
    isEnabled: true,
    validateBoxSelectionQuantity: false,
    rules,
  };
}
