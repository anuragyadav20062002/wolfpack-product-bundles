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
| 4 | Minimum target reached | quantity at least 2, selected count 2 | One placeholder labelled Product 3 | EB keeps an open-ended next slot for minimum rules |
| 5 | Selection exceeds minimum | quantity at least 2, selected count 3 | One placeholder labelled Product 4 | EB permits overflow selection and keeps the next slot reachable |
| 6 | Expanded minimum-rule slots after removal | minimum 2, render count 3, then render count 0 on the same widget | Four placeholders labelled Product 1 through Product 4 | EB retains the session's expanded slot capacity until reload |
| 7 | Exact target reached | quantity exactly 1, selected count 1 | No placeholder | EB exact rules do not expose an overflow slot |

## Acceptance Criteria

- [x] Modal slots render one placeholder per remaining selection.
- [x] Placeholder numbering continues after selected products.
- [x] Greater-than rules add one to the threshold.
- [x] Minimum-rule modal slots keep one next empty placeholder after the configured target is reached or exceeded.
- [x] Minimum-rule modal slots retain expanded capacity when products are removed during the same storefront session.
- [x] Exact-rule modal slots stop at the configured quantity.
- [x] Non-modal templates keep the aggregate add-more behavior.
