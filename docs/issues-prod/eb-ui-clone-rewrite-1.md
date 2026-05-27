# Issue: EB Evidence UI Clone Rewrite
**Issue ID:** eb-ui-clone-rewrite-1
**Status:** In Progress
**Priority:** High
**Created:** 2026-05-26
**Last Updated:** 2026-05-27 08:26 IST

## Overview

Rewrite the Full Page Bundle and Product Page Bundle configure/Admin UI plus the storefront runtimes to match the evidence-backed Easy Bundles audit. The rewrite is gated by evidence: no control or template may be marked complete until Admin UI, persistence, runtime JSON, desktop storefront, mobile storefront, and cart proof are captured where relevant.

Emails and Customize Emails are out of scope. Competitor references remain docs-only and must not appear in application code identifiers, comments, or filenames.

## Progress Log

### 2026-05-27 08:20 IST - Step Setup action-order parity slice started
- Re-read the captured FPB and PPB Step Setup screenshots from `/private/tmp/eb-complete-configure-audit-2026-05-25/`: `fpb-admin-step-setup-after-save.png` and `ppb-admin-step-setup-products-selected.png`.
- Evidence shows the Step Setup header actions in this order: Multi Language icon, duplicate/clone icon, delete icon. The FPB screenshot also shows no second step-level Multi Language button below the Step Name field; category Multi Language remains beside Category Name.
- Current FPB and PPB routes render duplicate before the Step Setup language icon, and the FPB route renders an extra step-level Multi Language button below Step Name. Scope: add source-contract coverage, patch only those Step Setup header/body controls, verify, and commit.

### 2026-05-27 08:22 IST - Step Setup action-order parity slice verified
- Added source-contract coverage to `tests/unit/routes/step-setup-multilanguage-ui-contract.test.ts` for the evidenced Step Setup header action order and for keeping the step-level language action out of the FPB Step Name field body.
- Patched both configure routes so Step Setup header actions render Multi Language, clone, delete, and removed the extra FPB step-level Multi Language button below Step Name. Category Multi Language remains wired beside Category Name.
- Verification passed: Step Setup route contract suite with 23 tests, modified-file ESLint with 0 errors, code/test competitor-reference scan with no matches, and `npm run build`.

### 2026-05-27 08:26 IST - Step Setup action-order SIT deploy blocked by Shopify device login
- Committed the verified action-order slice as `ed5a882c`.
- Ran the user-authorized package deploy command `npm run deploy:sit -- --allow-updates`; the Rust Cart Transform build completed, then Shopify CLI required device login with user verification code `XCSQ-VKCV`.
- Terminated the waiting Shopify CLI process because this session cannot complete the browser/device login. No SIT release was created from this attempt, so live Admin proof for the action-order slice remains pending after an authenticated deploy.

### 2026-05-27 08:09 IST - PPB Step Setup variant flag slice started
- Re-read the Step Setup evidence and implementation reference for the variant-display control: PPB stores `displayVariantsAsIndividualProducts` per category, and the Product Page Step Setup proof shows Category 1 persisted `displayVariantsAsIndividualProducts: true` while storefront rendered variants as separate cards.
- Current Product Page route source renders the `Display variants as individual products` checkbox but writes `displayVariantsAsIndividual`, while the persistence/runtime category contracts read `displayVariantsAsIndividualProducts`; this makes the visible Admin control insufficient for the evidenced save payload.
- Scope for this slice: add RED route/source coverage for the PPB category variant checkbox contract, patch the route to hydrate and update the direct category key, verify focused tests/lint/build/graph, then commit before continuing broader Step Setup visual parity.

### 2026-05-27 08:13 IST - PPB Step Setup variant flag slice verified
- Added `tests/unit/routes/step-setup-category-variant-ui-contract.test.ts` to require the Product Page category checkbox to hydrate/update `StepCategory[].displayVariantsAsIndividualProducts` directly and to create new categories with explicit `displayVariantsAsIndividualProducts=false` and `displayVariantsAsSwatches=false`.
- Patched the Product Page configure route so the visible category checkbox no longer writes the unused `displayVariantsAsIndividual` alias.
- Verification passed: `npx jest tests/unit/routes/step-setup-category-variant-ui-contract.test.ts tests/unit/routes/ppb-save-bundle.test.ts tests/unit/lib/bundle-config-contracts.test.ts --runInBand` with 55 tests, modified-file ESLint with 0 errors, `npm run build`, code/test competitor-reference scan with no matches, graph rebuild via graphify pipx environment, and `git diff --check`.

### 2026-05-27 08:17 IST - PPB Step Setup variant flag SIT deploy blocked by Shopify device login
- Ran the user-authorized package deploy command `npm run deploy:sit -- --allow-updates`; the Rust Cart Transform build completed, then Shopify CLI required device login with user verification code `ZKRM-VZDN`.
- Terminated the waiting Shopify CLI process because this session cannot complete the browser/device login. No SIT release was created from this attempt, so live Admin/save proof for the variant-display Step Setup slice remains pending after an authenticated deploy.

### 2026-05-27 07:50 IST - Step Setup category rules slice started
- Re-read the Step Setup audit and implementation reference for the evidenced rules behavior: category rules appear only after more than one category exists, step rules and category rules are mutually exclusive, and EB persists category rules inside each category while step-level `conditions.isEnabled` remains false after switching to category rules.
- Current WPB route source still renders a Category rules radio option unconditionally and handles it by adding step-level conditions, so the visible control is not wired to the evidenced category `conditions` contract.
- Scope for this slice: add RED contracts for Step Setup rule-mode gating and category-level rule editing, patch both FPB and PPB configure routes to manipulate category `conditions`/`autoNextStepOnConditionMet`, verify with focused tests/lint/build, then commit before continuing the broader Step Setup parity loop.

### 2026-05-27 08:01 IST - Step Setup category rules slice verified
- Added the RED-to-green route/source contract `tests/unit/routes/step-setup-rule-mode-ui-contract.test.ts` for multi-category gating, step/category mutual exclusion, category-level `conditions[]`, camel-cased category condition operators, and editable no-id persisted category rules.
- Patched both Full Page and Product Page configure routes so Category rules only appear after more than one category, switching to Category rules clears step rules and creates the first category rule, switching to Step rules clears category rules, and category rule rows edit `type`, `condition`, `value`, and `autoNextStepOnConditionMet`.
- Added shared category rule accordion styling and the direct `CATEGORY_CONDITION_OPERATOR_OPTIONS` constants matching the captured Admin payload shape.
- Updated the evidence manifest and test spec while keeping `fpb-step-setup` and `ppb-step-setup` partial until live Admin screenshot, save payload/response, DB/metafield, runtime, desktop, and mobile proof are captured on the same fixture.
- Verification passed: focused Jest with 104 tests, modified-file ESLint with 0 errors, `npm run build`, code/test competitor-reference scan, `git diff --check`, and graph rebuild via the graphify pipx environment.

### 2026-05-27 08:06 IST - Step Setup category rules SIT deploy blocked by Shopify device login
- Committed the verified category-rules slice as `71c50bb0`.
- Ran the user-authorized package deploy command `npm run deploy:sit -- --allow-updates`; the Rust Cart Transform build completed, then Shopify CLI required device login with user verification code `XGRZ-NXRV`.
- Terminated the waiting Shopify CLI process because this session cannot complete the browser/device login. No SIT release was created from this attempt, so live Admin/save proof for the category-rules slice remains pending after an authenticated deploy.

### 2026-05-27 07:24 IST - Step Setup Multi Language slice verified before commit
- Added Step Setup Multi Language wiring for both Product Page and Full Page configure routes: step-level buttons now open the evidenced `Step Name` / `Step Title` translation modal, category buttons open `Category Name` / `Category Title`, and both save into direct `multiLangData` contracts.
- Added `BundleStep.multiLangData` with migration `20260527070100_add_step_multilang_data`; existing category `multiLangData` is now wired from Admin state through save payload, DB, and metafield/runtime formatting.
- Captured WPB Admin proof outside the worktree: `/private/tmp/wpb-ppb-step-setup-step-multilanguage-modal-2026-05-27.png` and `/private/tmp/wpb-ppb-step-setup-category-multilanguage-modal-2026-05-27.png`.
- Captured a live save request/response 500 at `/private/tmp/wpb-ppb-step-setup-multilang-save-500-2026-05-27.network-request` and response; the response showed the old running dev preview Prisma client rejected `BundleStep.multiLangData`.
- Verified the current generated client and SIT database are correct: `npm run generate:prisma`, `npx prisma validate`, generated-client grep for `multiLangData`, `npx prisma migrate status`, and a rollback-only Prisma update probe all passed.
- Added save-handler assertions for FPB and PPB step translation DB create payloads and bundle-product metafield sync payloads.
- Verification passed: `npx jest tests/unit/routes/step-setup-multilanguage-ui-contract.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/routes/ppb-save-bundle.test.ts tests/unit/lib/bundle-config-contracts.test.ts --runInBand` with 95 tests, modified-file ESLint with 0 errors, `npm run build`, code/test competitor-reference scan with no matches, `git diff --check`, and graph rebuild.
- Shopify CLI dev preview restart was blocked by required device login, so clean live save response proof is deferred to post-deploy or a logged-in dev session; the deployed SIT process will start with the regenerated Prisma client.

### 2026-05-27 07:01 IST - Step Setup category Multi Language slice started
- User requested 100% Step Setup parity plus wiring every implemented Multi Language button like EB, with no assumed implementation facts.
- Live PPB Step Setup evidence captured the Category Multi Language modal and help surfaces outside the worktree: `/private/tmp/eb-step-flow-how-to-setup-live-2026-05-27.png`, `/private/tmp/eb-categories-how-to-setup-live-2026-05-27.png`, `/private/tmp/eb-rules-learn-more-live-2026-05-27.png`, and `/private/tmp/eb-step-category-multilanguage-modal-live-2026-05-27.png`.
- Fresh EB save proof captured the category translation persistence shape at `/private/tmp/eb-ppb-step-category-multilang-update-2026-05-27.network-request` and response file: `productsData1.categories.category98476.multiLangData.es.{name,title}`.
- Scope for this slice: wire the disabled Step Setup category Multi Language buttons in both configure routes to the existing translation modal, persist category `multiLangData` with the evidenced locale-keyed `name`/`title` shape, add focused tests, verify in Chrome, then commit before continuing broader Step Setup visual parity.

### 2026-05-27 06:51 IST - FPB Bundle Visibility visual width pass ready to commit
- Verification passed: `npx jest tests/unit/routes/fpb-bundle-visibility-ui-contract.test.ts tests/unit/routes/fpb-save-bundle.test.ts --runInBand` with 40 tests, route/test ESLint with 0 errors, `npm run build`, code/test competitor-reference scan with no matches, graph rebuild via the graphify pipx venv, and `git diff --check`.
- ESLint is not configured to parse `.css` files in this repo's current TypeScript project parser setup, so the CSS change was covered by the source contract test, live Chrome proof, build, and diff check instead of CSS-file ESLint.
- Next: stage only the FPB visibility route/CSS/test/docs/graph files and commit with the required issue prefix.

### 2026-05-27 06:48 IST - FPB Bundle Visibility visual width pass verified
- Added the focused visibility source/CSS contract for the reference-width shell: `950px` content canvas, `310px` left rail, `39px` header-to-card gap, and visibility-only suppression of the top app-extension warning.
- Patched the Full Page configure route/CSS and captured updated embedded Admin proof outside the worktree: `/private/tmp/wpb-fpb-bundle-visibility-overview-header-gap-patch-2026-05-27.png` and `/private/tmp/wpb-fpb-bundle-widget-header-gap-patch-2026-05-27.png`.
- Focused contract passed: `npx jest tests/unit/routes/fpb-bundle-visibility-ui-contract.test.ts --runInBand`.
- Next: run the full focused verification stack, rebuild graph outputs, then commit this visual-width follow-up slice.

### 2026-05-27 06:44 IST - FPB Bundle Visibility visual width pass started
- Compared the committed WPB Bundle Visibility overview screenshot with the captured reference screenshot and confirmed two structural mismatches: WPB's left setup rail is `274px` wide instead of the reference's roughly `310px`, and the top app-extension warning pushes the visibility content down in the disabled-app-embed state.
- Scope for this follow-up slice: add focused source/CSS contracts for the visibility rail width and visibility-only top-banner suppression, patch the Full Page configure route/CSS, recapture Chrome proof, rerun focused verification, and commit.
- Next: add the RED test assertions, patch the route/CSS, then verify against the live embedded Admin page.

### 2026-05-27 06:39 IST - FPB Bundle Visibility slice verified before commit
- Verification passed: `npx jest tests/unit/routes/fpb-bundle-visibility-ui-contract.test.ts tests/unit/routes/fpb-save-bundle.test.ts --runInBand` with 39 tests, modified-file ESLint with 0 errors, `npm run build`, code/test competitor-reference scan with no matches, `git diff --check`, and graph rebuild via the graphify pipx venv.
- Graph rebuild updated `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json`; trimmed generated trailing whitespace from the report before the final diff check.
- Next: commit the staged Full Page configure route/server/CSS, route tests, test spec, issue log, evidence manifest, and graph outputs with the required issue prefix.

### 2026-05-27 06:37 IST - FPB Bundle Visibility compact save proof captured
- Added RED-to-green coverage for the Full Page Bundle Visibility overview/Widget source contract, App Bridge product and collection picker callbacks, compact targeting references, current-state `bundleUpsellConfig` serialization, DB persistence, and bundle-product metafield sync input.
- Patched the Full Page configure route, save handler, and route stylesheet so Bundle Visibility uses the cloned card shell and Bundle Widget saves the direct upsell-widget contract instead of stale loaded config.
- Captured Chrome Admin proof outside the worktree: `/private/tmp/wpb-fpb-bundle-visibility-overview-after-clone-css-2026-05-27.png`, `/private/tmp/wpb-fpb-bundle-widget-after-clone-css-2026-05-27.png`, `/private/tmp/wpb-fpb-bundle-widget-specific-collection-compact-before-save-2026-05-27.png`, and `/private/tmp/wpb-fpb-bundle-widget-specific-collection-compact-after-save-2026-05-27.png`.
- Captured save proof outside the worktree: `/private/tmp/wpb-fpb-bundle-widget-specific-collection-save-compact-200-2026-05-27.network-request` and `/private/tmp/wpb-fpb-bundle-widget-specific-collection-save-compact-200-2026-05-27.network-response`; the response includes `bundleUpsellConfig.widgetConfiguration.displayConfiguration` with compact `Home page` collection references.
- Direct SIT DB read confirmed `upsellWidgetEnabled=true`, `upsellWidgetDisplayOn="specific_collections"`, and matching compact `bundleUpsellConfig` saved on bundle `cmpfhj2m10000v0t038osl42y`.
- Next: rerun focused tests/lint/build, rebuild the graph, update the evidence manifest rows, and commit this FPB Bundle Visibility Admin/persistence slice.

### 2026-05-27 06:22 IST - FPB Bundle Visibility visual and direct-contract slice started
- Continuing the requested Discount & Pricing plus Bundle Visibility clone work after committing the Product Page Bundle Visibility Admin/picker compact persistence slice.
- Scope for this slice: Full Page Bundle Visibility overview, Bundle Widget Admin surface, product/collection targeting pickers, and direct `bundleUpsellConfig` persistence/metafield wiring for the evidenced upsell widget contract.
- Next: add RED route/source and save-handler tests, patch the Full Page configure route/CSS/server payload path, run focused verification, then capture Chrome Admin/save proof before committing.

### 2026-05-27 06:09 IST - PPB Bundle Visibility picker payload gap found
- Live Chrome save proof for a Widget-specific product target failed with a 500 response because `bundle_ui_config` exceeded Shopify's 64 KB metafield limit (`137,538` bytes) after the route serialized the full App Bridge product picker object.
- Captured failed save request/response outside the worktree at `/private/tmp/wpb-ppb-bundle-widget-specific-product-save-500-2026-05-27.network-request` and `/private/tmp/wpb-ppb-bundle-widget-specific-product-save-500-2026-05-27.network-response`.
- Next edit: add a RED source contract requiring compact product/collection visibility references, patch the picker normalizers/build path, rerun focused tests/build, and retry the live save.

### 2026-05-27 06:14 IST - PPB Bundle Widget compact save proof captured
- Added RED-to-green coverage requiring Bundle Visibility App Bridge picker selections to be compacted before save, with no raw product/collection object spreads in the persisted config path.
- Patched Product Page Bundle Visibility product/collection normalizers and the save builder so loaded raw selections and new picker selections are rewritten to compact ID/handle/title/image references before `bundleUpsellConfig` is submitted.
- Retried the same Widget-specific product save in Chrome after a hard reload; the compact request returned 200 with `bundleUpsellConfig` reduced to `1,801` bytes and saved proof at `/private/tmp/wpb-ppb-bundle-widget-specific-product-save-compact-200-2026-05-27.network-request`, `/private/tmp/wpb-ppb-bundle-widget-specific-product-save-compact-200-2026-05-27.network-response`, and `/private/tmp/wpb-ppb-bundle-widget-specific-product-compact-save-2026-05-27.png`.
- Updated the evidence manifest rows `ppb-visibility` and `ppb-widget` to partial with the new Admin/save proof while keeping storefront/runtime/mobile proof open.
- Next: run focused PPB visibility/save tests, modified-file lint, build, competitor-reference scan, graph rebuild, and commit this Bundle Visibility Admin/persistence slice.

### 2026-05-27 06:17 IST - PPB Bundle Visibility slice verified before commit
- Verification passed: `npx jest tests/unit/routes/ppb-bundle-visibility-ui-contract.test.ts tests/unit/routes/ppb-save-bundle.test.ts --runInBand` with 38 tests, modified-file ESLint with 0 errors, `npm run build`, code/test competitor-reference scan with no matches, `git diff --check`, and graph rebuild via the graphify pipx venv.
- The first graph rebuild command using system `python3` failed because the `graphify` module is not installed there; reran successfully with `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python`.
- Removed a stale test header comment that referenced the docs-only clone issue slug so the code/test competitor-reference scan stays clean.
- Next: stage the Product Page configure route/CSS, tests, issue log, manifest, test spec, and graph outputs, then commit with the required issue prefix.

### 2026-05-27 05:53 IST - PPB Bundle Visibility visual and picker slice started
- Continuing the requested Discount & Pricing plus Bundle Visibility clone work from the committed Product Page direct-contract wiring.
- Scope for this slice: Product Page Bundle Visibility overview, Widget, and Embed Admin surfaces, current-state product/collection targeting controls, and source-level visual markers needed for EB-style card/button/layout parity.
- Next: re-read the evidence and graph context, add RED route/source tests for the missing visual and picker contracts, patch the route/CSS, verify locally, then capture Chrome proof before committing.

### 2026-05-27 05:28 IST - Discount & Pricing plus Bundle Visibility parity slice started
- User requested a 100% EB copy for Discount & Pricing and Bundle Visibility, with permission to use non-Polaris controls where Polaris prevents exact parity.
- Scope: FPB and PPB Admin sections, save payload/DB/metafield wiring, dependency gates, storefront discount/visibility behavior, desktop/mobile/cart proof where relevant.
- Next: re-read EB reference/audit evidence, inspect current WPB contracts, add RED tests for the missing controls and gates, then implement and commit verified slices.

### 2026-05-27 05:40 IST - PPB Discount display persistence slice green
- Added Product Page Discount & Pricing TDD coverage for Bundle Quantity Options direct `boxSelection`, BXY `boxSelection` clearing, discount success/tier/locale message persistence, display-options hydration from `bundle.pricing`, and post-save bundle-product metafield sync.
- Wired the Product Page save handler to persist the direct BQO contract, rich pricing message contract, `ruleMessagesByLocale`, and runtime/metafield `displayOptions` without using a stale pricing alias.
- Verification passed: `npx jest tests/unit/routes/ppb-save-bundle.test.ts tests/unit/routes/discount-pricing-ui-contract.test.ts --runInBand`; modified-file ESLint passed with 0 errors; competitor-reference scan passed for code/test/runtime paths; `npm run build` passed; graph rebuild completed.
- Next: commit this persistence slice, then continue with Bundle Visibility and exact Admin visual parity for both FPB and PPB.

### 2026-05-27 05:42 IST - Bundle Visibility direct-contract slice started
- Re-read the captured FPB/PPB Bundle Visibility evidence and current WPB route/parser state.
- Confirmed the current Product Page save path only sends legacy widget toggles plus the previously loaded `bundleUpsellConfig`, so current Widget/Embed choices do not construct the direct persisted runtime contract.
- Next: add RED parser/save tests for Product Page Widget and Bundle Embed `bundleUpsellConfig`, then wire save payload and metafield sync before moving to the visual clone layer.

### 2026-05-27 05:48 IST - PPB Bundle Visibility direct-contract slice green
- Added Product Page Bundle Visibility TDD coverage requiring current Widget/Embed controls to serialize a direct `bundleUpsellConfig` object and blocking stale loaded-config resubmission.
- Wired the Product Page route to hydrate Widget and Embed state from saved `bundleUpsellConfig`, serialize current widget/embed title, description, image, targeting, and browsed-product state on save, and pass the direct config into DB/metafield sync.
- Verification passed: `npx jest tests/unit/routes/ppb-bundle-visibility-ui-contract.test.ts tests/unit/routes/ppb-save-bundle.test.ts --runInBand`; modified-file ESLint passed with 0 errors; competitor-reference scan passed for code/test/runtime paths; `npm run build` passed; graph rebuild completed.
- Next: commit this direct-contract slice, then continue with exact Admin visual parity and picker flows for Bundle Visibility.

### 2026-05-27 01:31 IST - SIT cart transform deploy authorized
- User explicitly authorized running the `package.json` SIT deploy command for the Cart Transform function.
- Next: run `npm run deploy:sit`, record the result, then continue the PPB template evidence loop from the current Product List runtime/metafield proof state.

### 2026-05-27 01:33 IST - SIT cart transform deploy completed
- First deploy attempt built the Rust WASM but Shopify CLI rejected non-interactive execution without `--allow-updates`.
- Reran the package script as `npm run deploy:sit -- --allow-updates`; Shopify built the Cart Transform, checkout UI, pixel, and theme extensions and released `wolfpack-product-bundles-sit-283`.
- Next: continue PPB Select Template proof capture and keep the manifest blocked from green until visual/runtime/mobile evidence is complete per row.

### 2026-05-27 01:34 IST - PPB Product List evidence manifest update started
- Product List now has WPB Admin selected-state, save request/response, DB, runtime JSON, desktop screenshot, and mobile screenshot proof after the template-metafield sync patch.
- Next edit: update the manifest row with these proof paths while keeping status `partial` until measured visual comparison against the reference artifacts is complete.

### 2026-05-27 01:35 IST - PPB Select Template dialog reliability slice started
- Live Chrome proof showed PPB Select Template can require keyboard fallback/reload because the native modal close/select path is not reliably controlled in the embedded Admin frame.
- Impact scope: `app.bundles.product-page-bundle.configure.$bundleId/route.tsx`, Product Page configure CSS, and Select Template route tests; widget god nodes are not touched.
- Next edit: add a RED route-source test for an app-owned accessible dialog, then replace only the PPB Select Template modal shell while preserving the existing template save payload.

### 2026-05-27 01:39 IST - PPB Select Template dialog local slice green
- Added RED-to-green coverage requiring Product Page Select Template to render a React-controlled `role="dialog"` overlay instead of the native `s-modal` shell.
- Replaced the Product Page Select Template modal shell with an app-owned dialog/backdrop, Escape/backdrop/close handling, keyboard-focusable template cards, and preserved the existing `updateBundleDesignTemplate` payload.
- Targeted verification passed: `npx jest tests/unit/routes/select-template.test.ts --runInBand` (14 tests).
- Next: run TypeScript/build checks for the changed route and capture live Admin proof that click/open/select/close works without reload fallback.

### 2026-05-27 01:44 IST - PPB Product Grid proof captured
- Captured the new app-owned Select Template dialog opening/closing without reload fallback at `/private/tmp/wpb-ppb-select-template-react-dialog-open-2026-05-27.png`.
- Captured Product Grid selected-state proof at `/private/tmp/wpb-ppb-template-product-grid-admin-selected-clean-2026-05-27.png`.
- First Product Grid save hit a dev-frame 502 during hot reload but did update DB; discarded that as save proof and retried from a clean reload.
- Clean retry save proof passed with HTTP 200 at `/private/tmp/wpb-ppb-template-product-grid-save-2026-05-27.network-request` and `/private/tmp/wpb-ppb-template-product-grid-save-2026-05-27.network-response`; DB proof is `/private/tmp/wpb-ppb-template-product-grid-db-2026-05-27.json`.
- Storefront proof captured `PDP_INPAGE + COGNIVE` runtime and screenshots for desktop and mobile.
- Next edit: update the Product Grid manifest row as `partial`; keep green blocked until measured visual comparison against reference screenshots is complete.

### 2026-05-27 01:46 IST - PPB Horizontal Slots proof captured
- Captured Horizontal Slots selected-state proof at `/private/tmp/wpb-ppb-template-horizontal-slots-admin-selected-2026-05-27.png`.
- Captured the live request body at `/private/tmp/wpb-ppb-template-horizontal-slots-save-2026-05-27.network-request`; the dev-frame network row remained pending and console history included a Cloudflare 502 from the local tunnel, so this is not accepted as clean save-response proof.
- DB proof at `/private/tmp/wpb-ppb-template-horizontal-slots-db-2026-05-27.json` shows `PDP_MODAL + MODAL`.
- Storefront proof captured `PDP_MODAL + MODAL` runtime and screenshots for desktop and mobile.
- Next edit: update the Horizontal Slots manifest row as `partial`, then retry a clean response proof or continue to Vertical Slots while keeping the response gap explicit.

### 2026-05-27 01:48 IST - PPB Vertical Slots proof captured
- Captured Vertical Slots selected-state proof at `/private/tmp/wpb-ppb-template-vertical-slots-admin-selected-2026-05-27.png`.
- Captured the live request body at `/private/tmp/wpb-ppb-template-vertical-slots-save-2026-05-27.network-request`; the dev-frame network row again remained pending, so clean save-response proof is still open.
- DB proof at `/private/tmp/wpb-ppb-template-vertical-slots-db-2026-05-27.json` shows `PDP_MODAL + SIMPLIFIED`.
- Storefront proof captured `PDP_MODAL + SIMPLIFIED` runtime and screenshots for desktop and mobile.
- Next edit: update the Vertical Slots manifest row as `partial`, then run the local verification stack for the Admin dialog/template-sync slice.

### 2026-05-27 01:50 IST - PPB template slice verification passed
- Focused Jest passed: `npx jest tests/unit/routes/select-template.test.ts tests/unit/routes/ppb-select-template-metafield-sync.test.ts --runInBand` (15 tests).
- Modified-file ESLint passed with 0 errors and existing warnings for the PPB route, PPB handler, and Select Template tests.
- Code competitor-reference scan passed for `app`, `tests`, `extensions`, `scripts`, and `prisma`; no matches for the banned terms.
- `npm run build`, `npm run build:widgets`, and `npm run minify:assets css` passed. Minified app-block CSS sizes are `97.6 KB` for Full Page and `50.9 KB` for Product Page.
- Graph rebuild completed and `git diff --check` passes after trimming graphify-generated trailing whitespace.
- Next: continue the evidence loop with the remaining PPB Select Template clean-response/visual-comparison gaps or move to the next manifest row that still lacks WPB proof.

### 2026-05-27 01:54 IST - PPB Horizontal Slots clean response captured
- Retried the Product Page Select Template Horizontal Slots save from the app-owned dialog without reload fallback.
- Captured clean HTTP 200 request/response proof at `/private/tmp/wpb-ppb-template-horizontal-slots-save-clean-2026-05-27.network-request` and `/private/tmp/wpb-ppb-template-horizontal-slots-save-clean-2026-05-27.network-response`.
- Refreshed DB proof at `/private/tmp/wpb-ppb-template-horizontal-slots-db-2026-05-27.json`, confirming `PDP_MODAL + MODAL`.
- Next edit: update the Horizontal Slots and Vertical Slots manifest rows so save-response proof status matches the captured files, then continue the measured visual comparison gaps.

### 2026-05-27 01:57 IST - PPB product-form placement mismatch started
- Visual comparison found a structural storefront mismatch for PPB modal-slot templates: EB renders the slot widget in the product form/right column, while the current WPB proof renders the bundle block below product recommendations.
- Re-read the single-embed architecture note confirming PPB embed behavior should relocate the widget after the product add-to-cart form.
- Impact scope: Product Page widget source/CSS tests and generated widget bundle only; Admin configure and DB contracts are not touched.
- Next edit: add a RED widget placement contract, then relocate the existing PPB container into the product form column before render.

### 2026-05-27 02:04 IST - Commit prep started
- User asked to start committing code during the full clone loop.
- The current rewrite spans Admin, storefront, Cart Transform, DCP, generated assets, migrations, tests, docs, and graph outputs; staging only the latest source files would leave generated assets/graph inconsistent with the working tree.
- Next: run the verification stack for the broad evidence rewrite progress slice, exclude temporary investigation artifacts from staging, then commit with the required issue prefix and impact body.

### 2026-05-27 02:12 IST - Broad progress verification passed
- Targeted Jest passed for the evidence rewrite slice: bundle-config contracts, Select Template routes, PPB template metafield sync, Product Page widget init/products, cart-transform service, and design-settings cart messaging.
- Rust Cart Transform verification passed with `cargo test` in `extensions/bundle-cart-transform-rs`.
- Full-project lint still fails on unrelated pre-existing `import/first` errors in old service tests; modified-file ESLint passed with 0 errors and warnings only for the files in this commit scope.
- `npm run build`, `npm run build:widgets`, `npm run minify:assets css`, graph rebuild via the pipx graphify environment, code competitor-reference scan, and `git diff --check` all passed.
- Next: stage the broad evidence rewrite progress slice while excluding temporary investigation artifacts, then create the first commit for this rewrite.

### 2026-05-27 02:13 IST - Broad progress commit finalized
- Created the first broad rewrite progress commit with the required `[eb-ui-clone-rewrite-1]` prefix and impact body.
- The commit includes the evidence-gated feature pipeline docs, Admin/storefront/data-contract implementation slices, Cart Transform runtime messaging work, Prisma migrations, generated widget assets, focused tests, and graph outputs.
- Temporary Chrome/network artifacts and scratch snapshots remain uncommitted.
- Next: continue the evidence-feedback loop from the remaining PPB storefront visual mismatches and keep manifest rows `partial` until every proof gate is satisfied.

### 2026-05-27 02:16 IST - PPB template native-price mismatch started
- Compared EB Horizontal Slots desktop reference against the WPB after-placement proof.
- Fixture mismatch: WPB still has direct preselected/default products enabled and Buy X, get Y state, while the EB template reference is an empty slot state.
- Code mismatch: WPB leaves the native product price visible above quantity controls, while EB hides the native price on PPB bundle product pages.
- Next edit: add a RED widget initialization contract for hiding native product price within the product form column, then patch the Product Page widget before recapturing a same-fixture template proof.

