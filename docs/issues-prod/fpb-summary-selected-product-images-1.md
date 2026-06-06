# Issue: FPB Summary Selected Product Images
**Issue ID:** fpb-summary-selected-product-images-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-06
**Last Updated:** 2026-06-06 00:53

## Overview
Selected products can fail to render product images in FPB summary card product slots when the selected item image data is not a plain `imageUrl` string. Summary renderers need one consistent image-source resolver for product, variant, and Shopify image-object shapes.

## Progress Log
### 2026-06-06 00:48 - Investigation Started
- Reproduced the local FPB preview with a hard reload and confirmed the first desktop selected product can render an image on the current bundle.
- Identified fragile summary image rendering paths that read `item.image || item.imageUrl` or only `item.imageUrl`, which can break for Shopify-style image objects and variant-expanded selected products.
- Next: add a focused regression spec, normalize selected product summary image source resolution, rebuild widgets, and verify in Chrome.

### 2026-06-06 00:50 - Summary Copy Adjustment
- Added the user-requested scope to remove the trailing `!` from the summary sidebar discount prompt, for example `Add 2 product(s) to save 10%`.
- Next: keep the change scoped to summary sidebar rendering and verify with the selected-product image fix.

### 2026-06-06 00:50 - Implemented and Verified
- Added a shared FPB selected-product image source resolver for summary renderers so desktop sidebar rows, mobile compact summary rows, and footer thumbnails support URL strings, Shopify image objects, featured images, and variant image data.
- Routed the summary sidebar discount prompt through a formatter that removes only a trailing exclamation mark.
- Bumped widget version to `3.0.18` and rebuilt widget assets.
- Chrome local dev verification on `agent-5sfidg3m.myshopify.com` loaded `3.0.18`, showed `Add 2 product(s) to save 10%`, and rendered the selected summary slot image with a real Shopify CDN URL.

### 2026-06-06 00:53 - Commit Prep
- Staging only the FPB summary image/sidebar copy fix, focused regression coverage, issue/spec, version bump, and rebuilt widget assets.
- Leaving unrelated screenshots, parity captures, and older dirty files out of the commit.

## Related Documentation
- `test-spec/fpb-summary-selected-product-images.spec.md`

## Phases Checklist
- [x] Phase 1: Add failing selected-summary image normalization test
- [x] Phase 2: Normalize image source resolution for FPB selected product summaries
- [x] Phase 3: Build widget bundle and verify in Chrome
