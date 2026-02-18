/**
 * Pricing Rules Type Definitions
 *
 * Standardized pricing structure used across:
 * - Database (Prisma JSON fields)
 * - Product metafields
 * - Bundle widget (storefront)
 * - Cart transform function
 *
 * Design Principles:
 * - ONE structure everywhere (no transformations)
 * - Clear nested structure (condition vs discount)
 * - Type-safe with validation
 * - Always use smallest units (cents for money, count for items)
 */

/**
 * Discount method types
 */
export enum DiscountMethod {
  PERCENTAGE_OFF = 'percentage_off',        // e.g., 20% off
  FIXED_AMOUNT_OFF = 'fixed_amount_off',    // e.g., ₹100 off
  FIXED_BUNDLE_PRICE = 'fixed_bundle_price' // e.g., Bundle for ₹500
}

/**
 * Condition types - what triggers the discount
 */
export enum ConditionType {
  QUANTITY = 'quantity',  // Based on number of items (e.g., >= 3 items)
  AMOUNT = 'amount'       // Based on cart subtotal (e.g., >= ₹500)
}

/**
 * Condition operators - how to compare current value vs threshold
 */
export enum ConditionOperator {
  GTE = 'gte',  // Greater than or equal (≥)
  GT = 'gt',    // Greater than (>)
  LTE = 'lte',  // Less than or equal (≤)
  LT = 'lt',    // Less than (<)
  EQ = 'eq'     // Equal (=)
}

/**
 * Condition configuration for a pricing rule
 * Defines WHEN a discount should be applied
 */
export interface PricingRuleCondition {
  type: ConditionType;          // 'quantity' or 'amount'
  operator: ConditionOperator;  // 'gte', 'gt', 'lte', 'lt', 'eq'
  value: number;                // Threshold value
                                // - For quantity: item count (integer)
                                // - For amount: price in CENTS (to avoid decimals)
}

/**
 * Discount configuration for a pricing rule
 * Defines WHAT discount to apply
 */
export interface PricingRuleDiscount {
  method: DiscountMethod;       // Must match parent pricing.method
  value: number;                // Discount value
                                // - For percentage_off: 0-100 (e.g., 20 = 20%)
                                // - For fixed_amount_off: amount in CENTS
                                // - For fixed_bundle_price: price in CENTS
}

/**
 * Optional display customization for a rule
 */
export interface PricingRuleDisplay {
  label?: string;               // Custom label for admin UI
  color?: string;               // Badge color (hex or CSS color name)
}

/**
 * Complete pricing rule
 * Combines condition (when) + discount (what)
 */
export interface PricingRule {
  id: string;                   // Unique rule identifier
  condition: PricingRuleCondition;
  discount: PricingRuleDiscount;
  display?: PricingRuleDisplay; // Optional UI customization
}

/**
 * Display settings for pricing UI components
 */
export interface PricingDisplay {
  showFooter: boolean;          // Show discount footer messaging in widget
  showProgressBar: boolean;     // Show progress bar to next discount tier
}

/**
 * Message templates with variable substitution
 *
 * Available variables:
 * - {conditionText}: "2 items" or "₹50"
 * - {discountText}: "20% off" or "₹10 off" or "bundle for ₹100"
 * - {amountNeeded}: "50.00"
 * - {itemsNeeded}: "2"
 * - {currentQuantity}, {targetQuantity}
 * - {currentAmount}, {targetAmount}
 * - {progressPercentage}: "60"
 * - {originalPrice}, {finalPrice}, {savingsAmount}, {savingsPercentage}
 * - {bundleName}, {currencySymbol}, {currencyCode}
 */
export interface PricingMessages {
  progress: string;             // Template when NOT qualified (e.g., "Add {conditionText} to get {discountText}")
  qualified: string;            // Template when qualified (e.g., "Congratulations! You got {discountText}")
  showInCart: boolean;          // Show discount messages in cart
}

/** Per-locale message entry for multilingual discount messaging */
export interface LocalizedMessageEntry {
  progress: string;
  qualified: string;
}

/** New locale-keyed messages format stored in BundlePricing.messages */
export interface LocalizedPricingMessages {
  localized: Record<string, LocalizedMessageEntry>; // e.g., { en: {...}, fr: {...} }
  showInCart: boolean;
}

/** Union: handles legacy flat format and new locale-keyed format */
export type AnyPricingMessages = PricingMessages | LocalizedPricingMessages;

/** Type guard: detect legacy flat format (has top-level `progress` key) */
export function isLegacyMessages(m: AnyPricingMessages): m is PricingMessages {
  return 'progress' in m;
}

/** Normalize either format to locale-keyed format */
export function normalizeMessages(m: AnyPricingMessages | null | undefined): LocalizedPricingMessages {
  if (!m) return { localized: {}, showInCart: true };
  if (isLegacyMessages(m)) {
    return {
      localized: { en: { progress: m.progress, qualified: m.qualified } },
      showInCart: m.showInCart,
    };
  }
  return m;
}

/** Get the message entry for a locale with en fallback chain */
export function getMessageForLocale(
  m: AnyPricingMessages | null | undefined,
  locale: string
): LocalizedMessageEntry {
  const normalized = normalizeMessages(m);
  const subtag = locale.split('-')[0];
  return (
    normalized.localized[subtag] ||
    normalized.localized['en'] ||
    { progress: '', qualified: '' }
  );
}

/**
 * Complete pricing configuration for a bundle
 */
