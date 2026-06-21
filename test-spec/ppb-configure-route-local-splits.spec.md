# Test Spec: PPB Configure Route Local Splits
**Spec ID:** ppb-configure-route-local-splits  **Created:** 2026-06-21

## Purpose
Keep near-cap PPB configure route-local modules small enough for route-family maintainability work without changing UI, copy, or data behavior.

## Test Cases
### AdminRouteFileBoundaries
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Owned PPB near-cap files are split | `PpbBundleSettingsSection.tsx`, `handlers/save-bundle.server.ts`, `ConfigureBundleFlow.helpers.tsx` | Each file is at or below 500 lines | New adjacent route-local files may hold extracted components/helpers. |

## Acceptance Criteria
- [ ] Owned PPB files are at or below 500 lines.
- [ ] Existing PPB route-family boundary tests pass.
