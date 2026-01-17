# Full-Page Widget Fixes

**Date:** December 29, 2024
**Status:** ✅ Complete

## Issues Fixed

### 1. ✅ Duplicate Bundle Name Display
**Problem:** Bundle name was showing in multiple places on the full-page bundle widget, even when `show_bundle_title` was disabled.

**Root Cause:**
- The `createBundleInstructions()` method was creating a second header with the bundle name (line 726)
- This header didn't respect the `showTitle` configuration setting
- Result: Bundle name appeared twice even when merchants disabled it

**Solution:**
- Updated `createBundleInstructions()` to conditionally render bundle title based on `this.config.showTitle`
- Now only shows bundle title if the merchant has enabled it in block settings
- Instruction text still displays regardless (helpful for users)

**Files Changed:**
- `app/assets/bundle-widget-full-page.js` (lines 725-733)
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (regenerated)

**Code Change:**
```javascript
// Before
header.innerHTML = `
  <h3 class="bundle-title">${this.bundleData.name}</h3>
  <p class="bundle-instruction">${instructionText}</p>
`;

// After
const bundleTitleHTML = this.config.showTitle
  ? `<h3 class="bundle-title">${this.bundleData.name}</h3>`
  : '';

header.innerHTML = `
  ${bundleTitleHTML}
  <p class="bundle-instruction">${instructionText}</p>
`;
```

---

### 2. ✅ Improved Loading Spinner
**Problem:** Loading state showed plain text "Loading bundle builder..." which didn't match the full-page bundle design.

**Solution:**
- Removed the text completely
- Enhanced CSS to properly center the spinner
- Made spinner larger and more prominent
- Uses flexbox for perfect centering across viewport
- Added CSS variables for customization via Design Control Panel

**Files Changed:**
- `extensions/bundle-builder/blocks/bundle-full-page.liquid` (lines 108-110)
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` (lines 817-837)

**Visual Changes:**
- **Before:** Small spinner with text below, left-aligned padding
- **After:** Large centered spinner, 60vh height, no text

**CSS Variables Added:**
- `--bundle-full-page-loading-spinner-size` (default: 60px)
- `--bundle-full-page-loading-spinner-border-width` (default: 5px)
- `--bundle-full-page-loading-spinner-border` (default: rgba(0,0,0,0.1))
- `--bundle-full-page-loading-spinner-active` (default: #1E1E1E)

---

### 3. ✅ Fixed RemoteAsset Theme-Check Warning
**Problem:** Theme-check showed warning about using remote assets instead of `asset_url` filter for design settings CSS.

**Why This Warning is a False Positive:**
- Design settings CSS is dynamically generated from database (DesignSettings table)
- NOT a static theme asset that can use `asset_url`
- Loaded from app proxy URL: `/apps/product-bundles/api/design-settings/`
- Contains CSS variables customized per merchant via Design Control Panel

**Solution:**
- Added `theme-check-disable RemoteAsset` comments around the design CSS link
- Added explanatory comments documenting why remote URL is necessary
- Suppresses the warning while keeping code compliant

**Files Changed:**
- `extensions/bundle-builder/blocks/bundle-full-page.liquid` (lines 156-162)
- `extensions/bundle-builder/blocks/bundle.liquid` (lines 626-632)

**Code Added:**
```liquid
<!-- NOTE: Using app proxy URL instead of asset_url because design settings are dynamically -->
<!-- generated from database, not static theme assets. This is intentional. -->
{% # theme-check-disable RemoteAsset %}
<link
  rel="stylesheet"
  href="{{ shop.url }}/apps/product-bundles/api/design-settings/{{ shop.domain }}?bundleType=full_page&v={{ 'now' | date: '%s' }}"
  type="text/css"
>
{% # theme-check-enable RemoteAsset %}
```

---

## Bundle Title Display Behavior

After these fixes, the bundle title display is now controlled properly:

### When `show_bundle_title` is **enabled** (default):
✅ Bundle title appears **once** at the top of the widget
✅ Instruction text appears below (e.g., "Select 2 or more items from Step 1")

### When `show_bundle_title` is **disabled**:
✅ Bundle title is completely hidden
✅ Only instruction text appears
✅ Page title (if set by merchant) still shows outside the widget (this is expected)

---

## Testing Checklist

- [ ] **Full-page bundle loads correctly**
  - [ ] Loading spinner displays centered without text
  - [ ] Spinner disappears when widget loads

- [ ] **Bundle title respects settings**
  - [ ] Enable "Show bundle title" → Title appears once
  - [ ] Disable "Show bundle title" → Title is hidden
  - [ ] Instruction text always visible

- [ ] **Design Control Panel integration**
  - [ ] Design CSS loads without errors
  - [ ] Custom colors/styles apply correctly
  - [ ] No theme-check warnings

- [ ] **No console errors**
  - [ ] Check browser console for errors
  - [ ] Verify no missing assets

---

## Technical Details

### Loading Spinner CSS
```css
.bundle-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  width: 100%;
}

.loading-spinner {
  width: var(--bundle-full-page-loading-spinner-size, 60px);
  height: var(--bundle-full-page-loading-spinner-size, 60px);
  border: var(--bundle-full-page-loading-spinner-border-width, 5px) solid var(--bundle-full-page-loading-spinner-border, rgba(0, 0, 0, 0.1));
  border-top: var(--bundle-full-page-loading-spinner-border-width, 5px) solid var(--bundle-full-page-loading-spinner-active, #1E1E1E);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### Bundle Configuration
The `showTitle` configuration is set via Liquid block settings:
```liquid
data-show-title="{{ block.settings.show_bundle_title }}"
```

And parsed in JavaScript:
```javascript
this.config = {
  showTitle: dataset.showTitle !== 'false',
  // ... other config
};
```

---

## Files Modified

1. **Source Files:**
   - `app/assets/bundle-widget-full-page.js`

2. **Bundled Files (Auto-generated):**
   - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`

3. **Liquid Templates:**
   - `extensions/bundle-builder/blocks/bundle-full-page.liquid`
   - `extensions/bundle-builder/blocks/bundle.liquid`

4. **Stylesheets:**
   - `extensions/bundle-builder/assets/bundle-widget-full-page.css`

---

## Regenerating Bundles

When making changes to source files, regenerate the bundled versions:

```bash
# For full-page widget
node create-full-page-bundle.cjs

# For product-page widget
node create-product-page-bundle.cjs
```

Or use a permanent build script if added to package.json.

---

## Notes

- **Page Title vs Widget Title:** If merchants set a page title in Shopify admin (e.g., "Build Your Bundle"), that will still display outside the widget. This is expected behavior and controlled by the theme, not the widget.

- **Design Control Panel:** All styling can be customized via the Design Control Panel without touching code. The CSS variables provide full control over colors, sizes, and spacing.

- **Browser Support:** The loading spinner animation works in all modern browsers. Uses standard CSS `@keyframes` animation.
