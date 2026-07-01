# Test Spec: WPB Runtime Prefix
**Spec ID:** wpb-runtime-prefix  **Created:** 2026-07-02

## Purpose
Ensure WPB-owned runtime code does not emit legacy competitor prefixes, postfixes, body attributes, CSS variables, CSS classes, or cart-line keys.

## Test Cases
### Runtime Prefixes
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB cascade runtime markers | Cascade template render | Runtime classes/body attrs use `wpbMix` / `wpbmix` / `wpb-mix` | EB evidence docs remain unchanged |
| 2 | Add-on cart line key | FPB/PPB add-on selected | Add-on line uses `_uniqueWpbItemKey` | Replaces legacy prefix in WPB-owned cart payload |
| 3 | Settings design CSS bridge | Settings design CSS generation | Bridge variables use `--wpbMix-*` | CSS generator behavior only |

## Acceptance Criteria
- [ ] No legacy competitor prefix references remain in WPB-owned source, tests, specs, or generated extension assets.
- [ ] Widget JS bundles rebuild from raw source.
- [ ] Focused settings/runtime tests pass.
