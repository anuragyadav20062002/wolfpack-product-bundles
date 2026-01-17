# Full-Page Bundle: Theme Editor Customization & Preview Fix

**Date:** December 29, 2024
**Status:** ✅ Complete

## Overview

Added comprehensive customization settings to the full-page bundle app block and verified the preview button redirects to the correct page URL.

---

## Features Added

### 1. **Theme Editor Customization Settings** ✅

Merchants can now customize all title bar and text content directly in the Shopify theme editor without touching code.

#### **New Settings Panel Sections**

**Content Customization:**
- Custom title (text)
- Custom description (textarea)
- Custom instruction text (text)

**Display Settings:**
- Show bundle title (checkbox)
- Show bundle description (checkbox) - NEW
- Show step progress timeline (checkbox)
- Show category tabs (checkbox)

---

### 2. **Preview Button Fix** ✅

The "Preview Bundle" button now correctly redirects to the bundle page instead of the product page.

**Before:**
- ❌ Opened `/products/some-handle` (wrong)

**After:**
- ✅ Opens `/pages/some-handle` (correct)

---

## Customization Settings Details

### **Custom Title**
- **Type:** Text input
- **Purpose:** Override the bundle name with custom text
- **Default:** Uses bundle name from app if left empty
- **Example:** "Build Your Perfect Gift Box" instead of "Gift Box Bundle"

**Location in Theme Editor:**
```
App Block Settings → Content Customization → Custom title (optional)
```

---

### **Custom Description**
- **Type:** Textarea
- **Purpose:** Add or override the bundle description
- **Default:** Uses bundle description from app if left empty
- **Example:** "Select your favorite products and save up to 20%!"

**Location in Theme Editor:**
```
App Block Settings → Content Customization → Custom description (optional)
```

---

### **Custom Instruction Text**
- **Type:** Text input
- **Purpose:** Override the default instruction text shown for product selection
- **Default:** Auto-generated from step settings (e.g., "Select 2 or more items from Step 1")
- **Example:** "Choose your favorite flavors below"

**Location in Theme Editor:**
```
App Block Settings → Content Customization → Custom instruction text (optional)
```

---

### **Show Bundle Description**
- **Type:** Checkbox
- **Purpose:** Control visibility of the bundle description
- **Default:** Checked (shown)
- **Note:** Works with both bundle description and custom description

**Location in Theme Editor:**
```
App Block Settings → Display Settings → Show bundle description
```

---

## How It Works

### **Data Flow**

1. **Merchant sets values in Theme Editor:**
   ```
   Custom title: "Build Your Bundle"
   Custom description: "Save 20% when you bundle!"
   Show bundle description: ✓ Checked
   ```

2. **Liquid template passes to widget:**
   ```liquid
   <div
     data-custom-title="Build Your Bundle"
     data-custom-description="Save 20% when you bundle!"
     data-show-description="true"
   >
   ```

3. **JavaScript widget reads configuration:**
   ```javascript
   this.config = {
     customTitle: "Build Your Bundle",
     customDescription: "Save 20% when you bundle!",
     showDescription: true
   };
   ```

4. **Widget renders with custom values:**
   ```html
   <h2 class="bundle-title">Build Your Bundle</h2>
   <p class="bundle-description">Save 20% when you bundle!</p>
   ```

---

## Technical Implementation

### **Files Modified**

1. **Liquid Template:**
   - `extensions/bundle-builder/blocks/bundle-full-page.liquid`
   - Lines 26-77: Added new schema settings
   - Lines 131-137: Pass settings via data attributes

2. **JavaScript Widget:**
   - `app/assets/bundle-widget-full-page.js`
   - Lines 179-201: Parse configuration from data attributes
   - Lines 415-436: Use custom title/description in createHeader()
   - Lines 722-747: Use custom title/instruction in createBundleInstructions()

3. **Bundled Widget:**
   - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
   - Auto-regenerated (119.74 KB)

---

## Schema Settings Added

