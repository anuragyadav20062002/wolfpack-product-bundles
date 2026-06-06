# Issue: FPB Add-ons and Messages Email Capture EB Parity
**Issue ID:** fpb-addons-messages-email-capture-parity-1
**Status:** Completed
**Priority:** High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 03:20

## Overview
Rebuild the Full Page / Landing Page bundle Admin sections for Free Gift & Add Ons and Messages to match EB behavior and visual treatment. Scope includes contextual SaveBar behavior for every control, direct `personalizationData` persistence, storefront rendering, cart payload capture, and email capture fields. Outbound email delivery is not part of this slice; captured email data must be stored on the storefront/cart path without pretending to send email.

## Progress Log
### 2026-06-05 02:15 - Design gate started
- Read current repo instructions and Superpowers workflow.
- Reviewed EB reference for FPB Add-ons and Messages contracts.
- Confirmed user wants email controls included, with Option 2 selected: capture UI/data only, no outbound email provider.
- Created design spec: `docs/superpowers/specs/2026-06-05-fpb-addons-messages-email-capture-parity-design.md`.
- Next: get user review, then write the implementation plan before code changes.

### 2026-06-05 02:25 - Implementation plan started
- User approved the design spec.
- Creating Superpowers implementation plan with TDD, EB Chrome audit, SaveBar verification, storefront capture, and widget build gates.
- Plan file: `docs/superpowers/plans/2026-06-05-fpb-addons-messages-email-capture-parity.md`.
- Next: review plan and choose execution mode.

### 2026-06-05 02:25 - EB evidence audit started
- Starting fresh EB Chrome audit for Landing Page `Free Gift & Add Ons`, `Messages`, and email-capture controls.
- Scope is evidence/docs only for Task 1; no app code, tests, widget builds, deploys, or commits.
- Next: capture current Admin labels/control order, help-link content, save/runtime/cart behavior where accessible.

### 2026-06-05 02:30 - EB evidence captured
- Captured current EB Landing Page Add-ons and Messages behavior on `yash-wolfpack`, bundle `WPB Research Landing Bundle 2026-05-22` (`bundleId: 2`).
- Admin Messages order observed: `Enable Messages`, message product preview/Edit, `Enable Sender and Recipient Fields`, `Make Gift Message mandatory`, `Enable Message Limit (Characters)` + `Enter Message Limit`, `Send message through email to the customer`, `Customize your email templates here` + `Customize Emails`, then the sender-domain note.
- Current EB email toggle and `Customize Emails` were visible but visually disabled/non-focusable; no recipient email, delivery date, or email template editor fields were exposed in Admin, and save-with-email-enabled was not accessible in this run.
- Storefront preview URL inspected: `https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/2?page=addProductsPage1&currentFlow=byob`.
- Runtime/cart keys observed from storefront code: `gbbEmailAddressHTML`, `gbbEmailAddressWrapper`, `gbbVideoMsgEmailField`, `gbbEmailAddressLabelField`, `giftMessageDeliveryInfo`, `gbbScheduleMessageDeliveryHTML`, `gbbScheduleMessageSendNowContainer`, `gbbScheduleMessageSendLaterContainer`, `gbbScheduleMessageDatePicker`, `gbbEmailValidationError`; cart properties `Recipient Email`, `_gbbEmailDeliveryDate`, `_gbbEmailDeliveryOption`, plus existing `Message`, `Recipient Name`, and `Sender Name`.
- Help content read: Add-ons `How to setup?` opened the EB help/chat article `[Classic] How to provide additional add-ons with different discounts, like gifts, on bundle builders`; no visible Messages or email-specific help links were present.
- Updated `internal docs/EB Implementation Reference.md` under `FPB Messages Personalization Contract` with the 2026-06-05 email-capture update.
- Temporary artifacts, not in repo: `/private/tmp/eb-fpb-messages-email-2026-06-05.png`, `/private/tmp/eb-fpb-storefront-product-modal-2026-06-05.png`, `/private/tmp/eb-fpb-updateFullPageBundleView-2026-06-05.network-response`.
- Next: write failing tests.

### 2026-06-05 02:36 - RED tests started
- Starting Task 2 test spec and failing unit/source-contract tests for FPB Add-ons and Messages email capture parity.
- Scope remains tests and issue log only; no Admin/widget implementation, widget build, deploy, or commit.
- Fresh EB evidence names are the contract source for email classes and cart property markers.
- Next: run the focused Jest command and record RED status.

### 2026-06-05 02:38 - RED tests verified
- Created `test-spec/fpb-addons-messages-email-capture-parity.spec.md`.
- Added RED source-contract tests for Admin email capture markers, widget EB email field classes, email validation, and cart properties.
- Required Jest command exited RED, but the repo invocation ran the full unit project and surfaced unrelated existing failures. Isolated `--runTestsByPath` rerun on the four Task 2 files showed 4 expected failures: missing Admin disabled/non-focusable email markers, missing widget email render markers, missing widget email validation helper, and missing EB email cart property markers.
- No Admin/widget implementation was added.
- Next: implement the failing Admin and widget contracts in the next task.

