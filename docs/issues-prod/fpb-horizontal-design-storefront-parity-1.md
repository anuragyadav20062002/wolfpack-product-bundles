# Issue: FPB Horizontal Design Storefront Parity
**Issue ID:** fpb-horizontal-design-storefront-parity-1
**Status:** Completed
**Priority:** High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 07:25

## Overview
Match the FPB Horizontal Design storefront template UI to the live EB reference. Horizontal Design maps to `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "HORIZONTAL"`.

## Progress Log
### 2026-06-04 07:00 - Started live EB parity slice
- Opened a dedicated issue for the FPB Horizontal Design storefront parity slice before code changes.
- Existing widget code has `ensureHorizontalSidePanelSlotRuntimeStyles()`, but live EB audit is required before changing it.
- Next: switch the live EB FPB reference bundle to Horizontal, capture desktop/mobile/wide measurements, add RED source-contract coverage, patch only the storefront widget surface, rebuild assets, verify, and commit.

### 2026-06-04 07:25 - Patched Horizontal storefront runtime contract
- Switched the live EB FPB reference bundle to Horizontal Design and captured desktop, wide, and mobile measurements.
- Confirmed Horizontal is container-responsive despite being a full-page bundle: EB caps the root at 1536px, centers it on wide viewports, caps the inner wrapper at 1455px, and uses a responsive `0.65fr 0.35fr` shell on desktop.
- Added `test-spec/fpb-horizontal-design-storefront.spec.md` and updated `tests/unit/assets/bundle-widget-full-page-template-layout.test.ts` with a RED/GREEN source-contract test for the measured Horizontal geometry.
- Replaced the partial Horizontal runtime override in `app/assets/bundle-widget-full-page.js` with EB-aligned root, wrapper, grid, card, image, side-panel, and mobile rules while preserving the selected-product slot thumbnail behavior.
- Bumped `WIDGET_VERSION` to `2.9.67` in `scripts/build-widget-bundles.js`, rebuilt generated widget assets, minified CSS, and rebuilt graphify output.
- Verification: `node --check app/assets/bundle-widget-full-page.js`; `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`; `npm run build:widgets`; `npm run minify:assets css`; `wc -c extensions/bundle-builder/assets/bundle-widget-full-page.css extensions/bundle-builder/assets/bundle-widget.css`; `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js tests/unit/assets/bundle-widget-full-page-template-layout.test.ts scripts/build-widget-bundles.js`; graphify rebuild.

### 2026-06-04 07:30 - Committed
- Committed the scoped FPB Horizontal Design storefront parity slice as `9be3cc69`.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/issues-prod/eb-ui-clone-rewrite-1.md`
- `test-spec/fpb-horizontal-design-storefront.spec.md`

## Phases Checklist
- [x] Live EB Horizontal desktop/mobile/wide audit completed
- [x] RED test/spec written
- [x] FPB Horizontal storefront implementation patched
- [x] Widget assets rebuilt and minified
- [x] Verification completed
- [x] Changes committed
