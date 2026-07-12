import {
  createNewPricingRule,
  type DiscountMethod,
  type PricingRule,
} from "../types/pricing";

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
