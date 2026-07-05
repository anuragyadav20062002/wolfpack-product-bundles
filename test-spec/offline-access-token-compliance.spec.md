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
| 5 | Ensure helper sees incomplete expiring metadata | Offline row has `refreshToken` but missing expiration metadata | Refreshes the token before returning | Avoids treating partial expiring-token rows as compliant |

### CachedSessionStorage
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Legacy offline row is loaded by Shopify SDK session storage | Offline row with no `refreshToken` and no `expires` | Storage migrates the row before returning a session | Prevents `unauthenticated.admin(...)` from using a non-expiring token |
| 2 | Legacy offline row migration fails transiently | Offline row with no `refreshToken`, migration throws network error | Storage returns `undefined` and keeps the row for later retry | Avoids serving the legacy token |
| 3 | Legacy offline session is already cached | Cached offline `Session` with no refresh metadata | Storage re-reads and migrates instead of serving cache | Covers SDK callback/cache path |
| 4 | `findSessionsByShop` sees legacy rows | Shop lookup returns legacy offline rows | Rows are migrated before being returned | Covers batch/session lookup callers |

## Acceptance Criteria
- [x] New installs can acquire expiring offline tokens from an ID token.
- [x] Existing non-expiring offline tokens still migrate with `expiring=1`.
- [x] Token responses persist access-token and refresh-token expiration metadata.
- [x] Session storage never returns a non-expiring offline token to Admin API callers.
