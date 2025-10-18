# Discount UI Debugging Guide

## ✅ Database Configuration Status

Your bundle is **properly configured**:
- ✅ Discount Enabled: YES
- ✅ Discount Method: 50% off
- ✅ Discount Rule: When quantity >= 3 products
- ✅ Show Discount Display: YES
- ✅ Show Discount Messaging: YES

## 🔍 Why Discount UI Might Not Show

### **Most Common Reasons:**

### 1. **Not Enough Products Selected** ⚠️
Your discount rule requires **3 or more products**.

**Check:**
- Open the bundle widget on storefront
- Select products from each step
- The discount UI will only show when you have **3+ products** in your bundle

**Expected Behavior:**
- **0-2 products**: No discount UI (you haven't qualified yet)
- **3+ products**: Discount UI appears with 50% off messaging

---

### 2. **Bundle Data Not in Shop Metafield** ⚠️

The widget reads bundle data from the shop metafield. If it's missing, the discount UI won't work.

**How to Fix:**
1. Go to bundle configuration page
2. Click **"Save Bundle"** button
3. This will update the shop metafield with latest pricing data

**Verify in Browser Console:**
```javascript
// Open browser console (F12) on your storefront
console.log(window.allBundlesData);
// Should show your bundle with pricing configuration
```

---

### 3. **Widget Not Loading Bundle Correctly**

**Browser Console Debugging:**

Open browser DevTools (F12) and check console for these logs:

```javascript
// Should see:
🎯 [BUNDLE_DATA] Loading bundle data for product: ...
✅ [BUNDLE_DATA] Bundle data looks good, expected bundle found

// Check if pricing is loaded:
console.log(window.allBundlesData['cmgh5ai5g0000v7h0bknyx9vx'].pricing);

// Should show:
{
  enabled: true,
  method: "percentage_off",
  rules: [{...}],
  messages: {
    showDiscountDisplay: true,
    showDiscountMessaging: true
  }
}
```

---

## 🔧 Step-by-Step Debugging

### **Step 1: Verify Bundle on Correct Page**
- Widget only shows on the bundle product page
- Go to: `https://your-store.myshopify.com/products/cart-transform-demo-1`
- Not other product pages!

### **Step 2: Check Bundle Data Loaded**
Open browser console (F12):
```javascript
// Check if bundle data exists
window.allBundlesData

// Should see your bundle ID with pricing
```

### **Step 3: Select 3+ Products**
- Click products from Step 1, Step 2, Step 3
- Make sure total quantity is **3 or more**
- Watch for discount UI to appear

### **Step 4: Check Discount Calculation**
In browser console:
```javascript
// Check if discount is being calculated
// Open widget modal, select 3 products, then check:
document.querySelector('.bundle-footer-messaging')
// Should NOT be null

document.querySelector('.footer-discount-text')?.textContent
// Should show discount message
```

---

## 🎨 What You Should See

### **When 0-2 Products Selected:**
- Footer messaging: Hidden
- Button: `Add Bundle to Cart • ₹XXX` (no strikethrough)

### **When 3+ Products Selected:**
```
┌─────────────────────────────────────────┐
│  [████████████████] 3 / 3 items         │
│                                          │
│  Congratulations! You got 50% off!      │
│                                          │
│      💚 You save: ₹XXX 💚               │
└─────────────────────────────────────────┘

Button:
  ~~₹XXX~~         ← Original price (strikethrough)
  Add Bundle to Cart • ₹YYY  ← 50% off price
```

---

## 🚨 Quick Fixes

### **Fix 1: Re-save Bundle**
1. Go to admin → Bundle configuration
2. Click "Save Bundle"
3. Refresh storefront page
4. Try again

### **Fix 2: Clear Browser Cache**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear browser cache completely
3. Reload bundle product page

### **Fix 3: Check JavaScript Errors**
1. Open browser console (F12)
2. Look for red error messages
3. If you see errors related to bundle-widget.js, share them

---

## 📊 Current Bundle Configuration

**Bundle:** Cart Transform Demo
**Discount Rule:**
- Type: Quantity-based
- Condition: Greater than or equal to 3
- Discount: 50% off

**This means:**
- Customer must select **3 or more products** total
- Then they get **50% off** the entire bundle
- Discount UI will only appear when condition is met

---

## 🔍 Advanced Debugging

If still not working, check these in browser console:

```javascript
// 1. Check if pricing is enabled
window.allBundlesData?.['cmgh5ai5g0000v7h0bknyx9vx']?.pricing?.enabled
// Should be: true

// 2. Check discount rules
window.allBundlesData?.['cmgh5ai5g0000v7h0bknyx9vx']?.pricing?.rules
// Should show: [{type: "quantity", condition: "greater_than_equal_to", value: 3, discountValue: 50}]

// 3. Check if footer element exists
document.querySelector('.bundle-footer-messaging')
// Should NOT be null

// 4. Check footer display style
document.querySelector('.bundle-footer-messaging')?.style.display
// Should be: "block" (when qualified) or "none" (when not qualified)
```

---

## 📝 Next Steps

1. **Visit your bundle product page**
2. **Open browser console (F12)**
3. **Select 3+ products** in the widget
4. **Check console logs** for any errors
5. **Share console output** if discount still doesn't show

The configuration is correct - it's likely just a matter of selecting enough products to trigger the discount! 🎯
