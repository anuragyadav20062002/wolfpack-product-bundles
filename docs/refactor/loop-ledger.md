---
schema_version: 1
id: widget-refactor-loop-ledger
title: Widget Refactor Loop Ledger
type: implementation-ledger
status: active
summary: Records bounded storefront widget refactor and verification loops.
last_audited: 2026-07-20
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - bundle-widgets
source_paths:
  - app/assets/bundle-widget-full-page.js
  - app/assets/bundle-widget-product-page.js
related_docs:
  - docs/refactor/full-page-and-product-page-template-verification-matrix.md
tags:
  - refactor
  - verification
keywords:
  - widget loop
  - storefront parity
---

# Widget Refactor Loop Ledger

## Loop 1 - Baseline Inventory and Visual Capture

Pass/fail: Pass.

Tests run: Not applicable for capture-only loop.

Visual URLs checked:
- FPB storefront: `https://agent-5sfidg3m.myshopify.com/pages/wpb-fresh-fpb-template-parity-2026-06-04`
- PPB storefront: `https://agent-5sfidg3m.myshopify.com/products/wpb-fresh-ppb-template-parity-2026-06-04-97524`

Screenshots captured: `/private/tmp/wpb-template-baseline-2026-06-11`.

Known follow-ups: Continue shared-component loops before migrating templates.

## Loop 2 - File-Size and Runtime-CSS Baseline

Pass/fail: Skipped by user direction.

Tests run: Repository search confirmed the removed check command and script are no longer referenced.

Visual URLs checked: Not applicable.

Screenshots captured: None.

Known follow-ups: Use ad hoc `wc -l` checks during loops; no dedicated check command or script remains.

## Loop 3 - Shared State Skeleton

Pass/fail: Pass.

Tests run:
- `npx jest tests/unit/assets/shared-bundle-state.test.ts tests/unit/assets/widget-build-shared-modules.test.ts --runInBand`
- `node --check app/assets/widgets/shared/engine/create-bundle-state.js`
- `node --check app/assets/widgets/shared/engine/bundle-selectors.js`
- `node --check app/assets/widgets/shared/engine/bundle-actions.js`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check app/assets/bundle-widget-product-page.js`
- `npm run build:widgets`

Visual URLs checked:
- FPB storefront: `https://agent-5sfidg3m.myshopify.com/pages/wpb-fresh-fpb-template-parity-2026-06-04`
- PPB storefront: `https://agent-5sfidg3m.myshopify.com/products/wpb-fresh-ppb-template-parity-2026-06-04-97524`

Screenshots captured: None.

Known follow-ups: None from this loop.

## Loop 4 - Shared Product Card Contract

Pass/fail: Code/tests pass; Chrome verification blocked because `chrome-devtools/list_pages` timed out twice on 2026-06-11.

Tests run:
- `npx jest tests/unit/assets/shared-product-card.test.ts tests/unit/assets/widget-build-shared-modules.test.ts --runInBand`
- `node --check app/assets/widgets/shared/components/product-card.js`
- `node --check app/assets/widgets/shared/components/quantity-control.js`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check app/assets/bundle-widget-product-page.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run minify:assets css`
- `npm run build:widgets`
- `wc -l app/assets/widgets/shared/components/product-card.js app/assets/widgets/shared/components/quantity-control.js app/assets/widgets/shared/engine/create-bundle-state.js app/assets/widgets/shared/engine/bundle-selectors.js app/assets/widgets/shared/engine/bundle-actions.js`

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Retry Chrome verification when the Chrome MCP connection responds.

## Loop 5 - Shared Discount Progress Component

Pass/fail: Code/tests pass; storefront visual verification not applicable for replacement because no template was migrated. Chrome verification remains blocked because `chrome-devtools/list_pages` timed out twice on 2026-06-11.

Tests run:
- `npx jest tests/unit/assets/shared-discount-progress.test.ts tests/unit/assets/widget-build-shared-modules.test.ts --runInBand`
- `node --check app/assets/widgets/shared/components/discount-progress.js`
- `node --check app/assets/widgets/shared/engine/bundle-selectors.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npm run minify:assets css`
- `wc -l app/assets/widgets/shared/components/discount-progress.js app/assets/widgets/shared/engine/bundle-selectors.js`

Visual URLs checked: Not applicable for inactive shared primitive; Chrome blocked.

Screenshots captured: None.

Known follow-ups: Use `renderDiscountProgress()` when migrating FPB sidebar/mobile tray and PPB footer/drawer templates.

## Loop 6 - Shared Selected Rows and Slots

Pass/fail: Code/tests pass; storefront visual verification not applicable for replacement because no template was migrated. Chrome verification remains blocked because `chrome-devtools/list_pages` timed out twice on 2026-06-11.

Tests run:
- `npx jest tests/unit/assets/shared-selected-summary.test.ts tests/unit/assets/widget-build-shared-modules.test.ts --runInBand`
- `npx jest tests/unit/assets/shared-bundle-state.test.ts tests/unit/assets/shared-product-card.test.ts tests/unit/assets/shared-discount-progress.test.ts tests/unit/assets/shared-selected-summary.test.ts tests/unit/assets/widget-build-shared-modules.test.ts --runInBand`
- `node --check app/assets/widgets/shared/components/selected-product-row.js`
- `node --check app/assets/widgets/shared/components/selected-product-slots.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npm run minify:assets css`
- `npx eslint --max-warnings 9999 tests/unit/assets/shared-bundle-state.test.ts tests/unit/assets/shared-product-card.test.ts tests/unit/assets/shared-discount-progress.test.ts tests/unit/assets/shared-selected-summary.test.ts tests/unit/assets/widget-build-shared-modules.test.ts`
- `wc -l app/assets/widgets/shared/components/selected-product-row.js app/assets/widgets/shared/components/selected-product-slots.js`

Visual URLs checked: Not applicable for inactive shared primitives; Chrome blocked.

Screenshots captured: None.

Known follow-ups: Use `renderSelectedProductRow()` and `renderSelectedProductSlots()` when migrating FPB sidebars and PPB slot templates.

## Loop 7 - FPB Standard Migration

Pass/fail: Code/tests/build pass for the Standard shared product-card, selected-row, and discount-progress migration slice. Storefront visual verification is blocked because `chrome-devtools/list_pages` timed out again on 2026-06-11.

Tests run:
- `npx jest tests/unit/assets/fpb-standard-shared-card.test.ts tests/unit/assets/shared-product-card.test.ts tests/unit/assets/shared-selected-summary.test.ts tests/unit/assets/shared-discount-progress.test.ts --runInBand`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/fpb-standard-shared-card.test.ts tests/unit/assets/shared-product-card.test.ts tests/unit/assets/shared-selected-summary.test.ts tests/unit/assets/shared-discount-progress.test.ts`
- `wc -l app/assets/bundle-widget-full-page.js app/assets/widgets/shared/components/product-card.js tests/unit/assets/fpb-standard-shared-card.test.ts`

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Retry Standard storefront verification; `app/assets/bundle-widget-full-page.js` is still a grandfathered oversized legacy file and must be split before the final stop condition.

## Loop 8 - FPB Classic Migration

Pass/fail: Code/tests/build pass for the Classic shared product-card and selected-slot migration slice. Storefront visual verification is blocked because Chrome DevTools page listing is still timing out.

Tests run:
- `npx jest tests/unit/assets/fpb-standard-shared-card.test.ts tests/unit/assets/fpb-classic-shared-components.test.ts tests/unit/assets/shared-product-card.test.ts tests/unit/assets/shared-selected-summary.test.ts --runInBand`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/fpb-classic-shared-components.test.ts tests/unit/assets/fpb-standard-shared-card.test.ts`

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Retry Classic storefront verification; Classic runtime CSS and installer architecture are still legacy and must be removed in later loops.

## Loop 9 - FPB Compact Migration

Pass/fail: Code/tests/build pass for the Compact shared product-card migration slice. Storefront visual verification is blocked because Chrome DevTools page listing is still timing out.

Tests run:
- `npx jest tests/unit/assets/fpb-compact-shared-card.test.ts tests/unit/assets/fpb-standard-shared-card.test.ts tests/unit/assets/fpb-classic-shared-components.test.ts tests/unit/assets/shared-product-card.test.ts --runInBand`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/fpb-compact-shared-card.test.ts`

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Compact sidebar/progress migration and runtime CSS cleanup are still pending; retry storefront verification when Chrome responds.

## Loop 10 - FPB Horizontal Migration

Pass/fail: Code/tests/build pass for the Horizontal shared product-card migration slice. Storefront visual verification is blocked because Chrome DevTools page listing is still timing out.

