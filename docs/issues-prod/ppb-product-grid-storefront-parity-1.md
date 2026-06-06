# Issue: PPB Product Grid Storefront Parity
**Issue ID:** ppb-product-grid-storefront-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 04:27

## Overview
Match the PPB Product Grid storefront template UI to the live EB reference. Product Grid maps to `bundleDesignTemplate: "PDP_INPAGE"` and `templateId: "COGNIVE"`.

## Progress Log
### 2026-06-04 04:12 - Start Product Grid parity slice
- Read EB implementation reference: Product Grid is `PDP_INPAGE` + `COGNIVE`.
- Existing WPB CSS has COGNIVE selectors, but live EB Product Grid storefront needs fresh inspection before implementation.
- Next: switch the EB Product Page bundle to Product Grid, inspect live storefront DOM/computed styles, add failing source-contract test, implement scoped Product Grid CSS/module changes, rebuild assets, and verify.

### 2026-06-04 04:16 - Capture live EB Product Grid storefront evidence
- Switched EB target PPB bundle from Horizontal Slots to Product Grid and reloaded the target product page.
- Confirmed Product Grid renders as `PDP_INPAGE` + `COGNIVE` with Cascade-style wrapper/footer classes.
- Measured current right-column placement: widget width 345px, products wrapper `grid-template-columns: 97.6562px 97.6719px 97.6562px`, 15px gap, `padding: 0 8px 15px`, product image/card width about 98px, Add button height 32px, footer width 345px.
- Ran a temporary DOM placement probe inside the 715px media column. EB kept three equal columns and expanded card/image/button widths to 221px, confirming Product Grid must be container-responsive rather than hard-coded to 98px.
- Next: add failing Product Grid source contract test for the dedicated COGNIVE module, responsive 3-column grid, and shared Cascade footer behavior.

### 2026-06-04 04:22 - Add Product Grid contract test and implementation
- Added a failing Jest source-contract test for a dedicated COGNIVE template module, Product Grid renderer hooks, responsive 3-column card CSS, and shared Cascade footer behavior.
- Implemented `app/assets/widgets/product-page/templates/cognive-template.js` and wired it after Cascade so Product Grid can reuse the EB-style selected-items/footer path.
- Scoped COGNIVE storefront CSS to match live EB Product Grid: 3 responsive columns, 15px gaps, 8px side padding, square images, centered title/price, 32px Add button, count pill, discount message, full-width add-to-cart, and dynamic checkout.
- Bumped `WIDGET_VERSION` to `2.9.61`.
- Verification: `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand` passed.

### 2026-06-04 04:27 - Build and verify Product Grid storefront assets
- Ran raw JS syntax checks for `app/assets/bundle-widget-product-page.js`, `modal-slot-template.js`, `cascade-template.js`, and new `cognive-template.js`.
- Ran `npm run build:widgets` and rebuilt full-page, product-page, and SDK widget assets with version `2.9.61`.
- Ran `npm run minify:assets css`; product-page CSS output is 83.5 KB and under Shopify's app-block asset limit.
- Ran ESLint on modified JS/TS files with `--max-warnings 9999`; result was 0 errors.
- Rebuilt graphify code graph; `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` updated.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/select-template/gap-report.md`

## Phases Checklist
- [x] Phase 1: Switch EB target PPB bundle to Product Grid and capture live storefront style evidence.
- [x] Phase 2: Add failing Product Grid storefront contract test.
- [x] Phase 3: Match Product Grid storefront UI to EB with scoped code/CSS.
- [x] Phase 4: Build/minify modified storefront assets and verify.
