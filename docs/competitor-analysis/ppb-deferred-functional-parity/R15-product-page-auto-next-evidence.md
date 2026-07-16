---
schema_version: 1
id: r15-product-page-auto-next-evidence
title: R15 Product Page Auto-next Evidence
type: parity-evidence
status: proven
summary: Documents the PPB auto-next source fix and live SIT replay for Product List, Horizontal Slots, and Vertical Slots.
last_audited: 2026-07-16
owners:
  - engineering
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page/methods/selection-methods.js
  - tests/unit/assets/ppb-product-list-step-conditions.test.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - parity
  - ppb
keywords:
  - auto-next
---

# R15: Product Page Auto-next Evidence

Date: 2026-07-16

## Scope

Rows closed:

- R15 Product List
- R15 Horizontal Slots
- R15 Vertical Slots

Product Grid remained closed by the existing `PG09-session-restoration-evidence` entry and was not replayed.

## EB contract source

Existing Product Grid evidence records that the EB Step Flow / Rules help content was read and confirmed exact-rule auto-next behavior. This replay used the same contract: an eligible product selection should advance to the next step only when the saved rule enables auto-next.

## Blocker found

The shared SIT fixture `cmrf19c8d0000v0xpj8rz2wgh` could be configured with Step 1 auto-next and an eligible quantity rule, but Product List did not advance. The selected product changed to quantity state, while the visible Cascade step flow remained on Step 1.

Root cause: `ProductPageSelectionMethods.updateProductSelection` always routed auto-next through `_autoProgressBottomSheet(stepIndex)`. That method updates modal/bottom-sheet state, so in-page Product List/Product Grid shells did not advance their visible step flow.

## Source correction

`app/assets/widgets/product-page/methods/selection-methods.js` now checks `_usesCascadeStepFlow()` before invoking modal progression:

- in-page Product List/Product Grid: `navigateCascadeStep(1)`
- modal Horizontal Slots/Vertical Slots: existing `_autoProgressBottomSheet(stepIndex)`

Focused behavior coverage:

- `tests/unit/assets/ppb-product-list-step-conditions.test.ts`

Required test spec:

- `test-spec/ppb-product-page-auto-next.spec.md`

## Temporary fixture

The original fixture state was backed up to `/private/tmp/wpb-ppb-r15-c16-original.json`.

Temporary R15 fields:

- Step 1 `autoNextStepOnConditionMet: true`
- Step 1 `conditionType: "quantity"`
- Step 1 `conditionOperator: "greater_than_or_equal_to"`
- Step 1 `conditionValue: 1`
- Step 2 `enabled: true`

Template cycle:

- Product List: `PDP_INPAGE / CASCADE`
- Horizontal Slots: `PDP_MODAL / MODAL`
- Vertical Slots: `PDP_MODAL / SIMPLIFIED`

The fixture was restored to its original state after the replay.

## Verification

Commands:

- `npx jest --selectProjects unit --runTestsByPath tests/unit/assets/ppb-product-list-step-conditions.test.ts`
- `node --check app/assets/widgets/product-page/methods/selection-methods.js`
- `npm run build:widgets`

Browser proof used Chrome DevTools MCP on the already-running SIT app. Before each template pass, Cache Storage was cleared, session/local selection state was cleared, and the storefront was hard-reloaded with `ignoreCache: true`.

Storefront:

- `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- widget: `5.0.189`

### Product List

After hard reload, the visible in-page step flow started on Step 1 with Step 2 enabled but inactive. Clicking the first visible `Add +` product button changed the active visible step from `1 / Step 1` to `2 / Step 2`. The Step 2 product body rendered immediately, including `14k Intertwined Earrings`, `14k Solid Bloom Earrings`, `Selling Plans Ski Wax`, `Purely Almonds Original`, and the meal subscription products.

### Horizontal Slots

After hard reload, the page rendered two empty slot cards. Clicking the Step 1 `Product 1` slot opened the modal with active tab `Step 1` and `Category 1`. Clicking a visible product-card `Add to Cart` advanced the modal title and active tab to `Step 2`; the Step 2 product list rendered immediately.

### Vertical Slots

After hard reload, the page rendered two vertical empty slot cards. Clicking the Step 1 `Product 1` slot opened the modal with active tab `Step 1` and `Category 1`. Clicking a visible product-card `Add to Cart` advanced the modal title and active tab to `Step 2`; the Step 2 product list rendered immediately.

## Result

R15 is proven for Product List, Horizontal Slots, and Vertical Slots. Product Grid remains proven by the existing evidence entry.