### 2026-05-27 02:20 IST - PPB native-price hiding proof captured
- Added RED-to-green widget init coverage requiring Product Page bundles to hide native product price elements in the product-form column after relocation and before PPB controls render.
- Patched the Product Page widget to find the native cart form, scope to the surrounding product information block, and mark/hide native price elements with `data-wpb-native-product-price-hidden`.
- Targeted verification passed: `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand`, modified-file ESLint with 0 errors, `npm run build:widgets`, and `git diff --check`.
- Live Chrome proof on the PPB storefront shows the native `$0.00` price spans hidden and the widget still mounted after the native product form; screenshot `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-desktop-native-price-hidden-2026-05-27.png`.
- Remaining PPB template visual gap: recapture on a same-fixture no-default-products/percentage-discount state before comparing slot/card/button pixels.

### 2026-05-27 02:27 IST - PPB horizontal-slot same-fixture mismatch started
- Captured same-fixture desktop proof after disabling default/preselected products: `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-desktop-same-fixture-2026-05-27.png` and runtime `/private/tmp/wpb-ppb-template-horizontal-slots-runtime-same-fixture-2026-05-27.json`.
- Verified the native price remains hidden and default products are no longer rendered, but the EB reference still differs: EB has a section title, white dashed empty slot labeled `Product 1`, gray disabled Add Bundle to Cart button, and black Buy it now button.
- WPB currently renders a narrow pill-like empty slot labeled with the step name and a wide orange disabled bundle button.
- Next edit: add a RED widget source contract for Product Page modal-slot empty-state/button parity, then patch the widget markup/CSS and rebuild bundled assets before recapturing desktop/mobile proof.

### 2026-05-27 02:33 IST - PPB horizontal-slot local patch verified
- Added RED-to-green widget source coverage for Product Page modal-slot template markers, section title/grid markup, `Product 1` empty-slot label, disabled gray bundle button styling, and black buy-now visual.
- Patched the Product Page widget to mark `PDP_MODAL` DOM with template datasets, wrap each step in a modal-slot section/grid, label empty slots by slot index, and append the buy-now visual below the bundle button.
- Rewrote the targeted Product Page CSS for modal-slot empty cards and the modal-slot button stack; bumped `WIDGET_VERSION` to `2.9.3` and regenerated bundled JS/CSS assets.
- Local verification passed: `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand`, modified-file ESLint with 0 errors, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, code competitor-reference scan, graph rebuild, and `git diff --check`.
- Remaining proof gap: run the SIT deploy so the extension CDN serves `2.9.3`, then recapture PPB Horizontal Slots desktop/mobile/runtime evidence before marking the row green.

### 2026-05-27 02:43 IST - PPB horizontal-slot fixture normalization proof captured
- Captured clean Admin save proof for the same PPB template fixture after setting the step title to `Build audit bundle`: `/private/tmp/wpb-ppb-template-fixture-step-title-save-2026-05-27.network-request` and `/private/tmp/wpb-ppb-template-fixture-step-title-save-2026-05-27.network-response`.
- Captured clean Admin save proof after normalizing Discount & Pricing from BXY to a percentage quantity rule (`>= 2`, `5%`) with discount messaging enabled: `/private/tmp/wpb-ppb-template-fixture-percentage-discount-save-2026-05-27.network-request` and `/private/tmp/wpb-ppb-template-fixture-percentage-discount-save-2026-05-27.network-response`.
- Parsed request proof confirms `stepsData[0].name = "Step 1 - PPB Audit"`, `stepsData[0].pageTitle = "Build audit bundle"`, `discountType = "percentage_off"`, and a quantity rule value of `2` with discount value `5`.
- Next: commit the verified local patch, deploy SIT with the user-authorized package script, then recapture same-fixture desktop/mobile/runtime proof from the extension CDN.

### 2026-05-27 02:46 IST - SIT deploy completed for modal-slot patch
- Committed the local PPB modal-slot patch as `1bc273cd` with the required `[eb-ui-clone-rewrite-1]` prefix.
- Ran the user-authorized SIT package deploy command as `npm run deploy:sit -- --allow-updates`; Shopify released `wolfpack-product-bundles-sit-284`.
- Next: reload the storefront until the extension CDN serves `window.__BUNDLE_WIDGET_VERSION__ = "2.9.3"`, then capture desktop/mobile/runtime proof for the same PPB Horizontal Slots fixture.

### 2026-05-27 02:48 IST - PPB runtime discount threshold mismatch started
- Captured post-SIT desktop/mobile proof with widget `2.9.3`: `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-desktop-after-modal-slot-patch-2026-05-27.png`, `/private/tmp/wpb-ppb-template-horizontal-slots-runtime-after-modal-slot-patch-2026-05-27.json`, `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-mobile-after-modal-slot-patch-2026-05-27.png`, and `/private/tmp/wpb-ppb-template-horizontal-slots-runtime-mobile-after-modal-slot-patch-2026-05-27.json`.
- Runtime visual markers now prove `PDP_MODAL + MODAL`, `window.__BUNDLE_WIDGET_VERSION__ = "2.9.3"`, native price hidden, modal-slot section/grid, `Product 1`, gray disabled Add Bundle to Cart, and black Buy it now visual.
- Mismatch: the storefront runtime still serializes the percentage quantity rule as `conditionValue: 0` even though the clean Admin save request submitted `conditionValue: 2`; this blocks the row from green.
- Next edit: add RED persistence/formatter coverage for the PPB percentage quantity threshold and patch the save/parser/runtime path without compatibility shims.

### 2026-05-27 02:56 IST - PPB runtime discount threshold fix verified
- Added RED-to-green route coverage proving Product Page percentage quantity rules sync to bundle-product metafields as flat runtime rules with `conditionType: "quantity"`, `conditionValue: 2`, and `discountValue: 5`.
- Patched the Product Page configure save handler runtime pricing serializer, then reran the focused route Jest suite, modified-file ESLint, full app build, graph rebuild, code competitor-reference scan, and `git diff --check`.
- Captured clean post-fix Admin save proof at `/private/tmp/wpb-ppb-template-fixture-after-threshold-fix-save-2026-05-27.network-request` and `/private/tmp/wpb-ppb-template-fixture-after-threshold-fix-save-2026-05-27.network-response`; the request and response both keep the percentage quantity threshold at `2`.
- Captured storefront proof with widget `2.9.3`: desktop runtime `/private/tmp/wpb-ppb-template-horizontal-slots-runtime-after-threshold-fix-desktop-2026-05-27.json`, desktop screenshot `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-desktop-after-threshold-fix-2026-05-27.png`, mobile runtime `/private/tmp/wpb-ppb-template-horizontal-slots-runtime-after-threshold-fix-mobile-2026-05-27.json`, and mobile screenshot `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-mobile-after-threshold-fix-2026-05-27.png`.
- Remaining confirmed gaps: the same save response still returns `bundle.steps[0].pageTitle = null` despite the request sending `pageTitle = "Build audit bundle"`, and the Horizontal Slots measured layout is still wider than the reference (`358-360px` section/grid versus the reference `345px` desktop grid target).
- Next: commit this threshold fix, then start the next TDD slice for the measured Horizontal Slots geometry and the separate Step Title persistence gap.

### 2026-05-27 03:01 IST - PPB horizontal-slot measured geometry slice started
- Committed the runtime threshold fix as `ab950c1c`.
- Re-read the EB desktop/mobile runtime JSON for Horizontal Slots. The target is desktop slot wrapper `345px`, grid columns `104.328px 104.328px 104.328px`, gap `16px`; mobile slot wrapper `360px`, grid columns about `110.66px`, gap `14px`.
- WPB post-threshold proof still measures desktop `360px` section/grid with `109.328px` columns and mobile `358px` section/grid due the current product form container width.
- Next edit: add a RED CSS contract for the desktop/mobile measured widths, bump the widget version for the bug-fix widget deploy path, patch Product Page widget CSS, rebuild widgets/minified assets, and recapture Chrome proof.

### 2026-05-27 03:03 IST - PPB horizontal-slot geometry local slice verified
- Added RED-to-green Product Page widget CSS contract coverage for desktop `345px` slot/action width, `104.328px` columns, mobile `360px` slot/action width, and `110.66px` columns.
- Patched the raw Product Page widget CSS and bumped `WIDGET_VERSION` to `2.9.4`, then regenerated widget JS and minified CSS assets.
- Verification passed: `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand`, modified-file ESLint with zero errors, `npm run build:widgets`, `npm run minify:assets css`, CSS size check (`99936` bytes FPB, `55167` bytes PPB), `npm run build`, graph rebuild, code competitor-reference scan, and `git diff --check`.
- Next: commit this local geometry slice, run the user-authorized SIT deploy, then recapture desktop/mobile/runtime proof from the extension CDN before updating the manifest row.

### 2026-05-27 03:07 IST - PPB horizontal-slot geometry SIT proof captured
- Committed the geometry patch as `38cf9801` and ran the user-authorized SIT deploy; Shopify released `wolfpack-product-bundles-sit-285`.
- Captured desktop proof from the deployed CDN widget `2.9.4`: runtime `/private/tmp/wpb-ppb-template-horizontal-slots-runtime-after-geometry-fix-desktop-2026-05-27.json` and screenshot `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-desktop-after-geometry-fix-2026-05-27.png`.
- Desktop now measures wrapper/action width `345px`, slot section `345px`, slot grid `345px`, grid gap `16px`, and browser-rounded columns `104.312px 104.312px 104.312px`.
- Captured mobile proof from the deployed CDN widget `2.9.4`: runtime `/private/tmp/wpb-ppb-template-horizontal-slots-runtime-after-geometry-fix-mobile-2026-05-27.json` and screenshot `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-mobile-after-geometry-fix-2026-05-27.png`.
- Mobile now measures wrapper/action width `360px`, slot section `360px`, slot grid `360px`, grid gap `14px`, and browser-rounded columns `110.656px 110.656px 110.656px`.
- Remaining confirmed gap: `firstStep.pageTitle` is still `null` in the runtime and save response despite the Admin request sending `pageTitle = "Build audit bundle"`.
- Next: add a RED route persistence test for PPB Step Title/pageTitle and patch the save handler/DB include path without compatibility shims.

### 2026-05-27 03:09 IST - PPB Step Title persistence slice started
- Traced the confirmed `pageTitle` gap: Prisma `Step.pageTitle` exists and the FPB save handler writes it, but the PPB save handler currently omits `pageTitle` from both the step create payload and the runtime step serializer.
- Next edit: add RED route tests proving PPB saves `stepsData[].pageTitle` to `Step.pageTitle` and preserves it in the bundle-product metafield runtime config, then patch the Product Page save handler.

### 2026-05-27 03:16 IST - PPB Step Title metafield serializer gap found
- Live Admin save request/response proof after the route patch is captured at `/private/tmp/wpb-ppb-template-fixture-after-page-title-fix-save-2026-05-27.network-request` and `/private/tmp/wpb-ppb-template-fixture-after-page-title-fix-save-2026-05-27.network-response`; the response now includes `bundle.steps[0].pageTitle = "Build audit bundle"`.
- Storefront reload still omits `pageTitle` from the product-page `bundle_ui_config.steps[]` dataset, so the widget continues using `step.name`.
- Next edit: add a RED service test for `updateBundleProductMetafields` proving `bundle_ui_config.steps[].pageTitle` pass-through, then patch the shared bundle-product metafield serializer.

### 2026-05-27 03:20 IST - PPB Step Title runtime rendering gap found
- After the shared metafield serializer patch and a second live save, storefront runtime proof at `/private/tmp/wpb-ppb-template-horizontal-slots-runtime-after-page-title-metafield-fix-desktop-2026-05-27.json` now includes `firstStep.pageTitle = "Build audit bundle"`.
- The rendered Product Page modal-slot header still shows `step.name` (`Step 1 - PPB Audit`) because `_createModalSlotStepSection()` reads only `step.name`.
- Next edit: add a RED widget source contract for Product Page modal-slot titles using `step.pageTitle || step.name`, then patch and rebuild widgets.

### 2026-05-27 03:21 IST - PPB Step Title widget render patch started
- RED widget source contract is in place at `tests/unit/assets/bundle-widget-product-page-init.test.ts` and currently fails because `_createModalSlotStepSection()` renders only `step.name`.
- Next edit: patch the Product Page widget to prefer `step.pageTitle`, bump the widget version for the deployable bundle, rebuild, deploy SIT, and recapture desktop/mobile storefront proof.

### 2026-05-27 03:25 IST - PPB Step Title render proof captured
- Patched the Product Page widget to render modal-slot titles from `step.pageTitle || step.name`, bumped `WIDGET_VERSION` to `2.9.5`, rebuilt widget assets, and ran the user-authorized SIT deploy; Shopify released `wolfpack-product-bundles-sit-286`.
- Verification passed: `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand`, `npx jest tests/unit/routes/ppb-save-bundle.test.ts --runInBand`, `npx jest tests/unit/services/bundle-product-metafield.test.ts --runInBand`, modified-file ESLint with zero errors, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, and `git diff --check`.
- Desktop storefront proof captured at `/private/tmp/wpb-ppb-template-horizontal-slots-runtime-after-page-title-render-fix-desktop-2026-05-27.json` and `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-desktop-after-page-title-render-fix-2026-05-27.png`; runtime shows widget `2.9.5`, `PDP_MODAL + MODAL`, `firstStep.pageTitle = "Build audit bundle"`, and rendered title `Build audit bundle`.
- Mobile storefront proof captured at `/private/tmp/wpb-ppb-template-horizontal-slots-runtime-after-page-title-render-fix-mobile-2026-05-27.json` and `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-mobile-after-page-title-render-fix-2026-05-27.png`; runtime shows the same persisted/rendered title under the `390x844` viewport.
- Next: update the evidence manifest/test spec, rebuild the graph, run the code competitor-reference scan, and commit this PPB Step Title slice.

### 2026-05-27 03:28 IST - PPB Step Title slice committed
- Committed the persistence/metafield/widget render slice as `72967769` with issue prefix `[eb-ui-clone-rewrite-1]`.
- Post-commit working tree contains only pre-existing untracked scratch artifacts plus this issue-log follow-up entry.
- Next: continue the evidence loop from the remaining `ppb-template-horizontal-slots` full visual comparison gap or the next blocked PPB template row.

### 2026-05-27 03:30 IST - PPB Horizontal Slots empty includes gap found
- Compared EB desktop reference `/private/tmp/eb-complete-configure-audit-2026-05-25/ppb-storefront-desktop-template-horizontal-slots-modal.png` with WPB `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-desktop-after-page-title-render-fix-2026-05-27.png`.
- Live DOM metrics at `/private/tmp/wpb-ppb-horizontal-slot-child-metrics-gap-before-button-2026-05-27.json` show the WPB slot grid bottom at `557.75px` and Add Bundle button top at `614.75px`, a `57px` gap.
- Root cause is an empty Liquid `.bundle-includes` child rendered as a visible `30px` flex box with `15px` bottom margin between `.bundle-steps` and `.add-bundle-to-cart`.
- Next edit: add a RED widget CSS source contract for hiding empty `.bundle-includes` only in `PDP_MODAL`, then patch the raw Product Page widget CSS and recapture desktop/mobile proof.

### 2026-05-27 03:33 IST - PPB Horizontal Slots empty includes proof captured
- Added RED-to-green source coverage for hiding empty `.bundle-includes` only under `#bundle-builder-app[data-ppb-template-type="PDP_MODAL"]`.
- Patched the raw Product Page widget CSS, bumped `WIDGET_VERSION` to `2.9.6`, rebuilt widget assets, minified CSS, and ran the user-authorized SIT deploy; Shopify released `wolfpack-product-bundles-sit-287`.
- Verification passed: `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand`, modified-file ESLint with zero errors, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, `git diff --check`, and code competitor-reference scan.
- Desktop proof at `/private/tmp/wpb-ppb-horizontal-slot-child-metrics-after-empty-includes-fix-desktop-2026-05-27.json` and `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-desktop-after-empty-includes-fix-2026-05-27.png` shows widget `2.9.6`, `.bundle-includes` display `none`, and grid-to-button gap `14px`.
- Mobile proof at `/private/tmp/wpb-ppb-horizontal-slot-child-metrics-after-empty-includes-fix-mobile-2026-05-27.json` and `/private/tmp/wpb-ppb-template-horizontal-slots-storefront-mobile-after-empty-includes-fix-2026-05-27.png` shows the same `14px` grid-to-button gap at `390x844`.
- Next: update the evidence manifest/test spec, rebuild graph output, and commit this spacing slice.

### 2026-05-27 03:36 IST - PPB Horizontal Slots empty includes slice committed
- Committed the modal-slot empty-includes spacing fix as `fb40abf8` with issue prefix `[eb-ui-clone-rewrite-1]`.
- Post-commit working tree contains only pre-existing untracked scratch artifacts plus this issue-log follow-up entry.
- Next: resume the Horizontal Slots full visual comparison and identify the next measured mismatch from EB/WPB desktop/mobile evidence.

### 2026-05-27 03:39 IST - PPB product description sync mismatch started
- Horizontal Slots visual comparison now isolates the visible product-page description mismatch: the widget area is aligned, but the generated Shopify product still shows stale merchant setup text instead of the deterministic unlisted troubleshooting description.
- Re-read Shopify's current Admin GraphQL documentation and local handler code; PPB product sync still uses the deprecated `productUpdate(input: ProductInput!)` shape while the current mutation argument is `product: ProductUpdateInput`.
- Impact scope: PPB/shared product status-description sync handlers and focused route tests only; storefront widget CSS and Cart Transform are not touched.
- Next edit: add RED coverage for current `productUpdate(product: ...)` variables and patch the status/description sync path so a save can refresh stale generated bundle-product descriptions.

### 2026-05-27 03:47 IST - PPB status selector serialization gap found
- Live Admin save proof for the unlisted product-description refresh returned HTTP 500 because the Product Page configure form submitted `bundleStatus=` as an empty string.
- Network response shows Prisma rejected the empty string before product sync ran, so the next patch must first make the shared status selector serialize a concrete status and make the PPB save handler reject invalid status values before Prisma.
- Impact scope expands to the shared configure status selector and PPB save boundary validation; storefront widget CSS and Cart Transform remain untouched.
- Next edit: add RED focused coverage for empty status validation, then patch the selector to use the current Polaris select value contract and the PPB save handler to fail cleanly on invalid status input.

### 2026-05-27 03:55 IST - PPB status selector/product sync proof captured
- Added focused tests for the shared Admin status selector contract, empty Product Page status validation, and current Shopify `productUpdate(product: ProductUpdateInput!)` payload shape.
- Patched the shared status selector to submit direct `BundleStatus` values through Polaris `s-select`/`s-option`, patched PPB save validation to reject invalid status before Prisma, and updated both PPB/private and shared product-sync mutations to the current Shopify Admin GraphQL argument shape.
- Live Admin save proof now returns HTTP 200 with `bundleStatus=unlisted`: `/private/tmp/wpb-ppb-product-status-unlisted-save-2026-05-27.network-request` and `/private/tmp/wpb-ppb-product-status-unlisted-save-2026-05-27.network-response`.
- DB proof `/private/tmp/wpb-ppb-product-status-unlisted-db-2026-05-27.json` confirms `status: "unlisted"` for `cmpfhk3ys0001v0t0w2r3xvls`.
- Desktop proof `/private/tmp/wpb-ppb-product-status-unlisted-storefront-desktop-2026-05-27.png` plus runtime `/private/tmp/wpb-ppb-product-status-unlisted-runtime-desktop-2026-05-27.json`, and mobile proof `/private/tmp/wpb-ppb-product-status-unlisted-storefront-mobile-2026-05-27.png` plus runtime `/private/tmp/wpb-ppb-product-status-unlisted-runtime-mobile-2026-05-27.json`, show the generated product now renders `Your Bundle is Unlisted`.
- Next: run required verification, update graph output, and commit this product status-description sync slice before resuming the Horizontal Slots full visual comparison.

### 2026-05-27 03:56 IST - PPB status selector/product sync verification passed
- Verification passed: `npx jest tests/unit/routes/ppb-save-bundle.test.ts tests/unit/routes/bundle-status-section.test.ts tests/unit/routes/bundle-update-status.test.ts --runInBand`, modified-file ESLint with zero errors, `npm run build`, code competitor-reference scan with no matches, `git diff --check`, and graph rebuild.
- Graph rebuild updated `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json`.
- Next: commit this slice with issue prefix, then continue the Horizontal Slots full visual comparison loop.

### 2026-05-27 03:57 IST - PPB status selector/product sync committed
- Committed the status selector/product-description sync slice as `45ab687d` with issue prefix `[eb-ui-clone-rewrite-1]`.
- Post-commit working tree contains only the required issue-log follow-up plus pre-existing untracked scratch artifacts.
- Next: resume the Horizontal Slots full visual comparison loop and log the next measured mismatch before editing.

### 2026-05-27 04:00 IST - PPB Horizontal Slots step-title fixture mismatch found
- Compared EB runtime/screenshot evidence for Horizontal Slots against the current WPB storefront after the product-description sync commit.
- EB reference renders the horizontal slot title as `Step 1 - PPB Audit`; current WPB live DOM renders `Build audit bundle`.
- Current WPB widget geometry remains aligned with the prior target: wrapper `345px x 337px`, slot section `345px x 231px`, title row `345px x 21px`, grid `345px x 200px`, and empty slot `104.3125px x 200px`.
- This is a fixture/configuration mismatch rather than a CSS geometry mismatch. Next: save the Product Page Step Title through Admin as `Step 1 - PPB Audit`, capture save/runtime/desktop/mobile proof, and keep the template row partial until full page-theme/product-media gaps are separately resolved.

### 2026-05-27 04:06 IST - PPB Horizontal Slots step-title fixture proof captured
- Saved Product Page Step Title through Admin as `Step 1 - PPB Audit`; Admin unsaved proof is `/private/tmp/wpb-ppb-horizontal-slots-step-title-admin-unsaved-2026-05-27.png`.
- Captured HTTP 200 save proof at `/private/tmp/wpb-ppb-horizontal-slots-step-title-save-2026-05-27.network-request` and `/private/tmp/wpb-ppb-horizontal-slots-step-title-save-2026-05-27.network-response`.
- Request/response both carry `firstStepPageTitle: "Step 1 - PPB Audit"` and response `success: true`; DB proof `/private/tmp/wpb-ppb-horizontal-slots-step-title-db-2026-05-27.json` confirms the same `BundleStep.pageTitle`.
- Desktop proof `/private/tmp/wpb-ppb-horizontal-slots-step-title-runtime-desktop-2026-05-27.json` and `/private/tmp/wpb-ppb-horizontal-slots-step-title-storefront-desktop-2026-05-27.png` shows title text `Step 1 - PPB Audit`, wrapper `345px`, grid `345px`, columns `104.312px 104.312px 104.312px`, and `16px` gap.
- Mobile proof `/private/tmp/wpb-ppb-horizontal-slots-step-title-runtime-mobile-2026-05-27.json` and `/private/tmp/wpb-ppb-horizontal-slots-step-title-storefront-mobile-2026-05-27.png` shows title text `Step 1 - PPB Audit`, wrapper `360px`, grid `360px`, columns `110.656px 110.656px 110.656px`, and `14px` gap.
- Next: update the evidence manifest and commit the evidence/docs slice, then continue with the remaining full-page product-media/theme fixture differences.

### 2026-05-27 04:07 IST - PPB Horizontal Slots step-title evidence committed
- Committed the Horizontal Slots exact title proof as `55b74894` with issue prefix `[eb-ui-clone-rewrite-1]`.
- Post-commit working tree contains only this required issue-log follow-up plus pre-existing untracked scratch artifacts.
- Next: continue the full visual comparison from the remaining product-media/theme fixture gaps.

### 2026-05-27 04:10 IST - PPB generated product media/title gap started
- Desktop/mobile visual comparison now isolates the generated Shopify product context: EB reference renders title `WPB Complete Audit Product Page 2026-05-25` and the generated placeholder media asset, while the current WPB SIT product renders `Codex PPB 2026-05-21` with the generic `public/bundle.png` media.
- The widget block itself remains aligned for the measured Horizontal Slots row; the remaining page chrome/header/vendor differences are store-theme context and cannot be claimed as widget parity.
- Impact scope for the next code slice: generated Product Page bundle product sync/media defaults and focused route/service tests. Storefront widget CSS and Cart Transform are not touched unless live proof shows a new widget-local mismatch.
- Next: inspect the product creation/sync path, add RED tests for generated PPB product title/media defaults, then patch the sync path without competitor references in code.

### 2026-05-27 04:27 IST - PPB generated product title/media proof captured
- Added RED-to-green coverage for generated Product Page product title sync, current `productCreate(product: ProductCreateInput!, media: [CreateMediaInput!])`, hard Sync Bundle recreate media, shared product update media, configure-loader media fetching, and Admin product-card media derivation.
- Patched Product Page save/status sync to include generated product title, Product Page create/recreate paths to attach app-owned generated placeholder media, shared bundle product update to use current `productUpdate(product: ProductUpdateInput!, media: [CreateMediaInput!])`, and configure loader/state to hydrate current Shopify `featuredMedia`.
- Added app-owned placeholder media assets at `public/bundle-product-placeholder.svg` and `public/bundle-product-placeholder.png`; no third-party image asset is embedded or hotlinked in code.
- SIT fixture proof: Admin API product update/reorder `/private/tmp/wpb-ppb-generated-product-title-media-admin-api-2026-05-27.json`, DB fixture name proof `/private/tmp/wpb-ppb-generated-product-title-media-db-2026-05-27.json`, Admin screenshot `/private/tmp/wpb-ppb-generated-product-title-media-admin-2026-05-27.png`, desktop runtime `/private/tmp/wpb-ppb-generated-product-title-media-runtime-desktop-2026-05-27.json` plus screenshot `/private/tmp/wpb-ppb-generated-product-title-media-storefront-desktop-2026-05-27.png`, and mobile runtime `/private/tmp/wpb-ppb-generated-product-title-media-runtime-mobile-2026-05-27.json` plus screenshot `/private/tmp/wpb-ppb-generated-product-title-media-storefront-mobile-2026-05-27.png`.
- Remaining row gap: WPB still uses the agent store theme/header and has a second historical media item in Shopify product media; first/featured media and product title now match the reference fixture.
- Next: run focused Jest, modified-file ESLint, build, competitor-reference scan, graph rebuild, and commit this generated product title/media slice.

### 2026-05-27 04:30 IST - PPB generated product title/media verification passed
- Verification passed: focused Jest suite for PPB save/sync/shared product update/configure loader/Admin state helpers, modified-file ESLint with zero errors, `npm run build`, `npm run build:widgets`, `npm run minify:assets css`, code competitor-reference scan with no matches, graph rebuild, and `git diff --check`.
- CSS minification reports the Full Page app-block CSS at `97.6 KB` and Product Page app-block CSS at `54.0 KB`, both under Shopify's `100,000 B` limit.
- Graph rebuild updated `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json`.
- Next: commit this scoped product title/media slice with the required issue prefix and continue the Product Page full visual comparison loop from the remaining store-theme/header/media-history gaps.

### 2026-05-27 04:32 IST - PPB generated product title/media committed
- Committed the generated product title/media slice as `ea51850e` with issue prefix `[eb-ui-clone-rewrite-1]`.
- Post-commit hook rebuilt graph output again; after whitespace trim, the only generated graph delta is the corpus word-count line in `graphify-out/GRAPH_REPORT.md`.
- Next: continue the Product Page visual comparison loop from the remaining generated-product media-history, vendor, and store-theme/header differences.

### 2026-05-27 04:37 IST - PPB generated product media-history gap isolated
- Captured fresh desktop DOM audits for the reference product page at `/private/tmp/eb-ppb-product-context-audit-desktop-2026-05-27.json` and WPB at `/private/tmp/wpb-ppb-product-context-audit-desktop-2026-05-27.json`.
- Reference product context has one visible parent product media image in the product gallery; WPB now has the correct first/featured generated media but still renders a second historical `bundle_...png` product media tile.
- Shopify Admin GraphQL 2026-04 docs confirm `productUpdate(product, media)` adds media, while `fileUpdate.referencesToRemove` is the current non-deprecated way to remove product references from existing media files.
- Next edit: add RED route/helper coverage that generated Product Page bundle product sync keeps one placeholder media reference and removes stale media references with `fileUpdate`, then patch only the generated product media sync path.

### 2026-05-27 04:44 IST - PPB generated product media cleanup proof captured
- Added RED-to-green helper and route coverage for generated Product Page product media cleanup: one placeholder media is retained, historical media and duplicate placeholders are removed with `fileUpdate.referencesToRemove`, and both Sync Product and Save paths invoke the cleanup.
- Patched the Product Page generated-product sync path to fetch current media, add the app-owned placeholder if absent, and remove stale product media references through Shopify's current `fileUpdate` API.
- Live SIT fixture cleanup proof: `/private/tmp/wpb-ppb-generated-product-media-cleanup-admin-api-2026-05-27.json` shows stale media `gid://shopify/MediaImage/42082654683395` removed with no user errors and one placeholder media node remaining.
- Desktop proof `/private/tmp/wpb-ppb-media-cleanup-runtime-desktop-2026-05-27.json` plus screenshot `/private/tmp/wpb-ppb-media-cleanup-storefront-desktop-2026-05-27.png` shows one visible product media tile; mobile proof `/private/tmp/wpb-ppb-media-cleanup-runtime-mobile-2026-05-27.json` plus screenshot `/private/tmp/wpb-ppb-media-cleanup-storefront-mobile-2026-05-27.png` shows the same.
- Next: run focused Jest, modified-file ESLint, app build, widget/minify checks, competitor-reference scan, graph rebuild, then commit this media cleanup slice.

### 2026-05-27 04:49 IST - PPB generated product media cleanup verification passed
- Verification passed: `npx jest tests/unit/lib/bundle-product-media.test.ts tests/unit/routes/ppb-sync-product.test.ts tests/unit/routes/ppb-save-bundle.test.ts --runInBand`, modified-file ESLint with zero errors, `npm run build`, `npm run build:widgets`, `npm run minify:assets css`, code competitor-reference scan with no matches, graph rebuild, and `git diff --check`.
- CSS minification reports the Full Page app-block CSS at `97.6 KB` and Product Page app-block CSS at `54.0 KB`, both under Shopify's `100,000 B` limit.
- Graph rebuild updated `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json`.
- Next: commit this scoped generated-product media cleanup slice, then continue the Product Page visual comparison from exact media artwork and store-theme/header/vendor gaps.

