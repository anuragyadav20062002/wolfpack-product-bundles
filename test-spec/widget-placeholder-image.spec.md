# Test Spec: Widget Placeholder Image
**Spec ID:** widget-placeholder-image  **Created:** 2026-07-13

## Purpose

Prove the shared storefront widget placeholder is self-contained and does not
resolve against the merchant storefront origin.

## Test Cases

### SharedWidgetPlaceholder

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Product has no media | `BUNDLE_WIDGET.PLACEHOLDER_IMAGE` | Valid inline SVG data URL | Must work on every merchant domain |
| 2 | Primary image errors | `BUNDLE_WIDGET.PLACEHOLDER_IMAGE_FALLBACK` | Same valid inline SVG data URL | Avoids a second broken network request |

## Acceptance Criteria

- [ ] Both placeholder constants are self-contained SVG data URLs.
- [ ] Decoded SVG has a square view box and neutral background.
- [ ] Focused unit test passes.
