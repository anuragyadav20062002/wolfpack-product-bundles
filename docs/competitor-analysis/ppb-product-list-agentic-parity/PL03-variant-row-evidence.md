# PPB Product List Variant Row Evidence

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

## Evidence Files

- EB desktop baseline: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/eb-desktop-variant-before.json`
- EB mobile baseline: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/eb-mobile-variant-before.json`
- WPB desktop before fix: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/wpb-desktop-variant-before.json`
- WPB mobile before fix: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/wpb-mobile-variant-before.json`
- WPB desktop post-fix: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/wpb-desktop-variant-after-font-fix.json`
- WPB mobile post-fix: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/wpb-mobile-variant-after-font-fix.json`
- EB selected variant `8`, desktop: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/eb-desktop-variant-selected8-final.json`
- EB selected variant `8`, mobile: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/eb-mobile-variant-selected8-final.json`
- WPB selected variant `8`, desktop before visual fix: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/wpb-desktop-variant-selected8-final.json`
- WPB selected variant `8`, mobile before visual fix: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/wpb-mobile-variant-selected8-final.json`

## Baseline Delta

EB renders the variant row as a 70px Product List row with the add action fixed at `90px x 32px`.

Desktop EB:
- Price: `16px`, `font-weight: 400`
- Variant selector: `27.5px` high, `14px` text, `1.5px solid rgb(192, 192, 192)`, `5px` radius, `2px` padding
- Add button: `90px x 32px`, `14px`, `font-weight: 700`, `5px` radius

Mobile EB:
- Price: `15px`, `font-weight: 400`
- Variant selector: `27.5px` high, `14px` text, `1.5px solid rgb(192, 192, 192)`, `5px` radius, `2px` padding

WPB before the fix rendered the selector with browser-default styling:
- Price: `14px`, `font-weight: 700`
- Selector: `25.5px` high, `11.2px` text, `1px` border, `4px` radius, `4px 6px` padding

## Fix

The Product List row renderer now marks rows that contain an inline variant selector with a Product List-scoped modifier class. The CASCADE stylesheet uses that class to align only variant rows:

- Three content rows: title, price, selector
- Selector dimensions and border treatment aligned to EB
- Desktop variant price set to `16px`, mobile variant price set to `15px`
- Add action remains fixed in the right action column

The fix is scoped to Product List (`PDP_INPAGE` + `CASCADE`) and does not change other PPB templates.

## Post-Fix WPB Metrics

Desktop WPB, widget `5.0.135`:
- Row: `70px` high
- Price: `16px`, `font-weight: 400`
- Selector: `27.5px` high, `14px` text, `1.5px solid rgb(192, 192, 192)`, `5px` radius, `2px` padding
- Add button: `90px x 32px`, `14px`, `font-weight: 700`, `5px` radius

Mobile WPB, widget `5.0.135`:
- Row: `70px` high
- Price: `15px`, `font-weight: 400`
- Selector: `27.5px` high, `14px` text, `1.5px solid rgb(192, 192, 192)`, `5px` radius, `2px` padding
- Add button keeps the Product List rounded-button behavior requested in the WPB parity pass.

## Variant Selection Behavior

Both EB and WPB preserve the selected variant identity when the visible option text `8` is selected and added.

EB drawer text includes:
`18k Pedal Ring - 8 x 1`

WPB drawer text includes:
`18k Pedal Ring - 8 x 1`

Earlier files named `*-after-select-add.json` used the wrong programmatic select value and should not be used for variant identity proof. The corrected files are the `*-selected8-final.json` captures.

## Verification

- Chrome DevTools MCP desktop capture, `1280 x 800`
- Chrome DevTools MCP mobile capture, `390 x 844`
- `npm run build:widgets`
- `npm run minify:assets css`
- `node --check app/assets/widgets/product-page/methods/inpage-render-methods.js`
- `node --check scripts/build-widget-bundles.js`

## 2026-07-12 Selector Alignment Recheck

Current EB evidence:
- EB desktop selector metrics: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/eb-current-desktop-variant-selector.json`
- EB desktop selected variant `8`: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/eb-current-desktop-selected8.json`
- EB narrow/mobile selector metrics: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/eb-current-mobile-variant-selector.json`

Current WPB evidence:
- WPB desktop before alignment fix: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/wpb-current-desktop-variant-selector.json`
- WPB desktop selected variant `8` before alignment fix: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/wpb-current-desktop-selected8.json`
- WPB desktop after alignment fix: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/wpb-current-desktop-variant-selector-after-left-align.json`
- WPB desktop selected variant `8` after alignment fix: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/wpb-current-desktop-selected8-after-left-align.json`
- WPB mobile after alignment fix: `/private/tmp/ppb-product-list-agentic-parity/PL03-variants/wpb-current-mobile-variant-selector-after-left-align.json`

EB keeps the variant selector flush with the left edge of the product details column. WPB matched the selector dimensions, typography, border, and selected-variant behavior, but inherited centered text alignment from the Product List row. That centered the `80%` width selector inside its wrapper and created a desktop left offset of about `17.7px`.

The fix is Product List CASCADE scoped:
- `.variant-selector-wrapper` is left-aligned only inside `.bw-ppb-cascade-product-row--has-variant-selector`.
- Desktop WPB post-fix: widget `5.0.137`, wrapper `text-align: left`, selector-to-wrapper delta `0px`.
- Mobile WPB post-fix at `390 x 844`: widget `5.0.137`, wrapper `text-align: left`, selector-to-wrapper delta `0px`.
- Selected variant behavior remains intact: selecting visible option `8` adds drawer text `18k Pedal Ring - 8 x 1`.
