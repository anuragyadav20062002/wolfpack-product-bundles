# Product Owner Requirements: Pub/Sub → Direct Render Webhook Migration

**Input:** `docs/pubsub-to-render-webhook-migration/00-BR.md`

---

## User Stories with Acceptance Criteria

### Story 1: Receive Shopify Webhooks Directly

**As** the Render worker service
**I want** to expose an HTTP endpoint that Shopify can POST webhooks to
**So that** I no longer depend on Google Cloud Pub/Sub for webhook ingestion

**Acceptance Criteria:**
- [ ] Given the worker is running, when Shopify POSTs `{"topic": "app_subscriptions/update", ...}` to `POST /webhooks`, then the server responds with HTTP 200 within 5 seconds
- [ ] Given the worker is running, when any HTTP method other than POST hits `/webhooks`, then the server responds 405 Method Not Allowed
- [ ] Given the worker starts, when `PORT` env var is set, then the HTTP server binds to that port; when `PORT` is unset, it defaults to 3001
- [ ] Given the worker starts, when `SHOPIFY_API_SECRET` is missing, the process exits with a clear error message before binding to any port

---

### Story 2: Validate Shopify HMAC Signatures

**As** the webhook endpoint
**I want** to verify `X-Shopify-Hmac-Sha256` on every incoming request
**So that** only legitimate Shopify webhook deliveries are processed

**Acceptance Criteria:**
- [ ] Given a valid HMAC header (HMAC-SHA256 of raw body using `SHOPIFY_API_SECRET`, base64-encoded), when the request arrives, then it is accepted and processing continues
- [ ] Given an invalid or missing `X-Shopify-Hmac-Sha256` header, when the request arrives, then the server responds 401 Unauthorized and logs an error
- [ ] Given the HMAC validation uses constant-time comparison (no timing attack), all comparisons must use `crypto.timingSafeEqual`
- [ ] Given an empty body, when the request arrives with a valid HMAC for an empty string, then it returns 400 Bad Request

---

### Story 3: Process All Existing Webhook Topics

**As** the webhook handler
**I want** to adapt the raw Shopify HTTP payload to the existing `PubSubMessage` format
**So that** `WebhookProcessor.processPubSubMessage()` handles it without any changes

**Acceptance Criteria:**
- [ ] Given a valid Shopify webhook POST, the raw body (UTF-8 string) is base64-encoded and placed in `message.data`
- [ ] Given a valid Shopify webhook POST, the following headers are mapped to `message.attributes`:
  - `X-Shopify-Topic` → `X-Shopify-Topic`
  - `X-Shopify-Shop-Domain` → `X-Shopify-Shop-Domain`
  - `X-Shopify-Webhook-Id` → `X-Shopify-Webhook-Id`
  - `X-Shopify-API-Version` → `X-Shopify-API-Version`
- [ ] Given missing `X-Shopify-Topic` or `X-Shopify-Shop-Domain` headers, the request returns 400 and is not processed
- [ ] Given a successful `WebhookProcessor` call, the 200 response is returned
- [ ] Given `WebhookProcessor` throws or returns `success: false`, the error is logged and a 200 is still returned (prevents Shopify retry storm for known-bad payloads)

---

### Story 4: Health Check Endpoint

**As** Render's infrastructure
**I want** a health check endpoint that returns 200
**So that** the service is correctly marked healthy and never spun down

**Acceptance Criteria:**
- [ ] Given the worker is running, `GET /health` returns HTTP 200 with JSON `{"status": "ok"}`
- [ ] The health endpoint does NOT require any authentication

---

### Story 5: Graceful Shutdown

**As** the Render platform
**I want** the worker to finish in-flight requests before exiting on SIGTERM
**So that** no webhook events are dropped during deploys

**Acceptance Criteria:**
- [ ] Given a SIGTERM signal, the HTTP server stops accepting new connections
- [ ] Given in-flight requests exist, SIGTERM waits up to 10 seconds for them to complete before forcing exit
- [ ] After all in-flight requests complete (or timeout), process exits with code 0

---

### Story 6: Update Shopify Webhook Registration (TOML)

**As** the Shopify platform
**I want** webhook subscriptions to point to HTTPS endpoints on the Render worker
**So that** events are delivered directly without any GCP intermediary

**Acceptance Criteria:**
- [ ] `shopify.app.toml` `[[webhooks.subscriptions]]` URI changed from `pubsub://light-quest-455608-i3:wolfpack-only-bundles` to `https://wolfpack-production-pubsub-worker.onrender.com/webhooks`
- [ ] `shopify.app.toml` `[[webhooks.subscriptions]]` declares all business-logic topics: `app_subscriptions/update`, `app_purchases_one_time/update`, `products/delete`, `products/update`, `app/uninstalled`, `app/scopes_update` (in addition to `compliance_topics`)
- [ ] `shopify.app.wolfpack-product-bundles-sit.toml` URI changed from `pubsub://light-quest-455608-i3:wolfpack-product-bundles-staging` to the SIT worker URL
- [ ] Both TOML files retain `compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]`

**Note on SIT worker URL:** If there is no separate Render worker for staging, the SIT TOML can point to the same production worker URL for now, or use a local tunnel URL during development.

---

### Story 7: Remove Google Cloud Pub/Sub Infrastructure

**As** the codebase
**I want** all GCP Pub/Sub references removed
**So that** there is no dead code or misleading configuration

**Acceptance Criteria:**
- [ ] `@google-cloud/pubsub` removed from `package.json` dependencies
- [ ] `scripts/pubsub-worker.ts` deleted
- [ ] `app/services/pubsub-worker.server.ts` deleted
- [ ] `npm run pubsub-worker` script removed from `package.json`; replaced with `npm run webhook-worker`
- [ ] The following env vars removed from documentation / `.env.example`:
  - `GOOGLE_CLOUD_PROJECT`
  - `PUBSUB_TOPIC`
  - `PUBSUB_SUBSCRIPTION`
  - `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- [ ] Render worker service `Start Command` updated to `npm run webhook-worker`
- [ ] `SHOPIFY_API_SECRET` added to Render worker env vars (needed for HMAC validation)

---

## Data Persistence

No schema changes. The existing `WebhookEvent` table (idempotency + audit) and `ComplianceRecord` table are unchanged. All Prisma models remain as-is.

## Backward Compatibility Requirements

- `WebhookProcessor.processPubSubMessage()` method signature unchanged — no call-site changes anywhere
- `PubSubMessage` interface reused as internal adapter type within the new worker
- All 11 webhook topic handlers untouched
- The existing `/api/webhooks/pubsub` Remix route can remain as a dead stub or be deleted (it is no longer called by anything)

## Out of Scope (explicit)

- Building a message queue or retry buffer in the worker (DB-level idempotency is sufficient)
- Modifying `WebhookProcessor`, handlers, or any Remix routes
- Adding async background processing beyond what already exists
- Setting up a separate SIT worker service on Render (deferred)
- Monitoring / alerting setup (separate concern)
