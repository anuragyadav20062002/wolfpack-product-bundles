# Issue: Bundle Settings UI Parity — FPB + PPB

**Issue ID:** bundle-settings-ui-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-08
**Last Updated:** 2026-06-08 23:30

## Overview

Fresh live audit of EB's Bundle Settings for both FPB and PPB. Identified gaps and UI differences.
Implementing 100% parity as instructed.

## Audit Findings (from live EB inspection)

### EB PPB Bundle Settings
1. Pre Selected Product — toggle + "Default products title" text field + Browse Products (resource picker) + badge
2. Enable Quantity Validation — checkbox + max qty input
3. Pre-order & Subscription Integration — checkbox + when enabled: radio buttons (ALL_PRODUCTS / OOS_PRODUCTS) with descriptions
4. Cart line item discount display — radio (Use app defaults / Customize)
5. Bundle Level CSS — collapsible
6. Bundle Status — combobox (Active / Draft)

### EB FPB Bundle Settings
Same as PPB plus: Product Slots (sub of Qty Validation), Slot Icon, Variant Selector, Show Text on + Button, Bundle Cart, Bundle Banner sections.

### EB showFor options (confirmed from live toggle)
- "Show for all products" → `ALL_PRODUCTS` — "Display selling plan options on every product in the bundle."
- "Show only for out of stock products" → `OOS_PRODUCTS` — "Display selling plan options only when a product is out of stock (e.g. for pre-orders)."

## Gaps vs Wolfpack

### FPB
- `defaultProductsData` state missing entirely — no "Default products title" field
- "Browse Products" navigates to step_setup instead of opening Shopify resource picker
- `defaultProductsData` not included in save formData → not persisted
- FPB handler does not parse or save `defaultProductsData`
- "Apply to products" uses `s-select` but EB uses radio buttons with descriptions

### PPB
- "Apply to products" uses `s-select` but EB uses radio buttons with descriptions
- showFor labels abbreviated ("All products" / "Out of stock products") vs EB's full descriptions

## Implementation Plan

### Phase 1 — FPB: Add defaultProductsData (Pre Selected Product title + resource picker)
- Import `buildDefaultProductEntryFromPicker`, `normalizeDefaultProductsData`, `DefaultProductsData` from `~/lib/bundle-config/default-products`
- Add `defaultProductsData` state, useMemo init, useRef
- Add `buildDefaultProductsData` useCallback
- Add `defaultProductsData` to saveBundle formData
- Update Pre Selected Product UI: use `defaultProductsData.isDefaultProductsEnabled` toggle, add "Default products title" field, change Browse Products to resource picker, add selected count badge
- Update FPB handler: parse `defaultProductsData` from formData, add to Prisma update

### Phase 2 — FPB + PPB: Change "Apply to products" from s-select to radio buttons
- Replace `s-select` with two radio inputs matching EB's UI labels and descriptions
- Both FPB and PPB routes

## Files Modified

| File | Change |
|---|---|
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Add defaultProductsData state + useCallback, update Pre Selected Product UI, update Apply to products to radio buttons |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Parse + persist defaultProductsData |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | Update Apply to products to radio buttons |

## Progress Log

### 2026-06-08 22:00 - Planning Complete
- ✅ Performed fresh live audit of EB PPB Bundle Settings via a11y tree
- ✅ Confirmed showFor radio button options (ALL_PRODUCTS / OOS_PRODUCTS)
- ✅ Compared Wolfpack FPB and PPB Bundle Settings with EB
- ✅ Identified all gaps
- ✅ Created issue file

### 2026-06-08 23:30 - All Phases Completed
- ✅ Phase 1 — FPB defaultProductsData:
  - Added imports: `buildDefaultProductEntryFromPicker`, `normalizeDefaultProductsData`, `DefaultProductsData`
  - Added `initialDefaultProductsData` useMemo, `defaultProductsData` useState, `originalDefaultProductsDataRef` useRef
  - Added `buildDefaultProductsData` useCallback
  - Added `defaultProductsData` to `handleSave` formData and dependency array
  - Updated Pre Selected Product UI: toggle now uses `defaultProductsData.isDefaultProductsEnabled`, added "Default products title" s-text-field, changed "Browse Products" to use `shopify.resourcePicker`, added selected count badge
  - Updated `handlers.server.ts`: parses `defaultProductsData` from formData, conditionally spreads into Prisma update
- ✅ Phase 2 — Apply to products radio buttons:
  - FPB: replaced `s-select` with EB-matching radio buttons (ALL_PRODUCTS / OOS_PRODUCTS) with full descriptions
  - PPB: replaced `s-select` with EB-matching radio buttons (ALL_PRODUCTS / OOS_PRODUCTS) with full descriptions
- ✅ Removed temp investigation files (ppb-save-request.network-request, ppb-save-response.network-response)
- ✅ ESLint: 0 errors on all modified files
- ✅ TypeScript: no new errors introduced

## Phases Checklist
- [x] Phase 1: FPB — Add defaultProductsData state, UI, and handler persistence ✅
- [x] Phase 2: FPB + PPB — Change "Apply to products" to radio buttons ✅
