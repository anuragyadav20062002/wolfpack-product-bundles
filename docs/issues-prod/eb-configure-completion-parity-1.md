# Issue: EB Configure Completion Parity
**Issue ID:** eb-configure-completion-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 20:20

## Overview
Complete EB parity for the remaining PPB/FPB configure, creation wizard, product edit, storefront template, quantity validation, slot icon, step config, and readiness score card flows. Ground implementation in EB live UI/bundles/docs and validate incrementally in Chrome before committing each slice.

## Progress Log
### 2026-06-01 19:52 - Intake and audit start
- Scope accepted from user: PPB take-live modal, creation wizard contextual save bar, FPB/PPB product edit workflow, FPB storefront header/footer inheritance, quantity validation, slot icon/step config, and readiness score parity.
- Feature-pipeline skill is required by project instructions for new features, but no `feature-pipeline` skill/tool is available in this session; proceeding with issue logging, EB evidence audit, implementation, lint, Chrome e2e, graph rebuild, and incremental commits.
- First slice selected: PPB Take your bundle live flow because the user described a concrete broken loading/modal sequence.

## Related Documentation
- internal docs/EB Implementation Reference.md
- docs/competitor-analysis/16-eb-full-data-flow-investigation.md
- docs/issues-prod/eb-ui-clone-rewrite-1.md

## Phases Checklist
- [x] Phase 1 - PPB Take your bundle live flow modal/loading parity
- [ ] Phase 2 - Creation wizard contextual save bar parity
- [ ] Phase 3 - FPB/PPB Bundle Product card Edit Product workflow parity
- [ ] Phase 4 - FPB storefront template header/footer inheritance
- [ ] Phase 5 - FPB/PPB Enable Quantity Validation admin-to-storefront parity
- [ ] Phase 6 - Slot Icon and Step Config parity
- [ ] Phase 7 - Bundle Readiness score card state/UI parity
- [ ] Phase 8 - Full Chrome e2e sanity and EB gap comparison

### 2026-06-01 20:05 - PPB Take live EB/WPB audit
- EB PPB configure: `Place Widget` becomes busy/disabled while data loads; the modal opens only after data is ready.
- EB ready modal title is `Select Product Page Template`, with a compact centered panel, top-right close X, and rows `Cart transform` and `Default product`.
- WPB PPB configure currently opens a `Place Widget` modal immediately and shows `Loading templates...` inside the modal, which does not match EB and can remain stuck.
- Next edit: move theme-template loading before modal open, show spinner on the button, and restyle/retitle the ready modal to match EB.

### 2026-06-01 20:18 - PPB template-source correction
- Corrected the Place Widget approach after user review: EB does not resolve template names through a fixed `Cart transform` / `Default product` pair.
- The server must return the merchant store's available product page templates, the modal must list those returned templates, and clicking any row must use that selected template handle unchanged.
- Removed hardcoded template filtering/renaming and the cart-transform-specific URL special case from the in-progress patch.

### 2026-06-01 20:20 - PPB Place Widget parity validated
- Updated WPB PPB configure so `Place Widget` sets the button busy/disabled while templates load and opens `Select Product Page Template` only after server templates are ready.
- The modal now lists the server-returned product page template names directly and no longer shows an in-modal `Loading templates...` state.
- Added a focused unit assertion proving arbitrary merchant-selected template handles pass through the Theme Editor deep link builder.
- Validated with `npx eslint --max-warnings 9999 app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx app/lib/bundle-config/product-page-admin-sections.ts tests/unit/lib/product-page-admin-sections.test.ts` with 0 errors, and `npx jest tests/unit/lib/product-page-admin-sections.test.ts --runInBand` with 10/10 tests passing.
- Chrome e2e on the WPB embedded app confirmed the EB-like sequence: button busy first, modal after data readiness, server-returned `Product Pages (Default)` row displayed, and selecting it opened Shopify Theme Editor for the selected product template.
