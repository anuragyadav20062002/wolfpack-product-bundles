# Test Spec: FPB Classic Fixed Price Cart Display
**Spec ID:** fpb-classic-fixed-price-cart-display  **Created:** 2026-07-04

## Purpose
Validate the Classic storefront fixed-bundle-price cart path against current EB evidence: Classic shows the fixed-price tier label in the summary, but cart submission keeps the parent bundle price at the selected products' raw total.

## Test Cases
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Classic fixed bundle price storefront payload | Classic FPB with a qualifying `fixed_bundle_price` rule and two paid selected products | `/cart/add.js` component lines include display-only pricing marker, Box/Items display metadata, no savings metadata | Keeps Standard/non-Classic behavior untouched |
| 2 | Cart transform display-only fixed bundle price | Component lines carry the display-only marker and parent metafield has `fixed_bundle_price` | MERGE operation uses 0% price decrease, raw component total, no savings attributes | Mirrors EB C05 fixed-price cart proof |

## Acceptance Criteria
- [x] Classic fixed-price cart payload does not emit `youSave` metadata.
- [x] Display-only fixed-price lines keep the merged parent price at raw selected-products total.
- [x] Other pricing methods and presets keep the existing discount path.
