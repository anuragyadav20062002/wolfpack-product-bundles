# Test Spec: Offline Access Token Compliance
**Spec ID:** offline-access-token-compliance  **Created:** 2026-06-21

## Purpose
Keep Shopify offline Admin API access compliant with expiring offline access token requirements.

## Test Cases
### OfflineTokenService
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | New install acquisition requests expiring offline token | Shop + browser session ID token | Token exchange request uses `subject_token_type=id_token`, `requested_token_type=offline-access-token`, and `expiring=1` | Covers Shopify Step 3 |
| 2 | Existing non-expiring token migration requests expiring offline token | Existing offline session without refresh token | Token exchange request uses offline access token as subject and `expiring=1` | Covers migration path |
| 3 | Ensure helper acquires when no offline row exists | No DB row + ID token | Expiring offline session is persisted | Covers first embedded app launch |
| 4 | Ensure helper leaves missing row alone without ID token | No DB row + no ID token | Returns null without token request | Avoids fabricated auth state |

## Acceptance Criteria
- [ ] New installs can acquire expiring offline tokens from an ID token.
- [ ] Existing non-expiring offline tokens still migrate with `expiring=1`.
- [ ] Token responses persist access-token and refresh-token expiration metadata.
