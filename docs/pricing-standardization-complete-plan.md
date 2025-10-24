# Complete Pricing Rules Standardization Plan

## Executive Summary

This document outlines a comprehensive plan to standardize pricing rules across the entire application - from Admin UI to Database to Metafields to Widget UI to Cart Transform. The goal is **ONE canonical structure, ZERO transformations, NO ambiguity**.

---

## Current State Analysis

### 1. Current Problems

#### A. Multiple Field Names for Same Data
| Purpose | Current Field Names (Pick One!) | Confusion Level |
|---------|--------------------------------|-----------------|
| Threshold Value | `value`, `minimumQuantity`, `numberOfProducts` | HIGH |
| Discount Value | `discountValue`, `percentageOff`, `fixedAmountOff`, `fixedBundlePrice`, `price` | CRITICAL |
| Condition Type | `type`, `conditionType` | MEDIUM |
| Condition Operator | `condition` (long: `greater_than_equal_to`), `conditionOperator` (short: `gte`) | MEDIUM |

#### B. Data Flow Transforms

```
Admin Form State
  ↓ (Transform #1)
Database JSON
  ↓ (Transform #2)
Metafield JSON
  ↓ (Transform #3 - Widget)
Widget Internal State
  ↓ (Transform #4 - Display)
UI Variables

  ↓ (Transform #5 - Cart Transform)
Cart Transform State
```

**5 TRANSFORMATIONS = 5 PLACES FOR BUGS**

#### C. Current Widget Consumption Pattern

**Step 1: Rule Data Extraction** (lines 835-845)
```javascript
// Current messy extraction
const conditionType = ruleToUse.conditionType;         // Could be undefined
const targetValue = ruleToUse.value;                   // Or minimumQuantity? Or numberOfProducts?
const discountMethod = bundle.pricing?.method;         // At bundle level, not rule level

let rawDiscountValue = 0;
if (discountMethod === 'fixed_bundle_price') {
  rawDiscountValue = ruleToUse.fixedBundlePrice;      // One field name
} else {
  rawDiscountValue = ruleToUse.discountValue;         // Different field name
}
```

**Step 2: Condition Data Calculation** (lines 910-945)
```javascript
// Widget calculates what to display based on condition type
if (conditionType === 'amount') {
  // Amount-based: "Add ₹50 to get 20% off"
  amountNeeded = targetValue - totalPrice;
  conditionText = `₹${amountNeeded}`;
} else if (conditionType === 'quantity') {
  // Quantity-based: "Add 2 items to get 20% off"
  itemsNeeded = targetValue - totalQuantity;
  conditionText = `${itemsNeeded} items`;
}
```

**Step 3: Discount Data Calculation** (lines 963-1012)
```javascript
// Widget calculates what discount looks like
if (discountMethod === 'percentage_off') {
  discountText = `${rawDiscountValue}% off`;
} else if (discountMethod === 'fixed_amount_off') {
  discountText = `₹${rawDiscountValue / 100} off`;
} else if (discountMethod === 'fixed_bundle_price') {
  discountText = `bundle for ₹${rawDiscountValue / 100}`;
}
```

**Step 4: Variable Creation for Templates** (lines 864-898)
```javascript
// Creates variables like:
{
  conditionText: "2 items" or "₹50",
  discountText: "20% off" or "₹10 off" or "bundle for ₹100",
  amountNeeded: "50.00",
  itemsNeeded: "2",
  currentQuantity: "3",
  targetQuantity: "5",
  progressPercentage: "60"
}
```

**Step 5: Template Rendering** (lines 1230-1250)
```javascript
// Templates use variables:
template = "Add {conditionText} to get {discountText}"
// Becomes: "Add 2 items to get 20% off"
// Or: "Add ₹50 to get bundle for ₹100"
```

#### D. Current Display Messages

**Progress Message** (when not qualified):
```
"Add {conditionText} to get {discountText}"
// Example: "Add 2 items to get 20% off"
// Example: "Add ₹50 to get ₹10 off"
```

**Success Message** (when qualified):
```
"Congratulations! You got {discountText}"
// Example: "Congratulations! You got 20% off"
// Example: "Congratulations! You got bundle for ₹100"
```

**Footer Display**:
- Progress bar showing `{currentQuantity}/{targetQuantity}` or amount progress
- Message text with substituted variables
- Color changes based on qualification status

---

## Proposed Standard Structure

### Core Principle
**Every component uses the EXACT SAME structure - no ifs, no buts, no fallbacks**

### 1. TypeScript Type Definitions

**File: `app/types/pricing.ts` (NEW)**

