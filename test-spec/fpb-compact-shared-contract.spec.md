# Test Spec: FPB Compact Shared Contract
**Spec ID:** fpb-compact-shared-contract  **Issue:** waived  **Created:** 2026-06-11

## Purpose
Start FPB Compact migration by adding an explicit config contract for shared primitives.

## Test Cases
### CompactConfig
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Preset mapping | Config import | `COMPACT` id and preset | Current payload compatibility |
| 2 | Primitive choices | Config import | Compact grid cards, compact slot summary, stepped progress | Drives later renderer replacement |

### BuildInclusion
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Bundle module order | Build script | Compact config before Compact installer | Runtime config exists before installer |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Compact config is included before Compact template in widget bundling
- [ ] Existing storefront smoke remains green
