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
 * - Flat rule shape (no nested condition/discount objects)
 * - Type-safe with validation
 * - Always use smallest units (cents for money, count for items)
 */

/**
 * Discount method types
 */
export enum DiscountMethod {
  PERCENTAGE_OFF = 'percentage_off',        // e.g., 20% off
  FIXED_AMOUNT_OFF = 'fixed_amount_off',    // e.g., ₹100 off
  FIXED_BUNDLE_PRICE = 'fixed_bundle_price', // e.g., Bundle for ₹500
  BUY_X_GET_Y = 'buy_x_get_y'             // e.g., Buy 2 get 1 free
}

/**
 * Condition types - what triggers the discount
 */
export enum ConditionType {
  QUANTITY = 'quantity',  // Based on number of items (e.g., >= 3 items)
  AMOUNT = 'amount'       // Based on cart subtotal (e.g., >= ₹500)
}

/**
 * Condition operators — used for step setup UI only (not pricing rules).
 * Pricing rules always use implicit ≥ (greater than or equal).
 */
export enum ConditionOperator {
  GTE = 'gte',  // Greater than or equal (≥)
  GT = 'gt',    // Greater than (>)
  LTE = 'lte',  // Less than or equal (≤)
  LT = 'lt',    // Less than (<)
  EQ = 'eq'     // Equal (=)
}

/**
 * Flat pricing rule — condition and discount fields are top-level.
 * discountMethod lives on PricingConfiguration and applies to all rules.
 */
export interface PricingRule {
  id: string;
  // Condition (flat)
  conditionType: 'quantity' | 'amount';  // Trigger type
  conditionValue: number;                  // Threshold: qty count or amount in CENTS
  // Discount (flat)
  discountValue: number;                   // % (0-100), cents for fixed, cents for bundle price
  // BXY-specific (only present when PricingConfiguration.method === BUY_X_GET_Y)
  customerBuys?: number;                   // Minimum cart qty to trigger offer
  customerGets?: number;                   // Qty of items receiving the discount
  bxyDiscountType?: 'percentage' | 'fixed_amount';  // % off or ₹ off
  bxyApplyMode?: 'lowest_priced' | 'latest_added';  // Which items get the discount
}

/**
 * Display settings for pricing UI components
 */
export interface PricingDisplay {
  showFooter: boolean;          // Show discount footer messaging in widget
  showDiscountProgressBar: boolean; // Show visual fill-bar progress toward next discount tier
}

export type PricingProgressBarType = 'simple' | 'step_based';

export interface BundleQuantityOptionDisplay {
  label: string;
  subtext: string;
}

export interface BundleQuantityOptionsDisplay {
  enabled: boolean;
  defaultRuleId: string | null;
  optionsByRuleId: Record<string, BundleQuantityOptionDisplay>;
  optionsByLocaleByRuleId: Record<string, Record<string, BundleQuantityOptionDisplay>>;
}

export interface PricingProgressBarDisplayOptions {
  enabled: boolean;
  type: PricingProgressBarType;
  progressText: string;
  successText: string;
}

export interface PricingDisplayOptions {
  bundleQuantityOptions: BundleQuantityOptionsDisplay;
  progressBar: PricingProgressBarDisplayOptions;
}

/**
 * Per-rule tier text for Progress Bar Step-Based display.
 */
export interface PricingRuleTierText {
  tierText: string;     // e.g. "Add 3"
  tierSubtext: string;  // e.g. "1 Product(s) @ 100% off"
}

/**
 * Message templates with variable substitution
 *
 * Available variables:
 * - {{conditionText}}: "2 items" or "₹50"
 * - {{discountText}}: "20% off" or "₹10 off" or "bundle for ₹100"
 * - {{discountConditionDiff}}: remaining qty/amount to unlock discount
 * - {{discountValue}}: numerical discount reward value
 * - {{discountValueUnit}}: symbol for discount reward (% or currency)
 * - {{discountUnit}}: currency symbol for amount-based rules
 * - {{discountedItems}}: qty of items discounted/free in BXY
 */
export interface PricingMessages {
  progress: string;              // Template when NOT qualified
  qualified: string;             // Template when qualified
  showInCart: boolean;           // Show discount messages in cart
  // Progress Bar Step-Based: per-rule tier labels (merchant-editable)
  tierTextByRuleId?: Record<string, PricingRuleTierText>;
  // Progress Bar Multi Language: per-locale per-rule tier labels
  tierTextByLocaleByRuleId?: Record<string, Record<string, PricingRuleTierText>>;
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
 * Validation: Check if a rule is valid (flat shape)
 */
export function validatePricingRule(rule: any): rule is PricingRule {
  if (!rule || typeof rule !== 'object') {
    return false;
  }

  if (typeof rule.id !== 'string') {
    return false;
  }

  if (rule.conditionType !== 'quantity' && rule.conditionType !== 'amount') {
    return false;
  }

  const condVal = Number(rule.conditionValue);
  if (!isFinite(condVal) || condVal < 0) {
    return false;
  }

  const discVal = Number(rule.discountValue);
  if (!isFinite(discVal) || discVal < 0) {
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

  if (typeof config.display.showFooter !== 'boolean') {
    return false;
  }

  if (typeof config.display.showDiscountProgressBar !== 'boolean') {
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
      showDiscountProgressBar: false,
    },
    messages: {
      progress: "Add {conditionText} to get {discountText}",
      qualified: "Congratulations! You got {discountText}",
      showInCart: true
    }
  };
}

/**
 * Helper: Create new pricing rule with defaults (flat shape)
 */
export function createNewPricingRule(method: DiscountMethod): PricingRule {
  const base: PricingRule = {
    id: `rule-${Date.now()}`,
    conditionType: 'quantity',
    conditionValue: 2,
    discountValue: method === DiscountMethod.PERCENTAGE_OFF ? 5 : 500,
  };
  if (method === DiscountMethod.BUY_X_GET_Y) {
    return {
      ...base,
      discountValue: 100,
      customerBuys: 2,
      customerGets: 1,
      bxyDiscountType: 'percentage',
      bxyApplyMode: 'lowest_priced',
    };
  }
  return base;
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
    [DiscountMethod.FIXED_BUNDLE_PRICE]: 'Fixed Bundle Price',
    [DiscountMethod.BUY_X_GET_Y]: 'Buy X, Get Y'
  };

  return methodMap[method] || method;
}

/**
 * Helper: Generate human-readable preview of a pricing rule (flat shape)
 */
export function generateRulePreview(
  rule: PricingRule,
  method: DiscountMethod,
  currencySymbol: string = '₹'
): string {
  const conditionText = rule.conditionType === 'quantity'
    ? `${rule.conditionValue} items`
    : `${currencySymbol}${(rule.conditionValue / 100).toFixed(2)}`;

  let discountText: string;
  if (method === DiscountMethod.PERCENTAGE_OFF) {
    discountText = `${rule.discountValue}% off`;
  } else if (method === DiscountMethod.FIXED_AMOUNT_OFF) {
    discountText = `${currencySymbol}${(rule.discountValue / 100).toFixed(2)} off`;
  } else if (method === DiscountMethod.BUY_X_GET_Y) {
    discountText = `buy ${rule.customerBuys ?? rule.conditionValue} get ${rule.customerGets ?? 1} free`;
  } else {
    discountText = `bundle for ${currencySymbol}${(rule.discountValue / 100).toFixed(2)}`;
  }

  return `When customer has at least ${conditionText}, apply ${discountText}`;
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