### 2026-05-27 04:51 IST - PPB generated product media cleanup committed
- Committed the generated product media cleanup slice as `3a0794da` with issue prefix `[eb-ui-clone-rewrite-1]`.
- Post-commit hook rebuilt graph output again; after whitespace trim, the only generated graph delta is the corpus word-count line in `graphify-out/GRAPH_REPORT.md`.
- Next: continue Product Page visual comparison from exact generated-media artwork, store-theme/header, and vendor gaps.

### 2026-05-27 04:54 IST - PPB generated product data gap isolated
- Captured public product JSON proof for the reference at `/private/tmp/eb-ppb-product-js-2026-05-27.json` and WPB at `/private/tmp/wpb-ppb-product-js-2026-05-27.json`.
- Reference product data is title `WPB Complete Audit Product Page 2026-05-25`, vendor `Yash-wolfpack`, handle `wpb-complete-audit-product-page-2026-05-25`, one AVIF parent product media image, and null media alt.
- WPB product data now has the matching title and one media item, but still has vendor `Wolfpack: Product Bundles`, handle `codex-ppb-2026-05-21`, app-owned PNG placeholder artwork, and media alt `WPB Complete Audit Product Page 2026-05-25 - Bundle`.
- Next slice: decide from evidence whether generated Product Page sync should normalize vendor/handle/media alt and whether exact parent-media artwork is app-owned product data or evidence-limited theme/store fixture context.

### 2026-05-27 04:55 IST - PPB generated product metadata slice started
- Re-read the current Shopify Admin GraphQL docs for `ProductCreateInput`, `ProductUpdateInput`, and `shop { name }`, plus the EB create/update proof and WPB public product JSON mismatch.
- Scope decision: normalize generated Product Page bundle products to use the saved bundle-name handle, shop name vendor, `productType: "product"`, and empty generated-media alt text. Exact parent media artwork remains evidence-limited/app-owned asset work, so this slice will not hotlink or copy competitor media.
- Next edit: add RED tests for generated product metadata helpers plus PPB create/recreate/save sync contracts, then patch the handler and capture fresh product JSON proof.

### 2026-05-27 05:05 IST - PPB generated product metadata proof captured
- Added RED-to-green coverage for generated product handle/metadata helpers, empty generated-media alt text, Product Page create/recreate metadata payloads, save-sync DB handle persistence, and generated file alt cleanup.
- Patched Product Page generated product create/recreate/save/sync paths to query `shop { name }`, send current `ProductCreateInput`/`ProductUpdateInput` metadata with saved-name handle and `productType: "product"`, persist the Shopify-returned handle, and update placeholder file alt text through `fileUpdate`.
- Live proof captured: Admin screenshot `/private/tmp/wpb-ppb-generated-product-data-admin-2026-05-27.png`, Admin API/DB proof `/private/tmp/wpb-ppb-generated-product-data-sync-admin-api-2026-05-27.json`, public product JSON `/private/tmp/wpb-ppb-product-js-after-data-sync-2026-05-27.json`, desktop runtime/screenshot `/private/tmp/wpb-ppb-generated-product-data-runtime-desktop-2026-05-27.json` and `/private/tmp/wpb-ppb-generated-product-data-storefront-desktop-2026-05-27.png`, and mobile runtime/screenshot `/private/tmp/wpb-ppb-generated-product-data-runtime-mobile-2026-05-27.json` and `/private/tmp/wpb-ppb-generated-product-data-storefront-mobile-2026-05-27.png`.
- Product JSON now has title `WPB Complete Audit Product Page 2026-05-25`, handle `wpb-complete-audit-product-page-2026-05-25`, vendor `agent`, type `product`, one placeholder media image, and null media alt. The exact parent media artwork remains open because this slice keeps app-owned media.
- Next: run full modified-file verification, graph rebuild, and commit this scoped generated-product metadata slice.

### 2026-05-27 05:08 IST - PPB generated product metadata verification passed
- Focused Jest passed: `npx jest tests/unit/lib/bundle-product-data.test.ts tests/unit/lib/bundle-product-media.test.ts tests/unit/routes/ppb-sync-product.test.ts tests/unit/routes/ppb-save-bundle.test.ts --runInBand`.
- Modified-file ESLint passed with 0 errors and warnings only; `npm run build`, `npm run build:widgets`, and `npm run minify:assets css` passed.
- Competitor-reference scan over code/test/deploy paths returned no matches; graph rebuild passed with the known graphify extraction warning and `git diff --check` passed after trimming generated report whitespace.
- Next: commit the generated-product metadata slice with the issue prefix, then continue from exact media artwork and full Product Page visual comparison.

### 2026-05-27 05:09 IST - PPB generated product metadata committed
- Committed the generated product metadata slice as `043752c6` with issue prefix `[eb-ui-clone-rewrite-1]`.
- The commit hook regenerated `graphify-out/GRAPH_REPORT.md`; the only remaining generated delta is the corpus word-count update after trimming hook-added trailing spaces.
- Next: commit the post-commit issue/graph log, then continue the Product Page exact-media/full-visual proof loop.

### 2026-05-27 05:14 IST - PPB Sync Product runtime rewrite gap started
- The generated product metadata proof still had stale storefront runtime config because the manual Sync Product path only rewrites bundle-product metafields when `bundle.pricing.enabled` is true.
- Scope: make Product Page Sync Product rewrite component and bundle-product metafields for every linked product sync, with pricing data included when present and `pricing: null` when absent.
- Next edit: add RED coverage for no-pricing Sync Product metafield writes, then patch only the sync handler gate.

### 2026-05-27 05:17 IST - PPB Sync Product runtime rewrite verification passed
- Added RED-to-green coverage in `tests/unit/routes/ppb-sync-product.test.ts` proving Sync Product rewrites both component and bundle-product metafields when pricing is not enabled.
- Patched Product Page Sync Product and hard Sync Bundle to run DB-authoritative metafield rewrites regardless of pricing state; pricing remains `null` when no pricing row exists.
- Verification passed: focused Jest, modified-file ESLint with 0 errors, code competitor-reference scan with no matches, `npm run build`, `npm run build:widgets`, `npm run minify:assets css`, graph rebuild with the known graphify extraction warning, and `git diff --check`.
- Next: commit this scoped runtime-sync slice, then capture deployed/local Admin Sync Product runtime JSON proof before marking the generated-product runtime row green.

### 2026-05-27 05:18 IST - PPB Sync Product runtime rewrite committed
- Committed the no-pricing runtime metafield rewrite slice as `39cfdcea` with issue prefix `[eb-ui-clone-rewrite-1]`.
- Post-commit graph hook output was normalized by trimming generated trailing spaces; no tracked code files are dirty after the commit.
- Next: continue the generated product visual parity loop from the exact placeholder artwork/full Product Page visual comparison gap.

### 2026-05-27 05:19 IST - PPB generated placeholder artwork slice started
- Compared the reference parent-product placeholder artwork against WPB's app-owned `public/bundle-product-placeholder.svg` and `.png`; the copy and purpose match, but WPB's illustration is oversized and visibly different in the product media gallery.
- Scope: replace only the app-owned placeholder artwork under the existing stable filenames so the existing generated-product media pipeline and Shopify media URL contract do not change.
- Next edit: reshape the SVG to the reference proportions, regenerate the PNG from it, then capture a local image proof before committing.

### 2026-05-27 05:22 IST - PPB generated placeholder artwork proof captured
- Replaced `public/bundle-product-placeholder.svg` with a 1000x1000 app-owned asset using the stable placeholder copy and tighter reference-like illustration proportions.
- Regenerated `public/bundle-product-placeholder.png` from the SVG via browser canvas export; the PNG is now 1000x1000 instead of 1160x1160.
- Local rendered proof is stored at `/private/tmp/wpb-bundle-product-placeholder-rendered-2026-05-27.png`; direct SVG browser screenshot proof is `/private/tmp/wpb-bundle-product-placeholder-svg-proof-2026-05-27.png`.
- Next: run build/code scans/graph checks, update the manifest, then commit this app-owned artwork slice.

### 2026-05-27 05:23 IST - PPB generated placeholder artwork verification passed
- Verification passed: asset type check confirms 1000x1000 PNG plus SVG source, code competitor-reference scan returned no matches, `npm run build`, `npm run build:widgets`, `npm run minify:assets css`, graph rebuild, and `git diff --check`.
- The app-owned media URL path is unchanged (`/bundle-product-placeholder.png`), so generated product create/sync code does not need a data contract change.
- Next: commit the placeholder artwork slice, then run a real Product Page Sync Product after deployment/local server refresh to upload the new media and capture public product JSON plus desktop/mobile proof.

### 2026-05-27 05:24 IST - PPB generated placeholder artwork committed
- Committed the app-owned generated placeholder artwork slice as `7e0abc16` with issue prefix `[eb-ui-clone-rewrite-1]`.
- Post-commit graph hook output was normalized by trimming generated trailing spaces; no tracked asset/code files are dirty after the commit.
- Next: continue Product Page visual parity with a real generated-product media upload/runtime proof pass after the current app server or SIT deploy path is refreshed.

### 2026-05-26 02:31 IST - Implementation issue initialized
- Created the implementation issue before any file modifications for this rewrite.
- Scope source is the prior EB-Evidence UI Clone Rewrite Plan plus the evidence in `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md`, `internal docs/EB Implementation Reference.md`, and `/private/tmp/eb-complete-configure-audit-2026-05-25/`.
- Next: complete the repo-local feature-pipeline documents under `docs/eb-ui-clone-rewrite/`, add the narrow AGENTS custom-control exception for this rewrite, then begin TDD implementation only for evidence-backed contracts.

### 2026-05-26 02:31 IST - Feature pipeline docs and manifest created
- Added the scoped `AGENTS.md` exception allowing custom non-Polaris Admin controls only for `eb-ui-clone-rewrite-1`, with manifest evidence required for every use.
- Created feature-pipeline docs under `docs/eb-ui-clone-rewrite/`: BR, PO requirements, architecture/ADR, SDE implementation plan, and evidence manifest.
- Created `test-spec/eb-ui-clone-rewrite.spec.md` for the required TDD session.
- Next: inspect the existing configure routes, helper modules, and Jest patterns, then add RED tests for template mappings, dependency gates, category contracts, cart messaging, and widget load invariants.

### 2026-05-26 02:31 IST - First TDD contract slice green
- Added RED unit coverage in `tests/unit/lib/bundle-config-contracts.test.ts` for template mappings, dependency gates, category payload contracts, cart-line display properties, and the FPB storefront config-load order descriptor.
- Implemented pure helper modules under `app/lib/bundle-config/` with neutral filenames and no competitor references in code.
- Targeted verification passed: `npx jest tests/unit/lib/bundle-config-contracts.test.ts --runInBand` (22 tests).
- Next: wire template mapping into existing select-template parsers/save handlers, add route-level RED tests for the FPB `DEFAULT` mapping and PPB `templateId` bridge, then continue into save/metafield integration.

### 2026-05-26 02:31 IST - FPB Standard template token corrected
- Added a route-level RED assertion in `tests/unit/routes/select-template.test.ts` proving the FPB Select Template card must submit `DEFAULT` for Standard.
- Updated the FPB configure route to submit `bundleDesignPresetId: "DEFAULT"` for Standard and updated the Prisma schema comment to list `DEFAULT` instead of `STANDARD`.
- Marked the FPB Standard manifest row `partial` because code is corrected but WPB Admin/save/runtime/desktop/mobile proof has not been captured yet.
- Targeted verification passed: `npx jest tests/unit/routes/select-template.test.ts --runInBand` (13 tests).
- Next: integrate PPB `templateId` runtime bridging and direct save contracts without adding legacy fallbacks.

### 2026-05-26 02:31 IST - Template runtime formatter bridge added
- Added RED formatter tests proving widget config must include saved design fields and PPB runtime `bundleDesignTemplateData.templateId`.
- Updated `app/lib/bundle-formatter.server.ts` to emit `bundleDesignTemplate`, `bundleDesignPresetId`, and PPB `bundleDesignTemplateData.templateId` from the direct saved preset field.
- Marked the four PPB template rows `partial`; formatter code is in place but WPB Admin/save/runtime/desktop/mobile proof remains required.
- Targeted verification passed: `npx jest tests/unit/lib/bundle-formatter.test.ts --runInBand` (12 tests).
- Next: run the combined focused suite, lint modified source/test files, then decide the next implementation slice.

### 2026-05-26 02:42 IST - Focused verification completed
- Combined focused Jest suite passed: `npx jest tests/unit/lib/bundle-config-contracts.test.ts tests/unit/routes/select-template.test.ts tests/unit/lib/bundle-formatter.test.ts --runInBand` (47 tests).
- Modified-file ESLint passed with 0 errors and existing warnings: `npx eslint --max-warnings 9999 ...`.
- Production build passed: `npm run build`.
- Graph rebuild completed using the pipx graphify environment after the documented `python3` command could not import `graphify`: `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`.
- Competitor-reference scan over modified code files passed after neutralizing pre-existing comments in touched files.
- Next: continue with save/metafield contract tests and live Chrome proof before any manifest row is marked green.

### 2026-05-26 02:50 IST - Resuming persistence/runtime contract slice
- User directed continuation toward full clone completion with no assumptions and advisor-agent escalation if blocked.
- Next slice is save/metafield/runtime contract work for evidence-backed fields, starting by reading current schema, handlers, and formatter boundaries for direct persisted settings.
- No manifest row will be marked green without WPB Admin/save/runtime/desktop/mobile/cart proof.

### 2026-05-26 02:54 IST - PPB Bundle Settings contract implementation started
- Re-read the internal implementation reference and complete configure audit for Product Page Bundle Bundle Settings, including saved `defaultProductsData`, `validateQuantityPerProduct`, `individualSellingPlanSelection`, `bundleTextConfig`, and global cart-line messaging evidence.
- Current route/parser/schema review shows only older flattened fields are saved for this area, so the next edit will start with RED tests for direct PPB Bundle Settings contract parsing and runtime formatter output.
- Next: add the failing tests, implement direct JSON contract columns and parser/formatter wiring, then run focused Jest before any UI parity claim.

### 2026-05-26 03:01 IST - PPB Bundle Settings direct contracts wired
- Added RED tests for direct PPB Bundle Settings contracts in `tests/unit/routes/ppb-bundle-settings.test.ts` and runtime formatter output in `tests/unit/lib/bundle-formatter.test.ts`; the RED run failed only on missing direct fields.
- Added Bundle direct contract columns and migration for `defaultProductsData`, `boxSelection`, `bundleUpsellConfig`, `bundleTextConfig`, `discountDisplayOverride`, `individualSellingPlanSelection`, `validateQuantityPerProduct`, and `useSingleStepCategoriesAsBundleSteps`.
- Wired PPB save serialization, server parsing, and widget formatter output for the evidence-backed direct fields currently exposed by Bundle Settings.
- Updated the evidence manifest rows for PPB default products, quantity validation, selling-plan selection, and bundle summary text to `partial`; all WPB Admin/save/runtime/desktop/mobile/cart proof gates remain open.
- Verification passed: focused Jest suite (66 tests), modified-file ESLint with 0 errors, `npx prisma generate`, `npm run build`, graph rebuild, and code competitor-reference scan.
- Next: continue with global PPB cart-line messaging under Edit Defaults, starting with direct DesignSettings contract tests and save/runtime/cart serialization.

### 2026-05-26 03:03 IST - Global PPB cart-line messaging slice started
- Re-read the complete configure audit for Edit Defaults cart-message controls: Bundle Items, Original Bundle Price, Discount Display, and Discount format.
- Current code review shows DesignSettings saves visual CSS controls only; `bundleCartLineMessaging` is not a direct column or typed DCP setting yet, and the Rust merge path emits private bundle attributes but does not yet apply these public-property toggles.
- Next: add RED tests for direct DesignSettings persistence and merge output for `bundleCartLineMessaging`, then wire the DB/schema/settings merge layer before cart-transform runtime work.

### 2026-05-26 03:08 IST - Global cart-line messaging settings contract wired
- Added RED tests in `tests/unit/routes/design-settings-cart-messaging.test.ts` for product-page defaults, direct `DesignSettings.bundleCartLineMessaging` persistence, and DCP loader merge output.
- Added `bundleCartLineMessaging` to the DesignSettings schema and migration, product-page defaults, save handler data, and settings merge types.
- Updated manifest rows for Bundle Items, Retail Price, and You Save/Discount Display to `partial`; cart-transform runtime attributes and live cart proof remain open.
- Verification passed: focused Jest suite (69 tests), modified-file ESLint with 0 errors, `npx prisma generate`, `npm run build`, graph rebuild, and code competitor-reference scan.
- Next: wire cart-transform/runtime output so the saved global settings control public `Items`, `Retail Price`, and `You Save` cart properties.

### 2026-05-26 03:13 IST - Cart-transform runtime messaging slice started
- Called an advisor agent for the function-owner metafield path and cart money-formatting constraints before editing the Rust function.
- Checked current Shopify Function docs: function-owner metafields are the supported runtime configuration path, and Cart Transform input exposes `cartTransform.metafield(...)`; `cartTransformCreate` also accepts metafields at creation.
- Next: add RED Rust integration tests for public cart-line attributes, then wire CartTransform owner metafield persistence and Rust merge output.

### 2026-05-26 03:18 IST - Advisor guidance applied to cart money formatting
- Advisor confirmed CartTransform-owned `$app.bundle_cart_line_messaging` is the right runtime settings path, and warned against hardcoding storefront currency symbols inside the Rust function.
- Adjusted implementation direction: storefront cart-add will write preformatted private source properties, and the Rust merge operation will copy those values onto the merged parent according to global settings.
- Next: update RED tests to assert copied preformatted values, then wire source cart properties in widget cart-add paths and the transform input query.

### 2026-05-26 03:18 IST - Cart-transform runtime messaging code path wired
- Added Rust integration coverage for default public `Box`, `Items`, `Retail Price`, `You Save`, and private `_Items` merge attributes, plus the global off-state where public fields are omitted.
- Wired DCP product-page save to sync `bundleCartLineMessaging` onto the active Rust CartTransform owner metafield, matching by Rust function ID before writing `$app.bundle_cart_line_messaging`.
- Added storefront cart-add private source data in the PPB widget, FPB widget, and SDK cart builder; later compacted into `_bundle_display_properties` so the Rust function can copy preformatted strings without exceeding Shopify Function input complexity.
- Verification passed: focused Jest suite (46 tests), full Rust `cargo test`, modified-file ESLint with 0 errors, `npm run build`, `npm run build:widgets`, `npm run build:sdk`, `npm run minify:assets css`, graph rebuild, and code competitor-reference scan. The plain `cargo build --target=wasm32-unknown-unknown --release` failed via the rustup proxy, but the same build passed with explicit `RUSTC=/Users/adityaawasthi/.rustup/toolchains/stable-aarch64-apple-darwin/bin/rustc`.
- Next: capture WPB Admin/save/runtime/cart proof for the global cart-line messaging rows, then continue the remaining PPB/FPB Admin and storefront parity slices.

### 2026-05-26 03:33 IST - Global cart-message DCP UI slice started
- Chrome proof cannot pass yet because the Product Page global Edit Defaults UI does not expose the evidence-backed Cart Messaging controls, even though persistence and runtime paths are now wired.
- Next edit will start with a RED DCP config test proving Product Page Layout includes a Cart Messaging subsection and Full Page Layout does not, then add the settings panel for Bundle Items, Original Bundle Price, Discount Display, and the gated Discount format dropdown.
- The new subsection will be logged in the app navigation map because it changes DCP navigation.

### 2026-05-26 03:41 IST - Product Page DCP cart-message controls added
- Added RED coverage in `tests/unit/lib/dcp-config.test.ts` for the Product Page-only Cart Messaging subsection and then wired `cartLineMessaging` into the DCP config, settings reset keys, and settings panel switch.
- Added a Cart Messaging settings panel matching the captured control set: Cart Messaging enable switch, Bundle Items, Original Bundle Price, Discount Display, and the Discount format dropdown only when Discount Display is on.
- Updated `docs/app-nav-map/APP_NAVIGATION_MAP.md` and `test-spec/eb-ui-clone-rewrite.spec.md` for the new DCP subsection.
- Verification passed: focused Jest for DCP config and cart-message persistence, modified-file ESLint with 0 errors, `npm run build`, graph rebuild, `git diff --check`, and code competitor-reference scan.
- Next: open the local Shopify Admin DCP modal in Chrome, capture WPB Admin UI evidence, save payload/network evidence, DB/metafield proof, and then run storefront/cart proof for the global cart-message rows.

### 2026-05-26 03:42 IST - Chrome DCP modal trigger blocker found
- Chrome proof showed the Product Bundles `s-button` received focus but did not open the App Bridge modal through click, Enter, or Space activation, blocking Admin screenshot and save proof.
- Next edit: keep the scope to the DCP landing modal triggers and replace the two customize `s-button` elements with native buttons styled as the same primary action so the existing modal/open handlers can run.

### 2026-05-26 03:48 IST - App Bridge modal path still blocked
- Rechecked Chrome after native trigger buttons: focus moved to the Product Bundles button, but the App Bridge modal still did not render, so the blocker is the modal surface rather than the button event surface.
- Next edit: replace the DCP modal presentation with a local max overlay and inline save/discard bar while reusing the same DCP state, sidebar, settings, preview, and save handlers.

### 2026-05-26 03:55 IST - Embedded frame click activation still blocked
- The local overlay built cleanly, but Chrome MCP still focused the Product Bundles button without dispatching the click/keyboard activation inside the embedded app iframe.
- Next edit: add a direct DCP deep-link parameter for modal and section state so Chrome can load Product Page Cart Messaging directly for Admin screenshot proof despite iframe activation limitations.

### 2026-05-26 04:00 IST - WPB Admin cart-message screenshot mismatch logged
- Deep-link proof reached the Cart Messaging controls and captured `/private/tmp/wpb-dcp-product-page-cart-messaging-admin-2026-05-26.png`.
- Mismatch: controls render in WPB's narrow right settings rail with a large empty preview area, while the EB evidence shows Cart Messaging as a primary content card in the Additional Configurations area.
- Next edit: for the Cart Messaging subsection only, hide the preview pane and render the settings panel as the main content card so the Admin surface moves closer to the captured EB layout.

### 2026-05-26 04:05 IST - Additional Configurations parity loop started
- Re-read the captured Product Page Layout Edit Defaults evidence and compared it with `/private/tmp/wpb-dcp-product-page-cart-messaging-admin-main-card-2026-05-26.png`.
- Remaining Admin mismatch is structural: the evidence shows an Additional Configurations route with a left App Configurations card, Product Page Layout dropdown, Configuration/CSS & Scripts nav, a Bundle Settings card, and then the Cart Messaging card.
- Next edit: render the Product Page Cart Messaging deep link as that Additional Configurations layout instead of the generic DCP customization sidebar.

### 2026-05-26 04:20 IST - Additional Configurations Admin visual pass captured
- Advisor recommendation: copy the proven Admin shape but keep the seven other Product Page Layout Bundle Settings rows as read-only visual inventory until each has fresh storefront behavior proof.
- Added `tests/unit/lib/dcp-config.test.ts` coverage and `app/lib/bundle-config/product-page-layout-settings.ts` for the observed row order/default state, then rendered the Product Page Cart Messaging deep link as the Additional Configurations two-column layout.
- Captured WPB Admin proof at `/private/tmp/wpb-dcp-product-page-additional-config-cart-messaging-left-aligned-2026-05-26.png`; accessibility snapshot shows App Configurations, Bundle Settings, the seven read-only rows, Cart Messaging, Bundle Items, Original Bundle Price, Discount Display, and Discount format.
- Chrome iframe activation still blocks live toggle/save proof: click, Space, and Enter focus `Bundle Items` but do not change `aria-checked`, so manifest rows remain `partial`.

### 2026-05-26 04:28 IST - Cart Messaging native-switch retry started
- The remaining proof blocker may be caused by the live Cart Messaging toggles being custom button switches inside the embedded iframe.
- Next edit: convert only the live Cart Messaging toggles to native checkbox inputs styled as switches, preserving the same visible layout, then retry Chrome toggle/save proof.

### 2026-05-26 04:38 IST - Native-switch retry remains save-proof blocked
- Converted live Cart Messaging toggles to native checkbox inputs styled as switches and added redundant click/input/focus/key handlers for embedded-frame accessibility activation.
- Chrome can now visibly toggle `Bundle Items` between checked and unchecked, but the embedded accessibility action still does not reach the React dirty/save state reliably; no WPB save payload proof was captured.
- Keeping cart-message manifest rows `partial`: Admin visual proof is captured and unit persistence/runtime/cart-transform tests pass, but live save/cart proof is still required.

### 2026-05-26 04:39 IST - PPB Bundle Settings Admin parity slice started
- Re-checked the PPB Bundle Settings and Subscriptions evidence screenshots plus the saved audit notes before editing.
- Evidence-backed mismatches selected for the next narrow loop: the PPB setup rail must include `Subscriptions`, the Subscriptions section must expose the common-selling-plan validation surface, and Bundle Settings `Edit Defaults` must route to Product Page Layout Additional Configurations.
- Next: add RED tests for the PPB setup section order and Edit Defaults deep-link contract, then wire the route and app navigation map without marking any manifest row green until live proof is captured.

### 2026-05-26 04:40 IST - PPB Subscriptions and Edit Defaults proof captured
- Added TDD coverage for the Product Page setup rail order, Edit Defaults deep link, subscription validation messages, source extraction, and common selling-plan group intersection.
- Wired the Product Page setup rail to include `Subscriptions`, added the Bundle Settings Pre-order & Subscription Integration row, added the Subscriptions validation shell, and implemented direct-product common-selling-plan validation while failing closed for collection-backed sources.
- Captured WPB Admin proof for the Subscriptions shell, no-common-plan validation response, Bundle Settings row, and Edit Defaults deep link: `/private/tmp/wpb-ppb-subscriptions-admin-shell-2026-05-26.png`, `/private/tmp/wpb-ppb-subscriptions-no-common-plan-2026-05-26.png`, `/private/tmp/wpb-ppb-bundle-settings-subscriptions-row-2026-05-26.png`, and `/private/tmp/wpb-ppb-edit-defaults-deeplink-2026-05-26.png`.
- Remaining gaps stay explicit in the manifest: populated successful subscription plan selection, collection-backed subscription validation, persisted subscription settings, storefront selling-plan behavior, and cart selling-plan proof are still evidence-gated.

### 2026-05-26 23:23 IST - Cart Transform merge blocker query fix started
- Clean mobile storefront proof now shows selected paid Add-ons included in the pre-cart total: `/private/tmp/wpb-fpb-standard-addon-combined-before-cart-2026-05-26.png` and JSON proof at `/private/tmp/wpb-fpb-standard-addon-combined-before-cart-2026-05-26.json`.
- Cart proof shows the combined display properties are now correct (`You Save: $65.00 (9%)`), but the live cart still displays three component lines and total `$728.00`, so Cart Transform merge/price application is still blocked: `/private/tmp/wpb-fpb-standard-addon-combined-cart-2026-05-26.png` and JSON proof at `/private/tmp/wpb-fpb-standard-addon-combined-cart-2026-05-26.json`.
- Active transform check returned `alreadyExists: true`, pointing the next fix at the Cart Transform input data rather than activation.
- Next: add a RED contract test for app-owned metafield namespace usage in the Cart Transform input query, patch `run.graphql`, rebuild/test the Rust function, and keep live cart proof blocked until the updated function is manually deployed.

### 2026-05-26 23:27 IST - Cart Transform namespace fix ready for SIT deploy
- Added RED-to-green contract coverage in `tests/unit/extensions/cart-transform-run-query.test.ts` requiring every app-owned component/pricing metafield in `extensions/bundle-cart-transform-rs/src/run.graphql` to specify `namespace: "$app"`.
- Patched the Cart Transform input query so component metadata, parent references, quantities, price adjustment, component pricing, and owner settings all read from the `$app` namespace used by the metafield definitions/writers.
- Verified the focused query test and Rust transform suite locally; the plain rustup proxy WASM build failed in this shell, but the explicit stable `RUSTC=/Users/adityaawasthi/.rustup/toolchains/stable-aarch64-apple-darwin/bin/rustc cargo build --target=wasm32-unknown-unknown --release` path passed.
- User authorized running `npm run deploy:sit` for this Cart Transform function update. Next: run the focused checks, deploy SIT, then retake live cart proof for single-line merge and configured discount application.

### 2026-05-26 23:31 IST - Cart Transform SIT deploy completed
- Verification before deploy passed: focused Jest for Add-ons/cart-source/query contracts, full Rust `cargo test`, explicit stable WASM build, and modified-file ESLint with 0 errors.
- First `npm run deploy:sit` built the Rust WASM but stopped because Shopify CLI requires `--allow-updates` in non-interactive mode.
- Retried with `npm run deploy:sit -- --allow-updates`; Shopify released `wolfpack-product-bundles-sit-281` to users.
- Next: clear the storefront cart and retake the exact Add-ons cart proof against the deployed Cart Transform.

### 2026-05-26 23:37 IST - Add-ons component metadata gap found
- Post-deploy mobile proof still failed the cart gate: `/private/tmp/wpb-fpb-standard-addon-combined-cart-after-sit-deploy-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-addon-combined-cart-after-sit-deploy-2026-05-26.png` show three component lines and total `$728.00`.
- Verified the self-heal endpoint was only skipped because its pre-deploy one-hour cooldown was active, then invoked `CartTransformService.activateForNewInstallation` directly; it confirmed CartTransform `gid://shopify/CartTransform/100663555` already points to the Rust function.
- Direct Admin GraphQL proof shows the selected add-on variant `gid://shopify/ProductVariant/48191593578755` has no `$app.component_parents`, while the two paid step variants do.
- Root cause for the next patch: metafield sync must include direct Add-ons product variants from `personalizationData.addonProducts.tiers[].selectedAddonProducts` in parent `component_reference` and write `component_parents` to those variants, without storing the add-on tier discount in static parent `price_adjustment`.

### 2026-05-26 23:45 IST - Parent component cached-variant gap started
- Added RED service coverage for a Full Page `StepCategory.products[].variants` cache that must be written into the parent bundle variant's `$app.component_reference`.
- Current live proof after Add-ons metadata sync shows the add-on variant has `$app.component_parents`, but the parent bundle variant still lists the first variant for the paid product instead of the selected cached variant `gid://shopify/ProductVariant/48191691456771`.
- Next edit: patch the parent bundle metafield writer to append cached variants from step product sources while preserving the existing Shopify first-variant lookup for products without cached variant data.

