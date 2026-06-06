# Issue: PPB Template Deep Parity Audit
**Issue ID:** ppb-template-deep-parity-audit-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 06:50

## Overview
Deep-audit all Product Page Bundle storefront templates against Easy Bundles and patch confirmed UI, behavior, and data wiring gaps.

Templates in scope:
- Product List: `bundleDesignTemplate=PDP_INPAGE`, `templateId=CASCADE`
- Product Grid: `bundleDesignTemplate=PDP_INPAGE`, `templateId=COGNIVE`
- Horizontal Slots: `bundleDesignTemplate=PDP_MODAL`, `templateId=MODAL`
- Vertical Slots: `bundleDesignTemplate=PDP_MODAL`, `templateId=SIMPLIFIED`

## Progress Log
### 2026-06-04 06:39 - Started deep parity audit
- Read EB implementation references for PPB template IDs, runtime globals, and storefront initialization paths.
- Confirmed current WPB PPB storefront code is modularized across product-page template JS and CSS files.
- Next: capture live EB desktop/mobile behavior for every PPB template, compare against WPB, and patch only measured gaps.

### 2026-06-04 06:50 - Patched Product List CASCADE parity gap
- Captured fresh EB Product List storefront evidence on desktop and mobile: CASCADE wrapper aliases, 300px column behavior, 145px category tabs, 70px product rows, 200px/90px product grid split, and cart drawer footer classes.
- Reused same-day live evidence from the Product Grid, Horizontal Slots, and Vertical Slots parity issues for the other PPB templates; the EB admin template save flow became stuck on Product Grid, so no new replacement evidence was trusted over the existing completed captures.
- Added EB-compatible CASCADE DOM aliases and measured layout styles in `app/assets/bundle-widget-product-page.js`, `app/assets/widgets/product-page/templates/cascade-template.js`, and `app/assets/widgets/product-page-css/templates/inpage-cascade.css`.
- Added focused PPB template contract assertions and `test-spec/ppb-template-deep-parity-audit.spec.md`.
- Bumped widget version to `2.9.71`, rebuilt widget assets, minified CSS, and rebuilt graphify outputs.
- Verification: raw JS syntax checks passed; `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand` passed; `npm run build:widgets` passed; `npm run minify:assets css` passed; scoped ESLint completed with zero errors.
- Note: remote storefront smoke requires deploying the regenerated Shopify extension assets; no autonomous deploy was run.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`

## Phases Checklist
- [x] Phase 1: Product List live EB audit and WPB comparison
- [x] Phase 2: Product Grid live EB audit and WPB comparison
- [x] Phase 3: Horizontal Slots live EB audit and WPB comparison
- [x] Phase 4: Vertical Slots live EB audit and WPB comparison
- [x] Phase 5: Patch confirmed parity gaps
- [x] Phase 6: Widget build, lint, graph rebuild, and commit
