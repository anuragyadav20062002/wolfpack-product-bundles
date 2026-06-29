# Test Spec: FPB Checkout Line Properties
**Spec ID:** fpb-checkout-line-properties  **Created:** 2026-06-29

## Purpose
Prevent FPB component and paid add-on cart lines from leaking bundle-level public checkout properties before Cart Transform creates the parent bundle line.

## Test Cases
### FullPageStepFooterMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Build source metadata for selected FPB lines | Selected paid line and selected paid add-on line | Only `_bundle_display_properties` is returned; no public `Items`, `Retail Price`, or `You Save` keys | EB checkout shows public bundle details only on the parent line, not add-on/component lines |

## Acceptance Criteria
- [x] Focused unit test passes.
- [x] Widget source syntax check passes.
- [x] Widget bundles are rebuilt with a new version.
- [x] Chrome checkout proof shows paid add-on line without public bundle `Items/Retail Price/You Save` leakage.