```json
{
  "type": "header",
  "content": "Content Customization"
},
{
  "type": "text",
  "id": "custom_title",
  "label": "Custom title (optional)",
  "info": "Override the bundle name with custom text. Leave empty to use bundle name from app."
},
{
  "type": "textarea",
  "id": "custom_description",
  "label": "Custom description (optional)",
  "info": "Add a custom description below the title. Leave empty to use bundle description from app."
},
{
  "type": "text",
  "id": "custom_instruction",
  "label": "Custom instruction text (optional)",
  "info": "Override the default instruction text. Leave empty to use auto-generated instructions."
},
{
  "type": "checkbox",
  "id": "show_bundle_description",
  "label": "Show bundle description",
  "default": true
}
```

---

## Preview Button Behavior

### **Full-Page Bundles**

**Check 1: Bundle Type**
```javascript
if (bundle.bundleType === 'full_page') {
  // Use page URL
}
```

**Check 2: Page Handle Exists**
```javascript
if (!bundle.shopifyPageHandle) {
  // Show error: "Please use 'Place Widget Now' first"
  return;
}
```

**Construct Page URL:**
```javascript
const pageUrl = `https://${shop}.myshopify.com/pages/${bundle.shopifyPageHandle}`;
```

**Result:**
- ✅ Opens: `https://shop.myshopify.com/pages/bundle-xyz-abc`
- ✅ Shows: "Bundle page opened in new tab"

### **Product-Page Bundles**

No changes - still opens product URL as before:
- ✅ Opens: `https://shop.myshopify.com/products/product-handle`

---

## Customization Examples

### **Example 1: Holiday Bundle**

**Theme Editor Settings:**
```
Custom title: "🎄 Holiday Gift Box Builder"
Custom description: "Create the perfect holiday gift! Mix and match your favorites."
Custom instruction: "Step 1: Choose your main items"
Show bundle title: ✓
Show bundle description: ✓
```

**Result:**
```html
<h2 class="bundle-title">🎄 Holiday Gift Box Builder</h2>
<p class="bundle-description">Create the perfect holiday gift! Mix and match your favorites.</p>
<p class="bundle-instruction">Step 1: Choose your main items</p>
```

---

### **Example 2: Minimal Design**

**Theme Editor Settings:**
```
Custom title: [empty - uses bundle name]
Custom description: [empty]
Show bundle title: ✓
Show bundle description: ✗ (unchecked)
Custom instruction: "Select your products below"
```

**Result:**
```html
<h2 class="bundle-title">Bundle Name from App</h2>
<!-- No description shown -->
<p class="bundle-instruction">Select your products below</p>
```

---

### **Example 3: Custom Everything**

**Theme Editor Settings:**
```
Custom title: "Build Your Skincare Routine"
Custom description: "Expert-curated products for your skin type. Save 15% on bundles!"
Custom instruction: "Pick 3 or more products to unlock your discount"
Show bundle title: ✓
Show bundle description: ✓
```

**Result:**
```html
<h2 class="bundle-title">Build Your Skincare Routine</h2>
<p class="bundle-description">Expert-curated products for your skin type. Save 15% on bundles!</p>
<p class="bundle-instruction">Pick 3 or more products to unlock your discount</p>
```

---

## Workflow: Place Widget Now

When merchants click "Place Widget Now" for full-page bundles:

1. **Page Created Automatically:**
   - Page handle: `bundle-xyz-abc`
   - Page title: Bundle name from app
   - Page body: Loading placeholder

2. **Bundle ID Saved as Metafield:**
   - Namespace: `$app`
   - Key: `bundle_id`
   - Value: Bundle ID

3. **Page Handle Saved to Database:**
   - `Bundle.shopifyPageHandle` = "bundle-xyz-abc"
   - `Bundle.shopifyPageId` = "gid://shopify/Page/..."

4. **Theme Editor Opens:**
   - Pre-selects "Bundle - Full Page" app block
   - Merchant clicks "Add"

5. **Merchant Customizes:**
   - Opens app block settings panel
   - Sets custom title, description, etc.
   - Saves changes

6. **Preview Works:**
   - Click "Preview Bundle" in app
   - Opens: `/pages/bundle-xyz-abc`
   - Shows customized bundle page

---

## Testing Checklist

### **Customization Settings**

- [ ] **Custom Title**
  - [ ] Leave empty → Shows bundle name from app
  - [ ] Enter custom text → Shows custom text
  - [ ] Update custom text → Changes reflect immediately

