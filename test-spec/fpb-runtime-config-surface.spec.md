# Test Spec: FPB Runtime Config Surface
**Spec ID:** fpb-runtime-config-surface  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Ensure the full-page bundle runtime does not emit unsupported text-banner or modal quantity-selector config.

## Test Cases
### FpbRuntimeConfigSurface
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB image-only banner runtime | Full-page widget source | No `promoBannerSubtitle`, `promoBannerTagline`, `promoBannerNote`, or default text strings | FPB supports image banners only |
| 2 | FPB template-controlled modal runtime | Full-page widget source | No `showQuantitySelectorInModal` config | Storefront modals follow Select Template options |

## Acceptance Criteria
- [ ] Unsupported FPB text-banner defaults are absent from the full-page runtime.
- [ ] FPB modal quantity selector config is absent from the full-page runtime.
