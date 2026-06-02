# Test Spec: Bundle Readiness Score State
**Spec ID:** bundle-readiness-score-state  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Lock EB parity for readiness score state transitions across low, medium, high, compact create-wizard, and detailed configure overlays.

## Test Cases
### BundleReadinessScoreStateContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Score color states | `scoreColor` source | Low is red, medium is blue, high is green | Mirrors score-card state changes as score improves |
| 2 | Footer text states | `readinessStatusText` source | Low, near-complete, and complete states have separate copy | EB near-complete copy stays locked |
| 3 | Overlay variants | Create + FPB/PPB configure route sources | Create route passes compact variant; configure routes do not | Keeps create minified and edit/configure detailed |

## Acceptance Criteria
- [x] Focused readiness state contract passes.
- [x] Existing readiness overlay contracts still pass.
- [x] Scoped lint passes with 0 errors.
- [x] Chrome SIT smoke confirms configure overlay still opens as detailed readiness panel.