### 2026-05-27 00:04 IST - Add-ons Cart Transform cart gate passed
- Patched the parent bundle metafield writer so `$app.component_reference`, `$app.component_quantities`, and `$app.component_pricing` include cached variants from `StepProduct`, `steps[].products`, and `StepCategory.products`, while preserving Shopify first-variant lookup for products without cached variants.
- Re-synced live proof bundle `cmpfhj2m10000v0t038osl42y` and captured parent metadata proof at `/private/tmp/wpb-fpb-standard-addon-parent-component-reference-proof-2026-05-26.json`: parent references and quantities both count `117`, include selected paid variant `gid://shopify/ProductVariant/48191691456771`, include add-on variant `gid://shopify/ProductVariant/48191593578755`, and both component variants point back to parent variant `gid://shopify/ProductVariant/48193756201219`.
- Direct activation through `productUpdate(product: { id, status: ACTIVE })`, `productSet`, and temporary ChatGPT auto-publish disablement all still failed with Shopify's unsupported bundle-publication validation; product-scoped proof `/private/tmp/wpb-fpb-parent-requirescomponents-activation-sequence-2026-05-26.json` shows the working sequence is `requiresComponents=false`, set product `ACTIVE`, then `requiresComponents=true`.
- Added route coverage for the FPB activation sequence when Shopify rejects direct activation with `does not support bundle products`.
- Captured mobile storefront pre-cart proof after activation at `/private/tmp/wpb-fpb-standard-addon-combined-before-cart-after-active-parent-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-addon-combined-before-cart-after-active-parent-2026-05-26.png`.
- Captured live cart proof at `/private/tmp/wpb-fpb-standard-addon-combined-cart-after-active-parent-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-addon-combined-cart-after-active-parent-2026-05-26.png`: Shopify now renders one parent bundle line, total `$663.00`, parent variant `48193756201219`, and public `Items`, `Retail Price: $728.00`, `You Save: $65.00 (9%)`.
- Next: run the focused route/service/query/widget/Rust verification stack, update the evidence manifest/internal docs, then continue remaining Admin visual parity gaps.

### 2026-05-27 00:08 IST - Add-ons Cart Transform verification stack completed
- Production app build passed with `npm run build`.
- Widget bundle rebuild passed with `npm run build:widgets`; CSS minification passed with `npm run minify:assets css`.
- CSS size check passed: `bundle-widget-full-page.css` is `99,936` bytes and `bundle-widget.css` is `52,115` bytes.
- Hygiene checks passed: `git diff --check` returned clean, modified-code competitor-reference scan returned no matches, and graph rebuild completed through the pipx graphify environment.
- Next: continue the evidence manifest from the remaining partial rows, starting with the nearest Admin visual/runtime mismatch rather than marking Add-ons fully green before Admin save/desktop proof is complete.

### 2026-05-27 00:09 IST - Authorized SIT Cart Transform deploy completed
- Ran the user-authorized package command `npm run deploy:sit -- --allow-updates`.
- Shopify CLI built the Rust Cart Transform WASM, validated extensions, and released `wolfpack-product-bundles-sit-282` to users.
- Next: retake live Add-ons cart proof after the release, then continue with the remaining Admin visual and save-proof gaps.

### 2026-05-27 00:10 IST - Post-SIT-282 Add-ons cart proof captured
- Cleared the storefront cart and posted the widget-equivalent three-component Add-ons cart payload after the `wolfpack-product-bundles-sit-282` release.
- Captured cart JSON proof at `/private/tmp/wpb-fpb-standard-addon-cart-after-sit-282-2026-05-27.json` and screenshot `/private/tmp/wpb-fpb-standard-addon-cart-after-sit-282-2026-05-27.png`.
- Proof remains green after deployment: Shopify renders one parent bundle line for `Codex FPB 2026-05-21`, total `$663.00`, parent variant `48193756201219`, `Retail Price: $728.00`, and `You Save: $65.00 (9%)`.
- Next: continue remaining partial manifest rows, with Add-ons Admin visual parity as the nearest open gate for this row.

### 2026-05-27 00:13 IST - FPB Add-ons Admin visual parity patch started
- Compared EB `/private/tmp/eb-complete-configure-audit-2026-05-25/fpb-admin-free-gift-add-ons-enabled.png` with WPB `/private/tmp/wpb-fpb-addons-admin-configured-2026-05-26.png` and `/private/tmp/wpb-fpb-fixed-addons-message-admin-unsaved-2026-05-26.png`.
- Mismatches selected for the next focused patch: Add-ons configure canvas alignment, Add-ons card header/toggle row, disabled Multi Language pill, product-selection row, tier card spacing, three-column discount row, Tier Rules copy, and Add Add Ons Tier button shape.
- Next: add a RED route-source contract test for the Add-ons Admin layout markers, then patch only the FPB configure route/CSS for that section.

### 2026-05-27 00:20 IST - FPB Add-ons Admin visual patch verified
- Added RED-to-green route-source coverage in `tests/unit/routes/fpb-addons-admin-layout.test.ts` for dedicated Add-ons Admin visual markers.
- Patched the FPB configure Add-ons section to use a compact header/toggle/help row, disabled Multi Language pill, selected-count row, three-column discount grid, Tier Rules block, and full-width Add Tier buttons.
- Widened the FPB configure canvas from `840px` to `940px` so the Add-ons card aligns closer to the reference proportions and the `Discount on Add-ons` label no longer wraps.
- Captured live Chrome proof at `/private/tmp/wpb-fpb-addons-admin-after-layout-patch-wide-2026-05-27.png`.
- Verification passed: focused Add-ons Jest suite, TypeScript/TSX modified-file ESLint with 0 errors, `npm run build`, graph rebuild, `git diff --check`, and modified-code competitor-reference scan.
- Row remains `partial`: global Admin shell/header parity and a cleaner Add-ons fixture still need final measured comparison before the manifest can go green.

### 2026-05-27 00:25 IST - FPB configure shell/header parity slice started
- Comparing the current WPB Add-ons proof with the reference shows the next controllable mismatch is the Full Page configure shell/header: WPB still emits the Shopify breadcrumb `ui-title-bar`, while the reference uses an in-app product title strip plus the centered Configure Bundle Flow header.
- Next: add a RED source contract for the FPB configure shell markers, remove the route-level breadcrumb title bar, add the internal app title row, and verify with focused Jest, ESLint, build, Chrome screenshot, graph rebuild, and hygiene scans.

### 2026-05-27 00:28 IST - FPB configure shell duplicate-title correction
- Chrome proof after removing `ui-title-bar` showed Shopify automatically renders the app-name title row, so the route-owned title strip creates a duplicate header rather than matching the reference shell.
- Next: tighten the RED contract so FPB omits both the route breadcrumb and any duplicate local app title strip, then remove the local strip/CSS while keeping the Configure Bundle Flow header intact.

### 2026-05-27 00:34 IST - FPB configure shell/header proof verified
- Added RED-to-green route-source coverage in `tests/unit/routes/fpb-admin-shell-layout.test.ts` proving the Full Page configure route does not emit `ui-title-bar` and does not render a duplicate local app title strip.
- Removed the FPB configure route breadcrumb title bar and confirmed Chrome proof at `/private/tmp/wpb-fpb-admin-shell-after-breadcrumb-removal-2026-05-27.png`: Shopify now supplies the app-name shell row while the iframe keeps Configure Bundle Flow, readiness score, preview, and the Add-ons layout.
- Updated the evidence manifest and internal Shopify Admin note with the observed shell behavior.
- Verification passed: focused FPB shell/Add-ons Jest suite, modified-file ESLint with 0 errors, `npm run build`, graph rebuild, `git diff --check`, and modified-code competitor-reference scan.
- Row remains `partial`: mobile fixed-amount Add-ons heading proof and a cleaner Add-ons fixture still need final measured comparison before green.

### 2026-05-27 00:37 IST - FPB Add-ons mobile proof refreshed
- Retook current mobile Standard Add-ons proof by completing the paid step and advancing to the Add-ons step.
- Captured `/private/tmp/wpb-fpb-standard-mobile-addons-step-current-2026-05-27.png` plus `/private/tmp/wpb-fpb-standard-mobile-addons-step-current-2026-05-27.json`; proof shows timeline `Add On`, body heading `Add ON`, the add-on product card, and sticky Add to Cart footer.
- Updated the evidence manifest to remove the mobile Add-ons heading gap. The row remains `partial` only because the current proof bundle is broader than the clean Add-ons evidence fixture and still needs final same-fixture measured comparison.

### 2026-05-27 00:53 IST - DCP Cart Messaging hydration blocker isolated
- Re-tested the live Product Page Layout Cart Messaging deep link after the local switch/dirty-state patches.
- Chrome still shows the Additional Configurations screen as server-rendered only: the `Bundle Items` switch has no React hydration keys, click leaves `aria-checked="true"`, and the Save/Discard footer does not appear.
- Network proof shows the DCP route loads the preview barrel, which pulls `PreviewScope` and its raw widget-CSS imports; those `extensions/bundle-builder/assets/*.css?raw` requests return `404` in the dev iframe before hydration completes.
- Next edit: add RED route-source coverage that the DCP route imports `PreviewPanel` directly instead of through the preview barrel, then patch the import and retest Chrome hydration/save proof.

### 2026-05-27 00:58 IST - DCP Cart Messaging save proof captured
- Added RED-to-green route-source coverage in `tests/unit/routes/design-settings-cart-messaging.test.ts` proving the DCP route imports `PreviewPanel` directly rather than through the preview barrel.
- Patched `app/routes/app/app.design-control-panel/route.tsx` to use the direct preview import, preventing the Cart Messaging deep link from loading `PreviewScope` and its raw widget-CSS imports before hydration.
- Chrome proof now shows the `Bundle Items` switch has React hydration keys, toggles to `aria-checked="false"`, opens the Save/Discard footer, and makes no raw `bundle-widget*.css?raw` requests.
- Captured Admin/save proof: screenshot `/private/tmp/wpb-dcp-product-page-cart-messaging-hydrated-unsaved-2026-05-27.png`, request `/private/tmp/wpb-dcp-product-page-cart-messaging-save-2026-05-27.network-request`, response `/private/tmp/wpb-dcp-product-page-cart-messaging-save-2026-05-27.network-response`.
- Verified DB and CartTransform owner metafield persistence with sanitized proof files `/private/tmp/wpb-dcp-product-page-cart-messaging-db-2026-05-27.json` and `/private/tmp/wpb-dcp-product-page-cart-messaging-cart-transform-metafield-2026-05-27.json`.
- Advisor returned a separate possible App Bridge render-race hardening path, but the measured hydration blocker is resolved by the direct import; no extra App Bridge patch was applied in this slice.
- Next: update the manifest rows, run focused validation, and capture a fresh off-state cart proof for `Bundle Items` if needed before marking that row green.

### 2026-05-27 01:01 IST - PPB Cart Messaging off-state cart proof captured
- Cleared the storefront cart, reloaded the Product Page bundle, and added the preselected bundle after the DCP save set `bundleCartLineMessaging.showBundleContains=false`.
- Captured cart JSON proof at `/private/tmp/wpb-ppb-cart-json-cart-messaging-items-off-2026-05-27.json` and cart screenshot `/private/tmp/wpb-ppb-cart-page-cart-messaging-items-off-2026-05-27.png`.
- Proof shows one merged parent bundle line with `Box` and `Retail Price` public properties, no public `Items` property, and private `_Items` retained as an empty internal source.
- Remaining global Cart Messaging gap: a fresh post-save discounted PPB run is still needed to prove `You Save` stays present/formatted while `Items` is off.

### 2026-05-27 01:07 IST - PPB Cart Messaging all-off cart proof captured
- Saved the Product Page Cart Messaging DCP state with Bundle Items, Original Bundle Price, and Discount Display all off.
- Captured save/persistence proof: request `/private/tmp/wpb-dcp-product-page-cart-messaging-original-discount-off-save-2026-05-27.network-request`, response `/private/tmp/wpb-dcp-product-page-cart-messaging-original-discount-off-save-2026-05-27.network-response`, DB `/private/tmp/wpb-dcp-product-page-cart-messaging-original-discount-off-db-2026-05-27.json`, and CartTransform owner metafield `/private/tmp/wpb-dcp-product-page-cart-messaging-original-discount-off-cart-transform-metafield-2026-05-27.json`.
- Cleared the cart, re-added the Product Page bundle, and captured `/private/tmp/wpb-ppb-cart-json-cart-messaging-all-off-2026-05-27.json` plus `/private/tmp/wpb-ppb-cart-page-cart-messaging-all-off-2026-05-27.png`.
- Proof shows one merged parent bundle line with only public `Box`; public `Items`, `Retail Price`, and `You Save` are omitted while private bundle metadata remains available for transform/accounting.
- Remaining PPB global Cart Messaging gap: discounted off-state proof is still needed to separately verify Discount Display omits `You Save` when a PPB run has savings.

### 2026-05-27 01:13 IST - PPB Cart Messaging discounted off-state proof captured
- Exercised the real Product Page widget after the all-off DCP save by selecting three component variants on the live BXY bundle.
- Captured cart JSON proof at `/private/tmp/wpb-ppb-cart-json-cart-messaging-you-save-off-discounted-2026-05-27.json` and screenshot `/private/tmp/wpb-ppb-cart-page-cart-messaging-you-save-off-discounted-2026-05-27.png`.
- Proof shows one merged parent bundle line with private savings metadata (`_bundle_total_savings_cents: "500"`) and only public `Box`; public `Items`, `Retail Price`, and `You Save` are omitted.
- Manifest rows `ppb-global-cart-items`, `ppb-global-retail-price`, and `ppb-global-you-save` can now be marked green for the evidenced PPB global Cart Messaging behavior.

### 2026-05-27 01:15 IST - PPB template proof loop started
- The next non-blocked manifest group is the Product Page template set: Product List, Product Grid, Horizontal Slots, and Vertical Slots.
- Code mapping already emits the documented `PDP_INPAGE/PDP_MODAL` and preset IDs; the remaining work is evidence capture, not a speculative implementation patch.
- Next: use Chrome to select each template through the Product Page Configure UI, capture Admin/save proof, runtime JSON, and desktop/mobile storefront proof before changing any row status.

### 2026-05-27 01:24 IST - PPB Product List runtime metafield gap found
- Saved Product List through the live Admin Select Template modal using the fresh host and captured Admin/save/DB proof.
- DB persisted `bundleDesignTemplate=PDP_INPAGE` and `bundleDesignPresetId=CASCADE`, but the storefront app-block `data-bundle-config` still served `PDP_MODAL + MODAL`.
- Next edit: add RED handler coverage that Product Page template saves rewrite the bundle product metafields/runtime config, then patch the select-template save handler and rerun Product List storefront proof.

### 2026-05-26 04:41 IST - PPB Subscriptions slice verified
- Verification passed: `npx jest tests/unit/lib/product-page-admin-sections.test.ts tests/unit/routes/ppb-bundle-settings.test.ts --runInBand`, modified-file ESLint with 0 errors, `npm run build`, graph rebuild, `git diff --check`, and modified-code competitor-reference scan.
- Manifest rows remain `partial`, not green, because this slice has Admin/navigation/validation evidence but still lacks the required populated save/runtime/storefront/cart proof.
- Next: continue to the next evidence-backed Admin/runtime gap, starting from the manifest and audit evidence rather than broad refactoring.

### 2026-05-26 04:43 IST - Local dev preview restore workaround started
- Live save proof for PPB Bundle Settings initially failed because the SIT database had not applied the new direct-contract migrations; applied the checked-in Prisma migrations with `npx prisma migrate deploy`.
- Retrying save still failed because the running dev process retained an old generated Prisma client, so the stale Shopify dev preview was stopped.
- Restarting the normal SIT dev preview is blocked by Shopify CLI function validation: the current Cart Transform input query exceeds the dev-preview complexity limit (`35 > 30`).
- Advisor recommendation: use a temporary web/Admin-only SIT app config that excludes the Cart Transform extension for embedded Admin proof, and keep cart-transform QA blocked until the function query is reduced below the limit.

### 2026-05-26 04:50 IST - Cart Transform input complexity fix started
- Full cart proof cannot go green while the Cart Transform Function query exceeds Shopify's input complexity limit.
- Next edit: add RED tests proving widget cart-source display data is serialized into one private JSON attribute and the Rust Function reads that compact attribute to emit the same public cart messaging fields.
- Constraint: keep existing public output labels unchanged while removing the extra per-line Function input attributes that pushed the dev preview over the limit.

### 2026-05-26 04:55 IST - Cart Transform full-dev blocker cleared
- Replaced the six per-line cart messaging source attributes with one `_bundle_display_properties` JSON attribute from the FPB widget, PPB widget, and SDK cart builder.
- Updated the Cart Transform input query and Rust merge parser to read only the compact display-properties attribute while preserving public `Box`, `Items`, `Retail Price`, and `You Save` merge outputs.

### 2026-05-26 14:13 IST - Code reference hygiene cleanup started
- Post-build hygiene found competitor-name references in code/test comments and test descriptions, which violates the rewrite plan's docs-only reference rule.
- Next: neutralize those references without changing behavior, rerun the banned-reference scan, and then continue the Add-ons evidence loop.
- Verification passed: RED-to-green `npx jest tests/unit/assets/sdk-cart.test.ts --runInBand`, cart messaging Jest suite, full Rust `cargo test --manifest-path extensions/bundle-cart-transform-rs/Cargo.toml`, and full `npm run dev -- --config shopify.app.wolfpack-product-bundles-sit.toml --store agent-5sfidg3m.myshopify.com` startup with the Cart Transform extension included.
- Removed the temporary web/Admin-only app config because the normal SIT preview no longer hits the Function input complexity error.

### 2026-05-26 04:58 IST - PPB category-product save validation bug found
- Chrome save proof with a selected product captured `/private/tmp/wpb-ppb-product-add-save-500.request.network-request` and `/private/tmp/wpb-ppb-product-add-save-500.response.network-response`.
- The request payload contains the selected product under `StepCategory.products`, but the server-side post-update metafield validation only checks `StepProduct`, direct `products`, and direct `collections`.
- Next edit: add RED coverage that a Product Page bundle with category-backed products and a Shopify parent product passes save/metafield validation, then update only that validator.

### 2026-05-26 05:01 IST - PPB category-product save proof captured
- Added RED-to-green route coverage for Product Page bundles whose selected products live under `StepCategory.products` while a Shopify parent product exists.
- Updated the post-save metafield guard to count `StepCategory.products` and `StepCategory.collections` as populated Product Page steps.
- Retried the same Chrome save and captured a 200 response at `/private/tmp/wpb-ppb-product-add-save-after-category-validator.request.network-request` and `/private/tmp/wpb-ppb-product-add-save-after-category-validator.response.network-response`.
- The response proves direct `individualSellingPlanSelection: { isEnabled: true, showFor: "ALL_PRODUCTS" }`, category products persisted under `StepCategory.products`, and the configured bundle stayed active.

### 2026-05-26 05:04 IST - PPB BXY subscription dependency proof captured
- Switched the Product Page Discount Type to Buy X, get Y, saved the bundle, and captured a 200 response at `/private/tmp/wpb-ppb-bxy-save-for-subscription-block.request.network-request` and `/private/tmp/wpb-ppb-bxy-save-for-subscription-block.response.network-response`.
- The request and response prove `discountData.discountType=buy_x_get_y` and direct `individualSellingPlanSelection.isEnabled=false`.
- Captured the disabled Bundle Settings Pre-order & Subscription Integration row with the blocker message at `/private/tmp/wpb-ppb-bxy-subscription-blocked-2026-05-26.png`.

### 2026-05-26 05:08 IST - PPB Place Widget template blocker found
- Storefront product page `/products/codex-ppb-2026-05-21` did not render the Product Page bundle widget, matching the Admin banner that placement/app embed setup was incomplete.
- The Place Widget modal returned bundle-specific template `product.codex-ppb-2026-05-21` as `templateExists: true`, but Theme Editor rejected the deep link with `"bundle-product-page" not added. The "product.codex-ppb-2026-05-21" template couldn't be found.`
- Root cause candidate: the server advertises a product-specific template even though the template service only returns a theme-app-extension placeholder and does not create Shopify template files.
- Next edit: add RED tests for resolving bundle-specific placement to the real default `product` template, then patch the template response/deep-link path.

### 2026-05-26 05:13 IST - PPB Place Widget popup blocker found
- Patched and live-tested the template response path enough for the modal to advertise the bundle product against the default `product` template; captured `/private/tmp/wpb-ppb-place-widget-modal-after-template-fix-2026-05-26.png` and request/response proof at `/private/tmp/wpb-ppb-place-widget-modal-after-template-fix.*`.
- Clicking `Select` now successfully calls `/api/ensure-product-template` with a 200 response, captured at `/private/tmp/wpb-ppb-ensure-product-template-after-default-template-fix.*`, but no new Theme Editor tab opens.
- Root cause candidate: the click handler awaits template preparation before creating the tab, so Chrome drops the original user activation and blocks the popup silently.
- Next edit: add focused test coverage for the Theme Editor deep-link builder and patch the click handler to pre-open the editor tab synchronously, closing it only if preparation fails.

### 2026-05-26 05:16 IST - PPB storefront category-products metafield gap found
- Theme Editor placement saved with the `Bundle Builder` app block; captured `/private/tmp/wpb-ppb-theme-editor-placement-saved-2026-05-26.png`.
- Reloaded `/products/codex-ppb-2026-05-21`; the Product Page app block renders and the runtime container has `data-bundle-id="cmpfhk3ys0001v0t0w2r3xvls"`, but the widget remains in a loading/disabled state.
- Runtime JSON proof shows `data-bundle-config.steps[0].products` and `collections` are empty even though the Admin save payload persisted selected products under `StepCategory.products`.
- Next edit: add RED formatter/metafield coverage that Product Page category-backed products are emitted in the storefront runtime config, then patch only the writer/formatter path.

### 2026-05-26 05:25 IST - PPB storefront hydration base URL gap found
- After the category-product runtime patch and save retry, Chrome proof shows `data-bundle-config.steps[0].products` now contains the selected Product GID, but opening the Step 1 slot still fails to hydrate products.
- Network proof shows the widget fetches `api/storefront-products` from stale `$app:serverUrl` (`getting-opinions-salaries-sized.trycloudflare.com`) and fails with DNS resolution; the same request succeeds through the Shopify app proxy at `/apps/product-bundles/api/storefront-products`.
- Next edit: add RED widget resolver coverage for Product Page storefront hydration URLs, then patch the Product Page widget to use the storefront app-proxy route on Shopify storefronts while preserving direct app-domain behavior for previews.

### 2026-05-26 05:28 IST - PPB variant normalization gap found
- After the app-proxy hydration patch, the Step 1 modal fetches successfully but renders `No products are configured for this step.`
- Runtime product proof shows the selected product has an unavailable first variant and later available variants; the current non-individual Product Page product-card path drops the entire product when `variants[0]` is unavailable.
- Next edit: add RED product normalization coverage requiring the first available variant to back the parent product card, then patch the Product Page widget normalization path.

### 2026-05-26 05:36 IST - Cart transform self-heal signature blocker found
- Live PPB cart add now posts successfully to `/cart/add.js`, and `/cart.js` proves the line carries `_bundle_id`, `_bundle_name`, `_step_index`, and compact `_bundle_display_properties`.
- Cart page public Bundle Items/Retail Price/You Save labels are still not visible because the storefront self-heal endpoint returns `400 Invalid storefront request`.
- Current route review shows `api.cart-transform-heal` reimplements app-proxy signature verification instead of using the shared app-proxy helper, so the next edit will add RED route coverage for a correctly signed app-proxy request and then patch only that verification path.

### 2026-05-26 05:39 IST - PPB selected-variant cart transform gap found
- Patched and live-verified the self-heal route: `/apps/product-bundles/api/cart-transform-heal` now returns 200 and activated CartTransform `gid://shopify/CartTransform/100663555`.
- Reloaded the cart after activation; public cart labels are still absent because the cart line's selected variant is not the product's first variant, while category-backed component metafield sync only writes `component_parents` to first-variant fallbacks.
- Next edit: add RED service coverage proving StepCategory products with cached variants write `component_parents` to every cached variant, then patch the component metafield writer without changing existing first-variant fallback behavior for products that truly lack variant data.

### 2026-05-26 05:42 IST - PPB Sync Product category runtime regression found
- The live Sync Product request returned 200 and reported success, but the storefront product metafield was rewritten with empty `steps[0].products`.
- Handler review confirms the existing-product sync path loads `steps: true` and rebuilds `optimizedSteps` only from `step.products`/`step.collections`, dropping `StepCategory.products` and cached variants.
- Next edit: add RED route coverage that Sync Product preserves category-backed products and variants in the metafield sync payload, then patch the handler include/config builder for the existing-product, create-product, and hard-reset sync paths.

### 2026-05-26 05:48 IST - PPB Sync Product cached-variant writer gap found
- The Sync Product fix must pass a flattened `steps[].products` list to the storefront runtime while still writing component metadata to every cached selected variant for Cart Transform.
- Current component metafield code only uses every cached variant for `StepProduct` and `StepCategory`; flattened `products[]` still falls back to first-variant lookup.
- Next edit: add RED coverage for flattened cached variants, then patch the component writer and Sync Product handler together so runtime hydration and selected-variant cart merge stay in sync.

### 2026-05-26 05:52 IST - PPB Sync Product category runtime fix unit-verified
- Added RED-to-green coverage for flattened cached variants in `tests/unit/services/component-product-metafield.test.ts`.
- Patched the Product Page Sync Product paths to load DB step products/categories, flatten category products and collections into the runtime payload, keep category structure for metafield writers, and include `id`/`shopifyProductId` in the config.
- Targeted verification passed: `npx jest tests/unit/services/component-product-metafield.test.ts tests/unit/routes/ppb-sync-product.test.ts --runInBand`.
- Next: re-run the live Admin Sync Product, capture network/runtime proof, then retry desktop/mobile storefront and cart transform proof.

### 2026-05-26 06:06 IST - PPB BXY cart transform method gap found
- Live Sync Product and runtime hydration now pass: `/private/tmp/wpb-ppb-runtime-after-category-sync-fix.json` proves category products are present, and `/private/tmp/wpb-ppb-storefront-desktop-after-category-sync-fix-2026-05-26.png` proves the modal renders hydrated products.
- Retried the BXY cart path with quantity 2 and captured `/private/tmp/wpb-ppb-cart-add-bxy-quantity2-after-category-sync-fix.request.network-request`, `/private/tmp/wpb-ppb-cart-json-bxy-quantity2-after-category-sync-fix.json`, and `/private/tmp/wpb-ppb-cart-page-bxy-quantity2-after-category-sync-fix-2026-05-26.png`; the cart line still does not merge or expose public bundle labels.

### 2026-05-26 18:09 IST - FPB fixed-amount sidebar progress visual slice started
- Compared the captured EB fixed-amount desktop proof with the WPB fixed-amount proof and found the original WPB proof fixture was still saved on the Horizontal preset.
- Reset the WPB proof bundle through the live Admin Select Template flow to `FBP_SIDE_FOOTER + DEFAULT`; captured `/private/tmp/wpb-fpb-fixed-amount-template-reset-standard.request.network-request`, `/private/tmp/wpb-fpb-fixed-amount-template-reset-standard.response.network-response`, and `/private/tmp/wpb-fpb-fixed-amount-template-reset-standard-admin-2026-05-26.png`.
- Recaptured the fixed-amount storefront on the matching Standard preset at `/private/tmp/wpb-fpb-discount-fixed-amount-standard-runtime-desktop-empty-2026-05-26.json` and `/private/tmp/wpb-fpb-discount-fixed-amount-standard-storefront-desktop-empty-2026-05-26.png`.
- Remaining concrete mismatch selected for this slice: sidebar discount message/progress renders as a green pill plus black progress block in WPB, while the evidence shows plain centered discount text with a slim green progress line and tier labels on the white summary card.
- Next: add RED widget/CSS contract coverage for sidebar-only step progress structure, patch the widget/CSS, rebuild assets, and recapture desktop/mobile runtime proof.

### 2026-05-26 18:22 IST - FPB fixed-amount sidebar progress visual slice verified
- Added RED-to-green widget/CSS coverage in `tests/unit/assets/bundle-widget-full-page-discount-display.test.ts` for sidebar-specific step progress structure and desktop/mobile summary-message styling.
- Updated the Full Page widget to render sidebar step progress with separated tier title, slim track, and tier subtext, while keeping footer progress on the existing banner structure.
- Updated raw and minified Full Page widget CSS so desktop side panel and mobile bottom sheet use transparent black discount text and a slim green progress track instead of a dark banner block.
- Rebuilt assets with `npm run build:widgets` and `npm run minify:assets css`.
- Captured desktop proof `/private/tmp/wpb-fpb-discount-fixed-amount-standard-runtime-desktop-after-sidebar-progress-color-fix-2026-05-26.json` and `/private/tmp/wpb-fpb-discount-fixed-amount-standard-storefront-desktop-after-sidebar-progress-color-fix-2026-05-26.png`; captured mobile expanded proof `/private/tmp/wpb-fpb-discount-fixed-amount-standard-runtime-mobile-after-sidebar-progress-mobile-message-fix-expanded-2026-05-26.json` and `/private/tmp/wpb-fpb-discount-fixed-amount-standard-storefront-mobile-after-sidebar-progress-mobile-message-fix-expanded-2026-05-26.png`.
- Verification passed: `node --check app/assets/bundle-widget-full-page.js`, focused Jest, `npm run build:widgets`, `npm run minify:assets css`, test-file ESLint, `git diff --check`, graph rebuild, and scoped competitor-reference scan. ESLint cannot parse `app/assets/bundle-widget-full-page.js` under `--no-ignore` because the repo tsconfig excludes raw asset files, so syntax is covered by `node --check`.
- Remaining gaps before green: the WPB proof fixture still has different product/category/add-on content from the EB fixed-amount fixture, the proof store uses USD for calculated storefront copy, and mobile/product-card density still requires measured parity work.
- Direct Admin GraphQL proof shows selected variant `gid://shopify/ProductVariant/48191691489539` has `component_parents`, and CartTransform `gid://shopify/CartTransform/100663555` is active, but the stored `price_adjustment.method` is `buy_x_get_y`.
- Handler review shows the Rust function pricing enum does not accept `buy_x_get_y`, so deserializing `component_parents` can drop the parent before MERGE.
- Next edit: add RED Rust transform coverage for BXY component-parent deserialization and pricing, then patch the cart transform method support only.

### 2026-05-26 06:14 IST - PPB BXY cart transform method fix unit-verified
- Added RED-to-green writer coverage that Bundle/Product component metafields persist BXY `customerBuys`, `customerGets`, `discountType`, `applyDiscountTo`, and a total buy+get quantity threshold.
- Added RED-to-green Rust Function coverage that `component_parents.price_adjustment.method=buy_x_get_y` deserializes and emits a MERGE operation with public `Items`, `Retail Price`, and `You Save` attributes.
- Patched the metadata price-adjustment builder and Rust pricing/MERGE paths so BXY can compute an effective percentage decrease from discounted units.
- Targeted verification passed: `npx jest tests/unit/services/component-product-metafield.test.ts tests/unit/services/bundle-product-metafield.test.ts --runInBand` and `cargo test` in `extensions/bundle-cart-transform-rs`.
- Next: live proof remains gated by Shopify Function deployment; run Sync Product after deploy/dev function update, then re-run the cart JSON/page proof with total buy+get quantity.

