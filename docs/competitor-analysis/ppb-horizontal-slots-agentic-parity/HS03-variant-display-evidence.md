# HS03 Variant Display Evidence

Date: 2026-07-13

## Configuration and served data

Direct Chrome DevTools inspection confirmed both Admin fixtures disable individual variant cards for the active category.

The WPB app-proxy bundle response independently confirmed:

- `steps[0].displayVariantsAsIndividual = false`
- `steps[0].categories[0].displayVariantsAsIndividualProducts = false`
- Pedal Ring is one product with six available variants: `6`, `7`, `8`, `9`, `10`, and `11`

## EB baseline

EB renders six cards in Category 1. The Pedal Ring is a single product card with a native selector containing variants `6–11`.

Changing the selector from `6` to `8`, allowing the state update to settle, and adding the product returns variant `8` to the slot.

## Pre-change WPB delta

WPB received the correct grouped configuration and grouped API product, but rendered eleven cards by expanding all six Pedal Ring variants. The first app-owned failing boundary was `renderModalProducts()`, which called `expandProductsByVariant()` unconditionally after category filtering.

## Fix

Modal rendering now resolves the active category's variant-display flag:

- `false`: retain grouped products and render the existing variant selector;
- `true`: expand variants into individual cards as before.

The behavior is covered for both branches in `tests/unit/assets/ppb-modal-category-tabs.test.ts`.

## Live verification

After a cache-bypassing reload, WPB served widget `5.0.155` and rendered the same six Category 1 products as EB. Pedal Ring appeared once with options `6–11`.

Selecting variant `8` synchronized the WPB card, button, and returned slot to variant ID `48720161210627`; the filled slot text and image alt were `18k Pedal Ring - 8`.

## Result

Grouped versus individual modal rendering and selected-variant identity are accepted on both EB and WPB.
