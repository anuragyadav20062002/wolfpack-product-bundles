# Issue: EB Category Accordion Parity
**Issue ID:** eb-category-accordion-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 02:31

## Overview
Bring FPB and PPB category accordion configuration to EB parity, including FPB category rules visibility, shared category accordion UI behavior, and cleanup of Polaris web component prop/type errors in the affected Admin configure surfaces.

## Progress Log
### 2026-06-04 00:12 - Started evidence and gap audit
- Opened the category accordion parity slice after the user's report that FPB category rules are missing and Polaris web component prop/type errors remain.
- Scope includes EB evidence confirmation, FPB category rules parity, shared FPB/PPB category accordion UI parity, and focused Admin UI type/prop cleanup.
- User explicitly allowed custom non-Polaris controls inside category accordions where required to match EB exactly.
- Next: confirm EB behavior from internal evidence, inspect current FPB/PPB route implementation, add focused tests, then patch the smallest complete gap.

### 2026-06-04 00:49 - Category accordion parity and web-component prop cleanup
- Confirmed EB persists FPB and PPB category rules under `productsData1.categories.*.conditions`; the current WPB FPB UI only exposed category rules after multiple categories and mainly in the Rules Configuration card.
- Added `test-spec/eb-category-accordion-parity.spec.md` and `tests/unit/routes/eb-category-accordion-parity-contract.test.ts` to lock shared FPB/PPB category accordion field order, inline category-rule access, and no invalid `s-button variant="plain"` / old stack gaps inside the category body.
- Updated FPB and PPB category accordion bodies so Category Name, Multi Language, Category Title, Products, Collections, and category-rule controls share the same structure.
- Moved category-rule Add/Edit/Remove access into each category accordion while keeping EB's multi-category gate and existing `StepCategory.conditions` / `autoNextStepOnConditionMet` persistence wiring.
- Replaced invalid category-body Polaris web component usage with custom buttons/lists, changed remaining `s-button variant="plain"` instances in affected configure routes to validated `variant="tertiary"`, and replaced `s-icon name` usage with validated `s-icon type` values in affected Admin surfaces.
- Fixed two stale test syntax errors that prevented `tsc --noEmit` from reaching the Polaris prop backlog.
- Verification passed: focused category/step contract tests, analytics/widget syntax-fix tests, modified-file ESLint with 0 errors, `git diff --check`, Shopify component validation, and `npm run build`.
- Remaining: full `npx tsc --noEmit --pretty false` now reaches a broad existing backlog across billing, attribution, create-configure, route refs, and tests; it is no longer blocked by parser errors, but it still does not pass.

### 2026-06-04 00:52 - Graph rebuild completed
- Rebuilt graphify with the documented pipx graphify environment after system Python lacked the module.
- Graphify completed and updated `graphify-out/graph.json` plus `graphify-out/GRAPH_REPORT.md`; it reported the existing extraction warning for `app_constants_errors_ts`.

### 2026-06-04 00:28 - PPB category-rules follow-up started
- User reported category rules still need to be implemented for PPB.
- Next: inspect the active PPB category accordion path and category-rule gating to identify whether PPB lacks the inline rule controls or whether visibility is blocked by state/gating.

### 2026-06-04 00:34 - PPB inline category rules ungated
- Added a focused PPB contract assertion proving the category accordion renders the inline category-rule panel and Add Rule action without depending on the multi-category Rules Configuration gate.
- Updated the PPB configure route so each category accordion exposes category rules directly, matching the already-shared FPB/PPB inline category accordion UI.
- Verification passed: focused category accordion Jest, modified-file ESLint with 0 errors, `npm run build`, graphify rebuild, and `git diff --check`.

### 2026-06-04 00:45 - Screenshot-locked category accordion polish started
- User provided an objective screenshot reference for the category accordion UI.
- Scope: make FPB and PPB shared category accordion markup/styles match the screenshot structure: icon-only header actions, single visible category input with storefront helper, right-aligned Multi Language action, and centered Products/Collections tabs.
- Next: update the source-contract spec first, then patch shared category styles and both route bodies.

### 2026-06-04 00:52 - Screenshot-locked category accordion implemented
- Updated the FPB and PPB category accordion markup to match the provided screenshot: icon-only copy/delete header controls, separate chevron, single visible category input, storefront helper text, Multi Language action, and centered Products/Collections tabs.
- The visible category input now updates both `StepCategory.name` and `StepCategory.title` so the single screenshot field remains the storefront-visible value while the existing Category Title persistence contract stays intact.
- Updated shared and bundle-specific category accordion CSS to match the screenshot proportions, borders, header background, tab underline, count badge, compact action button, and hidden label accessibility pattern.
- Verification passed: focused category accordion Jest, product-page step category contract Jest, TS/TSX modified-file ESLint with 0 errors, checkout extension source typecheck with `--skipLibCheck`, `npm run build`, graphify rebuild, and `git diff --check`.
- Note: standalone checkout extension `tsc` without `--skipLibCheck` still fails inside Shopify UI extension `.d.ts` exports; the same command passes with `--skipLibCheck`, so no current checkout extension source errors were found.

