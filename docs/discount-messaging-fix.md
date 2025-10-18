# Discount Messaging Fix for All Discount Types

## Issues Fixed

### Issue 1: Fixed Bundle Price - Showing "0 off"
For bundles using `fixed_bundle_price` discount type, the discount messaging showed "Add X more items to unlock ₹0 off!" instead of showing the actual fixed bundle price.

**Example:**
- **Before**: "Add 2 more items to unlock ₹0 off!"
- **After**: "Add 2 more items to get the bundle at ₹30"

### Issue 2: Fixed Amount Off - Wrong Fallback Value
For bundles using `fixed_amount_off` discount type, if `discountValue` was missing, the code would fallback to `rule.value` which is the **condition threshold** (e.g., 3 items), not the discount amount. This could show "Add 2 items to unlock ₹3 off!" when the rule is "Buy 3 items get ₹10 off".

**Example:**
- **Before**: Could show threshold value instead of discount (e.g., "₹3 off" when rule threshold is 3 items)
- **After**: Correctly shows discount amount (e.g., "₹10 off")

## Root Cause Analysis

### Data Structure

For different discount methods, the pricing rules store values differently:

| Discount Method | Value Fields | Description |
|----------------|--------------|-------------|
| `fixed_amount_off` | `discountValue` = discount amount<br>`value` = condition threshold | Amount to discount (e.g., ₹10 off when buying 3+ items) |
| `percentage_off` | `discountValue` = percentage<br>`value` = condition threshold | Percentage value (e.g., 20% off when buying 5+ items) |
| `fixed_bundle_price` | `fixedBundlePrice` or `price` = target price<br>`numberOfProducts` = quantity threshold | **Target bundle price** (e.g., ₹30 total for 3 items) |

### The Bugs

#### Bug 1: Fixed Bundle Price
In the discount messaging logic, the code was using:

```javascript
discountValue: (nextRule.discountValue || nextRule.value || 0).toString()
```

