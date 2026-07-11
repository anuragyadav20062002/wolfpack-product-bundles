# Test Spec: Analytics Days Filter and Custom UTM Tracking
**Spec ID:** analytics-days-custom-utm  **Created:** 2026-07-11

## Purpose
Keep Analytics date filtering consistent across presets, custom ranges, export, backfill, and charts. Allow merchants to configure additional URL parameters to capture with UTM attribution.

## Test Cases
### AttributionControls
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Invalid days | `days=abc` | Defaults to 30 days | Prevents NaN windows |
| 2 | Oversized days | `days=365` | Clamps to 90 days | Matches backfill cap |
| 3 | Preset day window | `days=7`, fixed now | Seven inclusive calendar days | No extra bucket |
| 4 | Custom date range | `from=2026-06-01&to=2026-06-07` | Seven-day bounded window | Charts stop at `to` |
| 5 | Reversed custom range | `from > to` | Falls back to default days | Avoid invalid DB ranges |
| 6 | Custom UTM names | mixed comma/newline input | Lowercase sanitized names, max 10 | Prevents arbitrary payload keys |

### AttributionRoute
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Loader uses day window | `days=7` | DB queries use seven-day inclusive window | Tests route plumbing |
| 2 | Backfill respects selected days | `intent=backfill&days=7` | Backfill receives seven-day window | Control no longer hardcodes 30 |
| 3 | Save custom UTM fields | `intent=saveCustomUtms` | Shop setting saved and pixel reactivated with names | Single source: Web Pixel settings |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] TypeScript passes
- [ ] Integration tests pass
