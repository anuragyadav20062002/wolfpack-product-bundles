# Test Spec: Webhook Retired Topic Ingestion
**Spec ID:** webhook-retired-topic-ingestion  **Created:** 2026-07-10

## Purpose
Prevent removed high-volume Shopify webhook topics from filling the production database when stale upstream subscriptions still deliver messages.

## Test Cases
### WebhookProcessor
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Retired product update arrives | Pub/Sub message with `products/update` topic and JSON payload | Returns success and does not create a `WebhookEvent` row | Covers prod storage growth cause |
| 2 | Retired inventory update arrives | Pub/Sub message with `inventory_levels/update` topic and JSON payload | Returns success and does not create a `WebhookEvent` row | Prevents second high-volume topic from accumulating |
| 3 | Active product delete arrives | Pub/Sub message with `products/delete` topic and webhook id | Creates and marks a `WebhookEvent` row | Ensures required operational webhooks still persist |

## Acceptance Criteria
- [x] All listed test cases pass
