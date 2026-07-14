import {
  createNewPricingRule,
  type DiscountMethod,
  type PricingRule,
} from "../types/pricing";
import { normalizePricingRuleMessages } from "./pricing-display-options";

type PricingRuleMessages = Record<
  string,
  { discountText: string; successMessage: string }
>;

export function ensurePricingRulesForEnabledState({
  enabled,
  method,
  rules,
}: {
  enabled: boolean;
  method: DiscountMethod;
  rules: PricingRule[];
}): PricingRule[] {
  if (!enabled || rules.length > 0) {
    return rules;
  }

  return [createNewPricingRule(method)];
}

export function ensurePricingRuleMessagesForEnabledState({
  method,
  rules,
  existingMessages,
}: {
  method: DiscountMethod;
  rules: PricingRule[];
  existingMessages: PricingRuleMessages;
}): PricingRuleMessages {
  if (rules.length === 0) {
    return existingMessages;
  }

  const hasMessagesForEveryRule = rules.every((rule) => {
    const message = existingMessages[rule.id];
    return Boolean(message?.discountText && message?.successMessage);
  });

  if (hasMessagesForEveryRule) {
    return existingMessages;
  }

  return normalizePricingRuleMessages({
    rules,
    method,
    messages: { ruleMessages: existingMessages },
  });
}