```typescript
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
  QUANTITY = 'quantity',  // Based on number of items (e.g., 3 items)
  AMOUNT = 'amount'       // Based on cart subtotal (e.g., ₹500)
}

/**
 * Condition operators - how to compare
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
 */
export interface PricingRuleCondition {
  type: ConditionType;          // 'quantity' or 'amount'
  operator: ConditionOperator;  // 'gte', 'gt', 'lte', 'lt', 'eq'
  value: number;                // Threshold (items count OR amount in CENTS)
}

/**
 * Discount configuration for a pricing rule
 */
export interface PricingRuleDiscount {
  method: DiscountMethod;       // Must match parent pricing method
  value: number;                // Discount value (percentage 0-100 OR amount in CENTS)
}

/**
 * Complete pricing rule
 */
export interface PricingRule {
  id: string;                   // Unique rule ID
  condition: PricingRuleCondition;
  discount: PricingRuleDiscount;
  display?: {                   // Optional UI customization
    label?: string;             // Custom label
    color?: string;             // Badge color
  };
}

/**
 * Display settings for pricing UI
 */
export interface PricingDisplay {
  showFooter: boolean;          // Show discount footer messaging
  showProgressBar: boolean;     // Show progress to next discount tier
}

/**
 * Message templates (support variable substitution)
 */
export interface PricingMessages {
  progress: string;             // Template: "Add {conditionText} to get {discountText}"
  qualified: string;            // Template: "Congratulations! You got {discountText}"
  showInCart: boolean;          // Show discount messages in cart
}

/**
 * Complete pricing configuration
 */
export interface PricingConfiguration {
  enabled: boolean;             // Is pricing/discounts enabled
  method: DiscountMethod;       // Discount method (applies to ALL rules)
  rules: PricingRule[];         // Array of pricing rules
  display: PricingDisplay;      // UI display settings
  messages: PricingMessages;    // Message templates
}

/**
 * Validation functions
 */
export function validatePricingRule(rule: any): rule is PricingRule {
  return (
    rule &&
    typeof rule === 'object' &&
    typeof rule.id === 'string' &&
    rule.condition &&
    Object.values(ConditionType).includes(rule.condition.type) &&
    Object.values(ConditionOperator).includes(rule.condition.operator) &&
    typeof rule.condition.value === 'number' &&
    rule.discount &&
    Object.values(DiscountMethod).includes(rule.discount.method) &&
    typeof rule.discount.value === 'number'
  );
}

export function validatePricingConfiguration(config: any): config is PricingConfiguration {
  return (
    config &&
    typeof config === 'object' &&
    typeof config.enabled === 'boolean' &&
    Object.values(DiscountMethod).includes(config.method) &&
    Array.isArray(config.rules) &&
    config.rules.every(validatePricingRule) &&
    config.display &&
    typeof config.display.showFooter === 'boolean' &&
    typeof config.display.showProgressBar === 'boolean' &&
    config.messages &&
    typeof config.messages.progress === 'string' &&
    typeof config.messages.qualified === 'string' &&
    typeof config.messages.showInCart === 'boolean'
  );
}

/**
 * Helper to create empty pricing config
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
 * Helper to create new rule
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
```

---

### 2. Database Schema

**File: `prisma/schema.prisma`**

```prisma
model BundlePricing {
  id             String             @id @default(uuid())
  bundleId       String             @unique
  bundle         Bundle             @relation(fields: [bundleId], references: [id], onDelete: Cascade)

  // Core pricing
  enabled        Boolean            @default(false)
  method         DiscountMethodType @default(percentage_off)
  rules          Json               @default("[]")  // PricingRule[]

  // Display settings
  showFooter     Boolean            @default(true)
  showProgressBar Boolean           @default(false)

  // Message templates
  messages       Json               @default("{\"progress\":\"Add {conditionText} to get {discountText}\",\"qualified\":\"Congratulations! You got {discountText}\",\"showInCart\":true}")

  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  @@index([bundleId])
}

enum DiscountMethodType {
  percentage_off
  fixed_amount_off
  fixed_bundle_price
}
```

---

### 3. Admin Form Implementation

**File: `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx`**

#### State Management
```typescript
import {
  PricingConfiguration,
  PricingRule,
  DiscountMethod,
  ConditionType,
  ConditionOperator,
  createEmptyPricingConfig,
  createNewPricingRule,
  validatePricingConfiguration
} from '~/types/pricing';

// Single state for pricing - no separate discount states
const [pricingConfig, setPricingConfig] = useState<PricingConfiguration>(
  bundle.pricing
    ? {
        enabled: bundle.pricing.enabled,
        method: bundle.pricing.method,
        rules: bundle.pricing.rules,
        display: bundle.pricing.display,
        messages: bundle.pricing.messages
      }
    : createEmptyPricingConfig()
);

// Rule management
const addPricingRule = () => {
  const newRule = createNewPricingRule(pricingConfig.method);
  setPricingConfig(prev => ({
    ...prev,
    rules: [...prev.rules, newRule]
  }));
};

const updatePricingRule = (ruleId: string, updates: Partial<PricingRule>) => {
  setPricingConfig(prev => ({
    ...prev,
    rules: prev.rules.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    )
  }));
};

const deletePricingRule = (ruleId: string) => {
  setPricingConfig(prev => ({
    ...prev,
    rules: prev.rules.filter(rule => rule.id !== ruleId)
  }));
};
```

