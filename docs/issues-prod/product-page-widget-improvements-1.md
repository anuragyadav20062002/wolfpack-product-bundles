# Issue: Product Page Widget Improvements

**Issue ID:** product-page-widget-improvements-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-01-26
**Last Updated:** 2026-01-26 11:45

---

## Overview

Improve the product page bundle widget to have a more polished, native look that blends with the storefront. Key areas:
1. Widget container is too small - needs larger default size
2. Product images in state cards need better styling (single product vs multiple)
3. Widget has visible outline and non-matching background - needs to blend with storefront
4. Add discount percentage pill to "Add Bundle to Cart" button when discount enabled

---

## Progress Log

### 2026-01-26 10:30 - Starting Implementation

**Requirements Analysis:**
1. Widget container size - increase default padding, spacing, card sizes
2. Product card images - larger images for single product, proper layout for multiple
3. Widget blending - remove border/outline, use transparent background, inherit fonts
4. Discount pill - show "32% off" pill next to price when discount enabled, customizable via DCP

**Files to Modify:**
- `extensions/bundle-builder/assets/bundle-widget.css` - Widget styling
- `app/assets/bundle-widget-product-page.js` - Widget JS (discount pill logic)
- `app/types/state.types.ts` - Add discount pill settings
- `app/components/design-control-panel/config/defaultSettings.ts` - Default pill settings
- `app/routes/api.design-settings.$shopDomain.tsx` - CSS variable generation

### 2026-01-26 11:45 - Implementation Completed

**CSS Changes (`bundle-widget.css`):**
1. Container blending:
   - Removed border, outline, box-shadow from `#bundle-builder-app`
   - Set background to transparent, font-family to inherit

2. Step box improvements:
   - Increased default size from 150px to 180px
   - Changed completed state border from green to blue (`#3b82f6`)
   - Removed green background gradient for completed steps

3. Image styling with dynamic classes:
   - Single image: 120px (large, prominent)
   - Two images: 70px each
   - Three images: 55px each
   - Four+ images: 45px each
   - Removed fixed borders on step images

4. Add to Cart button:
   - Reduced default height to 52px
   - Reduced font size to 16px
   - Added discount pill styles with CSS variables

5. Completed step name:
   - Added positioning at bottom of card with background

**JavaScript Changes (`bundle-widget-product-page.js`):**
1. Image count classes in `createStepElement`:
   - Adds `single-image`, `two-images`, `three-images`, `four-plus-images` class based on product count

2. Discount pill rendering in `updateAddToCartButton`:
   - Calculates discount percentage
   - Renders pill with "X% off" text when discount is active

3. Step name for completed steps:
   - Added step name element at bottom of completed step cards

**Type/Settings Changes:**
1. `app/types/state.types.ts`:
   - Added `discountPillBgColor`, `discountPillTextColor`, `discountPillFontSize`, `discountPillFontWeight`, `discountPillBorderRadius` to GeneralSettings

2. `app/components/design-control-panel/config/defaultSettings.ts`:
   - Added discount pill defaults for both product_page and full_page bundles

3. `app/routes/api.design-settings.$shopDomain.tsx`:
   - Added CSS variable generation for discount pill settings

**Build:**
- Ran `npm run build:widgets` successfully
- Product page widget bundle: 113.2 KB
- Full page widget bundle: 167.0 KB

---

## Related Documentation

- Design Control Panel settings
- Product page widget implementation

---

## Phases Checklist

- [x] Analyze current widget code
- [x] Fix widget container size and spacing
- [x] Improve product card image styling
- [x] Remove widget outline and match background
- [x] Add discount pill feature
- [x] Add DCP customization for discount pill
- [x] Build and test
