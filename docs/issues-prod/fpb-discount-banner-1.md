# Issue: FPB Inline Discount Progress Banner

**Issue ID:** fpb-discount-banner-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-20
**Last Updated:** 2026-04-20 16:00

## Overview
Add a slim full-width discount progress banner attached to the top of the floating
footer bar. The banner moves with the footer on expand/collapse, reads as a natural
extension of the footer, and updates in real-time as items are added/removed.
In sidebar layout it appears above the Add to Cart button.
Background color and text color are DCP-customizable.

## Related Documentation
- `docs/storefront-ui-26.05-improvements/01-requirements.md` — FR-02
- `docs/storefront-ui-26.05-improvements/02-architecture.md` — FR-02 section

## Phases Checklist
- [x] Read footer rendering + refresh pipeline
- [x] Add `_renderDiscountProgressBanner()` helper
- [x] Inject banner inside footer wrapper (above footer content)
- [x] Add `_updateDiscountProgressBanner()` called from footer refresh path
- [x] Sidebar layout: inject banner above Add to Cart button
- [x] CSS for `.discount-progress-banner` (+ `.reached` state)
- [x] CSS vars generator: `--bundle-discount-banner-bg`, `--bundle-discount-banner-text`
- [x] Settings types: `discountBannerBg`, `discountBannerText`
- [x] Build + lint + commit

## Progress Log

### 2026-04-20 15:20 - Starting Implementation
- Reading footer rendering pipeline before writing code

### 2026-04-20 16:00 - Completed Implementation
- ✅ `_renderDiscountProgressBanner()` — builds banner DOM using existing TemplateManager discount variables; returns `null` when discount pricing is disabled or no rules apply
- ✅ `_updateDiscountProgressBanner()` — updates banner in-place from the footer refresh path
- ✅ `renderFullPageFooter()` — injects banner between expandable panel and footer bar
- ✅ `renderSidePanel()` — injects banner above the nav/ATC section
- ✅ CSS: `.discount-progress-banner` with `--bundle-discount-banner-bg` and `--bundle-discount-banner-text` vars; `.reached` state; sidebar variant with `border-radius: 8px`
- ✅ CSS stripped to 99,518 bytes (under 100KB Shopify limit)
- ✅ `css-variables-generator.ts` — added `--bundle-discount-banner-bg` and `--bundle-discount-banner-text` vars
- ✅ `types.ts` — added `discountBannerBg?` and `discountBannerText?`
- ✅ Widget rebuilt (v2.6.0)
- ✅ Lint: zero errors on modified files
- Files modified: `bundle-widget-full-page.js`, `bundle-widget-full-page.css`, `css-variables-generator.ts`, `types.ts`