#### UI Components
```tsx
<BlockStack gap="400">
  {/* Enable Discount Toggle */}
  <InlineStack align="space-between">
    <Text variant="headingMd">Discount Configuration</Text>
    <Checkbox
      label="Enable Discount"
      checked={pricingConfig.enabled}
      onChange={(checked) => setPricingConfig(prev => ({ ...prev, enabled: checked }))}
    />
  </InlineStack>

  {pricingConfig.enabled && (
    <>
      {/* Discount Method Selector */}
      <Select
        label="Discount Method"
        helpText="This applies to all rules below"
        options={[
          { label: 'Percentage Off (e.g., 20% off)', value: DiscountMethod.PERCENTAGE_OFF },
          { label: 'Fixed Amount Off (e.g., ₹100 off)', value: DiscountMethod.FIXED_AMOUNT_OFF },
          { label: 'Fixed Bundle Price (e.g., Bundle for ₹500)', value: DiscountMethod.FIXED_BUNDLE_PRICE }
        ]}
        value={pricingConfig.method}
        onChange={(value) => {
          const newMethod = value as DiscountMethod;
          setPricingConfig(prev => ({
            ...prev,
            method: newMethod,
            // Update all rules to use new method
            rules: prev.rules.map(rule => ({
              ...rule,
              discount: { ...rule.discount, method: newMethod }
            }))
          }));
        }}
      />

      {/* Pricing Rules */}
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text variant="headingMd">Pricing Rules</Text>
            <Button onClick={addPricingRule}>Add Rule</Button>
          </InlineStack>

          {pricingConfig.rules.map((rule, index) => (
            <Card key={rule.id}>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text variant="headingSm">Rule {index + 1}</Text>
                  <Button
                    variant="plain"
                    tone="critical"
                    onClick={() => deletePricingRule(rule.id)}
                  >
                    Delete
                  </Button>
                </InlineStack>

                <InlineGrid columns={2} gap="400">
                  {/* Condition Type */}
                  <Select
                    label="When customer has"
                    options={[
                      { label: 'Quantity (items)', value: ConditionType.QUANTITY },
                      { label: 'Amount (₹)', value: ConditionType.AMOUNT }
                    ]}
                    value={rule.condition.type}
                    onChange={(value) =>
                      updatePricingRule(rule.id, {
                        condition: { ...rule.condition, type: value as ConditionType }
                      })
                    }
                  />

                  {/* Condition Operator */}
                  <Select
                    label="Condition"
                    options={[
                      { label: 'At least (≥)', value: ConditionOperator.GTE },
                      { label: 'More than (>)', value: ConditionOperator.GT },
                      { label: 'At most (≤)', value: ConditionOperator.LTE },
                      { label: 'Less than (<)', value: ConditionOperator.LT },
                      { label: 'Exactly (=)', value: ConditionOperator.EQ }
                    ]}
                    value={rule.condition.operator}
                    onChange={(value) =>
                      updatePricingRule(rule.id, {
                        condition: { ...rule.condition, operator: value as ConditionOperator }
                      })
                    }
                  />
                </InlineGrid>

                <InlineGrid columns={2} gap="400">
                  {/* Threshold Value */}
                  <TextField
                    label={
                      rule.condition.type === ConditionType.QUANTITY
                        ? "Quantity (items)"
                        : "Amount (₹)"
                    }
                    type="number"
                    min="0"
                    value={String(
                      rule.condition.type === ConditionType.AMOUNT
                        ? rule.condition.value / 100  // Convert cents to rupees for display
                        : rule.condition.value
                    )}
                    onChange={(value) => {
                      const numValue = parseFloat(value) || 0;
                      const valueInCents =
                        rule.condition.type === ConditionType.AMOUNT
                          ? Math.round(numValue * 100)  // Convert rupees to cents for storage
                          : numValue;
                      updatePricingRule(rule.id, {
                        condition: { ...rule.condition, value: valueInCents }
                      });
                    }}
                    suffix={rule.condition.type === ConditionType.AMOUNT ? "₹" : "items"}
                  />

                  {/* Discount Value */}
                  <TextField
                    label={
                      pricingConfig.method === DiscountMethod.PERCENTAGE_OFF
                        ? "Discount Percentage"
                        : pricingConfig.method === DiscountMethod.FIXED_AMOUNT_OFF
                        ? "Discount Amount (₹)"
                        : "Fixed Bundle Price (₹)"
                    }
                    type="number"
                    min="0"
                    max={pricingConfig.method === DiscountMethod.PERCENTAGE_OFF ? "100" : undefined}
                    value={String(
                      pricingConfig.method === DiscountMethod.PERCENTAGE_OFF
                        ? rule.discount.value  // Percentage stays as-is
                        : rule.discount.value / 100  // Convert cents to rupees for display
                    )}
                    onChange={(value) => {
                      const numValue = parseFloat(value) || 0;
                      const valueInCents =
                        pricingConfig.method === DiscountMethod.PERCENTAGE_OFF
                          ? numValue  // Store percentage as-is
                          : Math.round(numValue * 100);  // Convert rupees to cents for storage
                      updatePricingRule(rule.id, {
                        discount: { ...rule.discount, value: valueInCents }
                      });
                    }}
                    suffix={
                      pricingConfig.method === DiscountMethod.PERCENTAGE_OFF ? "%" : "₹"
                    }
                  />
                </InlineGrid>

                {/* Rule Preview */}
                <Banner>
                  <Text variant="bodySm" as="p">
                    <strong>Preview:</strong> {generateRulePreview(rule, pricingConfig.method)}
                  </Text>
                </Banner>
              </BlockStack>
            </Card>
          ))}
        </BlockStack>
      </Card>

      {/* Display Settings */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd">Display Settings</Text>

          <Checkbox
            label="Show discount messaging in footer"
            checked={pricingConfig.display.showFooter}
            onChange={(checked) =>
              setPricingConfig(prev => ({
                ...prev,
                display: { ...prev.display, showFooter: checked }
              }))
            }
          />

          <Checkbox
            label="Show progress bar"
            checked={pricingConfig.display.showProgressBar}
            onChange={(checked) =>
              setPricingConfig(prev => ({
                ...prev,
                display: { ...prev.display, showProgressBar: checked }
              }))
            }
          />
        </BlockStack>
      </Card>

      {/* Message Templates */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd">Message Templates</Text>

          <TextField
            label="Progress Message"
            helpText="Available variables: {conditionText}, {discountText}, {amountNeeded}, {itemsNeeded}"
            value={pricingConfig.messages.progress}
            onChange={(value) =>
              setPricingConfig(prev => ({
                ...prev,
                messages: { ...prev.messages, progress: value }
              }))
            }
            placeholder="Add {conditionText} to get {discountText}"
          />

          <TextField
            label="Success Message"
            helpText="Available variables: {discountText}, {savingsAmount}, {savingsPercentage}"
            value={pricingConfig.messages.qualified}
            onChange={(value) =>
              setPricingConfig(prev => ({
                ...prev,
                messages: { ...prev.messages, qualified: value }
              }))
            }
            placeholder="Congratulations! You got {discountText}"
          />

          <Checkbox
            label="Show discount messages in cart"
            checked={pricingConfig.messages.showInCart}
            onChange={(checked) =>
              setPricingConfig(prev => ({
                ...prev,
                messages: { ...prev.messages, showInCart: checked }
              }))
            }
          />
        </BlockStack>
      </Card>
    </>
  )}
</BlockStack>

// Helper function for rule preview
function generateRulePreview(rule: PricingRule, method: DiscountMethod): string {
  const conditionText =
    rule.condition.type === ConditionType.QUANTITY
      ? `${rule.condition.value} items`
      : `₹${(rule.condition.value / 100).toFixed(2)}`;

  const operatorText = {
    [ConditionOperator.GTE]: 'at least',
    [ConditionOperator.GT]: 'more than',
    [ConditionOperator.LTE]: 'at most',
    [ConditionOperator.LT]: 'less than',
    [ConditionOperator.EQ]: 'exactly'
  }[rule.condition.operator];

  const discountText =
    method === DiscountMethod.PERCENTAGE_OFF
      ? `${rule.discount.value}% off`
      : method === DiscountMethod.FIXED_AMOUNT_OFF
      ? `₹${(rule.discount.value / 100).toFixed(2)} off`
      : `bundle for ₹${(rule.discount.value / 100).toFixed(2)}`;

  return `When customer has ${operatorText} ${conditionText}, apply ${discountText}`;
}
```

