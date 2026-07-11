# Test Spec: ppb-loading-overlay
**Spec ID:** ppb-loading-overlay  **Created:** 2026-06-13

## Purpose
Validate that the PPB widget overlay remains present long enough to be paintable and renders inside the widget container during initial bootstrap.

## Test Cases
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB init should allow initial paint before proceeding | Product-page widget with valid `data-bundle-config` and fast API response | Initial loading overlay is shown in widget container area and removed after content renders | This is enforced with a double `requestAnimationFrame` yield after `showLoadingOverlay()` |
| 2 | PPB hide overlay follows minimum visible timing | Overlay shown then immediate completion path | Overlay exists for the configured visibility window and only removes after `hideLoadingOverlay()` lifecycle completes | Verifies no instant create/remove in same turn
| 3 | Bootstrap loading hides incomplete fallback scaffold | Product-page widget initial bootstrap | Container is marked as bootstrap-loading until the bundle UI is rendered | Prevents native/fallback button flash while config hydrates |
| 4 | Product List step products pending | Empty in-page step product data with pending fetch | Target is marked busy, starts product loading, and does not render user-facing loading copy | Keeps Product List loading visual-only and geometry-preserving |

## Acceptance Criteria
- [x] Spinner visibility is guaranteed at least one paint frame before async bootstrap work continues
- [x] Overlay remains scoped to `#bundle-builder-app` and is not page-global
- [x] Bootstrap loading suppresses incomplete fallback controls until the real widget UI renders
- [x] Product List pending product loads use skeleton rows without visible loading copy
- [x] `bundle-widget-product-page-bundled.js` includes the new PPB timing guard and passes unit tests
