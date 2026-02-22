# Issue: Replace GCP Pub/Sub Worker with Direct HTTP Webhook Receiver

**Issue ID:** pubsub-to-render-webhook-migration-1
**Status:** Completed
**Priority:** High
**Created:** 2026-02-22
**Last Updated:** 2026-02-22 00:00

## Overview

The Google Cloud Pub/Sub free trial expired, cutting off the webhook ingestion
layer that bridges Shopify events to the app's processing logic. Billing webhooks,
product lifecycle webhooks, GDPR compliance webhooks, and app lifecycle webhooks
all stopped executing silently.

This migration replaces the Pub/Sub polling worker with a lightweight native
Node.js HTTP server that Shopify POSTs webhooks to directly. `WebhookProcessor`
and all handlers are completely unchanged — only the ingestion layer is replaced.

## Progress Log

### 2026-02-22 00:00 - Analysis and Planning
- Read 00-BR.md, 02-PO-requirements.md, 03-architecture.md pipeline docs
- Read existing `scripts/pubsub-worker.ts` and `app/services/pubsub-worker.server.ts`
- Read `app/services/webhooks/processor.server.ts` and `types.ts` to confirm unchanged interfaces
- Read `app/lib/logger.ts` to match AppLogger patterns
- Read both `shopify.app.toml` files and `package.json`

### 2026-02-22 00:00 - Implementation (All Phases)

**Phase 1 — Created `app/services/webhook-worker.server.ts`:**
- Native `node:http.createServer()` with manual routing — zero new dependencies
- Module-level env validation: throws at import time if `SHOPIFY_API_SECRET` missing
- Binds to `process.env.PORT ?? 3001`
- `GET /health` → 200 `{"status": "ok"}`
- `POST /webhooks` → HMAC validate (constant-time) → header validate → adapt to PubSubMessage → respond 200 → process async
- Wrong method on `/webhooks` → 405; all other paths → 404
- SIGTERM handler with 10-second hard-timeout for graceful shutdown
- All logging via `AppLogger` with `component: "webhook-worker"` context

**Phase 2 — Created `scripts/webhook-worker.ts`:**
- Startup banner logging PORT, DATABASE_URL, SHOPIFY_API_SECRET presence
- Calls `startWebhookWorker()`

**Phase 3 — Modified `package.json`:**
- Removed `@google-cloud/pubsub` from `dependencies`
- Renamed `pubsub-worker` script to `webhook-worker`

**Phase 4 — Modified both TOML files:**
- Production `shopify.app.toml`: changed URI from `pubsub://...` to `https://wolfpack-production-pubsub-worker.onrender.com/webhooks`; added 6 business-logic topics
- Staging `shopify.app.wolfpack-product-bundles-sit.toml`: changed URI to `https://wolfpack-staging-pubsub-worker.onrender.com/webhooks`; added `app/uninstalled` and `app/scopes_update` topics

**Phase 5 — Deleted old files:**
- `scripts/pubsub-worker.ts`
- `app/services/pubsub-worker.server.ts`
- Created `docs/pubsub-to-render-webhook-migration/04-SDE-implementation.md`

**Phase 6 — Lint, issue file, commit:**
- ESLint run on new files: no errors
- Issue file created (this file)
- Committed with `[pubsub-to-render-webhook-migration-1] feat: Replace GCP Pub/Sub worker with direct HTTP webhook receiver on Render`

### 2026-02-22 00:00 - Completed

- [x] `app/services/webhook-worker.server.ts` created with full HTTP server implementation
- [x] `scripts/webhook-worker.ts` entry point created
- [x] `package.json` updated (removed `@google-cloud/pubsub`, renamed script)
- [x] `shopify.app.toml` updated with HTTPS URIs and topic list
- [x] `shopify.app.wolfpack-product-bundles-sit.toml` updated with HTTPS URIs and topic list
- [x] `scripts/pubsub-worker.ts` deleted
- [x] `app/services/pubsub-worker.server.ts` deleted
- [x] `docs/pubsub-to-render-webhook-migration/04-SDE-implementation.md` created
- [x] ESLint clean (no errors)
- [x] Committed

## Manual Steps Required (Not automated)

1. **Update Render worker Start Command** from `npm run pubsub-worker` to `npm run webhook-worker` (both production and staging workers)
2. **Add `SHOPIFY_API_SECRET`** to Render worker service environment variables
3. **Run `shopify app deploy`** to re-register webhooks with the new HTTPS URIs
4. **Verify delivery** in Render worker logs
5. **Clean up GCP resources** (optional): delete Pub/Sub topic, subscription, and service account from GCP Console

## Related Documentation

- `docs/pubsub-to-render-webhook-migration/00-BR.md` — Business Requirements
- `docs/pubsub-to-render-webhook-migration/02-PO-requirements.md` — PO Requirements
- `docs/pubsub-to-render-webhook-migration/03-architecture.md` — Architecture Decision Record
- `docs/pubsub-to-render-webhook-migration/04-SDE-implementation.md` — SDE Implementation Notes

## Phases Checklist

- [x] Phase 1: Create `app/services/webhook-worker.server.ts`
- [x] Phase 2: Create `scripts/webhook-worker.ts`
- [x] Phase 3: Update `package.json`
- [x] Phase 4: Update both TOML files
- [x] Phase 5: Delete old files + write SDE doc
- [x] Phase 6: Lint + issue file + commit