### 2026-05-26 06:23 IST - PPB BXY cart transform live proof captured
- Live Sync Product wrote the corrected selected-variant component-parent metadata: `method=buy_x_get_y`, `customerBuys=2`, `customerGets=1`, `discountType=percentage`, `applyDiscountTo=lowest_priced`, and `conditions.value=3`.
- The current storefront app-block asset URL returns Shopify 404 and is blocked as `net::ERR_BLOCKED_BY_ORB`; captured DOM/asset proof at `/private/tmp/wpb-ppb-product-page-dom-before-bxy-cart-click.json` and `/private/tmp/wpb-ppb-widget-product-page-dev-asset-orb.*` was unavailable because the request failed before a response body was exposed.
- Isolated the Cart Transform by posting the widget-equivalent `/cart/add.js` payload shape directly from the storefront. Cart JSON proof `/private/tmp/wpb-ppb-cart-bxy-total-threshold-widget-shape-after-transform-fix.json` shows parent variant `48193769439491`, retail `$369.00`, effective price `$246.00`, and public `Box`, `Items`, `Retail Price`, and `You Save` line properties.
- Cart page screenshot proof captured at `/private/tmp/wpb-ppb-cart-page-bxy-total-threshold-widget-shape-after-transform-fix-2026-05-26.png`.
- Next: fix or re-establish Product Page widget asset delivery before claiming storefront runtime parity from a real click path; then address the Product Page BXY storefront message/quantity threshold gap found during earlier UI interaction.

### 2026-05-26 06:36 IST - PPB BXY storefront click-path loop resumed
- Shopify dev preview refreshed the Product Page widget asset from a stale 404/ORB URL to a current 200 bundle URL, unblocking real storefront interaction proof.
- Added RED-to-green widget coverage for Buy X, get Y storefront pricing math: customer-buy quantity alone must not qualify, buy+get quantity must qualify, progress target must use buy+get, and the discount text must show the get quantity.
- Rebuilt widget bundles with `npm run build:widgets`; generated Product Page and Full Page bundle outputs now contain the BXY pricing fix.
- Live DOM inspection shows the Step 1 modal hydrates products, but the root loading overlay remains in the accessibility tree after opacity transition and must be treated as a storefront proof gap.
- Next: inspect the live Product Page quantity path against the current step condition/max settings, then add a focused RED test for the loading overlay removal/accessibility contract before patching either runtime.

### 2026-05-26 06:42 IST - PPB widget init error-handler blocker found
- Added RED-to-green tests for BXY message variable replacement and the loading overlay lifecycle helper; widget bundles rebuilt and the dev preview updated.
- Reload proof then exposed a separate Product Page widget initialization error: the constructor promise catch calls `this.showError(...)`, but the widget class defines `showErrorUI(...)`; the missing method masks the underlying load error and leaves the root with only `Add Bundle to Cart`.
- Next: add a focused RED contract test for the widget constructor catch handlers, patch Product Page and Full Page constructors to use the existing error UI method, rebuild widgets, and retry the storefront proof.

### 2026-05-26 06:45 IST - Widget bundler helper inclusion blocker found
- Constructor catch tests now pass, but reload proof surfaced the underlying runtime error: `hideLoadingOverlayElement is not defined`.
- Root cause: the custom widget bundler removes ES module imports and only inlines files listed in `SHARED_MODULES`; the new loading overlay helper source was not listed, so bundled widgets referenced an undefined helper.
- Next: add a RED build-script contract for shared helper inclusion, add the helper to the bundle order, rebuild, and retry Product Page storefront proof.

### 2026-05-26 06:51 IST - PPB BXY real widget click proof captured
- Added RED-to-green coverage for the custom widget bundler shared-module list and added the loading overlay helper to the inlined shared modules.
- Verified targeted tests pass: `npx jest tests/unit/assets/widget-build-shared-modules.test.ts tests/unit/assets/widget-init-error-handler.test.ts tests/unit/assets/loading-overlay.test.ts tests/unit/assets/pricing-calculator-bxy.test.ts --runInBand`.
- Rebuilt widget bundles with `npm run build:widgets`; after a transient Shopify dev-bundle ENOENT copy race, the dev preview updated and served a CDN asset containing `hideLoadingOverlayElement` and BXY `discountValueUnit: '%'`.
- Captured desktop and mobile Product Page BXY success proof from the real widget click path:
  - `/private/tmp/wpb-ppb-storefront-desktop-bxy-success-after-widget-helper-fix-2026-05-26.png`
  - `/private/tmp/wpb-ppb-storefront-runtime-bxy-success-after-widget-helper-fix-2026-05-26.json`
  - `/private/tmp/wpb-ppb-storefront-mobile-bxy-success-after-widget-helper-fix-2026-05-26.png`
  - `/private/tmp/wpb-ppb-storefront-mobile-runtime-bxy-success-after-widget-helper-fix-2026-05-26.json`
- Captured real widget cart proof at `/private/tmp/wpb-ppb-cart-json-bxy-real-widget-click-after-helper-fix-2026-05-26.json` and `/private/tmp/wpb-ppb-cart-page-bxy-real-widget-click-after-helper-fix-2026-05-26.png`; cart JSON proves merged parent variant `48193769439491`, total `$246.00`, public `Items`, `Retail Price`, and `You Save`.
- Updated the evidence manifest rows for PPB BXY and PPB global cart-line properties; they remain `partial` until live DCP save proof and Admin discount-card pixel proof are captured.

### 2026-05-26 06:53 IST - PPB BXY Admin visual mismatch logged
- Captured current WPB Admin Discount & Pricing BXY state at `/private/tmp/wpb-ppb-admin-discount-bxy-current-2026-05-26.png` and compared it against EB evidence `/private/tmp/eb-complete-configure-audit-2026-05-25/ppb-admin-discount-buyxgety-save-state-resolved.png`.
- Mismatches: WPB content is too narrow and shifted right, the BXY rule card stacks Discount value / Discount type / Apply Discount to vertically instead of the EB horizontal row, the rule card padding/Remove placement differs, and the EB unsaved-changes save bar is not present in this captured state.
- Next edit: add focused Admin layout coverage for the BXY three-control row and Discount & Pricing shell class, then patch the PPB configure layout/styles before re-capturing Admin proof.

### 2026-05-26 06:56 IST - PPB BXY Admin layout TDD started
- Starting the focused Admin layout patch for the already captured Product Page Discount & Pricing BXY mismatch.
- RED coverage will require a dedicated BXY rule-body wrapper, a three-column reward controls grid, and a left-aligned wider edit canvas before route/CSS edits.
- Next: run the targeted RED Jest test, patch only the PPB route/styles needed for this mismatch, and re-capture Admin proof.

### 2026-05-26 06:59 IST - PPB BXY Admin row alignment improved
- Added RED-to-green route/CSS coverage in `tests/unit/routes/discount-pricing-ui-contract.test.ts` for the Product Page BXY rule-body wrapper, three-column reward controls row, and wider left-aligned edit canvas.
- Patched the Product Page configure route and CSS so Discount value, Discount type, and Apply Discount to render as one desktop row; captured WPB proof at `/private/tmp/wpb-ppb-admin-discount-bxy-after-layout-patch-1280-2026-05-26.png`.
- Verification passed: `npx jest tests/unit/routes/discount-pricing-ui-contract.test.ts --runInBand`; TS/TSX ESLint passed with 0 errors. ESLint cannot parse CSS modules in the current project config, so the CSS module is covered by Jest source contract and Chrome screenshot proof.
- Remaining Admin mismatch: WPB still shows the Shopify breadcrumb/configure title, internal Configure Bundle Flow header, placement warning, and no unsaved-changes save bar in this state; the PPB BXY manifest row stays `partial`.

### 2026-05-26 07:01 IST - PPB configure shell chrome TDD started
- Next focused mismatch is the Product Page configure shell chrome above the left rail/right content area.
- EB evidence shows an in-app brand header and no separate Shopify breadcrumb configure row, no internal `Configure Bundle Flow` heading, and no top placement warning banner above the cards.
- Next: add RED route/CSS contract coverage for the in-app header and removal of the extra title/banner chrome, patch only the PPB configure shell, then re-capture 1280px Admin proof.

### 2026-05-26 07:04 IST - PPB shell header assumption corrected
- Captured `/private/tmp/wpb-ppb-admin-discount-bxy-after-shell-header-patch-1280-2026-05-26.png` after removing the configure title-bar and adding an internal brand header.
- Evidence comparison shows the external Shopify app-title row now matches the reference shell, while the added internal brand header is an extra mismatch that pushes cards down.
- Next correction: update the route/CSS contract to require no internal app header, keep the app-level Shopify title row, and have the two-column cards begin immediately below that row.

### 2026-05-26 07:08 IST - PPB shell width measurement correction started
- Captured `/private/tmp/wpb-ppb-admin-discount-bxy-after-shell-correction-1280-2026-05-26.png` after removing the internal header.
- Vertical shell structure now matches the reference more closely, but the right content starts around 10px too far left and the whole two-column grid is still narrower than the reference.
- Next edit: update RED layout coverage from the earlier `934px` assumption to a measured `994px` border-box shell and 310px setup rail, then re-capture Admin proof.

### 2026-05-26 07:11 IST - PPB shell width correction captured
- Updated the Admin layout contract and CSS to use a 994px border-box edit canvas with a 310px setup rail, matching the reference left rail and right panel x-position at 1280px.
- Captured `/private/tmp/wpb-ppb-admin-discount-bxy-after-width-correction-1280-2026-05-26.png`; also proved the Shopify unsaved-changes bar appears from the App Bridge save bar, but discarded the unsaved edit because keyboard selection in the embedded number field appended digits during the dirty-state probe.
- Verification passed: `npx jest tests/unit/routes/discount-pricing-ui-contract.test.ts --runInBand`; TS/TSX ESLint passed with 0 errors and existing warnings.
- Remaining PPB BXY Admin gaps: exact scrolled save-state composition and any smaller per-card spacing differences still need side-by-side proof before marking green.

### 2026-05-26 07:13 IST - PPB shell build verified
- Production build passed after the PPB configure route/CSS shell changes: `npm run build`.
- Vite emitted only existing chunk/dynamic-import warnings; no build errors.
- Next: continue from the manifest, prioritizing evidence-backed rows that still have implementation or proof gaps.

### 2026-05-26 07:14 IST - PPB shell header correction reopened
- While comparing Bundle Settings against `ppb-admin-bundle-settings-quantity-validation-enabled-resolved.png`, the evidence showed the internal `Configure Bundle Flow` header, Readiness Score, and Preview Bundle actions are present in the reference.
- The previous no-header rule was based on the scrolled BXY screenshot and is not valid for the shell default position.
- Next edit: restore the internal configure header while keeping the Shopify app title row and removing only the top app-embed warning banner from the default shell.

### 2026-05-26 07:17 IST - PPB configure header TDD resumed
- Re-ran the Product Page Discount & Pricing Admin layout contract and confirmed the intended RED failure: the route is missing `productPageBundleStyles.canvasHeader`.
- Next edit: restore the internal configure header, readiness score, and preview action in the Product Page configure shell, while keeping the app title row and excluding the top placement-warning banner.

### 2026-05-26 07:22 IST - PPB configure header proof mismatch logged
- Restored the Product Page configure header and verified the focused contract, ESLint, and production build passed.
- Captured Bundle Settings proof at `/private/tmp/wpb-ppb-bundle-settings-after-header-restore-1280-2026-05-26.png`; comparison against `/private/tmp/eb-complete-configure-audit-2026-05-25/ppb-admin-bundle-settings-quantity-validation-enabled-resolved.png` shows the first card starts too close to the header row.
- Next edit: add CSS contract coverage for the reference header margin and increase the Product Page configure shell vertical spacing before re-capturing Admin proof.

### 2026-05-26 07:26 IST - PPB Bundle Settings card layout mismatch logged
- Captured `/private/tmp/wpb-ppb-bundle-settings-after-card-layout-1280-2026-05-26.png` after moving Bundle Settings toggles inline and removing extra Pre Selected Product helper controls.
- Remaining mismatch: the default-products picker group sits lower than the reference, pushing Quantity Validation and the Cart line item discount display card down.
- Next edit: add focused route/CSS coverage for a compact default-products picker group and tighten that vertical spacing before re-capturing.

### 2026-05-26 07:29 IST - PPB Bundle Settings Admin proof updated
- Tightened the default-products picker group and captured `/private/tmp/wpb-ppb-bundle-settings-after-picker-spacing-1280-2026-05-26.png`.
- Matched the reference Quantity Validation state by toggling the control on, captured unsaved-state proof at `/private/tmp/wpb-ppb-bundle-settings-quantity-enabled-unsaved-1280-2026-05-26.png`, then discarded the dirty change through the App Bridge discard confirmation.
- Verification passed: `npx jest tests/unit/routes/ppb-bundle-settings.test.ts tests/unit/routes/discount-pricing-ui-contract.test.ts --runInBand`, modified TS/TSX ESLint with 0 errors, and `npm run build`.
- Remaining Bundle Settings gaps: save/network proof, runtime JSON, storefront desktop/mobile, and cart behavior remain open before any row can be green.

### 2026-05-26 07:52 IST - PPB Quantity Validation save proof captured
- Saved the Product Page Bundle Settings quantity-validation state through the embedded Admin page and captured the request/response at `/private/tmp/wpb-ppb-bundle-settings-quantity-save-2026-05-26.request.network-request` and `/private/tmp/wpb-ppb-bundle-settings-quantity-save-2026-05-26.response.network-response`.
- The response proves `success: true`, direct `validateQuantityPerProduct: { isEnabled: true, allowedQuantity: 1 }`, direct `defaultProductsData: {}`, direct `individualSellingPlanSelection`, and direct `bundleTextConfig` persisted in the bundle response.
- Re-read the live Admin page after the save and captured clean persisted UI proof at `/private/tmp/wpb-ppb-bundle-settings-quantity-persisted-1280-2026-05-26.png`; the accessibility snapshot at `/private/tmp/wpb-ppb-admin-page20-post-save-snapshot-2026-05-26.txt` shows Quantity Validation checked, max quantity `1`, and no save bar.
- Next: capture runtime JSON and desktop/mobile storefront proof for Quantity Validation, then patch only if the runtime/storefront behavior diverges.

### 2026-05-26 07:54 IST - PPB Bundle Settings runtime gap found
- Reloaded the Shopify storefront product page and captured runtime JSON at `/private/tmp/wpb-ppb-storefront-runtime-quantity-validation-after-save-2026-05-26.json`.
- Gap: the app-block `data-bundle-config` still omits `validateQuantityPerProduct`, `defaultProductsData`, `bundleTextConfig`, and `individualSellingPlanSelection`, even though the Admin save response includes those direct fields.
- Root cause candidate from code review: Product Page save builds a separate metafield configuration object and the bundle variant metafield writer does not copy the direct Bundle Settings contracts into `bundle_ui_config`.
- Next edit: add RED tests proving Product Page save passes the direct contracts into metafield sync and the bundle variant metafield includes those contracts, then patch only that writer path.

### 2026-05-26 08:02 IST - PPB Quantity Validation storefront behavior gap found
- Added RED-to-green save/metafield coverage for direct Bundle Settings contracts and patched the Product Page metafield path; re-saved through Chrome at `/private/tmp/wpb-ppb-bundle-settings-quantity-save-after-runtime-contract-fix-2026-05-26.request.network-request` and response `/private/tmp/wpb-ppb-bundle-settings-quantity-save-after-runtime-contract-fix-2026-05-26.response.network-response`.
- Runtime JSON now includes `validateQuantityPerProduct: { isEnabled: true, allowedQuantity: 1 }`, `defaultProductsData`, `bundleTextConfig`, `individualSellingPlanSelection`, and PPB template fields at `/private/tmp/wpb-ppb-storefront-runtime-quantity-validation-after-runtime-contract-fix-2026-05-26.json`.
- Storefront behavior still fails parity: after selecting one product, reopening the Product Page modal and pressing `+` on the selected product creates a second filled slot even though `allowedQuantity` is `1`; proof files: `/private/tmp/wpb-ppb-storefront-quantity-validation-reopen-selected-state-2026-05-26.json`, `/private/tmp/wpb-ppb-storefront-quantity-validation-selected-plus-after-runtime-contract-fix-2026-05-26.json`, and `/private/tmp/wpb-ppb-storefront-quantity-validation-after-selected-plus-state-2026-05-26.json`.
- Next edit: add RED widget coverage for the Product Page quantity-validation gate and patch the Product Page widget quantity controls/state updater so per-product increases stop at `allowedQuantity`.

### 2026-05-26 08:10 IST - PPB Quantity Validation storefront proof completed
- Added RED-to-green widget coverage for the Product Page per-product quantity gate, then patched the Product Page widget so selected product increases are disabled/rejected at `validateQuantityPerProduct.allowedQuantity`.
- Rebuilt widgets with `npm run build:widgets`; the served Product Page asset contains the new quantity-gate calls, captured at `/private/tmp/wpb-ppb-storefront-product-page-asset-quantity-validation-proof-2026-05-26.json`.
- Captured desktop selected-state proof at `/private/tmp/wpb-ppb-storefront-desktop-quantity-validation-selected-disabled-after-widget-fix-2026-05-26.png` and accessibility snapshot `/private/tmp/wpb-ppb-storefront-desktop-quantity-validation-selected-disabled-after-widget-fix-2026-05-26.txt`; snapshot shows quantity `1`, the selected product `+` button disabled, and `SELECTED ✓`.
- Captured mobile runtime/proof at `/private/tmp/wpb-ppb-storefront-mobile-runtime-quantity-validation-after-widget-fix-2026-05-26.json`, `/private/tmp/wpb-ppb-storefront-mobile-quantity-validation-selected-disabled-after-widget-fix-2026-05-26.png`, and `/private/tmp/wpb-ppb-storefront-mobile-quantity-validation-selected-disabled-after-widget-fix-2026-05-26.txt`; snapshot shows the same disabled selected-product state and enabled `Add Bundle to Cart • $123.00`.
- Updated the evidence manifest `ppb-quantity-validation` row to green because Admin UI, save response, runtime JSON, desktop behavior, and mobile behavior are now proved; cart is not applicable for this control.

### 2026-05-26 08:13 IST - PPB Quantity Validation verification passed
- Focused Jest passed: `npx jest tests/unit/routes/ppb-save-bundle.test.ts tests/unit/services/bundle-product-metafield.test.ts tests/unit/assets/condition-validator.test.ts tests/unit/assets/bundle-widget-product-page-products.test.ts tests/unit/routes/ppb-bundle-settings.test.ts tests/unit/routes/discount-pricing-ui-contract.test.ts --runInBand` with 6 suites and 156 tests.
- Re-ran the focused metafield test after fixing import order: `npx jest tests/unit/services/bundle-product-metafield.test.ts --runInBand` with 9 tests.
- Modified-file ESLint passed with 0 errors using `npx eslint --max-warnings 9999 ...`; warnings are existing unsafe-typing warnings plus ignored raw widget assets.
- `npm run build` passed with existing Vite empty-chunk/dynamic-import warnings only.
- Rebuilt the graph with `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`; output updated `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` with the existing invalid-file-type extraction warning.
- Code/test competitor-reference scan over the touched implementation files returned no matches for banned competitor identifiers.

### 2026-05-26 08:16 IST - PPB Default Products direct-contract slice started
- Re-read `internal docs/EB Implementation Reference.md` and the complete configure audit before implementing: the proved payload uses direct `defaultProductsData.isDefaultProductsEnabled`, `defaultProductsTitle`, and `products[].{productId, graphqlId, handle, title, variants[].variantGraphqlId, requiredQuantity}`.
- Evidence screenshots/runtime for this row are `ppb-admin-bundle-settings-preselected-default-followup.png`, `ppb-admin-bundle-settings-preselected-enabled-followup.png`, `network-3716-ppb-bundle-settings-preselected-save-followup.network-request`, `ppb-storefront-runtime-preselected-product-followup.json`, `ppb-storefront-desktop-preselected-product-followup.png`, and `ppb-storefront-mobile-preselected-product-followup.png`.
- Current WPB code still builds default products from active-step `StepProduct`/`isDefault`, which is not the direct persisted contract and risks mutating the selectable step products.
- Next edit: add RED tests for direct resource-picker serialization and direct Product Page widget preselection/rendering, then patch Admin state and storefront runtime without adding legacy fallback behavior.

### 2026-05-26 08:40 IST - PPB Default Products cart proof gap found
- Captured Admin enabled-state proof at `/private/tmp/wpb-ppb-bundle-settings-preselected-enabled-1280-2026-05-26.png`, save request/response at `/private/tmp/wpb-ppb-bundle-settings-preselected-save-2026-05-26.request.network-request` and `/private/tmp/wpb-ppb-bundle-settings-preselected-save-2026-05-26.response.network-response`, and persisted reload proof at `/private/tmp/wpb-ppb-bundle-settings-preselected-persisted-reload-1280-2026-05-26.png`.
- Captured desktop storefront proof at `/private/tmp/wpb-ppb-storefront-desktop-preselected-product-2026-05-26.png` and runtime config proof at `/private/tmp/wpb-ppb-storefront-runtime-preselected-product-config-2026-05-26.json`; the title and preselected line render.
- Cart proof failed: `/private/tmp/wpb-ppb-storefront-cart-preselected-product-2026-05-26.json` stayed empty, and the page toast reported the default product as unavailable because the widget inferred direct default availability from `inventoryQuantity: 0`.
- Evidence mismatch: the reference default-products payload itself stores `inventoryQuantity: 0` for the selected default variant, so direct default products cannot be marked unavailable solely from zero inventory quantity.
- Next edit: add RED tests for one-variant direct default serialization and explicit-availability-only widget handling, then patch the helper and Product Page widget before re-saving and re-capturing cart proof.

### 2026-05-26 08:54 IST - PPB Default Products proof completed
- Patched the direct default-products picker serializer and Product Page widget availability handling so the selected direct default variant is explicit-availability based and does not treat `inventoryQuantity: 0` as unavailable.
- Re-saved Product Page Bundle Settings after the fix and captured request/response proof at `/private/tmp/wpb-ppb-bundle-settings-preselected-save-after-direct-default-fix-2026-05-26.request.network-request` and `/private/tmp/wpb-ppb-bundle-settings-preselected-save-after-direct-default-fix-2026-05-26.response.network-response`; the response stores selected variant `48191691456771`.
- Captured desktop runtime/proof at `/private/tmp/wpb-ppb-storefront-runtime-preselected-product-after-direct-default-fix-2026-05-26.json`, `/private/tmp/wpb-ppb-storefront-desktop-preselected-product-after-direct-default-fix-2026-05-26.png`, and `/private/tmp/wpb-ppb-storefront-desktop-preselected-product-after-direct-default-fix-2026-05-26.txt`.
- Captured cart proof at `/private/tmp/wpb-ppb-storefront-cart-preselected-product-after-direct-default-fix-2026-05-26.json` and screenshot `/private/tmp/wpb-ppb-storefront-cart-preselected-product-after-direct-default-fix-2026-05-26.png`; `/cart.js` now has one bundle line and public line properties include the selected default variant text and Retail Price.
- Captured mobile runtime/proof at `/private/tmp/wpb-ppb-storefront-mobile-runtime-preselected-product-after-direct-default-fix-2026-05-26.json`, `/private/tmp/wpb-ppb-storefront-mobile-preselected-product-after-direct-default-fix-2026-05-26.png`, and `/private/tmp/wpb-ppb-storefront-mobile-preselected-product-after-direct-default-fix-2026-05-26.txt`.
- Updated the evidence manifest `ppb-default-products` row to green because Admin UI, direct save response, runtime config, desktop/mobile rendering, and cart behavior are now proved.

### 2026-05-26 08:56 IST - PPB Default Products verification passed
- Focused Jest passed: `npx jest tests/unit/lib/default-products-contract.test.ts tests/unit/routes/ppb-bundle-settings.test.ts tests/unit/assets/bundle-widget-product-page-products.test.ts tests/unit/routes/ppb-save-bundle.test.ts tests/unit/services/bundle-product-metafield.test.ts tests/unit/assets/condition-validator.test.ts tests/unit/routes/discount-pricing-ui-contract.test.ts --runInBand` with 7 suites and 163 tests.
- Modified-file ESLint passed with 0 errors using `npx eslint --max-warnings 9999 ...`; warnings remain within the accepted project warning budget.
- `npm run build`, `npm run build:widgets`, and `npm run minify:assets css` passed.
- Rebuilt the graph with `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`; output updated `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` with the existing invalid-file-type extraction warning.
- Exact code/test competitor-reference scan returned no matches for `eb`, `skai`, `skailama`, or `easybundles`.

### 2026-05-26 08:57 IST - PPB Bundle Summary Text slice started
- Re-read the PPB Bundle Settings audit and reference contract before starting: the evidenced direct text shape is `bundleTextConfig.bundleSummary.title` plus `bundleTextConfig.bundleSummary.subTitle`.
- Current row status in the evidence manifest is partial: parser, save serialization, DB/metafield path, and runtime formatter have unit coverage, but WPB Admin save, runtime JSON, desktop proof, and mobile proof still need live evidence.
- Next step: capture the current Admin field state, save a distinct summary title/subtitle through embedded Admin, inspect the network response and storefront runtime, then patch only if the direct contract or visible behavior diverges.

### 2026-05-26 09:01 IST - PPB Bundle Summary Text evidence-limited
- Re-opened the live EB Product Page Bundle Settings page and captured `/private/tmp/eb-ppb-bundle-settings-no-summary-text-live-2026-05-26.png` plus `/private/tmp/eb-ppb-bundle-settings-no-summary-text-live-2026-05-26.txt`.
- The live EB PPB Bundle Settings screen shows Pre Selected Product, Quantity Validation, Pre-order & Subscription Integration, Cart line item discount display, Bundle Level CSS, and Bundle Status; it does not expose Bundle Cart Title or Bundle Cart Subtitle controls.
- Checked the captured PPB save proof files `network-3620-ppb-bundle-settings-quantity-validation-save.*` and `network-3716-ppb-bundle-settings-preselected-save-followup.*`; they do not contain `bundleTextConfig`.
- Updated the evidence manifest `ppb-bundle-summary-text` row to blocked/evidence-limited. No new Admin UI or storefront behavior should be built for PPB summary text until fresh proof shows an actual PPB control/save/runtime path.

### 2026-05-26 09:02 IST - PPB Global Cart Messaging slice started
- Re-read the global Edit Defaults evidence: Bundle Items maps to `bundleCartLineMessaging.showBundleContains`, Original Bundle Price maps to `showOriginalPrice`, and Discount Display maps to `discountDisplay.isEnabled` with the Discount format dropdown gated by that switch.
- Current manifest rows `ppb-global-cart-items`, `ppb-global-retail-price`, and `ppb-global-you-save` have implementation and cart proof inventory, but live WPB DCP save proof is still open.
- Next step: re-test the Product Page Layout Cart Messaging DCP view in Chrome, capture Admin/save proof, then add cart proof for off/on states or patch with tests if persistence/runtime diverges.

### 2026-05-26 09:12 IST - PPB Global Cart Messaging save-bar gap patched locally
- Reproduced the live DCP blocker: Bundle Items, Original Bundle Price, and Discount Display switches changed visual state, but the Additional Configurations save footer never appeared, so no live save/network proof could be captured.
- Added RED-to-green coverage in `tests/unit/routes/design-settings-cart-messaging.test.ts` for React-handled switch buttons and replaced the hidden native checkbox implementation in `CartLineMessagingSettings.tsx` with semantic `button role="switch"` controls.
- The Shopify dev session crashed while updating the dev preview, and restart is currently blocked by invalid Shopify CLI credentials in this non-interactive terminal; live Chrome proof must resume after an interactive dev-session restart.
- Next edit before retrying Chrome: add a focused dirty-state comparator test so nested `bundleCartLineMessaging` changes are tracked without false positives for deep-equal values.

### 2026-05-26 09:16 IST - PPB Global Cart Messaging local verification passed
- Added `tests/unit/lib/design-control-panel-dirty.test.ts` and patched `useDesignControlPanelState.ts` to deep-compare object settings while preserving the existing `productCardsPerRow` and `customCss` normalization.
- Focused Jest passed: `npx jest tests/unit/routes/design-settings-cart-messaging.test.ts tests/unit/lib/design-control-panel-dirty.test.ts tests/unit/services/cart-transform-service.test.ts tests/unit/lib/bundle-config-contracts.test.ts --runInBand` with 4 suites and 43 tests.
- Modified TS/TSX ESLint passed with 0 errors using `npx eslint --max-warnings 9999 ...`; the CSS module is intentionally not passed to this TS parser and is covered by `npm run build`.
- `npm run build` passed with the existing Vite empty-chunk/dynamic-import warnings only.
- Rebuilt the graph with `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`; output updated `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` with the existing invalid-file-type extraction warning.
- Exact code/test competitor-reference scan returned no matches for `eb`, `skai`, `skailama`, or `easybundles`.
- Live DCP save/network proof remains blocked until Shopify CLI authentication completes; the active interactive CLI login prompt is showing verification code `GGDS-GNZJ`.

### 2026-05-26 09:20 IST - PPB Global Cart Messaging post-cleanup verification repeated
- Re-ran the focused dirty-state and switch contract tests after the final type cleanup: `npx jest tests/unit/lib/design-control-panel-dirty.test.ts tests/unit/routes/design-settings-cart-messaging.test.ts --runInBand` passed with 2 suites and 8 tests.
- Re-ran the broader cart messaging contract set: `npx jest tests/unit/routes/design-settings-cart-messaging.test.ts tests/unit/lib/design-control-panel-dirty.test.ts tests/unit/services/cart-transform-service.test.ts tests/unit/lib/bundle-config-contracts.test.ts --runInBand` passed with 4 suites and 43 tests.
- Re-ran modified-file ESLint with 0 errors and accepted warnings, then re-ran `npm run build` successfully with the same pre-existing Vite warnings.
- Rebuilt the graph again after the local cleanup; `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` were regenerated with the same existing invalid-file-type extraction warning.
- Shopify CLI is still waiting for the interactive login flow, so manifest rows `ppb-global-cart-items`, `ppb-global-retail-price`, and `ppb-global-you-save` remain partial until live save, runtime, and cart proof can be captured.

### 2026-05-26 09:22 IST - FPB template evidence conflict found
- Compared the FPB template rows in the primary audit against `internal docs/EB Implementation Reference.md` while waiting for Shopify CLI authentication.
- Raw save payload proof `network-2476-template-standard-update.network-request` confirms FPB Standard saves `bundleDesignPresetId: "DEFAULT"` with `bundleDesignTemplate: "FBP_SIDE_FOOTER"`.
- Next edit: correct the reference doc's FPB Standard row and runtime body-attribute note from `STANDARD` to `DEFAULT`, keeping implementation aligned with the primary audit and rewrite plan.

