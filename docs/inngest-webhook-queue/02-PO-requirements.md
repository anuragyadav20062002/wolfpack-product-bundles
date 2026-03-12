# Product Owner Requirements: Inngest Durable Webhook Queue

## User Stories with Acceptance Criteria

---

### Story 1: Webhook Events Are Durably Enqueued

**As an** engineer
**I want** every inbound Shopify webhook to be forwarded to Inngest before the 200 response is sent
**So that** no event is lost if the handler crashes, the process restarts, or the DB is temporarily unavailable

**Acceptance Criteria:**
- [ ] Given a valid Shopify webhook POST, when the webhook worker receives it, then `inngest.send()` is called with the correct event name and payload before `res.end()` is called
- [ ] Given `inngest.send()` completes successfully, when the worker responds, then HTTP 200 is returned to Shopify within 5 seconds
- [ ] Given `inngest.send()` throws (Inngest unreachable), when the worker responds, then HTTP 200 is still returned to Shopify and the error is logged (Shopify must not receive a 5xx)
- [ ] Given a webhook with an unknown topic, when it is received, then it is forwarded to Inngest with an `shopify/unknown` event name and logged as a warning
- [ ] Given the same webhook is delivered twice by Shopify (same `X-Shopify-Webhook-Id`), when both are enqueued to Inngest, then only one runs to completion (idempotency via `WebhookEvent` unique constraint)

---

### Story 2: Per-Topic Inngest Functions Execute Existing Handler Logic

**As an** engineer
**I want** each Shopify webhook topic to have a dedicated Inngest function
**So that** topic-specific retry policies, logging, and failure isolation are possible

**Acceptance Criteria:**
- [ ] Given an `inventory_levels/update` event in Inngest, when the function runs, then `handleInventoryUpdate()` is called with the correct payload and shop domain
- [ ] Given a `products/update` or `products/delete` event in Inngest, when the function runs, then the appropriate product handler is called
- [ ] Given an `app_subscriptions/update` or `app_purchases_one_time/update` event, when the function runs, then the appropriate subscription handler is called
- [ ] Given an `app/uninstalled` or `app/scopes_update` event, when the function runs, then the appropriate lifecycle handler is called
- [ ] Given a `customers/data_request`, `customers/redact`, or `shop/redact` event, when the function runs, then the appropriate GDPR handler is called
- [ ] Given an `orders/create` event, when the function runs, then the orders handler is called (currently a no-op stub)
- [ ] Given a handler throws an error, when Inngest retries the function, then the handler is called again from the beginning with the original payload
- [ ] Given a handler returns `{ success: false }`, when the function completes, then the Inngest run is marked as failed (throws an error) so Inngest retries it

---

### Story 3: Automatic Retry with Exponential Backoff

**As an** engineer
**I want** failed webhook processing attempts to be retried automatically
**So that** transient errors (DB timeouts, API rate limits, cold starts) resolve without manual intervention

**Acceptance Criteria:**
- [ ] Given a function throws on first attempt, when Inngest retries, then the second attempt occurs after ≥ 1 second
- [ ] Given a function fails all retry attempts (default: 3 retries), when the final attempt fails, then the run is marked as `Failed` in the Inngest dashboard and no further retries occur
- [ ] Given a function that previously failed is re-run via manual replay in the dashboard, when replayed, then the full handler logic executes with the original payload
- [ ] Given the `inventory_levels/update` handler — which has an internal 60-second debounce — when retried by Inngest, then the debounce logic still applies (no double inventory sync)

---

### Story 4: `/api/inngest` Serve Route in Remix App

**As an** engineer
**I want** the Remix app to expose an Inngest serve route
**So that** Inngest can call registered functions when events are ready to process

**Acceptance Criteria:**
- [ ] Given a POST to `/api/inngest` from Inngest with a valid signature, when the request is received, then the appropriate function is invoked
- [ ] Given a POST to `/api/inngest` with an invalid or missing signature, when the request is received, then a 401 is returned and no function runs
- [ ] Given the Remix app is deployed to Render, when Inngest makes a callback, then the route is reachable at `{SHOPIFY_APP_URL}/api/inngest`
- [ ] Given a GET to `/api/inngest`, when the Inngest Dev Server probes the route, then the registered function list is returned (introspection)

