# Test Spec: FPB Mobile Portal Theme
**Spec ID:** fpb-mobile-portal-theme  **Created:** 2026-06-12

## Purpose
Verify FPB mobile controls rendered outside the widget root still receive bundle theme variables.

## Test Cases
### MobilePortalThemeVars
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Copy widget theme vars to portal elements | Widget root has button/sidebar CSS vars and two body-mounted elements | Both elements receive matching inline custom properties | Covers mobile summary ATC inheritance break |
| 2 | Use document fallback when widget value is absent | Widget root lacks a var but document root has it | Portal receives fallback value | Covers theme vars emitted higher in the cascade |

## Acceptance Criteria
- [ ] Mobile portal controls inherit the same theme variables as in-widget controls
- [ ] Focused unit test passes
