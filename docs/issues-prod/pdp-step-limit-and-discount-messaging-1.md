# Issue: PDP Step Limit Enforcement & Discount Messaging Fix

**Issue ID:** pdp-step-limit-and-discount-messaging-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-02-12
**Last Updated:** 2026-02-12 00:00

## Overview
Two bugs in the product-page (PDP) bundle widget:

1. **Step limit enforcement**: When a step has conditionValue=1 (limit of 1 product), clicking a completed step card should NOT open the modal. Instead, show a toast "Product limit reached for this step".

2. **Discount messaging not working**: Messages configured in admin never appear in storefront due to a chain of data-flow bugs:
   - Form doesn't include `showProgressBar`/`showFooter` in discountData
   - Handler uses `discountData.messages` (always undefined) instead of building from `ruleMessages`
   - Metafield sync reads `bundleConfiguration.messaging` (wrong path) instead of `bundleConfiguration.pricing.messages`
   - Widget never sets `config.showDiscountMessaging`/`showProgressBar` from bundle data

## Progress Log

### 2026-02-12 00:00 - Starting Implementation
- Analyzed full data flow from admin form → handler → metafield sync → widget

### 2026-02-12 00:10 - Completed All Fixes
**Task 1 - Step limit enforcement:**
- Modified `app/assets/bundle-widget-product-page.js`: When step limit is 1 and step is complete, clicking selected product card shows "Product limit reached for this step." toast instead of opening modal.

**Task 2 - Discount messaging fix (4-layer fix):**
1. `app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx` + full-page variant: Added `showProgressBar` and `showFooter` to discountData JSON submission
2. `app/routes/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` + full-page variant: Built messages from `ruleMessages` (per-rule) instead of non-existent `discountData.messages`; included `showDiscountMessaging` and `showProgressBar` flags
3. `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`: Fixed to read from `pricing.messages` (where handler stores data) instead of top-level `messaging` (which was always undefined); added `showDiscountMessaging` field
4. `app/assets/bundle-widget-product-page.js` + `bundle-widget-full-page.js` + `bundle-widget-full.js`: Fixed `updateMessagesFromBundle()` to read from metafield's `messaging` structure (`progressTemplate`/`successTemplate`) with fallback to legacy `pricing.messages` path; properly set `config.showDiscountMessaging` and `config.showProgressBar`

- ✅ Built widget bundles successfully

## Phases Checklist
- [x] Phase 1: Fix step limit enforcement in PDP widget
- [x] Phase 2: Fix discount messaging data flow (form → handler → metafield → widget)
- [x] Phase 3: Build widget bundles
- [ ] Phase 4: Test and verify