Tests run:
- `npx jest tests/unit/assets/fpb-horizontal-shared-card.test.ts --runInBand` (red, before implementation)
- `npx jest tests/unit/assets/fpb-horizontal-shared-card.test.ts tests/unit/assets/fpb-standard-shared-card.test.ts tests/unit/assets/fpb-classic-shared-components.test.ts tests/unit/assets/fpb-compact-shared-card.test.ts tests/unit/assets/shared-product-card.test.ts --runInBand`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/fpb-horizontal-shared-card.test.ts tests/unit/assets/fpb-standard-shared-card.test.ts tests/unit/assets/fpb-classic-shared-components.test.ts tests/unit/assets/fpb-compact-shared-card.test.ts`

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Horizontal side panel/progress migration and runtime CSS cleanup are still pending; retry storefront verification when Chrome responds.

## Loop 11 - PPB Template Registry and Normalization

Pass/fail: Code/tests/build pass for the PPB registry and legacy-identifier normalization slice. Storefront rendering verification is blocked because Chrome DevTools page listing is still timing out.

Tests run:
- `npx jest tests/unit/assets/ppb-template-registry.test.ts tests/unit/assets/ppb-template-registry-integration.test.ts --runInBand`
- `node --check app/assets/widgets/product-page/templates/registry.js`
- `node --check app/assets/widgets/product-page/templates/cognive-template.js`
- `node --check app/assets/widgets/product-page/templates/cascade-template.js`
- `node --check app/assets/widgets/product-page/templates/modal-slot-template.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/ppb-template-registry.test.ts tests/unit/assets/ppb-template-registry-integration.test.ts` (warnings only)

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Retry PPB registry smoke verification when Chrome responds; migrate each PPB template to the shared primitives.

## Loop 12 - PPB Grid Shared Product Card

Pass/fail: Code/tests/build pass for the PPB Grid product-card migration slice. Storefront visual verification is blocked because Chrome DevTools page listing is still timing out.

Tests run:
- `npx jest tests/unit/assets/ppb-grid-shared-card.test.ts --runInBand` (red, before implementation)
- `npx jest tests/unit/assets/ppb-grid-shared-card.test.ts tests/unit/assets/shared-product-card.test.ts --runInBand`
- `node --check app/assets/bundle-widget-product-page.js`
- `node --check app/assets/widgets/shared/components/product-card.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/ppb-grid-shared-card.test.ts tests/unit/assets/shared-product-card.test.ts` (warnings only)

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Retry PPB Grid storefront verification; footer/drawer summary still reuses legacy Cascade behavior and must be migrated later.

## Loop 13 - PPB List Shared Product Card

Pass/fail: Code/tests/build pass for the PPB List product-card migration slice. Storefront visual verification is blocked because Chrome DevTools page listing is still timing out.

Tests run:
- `npx jest tests/unit/assets/ppb-list-shared-card.test.ts --runInBand` (red, before implementation)
- `npx jest tests/unit/assets/ppb-list-shared-card.test.ts tests/unit/assets/ppb-grid-shared-card.test.ts tests/unit/assets/shared-product-card.test.ts --runInBand`
- `node --check app/assets/bundle-widget-product-page.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/ppb-list-shared-card.test.ts tests/unit/assets/ppb-grid-shared-card.test.ts tests/unit/assets/shared-product-card.test.ts` (warnings only)

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Retry PPB List storefront verification; selected drawer/footer summary still uses legacy Cascade methods and must be migrated later.

## Loop 14 - PPB Horizontal Slots Shared Shell

Pass/fail: Code/tests/build pass for the modal slot grid shell migration slice. Storefront visual verification is blocked because Chrome DevTools page listing is still timing out.

Tests run:
- `npx jest tests/unit/assets/ppb-horizontal-slots-shared-shell.test.ts --runInBand` (red, before implementation)
- `npx jest tests/unit/assets/ppb-horizontal-slots-shared-shell.test.ts tests/unit/assets/shared-selected-summary.test.ts --runInBand`
- `node --check app/assets/widgets/product-page/templates/modal-slot-template.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/ppb-horizontal-slots-shared-shell.test.ts tests/unit/assets/shared-selected-summary.test.ts` (warnings only)

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Retry PPB Horizontal Slots storefront verification; filled/empty slot card internals still use legacy DOM methods and must be migrated later.

## Loop 15 - Shared FPB Timeline Entry Renderer

Pass/fail: Code/tests/build pass for the non-Standard FPB timeline entry renderer slice. Storefront visual verification is blocked because Chrome DevTools page listing is still timing out.

Tests run:
- `npx jest tests/unit/assets/shared-step-timeline.test.ts --runInBand` (red, before implementation)
- `npx jest tests/unit/assets/shared-step-timeline.test.ts tests/unit/assets/widget-build-shared-modules.test.ts tests/unit/assets/fpb-horizontal-shared-card.test.ts --runInBand`
- `node --check app/assets/widgets/shared/components/step-timeline.js`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/shared-step-timeline.test.ts tests/unit/assets/widget-build-shared-modules.test.ts` (warnings only)

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Standard FPB timeline still has template-specific markup; timeline state selectors and full storefront verification remain pending.

## Loop 16 - PPB Shared Discount Progress

Pass/fail: Code/tests/build pass for the PPB footer discount-progress renderer slice. Storefront visual verification is blocked because Chrome DevTools page listing is still timing out.

Tests run:
- `npx jest tests/unit/assets/ppb-discount-progress-shared.test.ts --runInBand` (red, before implementation)
- `npx jest tests/unit/assets/ppb-discount-progress-shared.test.ts tests/unit/assets/shared-discount-progress.test.ts --runInBand`
- `node --check app/assets/widgets/shared/components/discount-progress.js`
- `node --check app/assets/bundle-widget-product-page.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/ppb-discount-progress-shared.test.ts tests/unit/assets/shared-discount-progress.test.ts` (warnings only)

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Cascade/Cognive custom footer wrappers still route through legacy methods before non-inpage PPB footer progress; storefront verification remains pending.

## Loop 17 - PPB List Shared Selected Entries

Pass/fail: Code/tests pass for moving Cascade/List selected-entry traversal to the shared selector. Storefront visual verification is blocked because Chrome DevTools page listing is still timing out.

Tests run:
- `npx jest tests/unit/assets/shared-step-timeline-state.test.ts tests/unit/assets/ppb-list-selected-entries.test.ts tests/unit/assets/ppb-vertical-slots-shared-shell.test.ts --runInBand`

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Cascade selected drawer rendering still uses legacy DOM construction; migrate it to shared selected rows.

## Loop 18 - PPB Vertical Slots Shared Shell

Pass/fail: Code/tests pass for the vertical modal slot shared-shell path. Storefront visual verification is blocked because Chrome DevTools page listing is still timing out.

Tests run:
- `npx jest tests/unit/assets/shared-step-timeline-state.test.ts tests/unit/assets/ppb-list-selected-entries.test.ts tests/unit/assets/ppb-vertical-slots-shared-shell.test.ts --runInBand`

Visual URLs checked: Blocked by Chrome DevTools timeout.

Screenshots captured: None.

Known follow-ups: Empty/filled/default/free-gift vertical slot internals still use legacy card DOM and need shared slot rendering.

## Loop 19 - Shared FPB Timeline State Selector

Pass/fail: Code/tests pass for moving FPB timeline active/completed/locked class calculation into the shared selector. Chrome mobile smoke passes on the FPB fixture currently loaded in the browser.

Tests run:
- `npx jest tests/unit/assets/shared-step-timeline-state.test.ts tests/unit/assets/shared-step-timeline.test.ts --runInBand`
- `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`
- Included in accumulated focused suite: 29 suites / 114 tests passing.
- `node --check app/assets/widgets/shared/engine/bundle-selectors.js`
- `node --check app/assets/bundle-widget-full-page.js`

Visual URLs checked: `https://agent-5sfidg3m.myshopify.com/pages/wpb-fresh-fpb-template-parity-2026-06-04`

Screenshots captured: `/private/tmp/wpb-refactor-smoke-fpb-mobile-2026-06-11.png`

Known follow-ups: Desktop viewport switching stayed in mobile emulation during this smoke. Full all-template visual matrix remains pending.

## Loop 20 - Shared Cart Line Metadata Helpers

Pass/fail: Code/tests/build pass for the additive shared cart-line metadata helper slice. Storefront smoke confirms FPB and PPB widgets still render after the generated asset build.

Tests run:
- `npx jest tests/unit/assets/shared-cart-lines.test.ts --runInBand` (red, before implementation)
- `npx jest tests/unit/assets/shared-cart-lines.test.ts --runInBand`
- Included in accumulated focused suite: 29 suites / 114 tests passing.
- `node --check app/assets/widgets/shared/engine/cart-lines.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/shared-cart-lines.test.ts` (warnings only)

Visual URLs checked:
- `https://agent-5sfidg3m.myshopify.com/pages/wpb-fresh-fpb-template-parity-2026-06-04`
- `https://agent-5sfidg3m.myshopify.com/products/wpb-fresh-ppb-template-parity-2026-06-04-97524`

Screenshots captured:
- `/private/tmp/wpb-refactor-smoke-fpb-mobile-2026-06-11.png`
- `/private/tmp/wpb-refactor-smoke-ppb-mobile-2026-06-11.png`

Known follow-ups: Cart submission itself remains widget-owned; all-template add-to-cart verification remains pending.

## Loop 21 - FPB/PPB Cart Metadata Integration

Pass/fail: Code/tests/build pass for delegating FPB and PPB cart-line metadata wrappers to the shared helper. Storefront smoke passes for currently open FPB and PPB fixtures; no console warnings/errors and no horizontal overflow were observed.

Tests run:
- `npx jest tests/unit/assets/shared-cart-lines.test.ts tests/unit/assets/bundle-widget-full-page-cart-properties.test.ts tests/unit/assets/bundle-widget-product-page-addons.test.ts tests/unit/assets/bundle-widget-full-page-addons.test.ts --runInBand`
- Accumulated focused suite: 29 suites / 114 tests passing.
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check app/assets/bundle-widget-product-page.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `node --check extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 ...` on modified JS/test files (0 errors, warnings only)

Visual URLs checked:
- `https://agent-5sfidg3m.myshopify.com/pages/wpb-fresh-fpb-template-parity-2026-06-04`
- `https://agent-5sfidg3m.myshopify.com/products/wpb-fresh-ppb-template-parity-2026-06-04-97524`

Screenshots captured:
- `/private/tmp/wpb-refactor-smoke-fpb-mobile-2026-06-11.png`
- `/private/tmp/wpb-refactor-smoke-ppb-mobile-2026-06-11.png`

Known follow-ups: Full cart line construction/submission remains widget-owned; add-to-cart verification on all 8 templates remains pending. Smoke used deployed `3.0.23` assets because no Shopify deploy was run.

