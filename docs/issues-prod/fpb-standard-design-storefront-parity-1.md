# Issue: FPB Standard Design Storefront Parity
**Issue ID:** fpb-standard-design-storefront-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 05:47

## Overview
Match the FPB Standard Design storefront template UI to the live EB reference. Standard Design maps to `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "DEFAULT"`.

## Progress Log
### 2026-06-04 04:49 - Start Standard Design parity slice
- Read EB implementation reference: all FPB presets use `FBP_SIDE_FOOTER`; Standard Design uses preset `DEFAULT`.
- Graphify identifies `BundleWidgetFullPage`, `bundle-widget-full-page.js`, and `bundle-widget-full-page.css` as high-connectivity nodes, so this slice must stay narrow and test-backed.
- Next: switch EB target FPB bundle to Standard Design, capture live storefront computed styles and any responsive behavior, add failing source-contract test, implement scoped DEFAULT preset CSS/logic, rebuild assets, and verify.

### 2026-06-04 05:47 - Completed Standard Design storefront parity
- Switched the live EB FPB reference bundle to Standard Design and confirmed storefront runtime values: `bundleDesignTemplate` = `FBP_SIDE_FOOTER`, preset = `DEFAULT`.
- Captured desktop and mobile EB computed style evidence. Key desktop contract: 1536px bundle canvas, 1455px content wrapper, 993px product column, 447px sidebar, 321px product cards, 305x240 images, visible price rows, and 35x35 icon add buttons. Key mobile contract: 2-column 177.5px cards, 264px card height, and 150px image height.
- Added a failing Jest contract test for Standard Design, then updated `app/assets/bundle-widget-full-page.js` to retain product price rows for DEFAULT, use icon-style cards for Standard independent of pricing method, and inject DEFAULT-only runtime styles.
- Kept the raw full-page CSS source unchanged to avoid pushing the Shopify CSS asset over 100,000 B; verified generated `bundle-widget-full-page.css` is 99,990 B after minification.
- Bumped `WIDGET_VERSION` to `2.9.64`, rebuilt widget assets, reran focused tests, linted modified code paths, and rebuilt graphify output.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/select-template/gap-report.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`

## Phases Checklist
- [x] Phase 1: Switch EB target FPB bundle to Standard Design and capture live storefront style evidence.
- [x] Phase 2: Add failing Standard Design storefront contract test.
- [x] Phase 3: Match Standard Design storefront UI to EB with scoped code/CSS.
- [x] Phase 4: Build/minify modified storefront assets and verify.
