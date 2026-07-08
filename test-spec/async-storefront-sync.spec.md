# Test Spec: Async Storefront Sync
**Spec ID:** async-storefront-sync  **Created:** 2026-07-08

## Purpose
Move expensive Shopify storefront/cart-transform publication out of Admin save requests while keeping component variant metafield writes within Shopify's `metafieldsSet` input limit.

## Test Cases
### ComponentProductMetafields
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Batch component variant writes | 260 cached ProductVariant GIDs | 11 `metafieldsSet` calls, each with <=25 inputs | Prevent one-call-per-variant save stalls |
| 2 | Normalize numeric variant IDs | Cached numeric variant IDs | ProductVariant GIDs in owner IDs and component references | Existing real merchant root-cause guard |

### StorefrontSyncQueue
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Queue save-triggered sync | Bundle save with Shopify product/page | Save returns success with queued sync metadata | Shopify metafield writers are not called inline |
| 2 | Enqueue failure | Inngest send throws | Save still returns success, sync status becomes failed | Merchant can retry |
| 3 | Retry action | Failed bundle sync state | New attempt is queued | Same event payload shape as save enqueue |

### InngestStorefrontSync
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Worker succeeds | Valid bundle event | Cart Transform setup runs before metafield sync and status becomes synced | Uses unauthenticated Admin client |
| 2 | Worker fails | Metafield sync throws | Status becomes failed with safe error | Inngest can retry |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Save handlers do not call Shopify storefront metafield writers inline
- [ ] Component variant metafields are written in chunks of at most 25 inputs
- [ ] Configure loaders/actions expose current sync state and retry