## Loop 22 - FPB Template Registry and Normalization

Pass/fail: Code/tests/build pass for the additive full-page template registry slice. Chrome DevTools page listing timed out during this continuation, so no fresh storefront visual verification was added for this loop.

Tests run:
- `npx jest tests/unit/assets/fpb-template-registry.test.ts --runInBand` (red, before implementation)
- `npx jest tests/unit/assets/fpb-template-registry.test.ts --runInBand`
- `node --check app/assets/widgets/full-page/templates/registry.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/fpb-template-registry.test.ts` (warnings only)

Visual URLs checked: None in this loop; Chrome DevTools `list_pages` timed out.

Screenshots captured: None.

Known follow-ups: Current FPB template installers remain prototype-based with runtime CSS; remove them once scoped CSS/renderers are ready.

## Loop 23 - PPB List Selected Drawer Shared Rows

Pass/fail: Code/tests/build pass for migrating Cascade selected drawer item rows to the shared selected-row renderer. Chrome DevTools page listing timed out during this continuation, so no fresh storefront visual verification was added for this loop.

Tests run:
- `npx jest tests/unit/assets/ppb-list-selected-drawer-shared-row.test.ts --runInBand` (red, before implementation)
- `npx jest tests/unit/assets/ppb-list-selected-drawer-shared-row.test.ts tests/unit/assets/shared-selected-summary.test.ts tests/unit/assets/ppb-list-selected-entries.test.ts --runInBand`
- `node --check app/assets/widgets/product-page/templates/cascade-template.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 tests/unit/assets/ppb-list-selected-drawer-shared-row.test.ts tests/unit/assets/shared-selected-summary.test.ts tests/unit/assets/ppb-list-selected-entries.test.ts` (warnings only)

Visual URLs checked: None in this loop; Chrome DevTools `list_pages` timed out.

Screenshots captured: None.

Known follow-ups: Cascade footer message/progress wrapper is still legacy; full PPB List storefront drawer interaction remains pending.

## Loop 24 - FPB Shared Discount Progress

Pass/fail: Code/tests pass for FPB discount progress using the shared renderer. Chrome DevTools page listing timed out during this continuation, so no fresh storefront visual verification was added for this loop.

Tests run:
- `npx jest tests/unit/assets/fpb-discount-progress-shared.test.ts tests/unit/assets/shared-discount-progress.test.ts --runInBand`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check app/assets/widgets/shared/components/discount-progress.js`
- `npx eslint --max-warnings 9999 tests/unit/assets/fpb-discount-progress-shared.test.ts tests/unit/assets/shared-discount-progress.test.ts` (warnings only)

Visual URLs checked: None in this loop; Chrome DevTools `list_pages` timed out.

Screenshots captured: None.

Known follow-ups: Storefront progress behavior still needs all-template visual verification and add-to-cart flow checks.

## Loop 25 - Template Installer Method Maps

Pass/fail: Code/tests/build pass for replacing direct per-method template prototype assignments with exported method maps and registry-level attachment helpers. Storefront visual verification was not repeated for this source-shape-only slice; latest smoke still used deployed `3.0.23` assets because no Shopify deploy was run.

Tests run:
- `npx jest tests/unit/assets/template-installer-methods.test.ts tests/unit/assets/ppb-template-registry-integration.test.ts tests/unit/assets/ppb-template-registry.test.ts tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand`
- Accumulated focused suite: 32 suites / 161 tests passing.
- `node --check` on FPB/PPB template registries and installer modules.
- `node --check` on generated full-page, product-page, and SDK assets.
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 ...` on modified installer/registry/test files (0 errors, warnings only).

Visual URLs checked: None in this loop; no visual behavior intentionally changed.

Screenshots captured: None.

Known follow-ups: Full installer removal, runtime CSS cleanup, all-8-template visual matrix, and add-to-cart verification remain pending.

## Loop 26 - Shared PPB Cart Submit Payload Helper

Pass/fail: Code/tests/build pass for moving PPB EB-compatible multipart cart form construction and bundle-details source extraction into `shared/engine/cart-submit.js`. Transport remains widget-owned and still posts PPB to `/cart/add`.

Tests run:
- `npx jest tests/unit/assets/shared-cart-submit.test.ts tests/unit/assets/bundle-widget-product-page-addons.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts tests/unit/assets/widget-build-shared-modules.test.ts --runInBand`
- Accumulated focused suite: 33 suites / 165 tests passing.
- `node --check app/assets/widgets/shared/engine/cart-submit.js`
- `node --check app/assets/bundle-widget-product-page.js`
- `node --check` on generated full-page, product-page, and SDK assets.
- `npm run build:widgets`
- `npx eslint --max-warnings 9999 ...` on modified cart-submit/widget/test files (0 errors, warnings only).

Visual URLs checked: None in this loop; payload construction was covered by unit/source-contract tests and no storefront visual behavior intentionally changed.

Screenshots captured: None.

Known follow-ups: FPB JSON payload helper extraction, live add-to-cart verification on all 8 templates, and full cart submission smoke remain pending.

## Loop 26 - FPB Compact Runtime CSS Ownership

Pass/fail: Code/tests/build pass for moving the FPB Compact preset runtime layout styles out of JS style-tag injection and into `side-footer-compact.css`. CSS minification initially failed at 100,620 B, then passed after removing the duplicated obsolete desktop `.fpb-i` Compact block from the same template CSS file.

Tests run:
- `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/storefront-template-modularization.test.ts --runInBand`
- `node --check app/assets/widgets/full-page/templates/compact-template.js`
- `npm run minify:assets css`
- `npm run build:widgets`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npx eslint --max-warnings 9999 tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/storefront-template-modularization.test.ts` (warnings only)

Visual URLs checked: None in this loop; Chrome DevTools page listing remained unavailable in this continuation.

Screenshots captured: None.

Known follow-ups: Standard, Classic, and Horizontal still own runtime CSS through template JS style tags; all-8-template visual matrix and add-to-cart verification remain pending.

## Loop 53 - FPB Compact and Horizontal Storefront Parity

Pass/fail: Pass for the current persisted Compact and Horizontal design slice. Compact no longer inherits Horizontal row-card geometry. Horizontal retains row cards and now owns underline category tabs on mobile. Shared widget behavior was not changed.

Tests and checks run:

- `npm run build:widgets`
- `npm run minify:assets css`
- `node --check scripts/build-widget-bundles.js`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `node --check extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- `npx eslint --max-warnings 9999 scripts/build-widget-bundles.js`
- `npm run graphify:rebuild`
- `git diff --check`
- Direct Chrome DevTools MCP geometry and overflow checks at `1440x900`, `1280x800`, `768x1024`, `390x844`, and `360x800`

Visual URLs checked:

- Competitor FPB fixture: `https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/1?page=addProductsPage1&currentFlow=byob`
- Wolfpack FPB preview: bundle `cmr361mz50000v00yrdeyxpf7` on `agent-5sfidg3m.myshopify.com`

Live evidence:

- Widget version `5.0.190` loaded only the shared full-page stylesheet plus the matching Compact or Horizontal preset stylesheet.
- Compact desktop rendered three stacked image-first card columns and a responsive right summary.
- Compact mobile rendered a `370px` grid at `x=10`, two `177.5px` columns, a `15px` gap, stable selected-card height, and zero horizontal overflow at `390x844`.
- Horizontal desktop rendered two row-card columns and a right summary. Mobile rendered one row-card column with underline category tabs and zero horizontal overflow at `390x844`.
- Both designs passed add, quantity controls, maximum enforcement, remove, summary, and navigation checks.
- Both persisted designs completed Add to Cart and reached checkout with the selected bundle line.
- Compact and Horizontal passed all five required viewports with zero positive page overflow; long category labels remain inside contained horizontal scrollers.

Screenshots captured: Raw evidence remains outside the repository under `/private/tmp/fpb-compact-horizontal-parity/`.

Known follow-ups: Run a cache-bypassed post-deploy CDN smoke pass after the operator completes the manual SIT deploy. Standard and Classic remain pending current replay in the canonical verification matrix.

## Loop 50 - FPB Method Module Semantic Names

Pass/fail: Code/tests/build pass for replacing mechanically named FPB method source modules (`chunk-01.js` ... `chunk-19.js`) with responsibility-based module names. The storefront runtime bundle remains generated through `npm run build:widgets`; these files are source modules only, not separately loaded browser chunks.

Renamed source modules:
- `analytics-config-methods.js`
- `initial-render-methods.js`
- `responsive-layout-methods.js`
- `mobile-summary-methods.js`
- `side-panel-methods.js`
- `box-selection-sidebar-methods.js`
- `timeline-banner-methods.js`
- `search-category-methods.js`
- `product-grid-methods.js`
- `product-card-footer-methods.js`
- `footer-selection-methods.js`
- `validation-addons-methods.js`
- `step-footer-methods.js`
- `discount-modal-methods.js`
- `product-processing-methods.js`
- `modal-product-methods.js`
- `selection-navigation-methods.js`
- `runtime-cart-settings-methods.js`
- `tier-floating-runtime-methods.js`

