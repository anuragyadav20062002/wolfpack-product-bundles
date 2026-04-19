# Issue: PDP Bundle Widget Audit — Free Gift & Core Flow

**Issue ID:** pdp-bundle-audit-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 18:00

## Overview

Full audit of the PDP (product-page) bundle widget at
`https://test-bundle-store123.myshopify.com/products/hello`
(bundle ID: `cmnhezavc0000fa2xitiscr8f`).

Configuration tested: **step condition-less, free gift enabled, pricing disabled**.

---

## Audit Results

### ✅ What Works Correctly

1. **Widget loads** — bundle config loaded from metafield (`data-bundle-config`), 3 slots rendered (Step 1, Step 2, Free Gift).
2. **Step 1 modal** — opens on click, shows 3 products with compare-at strikethrough prices (correct — reflects Shopify variant compareAtPrice, independent of bundle pricing).
3. **Step 2 modal** — opens on NEXT, shows 2 products correctly.
4. **Step navigation** — NEXT/BACK buttons, tab pills (Step 1 / Step 2 / Gift) all navigate correctly.
5. **Auto-advance** — selecting the required qty in a step auto-closes the modal and advances. ✅
6. **Button CTA updates** — "Add Bundle to Cart" disabled → "Complete All Steps to Continue" (when 1 step done) → "Add Bundle to Cart • ₹165.49" (when all paid steps done). ✅
7. **× remove badge** — clicking × on a filled slot correctly clears the selection and reverts button state. ✅
8. **Cart Transform MERGE** — all selected components are correctly merged into the bundle parent product. ✅
9. **Free gift priced at ₹0** — when free gift is selected and included in cart, Cart Transform correctly prices it at ₹0. ✅
10. **Cart metadata** — `_bundle_components`, `_bundle_total_retail_cents`, `_bundle_total_price_cents`, `_bundle_total_savings_cents`, `_bundle_discount_percent` all correctly written to cart item attributes. ✅
11. **Free gift re-locks** — when a paid step is cleared after the free gift was unlocked, the free gift slot correctly loses its click handler (can't open modal). ✅

---

### 🐛 Bugs Found

#### Bug 1 — CRITICAL: Free Gift Silently Dropped on Add to Cart
**Severity:** Critical
**File:** `app/assets/bundle-widget-product-page.js` — `buildCartItems()` + `updateAddToCartButton()`

**Description:**
When all paid steps are complete, the "Add Bundle to Cart" button is enabled even if the free gift step has NOT been selected. If the customer clicks "Add Bundle to Cart" without selecting the free gift, the free gift is silently omitted from the cart — no warning, no error.

**Reproduction:**
1. Select Step 1 and Step 2 products
2. Do NOT click the Free Gift slot
3. Click "Add Bundle to Cart"
4. Cart contains only 2 components (`_bundle_component_count: "2"`) — free gift missing

**Cart JSON evidence (without free gift):**
```json
{
  "_bundle_component_count": "2",
  "_bundle_components": "[[\"Citrus Breeze\",1,7499,7499,0,0],[\"Mystic Amber\",1,9050,9050,0,0]]"
}
```

**Expected:** The free gift should always be included. Options:
- **Option A (recommended):** Auto-select the free gift when all paid steps are complete and there's only 1 product in the step. Auto-add to `selectedProducts` in `buildCartItems()` if not already selected.
- **Option B:** Show a toast warning: "Don't forget your free gift!" and block Add to Cart until free gift is selected.
- **Option C:** `buildCartItems()` auto-injects the first available free gift product if the step is empty.

---

#### Bug 2 — Free Gift Modal Shows Full Retail Price (Confusing UX)
**Severity:** Medium
**File:** `app/assets/bundle-widget-product-page.js` — product card rendering inside modal

**Description:**
When the free gift modal opens, the product card shows the full retail price (e.g., ₹74.99) with no indication that this item will be free. Customers may think they are paying extra for the gift.

**Reproduction:**
1. Complete Steps 1 and 2
2. Click Free Gift slot
3. Gift product shows: ~~₹100.00~~ ₹74.99 (same format as paid products)

**Expected:** Free gift products in the gift step modal should display "FREE" or ₹0.00 instead of the retail price. The step type (`isFreeGift`) is available in context.

---

#### Bug 3 — Free Gift Slot Has No Locked Visual State (Classic Mode)
**Severity:** Low
**File:** `app/assets/bundle-widget-product-page.js` — `createFreeGiftSlotCard()`

**Description:**
In classic widget mode (non-bottom-sheet), the free gift slot looks identical whether it is locked (paid steps not complete) or unlocked (paid steps complete). There is no visual difference — both states show the same "+" icon, "Free Gift" label, and gift SVG badge.

In bottom-sheet mode, the locked state correctly adds `bw-slot-card--locked` CSS class. Classic mode has no equivalent.

**Impact:** Customers who click the free gift slot before completing paid steps get no feedback — click silently does nothing. No tooltip, no grey-out, no lock icon.

**Expected:** Classic mode locked free gift should visually indicate it's locked (grey out, reduced opacity, or lock icon) and optionally show a tooltip: "Complete the required steps to unlock your free gift".

---

#### Bug 4 — Free Gift Slot No Auto-Selection (Single-Product Step)
**Severity:** Medium
**File:** `app/assets/bundle-widget-product-page.js` — step completion handling

**Description:**
When all paid steps are completed and the free gift step contains only 1 available product, the widget should auto-select that product (similar to how `isDefault` steps are pre-seeded). Instead, the customer must manually click the gift slot, open the modal, and press "+".

**Reproduction:**
- Bundle has 3 steps: Step 1 (3 products), Step 2 (2 products), Gift (1 product)
- After completing Steps 1 and 2, the Gift slot still shows "+" with no selection

**Expected:** When `isFreeGiftUnlocked` becomes true and the free gift step has exactly 1 product available, auto-select it into `selectedProducts[freeGiftIndex]` and re-render the slot as filled.

---

#### Bug 5 — Free Gift Filled Slot Has Inconsistent Border Style
**Severity:** Low
**File:** `app/assets/bundle-widget-product-page.js` / CSS

**Description:**
Once the free gift is selected, its slot uses class `step-box bw-slot-card bw-slot-card--filled` which renders with a solid border. The paid step filled slots use class `step-box step-completed product-card-state` which renders with a dashed blue border. This creates a visual inconsistency in the slot strip.

**Expected:** All filled slots should use a consistent visual style.

---

## What Was NOT Tested (Requires Admin Config Changes)

The following scenarios require changing the bundle configuration in the app admin and re-syncing. They should be tested as a follow-up:

- [ ] Step conditions enabled (quantity / price thresholds unlock next step)
- [ ] Free gift disabled (only 2 required steps, no gift slot)
- [ ] Pricing enabled with percentage_off discount
- [ ] Pricing enabled with fixed_bundle_price discount
- [ ] Max quantity > 1 per step (multi-select)
- [ ] `displayVariantsAsIndividual` enabled (each variant shown separately)
- [ ] All steps with max quantity = 0 (edge case)

---

## Progress Log

### 2026-04-02 18:00 — Audit Complete (Phase 1)
- ✅ Tested full flow: condition-less + free gift enabled configuration
- ✅ Confirmed Cart Transform MERGE works correctly
- ✅ Confirmed free gift priced at ₹0 in cart when selected
- ✅ Confirmed × remove clears selection correctly
- ✅ Confirmed free gift re-locks when paid step cleared
- 🐛 Found 5 bugs (1 critical, 2 medium, 2 low)
- 🔲 Admin config change scenarios not yet tested

---

## Files to Change (for Bug Fixes)

- `app/assets/bundle-widget-product-page.js`
  - Bug 1: `buildCartItems()` — auto-inject free gift if step is empty
  - Bug 2: Product card rendering — show "FREE" for `isFreeGift` step products
  - Bug 3: `createFreeGiftSlotCard()` — add locked visual state in classic mode
  - Bug 4: Step completion handler — auto-select single free gift product

---

## Phases Checklist

- [x] Audit PDP widget — condition-less + free gift
- [ ] Fix Bug 1: Free gift silent drop (critical)
- [ ] Fix Bug 2: Free gift price display
- [ ] Fix Bug 3: Free gift locked visual state (classic mode)
- [ ] Fix Bug 4: Free gift auto-selection
- [ ] Test with step conditions enabled
- [ ] Test with pricing enabled
- [ ] Test with free gift disabled
