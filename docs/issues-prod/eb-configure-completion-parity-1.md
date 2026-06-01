# Issue: EB Configure Completion Parity
**Issue ID:** eb-configure-completion-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 21:55

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

### 2026-06-01 21:58 - Product editor Intents API parity started
- Current WPB `shopify.navigate(adminProductUrl)` path still targets full Admin product navigation rather than the EB-style in-admin product editor workflow.
- Official Shopify App Bridge Intents API exposes `edit:shopify/Product` for opening the existing product editor, so this slice will try that intent first for FPB and PPB Bundle Product `Edit Product`.
- Keep the existing Admin URL navigation/new-tab fallback only for stores or runtimes where the intent API is unavailable or rejects.

### 2026-06-01 22:02 - Product editor Intents API parity validated
- Updated FPB and PPB `openProductInAdmin` helpers to invoke `edit:shopify/Product` with the bundle parent product GID before falling back to Admin URL navigation.
- Updated `tests/unit/routes/bundle-product-edit-product-admin-modal.test.ts` and `test-spec/bundle-product-edit-product-admin-modal.spec.md` to lock the intent-first contract.
- Focused Jest passed: `npx jest tests/unit/routes/bundle-product-edit-product-admin-modal.test.ts --runInBand` with 2/2 tests.
- Scoped ESLint passed with 0 errors for both configure routes and the focused unit test; remaining warnings are existing route-level warnings.
- Chrome SIT smoke confirmed PPB and FPB `Edit Product` now open Shopify's native product editor dialog over the Admin app.
- User clarified Place Widget still has a remaining product-context gap: the Theme Editor deep link now preserves the selected template, but must also target the bundle parent product. Take this up later when the rest of the tasks are complete.
- User clarified readiness behavior: the readiness score is still an overlay, not an inline card. Create wizard should keep the compact gauge+score overlay, while edit/configure overlay should include the extra EB description text inline. Deferred this slice and reverted the in-progress inline-card patch.

### 2026-06-01 21:07 - Product template modal close fix started
- User reported the `Select Product Page Template` modal does not close after opening.
- Existing shared modal helper listened for `dismiss` and `hide`; this can miss close-button variants from `s-modal` that emit `close` or `afterhide`, leaving React state in the open state.
- Initial shared-listener extension to `close`, `afterhide`, and a guarded click path passed tests but Chrome still reproduced the non-closing built-in `s-modal` close button after reload.
- Updated the PPB page-selection modal to use a controlled custom dialog with its own X button and backdrop wired directly to `closePageSelectionModal`, while preserving the EB-style compact title and server-returned template rows.

### 2026-06-01 21:15 - Product template modal close validation
- Focused Jest passed: `npx jest tests/unit/routes/modal-utils-close-contract.test.ts tests/unit/routes/ppb-template-modal-close-contract.test.ts --runInBand` with 4/4 tests.
- Scoped ESLint passed with 0 errors for the shared modal helper, PPB configure route, and focused route tests; warnings are existing route unsafe-any/security warnings.
- Chrome smoke on SIT PPB configure confirmed `Place Widget` opens the controlled `Select Product Page Template` dialog with the server-returned `product` row, and clicking the dialog's X closes it immediately.

### 2026-06-01 21:18 - FPB Slot Icon redirect fix started
- User reported Bundle Settings → Slot Icon `Change Icon` redirects to Step Setup.
- Current FPB configure code confirms the bug: `Change Icon` calls `handleSectionChange("step_setup")` instead of opening the icon picker in Bundle Settings.
- Planned edit: wire Slot Icon to the existing `showIconPickerForStep`/`FilePicker` flow for `settingsStep.id`, keep the merchant on Bundle Settings, and preserve direct `stepImage` persistence.

### 2026-06-01 21:22 - FPB Slot Icon redirect fix validation
- Updated FPB Bundle Settings → Slot Icon `Change Icon` to toggle the existing `FilePicker` for `settingsStep.id` in place and removed the Step Setup navigation from that control.
- Reset now clears `stepImage` and closes the picker if open.
- Focused Jest passed: `npx jest tests/unit/routes/fpb-slot-icon-change-icon-contract.test.ts --runInBand` with 2/2 tests.
- Scoped ESLint passed with 0 errors for the FPB configure route and focused test; warnings are existing route unsafe-any/security warnings.
- Chrome smoke on SIT FPB configure confirmed clicking Bundle Settings → Slot Icon → `Change Icon` opens the image picker modal while remaining in Bundle Settings.

