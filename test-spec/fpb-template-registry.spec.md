# Test Spec: FPB Template Registry
**Spec ID:** fpb-template-registry  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Introduce a full-page template registry that normalizes the four FPB target presets before removing prototype installers.

## Test Cases

### Resolver

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Standard preset | `STANDARD` | `STANDARD` config | Standard is canonical. |
| 2 | Other presets | `CLASSIC`, `COMPACT`, `HORIZONTAL` | Matching config | All FPB templates included. |
| 3 | Config exports | Registry exports | Four target FPB configs | Matches plan scope. |
| 4 | Build inclusion | Build script | Registry before installers | Keeps resolver available in bundled widget. |
| 5 | Classic timeline renderer | `CLASSIC` config | Timeline mode equals Standard's `standard` mode | Classic storefront should reuse the Standard step timeline exactly. |

## Acceptance Criteria

- [x] App can resolve all four FPB template configs.
- [x] Existing preset aliases remain supported.
- [x] Registry is bundled before current installers.
- [x] Classic config uses the Standard timeline renderer mode.
