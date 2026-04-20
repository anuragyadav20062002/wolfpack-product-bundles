# Issue: Bundle Config Metafield Split (bundle_config + bundle_settings)

**Issue ID:** bundle-config-metafield-split-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-04-21
**Last Updated:** 2026-04-21 10:00

## Overview
Two-part refactor of the `custom:bundle_config` page metafield:

**Short-term**: Strip dead weight from `bundle-formatter.server.ts` —
`StepProduct` array (full duplicate of `products`), empty `handle: ''`, and
redundant `images` array (duplicates `featuredImage`). The `stepProductsAlreadyEnriched`
widget path uses `step.products` (which has `featuredImage`), so `StepProduct` is
never reached on the page-metafield path.

**Medium-term**: Split into two page metafields:
- `custom:bundle_config` — steps (products, variants, conditions), pricing, identity
- `custom:bundle_settings` — display/DCP settings: promoBannerBgImage/Crop,
  loadingGif, showStepTimeline, floatingBadgeEnabled/Text, tierConfig

All 5 call sites of `writeBundleConfigPageMetafield` are updated atomically by
batching both metafield writes into one GraphQL mutation inside the writer.

Backfill script: `scripts/backfill-bundle-settings.js` — writes `bundle_settings`
for all existing bundles. User runs this on prod immediately after deploy. No
fallback in widget code; backfill runs first.

## Phases Checklist
- [ ] Create issue file (this file)
- [ ] Short-term: strip StepProduct, handle, images from bundle-formatter.server.ts
- [ ] Medium-term: add writeBundleSettingsPageMetafield + batch write in writeBundleConfigPageMetafield
- [ ] Medium-term: remove settings from FormattedBundle + formatBundleForWidget
- [ ] Medium-term: bundle-full-page.liquid — inject data-bundle-settings attr
- [ ] Medium-term: widget JS — parseConfiguration + _mergeBundleSettings + init()
- [ ] Medium-term: backfill script scripts/backfill-bundle-settings.js
- [ ] Build + minify + lint + commit

## Progress Log

### 2026-04-21 10:00 - Starting Implementation
- Short-term: StepProduct in page metafield is dead weight (stepProductsAlreadyEnriched
  path uses step.products, which always has featuredImage from formatter)
- Medium-term: settings are tiny (<1KB) but moving them out enables independent
  DCP-only writes without touching step/product data
- No fallback: backfill writes bundle_settings for all live bundles before deploy propagates
