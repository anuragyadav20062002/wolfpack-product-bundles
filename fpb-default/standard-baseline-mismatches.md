# FPB Default / Standard Baseline Mismatches

**Created:** 2026-06-12

## Scope

Loop 0 baseline for FPB Default / Standard storefront parity.

Only these presets are in scope:

- WPB: `[data-fpb-design-preset="DEFAULT"]`
- EB: `gbb-bundle-design-preset-id="DEFAULT_FBP"`

## Evidence

### WPB Standard

- URL: `https://agent-5sfidg3m.myshopify.com/pages/wpb-fresh-fpb-template-parity-2026-06-04`
- Bundle fixture: `cmpznom360001v0wqjqm3cv3a`
- Runtime version: `3.0.26`
- Root marker: `bundle-widget-container bundle-widget-full-page fpb-d fpb-preset-default`
- Data marker: `data-bundle-type="full_page"`, `data-fpb-design-preset="DEFAULT"`
- Loaded CSS:
  - `bundle-widget-full-page.css`
  - `bundle-widget-full-page-standard.css` with `data-wpb-fpb-template-css="STANDARD"`
- Desktop metrics: `/private/tmp/fpb-default-wpb-loop0-standard-desktop.json`
- Desktop screenshot: `/private/tmp/fpb-default-wpb-standard-desktop-1440-loop0.png`

### EB Standard Reference

- URL: `https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/2?page=addProductsPage1&currentFlow=byob`
- Runtime marker: `gbb-bundle-design-preset-id="DEFAULT_FBP"`
- Runtime settings: `bundleDesignPresetId="DEFAULT_FBP"`, `bundleDesignTemplate="FBP_SIDE_FOOTER"`
- Loaded CSS includes:
  - `easy-bundle-min.css`
  - `easy-bundle-full-page-min.css`
- Desktop metrics: `/private/tmp/fpb-default-eb-loop0-standard-desktop.json`
- Desktop screenshot: `/private/tmp/fpb-default-eb-standard-desktop-1440-loop0.png`
- Mobile metrics, captured before desktop emulation reset: `/private/tmp/fpb-default-eb-loop0-standard.json`
- Mobile screenshot: `/private/tmp/fpb-default-eb-standard-desktop-loop0.png`

## Loop 0 Findings

### Routing / Ownership

- WPB `DEFAULT` and `STANDARD` both resolve to `bundle-widget-full-page-standard.css` in the theme extension blocks.
- Runtime normalization maps EB-style `DEFAULT_FBP` and admin-style `STANDARD` to WPB `DEFAULT`.
- WPB Standard-specific styling is already concentrated in `app/assets/widgets/full-page-css/templates/side-footer-standard.css`.
- Live WPB storefront now loads base full-page CSS first and Standard CSS after it.

### Baseline Setup Drift

- WPB started with stale storefront cache rendering `HORIZONTAL` even though the Admin template modal showed Standard selected.
- The Admin "View your bundle" flow refreshed the page metafield/cache and restored live WPB to `DEFAULT`.
- EB also started live storefront rendering `HORIZONTAL`; switching the EB Admin template modal to Standard restored EB storefront to `DEFAULT_FBP`.
- Do not use either storefront for parity evidence until the live DOM marker is checked first.

### Product Card Baseline

At 1440x900 desktop, the first visible product card geometry is close but not fully identical:

| Element | EB | WPB | Mismatch |
| --- | --- | --- | --- |
| Card | `297 x 352` | `297 x 352` | Size matches |
| Image | `281 x 240` | `281 x 240` | Size matches |
| Title block | `281 x 40` | `281 x 40` | Size matches |
| Action row | `281 x 35` | `241 x 35` row plus separate button | Ownership differs |
| Price text | `165 x 21` | `66 x 35` | WPB price line box is too tall / narrow |
| Product count | `2` visible EB products | `6` WPB products | Fixture data differs |

### Layout Baseline

- EB page body starts at y=180; WPB widget root starts at y=151. This is partly theme/header difference and should not be treated as template mismatch until same host/theme conditions are isolated.
- EB body wrapper width is `1349`; WPB content wrapper width is also `1349`.
- EB product grid starts at x=38 and width `920`; WPB product grid starts at x=38 and width `920`.
- EB first product card starts at y=1106; WPB first product card starts at y=1090. The relative product-card internals are closer than the absolute page y positions.
- EB desktop progress bar is `405 x 6`; WPB Standard timeline progress bar is `1136 x 6`. This is a real Standard navigation/progress parity gap.

## First Mismatch List

1. **Progress / timeline width mismatch**
   - EB Standard desktop progress bar spans only between the visible Standard steps (`405px` in the captured two-step reference).
   - WPB Standard progress bar spans across the full five-step timeline (`1136px`).
   - Next slice should measure the timeline DOM for same step count before changing CSS, because current fixtures have different step counts.

