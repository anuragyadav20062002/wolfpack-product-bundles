# Locale Translations Update

**Date:** December 29, 2024
**Status:** ✅ Complete

## Overview

Updated the `en.default.json` locale file with comprehensive translations for both product-page and full-page bundle widgets, including all new customization settings.

---

## What Was Updated

### **File Modified**
- `extensions/bundle-builder/locales/en.default.json`

### **Structure**
```json
{
  "bundle_product_page": { },    // Product page bundle settings
  "bundle_full_page": { },       // Full page bundle settings
  "shared": { }                  // Shared UI text, errors, accessibility
}
```

---

## Translation Categories

### 1. **Bundle Product Page** (`bundle_product_page`)

Settings for the product-page bundle app block:

**Configuration:**
- Bundle ID label and info
- App server URL label and info

**Display Settings:**
- Show bundle title
- Show step numbers
- Show footer messaging

**Example:**
```json
{
  "bundle_product_page": {
    "name": "Bundle - Product Page",
    "settings": {
      "bundle_id_label": "Bundle ID (Auto-configured)",
      "show_bundle_title_label": "Show bundle title",
      "show_footer_messaging_label": "Show footer messaging"
    }
  }
}
```

---

### 2. **Bundle Full Page** (`bundle_full_page`)

Settings for the full-page bundle app block with new customization options:

**Configuration:**
- Bundle ID label and info
- App server URL label and info

**Content Customization (NEW):**
- Custom title label and info
- Custom description label and info
- Custom instruction label and info

**Display Settings:**
- Show bundle title
- Show bundle description (NEW)
- Show step progress timeline
- Show category tabs

**Example:**
```json
{
  "bundle_full_page": {
    "name": "Bundle - Full Page",
    "settings": {
      "custom_title_label": "Custom title (optional)",
      "custom_title_info": "Override the bundle name with custom text...",
      "show_bundle_description_label": "Show bundle description"
    }
  }
}
```

---

### 3. **Shared Translations** (`shared`)

Common text used across both bundle types:

#### **UI Elements** (`shared.ui`)
- Button labels ("Add Bundle to Cart", "Loading...")
- Display text ("Total", "Discount", "Quantity")
- Navigation ("Previous", "Next", "Close")
- Messages ("Congratulations! You got {discount}!")

**Example:**
```json
{
  "shared": {
    "ui": {
      "add_to_cart": "Add Bundle to Cart",
      "add_to_cart_loading": "Adding to Cart...",
      "discount_progress": "Add {amount} more to unlock {discount}",
      "discount_qualified": "Congratulations! You got {discount}!"
    }
  }
}
```

#### **Error Messages** (`shared.errors`)
- Loading errors
- Cart errors
- Validation errors
- Network errors

**Example:**
```json
{
  "shared": {
    "errors": {
      "failed_to_load": "Failed to load bundle data",
      "failed_to_add_cart": "Failed to add bundle to cart",
      "network_error": "Network error. Please check your connection..."
    }
  }
}
```

#### **Accessibility Labels** (`shared.accessibility`)
- Screen reader labels
- ARIA labels for buttons
- Step status announcements

**Example:**
```json
{
  "shared": {
    "accessibility": {
      "close_modal": "Close modal",
      "open_product_selection": "Open product selection for {step}",
      "increase_quantity": "Increase quantity for {product}",
      "step_completed": "Step {number} completed"
    }
  }
}
```

---

## Current Implementation

### **Schema Labels (Hardcoded)**

Currently, the Liquid schema uses **hardcoded English labels**:

**Example from `bundle-full-page.liquid`:**
```liquid
{% schema %}
{
  "settings": [
    {
      "type": "text",
      "id": "custom_title",
      "label": "Custom title (optional)",
      "info": "Override the bundle name with custom text..."
    }
  ]
}
{% endschema %}
```

### **Locale File (Translation Ready)**

The locale file provides translations that **could** be used with the `t` filter:

**Example:**
```json
{
  "bundle_full_page": {
    "settings": {
      "custom_title_label": "Custom title (optional)",
      "custom_title_info": "Override the bundle name with custom text..."
    }
  }
}
```

---

## Future: Multi-Language Support

To enable multi-language support in the future, update the schema to use the `t` filter:

### **Step 1: Update Schema**

**Before (Hardcoded):**
```liquid
{
  "type": "text",
  "id": "custom_title",
  "label": "Custom title (optional)",
  "info": "Override the bundle name with custom text..."
}
```

**After (Translated):**
```liquid
{
  "type": "text",
  "id": "custom_title",
  "label": "t:bundle_full_page.settings.custom_title_label",
  "info": "t:bundle_full_page.settings.custom_title_info"
}
```

### **Step 2: Create Additional Locale Files**

Copy `en.default.json` and create translated versions:

```
locales/
  en.default.json      (English - default)
  fr.json              (French)
  de.json              (German)
  es.json              (Spanish)
  ja.json              (Japanese)
  ...
```

### **Step 3: Translate Content**

**Example: `fr.json` (French)**
```json
{
  "bundle_full_page": {
    "settings": {
      "custom_title_label": "Titre personnalisé (optionnel)",
      "custom_title_info": "Remplacer le nom du bundle par un texte personnalisé..."
    }
  }
}
```

---

## Translation Keys Reference

### **Product Page Bundle Settings**

