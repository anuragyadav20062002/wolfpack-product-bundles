# Test Spec: FPB Horizontal Shared Contract
**Spec ID:** fpb-horizontal-shared-contract  **Issue:** waived  **Created:** 2026-06-11

## Purpose
Start FPB Horizontal migration by adding an explicit config contract for shared row primitives.

## Test Cases
### HorizontalConfig
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Preset mapping | Config import | `HORIZONTAL` id and preset | Current payload compatibility |
| 2 | Primitive choices | Config import | Row cards, row summary, stepped progress | Drives later renderer replacement |

### BuildInclusion
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Bundle module order | Build script | Horizontal config before Horizontal installer | Runtime config exists before installer |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Horizontal config is included before Horizontal template in widget bundling
- [ ] Existing storefront smoke remains green
