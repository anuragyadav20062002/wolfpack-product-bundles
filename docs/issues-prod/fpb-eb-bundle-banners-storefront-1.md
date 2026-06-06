# Issue: FPB EB Bundle Banners Storefront Wiring
**Issue ID:** fpb-eb-bundle-banners-storefront-1
**Status:** Completed
**Priority:** High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 06:11

## Overview
Wire full-page bundle desktop and mobile banner images to the storefront the same way EB does: separate desktop and mobile URLs saved from Bundle Settings, emitted in the FPB runtime config, and rendered as sibling image elements at the top of the FPB widget.

## Progress Log
### 2026-06-04 06:02 - Started storefront wiring slice
- Verified live EB behavior: Bundle Settings has Bundle Banner desktop and mobile uploads, recommended sizes 1900x230 and 1100x500.
- Verified EB storefront renders `.gbbBundleBanners` with `.gbbDesktopImageBanner` and `.gbbMobileImageBanner` image elements and switches visibility by viewport.
- Found WPB admin save already persists `bundleBannerDesktopUrl` and `bundleBannerMobileUrl`.
- Current gap: FPB runtime config/settings and storefront widget do not render EB-style desktop/mobile bundle banner image elements.
- Next: add RED tests, wire config/settings fields, render EB-style banner image pair, rebuild widget/CSS assets, smoke test template isolation.

### 2026-06-04 06:06 - Implementing runtime and widget wiring
- Added RED coverage for FPB metafield config, lightweight `bundle_settings`, and FPB-only storefront banner CSS.
- Next: pass the tests by carrying the saved desktop/mobile banner URLs through FPB runtime config and rendering the banner pair before template content.

### 2026-06-04 06:11 - Completed storefront wiring and build verification
- Added desktop/mobile bundle banner URLs to FPB `bundle_ui_config` and lightweight `bundle_settings`.
- Added FPB widget rendering for sibling desktop/mobile banner image elements before the template content/timeline.
- Injected FPB-only responsive banner visibility styles at runtime to keep the Shopify CSS asset under the 100,000 byte app-block limit.
- Rebuilt widget bundles with `WIDGET_VERSION` `2.9.69` and reran CSS minification; `bundle-widget-full-page.css` is 99,990 bytes.
- Verified focused banner, FPB template layout, and FPB installation service tests. Broader `bundle-product-metafield.test.ts` still has an unrelated category variant expectation failure.
- Live storefront desktop/mobile visual smoke is pending deploy/CDN propagation because the Shopify storefront still serves the previously deployed asset version.

### 2026-06-04 06:11 - Prepared scoped commit
- Staging only FPB banner runtime/config changes, rebuilt widget assets, graph updates, issue log, and test spec.
- Leaving unrelated dirty test edits and screenshot/network artifacts unstaged.

## Related Documentation
- `docs/eb-fpb-parity-clone/02-architecture.md`
- `docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md`
- `test-spec/fpb-bundle-banners-storefront.spec.md`

## Phases Checklist
- [x] Issue and test spec created
- [x] RED tests added and verified failing
- [x] Runtime config/settings include desktop and mobile bundle banner URLs
- [x] FPB widget renders EB-style desktop/mobile image banner pair
- [x] Widget/CSS assets rebuilt
- [x] Desktop and mobile runtime contract verified
- [x] Template isolation smoke test completed
- [ ] Live storefront smoke test completed after deploy
- [x] Changes committed
