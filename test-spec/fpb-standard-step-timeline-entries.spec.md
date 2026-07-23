---
schema_version: 1
id: fpb-standard-step-timeline-entries
title: FPB Step Timeline Entries Test Spec
type: test-spec
status: active
summary: Verifies that FPB timelines contain configured shopper stages without synthetic category stages.
last_audited: 2026-07-21
owners:
  - storefront
domains:
  - full-page-bundle
systems:
  - storefront-widget
source_paths:
  - app/assets/widgets/full-page/methods/timeline-banner-methods.js
  - app/assets/widgets/full-page/methods/box-selection-sidebar-methods.js
  - tests/unit/assets/fpb-standard-step-timeline-entries.test.ts
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - tdd
  - parity
keywords:
  - step timeline
  - multiple categories
---

# Test Spec: FPB Step Timeline Entries

**Spec ID:** fpb-standard-step-timeline-entries  **Created:** 2026-06-30

## Purpose

Verify every FPB storefront timeline mirrors configured shopper stages instead
of promoting category tabs into synthetic stages, and only shows completed
markers on completed past steps.

## Test Cases

### Timeline Entry Eligibility
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Standard multi-category step | `STANDARD` preset, one non-gift step with two category tabs | no synthetic `Multiple Categories` timeline entry | Category switches stay inside the product step |
| 2 | Horizontal multi-category step | `HORIZONTAL` preset, one non-gift step with two category tabs | no synthetic `Multiple Categories` timeline entry | Direct EB/WPB mobile evidence exposed the duplicate-stage gap |
| 3 | Classic and Compact multi-category steps | `CLASSIC` or `COMPACT` preset, one non-gift step with two category tabs | no synthetic `Multiple Categories` timeline entry | Timeline membership follows configured stages, independent of design |
| 4 | Free-gift/add-on step | any preset, free gift step with multiple tabs | no synthetic category entry | Free gift/add-on steps stay as their own navigation step |

### Timeline Completed State
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Future add-on step has a satisfied empty condition | `currentStepIndex: 0`, add-on step index `1`, `isStepCompleted: true` | completed marker is not shown | Prevents locked future steps from rendering the EB-style tick early |
| 2 | Past product step is completed | `currentStepIndex: 1`, product step index `0`, `isStepCompleted: true` | completed marker is shown | Matches EB completed-step tick behavior |
| 3 | Current configured step remains completeable | `currentStepIndex: 1`, `hasMultipleCategoryEntry: false`, `isStepCompleted: true` | current step is not shown completed until it becomes a past step | Synthetic category state is not part of the storefront flow |

## Acceptance Criteria

- [x] Every preset timeline is limited to actual bundle navigation steps.
- [x] Multi-category navigation remains inside its configured product step.
- [x] Completed timeline markers are shown only for completed past steps.
