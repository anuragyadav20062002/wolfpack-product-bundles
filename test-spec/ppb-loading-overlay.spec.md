# Test Spec: ppb-loading-overlay
**Spec ID:** ppb-loading-overlay  **Created:** 2026-06-13

## Purpose
Validate that the PPB widget overlay remains present long enough to be paintable and renders inside the widget container during initial bootstrap.

## Test Cases
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB init should allow initial paint before proceeding | Product-page widget with valid `data-bundle-config` and fast API response | Initial loading overlay is shown in widget container area and removed after content renders | This is enforced with a double `requestAnimationFrame` yield after `showLoadingOverlay()` |
| 2 | PPB hide overlay follows minimum visible timing | Overlay shown then immediate completion path | Overlay exists for the configured visibility window and only removes after `hideLoadingOverlay()` lifecycle completes | Verifies no instant create/remove in same turn

## Acceptance Criteria
- [x] Spinner visibility is guaranteed at least one paint frame before async bootstrap work continues
- [x] Overlay remains scoped to `#bundle-builder-app` and is not page-global
- [x] `bundle-widget-product-page-bundled.js` includes the new PPB timing guard and passes unit tests
