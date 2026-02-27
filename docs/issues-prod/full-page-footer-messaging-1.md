# Issue: Full-Page Footer Discount Messaging Not Using Merchant Templates

**Issue ID:** full-page-footer-messaging-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-21
**Last Updated:** 2026-02-21 03:10

## Overview

The footer discount message on full-page bundles always shows the hardcoded default template
("Add {conditionText} to get {discountText}") instead of the merchant's configured template
from the Discount Messaging section.

## Root Cause

`updateMessagesFromBundle()` reads from `this.selectedBundle?.messaging`
(the metafield format used by product-page bundles). Full-page bundles load their data
via the API endpoint, which returns messages at `this.selectedBundle?.pricing?.messages`
(with keys `progress` / `qualified` instead of `progressTemplate` / `successTemplate`).
`this.selectedBundle.messaging` is always `undefined` for full-page bundles, so the
function falls to the else-branch and never updates `discountTextTemplate`.

## Fix

Extend `updateMessagesFromBundle()` to also read from `pricing.messages` when the top-level
`messaging` field is absent (i.e., full-page bundle API path).

Key mapping:
- `pricing.messages.progress` → `discountTextTemplate`
- `pricing.messages.qualified` → `successMessageTemplate`
- `pricing.messages.showProgressBar` → `showProgressBar`

## Progress Log

### 2026-02-21 03:00 - Implementing Fix

Files to modify:
- `app/assets/bundle-widget-full-page.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuild)

### 2026-02-21 03:10 - Fix Applied and Committed

- ✅ Extended `updateMessagesFromBundle()` with `else if (pricingMessages)` branch
- ✅ Maps `pricingMessages.progress` → `discountTextTemplate`
- ✅ Maps `pricingMessages.qualified` → `successMessageTemplate`
- ✅ Maps `pricingMessages.showProgressBar` → `showProgressBar`
- ✅ Widget rebuilt (192.1 KB), 0 ESLint errors
- Files modified: `bundle-widget-full-page.js`, `bundle-widget-full-page-bundled.js`

## Phases Checklist

- [x] Fix `updateMessagesFromBundle()` to read `pricing.messages` as fallback
- [x] Widget rebuild
- [x] Lint + commit
