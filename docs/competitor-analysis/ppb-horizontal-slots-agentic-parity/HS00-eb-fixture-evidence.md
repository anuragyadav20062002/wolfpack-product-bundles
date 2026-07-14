# HS00: EB fixture and initial desktop evidence

**Captured:** 2026-07-13
**Status:** EB evidence captured; WPB comparison pending

## Admin proof

The authenticated EB Admin bundle is `WPB PPB Product List Parity 2026-07-11`.
The Select template overlay exposed Product List, Horizontal Slots, Product Grid,
and Vertical Slots. Horizontal Slots was selected and the customization flow
reported the bundle ready before storefront preview.

The relevant visible help content was read before changing the fixture:

- The general setup article confirms the hierarchy Steps -> Categories ->
  Products and describes selection rules as progression/checkout gates.
- The Steps vs. Categories article defines Steps as separate navigation views and
  Categories as same-view product groupings.
- The Rules article states that Step Rules and Category Rules are mutually
  exclusive within a step and that Category Rules require multiple categories.

Those rule facts were already present in `internal docs/EB Implementation
Reference.md`; no duplicate vault update was required.

## Runtime contract proof

After clearing Cache Storage and reloading with cache bypass, the storefront body
reported:

```text
gbbmix-template-type="PDP_MODAL"
gbbmix-template-id="MODAL"
gbbmix-consolidated-design="true"
gbbmix-consolidated-design-version="1.2"
```

This proves the active template from runtime attributes rather than appearance.

## HS00 desktop empty state

Viewport: 1280 x 800. The native product-information host measured 345px wide.

- Horizontal Slots root: `.gbbMixProductPageCategoriesWrapperVStacked`
- Step 1 selected-products wrapper: 345 x 200
- Empty Product 1 card: approximately 104.33 x 200
- Empty Product 2 card: approximately 104.33 x 200
- Step 2 exposes one further empty Product 1 card
- Step 1 and Step 2 remain vertically separated while each step's required slots
  run horizontally

The fixture therefore proves the horizontal orientation contract without
confusing it with the vertical stacking of multiple steps.

## HS14 desktop picker-open state

Opening the first empty slot produced:

- `.gbbMixProductsModal.gbbMixProductsModalOpen`: x=0, y=120, 1280 x 680,
  fixed, `overflow-y: hidden`
- `.gbbMixModalHeader`: 1280 x 160
- `.gbbMixModalBody`: y=280, 1280 x 520, `overflow-y: auto`
- `.gbbMixModalFooter`: x=490, y=695.61, 300 x 84, absolute
- `.gbbMixProductsModalOverlay`: full 1280 x 800 fixed overlay
- close control positioned at x=1232, y=130 with a 38 x 38 box

This is baseline evidence only. Focus return, Escape behavior, selection,
replacement, removal, mobile geometry, and constrained-host behavior remain
unproven.

## Temporary evidence

- `HS00-baseline/eb-desktop-1280x800.png`
- `HS14-picker-open-close/eb-desktop-open-1280x800.png`

Both files are under `/private/tmp/ppb-remaining-template-parity/horizontal-slots/`
and must not be committed.
