# Issue: Conditionless Bundles — Add to Cart at Any Step

**Issue ID:** fpb-conditionless-add-to-cart-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-31
**Last Updated:** 2026-03-31 02:00

## Overview

When a bundle has no step conditions configured on any step, the customer should be able to add the bundle to cart at any step — not forced to navigate all the way to the last step first.

## Root Cause

The CTA button ("Next" / "Add to Cart") was gated behind `isLastStep`. In a conditionless bundle, there is nothing to enforce at each step so requiring the customer to click through every step before seeing "Add to Cart" is unnecessary friction.

## Fix

Added `bundleHasNoConditions()` helper that returns `true` when every non-free-gift, non-default step has no `conditionType`, `conditionOperator`, or `conditionValue` set.

When this returns `true`:
- CTA button text is always "Add to Cart" (all steps)
- Button is enabled as soon as at least 1 item is selected across any step
- Clicking the button calls `addBundleToCart()` immediately
- Step-tab / Back navigation still works normally

All three button surfaces updated: floating footer CTA, sidebar desktop nav button, sidebar mobile CTA.

## Phases Checklist

- [x] Phase 1: Add `bundleHasNoConditions()` helper + update 3 button surfaces ✅
- [x] Phase 2: Build (WIDGET_VERSION → 2.4.3) + lint + commit ✅

## Progress Log

### 2026-03-31 02:00 - Implemented and Built

- ✅ Added `bundleHasNoConditions()` method to `BundleWidgetFullPage` (after `areBundleConditionsMet()`)
- ✅ Updated floating footer CTA (`_createFooterBar`) — lines ~2266
- ✅ Updated sidebar desktop nav button — lines ~1193
- ✅ Updated sidebar mobile CTA button — lines ~990
- ✅ Files modified:
  - `app/assets/bundle-widget-full-page.js`
  - `scripts/build-widget-bundles.js` (WIDGET_VERSION 2.4.2 → 2.4.3)
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuilt)
  - `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` (rebuilt)
- ✅ CSS sizes: full-page 96,061 B (under 100,000 B limit)
- ✅ ESLint: 0 errors