### 2026-06-01 21:24 - Step Config EB visual parity started
- EB Step Config evidence: compact thumbnail on the left, remove icon over the thumbnail when populated, `Replace` action below the thumbnail, and `Step Title` field aligned to the right.
- WPB FPB evidence before this edit: Step Config used a large 140x120 icon box and a single `Upload` button, which did not match the EB compact layout.
- Planned edit: align FPB and PPB Step Config thumbnail sizing, action labels, and remove behavior while preserving the direct `stepImage` persistence contract.

### 2026-06-01 21:27 - Step Config EB visual parity validation
- Updated shared FPB/PPB Step Config styling to the EB-like compact thumbnail layout and added an overlaid remove control for populated step icons.
- Updated FPB and PPB Step Config action text from `Upload` to `Upload file`, keeping `Replace` for populated icons and preserving the existing `FilePicker` upload flow.
- Focused Jest passed: `npx jest tests/unit/routes/step-setup-step-config-image-contract.test.ts --runInBand` with 4/4 tests.
- Scoped ESLint passed with 0 errors for both configure routes and the focused test; warnings are existing route unsafe-any/security warnings.
- Chrome smoke on SIT FPB configure confirmed Step Setup → Step Config renders `Upload file` and opens the image picker modal without leaving Step Setup.

### 2026-06-01 21:31 - Quantity validation admin control parity started
- EB PPB Bundle Settings evidence: `Enable Quantity Validation` renders a checkbox next to the heading, with `Maximum allowed quantity per product` below it.
- WPB PPB/FPB configure used switch controls for the same setting, which is visually different from EB's checkbox control.
- Planned edit: use checkbox controls for `Enable Quantity Validation` in FPB and PPB admin configure pages while preserving the existing `productSlotsEnabled` state and max-quantity disabling behavior.

### 2026-06-01 21:35 - Quantity validation admin control parity validation
- Updated FPB and PPB configure Bundle Settings so `Enable Quantity Validation` uses a checkbox control, matching the EB captured Admin surface.
- Preserved the existing `productSlotsEnabled` state wiring and kept the maximum quantity field disabled when quantity validation is off.
- Focused Jest passed: `npx jest tests/unit/routes/ppb-bundle-settings-surface-contract.test.ts tests/unit/routes/fpb-bundle-settings-surface-contract.test.ts --runInBand` with 3/3 tests.
- Scoped ESLint passed with 0 errors for both configure routes and the focused Bundle Settings contract tests; warnings are existing route unsafe-any/security warnings.
- Chrome smoke on SIT FPB configure confirmed Bundle Settings renders `Enable quantity validation` as a checkbox and leaves `Maximum allowed quantity per product` disabled while unchecked.

### 2026-06-01 21:29 - Readiness overlay compact EB parity started
- EB configure overlay evidence: expanded readiness panel uses compact rows with title and points on one row, no descriptions on completed rows, a chevron only on the actionable incomplete row, and footer text `Almost there. A few more steps to go.` at score 85.
- WPB configure evidence before this edit: expanded panel used taller card rows with descriptions on every item and footer text `Your bundle isn't ready to sell yet.` at score 65.
- Planned edit: centralize the fix in `BundleReadinessOverlay` so FPB/PPB configure overlays align with EB while preserving the existing compact create-wizard collapsed trigger behavior.

### 2026-06-01 21:36 - Readiness overlay compact EB parity validation
- Updated `BundleReadinessOverlay` to render compact EB-like rows with the label and points on one row, descriptions only for incomplete action rows, and chevrons only for incomplete actionable rows.
- Updated the incomplete medium/high-score footer copy to `Almost there. A few more steps to go.` while keeping the ready state copy for fully complete bundles.
- Focused Jest passed: `npx jest tests/unit/bundle-readiness-overlay-contract.test.ts --runInBand` with 4/4 tests.
- Scoped ESLint passed with 0 errors for `BundleReadinessOverlay.tsx` and its focused source contract test.
- Chrome smoke on SIT FPB configure confirmed the expanded readiness overlay uses compact rows, right-aligned points, and the EB-style near-complete footer text.

### 2026-06-01 21:37 - Post-commit graph hook follow-up
- The commit hook rebuilt graph outputs after the readiness overlay commit and left `graphify-out/GRAPH_REPORT.md` dirty.
- Follow-up commit will include the generated graph report plus this issue-log entry only.

