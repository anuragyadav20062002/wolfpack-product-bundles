# Issue: Hide underscore-prefixed bundle properties in storefront cart

**Issue ID:** hide-bundle-cart-properties-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-19
**Last Updated:** 2026-03-19 12:15

## Overview

Some merchant themes don't follow Shopify's convention of hiding line item properties prefixed with `_`. This causes internal bundle metadata (`_is_bundle_parent`, `_bundle_name`, `_bundle_components`, etc.) to be displayed to shoppers in the cart page/drawer.

These properties are set by our Cart Transform extension and needed by the Checkout UI extension, so they can't be removed. The fix is to inject a JS snippet via an app embed block that hides them from the storefront DOM.

## Progress Log

### 2026-03-19 12:00 - Planning Complete
- Analyzed the issue: merchant theme at ballersingod.shop showing all `_` prefixed properties
- Identified root cause: theme doesn't filter `_` prefixed properties per Shopify convention
- Plan: Add app embed block with JS to hide `_` prefixed cart properties
- Files to create: `extensions/bundle-builder/blocks/bundle-property-hider.liquid`
- Files to modify: `extensions/bundle-builder/shopify.extension.toml`
- Next: Begin implementation

### 2026-03-19 12:05 - Phase 1 & 2: Implementation Complete
- Created `extensions/bundle-builder/blocks/bundle-property-hider.liquid` (app embed block)
  - Inline JS scans cart DOM for elements with `_` prefixed text content
  - Hides matching elements and their value siblings (dt/dd pairs, etc.)
  - MutationObserver handles dynamic cart drawers and AJAX carts (200ms debounce)
  - Works across different theme structures via broad selector strategy
- Modified `extensions/bundle-builder/shopify.extension.toml`
  - Added `[[extensions.blocks]]` with `target = "body"` for app embed
- Next: Lint, commit, and deploy

### 2026-03-19 12:15 - Phase 3: Admin UI Banners Added
- Added info banner to onboarding Step 2 (Install Widget) with instructions to enable Bundle Property Hider app embed
- Added dismissible info banner to dashboard above the bundles table
- Both banners include numbered steps: Online Store → Customize → App embeds → Toggle on
- Files modified:
  - `app/routes/app/app.onboarding.tsx` (added Banner with List after the warning note)
  - `app/routes/app/app.dashboard/route.tsx` (added Banner import, info banner section)
- Lint: 0 errors, only pre-existing warnings

## Phases Checklist

- [x] Phase 1: Create app embed block with property-hiding JS
- [x] Phase 2: Register block in extension TOML
- [x] Phase 3: Add admin UI banners to inform merchants
- [ ] Phase 4: Test and verify
