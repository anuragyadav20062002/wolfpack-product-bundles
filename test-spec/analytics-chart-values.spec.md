# Test Spec: Analytics Chart Values
**Spec ID:** analytics-chart-values  **Created:** 2026-07-02

## Purpose
Ensure Admin Analytics trend charts expose readable value ticks instead of hiding all chart values.

## Test Cases
### ChartAxisFormatters
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Engagement axis formats compact counts | `0`, `34`, `1200`, `1500000` | `0`, `34`, `1.2K`, `1.5M` | Used by Engagement Pulse |
| 2 | Revenue axis formats compact currency | cents `0`, `999`, `125000`, `150000000` | `$0`, `$10`, `$1.3K`, `$1.5M` | Used by Revenue Attribution |

## Acceptance Criteria
- [ ] Engagement Pulse trend chart has visible value ticks.
- [ ] Revenue Attribution trend chart has visible value ticks.
- [ ] No CSS/class/source-grep tests are added.
