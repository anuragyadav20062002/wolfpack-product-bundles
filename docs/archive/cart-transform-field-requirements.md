# Cart Transform Field Requirements - Complete Reference

## 📋 Required Fields for All Discount Types and Subtypes

### **Core Rule Structure**
Every discount rule MUST have these base fields:
```json
{
  "condition": "gte",                    // Required: "gte", "lte", "eq"
  "conditionType": "quantity|amount",    // Required: determines if based on items or cart value
  "value": 100,                         // Required: threshold value (quantity or amount)
  // Plus discount-specific fields below...
}
```

### **1. Percentage Off Discount**

#### **Quantity Subtype**
```json
{
  "method": "percentage_off",
  "rules": [{
    "condition": "gte",
    "conditionType": "quantity",
    "value": 3,                          // Required: 3+ items
    "percentageOff": 25,                 // Primary field (cart transform)
    "discountValue": 25                  // Fallback field (frontend)
  }]
}
```

#### **Amount Subtype**
```json
{
  "method": "percentage_off",
  "rules": [{
    "condition": "gte", 
    "conditionType": "amount",
    "value": 100,                        // Required: Rs. 100+ cart
    "percentageOff": 50,                 // Primary field (cart transform)
    "discountValue": 50                  // Fallback field (frontend)
  }]
}
```

### **2. Fixed Amount Off Discount**

#### **Quantity Subtype**
```json
{
  "method": "fixed_amount_off",
  "rules": [{
    "condition": "gte",
    "conditionType": "quantity", 
    "value": 2,                          // Required: 2+ items
    "fixedAmountOff": 20,                // Primary field (cart transform)
    "discountValue": 20                  // Fallback field (frontend)
  }]
}
```

#### **Amount Subtype**
```json
{
  "method": "fixed_amount_off",
  "rules": [{
    "condition": "gte",
    "conditionType": "amount",
    "value": 150,                        // Required: Rs. 150+ cart
    "fixedAmountOff": 30,                // Primary field (cart transform)
    "discountValue": 30                  // Fallback field (frontend)
  }]
}
```

### **3. Fixed Bundle Price Discount**

#### **Quantity Subtype**
```json
{
  "method": "fixed_bundle_price",
  "rules": [{
    "condition": "gte",
    "conditionType": "quantity",
    "value": 3,                          // Required: 3+ items
    "fixedBundlePrice": 45,              // Primary field (cart transform)
    "discountValue": 45                  // Fallback field (frontend)
  }]
}
```

#### **Amount Subtype**
```json
{
  "method": "fixed_bundle_price",
  "rules": [{
    "condition": "gte",
    "conditionType": "amount", 
    "value": 200,                        // Required: Rs. 200+ cart
    "fixedBundlePrice": 80,              // Primary field (cart transform)
    "discountValue": 80                  // Fallback field (frontend)
  }]
}
```

## 🔧 Cart Transform Field Extraction Logic

### **Current Implementation (Needs Enhancement)**
```typescript
// Only checks primary fields
if (method === 'percentage_off') {
  discountPercentage = rule.percentageOff || 0;  // Missing fallback
} else if (method === 'fixed_amount_off') {
  discountPercentage = (rule.fixedAmountOff / originalTotal) * 100;  // Missing fallback
}
```

### **Required Implementation (With Fallbacks)**
```typescript
// Should check both primary and fallback fields
if (method === 'percentage_off') {
  discountPercentage = rule.percentageOff || rule.discountValue || 0;
} else if (method === 'fixed_amount_off') {
  const fixedAmount = rule.fixedAmountOff || rule.discountValue || 0;
  discountPercentage = (fixedAmount / originalTotal) * 100;
} else if (method === 'fixed_bundle_price') {
  const fixedPrice = rule.fixedBundlePrice || rule.discountValue || 0;
  discountPercentage = ((originalTotal - fixedPrice) / originalTotal) * 100;
}
```

## 📊 Field Priority Order

### **Condition Value (Threshold)**
1. `rule.value` (primary)
2. `rule.minimumQuantity` (legacy)
3. `rule.numberOfProducts` (legacy)
4. `0` (default)

### **Condition Type**
1. `rule.conditionType` (primary)
2. `"quantity"` (default)

### **Discount Values**
- **Percentage Off**: `rule.percentageOff` → `rule.discountValue` → `0`
- **Fixed Amount Off**: `rule.fixedAmountOff` → `rule.discountValue` → `0`
- **Fixed Bundle Price**: `rule.fixedBundlePrice` → `rule.discountValue` → `0`

## ✅ Summary

**CRITICAL**: Cart transform must check BOTH field naming systems:
- **Primary Fields**: `percentageOff`, `fixedAmountOff`, `fixedBundlePrice`
- **Fallback Fields**: `discountValue` (used by frontend/UI)

**Your Current Issue**: Cart transform only checks primary fields, but your bundle uses `discountValue` (fallback field), causing the discount to not apply.