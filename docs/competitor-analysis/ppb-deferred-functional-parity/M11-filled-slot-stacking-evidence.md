---
schema_version: 1
id: ppb-m11-filled-slot-stacking-evidence
title: PPB M11 Filled Slot Stacking Evidence
type: verification-evidence
status: verified
summary: Verifies the modal-slot filled stacking control for Horizontal Slots and Vertical Slots.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page/templates/registry.js
  - app/lib/bundle-formatter.server.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/16-eb-full-data-flow-investigation.md
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - parity
keywords:
  - renderFilledSlotsAsHorizontalStacked
  - Horizontal Slots
  - Vertical Slots
---

# PPB M11 Filled Slot Stacking Evidence

## Reference behavior

The EB implementation reference records that Product Page Bundle modal designs
share the `PDP_MODAL` storefront path. The visible difference between Horizontal
Slots and Vertical Slots is driven by
`renderFilledSlotsAsHorizontalStacked`, not by a separate `SIMPLIFIED` runtime
template branch:

- Horizontal Slots: `renderFilledSlotsAsHorizontalStacked: true`;
- Vertical Slots: `renderFilledSlotsAsHorizontalStacked: false`.

Product List and Product Grid are in-page templates, so M11 is not applicable to
those columns.

## Wolfpack behavior

Wolfpack projects the saved modal-slot orientation into storefront runtime data
and resolves the active modal template from that value:

- `true` resolves to the Horizontal Slots runtime contract;
- `false` resolves to the Vertical Slots runtime contract.

The 2026-07-15 R13 replay verified the live storefront runtime contracts after
cache-bypassed reloads:

- Horizontal Slots served `PDP_MODAL + MODAL`, `data-ppb-slot-orientation:
  horizontal`, and `bundle-widget-product-page-modal.css`;
- Vertical Slots served `PDP_MODAL + SIMPLIFIED`, `data-ppb-slot-orientation:
  vertical`, and `bundle-widget-product-page-modal.css`.

## Current focused verification

The focused template and formatter tests were rerun on 2026-07-15:

```text
npx jest tests/unit/assets/ppb-template-registry.test.ts tests/unit/assets/ppb-template-registry-integration.test.ts tests/unit/lib/bundle-formatter.test.ts --runInBand
```

Result: 3 suites passed, 41 tests passed.

The tests lock these M11 contracts:

- `formatBundleForWidget` exposes reference modal slot orientation for
  Horizontal Slots;
- `formatBundleForWidget` exposes reference modal slot orientation for Vertical
  Slots;
- the PPB registry maps stacked modal slots to Horizontal Slots;
- the PPB registry maps non-stacked modal slots to Vertical Slots;
- product-page template modules use the registry resolver.

## Resolution

M11 is Proven for Horizontal Slots and Vertical Slots. Product List and Product
Grid remain Not Applicable because they do not use the modal slot shell.