### 2026-06-05 02:45 - RED scope corrected after review
- Removed passing Task 2 persistence/metafield test edits because RED-only scope should not add tests that already pass.
- Confirmed direct `personalizationData` JSON preservation already covers the save/metafield passthrough behavior at the existing contract level; email-enabled payload preservation will be verified in the focused green pass instead of represented as RED tests.
- Remaining Task 2 RED surface is Admin disabled email UI markers and FPB widget email capture/render/validation/cart property source contracts.
- No production app/widget code was changed.

### 2026-06-05 02:52 - RED scope narrowed to missing behavior only
- Removed the passing generic dirty-state source test from Task 2 because it is not an email-capture RED test.
- Removed the passing no-outbound-provider widget source test from Task 2; no-outbound behavior remains an implementation acceptance item for the green/full focused pass.
- Updated the test spec so RED cases are limited to missing Admin email markers and missing widget email render, validation, and cart property markers.
- Direct JSON persistence/metafield passthrough remains an acceptance/green-pass verification item, not a RED test.

### 2026-06-05 02:53 - Task 3 Admin draft/save serialization
- Expanded the FPB gift message draft to retain email capture flags inside `giftMessageDraft`: `isEmailEnabled`, `recipientEmailRequired`, `deliveryDateEnabled`, and `customizeEmailsEnabled`.
- Serialized the same capture metadata back into `personalizationData.giftMessage` while keeping `isVideoMessageEnabled: false`.
- Confirmed no separate email state was introduced; `giftMessageDraft` remains in the `handleSave` dependency list, save-success baseline, and discard reset path.
- Next: Task 4 Admin disabled UI markers and visual parity.

### 2026-06-05 02:55 - Task 4 Admin disabled email UI started
- Starting the FPB Messages card update for EB-visible disabled email capture controls.
- Scope is limited to Admin route UI and this issue log; no widget JS, tests, built assets, or commits.
- Disabled email controls must display current saved draft state without dirtying because EB controls were disabled/non-focusable in the captured run.
- Next: wire meaningful `emailCaptureDisabled` semantics and run the focused Admin Jest test.

### 2026-06-05 02:56 - Task 4 Admin disabled email UI completed
- Added the EB-visible `Send message through email to the customer` disabled switch after the message limit field, displaying `giftMessageDraft.isEmailEnabled` without an interaction handler.
- Added disabled/non-focusable Customize Emails copy and action with `aria-disabled="true"` and `tabIndex={-1}` wrappers.
- Added scoped disabled email row styling via `emailCaptureDisabled` / `emailCustomizeDisabled`; no widget JS, tests, built assets, or outbound email delivery code were edited.
- Focused Admin Jest test passed: `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/fpb-addons-admin-layout.test.ts`.
- Next: Task 5 storefront email capture and cart payload behavior.

### 2026-06-05 03:01 - Task 5 storefront email capture started
- Starting capture-only FPB storefront email runtime in `app/assets/bundle-widget-full-page.js`.
- Scope is limited to EB-observed email field markers, validation, and cart line properties; no outbound provider/fetch code, route/Admin edits, CSS edits, tests, built assets, scripts, or commits.
- Next: run the focused widget Jest contract and `node --check` after implementation.

### 2026-06-05 03:05 - Task 5 storefront email capture completed
- Expanded FPB gift-message runtime state with recipient email, delivery date, delivery option, and email validation error state.
- Rendered EB-observed capture-only email UI when `giftMessage.isEmailEnabled === true`, including recipient email, delivery info, send now/send later controls, date input, and validation error markers.
- Added email validation before cart add and included EB-observed cart properties on the message product line: `Message`, `Recipient Name`, `Sender Name`, `Recipient Email`, `_gbbEmailDeliveryDate`, and `_gbbEmailDeliveryOption`, while preserving existing private gift-message properties when populated.
- No outbound email delivery/provider/fetch code, route/Admin edits, CSS edits, tests, built assets, scripts, or commits were added.
- Focused widget Jest passed: `npx jest --selectProjects unit --runTestsByPath tests/unit/assets/bundle-widget-full-page-messages.test.ts`.
- Raw widget syntax check passed: `node --check app/assets/bundle-widget-full-page.js`.
- Next: Task 6 verification/build/deploy gates remain outside this task.

### 2026-06-05 03:08 - Task 5 quality fix started
- Reviewing Send Now/Send Later delivery-date state handling after Task 5 quality review.
- Scope remains limited to `app/assets/bundle-widget-full-page.js` and this issue log; no tests, routes/Admin, CSS, built assets, scripts, commits, or outbound email delivery code.
- Next: clear date state when switching to Send Now, guard `_gbbEmailDeliveryDate` serialization to Send Later only, then rerun the focused verification commands.