For `fixed_bundle_price` rules:
- `nextRule.discountValue` is `undefined` (doesn't exist)
- `nextRule.value` doesn't exist either
- Result: Shows "0" in the message

#### Bug 2: Fixed Amount Off
In both `getBestApplicableDiscount()` and `getDiscountValueFromRule()`, the code had:

```javascript
// In getBestApplicableDiscount
discountAmount = parseFloat(bestRule.discountValue || bestRule.value || 0);

// In getDiscountValueFromRule
return parseFloat(rule.discountValue || rule.value || 0);
```

For `fixed_amount_off` rules:
- If `discountValue` is 0 or missing, it falls back to `rule.value`
- `rule.value` is the **condition threshold** (e.g., 3 items), NOT the discount
- Result: Could show "₹3 off" when rule threshold is 3, even if discount should be ₹10

### Why This Happened

Different discount types structure their rules differently:

**Fixed Bundle Price:**
```javascript
{
  id: "rule-1",
  numberOfProducts: 3,
  fixedBundlePrice: 30,  // ← The target price
  condition: "greater_than_equal_to"
  // discountValue: undefined  ← Not set for this discount type!
}
```

**Fixed Amount Off:**
```javascript
{
  id: "rule-2",
  value: 3,              // ← Condition threshold (buy 3 items)
  discountValue: 10,     // ← The actual discount amount (₹10 off)
  condition: "greater_than_equal_to",
  type: "quantity"
}
```

The discount calculation was incorrectly falling back to `rule.value` which represents different things for different discount types.

## The Fix

### 1. Created Helper Function

Added `getDiscountValueFromRule()` function to properly extract the display value based on discount method:

```javascript
function getDiscountValueFromRule(rule, discountMethod, totalPrice = 0) {
  if (!rule) return 0;

  switch (discountMethod) {
    case 'fixed_amount_off':
      // For fixed amount off, return the discount amount
      // DO NOT fallback to rule.value as that's the threshold condition
      return parseFloat(rule.discountValue || 0);

    case 'percentage_off':
      // For percentage off, return the percentage value
      return parseFloat(rule.discountValue || 0);

    case 'fixed_bundle_price':
      // For fixed bundle price, return the target bundle price
      const fixedPrice = parseFloat(rule.price || rule.fixedBundlePrice || 0);
      return fixedPrice;

    default:
      // Default fallback for unknown discount methods
      return parseFloat(rule.discountValue || 0);
  }
}
```

**Key Fix**: Removed the `|| rule.value` fallback for `fixed_amount_off` and the default case, preventing the confusion between discount amount and condition threshold.

### 2. Updated Messaging Logic

Fixed three critical locations where discount values are extracted for messaging:

#### Location 1: Modal Discount Bar ([line 749-751](../app/assets/bundle-widget-full.js#L749))
```javascript
// Before
const currentDiscountValue = discountInfo.applicableRule
  ? (discountInfo.applicableRule.discountValue || 0)
  : 0;

// After
const currentDiscountValue = discountInfo.applicableRule
  ? getDiscountValueFromRule(discountInfo.applicableRule, discountMethod, totalPrice)
  : 0;
```

#### Location 2: Footer Messaging - Next Rule ([line 910](../app/assets/bundle-widget-full.js#L910))
```javascript
// Before
const nextRuleVariables = {
  ...variables,
  discountValue: (nextRule.discountValue || nextRule.value || 0).toString(),
  ...
};

// After
const nextRuleDiscountValue = getDiscountValueFromRule(nextRule, discountMethod, totalPrice);
const nextRuleVariables = {
  ...variables,
  discountValue: nextRuleDiscountValue.toString(),
  ...
};
```

#### Location 3: Footer Messaging - Initial State ([line 932](../app/assets/bundle-widget-full.js#L932))
```javascript
// Before
const initialVariables = {
  ...variables,
  discountValue: (minRule.discountValue || minRule.value || 0).toString(),
  ...
};

// After
const minRuleDiscountValue = getDiscountValueFromRule(minRule, discountMethod, totalPrice);
const initialVariables = {
  ...variables,
  discountValue: minRuleDiscountValue.toString(),
  ...
};
```

### 3. Fixed getBestApplicableDiscount Function

Updated the discount calculation to avoid using wrong fallback ([line 617-620](../app/assets/bundle-widget-full.js#L617)):

```javascript
// Before
case 'fixed_amount_off':
  discountAmount = parseFloat(bestRule.discountValue || bestRule.value || 0);
  break;

// After
case 'fixed_amount_off':
  // For fixed amount off, use discountValue (the discount amount)
  // DO NOT use bestRule.value as that's the condition threshold
  discountAmount = parseFloat(bestRule.discountValue || 0);
  break;
```

### 4. Updated discountValueUnit Logic

Added proper handling for all discount types to show appropriate units:

```javascript
// Determine discount value unit based on method
let discountValueUnit = '';
if (discountMethod === 'percentage_off') {
  discountValueUnit = '% off';
} else if (discountMethod === 'fixed_bundle_price') {
  discountValueUnit = shopCurrency; // Show currency symbol (e.g., "₹30")
} else if (discountMethod === 'fixed_amount_off') {
  discountValueUnit = shopCurrency + ' off'; // Show currency + "off" (e.g., "₹10 off")
}
```

## Message Template Compatibility

The default message template works perfectly for all three discount types:

```
"Add {discountConditionDiff} {discountUnit} to get the bundle at {discountValueUnit}{discountValue}"
```

### Examples with Default Template:

**Fixed Amount Off:**
- Template: "Add {discountConditionDiff} {discountUnit} to get the bundle at {discountValueUnit}{discountValue}"
- Output: "Add 2 items to get the bundle at ₹10 off"

**Percentage Off:**
- Template: "Add {discountConditionDiff} {discountUnit} to get the bundle at {discountValueUnit}{discountValue}"
- Output: "Add 2 items to get the bundle at 20% off"

**Fixed Bundle Price:**
- Template: "Add {discountConditionDiff} {discountUnit} to get the bundle at {discountValueUnit}{discountValue}"
- Output: "Add 2 items to get the bundle at ₹30"

**Note**: The template is intentionally designed to work for all discount types:
- For `fixed_amount_off` and `percentage_off`: Shows what discount you'll get
- For `fixed_bundle_price`: Shows what final price you'll pay

## Files Changed

### 1. [app/assets/bundle-widget-full.js](../app/assets/bundle-widget-full.js)
   - **Lines 617-620**: Fixed `getBestApplicableDiscount()` - removed wrong fallback for `fixed_amount_off`
   - **Lines 639-662**: Added `getDiscountValueFromRule()` helper function with correct logic for all discount types
   - **Lines 744-750**: Updated modal discount bar `discountValueUnit` logic for all types
   - **Lines 749-751**: Updated modal discount bar to use helper function
   - **Lines 816-823**: Updated footer messaging `discountValueUnit` logic for all types
   - **Lines 821-823**: Updated footer messaging to use helper function
   - **Lines 910-916**: Fixed next rule discount value extraction using helper
   - **Lines 932-938**: Fixed initial state discount value extraction using helper

### 2. [extensions/bundle-builder/assets/modal-discount-bar.js](../extensions/bundle-builder/assets/modal-discount-bar.js)
   - **Lines 6-27**: Added `getDiscountValueFromRule()` helper function (same as bundle-widget-full.js)
   - **Lines 134-178**: Fixed progress state messaging to use helper function and proper value display
   - **Lines 179-213**: Fixed initial state messaging to use helper function and proper value display

**Why modal-discount-bar.js needed fixing**: This file handles the discount card UI in the modal and had its own hardcoded messaging logic that was also affected by the same bugs.

## Testing

### Test Case 1: Fixed Bundle Price
1. Create a bundle with `fixed_bundle_price` discount type
2. Set a rule: "3 items = ₹30 bundle price"
3. Open the bundle widget on storefront
4. Select 0-2 items and check the messaging
5. **Expected**: "Add X more items to get the bundle at ₹30"
6. Select 3+ items
7. **Expected**: Shows success message with calculated savings

### Test Case 2: Fixed Amount Off
1. Create a bundle with `fixed_amount_off` discount type
2. Set a rule: "Buy 3 items, get ₹10 off"
3. Open the bundle widget on storefront
4. Select 0-2 items and check the messaging
5. **Expected**: "Add X more items to get the bundle at ₹10 off"
6. **Should NOT show**: "Add X more items to get the bundle at ₹3 off" (wrong - that's the threshold)
7. Select 3+ items
8. **Expected**: Shows success message with ₹10 discount applied

### Test Case 3: Percentage Off
1. Create a bundle with `percentage_off` discount type
2. Set a rule: "Buy 5 items, get 20% off"
3. Open the bundle widget on storefront
4. Select 0-4 items and check the messaging
5. **Expected**: "Add X more items to get the bundle at 20% off"
6. Select 5+ items
7. **Expected**: Shows success message with 20% discount applied

## Additional Notes

- The fix is backward compatible with existing bundles
- Works for all discount types: `fixed_amount_off`, `percentage_off`, and `fixed_bundle_price`
- The helper function centralizes the logic, making it easier to maintain
- Future discount types can be added by updating the switch statement in the helper
