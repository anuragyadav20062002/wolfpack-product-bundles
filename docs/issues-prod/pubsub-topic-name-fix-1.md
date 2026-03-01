# Issue: Fix Wrong Pub/Sub Topic Name in Production TOML

**Issue ID:** pubsub-topic-name-fix-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-02-18
**Last Updated:** 2026-02-18 22:05

## Overview

Production `shopify.app.toml` references a Pub/Sub topic name `wolfpack-only-bundles` that doesn't match the actual GCP Pub/Sub topic `wolfpack-product-bundles` (confirmed via `PUBSUB_TOPIC` env var in `.env.prod`). Shopify attempts to publish compliance webhooks (`shop/redact`, `customers/redact`, `customers/data_request`) to the non-existent topic, receiving a 404 from GCP.

**Error observed:**
- Topic: `shop/redact`
- URI: `pubsub://light-quest-455608-i3:wolfpack-only-bundles`
- Subscription method: Compliance
- Response: Error 404 @ 2026-02-18 16:25 UTC

**Root cause:** TOML URI = `wolfpack-only-bundles` ≠ `PUBSUB_TOPIC=wolfpack-product-bundles`

## Progress Log

### 2026-02-18 22:05 - Phase 1: Fix TOML Topic Name Completed
- ✅ Updated `shopify.app.toml` URI from `wolfpack-only-bundles` → `wolfpack-product-bundles`
- ✅ Files Modified:
  - `shopify.app.toml` (line 13: URI in `[[webhooks.subscriptions]]`)
- Result: TOML now references the actual GCP Pub/Sub topic
- Next: Deploy via `shopify app deploy` to push config to Shopify

## Phases Checklist

- [x] Phase 1: Fix topic name in `shopify.app.toml` ✅ Completed
- [ ] Phase 2: Deploy via `shopify app deploy`

## Related Documentation

- `.env.prod` — `PUBSUB_TOPIC=wolfpack-product-bundles`
- `shopify.app.wolfpack-product-bundles-sit.toml` — SIT uses `wolfpack-product-bundles-staging` (correct pattern)
- GCP project: `light-quest-455608-i3`
