# PG00 EB Runtime and Responsive Baseline

Date: 2026-07-13

## Required help content read

Before changing the shared EB fixture, all visible setup/help links on the
relevant configure surface were opened and read:

- First-bundle setup: product-page builders integrate into the product discovery
  flow; steps contain categories which contain products; rule gates must be met
  before progression.
- Steps vs. Categories: steps are separate navigation views; categories are
  same-view product sections.
- Rules: step and category rules are mutually exclusive; exact and range rules
  gate selection/progression; category rules require multiple categories.

These facts already exist in `internal docs/EB Implementation Reference.md`, so
no duplicate vault note was added.

## Runtime contract

The authenticated Select template overlay exposed all four PPB templates.
Product Grid was selected and the customization flow reported the bundle ready.
After a cache-bypassed storefront reload, direct runtime evidence showed:

```text
gbbmix-template-type="PDP_INPAGE"
gbbmix-template-id="COGNIVE"
gbb-mix-consolidated-design="true"
gbbmix-consolidated-design-version="1.2"
```

The runtime bundle entry for `MIX-156854` independently reported
`PDP_INPAGE + COGNIVE`.

## Desktop baseline

Viewport: `1280x800`; native product-information host/grid width: `345px`.

- wrapper: `.gbbMixCascadeProductsWrapper.gbbMixCogniveProductsWrapper`
- columns: `97.6562px 97.6719px 97.6562px`
- gap: `15px`
- padding: `0 8px 15px`
- square card image: approximately `97.66x97.66px`
- title region: `36px` high
- action region: `32px` high
- document horizontal overflow: `0`

## Mobile baseline

Viewport: `390x844`; product grid width: `360px`.

- columns: `164.5px 164.5px`
- gap: `15px`
- padding: `0 8px 15px`
- first-row cards: `164.5x272.5px`
- document horizontal overflow: `0`

EB therefore changes from three columns in the narrow desktop product host to
two columns at the real mobile viewport. The implementation must remain
container-responsive; neither column count nor card width may be inferred from
viewport width alone.

## Open evidence

WPB comparison and all interaction/selection/discount/loading/placement states
remain unproven. The EB storefront currently retains two Step 1 selections from
the preceding audit and must be restored before this lane closes.
