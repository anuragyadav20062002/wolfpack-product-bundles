# Test Spec: Integrations Page Parity
**Spec ID:** integrations-page-parity  **Issue:** [eb-integrations-page-parity-1]  **Created:** 2026-06-04

## Purpose
Lock the EB Integrations page inventory, setup-link behavior, and visible layout contract before updating the WPB Admin route.

## Test Cases
### IntegrationsData
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | EB integration inventory is exposed | `INTEGRATION_CATEGORIES` | 5 categories, 10 cards | Matches live EB audit |
| 2 | Setup actions route to temporary WPB guide destination | All cards | `setupUrl` is `https://wolfpackapps.com` | WPB guides will be authored later |
| 3 | Shared EB setup models remain documented | Guide summaries | Stoq, subscription, reviews, page builders, checkout notes present | Supportability evidence |

### IntegrationsRoute
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Route renders EB-style cards | Route source | Category panels, integration tiles, logo slots, CTA arrow | No inline guide expansion |
| 2 | Request Integration mirrors EB action shape | Route source | Single CTA link, no expandable request card | EB chat request errored in audited store |
| 3 | External links are safe | Route source | `target="_blank"` and `rel="noreferrer"` | Applies to setup and request actions |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Chrome screenshot confirms WPB page follows EB visible layout
