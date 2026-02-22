# Architecture Decision Record: Pub/Sub → Direct Render Webhook Migration

**Inputs:**
- `docs/pubsub-to-render-webhook-migration/00-BR.md`
- `docs/pubsub-to-render-webhook-migration/02-PO-requirements.md`

---

## Context

The Google Cloud Pub/Sub intermediary between Shopify and the Render worker is no longer available. The Render worker (`wolfpack-production-pubsub-worker`) must become a first-class HTTP webhook receiver. Key constraint: `WebhookProcessor.processPubSubMessage()` and all downstream handlers must remain unchanged — only the ingestion layer (worker) changes.

## Constraints

- Must preserve `WebhookProcessor.processPubSubMessage(PubSubMessage)` call signature — zero changes to processor or handlers
- Must validate Shopify HMAC signatures (impossible via Pub/Sub; now possible and required)
- Must run on the existing Render worker service under `tsx scripts/<entrypoint>.ts`
- No new npm packages — Node.js built-in `node:http` + `node:crypto` are sufficient
- Worker must respond to Shopify within 5 seconds
- Must not break the main Remix app at all

## Options Considered

### Option A: Express HTTP server
- Add `express` (+ `@types/express`) and build a small REST server
- **Pros:** Familiar API; body parsing middleware; easy to add middleware
- **Cons:** New dependency for a 50-line server; unnecessary for our 2-endpoint use case
- **Verdict:** ❌ Rejected — over-engineered for a two-endpoint worker

### Option B: Native `node:http` server ✅ Recommended
- Use `node:http.createServer()` directly with manual body reading and routing
- **Pros:** Zero new dependencies; already available; total control over raw body (required for HMAC); small and transparent
- **Cons:** More verbose than Express; manual routing
- **Verdict:** ✅ Recommended — keeps footprint minimal; HMAC requires raw body access anyway (middleware-based body parsing can corrupt it)

### Option C: Hono or Fastify
- Lightweight modern HTTP frameworks with built-in TypeScript support
- **Pros:** Type-safe; fast; good ergonomics
- **Cons:** New dependency; Hono/Fastify raw body access requires config; overkill for 2 routes
- **Verdict:** ❌ Rejected — same reasoning as Option A

---

## Decision: Option B — Native `node:http`

The worker is a purpose-built 2-endpoint service. Using `node:http` avoids new dependencies, gives direct access to the raw request body (required for HMAC), and produces a worker that is easy to read and audit.

---

## Architecture: New Data Flow

```
Shopify event fires
    │
    ▼  POST /webhooks  (X-Shopify-Hmac-Sha256, X-Shopify-Topic, ...)
https://wolfpack-production-pubsub-worker.onrender.com
    │
    ▼  webhook-worker.server.ts  (node:http server on PORT)
    │   1. Read raw body as Buffer
    │   2. Validate HMAC-SHA256 (constant-time)  ──► 401 on failure
    │   3. Validate required headers              ──► 400 on missing
    │   4. Adapt to PubSubMessage format:
    │       data      = rawBody.toString("base64")
    │       attributes = Shopify headers object
    │   5. Call WebhookProcessor.processPubSubMessage()
    │   6. Respond 200
    ▼
WebhookProcessor.processPubSubMessage()   ← UNCHANGED
    │   app/services/webhooks/processor.server.ts
    ▼
Handlers (subscription, product, gdpr, lifecycle)  ← UNCHANGED
    │
    ▼
Prisma / Database  ← UNCHANGED
```

---

## HMAC Validation Algorithm

Shopify computes `HMAC-SHA256(raw_body, SHOPIFY_API_SECRET)` and base64-encodes it in the `X-Shopify-Hmac-Sha256` header.

