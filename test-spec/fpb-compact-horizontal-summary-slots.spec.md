---
schema_version: 1
id: fpb-compact-horizontal-summary-slots
title: FPB Compact and Horizontal Summary Slots
type: test-spec
status: active
summary: Verifies that slot-enabled Compact and Horizontal summaries reuse the shared filled and empty slot presentation on desktop and mobile.
last_audited: 2026-07-22
owners:
  - engineering
domains:
  - storefront
systems:
  - bundle-widgets
source_paths:
  - app/assets/widgets/full-page/methods/mobile-summary-methods.js
  - app/assets/widgets/full-page/methods/side-panel-methods.js
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - fpb
  - parity
  - summary-slots
keywords:
  - Compact Design
  - Horizontal Design
  - Product Slots
---

# Test Spec: FPB Compact and Horizontal Summary Slots

**Spec ID:** fpb-compact-horizontal-summary-slots  **Created:** 2026-07-22

## Purpose

Keep Product Slots behavior consistent across the shared desktop sidebar and mobile summary tray for Compact and Horizontal FPB presets.

## Test Cases

### SummarySlotPolicy

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Compact slots enabled | `COMPACT`, enabled | Slot tiles are used | Reuses the shared summary renderer |
| 2 | Horizontal slots enabled | `HORIZONTAL`, enabled | Slot tiles are used | Matches the desktop and mobile reference |
| 3 | Slots disabled | Any preset, disabled | Row/skeleton presentation remains active | Preserves the saved merchant control |

## Acceptance Criteria

- [x] Focused unit tests pass.
- [x] Compact desktop and mobile render filled and empty slots.
- [x] Horizontal desktop and mobile render filled and empty slots.
- [x] Both mobile trays remain sticky and document-contained when expanded.
