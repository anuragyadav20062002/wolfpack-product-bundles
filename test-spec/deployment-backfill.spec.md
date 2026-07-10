# Test Spec: Deployment Backfill
**Spec ID:** deployment-backfill  **Created:** 2026-07-10

## Purpose
Provide a guarded deployment-time maintenance script that can re-sync all stored bundle records through the app's existing storefront sync functions without running by default.

## Test Cases
### Backfill Safety and Sync Loop
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Disabled by default | Empty env | No shop scan and no sync calls | Deployment-safe default |
| 2 | Apply without confirmation | Enabled + apply env, no confirmation | Throws before syncing | Protects production |
| 3 | Dry-run | Enabled only | Lists shops and bundles, no sync calls | Preview path |
| 4 | Apply with confirmation | Enabled + apply + exact confirmation | Calls existing bundle sync for each target | Uses offline Admin client per shop |
| 5 | Single-shop limit | Shop + limit env | Queries only that shop and limit | Focused recovery path |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Deploy scripts invoke the backfill gate before Shopify deploy but the gate is disabled by default
- [ ] Docs warn that production apply mode is dangerous and requires manual user approval