#### Form Submission
```typescript
// In the form submit handler
const formSubmit = useCallback(async () => {
  // Validate pricing config
  if (pricingConfig.enabled && !validatePricingConfiguration(pricingConfig)) {
    shopify.toast.show("Invalid pricing configuration", { isError: true });
    return;
  }

  const formData = new FormData();
  formData.append("bundleName", bundleName);
  formData.append("bundleDescription", bundleDescription);
  formData.append("bundleStatus", bundleStatus);
  formData.append("templateName", templateName);
  formData.append("stepsData", JSON.stringify(steps));

  // Add pricing config as-is - NO TRANSFORMATION
  formData.append("pricingData", JSON.stringify(pricingConfig));

  // ... other form data

  submit(formData, { method: "post" });
}, [pricingConfig, /* other dependencies */]);
```

---

### 4. Database Save (Action Function)

**File: `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx`**

```typescript
export async function action({ request, params }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();

  // Parse pricing data - NO TRANSFORMATION
  const pricingData = JSON.parse(formData.get("pricingData") as string);

  // Validate
  if (!validatePricingConfiguration(pricingData)) {
    return json({ error: "Invalid pricing configuration" }, { status: 400 });
  }

  // Save to database - EXACT SAME STRUCTURE
  await prisma.bundlePricing.upsert({
    where: { bundleId: bundle.id },
    create: {
      bundleId: bundle.id,
      enabled: pricingData.enabled,
      method: pricingData.method,
      rules: pricingData.rules,           // Store as-is
      showFooter: pricingData.display.showFooter,
      showProgressBar: pricingData.display.showProgressBar,
      messages: pricingData.messages      // Store as-is
    },
    update: {
      enabled: pricingData.enabled,
      method: pricingData.method,
      rules: pricingData.rules,           // Store as-is
      showFooter: pricingData.display.showFooter,
      showProgressBar: pricingData.display.showProgressBar,
      messages: pricingData.messages      // Store as-is
    }
  });

  // Update metafield - EXACT SAME STRUCTURE
  const baseConfiguration = {
    id: updatedBundle.id,
    name: updatedBundle.name,
    description: updatedBundle.description,
    status: updatedBundle.status,
    bundleType: updatedBundle.bundleType,
    steps: optimizedSteps,

    // Pricing - NO TRANSFORMATION
    pricing: pricingData,

    bundleParentVariantId: bundleParentVariantId,
    shopifyProductId: updatedBundle.shopifyProductId,
    updatedAt: new Date().toISOString()
  };

  await BundleIsolationService.updateBundleProductMetafield(
    admin,
    updatedBundle.shopifyProductId,
    baseConfiguration
  );

  return json({ success: true });
}
```

