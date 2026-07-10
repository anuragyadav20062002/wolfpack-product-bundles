# Test Spec: Uninstall Cleanup
**Spec ID:** uninstall-cleanup  **Created:** 2026-07-10

## Purpose
Verify that the app uninstall webhook removes shop-owned operational data while preserving revenue analytics needed after churn.

## Test Cases
### LifecycleWebhook
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | App uninstall cleanup runs | `shopDomain`, payload, current webhook event id | Deletes bundles, sessions, design settings, queued jobs, compliance records, old webhook events, old business events, and shop record | `OrderAttribution` and `BundleEngagement` are intentionally untouched |
| 2 | Uninstall event is retained | Same as #1 | Old `BusinessEvent` rows are deleted before `app_uninstalled` is recorded | Keeps the final uninstall marker after cleanup |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] No cleanup script is added or invoked for production data deletion