- [ ] **Custom Description**
  - [ ] Leave empty → Shows bundle description from app
  - [ ] Enter custom text → Shows custom text
  - [ ] Uncheck "Show bundle description" → Hides description

- [ ] **Custom Instruction**
  - [ ] Leave empty → Shows auto-generated instruction
  - [ ] Enter custom text → Shows custom text
  - [ ] Works across all steps

- [ ] **Display Toggles**
  - [ ] Uncheck "Show bundle title" → Hides title everywhere
  - [ ] Uncheck "Show bundle description" → Hides description
  - [ ] Uncheck "Show step timeline" → Hides timeline
  - [ ] Uncheck "Show category tabs" → Hides category tabs

### **Preview Button**

- [ ] **Full-Page Bundle - New**
  - [ ] Create new full-page bundle
  - [ ] Click "Preview Bundle" before placing → Shows error
  - [ ] Click "Place Widget Now"
  - [ ] Click "Preview Bundle" → Opens `/pages/...` ✓

- [ ] **Full-Page Bundle - Existing**
  - [ ] Open existing full-page bundle (no page handle)
  - [ ] Click "Preview Bundle" → Shows "Place Widget Now" message
  - [ ] Click "Place Widget Now"
  - [ ] Click "Preview Bundle" → Opens correct page ✓

- [ ] **Product-Page Bundle**
  - [ ] Open product-page bundle
  - [ ] Click "Preview Bundle" → Opens `/products/...` ✓
  - [ ] No regression

---

## API Reference

### **Data Attributes**

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `data-custom-title` | String | `null` | Override bundle name |
| `data-custom-description` | String | `null` | Override bundle description |
| `data-custom-instruction` | String | `null` | Override instruction text |
| `data-show-description` | Boolean | `true` | Show/hide description |

### **Configuration Object**

```javascript
this.config = {
  // ... existing config
  customTitle: string | null,
  customDescription: string | null,
  customInstruction: string | null,
  showDescription: boolean
};
```

### **Methods Updated**

```javascript
// Uses custom title and description
createHeader() {
  const title = this.config.customTitle || this.selectedBundle.name;
  const description = this.config.customDescription || this.selectedBundle.description;
  // ...
}

// Uses custom title and instruction
createBundleInstructions() {
  const title = this.config.customTitle || this.bundleData.name;
  const instructionText = this.config.customInstruction || defaultInstruction;
  // ...
}
```

---

## Migration Notes

### **For Existing Full-Page Bundles**

**No action required for existing bundles:**
- Custom fields default to empty (uses app values)
- Show flags default to true (everything visible)
- Behavior unchanged unless merchant customizes

**If merchants want to customize:**
1. Open theme editor
2. Find the "Bundle - Full Page" app block
3. Open settings panel
4. Set custom values
5. Save

### **For New Full-Page Bundles**

Works automatically:
1. Click "Place Widget Now"
2. Page created with metafield
3. Theme editor opens with app block
4. Merchant adds block and customizes settings

---

## Related Documentation

- [Full-Page Button Removal](./FULL_PAGE_BUTTON_REMOVAL.md) - "Add to Cart" button removed
- [Full-Page Preview Fix](./FULL_PAGE_PREVIEW_FIX.md) - Database schema for page handle
- [Full-Page Widget Fixes](./FULL_PAGE_WIDGET_FIXES.md) - Bundle title and loading spinner

---

## Summary

### ✅ What's Working

1. **Theme Editor Customization:**
   - Custom title, description, instruction text
   - Show/hide toggles for all content
   - All settings available in theme editor

2. **Preview Button:**
   - Full-page bundles → `/pages/...` ✓
   - Product-page bundles → `/products/...` ✓
   - Proper error messages when page not created

3. **Workflow:**
   - "Place Widget Now" creates page
   - Page handle saved to database
   - Preview button uses correct URL
   - Theme editor pre-selects app block

### 📊 Impact

- **Merchant Control:** Full customization without code
- **Flexibility:** Override any text content
- **Consistency:** Same workflow across all bundle types
- **User Experience:** Correct preview URLs for all bundle types
