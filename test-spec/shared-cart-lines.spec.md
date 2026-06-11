# Test Spec: Shared Cart Lines
**Spec ID:** shared-cart-lines  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Introduce shared cart-line metadata helpers before replacing FPB and PPB cart submission code.

## Test Cases

### SharedCartLines

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Source metadata | Selected lines, retail price, discount | `_bundle_display_properties` JSON | Matches current cart-line messaging source metadata. |
| 2 | Visible labels | Display metadata and label map | Cart line label properties | Supports FPB visible labels and future shared use. |
| 3 | Build inclusion | Build script | Shared helper bundled before widgets | Needed for storefront bundle builds. |

## Acceptance Criteria

- [x] Source metadata helper exists.
- [x] Visible cart-line label helper exists.
- [x] Helper is included in widget shared bundle.
