# Footer Messaging Visibility - Why It's Not Showing

> **🎉 UPDATE**: As of this fix, footer messaging is now **automatically included** in auto-injected widgets! See "Fix Applied" section below.

## The Question

"Why don't I see footer messaging below the Add to Cart button on my bundle page?"

## Short Answer (Updated)

**Previously**: Footer messaging was only available in Theme Block, not auto-injected widgets.

**Now (Fixed)**: Footer messaging HTML is **automatically included** in both Theme Block AND auto-injected widgets! If you're still not seeing it, check that:
1. Discount is enabled in your bundle configuration
2. At least one discount rule exists
3. The page has fully loaded and bundle data is available

## Fix Applied - Auto-Injected Widgets Now Include Footer

**What was changed**: [bundle.liquid lines 593-620](../extensions/bundle-builder/blocks/bundle.liquid#L593)

**Before**:
```javascript
const widgetHTML = `
  <div id="bundle-builder-app">
    <h2>Bundle Product Detected</h2>
    <button>Add Bundle to Cart</button>
    <!-- ❌ NO footer messaging -->
  </div>`;
```

**After**:
```javascript
const widgetHTML = `
  <div id="bundle-builder-app" data-show-footer-messaging="true">
    <h2>Bundle Product Detected</h2>
    <button class="add-bundle-to-cart">Add Bundle to Cart</button>

    <!-- ✅ Footer messaging included! -->
    <div class="bundle-footer-messaging" style="display: none;">
      <div class="footer-progress-container">
        <div class="progress-bar-wrapper">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">
            <span class="current-quantity">0</span> / <span class="target-quantity">0</span> items
          </div>
        </div>
        <div class="footer-discount-text"></div>
        <div class="footer-savings-display" style="display: none;">
          <span class="savings-badge">You save: <span class="savings-amount"></span></span>
        </div>
      </div>
    </div>
  </div>`;
```

**Impact**: Auto-injected bundle widgets now have the same footer messaging capabilities as manually-added theme blocks!

## Footer Messaging Requirements

For footer messaging to appear, ALL of these conditions must be met:

### 1. HTML Element Must Exist
```html
<div class="bundle-footer-messaging" style="display: none;">
  <!-- Footer content -->
</div>
```

**Where it's defined**:
- ✅ Theme Block: `extensions/bundle-builder/blocks/bundle.liquid` (line 376)
- ✅ **Auto-injected widgets**: `extensions/bundle-builder/blocks/bundle.liquid` (lines 604-619) - **NOW INCLUDED!**

### 2. Discount Must Be Enabled
```javascript
pricing.enableDiscount === true
```

**Check in**: Bundle configuration → Pricing & Discounts → "Enable Discount" toggle

### 3. Discount Rules Must Exist
```javascript
rules.length > 0
```

**Check in**: Bundle configuration → At least one discount rule configured

### 4. showFooterMessaging Setting
```javascript
widgetConfig.showFooterMessaging === true
```

**Check in**: Theme customizer → Bundle Block settings → "Display discount progress messaging" checkbox

**Default**: `true` (enabled by default in theme settings)

### 5. showDiscountMessaging Not Explicitly Disabled
```javascript
pricing.messages?.showDiscountMessaging !== false
```

**Check in**: Bundle pricing configuration (advanced setting)

## Code Flow

```javascript
// bundle-widget-full.js, updateFooterDiscountMessaging()

// Step 1: Check if footer element exists
const footerMessagingContainer = document.querySelector('.bundle-footer-messaging');
if (!footerMessagingContainer) return; // ❌ STOP - Element doesn't exist

// Step 2: Check if discount messaging is enabled
const showDiscountMessaging = pricing.messages?.showDiscountMessaging !== false;
if (!showDiscountMessaging || !pricing.enableDiscount) {
  footerMessagingContainer.style.display = 'none'; // ❌ HIDE
  return;
}

// Step 3: Check if there are rules
const rules = pricing.rules || [];
if (pricing.enableDiscount && rules.length > 0) {
  footerMessagingContainer.style.display = 'block'; // ✅ SHOW
  // ... update content
}
```

## Your Screenshot Analysis

Looking at your screenshot showing "Cart Transformation Demo":

### What You See:
- ✅ Three step boxes with green borders (Perfume 1, 2, 3)
- ✅ Add Bundle to Cart button showing "₹269.00 ₹30.00"
- ❌ **NO footer messaging** below the button

### Why Footer is Missing:

**Most Likely Reason**: You're viewing a **bundle container product page** without the theme block installed.

The bundle widget can appear in two ways:

#### Option A: Theme Block (Has Footer)
```
Product Page
└── Bundle Block (from theme customizer)
    ├── Step boxes
    ├── Add to Cart button
    └── 🟢 Footer messaging ← PRESENT
```

**How to use**: Add "Bundle Builder" block in Theme Customizer → Product page

#### Option B: Container Product (No Footer by Default)
```
Bundle Container Product Page
└── Auto-injected widget (via metafields)
    ├── Step boxes
    ├── Add to Cart button
    └── 🔴 NO footer messaging ← MISSING
```

**What you're seeing**: The widget auto-injected on the bundle container product

## How to Get Footer Messaging

### Solution 1: Use Theme Block (Recommended)
1. Go to Shopify Admin → Online Store → Customize Theme
2. Navigate to your bundle product page
3. Add "Bundle Builder" app block
4. Configure the block settings (bundle ID, etc.)
5. Save theme

This will give you the full template including footer messaging.

### Solution 2: Manually Add Footer HTML to Container Product

If you want footer on container products, you need to either:

**A. Update the bundle.liquid template** to always include footer messaging

**B. Modify the JavaScript** to inject the footer element if it doesn't exist:

```javascript
// In bundle-widget-full.js, before updateFooterDiscountMessaging()
function ensureFooterMessagingElement() {
  let footer = document.querySelector('.bundle-footer-messaging');
  if (!footer) {
    const container = document.querySelector('#bundle-builder-app');
    if (container) {
      const footerHTML = `
        <div class="bundle-footer-messaging" style="display: none;">
          <div class="footer-progress-container">
            <div class="progress-bar-wrapper">
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
              <div class="progress-text">
                <span class="current-quantity">0</span> / <span class="target-quantity">0</span> items
              </div>
            </div>
            <div class="footer-discount-text"></div>
            <div class="footer-savings-display" style="display: none;">
              <span class="savings-badge">You save: <span class="savings-amount"></span></span>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', footerHTML);
    }
  }
}
```

### Solution 3: Check Your Bundle Configuration

Even if the element exists, verify:

1. **Discount is enabled**:
   - Admin → Your Bundle → Pricing & Discounts tab
   - Toggle "Enable Discount" ON

2. **Discount rules exist**:
   - Same tab → Add at least one discount rule
   - Example: "Buy 3 items, get ₹30 bundle price"

3. **Theme setting enabled**:
   - Theme Customizer → Bundle block → Settings
   - Check "Display discount progress messaging" is ON

## Debugging Checklist

Run this in your browser console on the bundle page:

```javascript
// Check if footer element exists
console.log('Footer element:', document.querySelector('.bundle-footer-messaging'));

// Check widget config
console.log('Widget config:', {
  showFooterMessaging: document.querySelector('#bundle-builder-app')?.dataset?.showFooterMessaging,
  bundleId: document.querySelector('#bundle-builder-app')?.dataset?.bundleId
});

// Check bundle data (after widget loads)
console.log('Bundle pricing:', window.selectedBundle?.pricing);
console.log('Enable discount:', window.selectedBundle?.pricing?.enableDiscount);
console.log('Rules:', window.selectedBundle?.pricing?.rules);
```

**Expected output** for footer to show:
```javascript
{
  footerElement: <div class="bundle-footer-messaging">,
  showFooterMessaging: "true",
  enableDiscount: true,
  rules: [{ /* rule 1 */ }, { /* rule 2 */ }]
}
```

## Summary

**Your case**: Footer messaging is not showing because you're likely viewing a **bundle container product page** without the theme block, which doesn't include the footer HTML element by default.

**Quick fix**: Use the Theme Customizer to add the "Bundle Builder" block to your product page, which includes the footer messaging template.

**Alternative**: The footer messaging is optional - the modal discount card (which you DO see) serves a similar purpose and shows the same information during product selection.
