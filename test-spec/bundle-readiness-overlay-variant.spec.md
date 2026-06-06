# Test Spec: Bundle Readiness Overlay Variants
**Spec ID:** bundle-readiness-overlay-variant  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Keep EB parity for the readiness overlay by separating the create-wizard compact surface from the detailed configure/edit surface.

## Test Cases
### BundleReadinessOverlayVariantContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Create wizard compact overlay | Create configure route source | Route passes `variant="compact"` to `BundleReadinessOverlay` | Prevents checklist rows from appearing in create wizard |
| 2 | Configure detailed overlay | PPB and FPB configure route source | Routes do not pass compact variant | Configure remains full overlay |
| 3 | Compact rendering | Overlay component source | Compact variant skips `styles.panelWrapper` and chevron rendering | Gauge and score only |

## Acceptance Criteria
- [x] Create wizard uses compact overlay
- [x] FPB and PPB configure keep detailed overlay
- [x] Compact variant cannot render checklist rows