export interface PricingConfiguration {
  enabled: boolean;             // Is pricing/discounts enabled for this bundle
  method: DiscountMethod;       // Discount method (applies to ALL rules)
  rules: PricingRule[];         // Array of pricing rules
  display: PricingDisplay;      // UI display settings
  messages: PricingMessages;    // Message templates
}

/**
 * Validation: Check if a rule is valid
 */
export function validatePricingRule(rule: any): rule is PricingRule {
  if (!rule || typeof rule !== 'object') {
    return false;
  }

  // Check required fields
  if (typeof rule.id !== 'string') {
    return false;
  }

  // Validate condition
  if (!rule.condition || typeof rule.condition !== 'object') {
    return false;
  }

  if (!Object.values(ConditionType).includes(rule.condition.type)) {
    return false;
  }

  if (!Object.values(ConditionOperator).includes(rule.condition.operator)) {
    return false;
  }

  if (typeof rule.condition.value !== 'number' || rule.condition.value < 0) {
    return false;
  }

  // Validate discount
  if (!rule.discount || typeof rule.discount !== 'object') {
    return false;
  }

  if (!Object.values(DiscountMethod).includes(rule.discount.method)) {
    return false;
  }

  if (typeof rule.discount.value !== 'number' || rule.discount.value < 0) {
    return false;
  }

  // Percentage should be 0-100
  if (rule.discount.method === DiscountMethod.PERCENTAGE_OFF && rule.discount.value > 100) {
    return false;
  }

  return true;
}

/**
 * Validation: Check if pricing configuration is valid
 */
export function validatePricingConfiguration(config: any): config is PricingConfiguration {
  if (!config || typeof config !== 'object') {
    return false;
  }

  // Check enabled
  if (typeof config.enabled !== 'boolean') {
    return false;
  }

  // Check method
  if (!Object.values(DiscountMethod).includes(config.method)) {
    return false;
  }

  // Check rules
  if (!Array.isArray(config.rules)) {
    return false;
  }

  if (!config.rules.every(validatePricingRule)) {
    return false;
  }

  // Check display
  if (!config.display || typeof config.display !== 'object') {
    return false;
  }

  if (typeof config.display.showFooter !== 'boolean' ||
      typeof config.display.showProgressBar !== 'boolean') {
    return false;
  }

  // Check messages
  if (!config.messages || typeof config.messages !== 'object') {
    return false;
  }

  if (typeof config.messages.progress !== 'string' ||
      typeof config.messages.qualified !== 'string' ||
      typeof config.messages.showInCart !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Helper: Create empty/default pricing configuration
 */
export function createEmptyPricingConfig(): PricingConfiguration {
  return {
    enabled: false,
    method: DiscountMethod.PERCENTAGE_OFF,
    rules: [],
    display: {
      showFooter: true,
      showProgressBar: false
    },
    messages: {
      progress: "Add {conditionText} to get {discountText}",
      qualified: "Congratulations! You got {discountText}",
      showInCart: true
    }
  };
}

/**
 * Helper: Create new pricing rule with defaults
 */
export function createNewPricingRule(method: DiscountMethod): PricingRule {
  return {
    id: `rule-${Date.now()}`,
    condition: {
      type: ConditionType.QUANTITY,
      operator: ConditionOperator.GTE,
      value: 0
    },
    discount: {
      method,
      value: 0
    }
  };
}

/**
 * Helper: Get human-readable operator text
 */
export function getOperatorText(operator: ConditionOperator): string {
  const operatorMap: Record<ConditionOperator, string> = {
    [ConditionOperator.GTE]: 'at least (≥)',
    [ConditionOperator.GT]: 'more than (>)',
    [ConditionOperator.LTE]: 'at most (≤)',
    [ConditionOperator.LT]: 'less than (<)',
    [ConditionOperator.EQ]: 'exactly (=)'
  };

  return operatorMap[operator] || operator;
}

/**
 * Helper: Get human-readable discount method text
 */
export function getDiscountMethodText(method: DiscountMethod): string {
  const methodMap: Record<DiscountMethod, string> = {
    [DiscountMethod.PERCENTAGE_OFF]: 'Percentage Off',
    [DiscountMethod.FIXED_AMOUNT_OFF]: 'Fixed Amount Off',
    [DiscountMethod.FIXED_BUNDLE_PRICE]: 'Fixed Bundle Price'
  };

  return methodMap[method] || method;
}

/**
 * Helper: Generate human-readable preview of a pricing rule
 * Example: "When customer has at least 3 items, apply 20% off"
 */
export function generateRulePreview(
  rule: PricingRule,
  currencySymbol: string = '₹'
): string {
  // Condition text
  const conditionValue = rule.condition.type === ConditionType.QUANTITY
    ? `${rule.condition.value} items`
    : `${currencySymbol}${(rule.condition.value / 100).toFixed(2)}`;

  const operatorText = getOperatorText(rule.condition.operator);

  // Discount text
  let discountText: string;
  if (rule.discount.method === DiscountMethod.PERCENTAGE_OFF) {
    discountText = `${rule.discount.value}% off`;
  } else if (rule.discount.method === DiscountMethod.FIXED_AMOUNT_OFF) {
    discountText = `${currencySymbol}${(rule.discount.value / 100).toFixed(2)} off`;
  } else {
    discountText = `bundle for ${currencySymbol}${(rule.discount.value / 100).toFixed(2)}`;
  }

  return `When customer has ${operatorText} ${conditionValue}, apply ${discountText}`;
}

/**
 * Helper: Convert cents to display amount
 */
export function centsToAmount(cents: number): number {
  return cents / 100;
}

/**
 * Helper: Convert display amount to cents
 */
export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}
