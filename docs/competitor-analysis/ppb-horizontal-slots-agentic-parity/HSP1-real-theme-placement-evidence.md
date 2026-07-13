# HSP1 Real Theme Placement Evidence

Date: 2026-07-13

## Scope

This pass used the authenticated Shopify Theme Editor and live active Horizon
theme. No synthetic placement board, cloned widget, width override, or theme-file
edit was used. WPB widget `5.0.160` remained on the Horizontal Slots fixture.

## Standalone Apps section attempt

The configure page's `Place Widget` flow opened Shopify's documented
`target=newAppsSection` deep link. A real Bundle Builder Apps section was added,
given the current bundle ID, saved, and inspected on the live bundle product.

The live page briefly contained two app roots: the existing product-form block
and the new Apps-section block. Runtime relocation moved both roots into the
native product-form component. Each measured `328px` wide in the mobile-emulated
state and carried `bundle-widget-container--product-form-mounted` plus
`data-mounted-after-product-form=true`.

This is the established PPB placement contract, not a responsive CSS failure:
the current EB reference renders in the native Buy buttons/product-form footprint,
and WPB `_relocateContainerToProductForm` provides that equivalent. A standalone
full-width section is not a supported final mount for this PPB surface, even when
Shopify initially inserts the section elsewhere.

The temporary Apps section was removed and the theme save confirmed. A fresh live
reload returned exactly one widget root.

## Real approximately-520px placement

The active Horizon Product information section exposes a real `Equal columns`
layout setting. It was enabled and saved temporarily. At an actual 1180 x 800
desktop viewport, the live mounted geometry was:

- product-details column: `544.5px`;
- widget root: `520.5px`;
- three empty Step 1 slot tracks: `162.828125px` each;
- final CTA width: `520.5px`;
- document horizontal overflow: `0`.

Opening the picker in the same placement produced a `1180px` responsive bottom
sheet, `1169px` modal body client/scroll width, `550px` client height versus
`878px` scroll height, a reachable `300px` footer, and zero document overflow.
The internal body remained the only overflow surface.

At 1440 x 900 with the same real theme setting, the widget expanded to `650.5px`
without document overflow, proving it was responding to the mounted product
column rather than a captured fixed width.

## Restoration

The Equal columns setting was turned off and saved. The final cache-bypassed
1280 x 800 reload returned:

- one widget root;
- default product-information widget width `372.34375px`;
- zero selected products;
- zero document horizontal overflow.

## Result

HSP1 accepts the real 520px placement. Full-width standalone Apps-section
placement is recorded as not applicable under the EB-aligned PPB product-form
ownership contract, with the actual Shopify insertion/relocation behavior proven
rather than inferred.