---

### 5. Widget Updates

**File: `app/assets/bundle-widget-full.js`**

#### Constants Update
```javascript
const BUNDLE_WIDGET = {
  // ... other constants

  DISCOUNT_METHODS: {
    PERCENTAGE_OFF: 'percentage_off',
    FIXED_AMOUNT_OFF: 'fixed_amount_off',
    FIXED_BUNDLE_PRICE: 'fixed_bundle_price'
  },

  CONDITION_TYPES: {
    QUANTITY: 'quantity',
    AMOUNT: 'amount'
  },

  CONDITION_OPERATORS: {
    GTE: 'gte',
    GT: 'gt',
    LTE: 'lte',
    LT: 'lt',
    EQ: 'eq'
  }
};
```

#### Discount Calculation (SIMPLIFIED)
```javascript
class PricingCalculator {
  static calculateDiscount(bundle, totalPrice, totalQuantity) {
    // Check if pricing is enabled
    if (!bundle?.pricing?.enabled || !bundle.pricing.rules?.length) {
      return {
        hasDiscount: false,
        discountAmount: 0,
        finalPrice: totalPrice,
        discountPercentage: 0,
        qualifiesForDiscount: false,
        applicableRule: null
      };
    }

    const pricing = bundle.pricing;
    let bestRule = null;

    // Find the best applicable rule
    for (const rule of pricing.rules) {
      if (this.evaluateRule(rule, totalPrice, totalQuantity)) {
        // Select rule with highest threshold (usually means better discount)
        if (!bestRule || rule.condition.value > bestRule.condition.value) {
          bestRule = rule;
        }
      }
    }

    // No applicable rule
    if (!bestRule) {
      return {
        hasDiscount: false,
        discountAmount: 0,
        finalPrice: totalPrice,
        discountPercentage: 0,
        qualifiesForDiscount: false,
        applicableRule: null
      };
    }

    // Calculate discount based on method
    let discountAmount = 0;
    let discountPercentage = 0;

    switch (pricing.method) {
      case BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF:
        discountPercentage = bestRule.discount.value;
        discountAmount = (totalPrice * discountPercentage) / 100;
        break;

      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF:
        discountAmount = bestRule.discount.value;
        discountPercentage = totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0;
        break;

      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE:
        const fixedPrice = bestRule.discount.value;
        discountAmount = totalPrice > fixedPrice ? totalPrice - fixedPrice : 0;
        discountPercentage = totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0;
        break;

      default:
        BundleLogger.warn('PRICING', 'Unknown discount method', { method: pricing.method });
    }

    return {
      hasDiscount: true,
      discountAmount,
      finalPrice: totalPrice - discountAmount,
      discountPercentage,
      qualifiesForDiscount: true,
      applicableRule: bestRule
    };
  }

  /**
   * Evaluate if a rule applies given current totals
   */
  static evaluateRule(rule, totalPrice, totalQuantity) {
    const condition = rule.condition;
    const currentValue = condition.type === BUNDLE_WIDGET.CONDITION_TYPES.AMOUNT
      ? totalPrice
      : totalQuantity;

    switch (condition.operator) {
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GTE:
        return currentValue >= condition.value;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GT:
        return currentValue > condition.value;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LTE:
        return currentValue <= condition.value;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LT:
        return currentValue < condition.value;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.EQ:
        return currentValue === condition.value;
      default:
        return false;
    }
  }

  /**
   * Get next discount rule (for progress display)
   */
  static getNextDiscountRule(bundle, currentQuantity, currentAmount) {
    if (!bundle?.pricing?.enabled || !bundle.pricing.rules?.length) {
      return null;
    }

    const pricing = bundle.pricing;

    // Filter rules that are NOT yet met
    const unmetRules = pricing.rules.filter(rule => {
      return !this.evaluateRule(rule, currentAmount, currentQuantity);
    });

    if (unmetRules.length === 0) {
      return null; // All rules met
    }

    // Sort by threshold ascending (closest goal first)
    unmetRules.sort((a, b) => a.condition.value - b.condition.value);

    return unmetRules[0];
  }
}
```

