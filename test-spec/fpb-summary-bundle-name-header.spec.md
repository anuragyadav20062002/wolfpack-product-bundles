# Test Spec: FPB Summary Bundle Name Header
**Spec ID:** fpb-summary-bundle-name-header  **Created:** 2026-07-06

## Purpose
Verify storefront summary headers use the saved bundle name instead of the generic summary label.

## Test Cases
### SummaryHeaderText
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Desktop summary sidebar title | Classic FPB bundle named `Daily Essentials` with old summary title `Your Bundle` | `.side-panel-title` renders `Daily Essentials` | Behaviour only; no CSS assertion |
| 2 | Mobile footer expanded title | Classic FPB bundle named `Daily Essentials` with old summary title `Your Bundle` | `.fpb-mobile-summary-bundle-title` renders `Daily Essentials` | Behaviour only; no CSS assertion |

## Acceptance Criteria
- [x] All listed test cases pass