Tests run:
- `rg -n "FullPageMethodChunk|chunk-" app/assets scripts tests docs/refactor "internal docs"` (no matches)
- `npm run build:widgets`
- `node --check app/assets/bundle-widget-full-page.js`
- `find app/assets/widgets/full-page/methods -maxdepth 1 -type f -name '*.js' -print0 | xargs -0 -n1 node --check`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/widget-build-shared-modules.test.ts tests/unit/assets/fpb-template-registry.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand --silent`
- `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js app/assets/widgets/full-page/methods/*.js scripts/build-widget-bundles.js` (0 errors; app/assets and scripts files are ignored by existing ESLint config)

Visual URLs checked: None in this loop; source-module rename only.

Screenshots captured: None.

Known follow-ups: Full live all-8-template storefront matrix remains deploy-gated until manual SIT deploy publishes widget `3.0.24` and Shopify CDN propagation completes.

## Loop 52 - Product Details Modal Gallery Removal

Pass/fail: Code/tests/build/minify pass for removing the overbuilt Bundle Product Modal gallery path. Live EB evidence from `yash-wolfpack.myshopify.com/apps/gbb/easybundle/2?page=addProductsPage1&currentFlow=byob` showed the landing-page quick-view modal (`gbbProductVariantModalMainContainer`) contains one product image, product title, and description, with no modal thumbnails, image counter, previous/next carousel controls, or gallery list. Wolfpack now mirrors that simpler product-details modal shape while preserving variant selection, quantity controls, Add To Box, and variant-specific image replacement.

Removed stale code/files:
- Deleted `app/assets/widgets/full-page/modal/gallery-methods.js`
- Removed `BundleModalGalleryMethods` import/composition from `app/assets/bundle-modal-component.js`
- Removed modal carousel buttons, thumbnail container, image counter, image swipe navigation, `navigateCarousel()`, and `selectedImageIndex`
- Removed carousel/thumbnail CSS from `app/assets/widgets/full-page-css/base/product-modal-shell.css`
- Removed the deleted gallery module from `scripts/build-widget-bundles.js`

Tests run:
- EB Chrome inspection: modal image count `1`, `carouselLike: []`, direct children limited to product image/title/description plus hidden add/quantity action nodes
- `rg -n "BundleModalGalleryMethods|gallery-methods|modal-carousel|modal-thumbnails|modal-thumbnail|modal-image-counter|navigateCarousel|selectedImageIndex|modal gallery|Image gallery" app/assets scripts extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js extensions/bundle-builder/assets/bundle-widget-full-page.css -S` (no matches)
- `node --check app/assets/bundle-modal-component.js && node --check app/assets/widgets/full-page/modal/variant-methods.js && node --check scripts/build-widget-bundles.js`
- `npm run build:widgets`
- `npm run minify:assets css`
- `npx jest tests/unit/assets/fpb-runtime-config-surface.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/widget-build-shared-modules.test.ts --runInBand --silent`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js && node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`

Size evidence:
- `app/assets/bundle-modal-component.js` is now 373 lines.
- `app/assets/widgets/full-page-css/base/product-modal-shell.css` is now 292 lines.
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` is now 386,381 B.
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` is now 66,800 B.

Visual URLs checked:
- `https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/2?page=addProductsPage1&currentFlow=byob` for EB product-details modal structure.

Screenshots captured: None.

Known follow-ups: Full live Wolfpack all-8-template storefront matrix remains deploy-gated until manual SIT deploy publishes widget `3.0.24` and Shopify CDN propagation completes.

## Loop 51 - Base CSS Module Semantic Names

Pass/fail: Code/tests/minify pass for replacing mechanically named base CSS source modules (`part-*.css`) with responsibility-based module names. These files remain source-only imports; the Shopify storefront continues to load the generated extension CSS assets.

Renamed FPB base CSS modules:
- `layout-tiers-timeline.css`
- `steps-header-banners.css`
- `search-category-product-grid.css`
- `product-actions-loading.css`
- `product-modal-shell.css`
- `product-modal-controls.css`
- `toast-sidebar-shell.css`
- `sidebar-totals-discounts.css`
- `floating-badge-sidebar-progress.css`
- `loading-spinner-keyframes.css`

Renamed PPB base CSS modules:
- `layout-steps-summary.css`
- `modal-shell-tabs.css`
- `modal-product-grid.css`
- `modal-footer-empty-toast.css`
- `discount-footer-shared.css`
- `footer-selection-loading.css`
- `bottom-sheet-modal.css`
- `slot-cards-default-products.css`
- `quantity-pills-skeletons.css`

Tests run:
- `find app/assets/widgets/full-page-css/base app/assets/widgets/product-page-css/base -maxdepth 1 -type f -print | sort`
- `rg -n "base/part-|part-[0-9]+\\.css" app/assets scripts docs/refactor "internal docs"` (only historical ledger references remain)
- `npm run minify:assets css`
- `find app/assets/widgets/full-page-css/base app/assets/widgets/product-page-css/base -type f -name '*.css' -exec wc -l {} + | sort -nr | head -25` (largest source module: `sidebar-totals-discounts.css` at 479 lines)
- `wc -c extensions/bundle-builder/assets/bundle-widget-full-page.css extensions/bundle-builder/assets/bundle-widget-full-page-standard.css extensions/bundle-builder/assets/bundle-widget-full-page-classic.css extensions/bundle-builder/assets/bundle-widget-full-page-compact.css extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css extensions/bundle-builder/assets/bundle-widget.css extensions/bundle-builder/assets/bundle-widget-product-page-cascade.css extensions/bundle-builder/assets/bundle-widget-product-page-cognive.css extensions/bundle-builder/assets/bundle-widget-product-page-modal.css` (all under Shopify's 100,000 B asset limit)
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand --silent`
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

Visual URLs checked: None in this loop; source-module rename only.

Screenshots captured: None.

Known follow-ups: Full live all-8-template storefront matrix remains deploy-gated until manual SIT deploy publishes widget `3.0.24` and Shopify CDN propagation completes.

## Loop 47 - Storefront Controller Decomposition and Source-Size Cleanup

Pass/fail: Code/tests/build pass for decomposing the oversized PPB and FPB storefront entry controllers into small plain JavaScript method modules. All `.js` and `.css` files under `app/assets` and `scripts` are now at or below the 500-line source target. Runtime `<style>` injection checks across widget sources return no matches. Stale app-proxy widget asset Remix routes remain deleted; storefront assets are loaded from Shopify extension `asset_url` paths.

Tests run:
- `npm run build:widgets`
- `npm run minify:assets css`
- `node --check` for raw PPB/FPB entry files, extracted method modules, build/minifier scripts, and generated widget bundles
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/shared-product-card.test.ts tests/unit/assets/shared-selected-summary.test.ts tests/unit/assets/widget-build-shared-modules.test.ts tests/unit/assets/fpb-runtime-config-surface.test.ts --runInBand`
- `find app/assets scripts -type f \( -name '*.js' -o -name '*.css' \) ...` (no files over 500 lines)
- `rg -n '<style>|</style>|document\.createElement\(["'\'']style["'\'']\)|style\.textContent|appendChild\(style\)' app/assets/bundle-widget-product-page.js app/assets/bundle-widget-full-page.js app/assets/widgets -S` (no matches)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

Size evidence:
- `app/assets/bundle-widget-full-page.js` - 342 lines
- `app/assets/bundle-widget-product-page.js` - 389 lines
- FPB method chunks - max 447 lines
- PPB method modules - max 472 lines
- `scripts/build-widget-bundles.js` - under 500 lines after target-list additions
- Largest CSS deploy assets after minify: `bundle-widget-full-page.css` 67.2 KB, `bundle-widget.css` 61.1 KB, all template CSS assets below Shopify's 100,000 B app-block limit

Visual URLs checked: None in this loop. Chrome automation backend was unavailable (`agent.browsers.list()` returned `[]` and `agent.browsers.get('chrome')` returned "Browser is not available: chrome") even though Chrome was running locally, so storefront visual verification remains blocked by tooling rather than skipped.

Screenshots captured: None.

Known follow-ups: Complete live storefront visual matrix for all 8 templates once Chrome automation is available and the local extension assets are deployed to Shopify CDN. Do not run `shopify app deploy` autonomously.

## Loop 39 - Stale Widget Asset Route Removal

Pass/fail: Code/tests/build pass. Removed stale Remix asset routes that served widget JavaScript/CSS from the app server, including raw widget sources, generated full-page assets, and the old shared component barrel route. Current storefront architecture loads widget JS/CSS from Shopify theme-extension assets via Liquid `asset_url`; app proxy remains for API/data routes only.

Files removed:
- `app/routes/assets/assets.bundle-widget-components.ts`
- `app/routes/assets/assets.bundle-widget-components[.]js.ts`
- `app/routes/assets/assets.bundle-widget-full-page-bundled[.]js.ts`
- `app/routes/assets/assets.bundle-widget-full-page.ts`
- `app/routes/assets/assets.bundle-widget-full-page[.]css.ts`
- `app/routes/assets/assets.bundle-widget-full-page[.]js.ts`
- `app/routes/assets/assets.bundle-widget-full.ts`
- `app/routes/assets/assets.bundle-widget-product-page.ts`
- `app/routes/assets/assets.bundle-widget-product-page[.]js.ts`

Architecture notes updated:
- `internal docs/Architecture/Widget Architecture.md`
- `internal docs/Operations/Build Process.md`

Tests run:
- `rg -n "assets\\.bundle-widget-components|assets\\.bundle-widget-full-page-bundled|assets\\.bundle-widget-full-page\\[\\.\\]css|assets\\.bundle-widget-full-page\\[\\.\\]js|assets\\.bundle-widget-product-page\\[\\.\\]js|assets\\.bundle-widget-full\\b|assets\\.bundle-widget-product-page\\b|assets\\.bundle-widget-full-page\\b" app tests internal\ docs docs/app-nav-map -S` (no matches)
- `find app/routes/assets -maxdepth 1 -type f -name '*bundle-widget*' -print | sort` (no stale widget asset routes)
- `node --check app/assets/bundle-widget-full-page.js && node --check app/assets/bundle-widget-product-page.js && node --check app/assets/widgets/shared/default-loading-animation.js && node --check scripts/build-widget-bundles.js && node --check scripts/minify-assets.js`
- `npm run minify:assets css`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/lib/admin-configuration-surfaces.test.ts tests/unit/assets/loading-overlay.test.ts --runInBand`
- `npm run build:widgets`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js && node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js && node --check extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- `npx eslint --max-warnings 9999 ...` on modified widget/Admin/test files (0 errors, existing warnings only)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

Skipped:
- `npm run typecheck` because this repo has no `typecheck` script.

Visual URLs checked: None; route cleanup is source architecture cleanup and generated extension assets still need deploy before CDN verification.

Known follow-ups: Continue all-8-template fixture verification.

## Loop 40 - Skeleton CSS Ownership

Pass/fail: Code/tests/build pass. Removed the last static `<style>` blocks from the full-page and product-page widget controllers. Skeleton loading cards now render DOM only from JS; their styling lives in the source CSS assets and is rebuilt into the Shopify extension CSS outputs.

Tests run:
- `rg -n '<style>|</style>|document\.createElement\(['"'"']style['"'"']\)|style\.textContent|appendChild\(style\)' app/assets/bundle-widget-product-page.js app/assets/bundle-widget-full-page.js app/assets/widgets -S` (no matches)
- `node --check app/assets/bundle-widget-full-page.js && node --check app/assets/bundle-widget-product-page.js`
- `npm run minify:assets css`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`
- `npm run build:widgets`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js && node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js && node --check extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS/JS size evidence:
- `app/assets/bundle-widget-full-page.js` — 7,567 lines
- `app/assets/bundle-widget-product-page.js` — 4,139 lines
- `app/assets/widgets/full-page-css/bundle-widget-full-page.css` — 3,967 lines
- `app/assets/widgets/product-page-css/bundle-widget.css` — 3,583 lines
- `app/assets/widgets/full-page-css/templates/side-footer-classic.css` — 1,023 lines
- PPB/other template CSS files remain under 500 lines.

Visual URLs checked: None; browser automation backend is unavailable in this session (`agent.browsers.list()` returned no backends).

Known follow-ups: Split oversized controller/base CSS files and `side-footer-classic.css`; continue all-8-template fixture verification once Chrome backend is available.

## Loop 41 - Classic CSS Duplicate Cleanup

Pass/fail: Code/tests/build pass. Removed redundant mobile Classic CSS blocks that repeated desktop declarations exactly and inherit cleanly: selected card/overlay basics, image fit, content wrapper base, price-row base, variant hiding, add-button base, and duplicated CTA placement. `side-footer-classic.css` now has zero exact duplicate selector/body blocks by the local duplicate scan.

Tests run:
- Exact duplicate scan for `app/assets/widgets/full-page-css/templates/side-footer-classic.css` (result: `duplicateExact=0`)
- `npm run minify:assets css`
- `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/fpb-classic-shared-contract.test.ts tests/unit/assets/fpb-classic-shared-components.test.ts --runInBand`

CSS size evidence:
- `app/assets/widgets/full-page-css/templates/side-footer-classic.css` — 952 lines
- `extensions/bundle-builder/assets/bundle-widget-full-page-classic.css` — 24.8 KB after minification

Visual URLs checked: None; browser automation backend is unavailable in this session.

Known follow-ups: `side-footer-classic.css` remains over 500 lines and needs structural splitting or further ownership cleanup. Continue all-8-template fixture verification once Chrome backend is available.

## Loop 42 - Product Page Base CSS Duplicate Cleanup

Pass/fail: Code/tests/build pass. Removed redundant PPB base CSS: the `max-width:480px` modal grid rule duplicated the existing `max-width:768px` two-column rule, and the second `.bw-slot-card__image` block repeated the earlier filled-slot image rule. Left remaining exact duplicate bodies alone because they are keyframe endpoints for prefixed or direction-specific animations.

Tests run:
- Brace/depth and exact duplicate scan for `app/assets/widgets/product-page-css/bundle-widget.css`
- `npm run minify:assets css`
- `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts tests/unit/assets/storefront-template-modularization.test.ts --runInBand`

CSS size evidence:
- `extensions/bundle-builder/assets/bundle-widget.css` — 61.1 KB after minification

Visual URLs checked: None; browser automation backend is unavailable in this session.

Known follow-ups: Continue splitting oversized base CSS and controller files. Continue all-8-template fixture verification once Chrome backend is available.

## Loop 44 - Base Widget CSS Source Split

Pass/fail: Code/tests/build pass. Split both oversized base CSS source files into ordered local imports under `full-page-css/base/` and `product-page-css/base/`. The entry files now only list imports, and the existing minifier import resolver emits the same single Shopify extension CSS assets. Updated critical CSS contract tests to resolve local imports instead of forcing all shared classes to live in one source file.

Files created:
- `app/assets/widgets/full-page-css/base/part-01.css` through `part-10.css`
- `app/assets/widgets/product-page-css/base/part-01.css` through `part-09.css`

Tests run:
- `npm run minify:assets css`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/shared-product-card.test.ts tests/unit/assets/shared-selected-summary.test.ts --runInBand`
- `node --check scripts/minify-assets.js && node --check app/assets/bundle-widget-full-page.js && node --check app/assets/bundle-widget-product-page.js`
- CSS split line-count check for FPB/PPB base files
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS size evidence:
- `bundle-widget-full-page.css` entry — 11 lines
- `full-page-css/base/part-*.css` — each <= 480 lines
- `bundle-widget.css` entry — 10 lines
- `product-page-css/base/part-*.css` — each <= 444 lines
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — 67.2 KB after minification
- `extensions/bundle-builder/assets/bundle-widget.css` — 61.1 KB after minification

Visual URLs checked: None; browser automation backend is unavailable in this session.

Known follow-ups: Controller JS files remain oversized (`bundle-widget-full-page.js`, `bundle-widget-product-page.js`). Continue all-8-template fixture verification once Chrome backend is available.

## Loop 45 - Base CSS Import Contract Fix

Pass/fail: Code/tests/build pass. After the base CSS split, updated critical source-contract tests to resolve local CSS imports recursively. This preserves behavior-critical assertions for shared product-card, selected-row, selected-slot, and PPB runtime presentation classes without forcing those classes back into oversized entry CSS files.

Tests run:
- `npm run minify:assets css`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/shared-product-card.test.ts tests/unit/assets/shared-selected-summary.test.ts --runInBand`
- `node --check scripts/minify-assets.js && node --check app/assets/bundle-widget-full-page.js && node --check app/assets/bundle-widget-product-page.js`

CSS size evidence:
- All files under `app/assets/widgets/full-page-css/base/` and `app/assets/widgets/product-page-css/base/` are under 500 lines.
- Generated CSS remains under Shopify's 100,000 B asset limit.

Visual URLs checked: None; browser automation backend is unavailable in this session.

Known follow-ups: Top-level controller JS files and `bundle-modal-component.js` remain oversized. Continue JS extraction and all-8-template fixture verification once Chrome backend is available.

## Loop 46 - Bundle Modal Method Split

Pass/fail: Code/tests/build pass. Split `bundle-modal-component.js` by moving gallery/image methods and variant-selector methods into full-page modal method modules, then wired `scripts/build-widget-bundles.js` to inline those modules before the modal class. The public browser contract remains `window.BundleProductModal`.

Files created:
- `app/assets/widgets/full-page/modal/gallery-methods.js`
- `app/assets/widgets/full-page/modal/variant-methods.js`

Tests run:
- `node --check app/assets/bundle-modal-component.js && node --check app/assets/widgets/full-page/modal/gallery-methods.js && node --check app/assets/widgets/full-page/modal/variant-methods.js && node --check scripts/build-widget-bundles.js`
- `npm run build:widgets`
- `npx jest tests/unit/assets/widget-build-shared-modules.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/fpb-runtime-config-surface.test.ts --runInBand`
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

Size evidence:
- `app/assets/bundle-modal-component.js` — 426 lines
- `app/assets/widgets/full-page/modal/gallery-methods.js` — 135 lines
- `app/assets/widgets/full-page/modal/variant-methods.js` — 377 lines
- `scripts/build-widget-bundles.js` — 500 lines

Visual URLs checked: None; browser automation backend is unavailable in this session.

Known follow-ups: Top-level FPB/PPB controller JS files remain oversized. Continue JS extraction and all-8-template fixture verification once Chrome backend is available.

## Loop 43 - Classic CSS Source Split

Pass/fail: Code/tests/build pass. Split `side-footer-classic.css` into a small import entry and four scoped source modules so Classic source CSS no longer violates the 500-line target. `scripts/minify-assets.js` already resolves local `@import` statements, so the Shopify extension target still builds as a single `bundle-widget-full-page-classic.css` asset.

Files created:
- `app/assets/widgets/full-page-css/templates/classic/base.css`
- `app/assets/widgets/full-page-css/templates/classic/desktop-products.css`
- `app/assets/widgets/full-page-css/templates/classic/desktop-sidebar.css`
- `app/assets/widgets/full-page-css/templates/classic/mobile.css`

Tests run:
- `npm run minify:assets css`
- `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/fpb-classic-shared-contract.test.ts tests/unit/assets/fpb-classic-shared-components.test.ts tests/unit/assets/storefront-template-modularization.test.ts --runInBand`
- CSS split line-count check for Classic files
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS size evidence:
- `side-footer-classic.css` entry — 5 lines
- `classic/base.css` — 34 lines
- `classic/desktop-products.css` — 333 lines
- `classic/desktop-sidebar.css` — 272 lines
- `classic/mobile.css` — 313 lines
- `extensions/bundle-builder/assets/bundle-widget-full-page-classic.css` — 24.8 KB after minification

Visual URLs checked: None; browser automation backend is unavailable in this session.

Known follow-ups: Continue splitting oversized base CSS and controller files. Continue all-8-template fixture verification once Chrome backend is available.

## Loop 36 - Default Spinner Loading Animation

Pass/fail: Code/tests/build pass for restoring the storefront default loading animation to a CSS spinner while preserving merchant GIF override behavior. `createDefaultLoadingAnimation()` now creates only a spinner DOM node and no longer injects runtime styles. Spinner CSS lives in the normal widget CSS assets for both FPB and PPB. Bundle configure pages now show the custom GIF preview when `loadingGif` is set, otherwise they show the default spinner preview. The global Settings Images & GIFs surface now models EB-style loading defaults as `loadingSpinner` preview fields instead of editable fake `Loading_Spinner.gif` text values.

Tests run:
- `node --check app/assets/widgets/shared/default-loading-animation.js && node --check app/assets/bundle-widget-full-page.js && node --check app/assets/bundle-widget-product-page.js`
- `npm run build:widgets`
- `npm run minify:assets css`
- `rg -n "default-loading-animation\\.json|bundle-dot-pulse|Lottie|three-dot|bundle-loading-overlay__default-animation|bundle-default-loading-keyframes" app scripts extensions tests -S` (no matches after rebuild)
- `npx jest tests/unit/lib/admin-configuration-surfaces.test.ts tests/unit/assets/loading-overlay.test.ts --runInBand`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js && node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js && node --check extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- `npx eslint --max-warnings 9999 app/lib/admin-configuration-surfaces.ts app/routes/app/app.settings.tsx 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx' 'app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx' tests/unit/lib/admin-configuration-surfaces.test.ts` (warnings only)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS/JS size evidence:
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — 67,957 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-standard.css` — 30,922 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-classic.css` — 27,257 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-compact.css` — 2,790 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css` — 10,821 B
- `extensions/bundle-builder/assets/bundle-widget.css` — 95,990 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — 390.2 KB after minification
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` — 247.2 KB after minification

Visual URLs checked: None in this loop; source and generated assets are updated locally but not deployed to Shopify CDN.

Screenshots captured: None.

Known follow-ups: PPB CSS remains close to Shopify's 100,000 B limit at 95,990 B. `side-footer-classic.css` remains the largest FPB template source file at 1028 lines. All-8-template visual matrix and add-to-cart verification remain pending.

## Loop 37 - Classic Sidebar Tier CTA Conflict Removal

Pass/fail: Code/tests/build pass for removing a real Classic FPB JS/CSS conflict. Classic desktop previously rendered `fpb-sidebar-tier-cta` and then hid it through `side-footer-classic.css`. The sidebar render path now skips the tier CTA for Classic desktop directly, matching the existing visible behavior without carrying a hidden DOM node and hide-only CSS rule. The redundant Classic hide block for `fpb-sidebar-tier-cta`, `side-panel-free-gift`, and `side-panel-addon-message` was removed.

Tests run:
- `node --check app/assets/bundle-widget-full-page.js`
- `npm run minify:assets css`
- `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`
- `npm run build:widgets`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js && node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js && node --check extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js tests/unit/assets/bundle-widget-full-page-template-layout.test.ts` (warnings only; raw widget JS is ignored by ESLint config)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS/JS size evidence:
- `app/assets/widgets/full-page-css/templates/side-footer-classic.css` — 1023 lines
- `extensions/bundle-builder/assets/bundle-widget-full-page-classic.css` — 27,103 B
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — 67,957 B
- `extensions/bundle-builder/assets/bundle-widget.css` — 95,990 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — 390.2 KB after minification

Visual URLs checked: None in this loop; visible behavior is preserved by moving an existing hide decision from CSS to render gating.

Screenshots captured: None.

Known follow-ups: PPB CSS remains close to Shopify's 100,000 B limit at 95,990 B. `side-footer-classic.css` is still above the 500-line source target. All-8-template visual matrix and add-to-cart verification remain pending.

## Loop 38 - PPB Template CSS Asset Split

Pass/fail: Code/tests/build pass for applying the FPB CSS-size strategy to PPB. `bundle-widget.css` no longer imports all PPB template CSS. The minifier now emits separate PPB template assets for Cascade/List, Cognive/Grid, and Modal/Slots. `bundle-product-page.liquid` exposes `window.__WOLFPACK_PPB_TEMPLATE_CSS_URLS__`, and the product-page widget loads only the active template stylesheet after resolving `PDP_INPAGE`/`PDP_MODAL` and the design preset. This solves the PPB 100,000 B Shopify CSS limit risk without minifying more aggressively or hiding dead CSS in JS.

Tests run:
- `node --check app/assets/bundle-widget-product-page.js && node --check scripts/minify-assets.js`
- `npm run minify:assets css`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand`
- `npm run build:widgets`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js && node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js && node --check extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- `npx eslint --max-warnings 9999 scripts/minify-assets.js tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts` (warnings only; script is ignored by ESLint config)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS/JS size evidence:
- `extensions/bundle-builder/assets/bundle-widget.css` — 61,745 B
- `extensions/bundle-builder/assets/bundle-widget-product-page-cascade.css` — 10,500 B
- `extensions/bundle-builder/assets/bundle-widget-product-page-cognive.css` — 9,282 B
- `extensions/bundle-builder/assets/bundle-widget-product-page-modal.css` — 14,463 B
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — 67,957 B
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` — 248.3 KB after minification

Visual URLs checked: None in this loop; local generated assets need deploy before Shopify CDN storefront verification can prove active-template CSS loading on live PPB fixtures.

Screenshots captured: None.

Known follow-ups: The all-8-template visual matrix and add-to-cart verification remain pending. Broader cleanup should continue removing old CSS-source visual tests where they do not protect storefront behavior.

## Loop 35 - Behavior-Scoped Template Tests

Pass/fail: Code/tests pass after removing non-critical CSS/layout assertions from the touched FPB template tests. The remaining assertions cover storefront-critical contracts only: active template CSS asset loading, no runtime template style-tag injection, selected-slot state/data routing, shared product-card renderer usage, saved template/preset normalization, and Standard sidebar validation behavior.

Tests run:
- `rg -n "readFullPageStyles|grid-template|font-size|height:|width:|border-radius|padding|margin|color:|background:|box-shadow|toContain\\(\\\"\\.|toContain\\('\\.|\\.css" tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/storefront-template-modularization.test.ts`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`
- `npx eslint --max-warnings 9999 tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/storefront-template-modularization.test.ts` (warnings only)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

Visual URLs checked: None in this loop; this was a test-contract cleanup only.

Screenshots captured: None.

Known follow-ups: Broad repo still has older visual/CSS-source tests outside this loop. `side-footer-classic.css` remains the largest FPB template source file at 1028 lines and should be the next CSS cleanup target.

## Loop 30 - FPB Template CSS Asset Split

Pass/fail: Code/tests/build pass for splitting FPB template CSS out of the monolithic Shopify app-block CSS asset. `bundle-widget-full-page.css` now remains the shared full-page base asset, while the minifier emits one deploy asset per FPB preset: Standard, Classic, Compact, and Horizontal. The full-page section block and app-embed hydration path expose a preset-to-asset URL map, and the full-page widget loads the active preset stylesheet when it applies the normalized preset marker.

Tests run:
- `npm run minify:assets css`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check scripts/minify-assets.js`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`
- `wc -c extensions/bundle-builder/assets/bundle-widget-full-page.css extensions/bundle-builder/assets/bundle-widget-full-page-standard.css extensions/bundle-builder/assets/bundle-widget-full-page-classic.css extensions/bundle-builder/assets/bundle-widget-full-page-compact.css extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css extensions/bundle-builder/assets/bundle-widget.css`
- `npm run build:widgets`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js scripts/minify-assets.js tests/unit/assets/storefront-template-modularization.test.ts` (warnings only; changed JS files are ignored by repo ESLint config)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS size evidence:
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — 67,919 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-standard.css` — 4,606 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-classic.css` — 30,365 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-compact.css` — 2,790 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css` — 4,973 B
- `extensions/bundle-builder/assets/bundle-widget.css` — 95,952 B

Visual URLs checked: None in this loop; this local theme-extension asset split requires a Shopify app deploy before CDN storefront verification can prove the new CSS loading path.

Screenshots captured: None.

Known follow-ups: `side-footer-classic.css` remains over the 500-line source target after the prior Classic extraction and should be reduced/split in a later loop. Base full-page CSS is also still a legacy oversized source file. Standard and Horizontal still have runtime style-tag CSS; all-8-template visual matrix and add-to-cart verification remain pending.

## Loop 31 - FPB Classic Stale Sidebar Row CSS Cleanup

Pass/fail: Code/tests/build pass for removing stale Classic-scoped sidebar row and skeleton CSS. Classic desktop now renders the shared `classic-sidebar-slots bw-selected-slots--classic-sidebar` selected-slots primitive, so the old `.fpb-preset-classic .side-panel-products`, `.side-panel-product-row`, `.side-panel-product-info`, `.side-panel-product-action`, and `.side-panel-skeleton-*` rules were redundant and belonged to the older Standard/Horizontal row path. Removed the now-unused `--classic-sidebar-slot-size` variable as well.

Tests run:
- `npm run minify:assets css`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/fpb-classic-shared-components.test.ts --runInBand` (initial red: Classic source-contract test still expected stale `.side-panel-products`; updated it to assert `classic-sidebar-slots` and absence of Classic-scoped row/skeleton selectors)
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/fpb-classic-shared-components.test.ts --runInBand`
- `npx eslint --max-warnings 9999 tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/storefront-template-modularization.test.ts` (warnings only)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS size evidence:
- `app/assets/widgets/full-page-css/templates/side-footer-classic.css` — 1,028 lines after cleanup
- `extensions/bundle-builder/assets/bundle-widget-full-page-classic.css` — 27,257 B
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — 67,919 B
- `extensions/bundle-builder/assets/bundle-widget.css` — 95,952 B

Visual URLs checked: None in this loop; this was a source/static CSS cleanup for a locally generated extension asset that still needs deployment before CDN storefront verification.

Screenshots captured: None.

Known follow-ups: `side-footer-classic.css` is still over the 500-line target and needs another reduction/split pass. Base full-page CSS is still oversized. Standard and Horizontal still have runtime style-tag CSS; all-8-template visual matrix and add-to-cart verification remain pending.

## Loop 32 - FPB Standard Runtime CSS Extraction

Pass/fail: Code/tests/build pass for moving Standard/DEFAULT runtime CSS out of `standard-template.js` and into the split Standard template CSS asset. `standard-template.js` now follows the no-op marker pattern used by Classic/Compact, and `side-footer-standard.css` owns the Standard base geometry, timeline, remaining parity, sidebar, and mobile summary tray rules.

Tests run:
- `node --check app/assets/widgets/full-page/templates/standard-template.js`
- `npm run minify:assets css`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand` (initial red: one exact minified mobile selector assertion was too brittle after moving CSS into readable source; updated to selector/property fragments)
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`
- `npm run build:widgets`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `rg -n "wpb-fpb-standard-runtime-styles|document.head.appendChild\\(style\\)" app/assets/widgets/full-page/templates/standard-template.js extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (no Standard runtime style ID remains; remaining `appendChild(style)` hits are other dynamic/runtime style paths)
- `npx eslint --max-warnings 9999 tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/storefront-template-modularization.test.ts` (warnings only)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS/JS size evidence:
- `app/assets/widgets/full-page/templates/standard-template.js` — 12 lines
- `app/assets/widgets/full-page-css/templates/side-footer-standard.css` — 391 lines
- `extensions/bundle-builder/assets/bundle-widget-full-page-standard.css` — 29,870 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-classic.css` — 27,257 B
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — 67,919 B
- `extensions/bundle-builder/assets/bundle-widget.css` — 95,952 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — 398.0 KB after minification

Visual URLs checked: None in this loop; local generated assets need deploy before Shopify CDN storefront verification can prove the moved Standard CSS path.

Screenshots captured: None.

Known follow-ups: Horizontal still owns runtime style-tag CSS. `side-footer-classic.css` remains over the 500-line source target. Base full-page CSS is still oversized. All-8-template visual matrix and add-to-cart verification remain pending.

## Loop 33 - FPB Horizontal Runtime CSS Extraction

Pass/fail: Code/tests/build pass for moving Horizontal runtime CSS out of `horizontal-template.js` and into the split Horizontal template CSS asset. `horizontal-template.js` now follows the no-op marker pattern used by the other FPB templates, and `side-footer-horizontal.css` owns the horizontal product-title clamp, expanded-variant title behavior, and mobile summary tray rules.

Tests run:
- `node --check app/assets/widgets/full-page/templates/horizontal-template.js`
- `npm run minify:assets css`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand` (initial red: Horizontal source-contract test still expected CSS strings in JS; updated it to assert static CSS ownership)
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`
- `npm run build:widgets`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `rg -n "wpb-fpb-(standard|classic|compact|horizontal)-runtime-styles|document.createElement\\('style'\\)|document.head.appendChild\\(style\\)" app/assets/widgets/full-page/templates extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (no FPB template runtime style IDs remain; remaining style-tag hits are non-template dynamic helpers)
- `npx eslint --max-warnings 9999 tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/storefront-template-modularization.test.ts` (warnings only)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS/JS size evidence:
- `app/assets/widgets/full-page/templates/horizontal-template.js` — 12 lines
- `app/assets/widgets/full-page-css/templates/side-footer-horizontal.css` — 313 lines
- `extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css` — 10,821 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-standard.css` — 29,870 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-classic.css` — 27,257 B
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — 67,919 B
- `extensions/bundle-builder/assets/bundle-widget.css` — 95,952 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — 392.0 KB after minification

Visual URLs checked: None in this loop; local generated assets need deploy before Shopify CDN storefront verification can prove the moved Horizontal CSS path.

Screenshots captured: None.

Known follow-ups: Remaining full-page style-tag injections are non-template dynamic helpers: paged timeline CSS in `app/assets/bundle-widget-full-page.js` and default loading animation CSS in `app/assets/widgets/shared/default-loading-animation.js`. `side-footer-classic.css` remains over the 500-line source target. Base full-page CSS is still oversized. All-8-template visual matrix and add-to-cart verification remain pending.

## Loop 34 - Full-Page Paged Timeline CSS Extraction

Pass/fail: Code/tests/build pass for removing the remaining single-line full-page widget runtime CSS injection. The paged Standard timeline CSS moved from `ensureTimelinePagingStyles()` in `app/assets/bundle-widget-full-page.js` to `app/assets/widgets/full-page-css/templates/side-footer-standard.css`. The JS helper now remains as a no-op compatibility method while render code continues to toggle `step-timeline--paged` and navigation arrow classes.

Tests run:
- `node --check app/assets/bundle-widget-full-page.js`
- `npm run minify:assets css`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`
- `npm run build:widgets`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `rg -n "document\\.createElement\\(['\\\"]style['\\\"]\\)|style\\.textContent|document\\.head\\.appendChild\\(style\\)" app/assets/widgets/full-page/templates app/assets/bundle-widget-full-page.js app/assets/widgets/product-page/templates app/assets/bundle-widget-product-page.js app/assets/widgets/shared/default-loading-animation.js extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` (only the shared default loading animation remains)
- `npx eslint --max-warnings 9999 tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/storefront-template-modularization.test.ts` (warnings only)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS/JS size evidence:
- `app/assets/widgets/full-page-css/templates/side-footer-standard.css` — 444 lines
- FPB template installers — 12 lines each
- `extensions/bundle-builder/assets/bundle-widget-full-page-standard.css` — 30,922 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css` — 10,821 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-classic.css` — 27,257 B
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — 67,919 B
- `extensions/bundle-builder/assets/bundle-widget.css` — 95,952 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — 391.1 KB after minification

Visual URLs checked: None in this loop; local generated assets need deploy before Shopify CDN storefront verification can prove the moved paged timeline CSS path.

Screenshots captured: None.

Known follow-ups: The only remaining widget style-tag injection is `app/assets/widgets/shared/default-loading-animation.js`, which is tiny and multiline. `side-footer-classic.css` remains over the 500-line source target. Base full-page CSS is still oversized. All-8-template visual matrix and add-to-cart verification remain pending.

## Loop 48 - Widget Source Split, CSS Asset Split, and Stale Route Removal

Pass/fail: Code/tests/build pass for the widget source-size refactor. FPB and PPB controller code is split into method modules, shared cart/timeline/product-card helpers are included before widget entries, template CSS is emitted as standalone app-extension assets, and stale app-proxy widget asset routes were removed. Runtime widget CSS injection scans are clean; default loading animation styling now lives in widget CSS assets. `WIDGET_VERSION` bumped to `3.0.24` for the next Shopify deploy.

Tests run:
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/shared-product-card.test.ts tests/unit/assets/shared-selected-summary.test.ts tests/unit/assets/widget-build-shared-modules.test.ts tests/unit/assets/fpb-runtime-config-surface.test.ts tests/unit/assets/bundle-widget-full-page-category-hydration.test.ts tests/unit/assets/bundle-widget-full-page-addons.test.ts tests/unit/assets/widget-cart-lines-integration.test.ts tests/unit/assets/shared-cart-submit.test.ts tests/unit/assets/bundle-widget-product-page-addons.test.ts tests/unit/assets/shared-cart-lines.test.ts tests/unit/assets/bundle-widget-full-page-summary-images.test.ts tests/unit/assets/bundle-widget-product-slots-enabled.test.ts tests/unit/assets/bundle-widget-full-page-step-config-image.test.ts tests/unit/assets/bundle-widget-full-page-bundle-text.test.ts tests/unit/assets/bundle-widget-full-page-box-selection-validation.test.ts tests/unit/assets/bundle-widget-product-page-slot-icon.test.ts tests/unit/assets/bundle-widget-full-page-slot-icon.test.ts tests/unit/assets/bundle-widget-full-page-selection-fallback.test.ts tests/unit/assets/bundle-widget-product-page-single-step-categories.test.ts tests/unit/assets/bundle-widget-product-page-compare-at-price.test.ts --runInBand --silent`
- `npm run build:widgets`
- `npm run minify:assets css`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check app/assets/bundle-widget-product-page.js`
- `node --check app/assets/bundle-modal-component.js`
- `find app/assets/widgets/full-page/methods app/assets/widgets/product-page/methods app/assets/widgets/full-page/modal app/assets/widgets/full-page/templates app/assets/widgets/product-page/templates app/assets/widgets/shared app/assets/widgets/shared/components app/assets/widgets/shared/engine scripts/minify-assets -type f -name '*.js' -print0 | xargs -0 -n 1 node --check`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `node --check extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- `rg -n "<style>|</style>|document\\.createElement\\([\\\"']style[\\\"']\\)|style\\.textContent|appendChild\\(style\\)" app/assets/bundle-widget-product-page.js app/assets/bundle-widget-full-page.js app/assets/widgets -S` (no matches)
- `find app/assets scripts -type f \( -name '*.js' -o -name '*.css' \) -exec awk 'FNR==1{if(n>500) print f ":" n; f=FILENAME; n=0} {n++} END{if(n>500) print f ":" n}' {} +` (no files over 500 lines)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS/JS size evidence:
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — 68,791 B
- `extensions/bundle-builder/assets/bundle-widget.css` — 62,572 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-standard.css` — 30,922 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-classic.css` — 25,401 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-compact.css` — 2,790 B
- `extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css` — 10,821 B
- `extensions/bundle-builder/assets/bundle-widget-product-page-cascade.css` — 10,500 B
- `extensions/bundle-builder/assets/bundle-widget-product-page-cognive.css` — 9,282 B
- `extensions/bundle-builder/assets/bundle-widget-product-page-modal.css` — 14,463 B

Visual URLs checked:
- `https://agent-5sfidg3m.myshopify.com/products/wpb-fresh-ppb-template-parity-2026-06-04-97524` - live deployed PPB fixture rendered with `bundle-widget.css` loaded from Shopify CDN and no stuck loading overlay; live version was `3.0.23`.

Screenshots captured: None.

Known follow-ups: Current local assets are built but not deployed, so Chrome can only prove the existing Shopify CDN state, not the new `3.0.24` assets. Full live all-8-template storefront matrix should be run after manual Shopify deploy/CDN propagation.

## Loop 49 - Template Installer Removal

Pass/fail: Code/tests/build pass for removing the template installer/prototype patch architecture. FPB and PPB template modules now export method objects only. The widget entries compose those method objects in the central controller `Object.assign` alongside the other method modules. `installStandardTemplate`, `installClassicTemplate`, `installCompactTemplate`, `installHorizontalTemplate`, `installCascadeTemplate`, `installCogniveTemplate`, `installModalSlotTemplate`, `attachFullPageTemplateMethods`, and `attachProductPageTemplateMethods` are absent from production widget sources and generated bundles.

Tests run:
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/assets/shared-product-card.test.ts tests/unit/assets/shared-selected-summary.test.ts tests/unit/assets/widget-build-shared-modules.test.ts tests/unit/assets/fpb-runtime-config-surface.test.ts tests/unit/assets/bundle-widget-full-page-category-hydration.test.ts tests/unit/assets/bundle-widget-full-page-addons.test.ts tests/unit/assets/widget-cart-lines-integration.test.ts tests/unit/assets/shared-cart-submit.test.ts tests/unit/assets/bundle-widget-product-page-addons.test.ts tests/unit/assets/shared-cart-lines.test.ts tests/unit/assets/bundle-widget-full-page-summary-images.test.ts tests/unit/assets/bundle-widget-product-slots-enabled.test.ts tests/unit/assets/bundle-widget-full-page-step-config-image.test.ts tests/unit/assets/bundle-widget-full-page-bundle-text.test.ts tests/unit/assets/bundle-widget-full-page-box-selection-validation.test.ts tests/unit/assets/bundle-widget-product-page-slot-icon.test.ts tests/unit/assets/bundle-widget-full-page-slot-icon.test.ts tests/unit/assets/bundle-widget-full-page-selection-fallback.test.ts tests/unit/assets/bundle-widget-product-page-single-step-categories.test.ts tests/unit/assets/bundle-widget-product-page-compare-at-price.test.ts tests/unit/assets/fpb-template-registry.test.ts tests/unit/assets/ppb-template-registry.test.ts tests/unit/assets/ppb-template-registry-integration.test.ts tests/unit/assets/ppb-vertical-slots-shared-shell.test.ts tests/unit/assets/template-installer-methods.test.ts --runInBand --silent`
- `npm run build:widgets`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check app/assets/bundle-widget-product-page.js`
- `find app/assets/widgets/full-page/templates app/assets/widgets/product-page/templates -type f -name '*.js' -print0 | xargs -0 -n 1 node --check`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `node --check extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- `rg -n "install(Standard|Classic|Compact|Horizontal|Cascade|Cognive|ModalSlot)Template|attachFullPageTemplateMethods|attachProductPageTemplateMethods" app/assets scripts extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js -S` (no matches)
- `rg -n "<style>|</style>|document\\.createElement\\([\\\"']style[\\\"']\\)|style\\.textContent|appendChild\\(style\\)" app/assets/bundle-widget-product-page.js app/assets/bundle-widget-full-page.js app/assets/widgets -S` (no matches)
- `find app/assets scripts -type f \( -name '*.js' -o -name '*.css' \) -exec awk 'FNR==1{if(n>500) print f ":" n; f=FILENAME; n=0} {n++} END{if(n>500) print f ":" n}' {} +` (no files over 500 lines)
- `git diff --check -- ':!graphify-out/GRAPH_REPORT.md'`

CSS/JS size evidence:
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — 391,532 B
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` — 251,743 B
- `extensions/bundle-builder/assets/wolfpack-bundles-sdk.js` — 107,973 B
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — 68,791 B
- `extensions/bundle-builder/assets/bundle-widget.css` — 62,572 B
- Template CSS assets remain below Shopify's 100,000 B app-block asset limit.

Visual URLs checked: None in this loop; generated local widget assets are not deployed to Shopify CDN.

Screenshots captured: None.

Known follow-ups: Full live all-8-template storefront matrix remains deploy-gated. Run it after manual SIT deploy and Shopify CDN propagation for widget `3.0.24`.

## Loop 27 - FPB Bundle Banner CSS Ownership

Pass/fail: Code/tests/build pass for moving static FPB bundle banner image styles out of the main full-page widget style-tag injection and into `bundle-widget-full-page.css`. The JS helper now remains as a no-op marker while `createBundleBanners()` continues to create only the banner image DOM.

Tests run:
- `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`
- `node --check app/assets/bundle-widget-full-page.js`
- `npm run minify:assets css`
- `npm run build:widgets`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npx eslint --max-warnings 9999 tests/unit/assets/bundle-widget-full-page-template-layout.test.ts` (warnings only)

Visual URLs checked: None in this loop; source-level CSS ownership only.

Screenshots captured: None.

Known follow-ups: Standard, Classic, and Horizontal template installers still own runtime CSS through JS style tags; all-8-template visual matrix and add-to-cart verification remain pending.

## Loop 28 - Shared Bundle and Step Banner Component

Pass/fail: Code/tests/build pass for extracting FPB bundle banner and step banner image DOM creation into `shared/components/bundle-banners.js`, then delegating `createBundleBanners()` and `createStepBannerImage()` from the full-page widget to those shared helpers.

Tests run:
- `npx jest tests/unit/assets/shared-bundle-banners.test.ts tests/unit/assets/widget-build-shared-modules.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand` (initial red: Node test needed a fake document instead of `document`)
- `npx jest tests/unit/assets/shared-bundle-banners.test.ts tests/unit/assets/widget-build-shared-modules.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`
- `npx jest tests/unit/assets/shared-bundle-banners.test.ts tests/unit/assets/widget-build-shared-modules.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand` (after adding step banner helper coverage)
- `node --check app/assets/widgets/shared/components/bundle-banners.js`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check scripts/build-widget-bundles.js`
- `npm run build:widgets`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npx eslint --max-warnings 9999 tests/unit/assets/shared-bundle-banners.test.ts tests/unit/assets/widget-build-shared-modules.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts` (warnings only)

Visual URLs checked: None in this loop; DOM helper extraction preserves existing class contract.

Screenshots captured: None.

Known follow-ups: Continue extracting render helpers from oversized widget files; Standard, Classic, and Horizontal runtime CSS injections remain; all-8-template visual matrix and add-to-cart verification remain pending.

## Loop 29 - FPB Compact CSS Conflict Cleanup

Pass/fail: Code/tests/build pass for removing the redundant unscoped mobile Compact selector block from `side-footer-compact.css`. The deleted block used broad `.layout-sidebar`, `.fpb-mobile-bottom-sheet`, and `.fpb-i` selectors from the Compact asset, which could override Standard, Classic, and Horizontal FPB mobile icon-card layouts. Remaining Compact CSS is scoped to `data-fpb-design-preset=COMPACT`.

Tests run:
- `rg -n "\\.fpb-i|^\\s*\\.layout-sidebar \\.sidebar-layout-wrapper|^\\s*\\.layout-sidebar \\.full-page-side-panel|^\\s*\\.fpb-mobile-bottom-sheet \\.side-panel" app/assets/widgets/full-page-css/templates/side-footer-compact.css app/assets/widgets/full-page-css/templates`
- `npm run minify:assets css`
- `wc -c extensions/bundle-builder/assets/bundle-widget-full-page.css extensions/bundle-builder/assets/bundle-widget.css`
- `npx jest tests/unit/assets/storefront-template-modularization.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`

Visual URLs checked:
- `https://agent-5sfidg3m.myshopify.com/pages/wpb-fresh-fpb-template-parity-2026-06-04` - live deployed FPB fixture rendered `CLASSIC`, `icon` CTA mode, widget version `3.0.23`.
- `https://agent-5sfidg3m.myshopify.com/products/wpb-fresh-ppb-template-parity-2026-06-04-97524` - live deployed PPB fixture rendered `PDP_MODAL` / `SIMPLIFIED`, widget version `3.0.23`.

Screenshots captured:
- `/private/tmp/wpb-fpb-fixture-desktop-2026-06-11-181636.png`
- `/private/tmp/wpb-fpb-fixture-mobile-2026-06-11-181636.png`
- `/private/tmp/wpb-ppb-fixture-desktop-2026-06-11-181636.png`
- `/private/tmp/wpb-ppb-fixture-mobile-2026-06-11-181636.png`
- DOM summaries: `/private/tmp/wpb-fpb-fixture-dom-2026-06-11-181636.json`, `/private/tmp/wpb-ppb-fixture-dom-2026-06-11-181636.json`.

Live verification caveat: These screenshots prove the current deployed fixture state only. The local CSS cleanup is built into local extension assets but has not been deployed to Shopify CDN in this loop.

Known follow-ups: Standard, Classic, and Horizontal still own runtime CSS through template JS style tags; all-8-template visual matrix and add-to-cart verification remain pending.
