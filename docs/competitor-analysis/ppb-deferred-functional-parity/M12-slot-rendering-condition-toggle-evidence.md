---
schema_version: 1
id: ppb-m12-slot-rendering-condition-toggle-evidence
title: PPB Slot Rendering Condition Toggle Evidence
type: parity-evidence
status: active
summary: Documents EB and Wolfpack renderSlotsBasedOnCondition true and false behavior for Horizontal Slots and Vertical Slots.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - app/assets/widgets/product-page/templates/modal-slot-template.js
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/16-eb-full-data-flow-investigation.md
tags:
  - ppb
  - slots
  - renderSlotsBasedOnCondition
keywords:
  - M12
  - Horizontal Slots
  - Vertical Slots
---

# M12 Slot Rendering Based on Condition Toggle

## Result

M12 is terminal **P** for Horizontal Slots and Vertical Slots.

EB and WPB both use the global product-page control to decide whether modal slot templates render placeholders from the saved step condition or collapse to a single next empty placeholder per step.

## EB evidence

Test product: `yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`.

- Horizontal Slots, toggle enabled:
  - Runtime template: `PDP_MODAL / MODAL`.
  - Runtime setting: `renderSlotsBasedOnCondition: true`.
  - Desktop hard reload showed condition-sized empty slots: Step 1 `Product 1`, `Product 2`; Step 2 `Product 1`.
  - No horizontal overflow.
- Horizontal Slots, toggle disabled:
  - Runtime template: `PDP_MODAL / MODAL`.
  - Runtime setting: `renderSlotsBasedOnCondition: false`.
  - Desktop and mobile hard reloads showed one meaningful empty placeholder per step, not condition-expanded placeholders.
  - No horizontal overflow.
- Vertical Slots, toggle disabled:
  - Runtime template: `PDP_MODAL / SIMPLIFIED`.
  - Runtime setting: `renderSlotsBasedOnCondition: false`.
  - Desktop and mobile hard reloads showed one meaningful empty placeholder per step.
  - No horizontal overflow.

EB fixture was restored after the pass:

- Template: Product Grid (`PDP_INPAGE / COGNIVE`).
- Product Page Layout setting: `Display empty state boxes based on bundle condition` checked.

## WPB evidence

Test product: `agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`.

- Horizontal Slots, toggle disabled:
  - Runtime template class: `bw-selected-slots--mode-horizontal`.
  - Desktop and mobile hard reloads showed two empty cards total: Step 1 `Product 1`, Step 2 `Product 1`.
  - `Product 2` was absent from the body text.
  - Widget version: `5.0.186`.
  - No horizontal overflow.
- Horizontal Slots, toggle enabled:
  - Runtime template class: `bw-selected-slots--mode-horizontal`.
  - Desktop and mobile hard reloads showed condition-expanded placeholders: Step 1 `Product 1`, `Product 2`; Step 2 `Product 1`, `Product 2`.
  - Widget version: `5.0.186`.
  - No horizontal overflow.
- Vertical Slots, toggle disabled:
  - Runtime template class: `bw-selected-slots--mode-vertical bw-ppb-modal-slot-grid--simplified`.
  - Desktop and mobile hard reloads showed two empty cards total: Step 1 `Product 1`, Step 2 `Product 1`.
  - Widget version: `5.0.186`.
  - No horizontal overflow.
- Vertical Slots, toggle enabled:
  - Runtime template class: `bw-selected-slots--mode-vertical bw-ppb-modal-slot-grid--simplified`.
  - Desktop and mobile hard reloads showed condition-expanded placeholders: Step 1 `Product 1`, `Product 2`; Step 2 `Product 1`, `Product 2`.
  - Widget version: `5.0.186`.
  - No horizontal overflow.

WPB fixture was restored after the pass:

- Template: Vertical Slots (`PDP_MODAL / SIMPLIFIED`).
- Product Page Layout setting: `displayEmptyStateBoxesBasedOnBundleCondition: true`.

## Fix evidence

The defect was in the PPB modal slot template path: `_appendModalSlotEmptyCards` always expanded empty slots from the step condition, ignoring the existing global control.

The fix reads product-page controls from the runtime config and falls back to `selectedBundle.renderSlotsBasedOnCondition`. When the value is false, the modal slot template renders only one empty card for an unselected step and none after the step has a selected item.

Focused coverage:

- `test-spec/ppb-slot-rendering-condition-toggle.spec.md`
- `tests/unit/assets/ppb-horizontal-slots-empty-placeholders.test.ts`

Verification commands:

```bash
npx jest --selectProjects unit --runTestsByPath tests/unit/assets/ppb-horizontal-slots-empty-placeholders.test.ts
node --check app/assets/widgets/product-page/templates/modal-slot-template.js
npx eslint --max-warnings 9999 app/assets/widgets/product-page/templates/modal-slot-template.js tests/unit/assets/ppb-horizontal-slots-empty-placeholders.test.ts
npm run build:widgets
```
