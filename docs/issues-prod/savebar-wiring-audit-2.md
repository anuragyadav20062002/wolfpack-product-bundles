# Issue: Save Bar Wiring Audit — FPB + PDP Configure Routes

**Issue ID:** savebar-wiring-audit-2
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-15
**Last Updated:** 2026-05-15 20:30

## Overview

Full audit of every merchant-facing control in the FPB and PDP edit/configure routes to
ensure each control correctly: (1) marks the form dirty (shows App Bridge Save Bar),
(2) is included in the save payload, and (3) is reset on Discard.

Reference: Easy Bundles save/discard behaviour is the gold standard.

## Confirmed Bugs

### FPB (`app.bundles.full-page-bundle.configure.$bundleId/route.tsx`)

| # | State Variable | Issue |
|---|---|---|
| 1 | `discountMessagingMultiLanguageEnabled` | Marks dirty + saved, but NOT reset on Discard. No `originalRef` exists. |
| 2 | `ruleMessagesByLocale` | Marks dirty + saved, but NOT reset on Discard. No `originalRef` exists. |
| 3 | `pageSlug` (when `!bundle.shopifyPageId`) | Field is editable but `markAsDirty()` is behind `if (bundle.shopifyPageId)` guard — Save Bar never appears for new bundles. |

### PDP (`app.bundles.product-page-bundle.configure.$bundleId/route.tsx`)

| # | State Variable | Issue |
|---|---|---|
| 4 | `showProductPrices` | Marks dirty + saved, but NOT reset on Discard. No `originalRef`. Save baseline not updated after Save. |
| 5 | `showCompareAtPrices` | Same. |
| 6 | `cartRedirectToCheckout` | Same. |
| 7 | `allowQuantityChanges` | Same. |
| 8 | `sdkMode` | Same. |
| 9 | `textOverrides` | Same. |
| 10 | `textOverridesByLocale` | Same. |
| 11 | Navigation guard | PDP `handleBackClick` uses `confirm()` instead of App Bridge `leaveConfirmation`. |

## Phases Checklist

- [x] Phase 1 — FPB: add `originalRef` for `discountMessagingMultiLanguageEnabled` + `ruleMessagesByLocale`; reset in `handleDiscard`; update in save response handler
- [x] Phase 2 — FPB: remove `if (bundle.shopifyPageId)` guard from `pageSlug` `markAsDirty()` call
- [x] Phase 3 — PDP: add `originalRef` for all 7 missing Tier-2 fields; reset in `handleDiscard`; update in save response handler
- [x] Phase 4 — PDP: replace `confirm()` in `handleBackClick` with App Bridge `leaveConfirmation` pattern matching FPB
- [x] Phase 5 — Lint: 0 errors on both files

## Progress Log

### 2026-05-15 20:30 - Completed all fixes

- ✅ FPB: Added `originalDiscountMessagingMultiLanguageEnabledRef` + `originalRuleMessagesByLocaleRef` (useRef) next to their useState declarations
- ✅ FPB: `handleDiscard` now resets `discountMessagingMultiLanguageEnabled` and `ruleMessagesByLocale` to original values
- ✅ FPB: Save response handler now updates both new refs after successful save
- ✅ FPB: `pageSlug` `onInput` handler calls `markAsDirty()` unconditionally (removed `if (bundle.shopifyPageId)` guard)
- ✅ PDP: Added `originalRef` for all 7 missing Tier-2 fields: `showProductPrices`, `showCompareAtPrices`, `cartRedirectToCheckout`, `allowQuantityChanges`, `sdkMode`, `textOverrides`, `textOverridesByLocale`
- ✅ PDP: `handleDiscard` now resets all 7 Tier-2 fields from their originalRefs
- ✅ PDP: Save response handler now updates all 7 Tier-2 refs after successful save
- ✅ PDP: `handleBackClick` now uses App Bridge `leaveConfirmation` + toast (matches FPB pattern; removed `confirm()` browser dialog)
- ✅ Lint: 0 errors on both route files
- Files modified: `route.tsx` (FPB), `route.tsx` (PDP)

### 2026-05-15 20:00 - Starting implementation

- Audit completed by code-explorer agent; 11 confirmed bugs across FPB and PDP.
- Files to modify:
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`

## Related Documentation

- Issue: `docs/issues-prod/edit-bundle-ui-redesign-1.md` (parent UI redesign issue)
- Issue: `docs/issues-prod/savebar-discard-confirmation-fix-1.md` (prior savebar fix)
