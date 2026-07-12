# Test Spec: PPB Horizontal Slots Empty Placeholders
**Spec ID:** ppb-horizontal-slots-empty-placeholders  **Created:** 2026-07-13

## Purpose

Verify that PPB modal-slot templates render one empty slot for every remaining
required selection instead of one aggregate "Add N more" card.

## Test Cases

### PPBHorizontalSlotsEmptyPlaceholders

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Empty exact-two step | required quantity 2, selected count 0 | Two placeholders labelled Product 1 and Product 2 | EB HS00 contract |
| 2 | Partially filled exact-two step | required quantity 2, selected count 1 | One placeholder labelled Product 2 | Preserves slot order |
| 3 | Greater-than rule | condition greater than 2, selected count 0 | Three placeholders | Matches existing rule threshold semantics |

## Acceptance Criteria

- [x] Modal slots render one placeholder per remaining selection.
- [x] Placeholder numbering continues after selected products.
- [x] Greater-than rules add one to the threshold.
- [x] Non-modal templates keep the aggregate add-more behavior.