| Key | English Text | Usage |
|-----|-------------|-------|
| `bundle_product_page.name` | "Bundle - Product Page" | Block name |
| `bundle_product_page.settings.bundle_id_label` | "Bundle ID (Auto-configured)" | Setting label |
| `bundle_product_page.settings.show_bundle_title_label` | "Show bundle title" | Setting label |

### **Full Page Bundle Settings**

| Key | English Text | Usage |
|-----|-------------|-------|
| `bundle_full_page.name` | "Bundle - Full Page" | Block name |
| `bundle_full_page.settings.custom_title_label` | "Custom title (optional)" | Setting label |
| `bundle_full_page.settings.custom_description_label` | "Custom description (optional)" | Setting label |
| `bundle_full_page.settings.custom_instruction_label` | "Custom instruction text (optional)" | Setting label |
| `bundle_full_page.settings.show_bundle_description_label` | "Show bundle description" | Setting label |

### **Shared UI Text**

| Key | English Text | Usage |
|-----|-------------|-------|
| `shared.ui.add_to_cart` | "Add Bundle to Cart" | Button text |
| `shared.ui.discount_progress` | "Add {amount} more to unlock {discount}" | Progress message |
| `shared.ui.discount_qualified` | "Congratulations! You got {discount}!" | Success message |
| `shared.ui.complete_steps` | "Complete All Steps to Continue" | Validation message |

### **Shared Error Messages**

| Key | English Text | Usage |
|-----|-------------|-------|
| `shared.errors.failed_to_load` | "Failed to load bundle data" | Error message |
| `shared.errors.failed_to_add_cart` | "Failed to add bundle to cart" | Error message |
| `shared.errors.network_error` | "Network error. Please check your connection..." | Error message |

### **Accessibility Labels**

| Key | English Text | Usage |
|-----|-------------|-------|
| `shared.accessibility.close_modal` | "Close modal" | ARIA label |
| `shared.accessibility.open_product_selection` | "Open product selection for {step}" | ARIA label |
| `shared.accessibility.increase_quantity` | "Increase quantity for {product}" | ARIA label |
| `shared.accessibility.step_completed` | "Step {number} completed" | Status announcement |

---

## Variable Placeholders

Some translations use dynamic placeholders:

| Placeholder | Description | Example |
|------------|-------------|---------|
| `{amount}` | Price amount | "Save $10.00" |
| `{discount}` | Discount text | "20% off" |
| `{step}` | Step name | "Open product selection for Step 1" |
| `{product}` | Product name | "Increase quantity for Blue Shirt" |
| `{number}` | Step number | "Step 2 completed" |

---

## Benefits

### **Consistency** ✅
- All text centralized in one file
- Easy to find and update labels
- Prevents typos and inconsistencies

### **Translation Ready** ✅
- Structure supports multiple languages
- Clear naming conventions
- Placeholder syntax documented

### **Maintainability** ✅
- Single source of truth for UI text
- Easy to add new translations
- Grouped by feature/context

### **Accessibility** ✅
- Dedicated section for screen reader labels
- ARIA labels for interactive elements
- Status announcements for assistive technology

---

## Testing Checklist

### **Verify Locale File Structure**
- [ ] File is valid JSON
- [ ] All keys follow naming convention
- [ ] No duplicate keys
- [ ] All placeholders properly formatted

### **Cross-Reference with Code**
- [ ] All UI text has corresponding locale key
- [ ] All error messages have corresponding locale key
- [ ] All accessibility labels have corresponding locale key

### **Future Translation Support**
- [ ] Locale file structure supports multiple languages
- [ ] All text externalized (not hardcoded in JS/Liquid)
- [ ] Placeholder syntax consistent

---

## File Structure

```
extensions/bundle-builder/
  locales/
    en.default.json          ← Updated with comprehensive translations
  blocks/
    bundle.liquid            ← Product page bundle (hardcoded labels)
    bundle-full-page.liquid  ← Full page bundle (hardcoded labels)
```

---

## Summary

### ✅ What We Did

1. **Updated `en.default.json`** with comprehensive translations
2. **Organized into 3 sections:**
   - Product page bundle settings
   - Full page bundle settings (with new customization options)
   - Shared UI text, errors, and accessibility labels
3. **Added all new customization settings:**
   - Custom title
   - Custom description
   - Custom instruction text
   - Show bundle description toggle
4. **Documented translation keys** for future multi-language support
5. **Added accessibility labels** for screen readers

### 📊 Translation Coverage

- **Settings:** 18 unique settings across both bundle types
- **UI Elements:** 18 UI text strings
- **Error Messages:** 6 error message strings
- **Accessibility:** 7 accessibility label strings
- **Total:** 49 translation keys

### 🌍 Multi-Language Ready

While currently using hardcoded English in the schema, the locale file structure is ready for multi-language support. To enable translations, simply:
1. Update schema to use `t:` syntax
2. Create locale files for other languages
3. Translate all keys

---

## Related Documentation

- [Full-Page Customization](./FULL_PAGE_CUSTOMIZATION.md) - Theme editor customization settings
- [Full-Page Button Removal](./FULL_PAGE_BUTTON_REMOVAL.md) - "Add to Cart" button removed
- [Full-Page Widget Fixes](./FULL_PAGE_WIDGET_FIXES.md) - Various UI fixes
