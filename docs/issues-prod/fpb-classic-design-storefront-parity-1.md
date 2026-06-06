# Issue: FPB Classic Design Storefront Parity
**Issue ID:** fpb-classic-design-storefront-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 05:32

## Overview
Match the FPB Classic Design storefront template UI to the live EB reference. Classic Design maps to `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "CLASSIC"`.

## Progress Log
### 2026-06-04 05:06 - Start Classic Design parity slice
- Read EB implementation reference: all FPB presets use `FBP_SIDE_FOOTER`; Classic Design uses preset `CLASSIC`.
- Existing select-template gap report says Classic differs from Standard through pill tabs, visible prices, a full-width hero/banner, discount tier badges, sidebar CTA treatment, and taller portrait cards, but live EB must be rechecked before implementation because prior template notes have drifted.
- Graphify/memory identify `BundleWidgetFullPage` and `bundle-widget-full-page.js` as high-connectivity nodes, so this slice must remain narrow and test-backed.
- Next: switch EB target FPB bundle to Classic Design, capture live desktop/mobile storefront computed styles, add failing contract test, implement scoped Classic runtime CSS/logic, rebuild assets, and verify.

### 2026-06-04 05:32 - Completed Classic Design storefront parity
- Switched the live EB FPB reference bundle to Classic Design and confirmed storefront runtime values: `bundleDesignTemplate` = `FBP_SIDE_FOOTER`, preset = `CLASSIC`.
- Live EB evidence corrected the old gap report: the current Classic storefront does not render a hero/banner on the audited bundle. The active contract is side-footer layout, pill category tabs, visible product prices, icon add buttons, responsive 4-column desktop grid, 2-column mobile grid, and compact mobile summary tray.
- Captured desktop and mobile computed style evidence. Key wide desktop contract: 1536px bundle canvas, 1455px body wrapper, 0.6897fr/0.3103fr content/sidebar split, 95% product-grid width, 4 product columns, 447px sidebar. Key 1280 desktop contract: 4 product columns at ~182px, 366px sidebar. Key mobile contract: 2 columns at 177.5px, 263px card height, and 150px image height.
- Added a failing Jest contract test for Classic Design, then updated `app/assets/bundle-widget-full-page.js` to include Classic in EB-style icon-card CTA mode, reuse the compact mobile summary tray, and inject CLASSIC-only runtime styles.
- Bumped `WIDGET_VERSION` to `2.9.65`, rebuilt widget assets, reran focused tests, linted modified code paths, minified CSS, and rebuilt graphify output.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/select-template/gap-report.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`

## Phases Checklist
- [x] Phase 1: Switch EB target FPB bundle to Classic Design and capture live storefront style evidence.
- [x] Phase 2: Add failing Classic Design storefront contract test.
- [x] Phase 3: Match Classic Design storefront UI to EB with scoped widget code.
- [x] Phase 4: Build/minify modified storefront assets and verify.
