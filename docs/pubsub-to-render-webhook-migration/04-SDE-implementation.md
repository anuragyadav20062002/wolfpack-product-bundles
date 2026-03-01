# SDE Implementation: Pub/Sub → Direct Render Webhook Migration

**Stage:** 4 — Implementation
**Issue ID:** pubsub-to-render-webhook-migration-1
**Status:** Completed
**Date:** 2026-02-22

---

## Summary

Replaced the Google Cloud Pub/Sub webhook ingestion layer with a direct HTTP webhook receiver running on the existing Render worker service. Shopify now POSTs webhook events directly to the Render worker over HTTPS, eliminating all GCP dependencies. `WebhookProcessor` and all downstream handlers are completely unchanged.

---

## Files Created

### `app/services/webhook-worker.server.ts`

The core HTTP server implementation. Key design points:

- Uses `node:http.createServer()` — zero new npm dependencies
- Validates `SHOPIFY_API_SECRET` at import time; throws if missing (fast-fail before any port is bound)
- Binds to `process.env.PORT ?? 3001` (Render injects `PORT` automatically)
- Two routes:
  - `GET /health` → 200 `{"status": "ok"}` — no auth, for Render health checks
  - `POST /webhooks` → HMAC validate → header validate → adapt → process → 200
  - Wrong method on `/webhooks` → 405
  - Everything else → 404
- HMAC validation uses `crypto.createHmac("sha256", secret).update(rawBody).digest("base64")` and `crypto.timingSafeEqual` (constant-time comparison) per NFR-01
- Reads raw body as `Buffer` before any JSON parsing (required for correct HMAC computation)
- Returns 200 to Shopify immediately after HMAC+header validation, then processes asynchronously — ensures Shopify's 5-second delivery window is never exceeded
- Always returns 200 for valid signatures even if `WebhookProcessor` fails — prevents Shopify retry storms for known-bad payloads; errors are logged at ERROR level
- Adapts raw HTTP headers to `PubSubMessage` format (unchanged interface from `types.ts`)
- Graceful SIGTERM shutdown: calls `server.close()`, waits up to 10 s, then `process.exit(0)` per NFR-02
- All logging via `AppLogger` matching component/operation context format used in `pubsub-worker.server.ts`
- Exports `startWebhookWorker()` and `stopWebhookWorker()` (the latter primarily for tests)

### `scripts/webhook-worker.ts`

Entry point script. Logs startup banner (PORT, DATABASE_URL, SHOPIFY_API_SECRET presence) then calls `startWebhookWorker()`. Uses `console.log` for the banner (consistent with the old `scripts/pubsub-worker.ts` pattern for pre-logger startup output).

### `docs/pubsub-to-render-webhook-migration/04-SDE-implementation.md`

This file.

---

## Files Modified

### `package.json`
- Removed `@google-cloud/pubsub` from `dependencies`
- Renamed `"pubsub-worker": "tsx scripts/pubsub-worker.ts"` to `"webhook-worker": "tsx scripts/webhook-worker.ts"`

### `shopify.app.toml` (production)
- Changed `[[webhooks.subscriptions]]` URI from `pubsub://light-quest-455608-i3:wolfpack-only-bundles` to `https://wolfpack-production-pubsub-worker.onrender.com/webhooks`
- Added `topics` array: `app_subscriptions/update`, `app_purchases_one_time/update`, `products/delete`, `products/update`, `app/uninstalled`, `app/scopes_update`
- Retained `compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]`

### `shopify.app.wolfpack-product-bundles-sit.toml` (staging)
- Changed URI from `pubsub://light-quest-455608-i3:wolfpack-product-bundles-staging` to `https://wolfpack-staging-pubsub-worker.onrender.com/webhooks`
- Updated `topics` array to include `app/uninstalled` and `app/scopes_update` (previously absent)
- Retained `compliance_topics`

---

## Files Deleted

- `scripts/pubsub-worker.ts` — GCP Pub/Sub entry point, no longer needed
- `app/services/pubsub-worker.server.ts` — GCP Pub/Sub client and message handler, no longer needed

---

## Files Unchanged (by design)

| File | Reason |
|------|--------|
| `app/services/webhooks/processor.server.ts` | Core constraint: zero changes to `WebhookProcessor` |
| `app/services/webhooks/types.ts` | `PubSubMessage` interface reused as adapter type |
| `app/services/webhooks/handlers/*.ts` | All handlers untouched |
| `app/services/webhook-processor.server.ts` | Re-export barrel, still valid |
| All Prisma schema | No data model changes |
| All Remix routes | No routing changes |

---

## Architecture Decisions Made

1. **Async processing after immediate 200 response**: The 200 is written to the socket before `WebhookProcessor.processPubSubMessage()` is awaited. This guarantees Shopify receives its acknowledgement within the 5-second window regardless of how long processing takes.

2. **Module-level env validation**: `SHOPIFY_API_SECRET` is checked at import time (before `startWebhookWorker()` is called). This ensures a misconfigured deployment fails immediately on startup with a clear error message, rather than silently accepting and dropping webhooks.

3. **SIGTERM with 10-second hard timeout**: `setTimeout` with `.unref()` is used so the timer doesn't prevent the event loop from closing if the server shuts down cleanly before the timeout expires.

4. **`stopWebhookWorker()` exported**: Not used by the entry point script, but provides a clean teardown API for integration tests that spin up the server in-process.

---

## Manual Steps Required (Post-Commit)

### 1. Deploy the Render worker with the new start command

Update the Render worker service (`wolfpack-production-pubsub-worker` and `wolfpack-staging-pubsub-worker`) Start Command from:
```
npm run pubsub-worker
```
to:
```
npm run webhook-worker
```

### 2. Add SHOPIFY_API_SECRET to Render worker environment variables

The worker now requires `SHOPIFY_API_SECRET` for HMAC validation. Add it to the Render worker service's environment variables (same value as used by the main Remix app).

### 3. Run `shopify app deploy`

After the Render worker is live and healthy, run:

```
shopify app deploy
```

This re-registers all webhook subscriptions with Shopify using the new HTTPS URIs. Shopify will begin POSTing webhooks to the Render worker immediately.

### 4. Verify delivery

Check Render worker logs for incoming `POST /webhooks` requests. Optionally check the Shopify Partner Dashboard > Apps > [App] > Webhooks > Delivery attempts.

### 5. Remove GCP resources (optional cleanup)

Once verified, the GCP Pub/Sub topic, subscription, and service account can be deleted from the GCP Console. No code depends on them after this migration.

---

## Test Plan

```bash
# 1. Compute a valid HMAC for a test body
BODY='{"id":123}'
SECRET="your_shopify_api_secret"
HMAC=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64)

# 2. Test valid webhook
curl -s -X POST http://localhost:3001/webhooks \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: products/update" \
  -H "X-Shopify-Shop-Domain: test.myshopify.com" \
  -H "X-Shopify-Hmac-Sha256: $HMAC" \
  -d "$BODY"
# Expected: {"received":true}

# 3. Test invalid HMAC
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/webhooks \
  -H "X-Shopify-Topic: products/update" \
  -H "X-Shopify-Shop-Domain: test.myshopify.com" \
  -H "X-Shopify-Hmac-Sha256: invalidsignature==" \
  -d "$BODY"
# Expected: 401

# 4. Test health check
curl -s http://localhost:3001/health
# Expected: {"status":"ok"}

# 5. Test 404
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/unknown
# Expected: 404
```
