# Test Spec: Offline Token Hardening
**Spec ID:** offline-token-hardening  **Created:** 2026-07-10

## Purpose
Make Shopify expiring offline token handling production-ready by preventing concurrent refresh races and retrying transient refresh-token requests using the same refresh token.

## Test Cases
### Offline Token Service
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Refresh lock acquired | Expiring offline row with refresh token | Uses an advisory lock before token refresh | Prevents rotating-token race |
| 2 | Legacy migration lock acquired | Legacy offline row without refresh token | Uses an advisory lock before token exchange | Migration revokes original token |
| 3 | Transient refresh retry | First refresh request returns 500, second succeeds | Retries with the same refresh token and persists success | Matches Shopify retry guidance |
| 4 | Non-transient refresh failure | Refresh request returns 401 invalid refresh token | Does not retry and surfaces failure | Caller drops unusable row |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Background Admin API callers continue to use `unauthenticated.admin(shop)` or `getOfflineSessionForShop(...)`
- [ ] Docs explain required operator action for existing production installs