### 2026-05-26 09:23 IST - FPB template reference corrected
- Updated `internal docs/EB Implementation Reference.md` so the FPB Standard template row and body-attribute note use `DEFAULT`.
- Verified the corrected reference section now matches the primary audit, raw save payload proof, evidence manifest, and local `mapTemplateSelection` contract.
- Next edit: update the older `test-spec/select-template.spec.md` so its FPB Standard parser case also uses the evidenced `DEFAULT` preset rather than the stale `STANDARD` value.

### 2026-05-26 09:24 IST - FPB template local contract verification passed
- Updated `test-spec/select-template.spec.md` so FPB Standard uses the evidenced `DEFAULT` preset.
- Template contract Jest passed: `npx jest tests/unit/routes/select-template.test.ts tests/unit/lib/bundle-config-contracts.test.ts tests/unit/lib/bundle-formatter.test.ts --runInBand` with 3 suites and 49 tests.
- The local FPB template mapping, parser, route constant, and widget formatter now align with `FBP_SIDE_FOOTER + DEFAULT|CLASSIC|COMPACT|HORIZONTAL`; live WPB Admin/save/runtime/desktop/mobile proof is still required before any template row can be green.
- Shopify CLI auth expired once and was restarted; the active interactive login code is now `MFBW-MFLG`.
- Next edit: update the FPB template manifest rows from planned to partial where the local contract is implemented but live proof remains open.

### 2026-05-26 09:25 IST - FPB template manifest rows normalized
- Updated `docs/eb-ui-clone-rewrite/evidence-manifest.md` so Classic, Compact, and Horizontal are `partial` rather than `planned`, matching the current local contract implementation.
- Kept all four FPB template rows blocked from green because WPB Admin screenshot, save proof, runtime JSON, desktop screenshot, and mobile screenshot still need Chrome capture.

### 2026-05-26 09:27 IST - Step/category contract evidence conflict found
- Compared `internal docs/EB Implementation Reference.md` FPB category examples against raw `network-806-saveMultipleCategoriesData.request.network-request`.
- Raw FPB save proof uses category `products`, `collectionsData`, `collectionsSelectedData`, `categoryBanner`, `subTitle`, `conditions`, `autoNextStepOnConditionMet`, and `multiLangData`; the older simplified reference snippet still described `selectedProducts` and `selectedCollections`.
- Next edit: correct the FPB reference snippet and update category contract tests/helpers so the local contract preserves the raw category-first payload fields for FPB and PPB.

### 2026-05-26 09:32 IST - Step/category contract advisor guidance applied
- Advisor review confirmed the Admin-save category helper must preserve hydrated picker objects and must not use a mutually exclusive `source` contract for PPB, because raw PPB proof has `products` and `collectionsSelectedData` populated in the same category.
- Corrected the FPB and PPB step/category reference snippets to describe hydrated Admin save payloads rather than the old ID-only simplification.
- Added RED category-contract tests against the raw field inventory; the first run failed as expected because the helper still emitted `categoryType`/`selectedCollections` and dropped hydrated arrays.
- Next edit: remove `source`-based exclusivity from the Admin-save category helper, accept direct hydrated arrays, and update the DB alignment note so Admin save parity stays separate from storefront DTO normalization.

### 2026-05-26 09:33 IST - Step/category contract helper green
- Patched `app/lib/bundle-config/category-contracts.ts` so Admin-save category contracts preserve hydrated `products`, `collectionsData`, `collectionsSelectedData`, `selectedProducts`, `conditions`, subtitle/banner fields, `multiLangData`, and PPB category display flags.
- Removed `source`-based exclusivity from the helper; callers now pass the exact arrays intended for the Admin save payload.
- Updated `internal docs/EB Implementation Reference.md` DB alignment notes to distinguish hydrated Admin save parity from any later DB/storefront normalization.
- Focused Jest passed: `npx jest tests/unit/lib/bundle-config-contracts.test.ts --runInBand` with 22 tests.
- Shopify CLI authentication is still pending on code `MFBW-MFLG`, so live Admin/storefront evidence remains gated.

### 2026-05-26 09:35 IST - Step/category verification broadened
- Broader local contracts passed: `npx jest tests/unit/lib/bundle-config-contracts.test.ts tests/unit/routes/select-template.test.ts tests/unit/lib/bundle-formatter.test.ts tests/unit/lib/design-control-panel-dirty.test.ts tests/unit/routes/design-settings-cart-messaging.test.ts tests/unit/services/cart-transform-service.test.ts --runInBand` with 6 suites and 70 tests.
- Modified-file ESLint passed with 0 errors using `npx eslint --max-warnings 9999 ...`; warnings remain accepted project warnings in existing hook/test code.
- `npm run build` passed with existing Vite empty-chunk/dynamic-import warnings only.
- Rebuilt graph outputs with `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`; output reported 3502 nodes, 4846 edges, 536 communities and the existing invalid-file-type warning.
- The previous Shopify CLI code expired; a fresh interactive dev session is now waiting on verification code `ZBVN-DKVH`.

### 2026-05-26 09:37 IST - Step/category persistence slice started
- Inspected the FPB and PPB save handlers and Prisma `StepCategory` model after the Admin-save contract helper turned green.
- Current DB writes only preserve `name`, `sortOrder`, `products`, and `collections`, which drops evidenced category title/subtitle, banner, conditions, selected collection data, language data, category rank, and PPB variant/swatch flags before metafield/runtime formatting.
- Next edit: add RED route tests for hydrated category persistence, extend the `StepCategory` schema with direct fields, and patch both configure save handlers to write the exact Admin-save category fields without source exclusivity.

### 2026-05-26 09:44 IST - Step/category persistence and runtime contracts green
- Added RED-to-green route coverage in `tests/unit/routes/fpb-save-bundle.test.ts` and `tests/unit/routes/ppb-save-bundle.test.ts` for hydrated category persistence, including stable category IDs, title/subtitle, conditions, banner/image, selected collection data, language data, category rank, and PPB variant/swatch flags.
- Extended `StepCategory` in `prisma/schema.prisma` and added migration `prisma/migrations/20260526093700_extend_step_category_contract/migration.sql` with direct fields for the evidenced category contract.
- Added shared helpers `category-persistence.ts` and `category-runtime.ts`, wired both configure save handlers, the FPB page-metafield step formatter, the product-page sync formatter, `formatBundleForWidget`, and `bundle_ui_config` generation to preserve category fields.
- Verification passed: `npx prisma generate`; route/runtime/metafield Jest (`5 suites`, `65 tests`); modified-file ESLint with 0 errors; `npm run build`; graph rebuild with 3516 nodes, 4868 edges, and the existing invalid-file-type warning.
- Banned competitor-reference scan over touched code/test/schema files returned no matches.
- Live Chrome proof remains gated on Shopify CLI authentication; the active code is still `ZBVN-DKVH` and has not produced a dev preview URL yet.

### 2026-05-26 09:45 IST - Step/category manifest updated
- Updated `docs/eb-ui-clone-rewrite/evidence-manifest.md` rows `fpb-step-setup` and `ppb-step-setup` to reflect local contract, DB persistence, and runtime/metafield serialization progress.
- Kept both rows `partial` because live WPB Admin screenshot, save/network proof, runtime JSON, desktop screenshot, and mobile screenshot are still required before green.
- The `ZBVN-DKVH` Shopify CLI auth code expired without a dev preview URL; no live proof was captured.

### 2026-05-26 09:47 IST - Category storefront hydration gap found
- Inspected FPB and PPB widget product-loading paths after category runtime serialization was added.
- The Product Page widget loads `step.products` and `step.collections`, but not category-level collection handles; the captured PPB raw save can carry `collectionsSelectedData` inside a category while `step.collections` is empty.
- The Full Page widget likewise derives collection tabs and collection product fetches from `step.collections`, so category-level collection payloads can be ignored after the new runtime serializer preserves them.
- Next edit: add focused widget source-contract coverage and patch both widget loaders to collect product IDs and collection handles from `step.categories` without changing the FPB config-load priority order.

### 2026-05-26 09:55 IST - Category storefront hydration local contract green
- Added focused widget source-contract coverage for Product Page and Full Page category hydration, including the FPB config-load priority invariant.
- Patched both widget loaders to collect product IDs and collection handles from `step.categories`, including `collectionsData` and `collectionsSelectedData`; the Full Page widget now also builds/filter category tabs from category entries when present.
- Verification passed: focused asset Jest (`2 suites`, `6 tests`), broader category/runtime suite (`8 suites`, `93 tests`), raw widget syntax checks, test-file ESLint with 0 errors, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, graph rebuild with 3527 nodes and 4890 edges, `git diff --check`, and a precise banned-reference scan over touched code/test paths.
- Normal ESLint ignores raw widget files; `--no-ignore` cannot lint them because they are outside the configured TypeScript project, so raw widget validation used `node --check` and the widget bundler.
- Manifest rows stay `partial`: local widget hydration is implemented, but live WPB runtime JSON, desktop screenshot, mobile screenshot, and any cart proof remain blocked until a Shopify dev preview can be authenticated.

### 2026-05-26 09:58 IST - Category runtime no-shim cleanup started
- Review found the prior category runtime patch still flattened `StepCategory.products` and `StepCategory.collections` into top-level step `products`/`collections` in formatter and sync paths.
- That flattening conflicts with the no-backwards-compatibility rule and is no longer needed because the widget loaders now consume `step.categories` directly.
- Next edit: add RED assertions that category-backed data stays under `categories`, then remove the top-level flattening from formatter, Product Page sync config, bundle UI config, and FPB page-metafield step serialization while preserving component-metafield category handling.

### 2026-05-26 10:03 IST - Category runtime no-shim cleanup green
- Added RED-to-green assertions that category-backed products and collections remain under category payloads instead of being copied into top-level step `products`/`collections`.
- Removed category flattening from `formatBundleForWidget`, Product Page Sync Product config, product-page `bundle_ui_config`, and FPB standard/page config construction; component metafield paths still read `StepCategory` directly for cart-transform metadata.
- Verification passed: category/runtime Jest (`9 suites`, `105 tests`), modified-file ESLint with 0 errors and existing warnings, `npm run build`, graph rebuild with 3527 nodes and 4890 edges, precise banned-reference scan, and `git diff --check`.
- The Shopify CLI dev preview is still waiting on auth code `QBSM-QMRG`; no new live proof has been captured.

### 2026-05-26 10:05 IST - FPB bundle summary direct contract started
- The FPB Bundle Settings UI already has Bundle Cart Title and Bundle Cart Subtitle controls, while the evidence reference says FPB persists these as direct `bundleTextConfig.bundleSummary.{title,subTitle}`.
- Current FPB save still sends/stores those values only through generic `textOverrides`, and the Full Page widget hardcodes the subtitle instead of reading the direct contract.

### 2026-05-26 10:11 IST - FPB bundle summary direct contract local verification passed
- Added RED-to-green coverage for the FPB save route direct `bundleTextConfig.bundleSummary` payload, DB persistence, metafield sync handoff, and Full Page widget summary text lookup.
- Wired FPB Admin save to append the direct `bundleTextConfig` JSON from Bundle Cart Title/Subtitle, persist it on the bundle, include it in the FPB base metafield config, and render the Full Page summary title/subtitle from that direct contract.
- Verification passed: focused FPB summary Jest, broader category/runtime/direct-contract Jest, raw widget syntax check, TS/TSX ESLint with 0 errors, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, graph rebuild, `git diff --check`, and a precise code/test competitor-reference scan.
- Live WPB Admin save/runtime/desktop/mobile/cart proof remains blocked because the Shopify CLI dev preview authentication code expired before a preview URL was issued.

### 2026-05-26 10:19 IST - FPB live summary save exposes metafield size blocker
- Restarted the Shopify SIT dev preview successfully on `--theme-app-extension-port 9294`; active app URL is `https://collectible-programme-created-myspace.trycloudflare.com`.
- Captured Admin unsaved-state proof with direct Bundle Cart Title/Subtitle values at `/private/tmp/wpb-fpb-bundle-summary-admin-unsaved-2026-05-26.png`.
- Captured failed save request/response at `/private/tmp/wpb-fpb-bundle-summary-save-pending.request.network-request` and `/private/tmp/wpb-fpb-bundle-summary-save-pending.response.network-response`; the request includes direct `bundleTextConfig.bundleSummary`, but the response is `500` because `bundle_ui_config` is `125671` bytes and exceeds Shopify's 64KB metafield limit.
- Next edit: add RED coverage that runtime category serialization compacts hydrated Admin product payloads to product references for metafields, then patch the category runtime helper and retry the FPB summary save.
- Next edit: add RED tests for FPB Admin save payload, DB/metafield propagation, and Full Page widget source consumption of `bundleTextConfig`, then wire only the direct contract without reading old text override keys as a fallback.

### 2026-05-26 10:28 IST - FPB app-proxy category runtime gap found
- Retried the FPB Bundle Cart Title/Subtitle save after compacting category runtime serialization; the completed request at `/private/tmp/wpb-fpb-bundle-summary-save-after-category-compact.request.network-request` returned `200` at `/private/tmp/wpb-fpb-bundle-summary-save-after-category-compact.response.network-response`.
- Verified the app-proxy page at `/apps/product-bundles/wpb/cmpfhj2m10000v0t038osl42y` injects a compact `data-bundle-config` with direct `bundleTextConfig.bundleSummary` and no hydrated `variants` or `images`.
- Live storefront DOM still cannot prove the summary title/subtitle because the public FPB proxy route loads only `StepProduct` and omits `StepCategory`, so category-backed products are missing from the rendered widget.
- Next edit: add RED proxy-route coverage that the public FPB app-proxy loader includes ordered `StepCategory` records, then patch the loader and recapture desktop/mobile storefront proof.

### 2026-05-26 10:30 IST - FPB storefront product fetch path gap found
- Patched the public FPB proxy loader locally to include ordered `StepCategory` rows and verified the live app-proxy `data-bundle-config` now has one category with five compact product references.
- The storefront still renders empty because Full Page widget hydration requests `https://agent-5sfidg3m.myshopify.com/api/storefront-products`, which returns `404`; the app-proxy path must be `/apps/product-bundles/api/storefront-products`.
- Next edit: add RED widget source-contract coverage for the Full Page storefront product/collection API base, patch the widget source without changing config-load order, rebuild widget assets, and retry desktop/mobile proof.

### 2026-05-26 10:37 IST - FPB category app-proxy and summary runtime proof captured
- Added RED-to-green proxy-route coverage that the public FPB app-proxy loader includes ordered `StepCategory` rows, then patched `app/routes/root/wpb.$bundleId.tsx`.
- Added RED-to-green Full Page widget coverage for the storefront app-proxy API base, patched `app/assets/bundle-widget-full-page.js`, and rebuilt widget bundles with `npm run build:widgets`.
- Captured clean persisted Admin proof for FPB Bundle Cart Title/Subtitle at `/private/tmp/wpb-fpb-bundle-summary-admin-persisted-clean-2026-05-26.png`.
- Captured runtime proof at `/private/tmp/wpb-fpb-runtime-summary-category-2026-05-26.json`: direct `bundleTextConfig.bundleSummary` has the `1028` values, app-proxy `data-bundle-config` is compact, category count is `1`, category product references are `5`, product cards rendered are `96`, and the product API path uses `/apps/product-bundles/api/storefront-products`.
- Captured storefront screenshots at `/private/tmp/wpb-fpb-category-runtime-desktop-2026-05-26.png` and `/private/tmp/wpb-fpb-category-runtime-mobile-2026-05-26.png`.
- Cart proof remains blocked on this live bundle because the currently selected category products report zero available quantity, so the widget refuses selection before Add to Cart.

### 2026-05-26 11:01 IST - FPB summary/category verification checkpoint
- Completed the required post-patch hygiene loop after graph rebuild: `git diff --check` passed after generated `GRAPH_REPORT.md` trailing-space cleanup.
- Precise banned-reference scan over touched application/test paths returned no code/test matches.
- Focused and broad verification already passed for this slice: FPB proxy route/category runtime/widget summary/product API base Jest, raw widget syntax check, modified-file ESLint with 0 errors, `npm run build:widgets`, `npm run minify:assets css`, and `npm run build`.
- Remaining live proof gaps for these rows: selectable-inventory cart proof and visible side-footer/mobile-sheet summary text proof. Next loop should use Admin/storefront flows to select inventory-backed products or a suitable template state rather than modifying data out of band.

### 2026-05-26 11:12 IST - FPB stocked-product cart proof captured
- Added a stocked Shopify product to the Full Page Step Setup category through the Admin picker and captured persisted Admin/save proof plus desktop/mobile storefront proof.
- Cart add now succeeds with `The Complete Snowboard - Ice`; `/cart.js` proof shows one cart line with compact private bundle display properties.
- Remaining mismatch selected for the next patch: Full Page cart lines need public display properties for the bundle item list and retail price in addition to the compact private source payload.

### 2026-05-26 11:15 IST - FPB cart display properties patched and proved
- Added RED widget source-contract coverage for Full Page cart display properties, then patched the Full Page cart payload to keep `_bundle_display_properties` while adding public `Box`, `Items`, `Retail Price`, and discounted `You Save` when present.
- Rebuilt widget bundles and reran the live stocked-product cart path; `/private/tmp/wpb-fpb-cart-json-stock-product-public-props-2026-05-26.json` now proves public `Box`, `Items`, and `Retail Price` on the cart line.
- Updated the evidence manifest with Admin/save/runtime/desktop/mobile/cart proof paths for the FPB Step Setup stocked-product loop.

### 2026-05-26 11:17 IST - FPB cart display slice verified
- Verification passed: `npx jest tests/unit/assets/bundle-widget-full-page-cart-properties.test.ts tests/unit/assets/bundle-widget-full-page-category-hydration.test.ts tests/unit/assets/bundle-widget-full-page-bundle-text.test.ts --runInBand`.
- Raw widget syntax passed: `node --check app/assets/bundle-widget-full-page.js`; modified test-file ESLint passed with 0 errors.
- Build and generated assets passed: `npm run build:widgets` and `npm run build`; graph rebuild completed with 3541 nodes and 4909 edges, then `git diff --check` passed after generated report whitespace cleanup.
- Precise modified-code competitor-reference scan found no matches.

### 2026-05-26 11:21 IST - FPB template side-footer runtime gap found
- Live Select Template proof captured Standard save at `/private/tmp/wpb-fpb-template-standard-save-2026-05-26.request.network-request` and response `/private/tmp/wpb-fpb-template-standard-save-2026-05-26.response.network-response`.
- DB proof shows `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "DEFAULT"` persisted, while `fullPageLayout` remains `footer_bottom`.
- Storefront runtime proof `/private/tmp/wpb-fpb-runtime-standard-template-before-layout-fix-2026-05-26.json` shows the template fields are present but the widget still renders footer-bottom, so the Bundle Summary title/subtitle remain hidden.
- Next edit: make the Full Page widget honor the evidence-backed `FBP_SIDE_FOOTER` template as the side-footer layout instead of relying on the separate `fullPageLayout` field.

### 2026-05-26 11:25 IST - FPB Bundle Summary row green
- Added RED-to-green widget source-contract coverage for `FBP_SIDE_FOOTER` resolving to the side-footer layout.
- Patched the Full Page widget layout resolver and rebuilt widget bundles.
- Live desktop proof `/private/tmp/wpb-fpb-runtime-standard-template-after-layout-fix-desktop-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-template-summary-desktop-after-layout-fix-2026-05-26.png` shows `FBP_SIDE_FOOTER + DEFAULT`, sidebar rendering, and visible saved summary title/subtitle.
- Live mobile proof `/private/tmp/wpb-fpb-runtime-standard-template-after-layout-fix-mobile-2026-05-26.json`, `/private/tmp/wpb-fpb-standard-template-summary-mobile-after-layout-fix-2026-05-26.png`, and element rectangle proof shows the mobile sheet renders the saved summary title/subtitle.
- Updated the evidence manifest: `fpb-bundle-summary-text` is now green.

### 2026-05-26 11:28 IST - FPB cart/template verification checkpoint
- Final hygiene passed after the side-footer and cart-display-property patches: `git diff --check` is clean after generated graph report whitespace cleanup.
- Precise banned-reference scan over the touched Full Page widget source and new widget tests returned no matches.
- Combined focused verification already passed for the slice: Full Page template-layout, cart-properties, category-hydration, and bundle-text Jest; raw widget syntax check; modified-test ESLint; `npm run build:widgets`; `npm run build`; and graph rebuild.
- Next: continue template evidence rows by capturing/recording Select Template Admin proof for Standard and then repeat the save/runtime/desktop/mobile loop for Classic, Compact, and Horizontal without marking rows green early.

### 2026-05-26 11:31 IST - FPB Standard template row green
- Captured the missing WPB Select Template Admin selected-state proof at `/private/tmp/wpb-fpb-template-standard-admin-selected-2026-05-26.png`.
- Updated the evidence manifest row for `fpb-template-standard` to green using the already captured save payload/response, DB proof, desktop runtime/screenshot, and mobile runtime/screenshot.
- Next: run the same proof loop for Classic, Compact, and Horizontal templates, starting from the live Select Template modal and saving one template at a time.

### 2026-05-26 11:37 IST - FPB Classic template row green
- Captured WPB Classic selected-state proof at `/private/tmp/wpb-fpb-template-classic-admin-selected-2026-05-26.png`.
- Captured Classic save proof at `/private/tmp/wpb-fpb-template-classic-save-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-template-classic-save-2026-05-26.response.network-response`; request body submits `bundleDesignTemplate=FBP_SIDE_FOOTER&bundleDesignPresetId=CLASSIC`.
- Confirmed the remote dev DB persisted `FBP_SIDE_FOOTER + CLASSIC`, then captured desktop runtime/screenshot and mobile runtime/screenshot proof for the public FPB page.
- Updated the evidence manifest row for `fpb-template-classic` to green. Next: repeat for Compact.

### 2026-05-26 11:49 IST - FPB Compact template row green
- Captured WPB Compact selected-state proof at `/private/tmp/wpb-fpb-template-compact-admin-selected-2026-05-26.png`.
- Captured Compact save proof at `/private/tmp/wpb-fpb-template-compact-save-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-template-compact-save-2026-05-26.response.network-response`; request body submits `bundleDesignTemplate=FBP_SIDE_FOOTER&bundleDesignPresetId=COMPACT`.
- Confirmed the remote dev DB persisted `FBP_SIDE_FOOTER + COMPACT`, then captured desktop runtime/screenshot and mobile runtime/screenshot proof for the public FPB page.
- Updated the evidence manifest row for `fpb-template-compact` to green. Next: repeat for Horizontal.

### 2026-05-26 11:59 IST - FPB Horizontal storefront gap found
- Captured WPB Horizontal Admin selected-state proof at `/private/tmp/wpb-fpb-template-horizontal-admin-selected-2026-05-26.png`.
- Captured Horizontal save proof at `/private/tmp/wpb-fpb-template-horizontal-save-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-template-horizontal-save-2026-05-26.response.network-response`; request body submits `bundleDesignTemplate=FBP_SIDE_FOOTER&bundleDesignPresetId=HORIZONTAL`.
- Confirmed the remote dev DB persisted `FBP_SIDE_FOOTER + HORIZONTAL`.
- Storefront desktop runtime `/private/tmp/wpb-fpb-runtime-horizontal-template-desktop-2026-05-26.json` proves the preset reaches runtime, but the DOM/screenshot still use the generic side-panel grid instead of the evidenced Horizontal preset card/body split.
- Next edit: add a neutral FPB design-preset marker to the runtime DOM and CSS rules for Horizontal two-column product cards, two-column product grid, 65/35 content/sidebar split, and stacked side-panel action layout.

### 2026-05-26 12:09 IST - FPB Horizontal CTA/card mismatch selected
- Captured post-patch Horizontal desktop proof at `/private/tmp/wpb-fpb-runtime-horizontal-template-after-layout-fix-desktop-2026-05-26.json`, `/private/tmp/wpb-fpb-template-horizontal-desktop-after-layout-fix-2026-05-26.png`, and top viewport `/private/tmp/wpb-fpb-template-horizontal-desktop-after-layout-fix-top-2026-05-26.png`.
- Captured post-patch Horizontal mobile proof at `/private/tmp/wpb-fpb-runtime-horizontal-template-after-layout-fix-mobile-2026-05-26.json` and `/private/tmp/wpb-fpb-template-horizontal-mobile-after-layout-fix-2026-05-26.png`.
- Runtime now proves `data-fpb-design-preset="HORIZONTAL"`, 65/35 desktop content/sidebar columns, two-column desktop product grid, one-column mobile grid, and horizontal product cards.
- Remaining visible mismatch selected for the next RED-to-green patch: FPB product cards still show circular `+` buttons and overly tall Horizontal mobile cards instead of the evidenced rectangular `Add To Box` button and compact horizontal card height.

### 2026-05-26 12:22 IST - FPB Horizontal card CTA patched and proved
- Added RED-to-green source-contract coverage for the Full Page product-card CTA label and Horizontal mobile compact-card CSS.
- Patched the Full Page widget to pass the evidenced product-card CTA label into the shared card generator, while the shared generator keeps `+` as the default for callers that do not opt in.
- Patched side-footer product-card CSS so FPB cards use rectangular text CTAs and Horizontal mobile cards use a shorter image-left/text-right layout.
- Rebuilt widget bundles and minified CSS; full-page CSS remains under the Shopify asset limit at 90.8 KB minified.
- Captured desktop proof `/private/tmp/wpb-fpb-runtime-horizontal-template-after-card-fix-desktop-2026-05-26.json` and `/private/tmp/wpb-fpb-template-horizontal-desktop-after-card-fix-2026-05-26.png`; captured mobile proof `/private/tmp/wpb-fpb-runtime-horizontal-template-after-card-fix-mobile-2026-05-26.json` and `/private/tmp/wpb-fpb-template-horizontal-mobile-after-card-fix-2026-05-26.png`.
- Updated the Horizontal manifest row but kept status `partial`: the card/layout slice is proven, while full green status still requires recreating the same multi-category/add-ons/box-selection/progress evidence config and clearing the remaining pixel mismatches.

### 2026-05-26 12:26 IST - FPB Horizontal card CTA slice verified
- Verification passed: `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/bundle-widget-full-page-cart-properties.test.ts tests/unit/assets/bundle-widget-full-page-category-hydration.test.ts tests/unit/assets/bundle-widget-full-page-bundle-text.test.ts --runInBand`.
- Raw JS syntax passed for `app/assets/bundle-widget-full-page.js` and `app/assets/widgets/shared/component-generator.js`.
- Modified-file ESLint passed with 0 errors; warnings were only ignored asset files plus the source-contract test string warning.
- Build verification passed: `npm run build:widgets`, `npm run minify:assets css`, and `npm run build`.
- Graph rebuild passed via the pipx graphify Python environment after the default `python3` lacked the `graphify` module; `git diff --check` passed after generated report whitespace cleanup.
- Precise banned-reference scan over touched code/test paths returned no matches.

### 2026-05-26 12:32 IST - FPB Add-ons contract slice started
- Re-read the Add-ons evidence in `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md`, the captured `savePersonalization` request, runtime JSON, and the Add-ons help overlay screenshot.
- Confirmed the observed scope for this slice: `personalizationData.isPersonalizationEnabled`, `addonProducts.isEnabled`, multi-tier selected add-on products, bundle-value eligibility, discount type/value, and eligible/ineligible add-on messages. Email/message-product behavior remains out of scope.
- Current WPB code has a step-based free-gift/add-on model, but the evidence row requires the direct `personalizationData.addonProducts` runtime contract to survive Admin save, metafield serialization, and storefront rendering.
- Next edit: add RED tests for the direct personalization/add-on contract and patch only the parser/metafield/widget bridge needed to expose that evidence-shaped contract on FPB runtime.

### 2026-05-26 13:11 IST - FPB Add-ons live-proof blocker selected
- Focused Add-ons unit, parser, metafield, formatter, widget, lint, Prisma generate, widget build, CSS minify, and app build checks passed for the first direct `personalizationData` bridge.
- Applied the new Prisma migration against the dev database after sandboxed DB access failed, then restarted the SIT dev server so the updated Prisma client is loaded.
- Live Admin interaction exposed a blocker: the current Add-ons tier UI inherited a free-gift `100` discount default and Chrome field interaction appended digits, producing invalid proof data instead of the evidenced percentage discount value.
- Next edit: add a TDD guard that Add-ons tiers default to `0` discount unless explicitly configured, then patch the Admin serializer/UI defaults before retrying Admin save proof.

### 2026-05-26 13:19 IST - FPB Add-ons step-mutation gap found
- Captured Admin Add-ons configured-state proof at `/private/tmp/wpb-fpb-addons-admin-configured-2026-05-26.png`.
- Captured save proof at `/private/tmp/wpb-fpb-addons-save-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-addons-save-2026-05-26.response.network-response`; request body contains direct `personalizationData.addonProducts.type=MULTI_TIER`, amount eligibility, the selected add-on product, and a 10% discount.
- The save response echoed the direct DB field, but also exposed a blocker: the Admin UI still marked the paid step as `isFreeGift`, which would make the storefront direct-add-ons bridge drop that paid step.
- Next edit: add a TDD guard that Add-ons form state is independent from `stepsData`, then patch the Admin form state/serializer so direct Add-ons do not mutate paid bundle steps.

### 2026-05-26 13:47 IST - FPB Add-ons cart-pricing mismatch found
- Focused Add-ons route/metafield/formatter/widget tests passed after the paid-step isolation patch; modified-file ESLint passed with 0 errors and `npm run build` passed.
- Captured desktop runtime/config proof at `/private/tmp/wpb-fpb-addons-runtime-desktop-2026-05-26.json`, visible Add-ons proof at `/private/tmp/wpb-fpb-addons-runtime-desktop-after-selection-2026-05-26.json`, and screenshot `/private/tmp/wpb-fpb-addons-storefront-desktop-2026-05-26.png`.
- Captured cart proof at `/private/tmp/wpb-fpb-addons-cart-2026-05-26.json`; the add-on product was submitted, but the widget summary/cart display source treated the paid add-on as a free-gift step for totals and emitted `_bundle_step_type: free_gift`.
- Evidence reference shows the Add-ons footer total includes the selected paid add-on price while the separate add-on discount remains its own product-discount behavior. Next edit: add TDD guards for chargeable add-ons counting in totals/cart source properties and patch the widget pricing/type logic.

