# Issue: FPB Compact Design Storefront Parity
**Issue ID:** fpb-compact-design-storefront-parity-1
**Status:** Completed
**Priority:** High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 06:45

## Overview
Match the FPB Compact Design storefront template UI to the live EB reference. Compact Design maps to `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "COMPACT"`.

## Progress Log
### 2026-06-04 06:00 - Started live EB parity slice
- Opened a dedicated issue for the FPB Compact Design storefront parity slice before code changes.
- Initial repo scan found an existing `ensureCompactPresetRuntimeStyles()` hook with limited desktop-only styling; live EB audit is required before changing it.
- Next: capture live EB Compact desktop/mobile/wide measurements, add RED source-contract coverage, patch only the storefront widget surface, rebuild assets, verify, and commit.

### 2026-06-04 06:32 - EB audit and local Compact patch
- Switched the live EB FPB reference bundle from Classic to Compact through Select template and confirmed storefront runtime `gbb-bundle-design-preset-id="COMPACT"` with `FBP_SIDE_FOOTER`.
- Captured EB proof screenshots at `/private/tmp/eb-fpb-compact-desktop.png` and `/private/tmp/eb-fpb-compact-mobile.png`.
- Measured EB desktop 1280 layout: centered full-page root, `1195.22px` body wrapper, `0.6fr 0.4fr` content/summary grid, `30px` column gap, `3` product tracks, `223px x 327px` product cards, `207px x 211px` images, `35px` square plus CTA, and `466px` summary panel.
- Measured EB wide 2560 layout: root caps at `1536px`, wrapper caps at `1455px`, product grid remains `3` tracks, product cards cap near `275px x 352px`, images cap at `240px`, and summary panel expands to `570px`.
- Measured EB mobile 390 layout: `370px` wrapper, `2` product tracks of `177.5px`, `177.5px x 263px` product cards, `161.5px x 150px` images, `35px` square plus CTA, and the compact mobile summary tray/footer block.
- Added RED-to-green source-contract coverage for the Compact runtime layout, icon CTA mode, and mobile summary tray eligibility.
- Patched `app/assets/bundle-widget-full-page.js` so `COMPACT` uses icon card CTAs, compact mobile tray behavior, and measured responsive runtime styles.
- Bumped `WIDGET_VERSION` to `2.9.66` before rebuilding storefront assets.

### 2026-06-04 06:45 - Verification completed
- `node --check app/assets/bundle-widget-full-page.js` passed.
- `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand` passed with 9 tests.
- `npm run build:widgets` rebuilt full-page, product-page, and SDK assets with widget version `2.9.66`.
- `npm run minify:assets css` passed; Full Page app-block CSS remains `99,990` bytes.
- `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js tests/unit/assets/bundle-widget-full-page-template-layout.test.ts scripts/build-widget-bundles.js` completed with 0 errors and 3 existing warnings.
- Graphify rebuild completed with the existing `file_type 'source'` warning class.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/issues-prod/eb-ui-clone-rewrite-1.md`
- `test-spec/fpb-compact-design-storefront.spec.md`

## Phases Checklist
- [x] Live EB Compact desktop/mobile/wide audit completed
- [x] RED test/spec written
- [x] FPB Compact storefront implementation patched
- [x] Widget assets rebuilt and minified
- [x] Verification completed
- [x] Changes committed
