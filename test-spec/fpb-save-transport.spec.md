# Test Spec: FPB Save Transport Cleanup
**Spec ID:** fpb-save-transport  **Created:** 2026-07-08

## Purpose
Ensure full-page bundle Admin saves use a compact step transport DTO and stop carrying the legacy `fullPageLayout` field outside the database.

## Test Cases
### FpbSaveTransport
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Compact product/category transport | Step with bulky product picker fields, variants, category products, and collections | Serializer keeps save/runtime product, variant, image, option, category, and collection fields while dropping bulky unused fields | Behavior test for transport output |
| 2 | Selected collection override | Step has stale collections and selectedCollections contains current step collections | Serialized step collections use selectedCollections for that step | Matches current save controller behavior |
| 3 | Legacy layout omitted | Save FormData omits or includes fullPageLayout | Parser/handler does not expose or persist fullPageLayout | DB column remains untouched by this save path |
| 4 | Widget payload layout contract | Formatted FPB bundle has template/preset fields | Runtime payload has no fullPageLayout | FPB layout is driven by template/preset |

## Acceptance Criteria
- [ ] All listed test cases pass.
- [ ] Existing FPB save, category, runtime config, and formatter tests continue to pass.
- [ ] Chrome dev verification confirms save request omits `fullPageLayout` and sends compact `stepsData`.
