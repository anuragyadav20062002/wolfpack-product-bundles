# Issue: Product Modal Image Not Showing & Add To Box Not Working

**Issue ID:** modal-image-and-addtobox-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-01-20
**Last Updated:** 2026-01-20 14:30

## Overview

Three issues were found in the full-page bundle widget's product modal:

1. **Image not displaying**: Product image was blank when opening the modal
2. **Add To Box not working**: Clicking "Add To Box" inside modal did not add products to the progress box
3. **Wrong button behavior**: "Add to Bundle" button on product card was opening modal instead of directly adding product

## Root Cause Analysis

### Issue 1: Image Not Showing

The modal's `loadImages()` method expected `product.images` to be an array of URL strings:
```javascript
const images = this.currentProduct.images || [];
```

However, the widget stores images in various formats:
- `product.imageUrl` (single string)
- `product.image.src` (object with src property)
- `product.featuredImage.url` (object with url property)
- `product.images` (array of strings or objects)

The modal wasn't handling these different formats, resulting in an empty array and no image displayed.

### Issue 2: Add To Box Not Working

The modal's `addToBundle()` method used:
```javascript
const stepIndex = this.widget.steps.findIndex(s => s.id === this.currentStep.id);
```

But the widget doesn't have a `this.steps` property - it uses `this.selectedBundle.steps`. This caused `undefined.findIndex()` to throw an error, preventing the product from being added.

Additionally, it was using `variant.id` instead of `variant.variantId || variant.id`, which didn't match the selection key format used by the widget.

### Issue 3: Wrong Button Behavior

The "Add to Bundle" button on product cards was opening the modal instead of directly adding the product. Per CEO requirements:
- **"Add to Bundle" button**: Should directly add product to box (NO modal)
- **Click on product card (image/title)**: Should open modal for detailed view

The code in `bundle-widget-full-page.js` was checking for modal and opening it when button was clicked:
```javascript
if (this.productModal) {
  this.productModal.open(product, step);
}
```

## Progress Log

### 2026-01-20 14:00 - Starting Investigation
- Analyzed screenshot showing blank image and non-functional Add To Box
- Reviewed recent commits related to modal functionality
- Identified the `bundle-modal-component.js` file as the source of issues

### 2026-01-20 14:10 - Implementing Fixes
- Added `getProductImages()` helper method to normalize different image formats
- Updated `loadImages()` to use the new helper
- Updated `selectImage()` to use the new helper
- Fixed `addToBundle()` to use `this.widget.selectedBundle.steps`
- Fixed product ID to use `variant.variantId || variant.id`

### 2026-01-20 14:15 - Initial Fixes Completed
- Built widget bundles with `npm run build:widgets`
- ✅ Files modified:
  - `app/assets/bundle-modal-component.js`
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (auto-generated)
  - `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` (auto-generated)

### 2026-01-20 14:25 - Button Behavior Fix (CEO Request)
- Changed "Add to Bundle" button to directly add product instead of opening modal
- Fixed in two locations in `bundle-widget-full-page.js`:
  - `attachProductCardListeners()` method (line ~1179)
  - Event delegation handler on `newProductGrid` (line ~2236)
- Modal now only opens when clicking on product image or title
- Rebuilt widget bundles

## Files Changed

| File | Change |
|------|--------|
| `app/assets/bundle-modal-component.js` | Added `getProductImages()` helper, fixed image loading, fixed `addToBundle()` |
| `app/assets/bundle-widget-full-page.js` | Changed "Add to Bundle" button to add directly without opening modal |
| `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` | Auto-generated bundle with fixes |
| `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` | Auto-generated bundle |

## Technical Details

### New Helper Method: `getProductImages()`

```javascript
getProductImages() {
  const product = this.currentProduct;
  const images = [];

  // Try various image formats
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach(img => {
      if (typeof img === 'string') {
        images.push(img);
      } else if (img?.url) {
        images.push(img.url);
      } else if (img?.src) {
        images.push(img.src);
      }
    });
  }

  // Fallback to single image properties
  if (images.length === 0) {
    if (product.imageUrl) {
      images.push(product.imageUrl);
    } else if (product.image?.src) {
      images.push(product.image.src);
    } else if (product.featuredImage?.url) {
      images.push(product.featuredImage.url);
    }
  }

  return images;
}
```

### Fixed `addToBundle()` Method

```javascript
// Changed from:
const stepIndex = this.widget.steps.findIndex(s => s.id === this.currentStep.id);

// To:
const steps = this.widget.selectedBundle?.steps || [];
const stepIndex = steps.findIndex(s => s.id === this.currentStep.id);

// Changed from:
this.widget.updateProductSelection(stepIndex, variant.id, this.selectedQuantity);

// To:
const productId = variant.variantId || variant.id;
this.widget.updateProductSelection(stepIndex, productId, this.selectedQuantity);
```

## Testing Checklist

- [ ] Open product modal by clicking on product card
- [ ] Verify product image displays correctly
- [ ] Click "Add To Box" button
- [ ] Verify product appears in progress box at bottom
- [ ] Verify price updates correctly
- [ ] Test with products that have multiple variants
- [ ] Test with products that have multiple images

## Related Documentation

- Widget build process: `CLAUDE.md` (Build Commands section)
- Modal component: `app/assets/bundle-modal-component.js`
- Full-page widget: `app/assets/bundle-widget-full-page.js`

## Phases Checklist

- [x] Phase 1: Investigate and identify root causes
- [x] Phase 2: Implement fixes for image loading
- [x] Phase 3: Implement fixes for Add To Box functionality
- [x] Phase 4: Build widget bundles
- [ ] Phase 5: User verification in storefront
