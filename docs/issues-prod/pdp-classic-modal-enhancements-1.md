# Issue: PDP Classic Modal Enhancements — Grid Default, Animation, Auto-Close, DCP Preview

**Issue ID:** pdp-classic-modal-enhancements-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Overview
Enhance the PDP classic modal to match the CrazyRumors competitor experience:
1. Cards per row default changed from 3 → 4
2. Step change animation (slide-up with stagger)
3. Auto-close modal when all steps complete
4. DCP preview footer updated to match floating pill design

## Progress Log

### 2026-03-29 - Implementation
- Changing `productCardsPerRow` default from 3 → 4 in defaultSettings, CSS generator, and API route
- Adding slide-up animation CSS keyframes and stagger styles
- Adding animation trigger in JS after rendering modal products
- Adding `_autoProgressClassicModal()` for auto-close behavior
- Updating DCP iframe preview footer HTML to floating pill design
- Updating React `ProductPageFooterLayout` component to floating pill design
- Bumping WIDGET_VERSION from 2.4.0 → 2.4.1

Files modified:
- `app/components/design-control-panel/config/defaultSettings.ts`
- `app/lib/css-generators/css-variables-generator.ts`
- `app/routes/api/api.design-settings.$shopDomain.tsx`
- `app/assets/bundle-widget-product-page.js`
- `extensions/bundle-builder/assets/bundle-widget.css`
- `app/routes/api/api.preview.$type.tsx`
- `app/components/design-control-panel/preview/BundleFooterPreview.tsx`
- `scripts/build-widget-bundles.js`

## Phases Checklist
- [x] Step 1: Change cards-per-row default 3 → 4
- [x] Step 2: Add slide-up animation CSS + JS trigger
- [x] Step 3: Auto-close modal when all steps complete
- [x] Step 4: Update DCP iframe preview footer HTML
- [x] Step 5: Update DCP React preview component
- [x] Step 6: Bump widget version & build
