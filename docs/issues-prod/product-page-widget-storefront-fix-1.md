# Issue: Product Page Bundle Widget Not Showing on Storefront

**Issue ID:** product-page-widget-storefront-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 17:00

## Overview

Product page bundle widget was visible in the Shopify theme editor but not on the live storefront when `bundle_id` was set in block settings. Root cause: `request.design_mode` guard prevented the `block.settings.bundle_id` fallback from activating outside the theme editor.

## Root Cause

`extensions/bundle-builder/blocks/bundle-product-page.liquid` line 284 had:

```liquid
{% if request.design_mode and block.settings.bundle_id and block.settings.bundle_id != blank %}
```

The `request.design_mode` guard meant the fallback only fired in the Shopify theme editor, never on the live storefront. Merchants who set `bundle_id` in their theme block settings would see the widget in the editor but not on the actual product page.

## Fix

Removed `request.design_mode` condition so the `block.settings.bundle_id` override works on both theme editor and storefront:

```liquid
{% if block.settings.bundle_id and block.settings.bundle_id != blank %}
```

## Phases Checklist

- [x] Phase 1: Fix Liquid guard condition ✅ Completed

## Progress Log

### 2026-03-17 17:00 - Fix Applied
- ✅ Removed `request.design_mode` from condition on line 284 of `bundle-product-page.liquid`
- ✅ Widget now shows on storefront when `bundle_id` is set in block settings
- ✅ Files Modified:
  - `extensions/bundle-builder/blocks/bundle-product-page.liquid` (line 284)
- Impact: Product page bundle widget now renders correctly on storefront
- Note: Primary render path (via `bundle_ui_config` metafield on product variant) is unaffected

**Status:** Ready for deploy