#### Variable Creation (SIMPLIFIED)
```javascript
class TemplateManager {
  static createDiscountVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const nextRule = PricingCalculator.getNextDiscountRule(bundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;

    if (!ruleToUse) {
      return this.createEmptyVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo);
    }

    // Extract data from rule - CLEAN STRUCTURE
    const condition = ruleToUse.condition;
    const discount = ruleToUse.discount;
    const pricing = bundle.pricing;

    // Calculate condition-specific values
    const conditionData = this.calculateConditionData(
      condition,
      totalPrice,
      totalQuantity,
      currencyInfo
    );

    // Calculate discount-specific values
    const discountData = this.calculateDiscountData(
      discount,
      pricing.method,
      currencyInfo
    );

    // Calculate progress
    const currentProgress = condition.type === BUNDLE_WIDGET.CONDITION_TYPES.AMOUNT
      ? totalPrice
      : totalQuantity;
    const progressPercentage = condition.value > 0
      ? Math.min(100, (currentProgress / condition.value) * 100)
      : 0;

    // Return template variables
    return {
      // Condition-specific
      conditionText: conditionData.conditionText,
      amountNeeded: conditionData.amountNeeded,
      itemsNeeded: conditionData.itemsNeeded,
      alreadyQualified: conditionData.alreadyQualified,

      // Discount-specific
      discountText: discountData.discountText,

      // Progress
      currentQuantity: totalQuantity.toString(),
      currentAmount: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      targetQuantity: condition.type === BUNDLE_WIDGET.CONDITION_TYPES.QUANTITY
        ? condition.value.toString()
        : '0',
      targetAmount: condition.type === BUNDLE_WIDGET.CONDITION_TYPES.AMOUNT
        ? CurrencyManager.formatMoney(condition.value, currencyInfo.display.format)
        : '0',
      progressPercentage: Math.round(progressPercentage).toString(),

      // Pricing info
      originalPrice: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      finalPrice: CurrencyManager.formatMoney(discountInfo.finalPrice, currencyInfo.display.format),
      savingsAmount: CurrencyManager.formatMoney(discountInfo.discountAmount, currencyInfo.display.format),
      savingsPercentage: Math.round(discountInfo.discountPercentage).toString(),

      // Metadata
      bundleName: bundle.name || 'Bundle',
      currencySymbol: currencyInfo.display.symbol,
      currencyCode: currencyInfo.display.code,
      isQualified: discountInfo.qualifiesForDiscount ? 'true' : 'false'
    };
  }

  /**
   * Calculate condition display data
   */
  static calculateConditionData(condition, totalPrice, totalQuantity, currencyInfo) {
    if (condition.type === BUNDLE_WIDGET.CONDITION_TYPES.AMOUNT) {
      // Amount-based condition
      const amountNeeded = Math.max(0, condition.value - totalPrice);
      const convertedAmountNeeded = CurrencyManager.convertCurrency(
        amountNeeded,
        currencyInfo.calculation.code,
        currencyInfo.display.code,
        currencyInfo.display.rate
      );
      const amountNeededFormatted = (convertedAmountNeeded / 100).toFixed(2);

      return {
        conditionText: `${currencyInfo.display.symbol}${amountNeededFormatted}`,
        amountNeeded: amountNeededFormatted,
        itemsNeeded: '0',
        alreadyQualified: amountNeeded <= 0
      };
    } else {
      // Quantity-based condition
      const itemsNeeded = Math.max(0, condition.value - totalQuantity);

      return {
        conditionText: `${itemsNeeded} ${itemsNeeded === 1 ? 'item' : 'items'}`,
        amountNeeded: '0',
        itemsNeeded: itemsNeeded.toString(),
        alreadyQualified: itemsNeeded <= 0
      };
    }
  }

  /**
   * Calculate discount display data
   */
  static calculateDiscountData(discount, method, currencyInfo) {
    switch (method) {
      case BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF:
        return {
          discountText: `${discount.value}% off`
        };

      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF: {
        const convertedAmount = CurrencyManager.convertCurrency(
          discount.value,
          currencyInfo.calculation.code,
          currencyInfo.display.code,
          currencyInfo.display.rate
        );
        const amountFormatted = (convertedAmount / 100).toFixed(2);
        return {
          discountText: `${currencyInfo.display.symbol}${amountFormatted} off`
        };
      }

      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE: {
        const convertedPrice = CurrencyManager.convertCurrency(
          discount.value,
          currencyInfo.calculation.code,
          currencyInfo.display.code,
          currencyInfo.display.rate
        );
        const priceFormatted = (convertedPrice / 100).toFixed(2);
        return {
          discountText: `bundle for ${currencyInfo.display.symbol}${priceFormatted}`
        };
      }

      default:
        return { discountText: 'discount' };
    }
  }
}
```

