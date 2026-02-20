# Issue: Webhook Pub/Sub Endpoint Authentication

**Issue ID:** webhook-pubsub-auth-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-02-19
**Last Updated:** 2026-02-19 00:00

## Overview

The `/api/webhooks/pubsub` endpoint has no caller authentication. It accepts POST requests
from any source as long as they match the Pub/Sub message shape. The endpoint comment states
"Security is handled by Google Cloud IAM permissions", but this is only true for the Pub/Sub
subscription itself — the HTTP endpoint is exposed to the internet with no token verification.

Any attacker who discovers the URL can forge webhook events (fake uninstall, fake billing
update, fake product delete) and the app will process them as legitimate.

## Root Cause

Shopify HMAC signatures cannot be forwarded through Pub/Sub because:
1. Shopify signs the raw HTTP body with a per-request HMAC-SHA256 using `SHOPIFY_API_SECRET`
2. The background worker consumes that raw body, verifies HMAC (hopefully), and publishes to Pub/Sub
3. By the time a Pub/Sub message reaches this endpoint the original HMAC header is gone

The correct mitigation is a **shared internal secret** between the worker and this endpoint,
verified via `Authorization: Bearer <token>`.

## Attack Scenario

```
Attacker → POST /api/webhooks/pubsub
  {
    "message": {
      "data": "<base64 of fake app/uninstalled payload>",
      "attributes": {
        "X-Shopify-Topic": "app/uninstalled",
        "X-Shopify-Shop-Domain": "victim-store.myshopify.com",
        "X-Shopify-Webhook-Id": "fake-id-that-passes-idempotency"
      }
    }
  }
→ App deletes all data for victim-store
```

Idempotency check only prevents **replay** of the same webhook ID — it does not prevent
a freshly invented webhook ID from being processed.

## Fix

Add a constant-time HMAC or Bearer token check at the top of the `action` function:
- Env var: `INTERNAL_WEBHOOK_SECRET`
- Worker sends: `Authorization: Bearer <INTERNAL_WEBHOOK_SECRET>`
- Endpoint verifies before processing any further

## Progress Log

### 2026-02-19 00:00 - Issue Created
- Identified endpoint has zero caller authentication
- Documented attack scenario
- Planned shared secret Bearer token fix
- Files to modify: `app/routes/api/api.webhooks.pubsub.tsx`
- Next: Implement Bearer token check + update env var documentation

## Phases Checklist

- [ ] Phase 1: Add `INTERNAL_WEBHOOK_SECRET` env var check to endpoint
- [ ] Phase 2: Update `.env.example` / deployment docs with the new var
- [ ] Phase 3: Verify worker sends Authorization header (note: worker is separate service)
- [ ] Phase 4: Build verification

## Related Documentation
- `app/routes/api/api.webhooks.pubsub.tsx` — endpoint to fix
- `app/services/webhooks/processor.server.ts` — downstream processor (no change needed)
- `docs/issues-prod/webhook-consolidation-fix-1.md` — prior webhook architecture work
