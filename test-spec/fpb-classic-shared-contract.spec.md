# Test Spec: FPB Classic Shared Contract
**Spec ID:** fpb-classic-shared-contract  **Issue:** waived  **Created:** 2026-06-11

## Purpose
Start FPB Classic migration by adding a config contract that maps the existing Classic preset to shared primitives.

## Test Cases
### ClassicConfig
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Preset mapping | Config import | `CLASSIC` id and preset | Current payload compatibility |
| 2 | Primitive choices | Config import | Grid cards, slot summary, stepped progress | Drives later renderer replacement |

### BuildInclusion
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Bundle module order | Build script | Classic config before Classic installer | Runtime config exists before installer |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Classic config is included before Classic template in widget bundling
- [ ] Existing storefront smoke remains green