```typescript
import { createHmac, timingSafeEqual } from "node:crypto";

function validateHmac(rawBody: Buffer, hmacHeader: string, secret: string): boolean {
  const digest = createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  const a = Buffer.from(hmacHeader);
  const b = Buffer.from(digest);

  // Pad to equal length so timingSafeEqual doesn't throw
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

**Critical:** The raw body must be read as a `Buffer` (not parsed as JSON) before HMAC validation. JSON parsing must happen after validation.

---

## PubSubMessage Adapter

The existing `PubSubMessage` interface (unchanged):

```typescript
interface PubSubMessage {
  data: string; // base64 encoded JSON
  attributes: {
    "X-Shopify-Topic": string;
    "X-Shopify-Shop-Domain": string;
    "X-Shopify-Webhook-Id"?: string;
    "X-Shopify-API-Version"?: string;
  };
}
```

Adapter logic in worker (converts raw Shopify HTTP → PubSubMessage):

```typescript
function adaptShopifyWebhook(rawBody: Buffer, headers: IncomingHttpHeaders): PubSubMessage {
  return {
    data: rawBody.toString("base64"),
    attributes: {
      "X-Shopify-Topic":      headers["x-shopify-topic"]      as string,
      "X-Shopify-Shop-Domain": headers["x-shopify-shop-domain"] as string,
      "X-Shopify-Webhook-Id": headers["x-shopify-webhook-id"]  as string | undefined,
      "X-Shopify-API-Version": headers["x-shopify-api-version"] as string | undefined,
    },
  };
}
```

This is the only adapter needed. No changes to `WebhookProcessor`.

---

## Environment Variables

### Removed (GCP only)
```
GOOGLE_CLOUD_PROJECT
PUBSUB_TOPIC
PUBSUB_SUBSCRIPTION
GOOGLE_APPLICATION_CREDENTIALS_JSON
```

### Added to Render Worker Service
```
SHOPIFY_API_SECRET    # required — used for HMAC validation
PORT                  # injected by Render automatically
DATABASE_URL          # already present
INTERNAL_WEBHOOK_SECRET  # already present (used by processor for internal calls)
```

`SHOPIFY_API_SECRET` must be set in the Render worker's environment variables. It's already in the main Remix app; the same value is needed here.

---

## Files to Create / Modify / Delete

| Action | File | Change |
|--------|------|--------|
| **CREATE** | `scripts/webhook-worker.ts` | New entry point — replaces `scripts/pubsub-worker.ts` |
| **CREATE** | `app/services/webhook-worker.server.ts` | HTTP server implementation — replaces `pubsub-worker.server.ts` |
| **DELETE** | `scripts/pubsub-worker.ts` | No longer needed |
| **DELETE** | `app/services/pubsub-worker.server.ts` | No longer needed |
| **MODIFY** | `package.json` | Remove `@google-cloud/pubsub`; rename `pubsub-worker` script to `webhook-worker` |
| **MODIFY** | `shopify.app.toml` | Change webhook URI from `pubsub://` to HTTPS; add business-logic topics |
| **MODIFY** | `shopify.app.wolfpack-product-bundles-sit.toml` | Same URI change for staging |
| **KEEP** | `app/routes/api/api.webhooks.pubsub.tsx` | No longer called, but harmless to leave as-is; can be deleted in cleanup pass |
| **NO CHANGE** | `app/services/webhooks/processor.server.ts` | Untouched |
| **NO CHANGE** | `app/services/webhooks/handlers/*.ts` | Untouched |
| **NO CHANGE** | `app/services/webhooks/types.ts` | Untouched |
| **NO CHANGE** | All Prisma schema | Untouched |

---

## shopify.app.toml Webhook Section (after migration)

**Production (`shopify.app.toml`):**
```toml
[webhooks]
api_version = "2025-10"

  [[webhooks.subscriptions]]
  topics = [
    "app_subscriptions/update",
    "app_purchases_one_time/update",
    "products/delete",
    "products/update",
    "app/uninstalled",
    "app/scopes_update"
  ]
  uri = "https://wolfpack-production-pubsub-worker.onrender.com/webhooks"
  compliance_topics = [ "customers/data_request", "customers/redact", "shop/redact" ]
```

**Staging (`shopify.app.wolfpack-product-bundles-sit.toml`):**
```toml
[webhooks]
api_version = "2025-10"

  [[webhooks.subscriptions]]
  topics = [
    "app_subscriptions/update",
    "app_purchases_one_time/update",
    "products/delete",
    "products/update",
    "app/uninstalled",
    "app/scopes_update"
  ]
  uri = "https://wolfpack-product-bundles-staging-worker.onrender.com/webhooks"
  compliance_topics = [ "customers/data_request", "customers/redact", "shop/redact" ]
```

**Note:** If there is no separate staging worker on Render, replace the staging URI with the production worker URL temporarily, or use `ngrok` for local development testing.

---

## Migration / Backward Compatibility Strategy

1. **Deploy worker first** (new HTTP server) before updating TOML — worker starts receiving zero traffic, no risk
2. **Update TOML + `shopify app deploy`** — Shopify re-registers webhooks to new URIs. Old Pub/Sub topic can be left in GCP (it will simply receive nothing new)
3. **Verify** one webhook fires successfully (check Render logs)
4. **Remove GCP resources** manually from GCP Console after verifying (topic, subscription, service account) — optional cleanup, no code dependency

## Testing Approach

- **Unit:** `validateHmac()` function — valid HMAC passes, invalid fails, timing-safe
- **Integration:** Start HTTP server locally, POST with valid/invalid HMAC using `curl`
- **E2E:** Verify via Shopify Partner Dashboard > Webhooks > Delivery attempts after deploy
- **Manual local test script:** `curl -X POST http://localhost:3001/webhooks -H "X-Shopify-Topic: products/update" -H "X-Shopify-Shop-Domain: test.myshopify.com" -H "X-Shopify-Hmac-Sha256: <computed>" -d '{"id": 123}'`
