# VS00 EB Empty Desktop Baseline

Date: 2026-07-13
Viewport: `1280x800`

## Setup

The authenticated Select template overlay exposed all four PPB templates.
Vertical Slots was selected and the customization flow reported the bundle
ready. The general setup, Steps vs. Categories, and Rules help articles had been
read in full immediately before the remaining-template implementation work;
their durable facts already exist in `internal docs/EB Implementation
Reference.md`.

Both store sessions were at zero selections before switching templates.

## Runtime contract

After cache-bypassed reload, the live storefront reported:

```text
gbbmix-template-type="PDP_MODAL"
gbbmix-template-id="SIMPLIFIED"
gbb-mix-consolidated-design="true"
gbbmix-consolidated-design-version="1.2"
```

## Empty geometry

- owner: `345px` wide;
- wrapper:
  `.gbbMixProductPageCategoriesWrapper.gbbMixProductPageCategoriesWrapperVStacked`;
- wrapper geometry: `345x284px`;
- step-group gap: `26px`;
- Step 1: two empty rows;
- Step 2: one empty row;
- every row: `345x60px`;
- inner content: `341x41px`, row-reverse, 8px gap;
- placeholder icon: `16x16px`, aligned at the right edge;
- Product label remains at the left edge;
- category and step names exist in DOM but are visually hidden inside each row;
- document horizontal overflow: `0`.

This proves Vertical Slots is a distinct full-width row contract. It is not the
Horizontal Slots card track with a single flex-direction change.
