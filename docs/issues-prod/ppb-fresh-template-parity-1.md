# Issue: PPB Fresh Template Storefront Parity
**Issue ID:** ppb-fresh-template-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 23:03

## Overview
Create a fresh Product Page Bundle with multiple categories/steps and discount rules, then perform a live EB-vs-WPB storefront parity pass for every supported Product Page Bundle template:

- Product List: `bundleDesignTemplate=PDP_INPAGE`, `templateId=CASCADE`
- Product Grid: `bundleDesignTemplate=PDP_INPAGE`, `templateId=COGNIVE`
- Horizontal Slots: `bundleDesignTemplate=PDP_MODAL`, `templateId=MODAL`
- Vertical Slots: `bundleDesignTemplate=PDP_MODAL`, `templateId=SIMPLIFIED`

The goal is pixel-level storefront UI parity for the configured bundle across desktop and mobile, including product-card geometry, category/step navigation, slot/cart summary behavior, responsive container sizing, discount UI, and template-specific interaction behavior.

## Progress Log
### 2026-06-04 22:30 - Work started
- User requested a fresh PPB bundle configured with multiple steps and discounts, then deep parity against EB Product Page Bundle templates.
- Read prior PPB template modularization/deep-parity issues and EB implementation references. Prior pass used same-day evidence but not a fresh WPB fixture; this pass must verify against a newly configured PPB bundle.
- Impact analysis: likely touches PPB storefront widget runtime, modular product-page template JS/CSS, generated extension assets, template layout tests, and possibly bundle runtime data wiring.
- Next steps: create/configure fresh WPB PPB bundle in SIT, place/sync it on its parent product storefront page, capture EB desktop/mobile evidence for all PPB presets, compare WPB against EB, patch confirmed gaps, rebuild/minify assets, verify in Chrome, and commit a scoped slice.

### 2026-06-04 22:58 - Fresh PPB fixture and grid gap confirmed
- Created a fresh SIT PPB fixture with two steps/categories and quantity discount tiers, synced it to Shopify, and verified its parent product storefront page renders widget data from the synced bundle metafield.
- Fresh fixture: `cmpzr5n3s0000v0glfwuklzgd`, storefront handle `wpb-fresh-ppb-template-parity-2026-06-04-97524`.
- Verified Product List (`PDP_INPAGE` + `CASCADE`), Product Grid (`PDP_INPAGE` + `COGNIVE`), modal slot (`PDP_MODAL` + `MODAL`), and simplified slot (`PDP_MODAL` + `SIMPLIFIED`) render paths on the fresh product.
- Live EB COGNIVE evidence showed two columns in a narrow product-column container around 300px wide. Fresh WPB COGNIVE still used a viewport-driven fixed three-column grid, which can break EB parity when the widget is placed in narrower product form slots.
- Next edit: scope the CSS correction to the COGNIVE product grid column definition so it is container-responsive without changing wider three-column layouts.

### 2026-06-04 23:00 - Product Grid container responsiveness fixed and verified
- Updated COGNIVE product grid CSS from a fixed three-column track to `repeat(auto-fit, minmax(130px, 1fr))`.
- Rebuilt product-page extension CSS with `npm run minify:assets css`; generated `extensions/bundle-builder/assets/bundle-widget.css` is 91.3 KB, below Shopify's 100 KB app-block asset limit.
- Synced the fresh PPB parent product and verified COGNIVE live on the storefront.
- Desktop verification at 1440px viewport: product widget container was 425.66px wide and COGNIVE rendered two 197.33px columns with no horizontal overflow.
- Mobile emulation verification at 390px viewport: product widget container was 358px wide and COGNIVE rendered two 163.5px columns with no horizontal overflow.
- Product List and modal slot templates were smoke-tested on the same fresh fixture before the COGNIVE CSS edit; the final source change is scoped to COGNIVE only.

### 2026-06-04 23:03 - Pre-commit checks
- Ran `git diff --check` successfully.
- Ran `npm run minify:assets css` successfully after the CSS source edit.
- Ran graph rebuild with `npm run graphify:rebuild`; graphify reported 4042 nodes, 6008 edges, and 596 communities.
- ESLint is not applicable to the modified source file because this slice changes CSS and Markdown only.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `docs/issues-prod/ppb-template-deep-parity-audit-1.md`
- `docs/issues-prod/ppb-product-page-template-modularization-1.md`
- `docs/issues-prod/ppb-product-grid-storefront-parity-1.md`
- `docs/issues-prod/ppb-horizontal-slots-storefront-parity-1.md`
- `docs/issues-prod/ppb-vertical-slots-storefront-parity-1.md`

## Phases Checklist
- [x] Phase 1: Create and configure fresh WPB PPB bundle with multiple categories/steps and discounts
- [x] Phase 2: Capture live EB desktop/mobile evidence for all PPB templates
- [x] Phase 3: Capture live WPB desktop/mobile evidence for the fresh bundle across all templates
- [x] Phase 4: Document template-by-template parity gaps
- [x] Phase 5: Add test spec/contracts for confirmed implementation gaps
- [x] Phase 6: Patch PPB template runtime/CSS/data wiring
- [x] Phase 7: Rebuild widget and minified assets
- [x] Phase 8: Verify desktop/mobile storefront parity in Chrome
- [x] Phase 9: Commit relevant changes