### 2026-05-26 14:04 IST - FPB Add-ons cart-pricing slice proved
- Added a RED widget pricing test proving chargeable Add-ons must count in totals while true free gifts remain excluded; patched the shared pricing calculator and cart-line type emission.
- Rebuilt widget bundles and retested the live Add-ons flow after clearing the storefront cart.
- Captured corrected desktop proof `/private/tmp/wpb-fpb-addons-storefront-desktop-after-cart-pricing-fix-2026-05-26.png` and runtime `/private/tmp/wpb-fpb-addons-runtime-desktop-after-cart-pricing-fix-2026-05-26.json`; total now includes the selected paid add-on (`$1299.95`).
- Captured corrected cart proof `/private/tmp/wpb-fpb-addons-cart-after-cart-pricing-fix-2026-05-26.json`; cart has exactly two lines, shared `Retail Price: $1299.95`, no `_bundle_step_type: free_gift` on the chargeable add-on line, and direct source properties remain compact.
- Captured corrected mobile proof `/private/tmp/wpb-fpb-addons-storefront-mobile-after-cart-pricing-fix-2026-05-26.png` and runtime `/private/tmp/wpb-fpb-addons-runtime-mobile-after-cart-pricing-fix-2026-05-26.json`.
- Updated the manifest row for `fpb-addons` to `partial`: direct contract, paid-step isolation, desktop/mobile selection, and cart source properties are proven; eligible/ineligible Add-ons messaging, add-on discount application, and exact Admin visual parity remain open.

### 2026-05-26 14:33 IST - FPB Add-ons message states proved
- Captured WPB Admin message-control proof at `/private/tmp/wpb-fpb-addons-admin-messages-filled-2026-05-26.png`.
- Captured save proof at `/private/tmp/wpb-fpb-addons-save-messages-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-addons-save-messages-2026-05-26.response.network-response`; response includes `personalizationData.addonProducts.addonsMessaging.isEnabled=true` with the exact eligible and ineligible message templates.
- Confirmed the remote dev DB persisted the exact Add-ons message strings under `personalizationData.addonProducts.addonsMessaging`.
- Captured desktop ineligible and eligible runtime/screenshot proof at `/private/tmp/wpb-fpb-addons-runtime-desktop-messages-ineligible-2026-05-26.json`, `/private/tmp/wpb-fpb-addons-storefront-desktop-messages-ineligible-2026-05-26.png`, `/private/tmp/wpb-fpb-addons-runtime-desktop-messages-eligible-2026-05-26.json`, and `/private/tmp/wpb-fpb-addons-storefront-desktop-messages-eligible-2026-05-26.png`.
- Captured mobile ineligible and eligible runtime/screenshot proof at `/private/tmp/wpb-fpb-addons-runtime-mobile-messages-ineligible-2026-05-26.json`, `/private/tmp/wpb-fpb-addons-storefront-mobile-messages-ineligible-2026-05-26.png`, `/private/tmp/wpb-fpb-addons-runtime-mobile-messages-eligible-2026-05-26.json`, and `/private/tmp/wpb-fpb-addons-storefront-mobile-messages-eligible-2026-05-26.png`.
- Updated the manifest row for `fpb-addons` but kept status `partial`: message controls and text states are now proven, while product-discount application, exact measured Admin parity, and a cleaner evidence fixture remain open.

### 2026-05-26 14:51 IST - FPB Add-ons product-discount gate selected
- Re-read EB Add-ons runtime proof and confirmed `personalizationData.addonProducts.discountId` plus `discountShopifyResponse.appDiscountType` with `discountClasses: ["PRODUCT"]`, proving EB uses an app-managed Shopify product discount for the add-on tier.
- Checked current WPB extensions and found only the Cart Transform function; there is no product discount function extension available to create the same automatic discount node.
- Consulted an advisor agent on Cart Transform alternatives. The advisor rejected mapping add-on discounts into the existing parent `price_adjustment` because it would discount the merged parent bundle, not only the add-on product.
- Next: document the exact discount-function gate in the implementation reference and manifest, then move to the next evidence-backed slice unless a product-discount extension is explicitly added and manually deployed.

### 2026-05-26 14:59 IST - FPB Messages direct contract slice started
- Documented the Add-ons product-discount gate in `internal docs/EB Implementation Reference.md` and kept the manifest row partial rather than approximating product-discount behavior with Cart Transform.
- Re-read FPB Messages evidence: Admin screenshots, `network-1548-savePersonalization-giftMessage.request.network-request`, `fpb-storefront-runtime-messages.json`, and desktop/mobile validation screenshots.
- The captured Messages card shows no feature-specific `How to setup` or `Learn More` link; only the global help widget is visible, so no feature-help article is available in the evidence bundle for this slice.
- Next edit: add RED tests for direct `personalizationData.giftMessage` save/metafield/runtime contracts and non-email storefront validation, then patch only the route/metafield/widget bridge needed for the evidenced non-email flow.

### 2026-05-26 15:14 IST - FPB Messages local contract green
- Added RED-to-green coverage for direct FPB message personalization persistence, bundle UI config output, Full Page widget runtime source, non-email field rendering, required validation, and message-product cart payload.
- Patched the FPB configure route so Messages are serialized as direct `personalizationData.giftMessage` instead of generic text overrides; the disabled email/customize-email controls remain visual-only and out of behavior scope.
- Patched the Full Page widget to render Message, From, To, the captured textarea placeholder and character limit, block add-to-cart with `Please enter a message`, and add the message product line when a message is entered.
- Verification passed: focused Jest (3 suites, 40 tests), raw widget syntax check, modified-file ESLint with 0 errors, `npm run build:widgets`, and `npm run minify:assets css`.
- Updated the implementation reference and evidence manifest; the Messages row remains `partial` until live WPB Admin/save/DB/runtime/desktop/mobile/cart proof is captured.

### 2026-05-26 15:35 IST - FPB Messages row green
- Captured WPB Admin Messages configured-state proof at `/private/tmp/wpb-fpb-messages-admin-configured-2026-05-26.png`.
- Captured save payload/response proof at `/private/tmp/wpb-fpb-messages-save-2026-05-26.request.network-request`, `/private/tmp/wpb-fpb-messages-save-2026-05-26.response.network-response`, and concise proof `/private/tmp/wpb-fpb-messages-save-proof-2026-05-26.json`; the direct `personalizationData.giftMessage` contract includes Message, From/To, mandatory validation, `120` character limit, and the selected message product.
- Confirmed the remote dev DB persisted the same direct contract in `/private/tmp/wpb-fpb-messages-db-proof-summary-2026-05-26.json`.
- Captured desktop runtime and storefront proof at `/private/tmp/wpb-fpb-messages-runtime-desktop-2026-05-26.json`, `/private/tmp/wpb-fpb-messages-storefront-desktop-2026-05-26.png`, and `/private/tmp/wpb-fpb-messages-storefront-desktop-required-validation-2026-05-26.png`.
- Captured mobile runtime and validation proof at `/private/tmp/wpb-fpb-messages-runtime-mobile-2026-05-26.json`, `/private/tmp/wpb-fpb-messages-storefront-mobile-2026-05-26.png`, `/private/tmp/wpb-fpb-messages-storefront-mobile-required-validation-2026-05-26.png`, and `/private/tmp/wpb-fpb-messages-mobile-validation-proof-2026-05-26.json`.
- Captured cart proof at `/private/tmp/wpb-fpb-messages-cart-json-2026-05-26.json` and `/private/tmp/wpb-fpb-messages-cart-page-2026-05-26.png`; the message product line carries `_gift_message`, `_gift_from`, and `_gift_to`.
- Updated the manifest row to `green`. Next: continue to the next evidence-backed FPB row and keep evidence-limited rows blocked rather than inferred.

### 2026-05-26 15:46 IST - FPB Discount percentage/BQO row started
- Re-read the FPB Discount & Pricing audit evidence and implementation reference for the percentage quantity rule, Bundle Quantity Options, Step-Based progress, Discount Messaging, storefront desktop/mobile behavior, and cart proof requirements.
- Current code review shows the Admin route serializes pricing display options, but the save handler does not yet persist a direct `boxSelection` contract for Full Page bundles or pass it into the bundle variant config.
- Next: add RED coverage for the direct box-selection contract and widget display markers, then wire only the percentage/BQO/progress slice before capturing live WPB proof.

### 2026-05-26 16:07 IST - FPB Discount storefront message mismatch found
- Captured Admin configured proof at `/private/tmp/wpb-fpb-discount-admin-configured-2026-05-26.png` and save proof at `/private/tmp/wpb-fpb-discount-percentage-save-2026-05-26.*.network-request`, `/private/tmp/wpb-fpb-discount-max2-save-2026-05-26.*.network-request`.
- Confirmed the remote dev DB persists the direct `boxSelection` contract and active step `maxQuantity: 2` in `/private/tmp/wpb-fpb-discount-db-proof-2026-05-26.json`.
- Storefront desktop runtime exposed a mismatch: the percentage message variable pair rendered `{{discountValue}}{{discountValueUnit}}` as `5% off`, while the captured Discount Messaging template expects the unit token to produce `5%`.
- Next edit: add a failing TemplateManager assertion for the percentage variable contract, patch `discountValueUnit`, rebuild widgets, and rerun desktop/mobile/cart proof.

### 2026-05-26 16:21 IST - FPB Discount cart application mismatch found
- Retried the storefront after the percentage message fix and captured desktop/mobile success proof plus cart JSON at `/private/tmp/wpb-fpb-discount-cart-json-2026-05-26.json`, screenshot `/private/tmp/wpb-fpb-discount-cart-page-2026-05-26.png`, and summary `/private/tmp/wpb-fpb-discount-cart-proof-summary-2026-05-26.json`.
- Cart proof shows public `Items`, `Retail Price`, and `You Save` properties are present, but Shopify kept both snowboard lines unmerged at full retail price, so the cart total is `$1406.83` instead of the discounted `$1336.83` including the message product.
- Direct Shopify Admin GraphQL proof confirmed the selected snowboard variants have current `component_parents` with `price_adjustment.method=percentage_off`, `value=5`, and quantity condition `2`.
- Root cause selected for the next TDD patch: the gift-message auxiliary product currently carries `_bundle_id`, causing Cart Transform to group a non-component message line with the discounted component lines.
- Next edit: add a failing widget cart-source assertion, remove `_bundle_id` from the message-product cart line, rebuild widgets, and rerun the live cart proof.

### 2026-05-26 16:44 IST - FPB Discount category activation blocker found
- After excluding message-product auxiliary lines from the Cart Transform merge group, the function emitted a two-line percentage merge with the expected parent variant and 5% discount, but Shopify still rendered the cart as ordinary component lines at full retail.
- Read-only DB and Admin GraphQL proof showed the bundle and its parent Shopify product are still `draft`; the save handler auto-activation guard only checks direct step products and direct step collections, not category-backed products/collections.
- Next edit: add RED coverage for category-backed FPB auto-activation, patch the save status gate, then re-save the live bundle to sync the parent product to `ACTIVE` before rerunning cart proof.

### 2026-05-26 16:52 IST - FPB Discount product status mutation blocker found
- The patched live Admin save reached the category-backed activation path and updated the remote DB bundle status to `active`, but read-only Admin GraphQL still reports the parent Shopify product as `DRAFT`.
- Checked Shopify's current Admin GraphQL docs and confirmed status updates should use `productChangeStatus(productId, status)` or the current `productUpdate(product: ...)` signature; the FPB helper still calls the stale `productUpdate(input: ...)` form.
- Next edit: add RED coverage for the current status mutation shape, patch the helper to call `productChangeStatus`, then re-save and rerun cart proof.

### 2026-05-26 16:58 IST - FPB Discount product status schema corrected
- Re-saved the live FPB row after the status helper patch and captured a 200 save proof at `/private/tmp/wpb-fpb-discount-active-product-status-save-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-discount-active-product-status-save-2026-05-26.response.network-response`.
- Read-only Admin GraphQL proof at `/private/tmp/wpb-fpb-discount-active-product-status-proof-2026-05-26.json` still reports the parent product as `DRAFT`.
- Admin API introspection on the test store shows `productChangeStatus` is not available; the current schema exposes `productUpdate(product: ProductUpdateInput)`, so the previous test expectation was too broad.
- Next edit: update the RED coverage and FPB helper to use `productUpdate(product: { id, status })`, re-save through the embedded Admin UI, then rerun cart proof only after Shopify reports the parent product `ACTIVE`.

### 2026-05-26 17:04 IST - FPB Discount Shopify channel blocker isolated
- Updated the FPB status helper and unit coverage to the store-confirmed `productUpdate(product: { id, status })` schema; focused Jest passed for the status sync and category-backed activation tests.
- Re-saved the live bundle through embedded Admin and captured save proof at `/private/tmp/wpb-fpb-discount-product-update-publication-error-save-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-discount-product-update-publication-error-save-2026-05-26.response.network-response`.
- Server logs show Shopify rejected activation with `Resource publications channel ChatGPT does not support bundle products` and `Channel ChatGPT does not support bundle products`; read-only status proof at `/private/tmp/wpb-fpb-discount-product-update-publication-error-status-2026-05-26.json` confirms the parent product remains `DRAFT` with unpublished Online Store, ChatGPT, Point of Sale, and Shop publications.
- Found current Shopify Developer Community reports for the same Agentic/ChatGPT bundle-product publication bug; reported workaround is disabling Direct Checkout for the incompatible agentic channel globally, not an app-level per-product API exclusion.
- Sent the blocker to the existing Aquinas advisor because the thread cannot spawn another subagent. Next: document the blocker in the manifest/reference, keep cart proof partial, and continue another evidence-backed row unless the store-level channel workaround is approved/applied.

### 2026-05-26 17:06 IST - FPB Fixed Amount discount slice started
- Re-read the FPB fixed-amount audit evidence: saved `discountMode: "FIXED"`, quantity rule, box subtext amount-copy, step progress, and success template `Success! Your {{discountValueUnit}}{{discountValue}} discount has been applied to your cart.`
- Current shared template variables format fixed-amount discounts as `discountValue="$5.00"` and `discountValueUnit=" off"`, which cannot render EB's saved unit-before-value templates correctly.
- Next edit: add RED tests for fixed-amount default message templates and storefront variable replacement, then patch only the shared pricing/template helpers before reusing the live Admin loop.

### 2026-05-26 17:08 IST - FPB Fixed Amount local contract green
- Added RED-to-green tests for fixed-amount default message templates and storefront variable replacement.
- Patched `normalizePricingRuleMessages` to use currency-first fixed-amount default templates, and patched the shared TemplateManager so `discountValueUnit` is the currency symbol while `discountValue` is the decimal amount.
- Focused Jest passed for `tests/unit/lib/pricing-display-options.test.ts` and `tests/unit/assets/template-manager.test.ts` fixed-amount cases.
- Next: configure the live FPB row as Fixed Amount Off through embedded Admin, save proof, rebuild widgets, and capture desktop/mobile runtime proof. Cart proof remains behind the Shopify ChatGPT publication blocker.

### 2026-05-26 17:27 IST - FPB Fixed Amount success-message blocker found
- Captured the React-corrected save payload at `/private/tmp/wpb-fpb-discount-fixed-amount-react-corrected-save-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-discount-fixed-amount-react-corrected-save-2026-05-26.response.network-response`.
- The payload still persisted a corrupted `successMessage`, because the configure page global success-message state was overriding method-specific per-rule defaults after switching discount type.
- Next edit: add RED coverage for method-specific success defaults and discount-type reset behavior, then patch the shared pricing helper and FPB/PPB configure type-change handlers.

### 2026-05-26 17:48 IST - FPB Fixed Amount proof captured, visual parity still partial
- Added RED-to-green coverage for method-specific fixed-amount success defaults, stale success-message reset on discount-type change, and FPB/PPB save callback dependencies.
- Patched the shared pricing helper, `useBundlePricing`, and FPB/PPB configure discount-type handlers so fixed-amount messages save as `{{discountValueUnit}}{{discountValue}}` without stale global success overrides.
- Captured clean live save proof at `/private/tmp/wpb-fpb-discount-fixed-amount-clean-save-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-discount-fixed-amount-clean-save-2026-05-26.response.network-response`; DB proof at `/private/tmp/wpb-fpb-discount-fixed-amount-db-proof-2026-05-26.json`.
- Rebuilt widgets and CSS, then captured desktop runtime/screenshots for empty and selected states plus mobile collapsed/expanded selected states under `/private/tmp/wpb-fpb-discount-fixed-amount-*2026-05-26.*`.
- Captured cart proof at `/private/tmp/wpb-fpb-discount-fixed-amount-cart-json-2026-05-26.json`, filtered line-property proof at `/private/tmp/wpb-fpb-discount-fixed-amount-cart-json-filtered-2026-05-26.json`, and mobile cart screenshot at `/private/tmp/wpb-fpb-discount-fixed-amount-cart-page-mobile-2026-05-26.png`.
- Updated the manifest row to `partial`, not `green`: functional save/runtime/cart proof is present, but storefront visual parity still differs from the EB fixed-amount evidence in box-option visibility, currency presentation, card/timeline/side-panel styling, and mobile drawer spacing/typography.
- Next: continue the feedback loop by isolating the next highest-impact storefront visual mismatch before moving the row to green.

### 2026-05-26 18:01 IST - FPB Fixed Amount BQO-off proof recaptured
- Rechecked the EB fixed-amount save evidence and confirmed the FPB fixed-amount request does not carry an active `boxSelection` payload for this row.
- Re-saved the live WPB FPB row with Bundle Quantity Options disabled and Step-Based progress enabled; save proof is `/private/tmp/wpb-fpb-discount-fixed-amount-bqo-off-save-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-discount-fixed-amount-bqo-off-save-2026-05-26.response.network-response`.
- Captured focused DB proof at `/private/tmp/wpb-fpb-discount-fixed-amount-bqo-off-db-proof-2026-05-26.json`; it confirms `boxSelection: null`, fixed-amount pricing, `showProgressBar: true`, and `bundleQuantityOptions.enabled: false`.
- Recaptured desktop empty/selected runtime and screenshots plus mobile selected/expanded runtime and screenshots under `/private/tmp/wpb-fpb-discount-fixed-amount-bqo-off-*2026-05-26.*`; runtime now proves zero `.fpb-box-selection-option` elements in the fixed-amount row.
- Cleared the cart and captured clean cart proof at `/private/tmp/wpb-fpb-discount-fixed-amount-bqo-off-cart-json-2026-05-26.json`, filtered proof at `/private/tmp/wpb-fpb-discount-fixed-amount-bqo-off-cart-json-filtered-2026-05-26.json`, and mobile cart screenshot at `/private/tmp/wpb-fpb-discount-fixed-amount-bqo-off-cart-page-mobile-2026-05-26.png`.
- Remaining gaps before green: exact EB storefront visual parity still differs in product-card density, progress/timeline styling, side-panel/mobile drawer spacing and typography, and the proof store renders calculated discount copy in USD while the saved EB tier subtext evidence uses `₹`.

### 2026-05-26 18:27 IST - FPB Standard mobile summary tray slice started
- Compared EB mobile Standard/fixed-amount proof with WPB mobile closed and expanded proof.
- Concrete mismatch selected for the next loop: WPB renders a collapsed bottom bar plus large overlay drawer, while the evidence-backed Standard mobile summary is a compact sticky tray with discount message, progress labels, and a primary action visible by default.
- Next: add RED coverage for the compact Standard mobile tray contract, patch only the mobile side-footer summary path, rebuild/minify, then capture fresh mobile runtime and screenshot proof.

### 2026-05-26 18:39 IST - FPB Standard mobile summary tray proof captured
- Added RED-to-green coverage for the Standard mobile side-footer compact tray contract.
- Patched the FPB mobile Standard side-footer path so it renders the compact summary tray open by default, removes the collapsed bar/backdrop for that template, preserves discount message/progress markers, and renders a black `Next • total` action when an add-on step follows.
- Rebuilt widgets and minified CSS, then captured mobile runtime proof at `/private/tmp/wpb-fpb-discount-fixed-amount-standard-runtime-mobile-after-compact-summary-tray-action-fix-2026-05-26.json` and screenshot proof at `/private/tmp/wpb-fpb-discount-fixed-amount-standard-storefront-mobile-after-compact-summary-tray-action-fix-2026-05-26.png`.
- Manifest row remains `partial`: the compact tray state is proven, but product/card density, fixture content, tray height, and currency/content differences still block green parity.

### 2026-05-26 18:41 IST - FPB Standard mobile tray slice verified
- Verification passed for the slice: focused Jest, `node --check`, widget build, CSS minification, modified-file ESLint with raw widget source ignored by repo config, code competitor-reference scan, graph rebuild, and `git diff --check` after trimming generated graph report whitespace.
- Next: continue the fixed-amount storefront loop with the mobile product-card density mismatch visible above the compact tray.

### 2026-05-26 18:50 IST - FPB Standard mobile product-card density slice started
- Rechecked the fixed-amount desktop/mobile and Standard template desktop/mobile evidence before editing product cards.
- Evidence conflict noted: desktop Standard proof shows full-width `Add To Box`, while mobile Standard/fixed-amount proof shows compact square plus CTAs; the next edit is scoped to mobile Standard side-footer cards only.
- Advisor thread was requested but did not return within the wait window, so the implementation will avoid any desktop/global CTA change.
- Next: add RED coverage for mobile Standard compact card sizing and plus CTA treatment, then patch only the mobile `FBP_SIDE_FOOTER + DEFAULT` CSS selectors.

### 2026-05-26 19:00 IST - FPB Standard mobile product-card density proof captured
- Added RED-to-green coverage for mobile-only Standard product-card density selectors and square plus CTA styling.
- Patched only the mobile `FBP_SIDE_FOOTER + DEFAULT` CSS: product card height dropped from `391.8px` to `254.5px`, image size is `118px`, typography is controlled despite DCP CSS, and the visible CTA is a square plus button.
- Rebuilt widgets and minified CSS, then captured `/private/tmp/wpb-fpb-discount-fixed-amount-standard-storefront-mobile-after-card-density-typography-fix-2026-05-26.png` plus card metrics at `/private/tmp/wpb-fpb-standard-mobile-card-metrics-after-density-typography-fix-2026-05-26.json`.
- Manifest remains `partial`: the mobile card density is improved and measured, but it is still not an exact match to the EB proof and fixture/currency gaps remain.

### 2026-05-26 19:03 IST - FPB mobile card CTA scope tightened
- Advisor returned after the first mobile card patch and recommended not treating square plus CTAs as a broad Standard template rule because desktop Standard evidence shows full-width `Add To Box`.
- Next edit: add an internal card CTA mode marker and move square plus/mobile density selectors under the exact fixed-amount/no-box-selection evidence-row predicate.

### 2026-05-26 19:07 IST - FPB mobile card CTA marker proof captured
- Added `resolveFullPageCardCtaMode()` and a `data-fpb-card-cta-mode` marker on the full-page layout root.
- Moved the compact card and square plus CTA CSS under `FBP_SIDE_FOOTER + DEFAULT + fixed_amount_off + no boxSelection` via `[data-fpb-card-cta-mode="icon"]`, leaving desktop/default text CTA behavior unclaimed.
- Rebuilt widgets and minified CSS; live marker proof is `/private/tmp/wpb-fpb-standard-mobile-card-marker-proof-2026-05-26.json`.
- The manifest row stays partial because this remains an evidence-row patch until the real persisted card CTA setting is proven.

### 2026-05-26 19:12 IST - FPB Standard mobile tray height tightening started
- Measured current compact tray at `151.9px` high with double vertical spacing from tray flex gap plus child margins.
- Next edit: reduce only the compact tray spacing and preserve message/progress/action content; no product/card behavior change in this slice.

### 2026-05-26 19:17 IST - FPB Standard mobile tray margin mismatch found
- Rebuilt/minified and captured the first tightened-tray proof at `/private/tmp/wpb-fpb-standard-mobile-tray-metrics-after-tighten-2026-05-26.json` and `/private/tmp/wpb-fpb-discount-fixed-amount-standard-storefront-mobile-after-tray-tighten-2026-05-26.png`.
- Live computed styles confirmed the tray height dropped to `125.9px`, but the discount message still uses `margin: 6px 0 8px` because a later equal-specificity mobile bottom-sheet rule wins.
- Next edit: add RED coverage for the higher-specificity compact-tray message selector, patch only that selector, rebuild/minify, and recapture mobile proof.

### 2026-05-26 19:21 IST - FPB Standard mobile tray specificity proof captured
- Added RED-to-green coverage for the higher-specificity compact-tray discount-message selector.
- Patched only the compact mobile tray message margin override; no product-card or widget JS behavior changed in this slice.
- Rebuilt widgets and minified CSS, then captured live proof at `/private/tmp/wpb-fpb-standard-mobile-tray-metrics-after-specificity-fix-2026-05-26.json` and `/private/tmp/wpb-fpb-discount-fixed-amount-standard-storefront-mobile-after-tray-specificity-fix-2026-05-26.png`.
- Verified computed tray state: `123.9px` height, `gap: 0`, `padding: 10px 9px`, message margin `4px 0 8px`, progress margin `0 0 10px`, and active black `Next • $0.00`.
- Manifest row remains `partial`; the next storefront loop should compare the remaining mobile card/tray scale and fixture differences against the fixed-amount evidence before claiming green.

### 2026-05-26 19:32 IST - FPB widget-owned header/category slice started
- Compared EB desktop/mobile fixed-amount proof with the current WPB public FPB page and captured live config summary at `/private/tmp/wpb-fpb-live-config-summary-after-tray-specificity-2026-05-26.json`.
- Advisor confirmed the app-proxy route should not gain static Dawn-like theme chrome; theme/container parity must remain a separate architecture gate.
- Next edit: add RED coverage for widget-owned Standard side-footer structure: render direct bundle summary title/subtitle in the content area, hide the search box for this evidence row, remove the synthetic `All` tab for category-backed steps, default to the first category, and render the active category label above the product grid.

### 2026-05-26 19:45 IST - FPB widget-owned header/content proof captured
- Completed the Standard side-footer content-structure implementation and captured desktop proof at `/private/tmp/wpb-fpb-standard-desktop-content-structure-proof-2026-05-26.json` plus screenshot `/private/tmp/wpb-fpb-standard-desktop-content-structure-2026-05-26.png`.
- Mobile proof from the same slice is `/private/tmp/wpb-fpb-standard-mobile-content-structure-proof-2026-05-26.json` plus screenshot `/private/tmp/wpb-fpb-standard-mobile-content-structure-2026-05-26.png`.
- Proof confirms the direct bundle summary title/subtitle render in the main content area and the evidence-row search input is hidden on both desktop and mobile. The live fixture has one unnamed category, so category tabs/title cannot be claimed green from this bundle.
- Next: update the evidence manifest with these proof files, run focused hygiene for the touched widget slice, then continue the next storefront mismatch rather than marking fixed-amount parity green.

### 2026-05-26 19:47 IST - FPB widget-owned header/content slice verified
- Focused verification passed: `npx jest tests/unit/assets/bundle-widget-full-page-bundle-text.test.ts tests/unit/assets/bundle-widget-full-page-discount-display.test.ts --runInBand`, `node --check app/assets/bundle-widget-full-page.js`, modified-file ESLint with 0 errors and the expected raw-widget ignore warning, banned-reference scan with no matches, graph rebuild, generated graph whitespace trim, `git diff --check`, and CSS size check.
- Minified full-page CSS is `99467` bytes, still under Shopify's 100,000 byte app-block limit.
- Next: continue the fixed-amount storefront loop from the evidence row. The next mismatch to isolate is fixture/runtime product rendering: WPB expands the evidence bundle into many variant cards while the evidence proof shows a compact two-product category presentation.

### 2026-05-26 19:48 IST - FPB variant-card gating slice started
- Re-read the implementation reference and full configure audit for the display-variants control. Confirmed separate variant cards are evidence-backed only when the display-variants setting is enabled.
- Current live runtime has `displayVariantsAsIndividual=false` at the step and `displayVariantsAsIndividualProducts=false` on the active category, but the storefront still expands products into many variant cards because the grid calls variant expansion unconditionally.
- Next edit: add RED coverage that category-backed FPB grids pass an active category variant-display flag into variant expansion and that expansion is skipped when disabled; then patch only the full-page widget product-grid path.

### 2026-05-26 19:54 IST - FPB parent-card first-available-variant slice started
- Live desktop/mobile proof after variant gating shows parent cards instead of variant cards: `/private/tmp/wpb-fpb-standard-desktop-variant-gating-proof-2026-05-26.json`, `/private/tmp/wpb-fpb-standard-desktop-variant-gating-2026-05-26.png`, `/private/tmp/wpb-fpb-standard-mobile-variant-gating-proof-2026-05-26.json`, and `/private/tmp/wpb-fpb-standard-mobile-variant-gating-2026-05-26.png`.
- New proof `/private/tmp/wpb-fpb-standard-missing-product-variant-availability-proof-2026-05-26.json` shows six configured category products and six fetched products, but only five rendered cards because the first product's first variant is unavailable while later variants are available.
- Next edit: add RED coverage that FPB parent-card normalization chooses the first available variant, then patch only the parent-product path so a configured product is not dropped when a later variant can be selected.

### 2026-05-26 19:59 IST - FPB parent-card first-available-variant proof captured
- Added RED-to-green coverage for active-category variant-card gating and first-available variant selection in `tests/unit/assets/bundle-widget-full-page-category-hydration.test.ts`.
- Patched the full-page widget so category-backed grids expand variants only when the active category flag is enabled, and parent cards seed from the first available variant instead of dropping the configured product.
- Rebuilt widget bundles and minified CSS, then captured desktop proof `/private/tmp/wpb-fpb-standard-desktop-first-available-variant-proof-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-desktop-first-available-variant-2026-05-26.png`.
- Captured mobile proof `/private/tmp/wpb-fpb-standard-mobile-first-available-variant-proof-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-mobile-first-available-variant-2026-05-26.png`.
- Live proof now shows 6 configured category products and 6 rendered parent product cards on desktop and mobile, with no variant-title card markers.

### 2026-05-26 20:01 IST - FPB variant-card gating and first-available slice verified
- Verification passed: focused widget Jest suite (11 tests), `node --check app/assets/bundle-widget-full-page.js`, modified-file ESLint with 0 errors and expected raw-widget ignore warning, banned-reference scan with no matches, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, graph rebuild, generated graph whitespace trim, `git diff --check`, and CSS size check.
- Minified full-page CSS remains `99467` bytes.
- Next: continue the fixed-amount storefront loop. Remaining proof blockers are not product expansion anymore; they are exact fixture/category naming, category tabs/title, card/sidebar/tray sizing, and the separate app-proxy theme-context gate.

### 2026-05-26 20:14 IST - FPB fixed-amount category fixture saved
- Re-aligned the live WPB FPB fixed-amount Standard fixture through Admin Step Setup to match the evidence-backed category structure: step name `Step 1 - Jewelry Picks`, step title `Choose your jewelry`, Category 1 with two products, and Category 2 with one product.
- Captured Admin unsaved and persisted screenshots at `/private/tmp/wpb-fpb-step-setup-two-category-product-fixture-admin-unsaved-2026-05-26.png` and `/private/tmp/wpb-fpb-step-setup-two-category-product-fixture-admin-persisted-2026-05-26.png`.
- Captured save proof at `/private/tmp/wpb-fpb-step-setup-two-category-product-fixture-save-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-step-setup-two-category-product-fixture-save-2026-05-26.response.network-response`; the response proves Category 2 persisted as named and product-backed.
- Next: reload the storefront, capture desktop/mobile runtime and screenshots, then patch only if the live fixture still fails the evidence structure.