### 2026-06-05 03:09 - Task 5 quality fix completed
- Cleared both `giftMessageState.deliveryDate` and the date input value when switching delivery back to Send Now.
- Guarded `_gbbEmailDeliveryDate` cart serialization so it is only emitted when `_gbbEmailDeliveryOption` is `later` and a delivery date exists.
- No tests, routes/Admin, CSS, built assets, scripts, commits, or outbound email delivery code were edited.
- Next: rerun the focused widget Jest contract, raw JS syntax check, and diff whitespace check.

### 2026-06-05 03:12 - Task 6 focused verification completed
- Focused unit verification passed: `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/services/bundle-product-metafield.test.ts tests/unit/assets/bundle-widget-full-page-messages.test.ts tests/unit/assets/bundle-widget-full-page-addons.test.ts` (5 suites, 75 tests).
- Raw FPB widget syntax check passed: `node --check app/assets/bundle-widget-full-page.js`.
- Modified-file ESLint passed with zero errors: `npx eslint --max-warnings 9999 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx' app/assets/bundle-widget-full-page.js tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/assets/bundle-widget-full-page-messages.test.ts`.
- ESLint reported warnings only, and `app/assets/bundle-widget-full-page.js` is ignored by the repo ESLint config.
- Next: bump widget version, build widget assets, then verify Admin/storefront behavior in Chrome DevTools.

### 2026-06-05 03:13 - Widget build completed
- Bumped `WIDGET_VERSION` from `2.9.75` to `2.9.76` in `scripts/build-widget-bundles.js`.
- Ran `npm run build:widgets`; build completed successfully and regenerated the full-page widget bundle plus shared versioned product-page/SDK bundle outputs.
- Build outputs changed: `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`, `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`, and `extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`.
- Next: verify Admin and storefront behavior in Chrome DevTools.

### 2026-06-05 03:18 - Chrome DevTools verification completed
- Admin verification used embedded SIT dev preview at `https://admin.shopify.com/store/agent-5sfidg3m/apps/wolfpack-product-bundles-sit/app/bundles/full-page-bundle/configure/cmpznom360001v0wqjqm3cv3a`, which loaded the local Cloudflare dev app.
- Verified FPB Messages order and disabled state: `Send message through email to the customer`, `Customize your email templates here`, `Customize Emails`, and the sender-domain note appeared after message-limit controls, matching the EB evidence order.
- Disabled email switch and Customize Emails action could not be interacted with in Chrome DevTools; they did not open SaveBar or dirty state.
- Toggling the editable `Enable messages` control did open Shopify contextual SaveBar; `Discard Changes` restored the original bundle state and cleared SaveBar.
- Storefront verification used temporary harness only: `/private/tmp/fpb-email-capture-harness.html`, loading the built `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` with an email-enabled `giftMessage` config.
- Verified empty recipient email blocks add-to-cart and shows `Please enter a valid email address`; no cart request was captured.
- Verified valid capture with sender, recipient, message, recipient email, Send Later, and `2026-07-01` captured a gift-message cart line with `Message`, `Sender Name`, `Recipient Name`, `Recipient Email`, `_gbbEmailDeliveryOption: later`, and `_gbbEmailDeliveryDate: 2026-07-01`.
- Mobile harness viewport `390x844` showed all email/message controls visible, inside the viewport, and non-overlapping; screenshot saved outside the repo at `/private/tmp/fpb-email-capture-harness-mobile.png`.
- Next: rebuild graph, update issue completion status, and commit the scoped files.

### 2026-06-05 03:19 - Final verification and graph rebuild completed
- Default graph rebuild command failed because `python3` could not import `graphify`.
- Reran graph rebuild through the local graphify venv: `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`; rebuild completed with 4051 nodes, 6030 edges, and 597 communities.
- Fresh focused unit verification passed: `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/services/bundle-product-metafield.test.ts tests/unit/assets/bundle-widget-full-page-messages.test.ts tests/unit/assets/bundle-widget-full-page-addons.test.ts` (5 suites, 75 tests).
- Fresh raw widget syntax check passed: `node --check app/assets/bundle-widget-full-page.js`.
- Fresh modified-file ESLint passed with zero errors: `npx eslint --max-warnings 9999 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx' app/assets/bundle-widget-full-page.js tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/assets/bundle-widget-full-page-messages.test.ts`; warnings only, 0 errors.
- Trimmed graphify-generated trailing whitespace from `graphify-out/GRAPH_REPORT.md` before commit.
- Issue status set to Completed.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `docs/eb-ui-clone-rewrite/evidence-manifest.md`
- `docs/superpowers/specs/2026-06-05-fpb-addons-messages-email-capture-parity-design.md`

## Phases Checklist
- [x] Phase 1: Define approved scope and design
- [x] Phase 2: Write implementation plan
- [x] Phase 3: Add TDD test spec and failing tests
- [x] Phase 4: Implement Admin parity and SaveBar wiring
- [x] Phase 5: Implement storefront email capture and cart payload behavior
- [x] Phase 6: Verify with tests, lint, widget build, and Chrome DevTools