### 2026-06-01 21:37 - Product editor native modal parity started
- EB parity target remains the native Shopify Admin product editor surface for Bundle Product → `Edit Product`, not a new Admin tab or a full-page Admin redirect.
- Current WPB FPB/PPB helpers still build absolute `https://admin.shopify.com/store/.../products/...` URLs and call `shopify.navigate()`, with a `_blank` fallback that previously reproduced the wrong new-tab behavior in SIT.
- Shopify Navigation API docs use `shopify://admin/products/{id}` with `target="_top"` for Admin resource navigation from embedded apps.
- Planned edit: switch FPB/PPB helpers to dispatch a top-targeted `shopify://admin/products/{id}` link from the click handler, remove the `_blank` fallback, and update the focused navigation contract.

### 2026-06-01 21:40 - FPB page selector modal close fix started
- User reported the Select Product Page Template modal does not close after opening.
- Current PPB page-selection flow already uses a controlled custom dialog, but FPB still renders the page/template selector through `s-modal` plus close-event synchronization.
- Planned edit: move the FPB page-selection modal to the same controlled dialog pattern with a direct gray X close button, backdrop close, and preserved page/template selection behavior.

### 2026-06-01 21:48 - FPB/PPB selector close validation
- Converted the FPB page/template selector from `s-modal` to a controlled custom dialog with a defined gray X close button and backdrop close path.
- Added `tests/unit/routes/fpb-page-selection-modal-close-contract.test.ts` plus `test-spec/fpb-page-selection-modal-close.spec.md` to lock the controlled-dialog close contract.
- Focused Jest passed: `npx jest tests/unit/routes/fpb-page-selection-modal-close-contract.test.ts tests/unit/routes/ppb-template-modal-close-contract.test.ts --runInBand` with 4/4 tests.
- Scoped ESLint passed with 0 errors for the FPB configure route and the FPB/PPB close contract tests; warnings are existing route warnings.
- Chrome smoke on SIT FPB configure confirmed `Embed Upsell Button` opens the controlled page selector and the gray X closes it.
- Chrome smoke on SIT PPB configure confirmed `Place Widget` opens `Select Product Page Template` and the gray X closes it.
- During commit-boundary cleanup, the in-progress `shopify://admin/products/{id}` product-editor attempt was Chrome-smoked and still opened the full Admin product page instead of an in-admin modal; that code was not included in this modal-close slice and remains a separate unresolved follow-up.
- User queued a later Bundle Status UI cleanup: render Bundle Status in its own card and remove the repeated `Bundle Status` label from the dropdown.

### 2026-06-01 21:50 - Post-commit graph hook follow-up
- The commit hook rebuilt graph outputs after the FPB page selector close commit and left `graphify-out/GRAPH_REPORT.md` dirty.
- Follow-up commit will include the generated graph report plus this issue-log entry only.

### 2026-06-01 21:55 - Readiness overlay create/configure split started
- User clarified the readiness widget should remain an overlay: create wizard should use the minified gauge/score overlay only, while edit/configure pages should keep the fuller overlay with inline description text.
- Current `BundleReadinessOverlay` renders the same expandable checklist everywhere, and the create wizard opens it after the guided tour.
- Planned edit: add a compact variant to the shared overlay, pass it only from the create wizard, and keep FPB/PPB configure on the detailed overlay.

### 2026-06-01 22:00 - Readiness overlay create/configure split validation
- Added a `variant="compact"` mode to `BundleReadinessOverlay` that renders only the readiness gauge/score control and suppresses the checklist panel, dim overlay, text label, and chevron.
- Wired the compact variant only in the bundle creation wizard; FPB/PPB configure pages remain on the detailed overlay.
- Added `tests/unit/bundle-readiness-overlay-variant-contract.test.ts` and `test-spec/bundle-readiness-overlay-variant.spec.md`.
- Focused Jest passed: `npx jest tests/unit/bundle-readiness-overlay-contract.test.ts tests/unit/bundle-readiness-overlay-variant-contract.test.ts --runInBand` with 7/7 tests.
- Scoped ESLint passed with 0 errors for the overlay component, create configure route, and focused tests; warnings are existing create-route warnings.
- Chrome smoke on SIT create configure confirmed the readiness control renders as compact gauge-only with no checklist rows.
- Chrome smoke on SIT FPB configure confirmed the detailed readiness overlay still exposes readiness item rows and the near-complete footer.
