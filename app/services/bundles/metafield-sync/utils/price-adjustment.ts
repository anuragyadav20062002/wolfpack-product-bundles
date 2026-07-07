import type { PriceAdjustment } from "../types";

const BXY_METHOD = "buy_x_get_y";
const FIXED_BUNDLE_PRICE_METHOD = "fixed_bundle_price";

function toPositiveNumber(...values: unknown[]): number {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 0;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRuleValue(method: string, rule: any): number {
  if (method === FIXED_BUNDLE_PRICE_METHOD) {
    return toPositiveNumber(
      rule.fixedBundlePrice,
      rule.price,
      rule.discountValue,
      rule.discount?.value,
    );
  }

  return toNumber(rule.discountValue ?? rule.discount?.value);
}

function buildPriceAdjustmentRule(method: string, rule: any): PriceAdjustment {
  const priceAdjustment: PriceAdjustment = {
    method: method || rule.discount?.method || "percentage_off",
    value: getRuleValue(method, rule),
  };

  const customerBuys = toPositiveNumber(
    rule.customerBuys,
    rule.value,
    rule.conditionValue,
    rule.condition?.value,
  );
  const customerGets = toPositiveNumber(
    rule.customerGets,
    rule.getsQuantity,
  );
  const isBxy = priceAdjustment.method === BXY_METHOD;

  if (isBxy) {
    if (customerBuys > 0) {
      priceAdjustment.customerBuys = customerBuys;
    }
    if (customerGets > 0) {
      priceAdjustment.customerGets = customerGets;
    }

    priceAdjustment.discountType = String(
      rule.discountType ?? rule.bxyDiscountType ?? "percentage",
    );
    priceAdjustment.applyDiscountTo = String(
      rule.applyDiscountTo ?? rule.bxyApplyMode ?? "lowest_priced",
    );
  }

  const condType = isBxy && customerBuys > 0 && customerGets > 0
    ? "quantity"
    : (rule.conditionType || rule.condition?.type);
  const condValue = isBxy && customerBuys > 0 && customerGets > 0
    ? customerBuys + customerGets
    : toPositiveNumber(rule.conditionValue, rule.condition?.value);

  if (condType && condValue > 0) {
    priceAdjustment.conditions = {
      type: condType,
      operator: "gte",
      value: condValue,
    };
  }

  return priceAdjustment;
}

export function buildPriceAdjustmentConfig(pricing: any): PriceAdjustment {
  const method = pricing?.method || "percentage_off";
  const priceAdjustment: PriceAdjustment = {
    method,
    value: 0,
  };

  if (!pricing?.enabled || !Array.isArray(pricing.rules) || pricing.rules.length === 0) {
    return priceAdjustment;
  }

  const rule = pricing.rules[0] ?? {};
  const normalizedRules = pricing.rules.map((pricingRule: any) =>
    buildPriceAdjustmentRule(pricing.method || pricingRule.discount?.method || method, pricingRule)
  );
  Object.assign(
    priceAdjustment,
    buildPriceAdjustmentRule(pricing.method || rule.discount?.method || method, rule),
  );

  if (normalizedRules.length > 0) {
    priceAdjustment.rules = normalizedRules;
  }

  return priceAdjustment;
}
