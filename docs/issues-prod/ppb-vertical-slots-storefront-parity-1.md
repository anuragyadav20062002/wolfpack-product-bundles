# Issue: PPB Vertical Slots Storefront Parity
**Issue ID:** ppb-vertical-slots-storefront-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 04:45

## Overview
Match the PPB Vertical Slots storefront template UI to the live EB reference. Vertical Slots maps to `bundleDesignTemplate: "PDP_MODAL"` and `templateId: "SIMPLIFIED"`.

## Progress Log
### 2026-06-04 04:35 - Start Vertical Slots parity slice
- Read EB implementation reference: Vertical Slots is `PDP_MODAL` + `SIMPLIFIED`; EB uses the same modal runtime as Horizontal Slots with vertical/stacked CSS differentiation.
- Current WPB CSS has vertical slot selectors, but the storefront design needs fresh live EB inspection before implementation.
- Next: switch EB target PPB bundle to Vertical Slots, capture storefront computed styles and placement behavior, add failing source-contract test, implement scoped vertical-slot CSS, rebuild assets, and verify.

### 2026-06-04 04:45 - Implement EB-matched storefront styling
- Switched the live EB PPB audit bundle to Vertical Slots and captured computed storefront evidence: 104px dashed row card, 10px radius, text left, 80px visual block right, black disabled ATC with 0.5 opacity, 47px dynamic checkout, and mobile label reduction.
- Added a failing Jest contract for `PDP_MODAL` + `SIMPLIFIED`, then implemented scoped product-page widget CSS for Vertical Slots without changing the Horizontal Slots `MODAL` block.
- Preserved modal template container responsiveness by replacing the remaining fixed 360px mobile modal widths with proportional 100% sizing.
- Bumped `WIDGET_VERSION` to `2.9.63`, rebuilt widget bundles, minified CSS assets, and rebuilt graphify metadata.
- Verified with `node --check app/assets/bundle-widget-product-page.js`, `node --check app/assets/widgets/product-page/templates/modal-slot-template.js`, `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand`, `npm run build:widgets`, `npm run minify:assets css`, `npx eslint --max-warnings 9999 tests/unit/assets/bundle-widget-product-page-init.test.ts scripts/build-widget-bundles.js`, and graphify rebuild.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/select-template/gap-report.md`

## Phases Checklist
- [x] Phase 1: Switch EB target PPB bundle to Vertical Slots and capture live storefront style evidence.
- [x] Phase 2: Add failing Vertical Slots storefront contract test.
- [x] Phase 3: Match Vertical Slots storefront UI to EB with scoped code/CSS.
- [x] Phase 4: Build/minify modified storefront assets and verify.
