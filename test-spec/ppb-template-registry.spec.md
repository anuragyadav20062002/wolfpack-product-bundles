# Test Spec: PPB Template Registry
**Spec ID:** ppb-template-registry  **Issue:** waived  **Created:** 2026-06-11

## Purpose
Introduce a product-page template registry that normalizes current legacy identifiers to the four target PPB templates.

## Test Cases
### Resolver
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Cognive grid | `PDP_INPAGE + COGNIVE` | `GRID` config | PPB Grid |
| 2 | Cascade list | `PDP_INPAGE + CASCADE` | `LIST` config | PPB List |
| 3 | Horizontal slots | `PDP_MODAL + MODAL + stacked=true` | `HORIZONTAL_SLOTS` config | Current non-vertical branch |
| 4 | Vertical slots | `PDP_MODAL + SIMPLIFIED` | `VERTICAL_SLOTS` config | Existing simplified mapping |
| 5 | Vertical slots by setting | `PDP_MODAL + MODAL + stacked=false` | `VERTICAL_SLOTS` config | Existing setting behavior |

### BuildInclusion
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Bundle module order | Build script | Registry/configs before current installers | Runtime config exists before installers |

## Acceptance Criteria
- [x] All listed test cases pass
- [ ] Existing PPB templates still render
- [x] No visual change expected
