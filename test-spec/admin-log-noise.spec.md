# Test Spec: Admin Log Noise
**Spec ID:** admin-log-noise  **Created:** 2026-06-12

## Purpose
Keep expected non-critical Admin dashboard cases out of warning logs. Unreadable theme settings should fail closed without warning noise, and stale custom Web Vitals beacons should be discarded without reintroducing telemetry.

## Test Cases
### AppEmbedCheckLogging
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Shopify returns malformed `settings_data.json` | Active theme response plus malformed settings content | Returns `enabled: false` and does not call `AppLogger.warn` or `AppLogger.debug` | Fail closed so merchants see the app embed enable banner instead of a false Active state without noisy server logs |

### WebVitalsTombstone
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Old browser posts to retired `/api/web-vitals` | POST request without Admin auth | Returns `204` and does not call `AppLogger.warn` | Discards stale traffic without restoring telemetry |

## Acceptance Criteria
- [ ] Malformed `settings_data.json` no longer emits `[APP:WARN]` or `[APP:DEBUG] checkAppEmbedEnabled: failed to parse settings_data.json`.
- [ ] `/api/web-vitals` stale POSTs no longer emit unauthenticated warning logs.
- [ ] The app-owned Web Vitals telemetry pipeline remains retired.