2. **Price/action row typography mismatch**
   - EB price text line box is `21px` high inside a `35px` action row.
   - WPB price text line box measures `35px`, making the price occupy the full action row height.
   - This is a scoped product-card CSS candidate under `[data-fpb-design-preset="DEFAULT"]`.

3. **Same-to-same fixture gap**
   - Current live EB and WPB bundles are both Standard but do not use the same product set, step count, currency, or discount configuration.
   - Exact final parity needs either a same-config EB/WPB fixture pair or a deliberate narrower comparison of geometry-only template behavior.

4. **Cache drift risk**
   - Both storefronts were initially on Horizontal despite the target plan being Standard.
   - Every parity loop must assert the live preset marker before capture.

## Next Slice

Start with product-card action row parity because card/image/title sizing already matches and the change can stay scoped to Standard CSS.

## Implemented Slice 1

- Adjusted Standard product-card price and strike-price line-height to match EB's smaller text line box inside the stable `35px` action row.
- Desktop Standard product-card price line-height: `21px`.
- Mobile Standard product-card price line-height: `18px`.
- Scope stayed under `[data-fpb-design-preset="DEFAULT"][data-fpb-card-cta-mode="icon"]`.
- Regenerated `extensions/bundle-builder/assets/bundle-widget-full-page-standard.css` with `npm run minify:assets css`.

## Implemented Slice 2

- Migrated Standard selected-card layout away from the old expanded-card behavior.
- Desktop selected product card now remains at `var(--standard-card-height, 352px)` instead of adding `53px`.
- Mobile selected product card now remains at `var(--mh, 264px)` instead of adding `53px`.
- Desktop selected action row uses a two-column grid with a `110.25px` quantity slot.
- Mobile selected action row uses a two-column grid with a `70px` quantity slot.
- The inherited quantity morph animation is disabled for the Standard selected state so the Standard-owned quantity width wins without `!important`.
- Selected quantity plus/minus buttons are hidden and the selected quantity display is centered, matching the EB Standard selected-card behavior observed in the reference fixture.
- Selected overlay is hidden with a Standard-scoped selector and no new `!important`.
- Regenerated `extensions/bundle-builder/assets/bundle-widget-full-page-standard.css` with `npm run minify:assets css`.

### Slice 2 Verification Evidence

- Hard reload still served Shopify CDN asset `wolfpack-product-bundles-sit-319`, so deployed live CSS remained stale after reload.
- Desktop deployed-state check before local override: `/private/tmp/fpb-default-wpb-hardreload-desktop-check.json`.
- Desktop local built-rule verification: `/private/tmp/fpb-default-wpb-local-selected-desktop-no-important-check.json`.
  - Card: `296.609 x 352`
  - Content grid columns: `165.359px 110.25px`
  - Quantity: `110.25 x 35`
  - Quantity animation: `none`
- Mobile local built-rule verification: `/private/tmp/fpb-default-wpb-local-selected-mobile-no-important-check-2.json`.
  - Card: `177.5 x 264`
  - Content grid columns: `86.5px 70px`
  - Quantity: `70 x 35`
  - Quantity animation: `none`

## Remaining Fixture-Limited Plan Items

- The current WPB and EB Standard fixtures still differ in product set, step count, currency, and discount configuration.
- Sidebar, discount-threshold, complete-state, and variant-state parity should not be force-patched from these two fixtures alone.
- Exact completion of the full plan requires a same-to-same EB/WPB fixture pair for the remaining loops.

## Standard CSS Important Audit

- Removed all `!important` declarations from `app/assets/widgets/full-page-css/templates/side-footer-standard.css`.
- Product-card typography no longer needs `!important`; Standard selectors are scoped through `[data-fpb-design-preset="DEFAULT"][data-fpb-card-cta-mode="icon"]` and are more specific than the shared product-card base selectors.
- Sidebar padding and hidden back/divider controls no longer need `!important`; Standard selectors load after shared full-page CSS and have equal or greater specificity.
- Timeline image opacity/filter no longer needs `!important`; Standard navigation selectors are more specific than shared inactive/locked timeline selectors.
- Variant title layout no longer needs `!important`; Standard `.product-card--expanded-variant .product-title` selectors are more specific than the shared `.product-title` rule.
- Standard-only hidden sidebar extras no longer need `!important`; the scoped Standard selector is more specific than shared free-gift / tier-CTA selectors.
- Removed the duplicated Standard mobile discount-progress `display: grid !important`; the shared mobile tray rule already owns the same display behavior.
- Fixed selected overlay at the renderer source: Standard selected cards now remove the inline `display` style so CSS can hide `.selected-overlay` without `!important`, while non-Standard presets still set `display: flex`.
