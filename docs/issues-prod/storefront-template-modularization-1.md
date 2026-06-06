# Issue: Storefront Template Modularization
**Issue ID:** storefront-template-modularization-1
**Status:** Completed
**Priority:** High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 05:52

## Overview
Modularize storefront template implementation so FPB template code follows the PPB installer pattern, and so FPB/PPB template CSS lives in template-focused source modules instead of one large raw CSS file per bundle type.

## Progress Log
### 2026-06-04 05:42 - Started refactor slice
- Opened the issue before code changes.
- Current PPB template JavaScript already uses installer modules under `app/assets/widgets/product-page/templates/`.
- Current FPB template runtime installers still live in `app/assets/bundle-widget-full-page.js`.
- Next: add RED tests for module boundaries and CSS import resolution, extract FPB template installers, modularize template CSS sources for FPB and PPB, rebuild generated assets, verify, and commit.

### 2026-06-04 05:52 - Completed modularization and verification
- Added RED coverage for FPB installer boundaries, CSS import-based source modules, and CSS import resolution in the minifier.
- Extracted FPB Standard, Classic, Compact, and Horizontal runtime style installers into `app/assets/widgets/full-page/templates/`.
- Split FPB template CSS into `app/assets/widgets/full-page-css/templates/` and PPB template CSS into `app/assets/widgets/product-page-css/templates/`.
- Updated widget build and CSS minification scripts so generated Shopify assets remain deploy-ready from modular sources.
- Rebuilt widget bundles and minified CSS after bumping `WIDGET_VERSION` to `2.9.68`.
- Verified with syntax checks, focused Jest suites, widget build, CSS minification, deploy asset size checks, ESLint, and graphify rebuild.

## Related Documentation
- `test-spec/storefront-template-modularization.spec.md`
- `scripts/build-widget-bundles.js`
- `scripts/minify-assets.js`

## Phases Checklist
- [x] Issue and test spec created
- [x] RED tests added
- [x] FPB template JS installers extracted
- [x] FPB and PPB template CSS sources modularized
- [x] Widget and CSS assets rebuilt
- [x] Verification completed
- [x] Changes committed
