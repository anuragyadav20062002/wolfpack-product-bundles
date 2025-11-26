# Bundle Widget Discount Variables Documentation

## Overview
The bundle widget now supports comprehensive discount messaging with improved variable names and better handling of both quantity-based and amount-based discount conditions.

## Available Variables

### Legacy Variables (Backward Compatibility)
These variables are maintained for existing implementations:

- `{discountConditionDiff}` - Amount or quantity needed to reach discount
- `{discountUnit}` - Unit type ("items" or currency symbol)
- `{discountValue}` - Discount value (percentage or amount)
- `{discountValueUnit}` - Discount unit ("% off", " off", etc.)
- `{selectedQuantity}` - Current selected quantity
- `{targetQuantity}` - Target quantity for discount (quantity-based only)

### Improved Variables (Recommended)

#### Condition-Specific Variables
- `{amountNeeded}` - Amount needed to reach discount (amount-based conditions)
- `{itemsNeeded}` - Items needed to reach discount (quantity-based conditions)
- `{conditionText}` - Formatted condition text (e.g., "₹100" or "3 items")
- `{discountText}` - Formatted discount text (e.g., "₹50 off" or "20% off")

#### Progress Variables
- `{currentAmount}` - Current bundle amount (formatted with currency)
- `{currentQuantity}` - Current selected quantity
- `{targetAmount}` - Target amount for discount (formatted with currency)
- `{targetQuantity}` - Target quantity for discount
- `{progressPercentage}` - Progress percentage towards discount (0-100)

#### Bundle Information
- `{bundleName}` - Name of the bundle
- `{conditionType}` - Type of condition ("quantity" or "amount")
- `{discountMethod}` - Discount method ("percentage_off", "fixed_amount_off", "fixed_bundle_price")

#### Pricing Information
- `{originalPrice}` - Original bundle price (formatted)
- `{bundlePrice}` - Final bundle price after discount (formatted)
- `{savingsAmount}` - Amount saved (formatted)
- `{savingsPercentage}` - Percentage saved

#### Currency Information
- `{currencySymbol}` - Currency symbol (₹, $, €, etc.)
- `{currencyCode}` - Currency code (INR, USD, EUR, etc.)

#### Status Variables
- `{isQualified}` - Whether discount is qualified ("true" or "false")

## Example Usage

### Quantity-Based Discount Messages

#### Progress Message:
```
Add {itemsNeeded} more to get {discountText}
```
Output: "Add 2 items more to get 20% off"

#### Success Message:
```
Congratulations! You saved {savingsAmount} ({savingsPercentage}% off)
```
Output: "Congratulations! You saved ₹500 (20% off)"

### Amount-Based Discount Messages

#### Progress Message:
```
Add {conditionText} more to get {discountText}
```
Output: "Add ₹100 more to get ₹50 off"

#### Alternative Progress Message:
```
Spend {amountNeeded} more to unlock {discountText}
```
Output: "Spend ₹100 more to unlock ₹50 off"

#### Success Message:
```
🎉 You qualified for {discountText}! Final price: {bundlePrice}
```
Output: "🎉 You qualified for ₹50 off! Final price: ₹450"

### Advanced Examples

#### Progress with Percentage:
```
{progressPercentage}% complete - Add {conditionText} to get {discountText}
```
Output: "75% complete - Add ₹25 to get ₹50 off"

#### Multi-Currency Support:
```
Add {amountNeeded} {currencyCode} to save {discountText}
```
Output: "Add 100 INR to save ₹50 off"

#### Conditional Messages:
```
{currentQuantity} of {targetQuantity} items selected - {conditionText} more needed
```
Output: "2 of 3 items selected - 1 item more needed"

## Discount Method Specific Examples

### Percentage Off
- Progress: "Add {itemsNeeded} to get {discountValue}% off"
- Success: "You got {discountValue}% off! Saved {savingsAmount}"

### Fixed Amount Off
- Progress: "Add {conditionText} to save {discountText}"
- Success: "You saved {discountText}! Final price: {bundlePrice}"

### Fixed Bundle Price
- Progress: "Add {conditionText} to get the bundle for {discountText}"
- Success: "Bundle price locked at {discountText}!"

## Best Practices

1. **Use Condition-Specific Variables**: Use `{amountNeeded}` for amount-based and `{itemsNeeded}` for quantity-based conditions
2. **Leverage Formatted Variables**: Use `{conditionText}` and `{discountText}` for cleaner, pre-formatted output
3. **Show Progress**: Use `{progressPercentage}` to show visual progress
4. **Currency Awareness**: The system automatically handles currency conversion and formatting
5. **Fallback Messages**: Always provide fallback text for edge cases

## Migration Guide

### From Legacy Variables:
```
Old: "Add {discountConditionDiff} {discountUnit} to get {discountValue}{discountValueUnit}"
New: "Add {conditionText} to get {discountText}"
```

### Benefits of New Variables:
- Automatic currency formatting
- Better handling of amount vs quantity conditions
- Cleaner, more readable messages
- Consistent formatting across different discount types
- Multi-currency support built-in

## Technical Notes

- All currency amounts are automatically converted to the customer's viewing currency
- Variables are replaced using both `{variable}` and `{{variable}}` syntax for compatibility
- Empty or undefined variables are replaced with appropriate defaults
- The system maintains backward compatibility with existing variable names