### 2026-06-04 01:04 - Category rules and variant-checkbox follow-up started
- User clarified the screenshot contract: Multi Language needs a visible border, clone/delete need tooltips and Step Setup icons, product/collection helper copy belongs directly above picker buttons, and category rules must move out of the category accordion into Rules Configuration.
- Scope: remove inline category-rule panels from FPB/PPB category accordions, keep category-rule copy and wiring in Rules Configuration, and replace PPB per-category variant checkboxes with one step-level checkbox that writes `displayVariantsAsIndividualProducts` to all categories.
- Next: update focused contracts, validate new Shopify icon usage, then patch routes/styles.

### 2026-06-04 01:12 - Category rules and global PPB variant control implemented
- Removed the inline category-rule panels and help copy from FPB and PPB category accordions; the same category rules copy and add/update/remove wiring now lives in the Rules Configuration card.
- Changed category-rule availability from multi-category-only to any configured category so FPB and PPB can both use Category rules when one category exists.
- Replaced PPB per-category `Display variants as individual products` controls with a single step-level checkbox that writes `displayVariantsAsIndividualProducts` to every category and seeds new categories from the current global state.
- Added product/collection helper copy above the picker actions, bordered the Multi Language action, increased the category name input height, and swapped clone/delete header icons to validated `s-icon type="duplicate"` / `type="delete"` with `Clone` and `Delete` tooltips.
- Updated focused route/style contracts and test spec to lock the new screenshot behavior.
- Verification passed: focused category accordion/rule/variant Jest suite, Shopify Polaris App Home component validation for `s-icon`, modified-file ESLint with 0 errors, `npm run build`, graphify rebuild with the documented venv, and `git diff --check`.

### 2026-06-04 01:18 - Rules layout and FPB variant follow-up started
- User clarified remaining EB parity gaps: Step Rules fields should be visually unlabeled, the variant-display checkbox must be present for both FPB and PPB, Add Category and Add Rule buttons should span the card width, the Add Category divider should sit directly below the full-width button with only a small gap before the variant checkbox, and the category name input should match the Multi Language button height.
- Next: add focused route/style contracts first, then patch shared styles and both configure routes.

### 2026-06-04 01:22 - Rules layout and FPB variant follow-up completed
- Converted FPB and PPB Step Rules Type/Condition/Value fields from visible-label Polaris fields to the same unlabeled inline select/number controls used by category rules, keeping accessible `aria-label` values.
- Kept the `Display variants as individual products` checkbox in both FPB and PPB category cards, with PPB still writing the value to every category and FPB using its canonical `displayVariantsAsIndividual` field.
- Made Add Category and Add Rule actions full width, tightened the divider spacing below Add Category, and aligned category name input height with the Multi Language action.
- Updated focused contracts and the test spec to cover unlabeled Step Rules, full-width add actions, both-bundle variant checkbox presence, and the Add Category divider/checkbox order.
- Verification passed: focused category/rule/variant Jest suite, modified-file ESLint with 0 errors, `npm run build`, graphify rebuild with the documented venv, and `git diff --check`.

### 2026-06-04 02:31 - Broad configure parity verification before commit
- Re-ran the combined focused configure parity suite with FPB/PPB save, slot icon, category accordion, rule layout, variant checkbox, and PPB Place Widget product-context tests.
- Fixed a stale FPB save test expectation so category products are still asserted under `StepCategory`, while preserving cached variant payloads there instead of dropping them.
- Verification passed: 9 Jest suites / 127 tests, scoped ESLint with 0 errors, `npm run build`, and `git diff --check` excluding regenerated graph output.

## Related Documentation
- internal docs/EB Implementation Reference.md
- docs/competitor-analysis/16-eb-full-data-flow-investigation.md
- docs/issues-prod/eb-ui-clone-rewrite-1.md
- docs/issues-prod/eb-configure-sections-parity-1.md

## Phases Checklist
- [x] Phase 1: Confirm EB category rule behavior for FPB and PPB
- [x] Phase 2: Add focused contract tests for category accordion parity
- [x] Phase 3: Implement FPB category rules and shared accordion UI parity
- [x] Phase 4: Fix affected Polaris web component prop/type errors
- [x] Phase 5: Run lint, tests, build, and graph rebuild verification
