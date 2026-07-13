# PG03 Category and Variant Evidence

Date: 2026-07-13

## Category switching

At `390x844`, EB and WPB both expose the long second category label without
horizontal overflow. Switching from Category 1 changes the visible product set
from six products to the single `18k Pedal Ring`; switching is in-place and does
not change the active step.

The Admin label includes `Empty Category`, but the persisted category is not
empty in either live storefront. Both runtimes resolve the same single product,
so the label is treated as fixture copy rather than a data assertion.

## Variant behavior

The shared product has size variants `6` through `11`.

EB Product Grid:

- renders the current variant title (`10`) as an 18px card detail;
- does not render an inline `select` in the current configuration;
- Add selects the current variant directly.

WPB Product Grid:

- the bundle's existing `Variant selector` setting is enabled;
- renders a full-card-width `163.5x26px` selector with options `6` through `11`;
- remains contained inside the two-column mobile grid with zero document
  overflow.

This is an explicit configuration/capability delta, not a CSS leak. EB exposes
no corresponding bundle-level Variant Selector switch on the inspected Bundle
Settings surface. WPB's merchant-enabled selector is retained because removing
merchant-controlled variant choice would be destructive and the broader parity
scope explicitly requires responsive variant-selector behavior.

## Fixture restoration

The temporary EB Pedal Ring selection was removed. WPB remained at zero
selections for this category pass. Both storefronts remain on Step 1.
