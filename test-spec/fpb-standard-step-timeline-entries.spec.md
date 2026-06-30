# Test Spec: FPB Standard Step Timeline Entries
**Spec ID:** fpb-standard-step-timeline-entries  **Created:** 2026-06-30

## Purpose

Verify Standard storefront timelines mirror EB navigation steps instead of promoting category tabs into separate timeline entries.

## Test Cases

### Timeline Entry Eligibility
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Standard multi-category step | `STANDARD` preset, one non-gift step with two category tabs | no synthetic `Multiple Categories` timeline entry | EB desktop/mobile evidence shows category switches stay inside the product step |
| 2 | Non-Standard multi-category step | non-`STANDARD` preset, one non-gift step with two category tabs | synthetic category entry remains eligible | Keeps the existing shared renderer behavior outside this Standard slice |
| 3 | Standard free-gift/add-on step | `STANDARD` preset, free gift step with multiple tabs | no synthetic category entry | Free gift/add-on steps stay as their own navigation step |

## Acceptance Criteria

- [ ] Standard timeline entries are limited to actual bundle navigation steps.
- [ ] Existing non-Standard category-entry eligibility is not changed by this slice.