---

### 6. Cart Transform Updates

**File: `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`**

```typescript
import type { PricingConfiguration, PricingRule } from './types/pricing';

/**
 * Evaluate if a rule applies
 */
function evaluateRule(
  rule: PricingRule,
  totalQuantity: number,
  totalAmount: number
): { meetsCondition: boolean; conditionValue: number } {
  const condition = rule.condition;
  const currentValue = condition.type === 'quantity' ? totalQuantity : totalAmount;

  let meetsCondition = false;

  switch (condition.operator) {
    case 'gte':
      meetsCondition = currentValue >= condition.value;
      break;
    case 'gt':
      meetsCondition = currentValue > condition.value;
      break;
    case 'lte':
      meetsCondition = currentValue <= condition.value;
      break;
    case 'lt':
      meetsCondition = currentValue < condition.value;
      break;
    case 'eq':
      meetsCondition = currentValue === condition.value;
      break;
    default:
      meetsCondition = false;
  }

  return {
    meetsCondition,
    conditionValue: condition.value
  };
}

/**
 * Find best applicable rule
 */
function findBestApplicableRule(
  pricing: PricingConfiguration,
  totalQuantity: number,
  totalAmount: number
): PricingRule | null {
  if (!pricing.enabled || !pricing.rules.length) {
    return null;
  }

  // Find all applicable rules
  const applicableRules = pricing.rules.filter(rule => {
    const evaluation = evaluateRule(rule, totalQuantity, totalAmount);
    return evaluation.meetsCondition;
  });

  if (applicableRules.length === 0) {
    return null;
  }

  // Sort by condition value descending (highest threshold wins)
  applicableRules.sort((a, b) => b.condition.value - a.condition.value);

  return applicableRules[0];
}

/**
 * Calculate discount percentage
 */
function calculateDiscountPercentage(
  pricing: PricingConfiguration,
  totalQuantity: number,
  totalAmount: number
): number {
  const bestRule = findBestApplicableRule(pricing, totalQuantity, totalAmount);

  if (!bestRule) {
    return 0;
  }

  let discountPercentage = 0;

  switch (pricing.method) {
    case 'percentage_off':
      discountPercentage = bestRule.discount.value;
      break;

    case 'fixed_amount_off':
      const fixedAmountOff = bestRule.discount.value;
      discountPercentage = totalAmount > 0 ? (fixedAmountOff / totalAmount) * 100 : 0;
      break;

    case 'fixed_bundle_price':
      const fixedPrice = bestRule.discount.value;
      const discountAmount = totalAmount > fixedPrice ? totalAmount - fixedPrice : 0;
      discountPercentage = totalAmount > 0 ? (discountAmount / totalAmount) * 100 : 0;
      break;
  }

  return discountPercentage;
}

// In main cart transform function
export function run(input: CartTransformInput): CartTransformResult {
  // ... bundle detection and loading ...

  // Calculate discount
  const hasPricingRules = bundleConfig.pricing?.enabled && bundleConfig.pricing?.rules?.length > 0;

  let discountPercentage = 0;
  if (hasPricingRules) {
    discountPercentage = calculateDiscountPercentage(
      bundleConfig.pricing,
      totalQuantity,
      originalTotal
    );
  }

  // Apply merge with discount
  if (discountPercentage > 0) {
    operation.merge.price = {
      percentageDecrease: {
        value: discountPercentage.toString()
      }
    };
  }

  // ... rest of cart transform logic ...
}
```

---

## Migration Plan

### Phase 1: Add Types & Constants (Day 1)
- [ ] Create `app/types/pricing.ts` with all types
- [ ] Update widget constants
- [ ] Update cart transform types
- **Impact**: None (additive only)

