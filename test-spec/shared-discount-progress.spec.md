# Test Spec: Shared Discount Progress
**Spec ID:** shared-discount-progress  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Define the shared discount progress data and DOM contract before templates migrate to it.

## Test Cases

### SharedDiscountProgressSelector

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | In-progress rule | current 2, target 5 | 40 percent, not successful | Selector accepts prepared values only. |
| 2 | Over-complete rule | current 7, target 5 | 100 percent, successful | Percent is clamped. |
| 3 | Zero target | current 2, target 0 | 0 percent, not successful | Avoid division by zero. |

### SharedDiscountProgressRenderer

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Bar mode | prepared progress data | Stable root, message, track, fill | Renderer does not calculate pricing. |
| 2 | Unsafe message | HTML-like text | Escaped text | Prevents scriptable markup injection. |
| 3 | Stepped mode | success data and stepped option | Stepped and success classes | Supports both simple and stepped presentation. |

## Acceptance Criteria

- [x] All listed selector cases pass.
- [x] All listed renderer cases pass.
- [x] Component is bundled before widget entry files.
