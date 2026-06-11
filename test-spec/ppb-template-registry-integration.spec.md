# Test Spec: PPB Template Registry Integration
**Spec ID:** ppb-template-registry-integration  **Issue:** waived  **Created:** 2026-06-11

## Purpose
Move current product-page template detection helpers to the registry resolver without changing render behavior.

## Test Cases
### InstallerIntegration
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Cognive detection | Dummy product-page class | `_isProductPageGridTemplate()` uses registry result | PPB Grid |
| 2 | Modal vertical detection | Dummy product-page class | Vertical/horizontal state matches registry | Slot templates |
| 3 | Cascade source integration | Source text | Cascade installer imports and calls resolver | Avoids heavy widget import in test |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Existing PPB live fixture still renders
- [ ] No visual change expected
