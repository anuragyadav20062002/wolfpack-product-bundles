# Test Spec: FPB Template Stylesheet Switch
**Spec ID:** fpb-template-stylesheet-switch  **Created:** 2026-07-02

## Purpose
Ensure the full-page storefront runtime keeps only the active preset stylesheet enabled after cached page config is refreshed to a different preset.

## Test Cases
### FullPageRuntimeCartSettingsMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Cached Standard stylesheet then refreshed Classic preset | Existing Standard and Classic preset links, active preset `CLASSIC` | Classic link remains enabled, Standard link is disabled | Prevents stale cached preset CSS from affecting Classic storefront rendering |
| 2 | Previously disabled Standard stylesheet becomes active again | Existing Standard and Classic preset links, active preset `STANDARD` | Standard link is re-enabled, Classic link is disabled | Keeps runtime switching reversible |

## Acceptance Criteria
- [x] Active FPB preset stylesheet is enabled.
- [x] Inactive FPB preset stylesheets are disabled.
- [x] Switching presets back re-enables the correct stylesheet.
