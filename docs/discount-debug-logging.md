# Discount Messaging Debug Logging

## Issue
Discount messaging not appearing in bundle widget despite bundle loading with `pricingEnabled: true`.

## Debug Logs Added

Added comprehensive console logging to trace discount messaging flow:

### 1. Bundle Selection (line ~501)
```javascript
console.log("🔍 [BUNDLE DEBUG] selectedBundle pricing structure:", {
  hasPricing: !!bundle.pricing,
  pricing: bundle.pricing
});
```
**Purpose:** Verify pricing structure when bundle is first selected

### 2. Discount Calculation (line ~558)
```javascript
console.log("🔍 [DISCOUNT DEBUG] calculateBundleDiscount called:", {
  totalPrice,
  selectedQuantity,
  hasSelectedBundle: !!selectedBundle,
  hasPricing: !!selectedBundle?.pricing,
  pricingEnabled: selectedBundle?.pricing?.enabled,
  fullPricing: selectedBundle?.pricing
});
```
**Purpose:** See what data discount calculation receives

### 3. Discount Early Return (line ~560)
```javascript
console.log("❌ [DISCOUNT DEBUG] Early return - missing data or disabled");
```
**Purpose:** Identify if discount calc exits early due to missing/disabled pricing

### 4. Pricing Rules (line ~566)
```javascript
console.log("📋 [DISCOUNT DEBUG] Pricing rules:", rules);
```
**Purpose:** Verify pricing rules array is populated

### 5. Modal Discount Bar Init (line ~699)
```javascript
console.log("🔍 [MODAL DEBUG] updateModalDiscountBar called:", {
  hasModalDiscountBar: !!modalDiscountBar,
  showDiscountMessaging,
  pricingEnabled: pricing?.enabled
});
```
**Purpose:** Check if modal discount function is called and has required data

### 6. Modal Pricing Details (line ~702)
```javascript
console.log("🔍 [MODAL DEBUG] Pricing details:", {
  enabled: pricing.enabled,
  method: pricing.method,
  rulesCount: pricing.rules?.length,
  messages: pricing.messages,
  showFooter: pricing.showFooter
});
```
**Purpose:** Deep dive into pricing configuration structure

### 7. Modal Early Return (line ~706)
```javascript
console.log("❌ [MODAL DEBUG] Early return - discount messaging disabled");
```
**Purpose:** Identify if modal function exits early

### 8. Footer Discount Init (line ~834)
```javascript
console.log("🔍 [FOOTER DEBUG] updateFooterDiscountMessaging called:", {
  hasSelectedBundle: !!selectedBundle,
  hasPricing: !!selectedBundle?.pricing
});
```
**Purpose:** Check if footer discount function is called

### 9. Footer Early Return (line ~847)
```javascript
console.log("❌ [FOOTER DEBUG] Early return - discount messaging disabled");
```
**Purpose:** Identify if footer function exits early

## How to Debug

1. **Test the bundle widget on storefront**
   ```bash
   npm run dev
   ```

2. **Open Chrome DevTools** on the bundle product page

3. **Check console logs** - Look for:
   - `[BUNDLE DEBUG]` - Verify pricing structure loaded
   - `[DISCOUNT DEBUG]` - See if discount calculation runs
   - `[MODAL DEBUG]` - Check if modal discount bar updates
   - `[FOOTER DEBUG]` - Check if footer messaging updates

4. **Identify the issue:**
   - If `[BUNDLE DEBUG]` shows `hasPricing: false` → Bundle metafield missing pricing data
   - If `[DISCOUNT DEBUG]` shows early return → `pricing.enabled` is false or undefined
   - If `[DISCOUNT DEBUG]` shows empty rules array → No pricing rules configured
   - If `[MODAL DEBUG]` or `[FOOTER DEBUG]` not showing → Functions not being called
   - If `[MODAL DEBUG]` shows early return → `showDiscountMessaging` is false or `pricing.enabled` is false

## Expected Metafield Structure

The bundle metafield (`$app:bundle_config`) should have this pricing structure:

```json
{
  "id": "bundle_id",
  "name": "Bundle Name",
  "pricing": {
    "enabled": true,
    "method": "fixed_amount_off",
    "rules": [
      {
        "condition": "gte",
        "value": 3,
        "discountValue": "10"
      }
    ],
    "showFooter": true,
    "messages": {
      "showDiscountMessaging": true,
      "progressMessage": "Add {discountConditionDiff} more to save {discountValueUnit}{discountValue}",
      "successMessage": "You're saving {savingsAmount}!",
      "rule_3": {
        "progress": "Buy 3 items and save ₹10",
        "achieved": "You saved ₹10!"
      }
    }
  }
}
```

## Key Fields to Verify

1. **`pricing.enabled`** - Must be `true` (not `enableDiscount`)
2. **`pricing.method`** - One of: `fixed_amount_off`, `percentage_off`, `fixed_bundle_price`
3. **`pricing.rules`** - Array of discount rules with `condition`, `value`, `discountValue`
4. **`pricing.messages.showDiscountMessaging`** - Should be `true` to show messaging
5. **`pricing.showFooter`** - Must be `true` to show footer discount bar

## Next Steps

After reviewing console logs:

1. If pricing structure is incorrect → Re-save bundle to update metafield
2. If pricing.enabled is false → Enable discount in bundle configuration
3. If rules array is empty → Add pricing rules in bundle configuration
4. If messages object is missing → Add discount messaging templates

## Files Modified

- `app/assets/bundle-widget-full.js` - Added 9 debug logging statements
- Backup created: `app/assets/bundle-widget-full.js.backup`

## Cleanup

Once issue is resolved, remove debug logging:
```bash
cd "C:/Users/Aditya Awasthi/wolfpack/wolfpack-product-bundles"
cp app/assets/bundle-widget-full.js.backup app/assets/bundle-widget-full.js
```
