# Test Spec: FPB Classic Mobile Summary Slots
**Spec ID:** fpb-classic-mobile-summary-slots  **Created:** 2026-07-03

## Purpose

Lock the storefront behavior needed for Classic C04 parity: when product slots are enabled, the Classic compact mobile summary uses slot tiles rather than product summary rows.

## Test Cases

### MobileSummarySlotTiles

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Classic slots enabled | `designPreset=CLASSIC`, `productSlotsEnabled=true` | Mobile summary slot-tile predicate returns `true` | Enables EB-style filled/empty slot cards in Classic mobile tray. |
| 2 | Standard slots enabled | `designPreset=STANDARD`, `productSlotsEnabled=true` | Predicate returns `true` | Preserves existing Standard behavior. |
| 3 | Non-slot preset | `designPreset=COMPACT`, `productSlotsEnabled=true` | Predicate returns `false` | Avoids changing Compact/Horizontal mobile summaries. |
| 4 | Slots disabled | `designPreset=CLASSIC`, `productSlotsEnabled=false` | Predicate returns `false` | Keeps normal selected-product rows when Product Slots are off. |

## Acceptance Criteria

- [x] The new unit test fails before implementation.
- [x] The new unit test passes after implementation.
- [x] No CSS, class-name, source-order, or visual-placement assertions are added.
