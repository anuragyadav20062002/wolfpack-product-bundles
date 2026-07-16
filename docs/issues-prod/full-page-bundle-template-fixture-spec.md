---
schema_version: 1
id: fpb-fresh-template-parity-1
title: Full Page Bundle Template Fixture Specification
type: fixture-spec
status: completed
summary: Defines the multi-step Full Page Bundle storefront fixture used to verify Standard, Classic, Compact, and Horizontal designs.
last_audited: 2026-07-14
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - full-page-bundle-widget
source_paths:
  - app/assets/bundle-widget-full-page.js
related_docs:
  - docs/refactor/full-page-and-product-page-template-baseline-matrix.md
tags:
  - fpb
  - fixture
keywords:
  - Full Page Bundle
  - template fixture
---

# Full Page Bundle Template Fixture Specification

**Fixture ID:** fpb-fresh-template-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 22:25

## Overview

Create a fresh Full Page Bundle with multiple steps and discount rules, then perform a live EB-vs-WPB storefront parity pass for every supported landing page template: Standard, Classic, Compact, and Horizontal. The goal is pixel-level storefront UI parity for the configured bundle across desktop and mobile, including layout, spacing, sizing, banners, product cards, step/category navigation, cart/summary behavior, and discount UI.

## Progress Log
### 2026-06-04 21:02 - Work started
- User requested a fresh FPB bundle configured with multiple steps and discounts, then deep parity against EB landing page templates.
- Read prior FPB template deep-audit issue and EB implementation references. Prior pass patched Standard responsive sizing and Horizontal image fit, but this new pass must be based on a fresh configured bundle rather than old evidence alone.
- Impact analysis: likely touches FPB storefront widget runtime, modular FPB template CSS, generated widget assets, template layout tests, and possibly bundle runtime data wiring.
- Next steps: create/configure fresh WPB FPB bundle in SIT, configure/switch the comparable EB bundle templates, capture desktop/mobile evidence for each preset, document gaps, add RED contracts for confirmed code gaps, patch widget/template code, rebuild/minify assets, verify live in Chrome, and commit in narrow slices.

### 2026-06-04 21:23 - Fresh WPB FPB fixture configured
- Created and configured SIT bundle `cmpznom360001v0wqjqm3cv3a` (`WPB Fresh FPB Template Parity 2026-06-04`) for the parity pass.
- Seeded 3 steps, 5 category groupings, 10 Shopify products, multi-variant products, step min/max quantity rules, product prices/compare-at data, and two quantity discount tiers.
- Set the initial landing page template to `FBP_SIDE_FOOTER` + `DEFAULT`; the next step is to create/sync its storefront page and capture template evidence against EB.

### 2026-06-04 21:35 - Fresh WPB FPB storefront page linked
- Created/reused Shopify page `gid://shopify/Page/133309595907` with handle `wpb-fresh-fpb-template-parity-2026-06-04`.
- Wrote the FPB page marker and page metafields (`custom:bundle_id`, `$app:bundle_id`) so the active app embed can hydrate the landing page widget.
- Persisted `shopifyPageId` and `shopifyPageHandle` back to bundle `cmpznom360001v0wqjqm3cv3a`.

### 2026-06-04 21:43 - Banner parity assets seeded
- Captured EB FPB banner assets from the live landing-page storefront: desktop `1780532553194.png`, mobile `1780532583637.png`.
- Seeded those URLs into the fresh WPB FPB bundle and cached them in the Shopify page marker/settings so the storefront audit includes FPB banner rendering.
- Observed first WPB default storefront render: page loads, step/category/sidebar/discount UI render, but individual variant cards for `The Complete Snowboard` currently show placeholder images instead of product imagery; needs root-cause confirmation against runtime product image fallback.

### 2026-06-04 21:46 - Horizontal template desktop parity slice
- Switched the fresh WPB FPB fixture to the EB-observed `HORIZONTAL` preset and captured live EB desktop metrics for the current landing-page template.
- Fixed product/variant image fallback so variant-expanded cards use product imagery instead of placeholders when variant images are absent.
- Moved HORIZONTAL category tabs above the sidebar grid to match EB's full-width tab row before the content/sidebar columns.
- Replaced the HORIZONTAL runtime-injected style block with static template CSS, adding short preset aliases (`fpb-h`, `fpb-i`) to preserve selector size under Shopify's 100 KB app-block CSS cap.
- Tuned the HORIZONTAL desktop lane and card/sidebar geometry against EB: banner `1195x555` at `x=35`, wrapper `767px/413px` columns with `15px` gap, card `376x156` with `106px/246px` columns and `8px` padding, sidebar `413x714`, category title/grid top alignment.
- Rebuilt widgets and minified CSS successfully; full-page CSS minified to 97.6 KB.
- Evidence saved outside the repo: `/private/tmp/wpb-fresh-fpb-horizontal-after-static-css-desktop.png`, `/private/tmp/wpb-fresh-fpb-horizontal-after-static-css-mobile.png`.
- Remaining: repeat live EB/WPB desktop and mobile parity for Standard, Classic, and Compact, then run lint and commit the completed slice.

