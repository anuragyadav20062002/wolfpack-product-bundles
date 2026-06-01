# Issue: EB Configure Completion Parity
**Issue ID:** eb-configure-completion-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 21:06

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
- [x] Phase 2 - Creation wizard contextual save bar parity
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

### 2026-06-01 20:24 - Creation wizard contextual save bar slice started
- Next explicit task selected: replace the creation wizard's save-on-next behavior with contextual SaveBar behavior like the configure/edit pages.
- Current route evidence: `handleNext` submits `saveConfig`, `savePricing`, and `saveAssets` before advancing; this is the behavior to remove.
- Planned files: create wizard route, focused route source contract, test spec, issue log, and graph outputs.

### 2026-06-01 20:31 - Creation wizard contextual save bar validated
- Added App Bridge contextual SaveBar to the creation wizard route with Save and Discard handlers for the active wizard page.
- Removed save-on-next behavior: `Next` and `Back` now gate dirty pages and show the save/discard prompt instead of submitting data.
- Save now persists the active wizard page without advancing; Discard restores the active page from its saved baseline.
- Added `tests/unit/routes/create-wizard-contextual-savebar.test.ts` and `test-spec/create-wizard-contextual-savebar.spec.md`.
- Validated with focused Jest and scoped ESLint; ESLint reported 0 errors.
- Chrome smoke confirmed dirty edit shows Shopify `Unsaved changes`, `Next` is blocked while dirty, `Discard` restores and hides the SaveBar, clean `Next` advances to Pricing, and `Save` persists then hides the SaveBar.
- Restored the temporary pricing smoke-test data in the dev database after the Chrome save probe.

### 2026-06-01 20:32 - Post-commit graph hook follow-up
- The commit hook rebuilt graph outputs after the creation wizard SaveBar commit and left `graphify-out/GRAPH_REPORT.md` dirty.
- Follow-up commit will include the generated graph report plus this issue-log entry only.

### 2026-06-01 20:34 - Bundle Product Edit Product workflow audit start
- Next explicit task selected: FPB/PPB Bundle Product card `Edit Product` workflow parity.
- Docs show prior conflicting implementations (`shopify.navigate`, `_blank`, and direct-link fallback), so this slice starts by verifying current code and Chrome behavior against EB before editing.
- Scope remains both configure/edit pages plus API/DTO behavior if current evidence shows gaps.

### 2026-06-01 20:38 - PPB template listing correction
- User clarified EB template selection: the server lists the product page templates available on the merchant store, and the merchant-selected template is used directly.
- Current WPB server code still creates bundle-container template recommendations and rewrites product template labels, so this edit removes generated/fallback rows and keeps the selected handle unchanged.
- Scope: PPB Place Widget template source/listing/deep-link behavior only; no unrelated configure sections.

### 2026-06-01 20:42 - PPB template listing correction validated
- Removed generated bundle-container template recommendations, removed fallback product-template row creation, and removed client-side `ensure-product-template` from the Place Widget click flow.
- Deep-link resolution now uses the selected server-returned template handle unchanged.
- Focused Jest passed: `npx jest tests/unit/lib/product-page-admin-sections.test.ts --runInBand` with 11/11 tests.
- Scoped ESLint passed with 0 errors for the touched route, shared handler, product-page admin section helper, and unit test.
- Chrome smoke on the SIT Admin PPB configure page confirmed `Place Widget` shows button loading first, opens `Select Product Page Template` only after data is ready, lists the server-returned `Default product` template row, and selecting it opens Theme Editor with `template=product`.

### 2026-06-01 20:44 - Bundle Product Edit Product admin-modal gap
- EB Chrome evidence: clicking `Edit Product` in the Bundle Product card opens Shopify's native Admin product editor modal over the embedded app.
- WPB Chrome evidence before this edit: clicking `Edit Product` opens a separate `/products/{id}` Admin tab because both FPB and PPB routes hardcode a `trycloudflare.com` `_blank` fallback.
- Next edit: remove the host-specific fallback branch and use App Bridge `shopify.navigate(adminProductUrl)` for FPB and PPB, keeping only a throw-time browser fallback.

### 2026-06-01 20:48 - Bundle Product Edit Product validation
- Updated FPB and PPB `openProductInAdmin` helpers to attempt `shopify.navigate(adminProductUrl)` first and removed the hardcoded `trycloudflare.com` branch.
- Added `tests/unit/routes/bundle-product-edit-product-admin-modal.test.ts` and `test-spec/bundle-product-edit-product-admin-modal.spec.md`.
- Focused Jest passed: `npx jest tests/unit/routes/bundle-product-edit-product-admin-modal.test.ts --runInBand` with 2/2 tests.
- Scoped ESLint passed with 0 errors for both configure routes and the new route source contract.
- Chrome EB evidence confirmed the target behavior: native Shopify product editor modal opens over EB.
- Chrome WPB SIT evidence after the edit: App Bridge still emits a local tunnel postMessage origin mismatch, so the throw-time fallback opens the Admin product page in a new tab for both PPB and FPB. This keeps SIT usable while production/admin-origin behavior uses the EB-native `shopify.navigate` path.

### 2026-06-01 20:54 - Product template naming correction
- User clarified that product page templates can have arbitrary merchant/theme names, and the modal must list the server-returned template names without resolving them to fixed labels such as `Cart transform` or `Default product`.
- Current server code already preserved the selected template handle, but still rewrote display titles by special-casing `product`, stripping `product.`, and title-casing suffixes.
- Updated the server template payload so `title`, `id`, and `handle` all use the asset-derived product template name unchanged; the modal selection still passes the clicked template object directly into the Theme Editor deep link builder.

### 2026-06-01 20:58 - Product template naming validation
- Focused Jest passed: `npx jest tests/unit/lib/product-page-admin-sections.test.ts --runInBand` with 12/12 tests.
- Scoped ESLint passed with 0 errors for the shared template handler, deep-link helper, and unit contract; warnings are existing unsafe-any warnings in touched files.
- Chrome smoke on the SIT Admin PPB configure page confirmed `Place Widget` shows loading on the button first, opens `Select Product Page Template`, lists the asset-derived template row `product`, and selecting it opens Shopify Theme Editor with `template=product`.
- Graph rebuild completed with `graph.json` and `GRAPH_REPORT.md` regenerated.

### 2026-06-01 21:06 - User corrections queued for later slices
- User clarified the `Edit Product` parity target: EB opens a Shopify product-page form inside an in-admin modal, not a new Admin product page tab. Take this up after the other listed tasks are completed.
- User clarified Place Widget still has a remaining product-context gap: the Theme Editor deep link now preserves the selected template, but must also target the bundle parent product. Take this up later when the rest of the tasks are complete.
- User clarified readiness behavior: the readiness score is still an overlay, not an inline card. Create wizard should keep the compact gauge+score overlay, while edit/configure overlay should include the extra EB description text inline. Deferred this slice and reverted the in-progress inline-card patch.
