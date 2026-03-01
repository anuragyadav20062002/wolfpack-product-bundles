# Issue: Images & GIFs Section Revamp + Cart Transform Cleanup

**Issue ID:** images-gifs-revamp-1
**Status:** Completed
**Priority:** 🟢 Low
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Overview

Two UI improvements to admin configure pages:

1. **Cart Transform cleanup**: Remove unused `demo.jpeg` placeholder image from `app.bundles.cart-transform.tsx`. Replace with a structured Polaris feature list using `CheckCircleIcon`.

2. **Images & GIFs revamp**: Both full-page and product-page bundle configure pages had a plain, undifferentiated layout for the images_gifs section. Revamped with:
   - Section intro `Box` header (Media Assets)
   - Promo Banner card: `ImageIcon`, `Badge tone="info" "Page header"`, specs shelf, `Divider`, `FilePicker`
   - Loading Animation card: `RefreshIcon tone="magic"`, `Badge tone="magic" "Storefront"`, "APPEARS DURING" badge row, specs shelf, `Divider`, `FilePicker`

## Progress Log

### 2026-02-22 - Implementation Complete

- ✅ Removed `demo.jpeg` from `app.bundles.cart-transform.tsx`; replaced with Polaris `CheckCircleIcon` feature list
  - Added `Box`, `Icon` to Polaris imports, `CheckCircleIcon` to polaris-icons imports
- ✅ Revamped `images_gifs` section in full-page bundle configure route
  - Added section intro Box + differentiated Promo Banner and Loading Animation cards
  - Each card has: header row (icon + title + badge), "APPEARS DURING" badges (Loading Animation only), specs shelf Box, Divider, FilePicker
- ✅ Revamped `images_gifs` section in product-page bundle configure route
  - Added `Box` to Polaris imports
  - Same Loading Animation card pattern with section intro Box
- ✅ Lint: 0 errors

## Phases Checklist

- [x] Remove demo.jpeg from cart-transform
- [x] Revamp full-page configure images_gifs section
- [x] Revamp product-page configure images_gifs section
- [x] Lint + commit