### 2026-06-04 22:25 - Standard, Classic, Compact, and mobile lane parity
- Captured live EB desktop metrics for Standard, Classic, and Compact landing-page presets and applied the same geometry to the fresh WPB fixture.
- Standard desktop now matches EB's `1195px` banner/content lane, `814px` product grid, `261x352` cards, `245x240` product images, and `366px` side panel.
- Classic desktop now matches EB's `773px` product grid, four `182x286` cards, `166x170` product images, and `366px` side panel.
- Compact desktop now matches EB's `699px/466px` content/sidebar split, `223x327` cards, `207x211` product images, category title alignment, and side panel top alignment.
- Captured EB Compact mobile reference and found the shared WPB mobile lane was still inheriting the desktop `30px/35px` side margins.
- Fixed shared FPB mobile lane so category tabs, wrapper, and product grid use EB's mobile geometry (`x=10`, `w=465` at the 500px DevTools mobile viewport).
- Updated Standard, Classic, and Compact mobile runtime cards to match EB's mobile card geometry: two `225px` columns, `245px` card height, `209x150` images, `150px 23px 40px` card rows, `8px` gaps/padding, white cards.
- Kept Horizontal template on static CSS and verified its mobile lane widened to `x=10`, `w=465` with no horizontal runtime style block.
- Rebuilt widgets and minified CSS; full-page CSS remains under Shopify's 100 KB app-block limit.
- Evidence saved outside the repo: `/private/tmp/eb-fpb-compact-fresh-reference-desktop.png`, `/private/tmp/eb-fpb-compact-reference-mobile.png`, `/private/tmp/wpb-fresh-fpb-standard-after-parity-desktop.png`, `/private/tmp/wpb-fresh-fpb-classic-after-parity-desktop.png`, `/private/tmp/wpb-fresh-fpb-compact-after-parity-desktop.png`, `/private/tmp/wpb-fresh-fpb-compact-after-eb-mobile-lane.png`, `/private/tmp/wpb-fresh-fpb-standard-after-eb-mobile-lane.png`, `/private/tmp/wpb-fresh-fpb-classic-after-eb-mobile-lane.png`, `/private/tmp/wpb-fresh-fpb-horizontal-after-eb-mobile-lane.png`.
- Verification run: `node --check` for all modified raw widget/template JS files, `npm run build:widgets`, `npm run minify:assets css`, untyped ESLint syntax pass for raw JS assets, graphify rebuild via the pipx venv, and live Chrome desktop/mobile measurements.
- Typed repo ESLint with `--no-ignore` cannot lint these raw JS widget files because `tsconfig.json` excludes them; the default lint command reports them as ignored.
- Ready to commit the scoped storefront parity slice.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `internal docs/EB Settings Design Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `docs/issues-prod/fpb-template-deep-parity-audit-1.md`
- `docs/issues-prod/fpb-standard-design-storefront-parity-1.md`
- `docs/issues-prod/fpb-classic-design-storefront-parity-1.md`
- `docs/issues-prod/fpb-compact-design-storefront-parity-1.md`
- `docs/issues-prod/fpb-horizontal-design-storefront-parity-1.md`

## Phases Checklist
- [x] Phase 1: Create and configure fresh WPB FPB bundle with multiple steps and discounts
- [x] Phase 2: Capture live EB desktop evidence for all FPB templates and EB mobile reference geometry
- [x] Phase 3: Capture live WPB desktop/mobile evidence for the fresh bundle across all templates
- [x] Phase 4: Document template-by-template parity gaps
- [x] Phase 5: Add test spec/contracts for confirmed implementation gaps
- [x] Phase 6: Patch FPB template runtime/CSS/data wiring
- [x] Phase 7: Rebuild widget and minified assets
- [x] Phase 8: Verify desktop/mobile storefront parity in Chrome
- [x] Phase 9: Commit relevant changes
