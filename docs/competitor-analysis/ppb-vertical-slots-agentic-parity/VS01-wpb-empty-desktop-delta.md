# VS01 WPB Empty Desktop Delta

Date: 2026-07-13
Viewport: `1280x800`
Widget version: `5.0.163`

## Runtime contract

After selecting Vertical Slots in the authenticated WPB Admin customization
flow and performing a cache-bypassed storefront reload, the live storefront
reported:

```text
wpbmix-template-type="PDP_MODAL"
wpbmix-template-id="SIMPLIFIED"
wpb-mix-consolidated-design="true"
```

The rendered shell used the expected Vertical Slots classes, including
`.bw-ppb-modal-slot-section--simplified` and
`.bw-ppb-modal-slot-grid--simplified`.

## Exact pre-change delta

| Measurement | EB | WPB | Delta |
| --- | ---: | ---: | --- |
| owner/row width | `345px` | `300px` | WPB is `45px` narrower |
| empty row height | `60px` | `104px` | WPB is `44px` taller |
| placeholder visual | `16x16px` | `80x80px` | WPB uses a product-card visual |
| inter-step group gap | `26px` | `26px` | matched |
| rows within a step | compact vertical rows | grid rows with `16px` gap | wrong WPB row contract |
| horizontal overflow | `0` | `0` | matched |

WPB preserves the correct two-row Step 1 and one-row Step 2 data shape, but
styles those rows as large cards. The required correction is confined to the
`SIMPLIFIED` Vertical Slots presentation contract; Horizontal Slots and the
other PPB templates must remain unchanged.

## Post-change verification

The source CSS now keeps the owner responsive to its host product column and
uses the compact row contract only under `PDP_MODAL + SIMPLIFIED + vertical`.

- desktop WPB: `372.34x60px` rows in the wider WPB host product column;
- mobile EB at `390x844`: `360x60px` rows;
- mobile WPB at `390x844`: `358x60px` rows;
- both mobile implementations: `16x16px` visual and 10px/700 labels;
- WPB desktop and mobile horizontal overflow: `0`.

The desktop width intentionally follows the available host product column.
Copying EB's `345px` store-specific width would violate the responsive,
content-driven storefront CSS requirement.
