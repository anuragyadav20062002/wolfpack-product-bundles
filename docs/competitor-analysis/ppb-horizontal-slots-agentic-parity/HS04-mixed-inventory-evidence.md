# HS04 Mixed Inventory Evidence

Date: 2026-07-13

## EB baseline

Direct Chrome DevTools inspection opened Step 2 first after a cache-bypassing reload.

The active EB fixture demonstrated both required filtered states:

- `Massage Oil` originally has multiple variants, but only `Grapefruit` remains sellable. EB renders one grouped card, no selector, and a plain `Grapefruit` variant label.
- Fully unavailable configured products are omitted rather than rendered disabled or labelled out of stock.

The EB survivor label computed to `16px`, weight `500`, normal line height, and `rgb(30, 30, 30)`.

## Equivalent WPB fixture and live inventory

WPB Step 2 contains `Selling Plans Ski Wax` with three configured variants and `The Out of Stock Snowboard` with one configured unavailable variant.

The saved bundle payload's availability snapshot was stale relative to Shopify. The fresh storefront-products response was authoritative at render time:

- `Selling Plans Ski Wax`: first variant unavailable, `Special Selling Plans Ski Wax` sellable with quantity `1`, third variant unavailable;
- `The Out of Stock Snowboard`: fully unavailable.

Before the fix, WPB correctly selected the sole live Ski Wax variant, priced it at `$49.95`, showed `Only 1 left`, and omitted the fully unavailable snowboard. It did not expose the surviving variant's identity.

## Fix

The modal now renders a plain sole-variant label only when:

- the source product originally had multiple variants;
- inventory filtering leaves exactly one variant;
- the survivor has a non-default title.

Default-only and ordinary single-variant products do not receive redundant copy. The behavior is covered in `tests/unit/assets/ppb-modal-category-tabs.test.ts`.

## Live verification

After a cache-bypassing reload, widget `5.0.157` rendered:

- product title `Selling Plans Ski Wax`;
- plain variant label `Special Selling Plans Ski Wax`;
- no selector;
- price `$49.95`;
- low-stock badge `Only 1 left`;
- no `The Out of Stock Snowboard` card.

The label matches EB at `16px/500`, normal line height, and `rgb(30, 30, 30)`. At 390 x 844 it wraps inside the 143px content column without grid or document overflow.

## Result

HS04 is accepted for available, one-survivor, unavailable-variant, and fully unavailable-product behavior on desktop and mobile. Product/count differences from EB are recorded as store inventory and collection-fixture differences, not renderer deltas.