### 2026-05-26 20:20 IST - FPB fixed-amount step subtext/category-row slice started
- Captured storefront desktop proof at `/private/tmp/wpb-fpb-standard-desktop-two-category-fixture-proof-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-desktop-two-category-fixture-2026-05-26.png`.
- Captured storefront mobile proof at `/private/tmp/wpb-fpb-standard-mobile-two-category-fixture-proof-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-mobile-two-category-fixture-2026-05-26.png`.
- Confirmed two concrete storefront mismatches against the fixed-amount evidence row: saved step subtext `Choose your jewelry` is absent from the content body, and the inactive second category does not render as a collapsed row after the active category products.
- Next: add RED coverage for saved step subtext and multi-category section rows, patch the Full Page widget only, rebuild/minify, and recapture desktop/mobile proof.

### 2026-05-26 20:24 IST - FPB runtime step subtext contract gap found
- First storefront reload after the widget patch proved the collapsed Category 2 row renders, but `Choose your jewelry` is still absent.
- Captured runtime config proof at `/private/tmp/wpb-fpb-standard-runtime-step-config-after-subtext-patch-2026-05-26.json`; `data-bundle-config.steps[0]` includes `name` and `categories` but omits persisted `pageTitle`.
- Scope expanded from widget render to the shared bundle formatter/metafield runtime contract. Next: add RED formatter coverage for `pageTitle`, patch `formatBundleForWidget`, then rebuild and recapture proof.

### 2026-05-26 20:27 IST - FPB fixed-amount step subtext/category-row proof captured
- Added RED-to-green coverage for saved Full Page step subtext, inactive category rows, and `formatBundleForWidget` preserving `step.pageTitle`.
- Patched the Full Page widget to render saved step subtext in the main body and append collapsed inactive category rows after the active category grid.
- Patched the shared bundle formatter so runtime/metafield config includes `steps[].pageTitle`; live proof now shows `pageTitle: "Choose your jewelry"` in `data-bundle-config`.
- Captured desktop proof at `/private/tmp/wpb-fpb-standard-desktop-step-subtext-category-row-proof-2-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-desktop-step-subtext-category-row-2-2026-05-26.png`.
- Captured mobile proof at `/private/tmp/wpb-fpb-standard-mobile-step-subtext-category-row-proof-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-mobile-step-subtext-category-row-2026-05-26.png`.
- Next: run the full required verification set for the touched widget/formatter slice, update the evidence manifest, then continue with the next measured storefront mismatch.

### 2026-05-26 20:31 IST - FPB step subtext/category-row slice verified
- Verification passed for this slice: focused Jest suite (29 tests), `node --check app/assets/bundle-widget-full-page.js`, modified-file ESLint with 0 errors, code competitor-reference scan with no matches, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, graph rebuild, `git diff --check`, and CSS size check.
- Full Page minified CSS is `99,925` bytes, still under Shopify's 100,000 byte app-block limit.
- Evidence manifest row `fpb-discount-fixed-amount` now includes the Step Setup save/runtime/desktop/mobile proof paths for the saved step subtext and collapsed inactive category row.
- Next: continue the fixed-amount storefront parity loop by measuring the next visible mismatch rather than claiming the row green.

### 2026-05-26 20:32 IST - FPB fixed-amount fixture text parity loop started
- Current desktop/mobile proof still shows prior WPB custom side-summary text and visible gift-message product content in the fixed-amount row.
- Evidence row body sample shows the side summary as `Your Bundle` / `Review your bundle` and does not show the gift-message form in this fixed-amount state.
- Next: use the Admin UI to align only the live fixture text/feature state, capture save/runtime proof, and avoid code changes unless the Admin save/runtime path fails.

### 2026-05-26 20:47 IST - FPB fixed-amount fixture text proof captured
- Saved the live Admin fixture state with Bundle Settings summary text set to `Your Bundle` / `Review your bundle` and Messages disabled.
- Captured Admin state proof at `/private/tmp/wpb-fpb-fixed-messages-off-admin-2026-05-26.png` and `/private/tmp/wpb-fpb-fixed-messages-off-admin-snapshot-2026-05-26.txt`; the save response proof is `/private/tmp/wpb-fpb-fixed-messages-off-save-2026-05-26.response.network-response`.
- Captured desktop storefront runtime/screenshot at `/private/tmp/wpb-fpb-standard-desktop-fixture-text-aligned-proof-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-desktop-fixture-text-aligned-2026-05-26.png`.
- Captured mobile storefront runtime/screenshot at `/private/tmp/wpb-fpb-standard-mobile-fixture-text-aligned-proof-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-mobile-fixture-text-aligned-2026-05-26.png`.
- Runtime proof now shows `bundleTextConfig.bundleSummary.title` as `Your Bundle`, `bundleTextConfig.bundleSummary.subTitle` as `Review your bundle`, and no visible gift-message product on desktop or mobile.
- Next: continue the fixed-amount storefront parity loop with the remaining visible mismatch: add-on side-panel rendering and copy, followed by measured card/tray spacing.

### 2026-05-26 20:55 IST - FPB add-on side-panel title gap started
- Aligned the live Admin Add-ons fixture to the fixed-amount storefront evidence: Step Name `Add On`, section title `Add ON`, quantity-based eligibility value `1`, and enabled tier messages.
- Captured Admin unsaved proof at `/private/tmp/wpb-fpb-fixed-addons-message-admin-unsaved-2026-05-26.png` and `/private/tmp/wpb-fpb-fixed-addons-message-admin-unsaved-snapshot-2026-05-26.txt`.
- Captured save proof at `/private/tmp/wpb-fpb-fixed-addons-message-save-2026-05-26.request.network-request` and `/private/tmp/wpb-fpb-fixed-addons-message-save-2026-05-26.response.network-response`; the response includes `personalizationData.addonProducts.title: "Add ON"` and enabled messages.
- Captured storefront proof at `/private/tmp/wpb-fpb-standard-desktop-addons-message-fixture-proof-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-desktop-addons-message-fixture-2026-05-26.png`.
- Runtime proof shows the add-on ineligible message renders, but the side-panel `Add ON` heading is missing even though the runtime config contains the title.
- Next edit: add RED coverage for the add-on side-panel title and patch only the Full Page widget side-panel add-on renderer.

### 2026-05-26 21:02 IST - FPB add-on side-panel title desktop proof captured
- Added RED-to-green widget coverage for rendering the direct Add-ons section title in the Full Page side panel before the tier message.
- Patched only `app/assets/bundle-widget-full-page.js` to derive the add-on side-panel title from the persisted direct Add-ons runtime fields and reuse the existing side-panel count typography.
- Rebuilt widget bundles and captured desktop proof at `/private/tmp/wpb-fpb-standard-desktop-addons-title-proof-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-desktop-addons-title-2026-05-26.png`; `Add ON` now renders before the add-on message.
- Captured mobile proof at `/private/tmp/wpb-fpb-standard-mobile-addons-title-proof-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-mobile-addons-title-2026-05-26.png`; mobile remains compact-tray only and does not expose the add-on heading.
- Next: run the required verification set, update the evidence manifest, then continue with the next visible fixed-amount mismatch rather than marking this row green.

### 2026-05-26 21:09 IST - FPB add-on side-panel title slice verified
- Verification passed: focused widget/formatter Jest suite (34 tests), `node --check app/assets/bundle-widget-full-page.js`, modified-file ESLint with 0 errors, code competitor-reference scan with no matches, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, graph rebuild, generated graph whitespace trim, `git diff --check`, and CSS size check.
- Minified app-block CSS sizes are `99925` bytes for the Full Page widget and `52115` bytes for the Product Page widget.
- Updated the evidence manifest Add-ons row with the fixed-amount fixture Admin/save/runtime/desktop/mobile proof paths and kept status `partial`.
- Next: continue the fixed-amount storefront parity loop with measured card/tray spacing and category/timeline labeling gaps.

### 2026-05-26 21:09 IST - FPB multiple-category timeline label gap started
- Live reference measurement `/private/tmp/eb-fpb-fixed-amount-desktop-detailed-measure-2026-05-26.json` proves the fixed-amount Standard timeline renders three navigation labels: `Step 1 - Jewelry Picks`, `Multiple Categories`, and `Add On`.
- Current WPB measurement `/private/tmp/wpb-fpb-standard-desktop-measure-before-category-label-2026-05-26.json` renders only `Step 1 - Jewelry Picks` and `Add On`.
- Next edit: add RED widget coverage for a synthetic multiple-category timeline entry when the active paid step has more than one category, then patch only the Full Page timeline renderer.

### 2026-05-26 21:16 IST - FPB multiple-category timeline label proof captured
- Added RED-to-green widget coverage for the synthetic `Multiple Categories` timeline entry between the paid category-backed step and Add-ons step.
- Patched the Full Page timeline renderer to build timeline entries from steps plus a synthetic multiple-category entry when a non-add-on step has more than one category.
- Rebuilt widget bundles and captured desktop proof at `/private/tmp/wpb-fpb-standard-desktop-multiple-category-timeline-proof-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-desktop-multiple-category-timeline-2026-05-26.png`; `timelineText` is now `Step 1 - Jewelry Picks`, `Multiple Categories`, `Add On`.
- Captured mobile proof at `/private/tmp/wpb-fpb-standard-mobile-multiple-category-timeline-proof-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-mobile-multiple-category-timeline-2026-05-26.png` with the same three timeline labels.
- Next: run the required verification set for this timeline slice, update the evidence manifest note, then continue to card/tray spacing.

### 2026-05-26 21:20 IST - FPB multiple-category timeline label slice verified
- Verification passed: focused widget/formatter Jest suite (35 tests), `node --check app/assets/bundle-widget-full-page.js`, modified-file ESLint with 0 errors, code competitor-reference scan with no matches, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, graph rebuild, generated graph whitespace trim, `git diff --check`, and CSS size check.
- Minified app-block CSS sizes remain `99925` bytes for the Full Page widget and `52115` bytes for the Product Page widget.
- Evidence manifest note now points to the desktop/mobile multiple-category timeline proof files. The fixed-amount row remains `partial`.
- Next: measure and patch the remaining fixed-amount card/sidebar/mobile-tray spacing gaps.

### 2026-05-26 21:21 IST - FPB category tab pill visual gap started
- Live reference mobile measurement `/private/tmp/eb-fpb-fixed-amount-mobile-density-measure-2026-05-26.json` proves category tabs render as left-aligned black/white pills with title case labels, `2px` black borders, `99px` radius, `4px 14px` padding, and `15px` label text.
- Current WPB mobile measurement `/private/tmp/wpb-fpb-fixed-amount-mobile-density-measure-2026-05-26.json` still renders centered stacked cyan/gray uppercase tabs with `8px` radius and `12px 32px` padding.
- Next edit: add RED CSS coverage for reference-style category pills, then replace the existing category-tab rules instead of adding a large new CSS block because the Full Page app-block CSS is only 75 bytes under the Shopify limit.

### 2026-05-26 21:24 IST - FPB category tab pill proof captured
- Added RED-to-green CSS coverage for the reference category tab pill treatment, then replaced the existing Full Page widget category tab rules instead of adding duplicate CSS.
- Captured mobile proof at `/private/tmp/wpb-fpb-standard-mobile-category-pill-proof-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-mobile-category-pill-2026-05-26.png`; tabs now render as left-aligned black/white pills with `2px` black borders, `99px` radius, `4px 14px` padding, and title-case labels.
- Captured desktop proof at `/private/tmp/wpb-fpb-standard-desktop-category-pill-proof-2026-05-26.json` and `/private/tmp/wpb-fpb-standard-desktop-category-pill-2026-05-26.png`; desktop uses the same pill treatment and remains centered within the current app-proxy widget column.
- Remaining proof gap: WPB desktop/mobile x-position still differs from the reference because the Shopify theme/app-proxy container row remains blocked; do not mark this row green from tab styling alone.
- Next: run the required focused Jest, syntax, ESLint, code-reference scan, widget build, CSS minify, app build, graph rebuild, diff, and CSS-size checks for this slice.

### 2026-05-26 21:27 IST - FPB category tab pill slice verified
- Verification passed: focused widget/formatter Jest suite (36 tests), `node --check app/assets/bundle-widget-full-page.js`, modified-file ESLint with 0 errors, code competitor-reference scan with no matches, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, graph rebuild, generated graph whitespace trim, and `git diff --check`.
- Minified app-block CSS sizes are `99658` bytes for the Full Page widget and `52115` bytes for the Product Page widget.
- Evidence manifest now records the desktop/mobile category-pill proof filenames in the fixed-amount Standard update notes. The fixed-amount row remains `partial`.
- Next: continue the fixed-amount storefront parity loop with measured product card/sidebar/mobile-tray gaps against a comparable selected/empty reference state.

### 2026-05-26 21:36 IST - FPB Storefront available variant stock gate gap started
- Attempted to make the WPB fixed-amount desktop page comparable to the selected reference state before measuring card/sidebar spacing.
- Live interaction proof showed every visible WPB fixed-amount product click is blocked by stock toasts (`This item is out of stock.` or `Only 0 in stock — quantity adjusted.`), leaving the summary at `0 items`.
- Captured network proof `/private/tmp/wpb-fpb-storefront-products-response-2026-05-26.network-response`; Shopify Storefront returns many variants with `available: true` and `quantityAvailable: 0`, so the widget is incorrectly treating zero quantity as hard out-of-stock even when Storefront availability says the variant is sellable.
- Official Shopify Storefront docs define variant availability through the sale-availability field; the widget should use explicit unavailable flags to block, not zero quantity alone.
- Next edit: add RED coverage for Full Page Storefront availability with zero quantity, then patch the Full Page widget stock gate so selected-state evidence can be captured before continuing spacing work.

### 2026-05-26 21:42 IST - FPB Storefront available variant stock gate proof captured
- Added RED-to-green widget coverage for Storefront variants with `available=true`, `quantityAvailable=0`, and `currentlyNotInStock=false`.
- Patched the Full Page widget stock gate so explicit `available === false` blocks selection, while positive `quantityAvailable` still clamps finite stock.
- Rebuilt widget bundles and captured desktop selected proof at `/private/tmp/wpb-fpb-standard-desktop-selected-stock-gate-proof-2026-05-26.json` plus screenshot `/private/tmp/wpb-fpb-standard-desktop-selected-stock-gate-2026-05-26.png`.
- Captured mobile selected proof at `/private/tmp/wpb-fpb-standard-mobile-selected-stock-gate-proof-2026-05-26.json` plus screenshot `/private/tmp/wpb-fpb-standard-mobile-selected-stock-gate-2026-05-26.png`.
- Proof text now shows both paid products selected (`− 1 + ✓`), the selected-count state reaches `2 items`, and the desktop side panel enables `Add to Cart`.
- Next: run the required focused Jest, syntax, ESLint, code-reference scan, minify/build, graph rebuild, diff, and CSS-size checks before continuing spacing work.

### 2026-05-26 21:47 IST - FPB Storefront available variant stock gate slice verified
- Verification passed: focused widget/formatter Jest suite (37 tests), `node --check app/assets/bundle-widget-full-page.js`, modified-file ESLint with 0 errors, code competitor-reference scan with no matches, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, graph rebuild, generated graph whitespace trim, and `git diff --check`.
- Minified app-block CSS sizes remain `99658` bytes for the Full Page widget and `52115` bytes for the Product Page widget.
- Evidence manifest now records the product API network proof plus desktop/mobile selected-state proof files. The fixed-amount row remains `partial`.
- Next: use the selected desktop/mobile WPB measurements against the selected reference measurements to patch product card, side-panel, and compact tray spacing deltas.

### 2026-05-26 21:54 IST - FPB selected product card density gap started
- Compared selected desktop/mobile product-card metrics after the stock-gate proof.
- Reference desktop selected cards are `182px x 286px` with `8px` padding, `15px` grid gap, `10px` radius, no green selected border, left-aligned `16px/22px` title, and compact price/quantity action row.
- WPB desktop selected cards remain `189px x 395px` with `12px` padding, `20px` grid gap, green selected border, centered title, tall price row, and oversized vertical content.
- Reference mobile selected cards are `177.5px x 263px` with `150px` image height and `15px` grid gap; WPB mobile selected cards are `167px x 229.5px` with `118px` image height and extra left/right inset from the current app-proxy container.
- Next edit: add RED CSS coverage for the measured selected Standard card density, then patch the Full Page widget CSS without touching blocked theme/header/footer context.

### 2026-05-26 21:56 IST - FPB selected product card density proof captured
- Added RED-to-green widget/CSS coverage for the selected Standard card density and compact selected quantity badge treatment.
- Patched the Full Page widget to use a selected quantity badge in fixed-amount Standard icon mode and to re-render the visible product grid after selection without breaking the sidebar update flow.
- Rewrote the icon-mode Standard CSS for measured desktop/mobile card dimensions, removed stale/duplicate step-tab and skeleton CSS to keep the Shopify app-block CSS under the `100,000 B` limit, and kept the minified Full Page CSS at `99,798 B`.
- Captured desktop proof at `/private/tmp/wpb-fpb-standard-desktop-selected-card-density-proof-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-desktop-selected-card-density-2026-05-26.png`; selected cards are `182px x 286px`, grid gap is `15px`, selected border is `0`, and the sidebar shows `2 items`.
- Captured mobile proof at `/private/tmp/wpb-fpb-standard-mobile-selected-card-density-proof-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-mobile-selected-card-density-2026-05-26.png`; selected cards are `177.5px x 263px`, image height is `150px`, grid gap is `15px`, and the compact footer shows the discount success state.
- Chrome console check after the patch shows no widget JavaScript error; only the existing 404 resource noise remains.
- Next: run the full focused verification stack, update the evidence manifest, then continue to the next measured fixed-amount mismatch.

### 2026-05-26 21:56 IST - FPB selected product card density slice verified
- Verification passed: focused widget/formatter Jest suite (37 tests), `node --check app/assets/bundle-widget-full-page.js`, modified-file ESLint with 0 errors, code competitor-reference scan with no matches, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, graph rebuild, generated graph whitespace trim, `git diff --check`, and CSS size check.
- Minified app-block CSS sizes are `99,798` bytes for the Full Page widget and `52,115` bytes for the Product Page widget.
- Evidence manifest now records desktop/mobile selected-card density proof filenames in the fixed-amount Standard update notes. The fixed-amount row remains `partial`.
- Next: continue the fixed-amount storefront parity loop with side-panel/tray spacing and copy mismatches, then cart proof for this exact fixture.

### 2026-05-26 21:57 IST - FPB desktop side-panel density gap started
- Compared EB desktop side-panel metrics from `/private/tmp/eb-fpb-fixed-amount-desktop-targeted-metrics-2026-05-26.json` with fresh WPB side-panel metrics `/private/tmp/wpb-fpb-standard-desktop-side-panel-before-2026-05-26.json`.
- Reference side panel is `366.27px` wide with `20px` padding, `326.27px` inner column, no border, `10px` radius, `5px` grid gap, and starts at the category-title row roughly one header block above the product grid.
- WPB side panel is `360px` wide with an `318px` inner column, a visible `1px` border, starts at the wrapper top (`y=181.59`) instead of the category-title row (`y=296.59`), and is shorter (`564.13px`) than the reference panel (`681.53px`).
- Next edit: add RED CSS coverage for the measured Standard side-panel density and patch the icon-mode side panel layout without changing the blocked app-proxy/theme chrome.

### 2026-05-26 22:06 IST - FPB desktop side-panel density proof captured
- Added RED-to-green CSS coverage for the measured Standard desktop side-panel dimensions and patched the icon-mode side panel layout.
- Captured desktop proof at `/private/tmp/wpb-fpb-standard-desktop-side-panel-proof-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-desktop-side-panel-2026-05-26.png`.
- The WPB side panel now measures `366px` wide with `20px` padding, `326px` inner column, `5px` grid gap, no border, `10px` radius, and `681px` height; it starts on the WPB category-title row with the product grid below.
- Remaining non-green gap: absolute viewport y-position differs from EB because the EB reference includes Shopify theme header/context above the widget while this WPB app-proxy route uses the existing minimal app-owned shell. Keep that tracked under the blocked `fpb-app-proxy-theme-context` row, not as a side-panel CSS regression.
- Next: run the focused Jest, syntax, ESLint, code-reference scan, widget build, CSS minify, app build, graph rebuild, diff, and CSS-size checks before moving to the next fixed-amount mismatch.

### 2026-05-26 22:07 IST - FPB desktop side-panel CSS test assertion gap
- Focused Jest proof failed only on the new side-panel CSS assertion because the regex required a trailing semicolon after the final `grid-template-columns:326px` declaration; the CSS block is present and live Chrome proof confirms the computed value.
- Next edit: loosen that assertion to match the measured declaration without requiring a formatting-only trailing semicolon, then rerun the verification stack.

### 2026-05-26 22:12 IST - FPB desktop side-panel density slice verified
- Verification passed: focused widget/formatter Jest suite (38 tests), `node --check app/assets/bundle-widget-full-page.js`, modified-file ESLint with 0 errors, code competitor-reference scan with no matches, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, graph rebuild, generated graph whitespace trim, and `git diff --check`.
- Minified app-block CSS sizes are `99,990` bytes for the Full Page widget and `52,115` bytes for the Product Page widget, leaving only `10` bytes before the Shopify Full Page asset limit.
- Evidence manifest now records the desktop side-panel density proof filenames in the fixed-amount Standard update notes. The fixed-amount row remains `partial`.
- Next: continue the fixed-amount storefront parity loop with the remaining mobile compact-tray height/spacing and copy/fixture mismatches.

### 2026-05-26 22:12 IST - FPB mobile compact footer density gap started
- Captured live EB mobile footer metrics at `/private/tmp/eb-fpb-standard-mobile-compact-footer-live-2026-05-26.json` plus screenshot `/private/tmp/eb-fpb-standard-mobile-compact-footer-live-2026-05-26.png`.
- Captured fresh WPB selected mobile tray metrics at `/private/tmp/wpb-fpb-standard-mobile-compact-tray-proof-2026-05-26.json` plus screenshot `/private/tmp/wpb-fpb-standard-mobile-compact-tray-2026-05-26.png`.
- Reference footer is `370px x 195.56px`, starts `10px` from the viewport edge, uses `5px` padding, has a centered black quantity badge, a `126.56px` discount/progress block, and a `38px` black action button inside a `58px` action row.
- WPB tray is `390px x 123.94px`, starts at x `0`, has no quantity badge, compresses the discount/progress stack, and uses a `30px` action button.
- Next edit: replace the compact mobile tray contract test with the measured sticky footer/badge contract, prove RED, then patch the Full Page widget DOM/CSS while freeing CSS bytes elsewhere if needed.

### 2026-05-26 22:12 IST - FPB mobile compact footer CSS cap gap
- The RED-to-green mobile footer DOM/CSS patch made the Full Page app-block CSS exceed Shopify's `100,000 B` limit at `100,493 B`.
- Next edit: remove stale legacy step-tab presentation rules not emitted by the current Full Page storefront runtime, then rerun the CSS minifier before taking Chrome proof.

### 2026-05-26 22:22 IST - FPB mobile compact footer child cascade gap
- Fresh WPB mobile proof at `/private/tmp/wpb-fpb-standard-mobile-compact-footer-proof-2026-05-26.json` now matches the reference outer footer geometry at `370px x 196px`, x `10`, y `648`, with a centered black quantity badge and `360px x 38px` black action button.
- Remaining measured gap is inside the footer: the discount line is still inheriting an older `11px` bold side-panel rule instead of the reference `15px/27px` footer typography, and the action-row box is content-box sizing to a `78px` rect instead of the reference `58px` row.
- Next edit: patch the later mobile summary cascade so the compact footer owns its discount typography and border-box action-row sizing, then recapture the Chrome proof.

### 2026-05-26 22:24 IST - FPB mobile compact footer selector correction
- Chrome parent-chain proof at `/private/tmp/wpb-fpb-standard-mobile-summary-parent-chain-2026-05-26.json` shows the compact tray is rendered as the same element as `.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray` directly under `body`, not under `.layout-sidebar`.
- The first cascade patch therefore did not match the live footer and the base bottom-sheet/side-panel rules still controlled the discount message and CTA row.
- Next edit: retarget the footer-specific CSS/test selector to `.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray` and recapture proof.

### 2026-05-26 22:29 IST - FPB mobile compact footer density slice verified
- Captured corrected WPB mobile compact footer proof at `/private/tmp/wpb-fpb-standard-mobile-compact-footer-selector-proof-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-mobile-compact-footer-selector-2026-05-26.png`.
- The compact footer now measures `370px x 196px` at x `10`, y `648`, with a centered `48px x 25px` black quantity badge, progress block `310px x 96px` from y `685` to `781`, `360px x 58px` action row from y `781` to `839`, and `360px x 38px` black CTA from y `791` to `829`.
- Verification passed: focused widget/formatter Jest suite (38 tests), `node --check app/assets/bundle-widget-full-page.js`, modified-file ESLint with 0 errors, code competitor-reference scan with no matches, `npm run build:widgets`, `npm run minify:assets css`, `npm run build`, graph rebuild, generated graph whitespace trim, `git diff --check`, and CSS size check.
- Minified app-block CSS sizes are `99,936` bytes for the Full Page widget and `52,115` bytes for the Product Page widget.
- Evidence manifest now records the compact footer proof filenames and measured geometry. The fixed-amount row remains `partial` because exact product/add-on fixture parity, cart proof for this exact fixture, and blocked app-proxy theme/container context remain open.
- Next: continue the fixed-amount storefront parity loop with the remaining product/add-on fixture and cart proof mismatches, then move through the remaining FPB templates.

### 2026-05-26 22:31 IST - FPB fixed-amount Standard clean cart proof captured
- Cleared the storefront cart, rebuilt the exact Standard fixed-amount two-paid-item state, advanced through the mobile compact footer into the Add-ons step, and used the widget Add to Cart CTA without selecting an add-on.
- Captured clean ATC/cart JSON at `/private/tmp/wpb-fpb-standard-cart-flow-after-atc-no-addon-2026-05-26.json`, cart-page JSON/runtime proof at `/private/tmp/wpb-fpb-standard-cart-page-no-addon-proof-2026-05-26.json`, and cart-page screenshot `/private/tmp/wpb-fpb-standard-cart-page-no-addon-2026-05-26.png`.
- Cart proof shows two component lines with public `Box`, `Items`, `Retail Price`, and `You Save` properties plus private `_bundle_id`, `_bundle_name`, `_step_index`, `_step_name`, and `_bundle_display_properties`; the cart page renders `Items:`, `Retail Price:`, and `You Save:` rows.
- EB reference docs confirm the public cart property label is `Items`, not `Bundle Items`, for the proven storefront/cart output.
- Next: update the evidence manifest, rerun `git diff --check`, and continue with the remaining product/add-on fixture parity gaps.

### 2026-05-26 22:33 IST - FPB fixed-amount Standard add-on cart proof captured
- Rebuilt the Standard fixed-amount state again, selected the Add-ons product, and let the widget navigate to the cart after Add to Cart.
- Captured cart-page JSON proof at `/private/tmp/wpb-fpb-standard-cart-page-with-addon-proof-2026-05-26.json` and screenshot `/private/tmp/wpb-fpb-standard-cart-page-with-addon-2026-05-26.png`.
- Cart proof shows three component lines with shared public `Box`, `Items`, `Retail Price`, and `You Save` properties and the add-on line included in the display string.
- Remaining gap is confirmed, not inferred: the add-on product is added at full product price and the current cart/display savings do not include the add-on tier discount.
- Next: update the evidence manifest with the add-on-selected proof and continue with the add-on discount implementation through Cart Transform, not a separate discount extension.

### 2026-05-26 22:39 IST - FPB Add-ons Cart Transform discount correction started
- Corrected the implementation target after the user clarified that the selected Add-ons discount should be handled by Cart Transform, which is also the intended EB-equivalent path.
- Re-read the current Cart Transform query and Rust merge path: the input already reads `_bundle_step_type`, merge output already supports `linesMerge.price.percentageDecrease`, and the existing issue is that chargeable add-on lines are not tagged with add-on discount data.
- The next TDD slice will prove an add-on line can contribute an additional tier discount to the merged parent price as an effective percentage across the grouped lines, while preserving no-add-on and true free-gift behavior.
- Next edit: add the test-spec row and RED Rust/widget tests, then patch the storefront cart properties and Cart Transform merge calculation.

### 2026-05-26 22:45 IST - FPB Add-ons Cart Transform discount unit slice passed
- Added RED-to-green coverage for the selected Add-ons Cart Transform path: widget contract tests now require chargeable add-ons to emit discount-bearing step-type data and include selected add-on savings in cart display properties.
- Added Rust integration coverage proving a fixed-amount base discount plus a selected 10% add-on tier becomes one effective `linesMerge.price.percentageDecrease` on the merged parent (`$11` savings on `$110`, `10%`).
- Kept the Cart Transform input query complexity flat by encoding selected add-on discount data inside the existing `_bundle_step_type` value (`addon:PERCENTAGE:10`) instead of adding new queried line attributes.
- Verification passed for the focused widget add-ons Jest test and targeted Rust integration test.
- Next: run the broader transform/widget verification stack, rebuild widget assets, then capture live storefront/cart proof for the same selected-add-on fixture.

### 2026-05-26 22:55 IST - FPB Add-ons combined storefront total fix started
- Live selected-add-on proof after the Cart Transform tagging patch shows the selected add-on line now carries `_bundle_step_type: "addon:PERCENTAGE:10"` and display savings amount includes the add-on tier.
- Remaining confirmed mismatch: the visible widget footer still subtracts only the base fixed discount, and cart display percentage keeps the base percentage instead of recomputing from combined base plus selected Add-ons savings.
- Next edit: add a shared combined-discount helper for selected Add-ons, wire it into the Full Page summary/footer and cart-source display properties, then recapture live cart proof.

## Related Documentation

- `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md`
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`

## Phases Checklist

- [x] Phase 1 - Feature pipeline requirements, architecture, and SDE plan
- [x] Phase 2 - Evidence manifest with one row per control/template
- [x] Phase 3 - TDD contracts for mappings, gates, parsers, serializers, and widget reducers
- [ ] Phase 4 - Admin configure shell and section parity
- [ ] Phase 5 - Persistence, DB, and metafield contract parity
- [ ] Phase 6 - FPB storefront runtime parity
- [ ] Phase 7 - PPB storefront runtime parity
- [ ] Phase 8 - Desktop/mobile/cart Chrome evidence loop
- [ ] Phase 9 - Builds, lint, graph rebuild, and deploy handoff