---

### Story 5: Local Development with Inngest Dev Server

**As an** engineer
**I want** to be able to run Inngest locally without a public URL
**So that** I can develop and test webhook processing on my machine

**Acceptance Criteria:**
- [ ] Given `npx inngest-cli@latest dev` is running locally, when the Remix dev server is also running, then the Dev Server connects to `/api/inngest` automatically
- [ ] Given a webhook is sent to the local webhook worker (e.g. via `curl` or Shopify CLI), when it is forwarded to Inngest, then it appears in the Dev Server UI at `http://localhost:8288`
- [ ] Given `INNGEST_DEV=1` environment variable is set, when `inngest.send()` is called, then events are routed to the local Dev Server instead of Inngest Cloud
- [ ] Given no `INNGEST_SIGNING_KEY` is set in local `.env`, when the app starts, then it does not crash (Dev Server mode does not require a signing key)

---

### Story 6: Environment Configuration

**As an** engineer
**I want** all Inngest credentials to be stored in environment variables
**So that** secrets are not hardcoded and each environment (dev/SIT/prod) can use different keys

**Acceptance Criteria:**
- [ ] Given `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set in the environment, when the app boots, then Inngest uses those keys for authentication
- [ ] Given `INNGEST_EVENT_KEY` is missing in production, when `inngest.send()` is called, then an error is logged and webhook processing falls back gracefully (does not crash the worker)
- [ ] Given `INNGEST_DEV=1` is set, when the app initialises, then Inngest operates in dev mode (no signing key required)
- [ ] The following variables must be documented in `.env.example`:
  - `INNGEST_EVENT_KEY` — for sending events from the webhook worker
  - `INNGEST_SIGNING_KEY` — for validating Inngest callbacks to `/api/inngest`
  - `INNGEST_DEV` — set to `1` for local dev (optional)

---

## UI/UX Specifications

This feature has no merchant-facing UI. All observability surfaces are within the Inngest dashboard (external SaaS).

**Developer-facing observability (Inngest dashboard):**
- Event stream: every `shopify/*` event with shop domain and topic visible in name
- Function run list: per-function execution history with status (Completed / Failed / Retrying)
- Run detail: full payload, step output, error message, retry count
- Manual replay: button on any failed run to re-execute with original payload

**Event naming convention** (determines how events appear in the dashboard):
```
shopify/inventory_levels.update
shopify/products.update
shopify/products.delete
shopify/app_subscriptions.update
shopify/app_purchases_one_time.update
shopify/app.uninstalled
shopify/app.scopes_update
shopify/orders.create
shopify/customers.data_request
shopify/customers.redact
shopify/shop.redact
shopify/unknown          ← catch-all for unrecognised topics
```

(Dots used instead of slashes in event names — Inngest uses `/` as a namespace separator, so topic slashes must be replaced with dots.)

---

## Data Persistence

No new DB tables or schema changes required.

The existing `WebhookEvent` table continues to provide idempotency:
- Row created with `processed: false` when the Inngest function begins
- Row updated to `processed: true` on handler success
- Row stays `processed: false` if handler fails (Inngest retries → tries again)
- Unique constraint `(shopDomain, topic, webhookId)` prevents duplicate side-effects across retries

Inngest itself stores event history (3 days on free tier, configurable on paid).

---

## Backward Compatibility Requirements

- The existing `WebhookEvent` idempotency logic must not be changed — Inngest retries must pass through the same dedup check
- The existing handler functions (`handleInventoryUpdate`, `handleProductUpdate`, etc.) must not be modified — Inngest functions wrap them, they do not replace them
- The webhook worker's HMAC validation and header checking must remain unchanged
- During the transition period, the direct processing path in the webhook worker may run in parallel with the Inngest path (both protected by idempotency)

---

## Out of Scope (Explicit)

- Custom retry counts or backoff curves per topic (all use Inngest default: 3 retries)
- Inngest Crons or scheduled jobs
- Any merchant-facing UI for event management
- Migrating existing `processed: false` rows in `WebhookEvent` to Inngest for replay
- Rate limiting or concurrency throttling per shop (future concern)
- Webhook signature verification inside the Inngest function (already done at ingress in the webhook worker)