### Phase 2: Update Database Schema (Day 1)
- [ ] Create Prisma migration
- [ ] Test migration on dev database
- [ ] Run data transformation script
- **Impact**: Data structure change (run after hours)

### Phase 3: Update Admin UI (Day 2)
- [ ] Refactor form to use new types
- [ ] Update state management
- [ ] Add validation
- [ ] Test all discount scenarios
- **Impact**: Admin UI changes

### Phase 4: Update Backend (Day 2)
- [ ] Update action to save new structure
- [ ] Update loader to read new structure
- [ ] Update metafield writing
- [ ] Re-save all bundles
- **Impact**: All bundles need re-save

### Phase 5: Update Widget (Day 3)
- [ ] Simplify discount calculation
- [ ] Simplify variable creation
- [ ] Remove all fallback logic
- [ ] Test on storefront
- **Impact**: Storefront changes

### Phase 6: Update Cart Transform (Day 3)
- [ ] Simplify rule evaluation
- [ ] Remove all fallback logic
- [ ] Deploy new version
- [ ] Test checkout
- **Impact**: Checkout changes

### Phase 7: Cleanup (Day 4)
- [ ] Remove old code paths
- [ ] Remove backward compatibility
- [ ] Update documentation
- [ ] Final testing
- **Impact**: None (cleanup only)

---

## Benefits Summary

### Before vs After

#### Before: calculateDiscount Logic
```javascript
// 50+ lines of messy fallback logic
const conditionValue = rule.value || rule.minimumQuantity || rule.numberOfProducts || 0;
const discountValue = rule.percentageOff || rule.discountValue || rule.fixedBundlePrice || 0;
if (discountMethod === 'percentage_off') {
  rawDiscountValue = rule.percentageOff || rule.discountValue;
} else if (discountMethod === 'fixed_amount_off') {
  rawDiscountValue = rule.fixedAmountOff || rule.discountValue;
}
// ... more fallbacks ...
```

#### After: calculateDiscount Logic
```javascript
// 15 lines of clean logic
const condition = rule.condition;
const discount = rule.discount;
const currentValue = condition.type === 'amount' ? totalPrice : totalQuantity;

if (currentValue >= condition.value) {
  discountPercentage = discount.value;
}
```

### Metrics
- **Lines of Code**: 60% reduction
- **Transformations**: 5 → 0
- **Field Name Variants**: 15 → 3
- **Debugging Time**: Hours → Minutes
- **New Developer Onboarding**: Days → Hours

---

## Testing Checklist

### Admin UI
- [ ] Create bundle with percentage_off discount
- [ ] Create bundle with fixed_amount_off discount
- [ ] Create bundle with fixed_bundle_price discount
- [ ] Add multiple rules with different conditions
- [ ] Test quantity-based conditions
- [ ] Test amount-based conditions
- [ ] Test all operators (gte, gt, lte, lt, eq)
- [ ] Update discount method (verify rules update)
- [ ] Test message template customization
- [ ] Test display settings toggle

### Widget UI
- [ ] Verify step cards render
- [ ] Verify discount progress message shows
- [ ] Verify discount success message shows
- [ ] Verify progress bar displays correctly
- [ ] Test quantity-based threshold progress
- [ ] Test amount-based threshold progress
- [ ] Test currency conversion for multi-currency
- [ ] Test all discount method displays
- [ ] Verify template variables substitute correctly

### Cart Transform
- [ ] Add bundle to cart
- [ ] Verify merge operation works
- [ ] Verify discount applies correctly
- [ ] Test quantity threshold
- [ ] Test amount threshold
- [ ] Test percentage discount calculation
- [ ] Test fixed amount discount calculation
- [ ] Test fixed bundle price calculation
- [ ] Verify checkout shows correct price

### Edge Cases
- [ ] Zero discount value
- [ ] Zero threshold value
- [ ] No rules defined
- [ ] Disabled pricing
- [ ] Multiple qualifying rules (highest wins)
- [ ] No qualifying rules
- [ ] Multi-currency edge cases

---

## Success Criteria

1. ✅ **Single Source of Truth**: Same structure in DB, metafield, widget, and cart transform
2. ✅ **Zero Transformations**: No field name mapping anywhere
3. ✅ **Type Safety**: TypeScript validates at compile time
4. ✅ **Clear Code**: Any developer can understand in < 5 minutes
5. ✅ **Reliable**: No fallback chains hiding bugs
6. ✅ **Maintainable**: Easy to add new features
7. ✅ **Testable**: Easy to write unit tests

---

## Rollback Plan

If issues arise during migration:

1. **Database**: Keep old fields temporarily, populate both
2. **Metafield**: Version field to detect old vs new structure
3. **Widget**: Feature flag to enable/disable new logic
4. **Cart Transform**: Deploy old version if needed

**Rollback Window**: 7 days after full deployment
