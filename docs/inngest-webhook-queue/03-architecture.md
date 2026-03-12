# Architecture Decision Record: Inngest Durable Webhook Queue

## Context

The webhook worker (`app/services/webhook-worker.server.ts`) currently uses a fire-and-forget pattern: it returns HTTP 200 to Shopify immediately, then calls `WebhookProcessor.processPubSubMessage()` asynchronously via `.then()`. If that call throws — due to a DB timeout, Shopify API 429, OOM, or process restart on Render — the `WebhookEvent` row stays `processed: false` permanently. There is no retry scheduler, no visibility dashboard, and no replay mechanism.

We are introducing Inngest as the durable queue layer between webhook receipt and handler execution.

## Constraints

- Must not break the existing `WebhookEvent` idempotency logic (`(shopDomain, topic, webhookId)` unique constraint)
- Must not require changes to the existing handler files (`subscription.server.ts`, `product.server.ts`, `inventory.server.ts`, `orders.server.ts`, `gdpr.server.ts`, `lifecycle.server.ts`)
- The webhook worker is a **separate Render service** (Node.js HTTP server, not Remix). The Remix app is the main web service at `SHOPIFY_APP_URL`.
- Inngest's callback (`/api/inngest`) must be served from the Remix app (publicly reachable, always up)
- Must work locally without a public URL using Inngest Dev Server

---

## Options Considered

### Option A: Inngest in webhook worker + catch-all single function in Remix ✅ Recommended

**Description:**
- Webhook worker validates HMAC, calls `inngest.send({ name: "shopify/webhook", data: { ... } })`, returns 200
- Remix app exposes `/api/inngest` serving a **single** Inngest function that handles all topics
- The function reconstructs the `PubSubMessage` and delegates directly to `WebhookProcessor.processPubSubMessage()` — unchanged
- `WebhookProcessor` continues doing its own topic routing internally

**Pros:**
- Minimal diff — only the webhook worker's post-response code block changes
- `WebhookProcessor` is fully reused; zero changes to handler files
- Single function is simpler to maintain; topic routing already exists in the processor
- Inngest dashboard still shows the full payload and error per run; replay works per event instance

**Cons:**
- All topics share one function ID in the Inngest dashboard (slightly less granular filtering)

**Verdict:** ✅ Recommended — least code, zero handler changes, existing idempotency fully preserved

---

### Option B: Per-topic Inngest functions in Remix

**Description:**
- Webhook worker maps the Shopify topic to a specific Inngest event name (e.g. `shopify/inventory_levels.update`) and sends it
- Remix app defines one Inngest function per topic group (6 functions: inventory, product, subscription, lifecycle, gdpr, orders)
- Each function calls its specific handler directly (bypasses the processor's switch statement)

**Pros:**
- Fine-grained filtering in Inngest dashboard by topic
- Per-topic retry policies possible in future
- Failure in one topic group doesn't affect others (fully isolated)

**Cons:**
- Webhook worker needs a topic → event-name mapping table
- 6 Inngest functions to define and maintain
- Duplicates the topic-routing logic that already exists in `WebhookProcessor`
- Handler functions receive raw JSON, not the `PubSubMessage` format they currently expect — requires adapter code in each function

**Verdict:** ❌ Rejected — higher maintenance cost for no functional gain over Option A

---

### Option C: Keep direct processing + add Inngest only as a retry path

**Description:**
- Webhook worker continues to process synchronously in `.then()` (existing behaviour)
- On failure, catches the error and calls `inngest.send()` to enqueue a retry job
- Inngest function re-runs the failed event after backoff

**Pros:**
- Lowest risk — existing success path is entirely untouched
- Inngest only activates on failure

**Cons:**
- Does not solve the in-process crash scenario (if the process restarts, the catch never fires)
- More complex logic: two code paths with overlapping DB writes
- Risk of `WebhookEvent` being written by the direct path and then Inngest writing again — idempotency must handle this carefully
- Still has the silent failure mode for OOM/restart scenarios

**Verdict:** ❌ Rejected — does not fully solve the problem

---

## Decision: Option A

**Rationale:** The webhook worker's sole job becomes: validate → enqueue → acknowledge. All business logic stays exactly where it is — inside `WebhookProcessor.processPubSubMessage()`. The Inngest function is a thin wrapper of ~10 lines. This is the minimum viable change that solves all five problems identified in the BR (no retry, no visibility, no replay, in-process risk, invisible backlog).

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Shopify Platform                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │ POST /webhooks (HMAC signed)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│            Webhook Worker (Render — separate service)               │
│                                                                     │
│  1. Validate HMAC (constant-time)                                   │
│  2. inngest.send({ name: "shopify/webhook", data: { ... } })  ──►──┐│
│  3. HTTP 200 to Shopify                                            ││
└────────────────────────────────────────────────────────────────────┘│
                                                                      │
                             ┌────────────────────────────────────────┘
                             │ HTTPS event ingestion
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Inngest Cloud (managed)                        │
│                                                                     │
│  • Stores event durably                                             │
│  • Schedules function execution                                     │
│  • Manages retries (up to 3, exponential backoff)                   │
│  • Dashboard: event history, run details, manual replay             │
└────────────────────────────┬────────────────────────────────────────┘
                             │ POST /api/inngest (signed callback)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│           Remix App (Render — main web service)                     │
│                                                                     │
│  Route: app/routes/api/api.inngest.tsx                             │
│  └─► Inngest function: "shopify-webhook"                           │
│       └─► WebhookProcessor.processPubSubMessage(reconstructed msg) │
│            └─► idempotency check (WebhookEvent table)              │
│            └─► topic switch → specific handler                     │
│            └─► WebhookEvent.processed = true (on success)          │
│            └─► throw Error (on failure → Inngest retries)          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Inngest Event Payload (`shopify/webhook`)

```typescript
// app/inngest/types.ts

export interface ShopifyWebhookEventData {
  /** Raw Shopify webhook body, base64-encoded (same format as PubSubMessage.data) */
  rawPayload: string;
  /** Shopify topic, e.g. "inventory_levels/update" */
  topic: string;
  /** Shop domain, e.g. "store.myshopify.com" */
  shopDomain: string;
  /** Shopify webhook ID for idempotency (may be undefined for older webhook formats) */
  webhookId?: string;
  /** Shopify API version from X-Shopify-API-Version header */
  apiVersion?: string;
}
```

### No DB Schema Changes

The `WebhookEvent` Prisma model is unchanged:

```prisma
model WebhookEvent {
  id          String    @id @default(uuid())
  shopDomain  String
  topic       String
  webhookId   String?
  payload     Json
  processed   Boolean   @default(false)
  processedAt DateTime?
  error       String?
  retryCount  Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([shopDomain, topic, webhookId])
}
```

Inngest retries will each attempt to create/find the `WebhookEvent` row. The unique constraint ensures idempotency: if the row exists and `processed: true`, the processor returns early without re-running the handler.

---

## Retry Behaviour

| Attempt | Delay (Inngest default) | Inngest Run Status |
|---------|------------------------|--------------------|
| 1st | Immediate | Running |
| 2nd (retry 1) | ~30 seconds | Retrying |
| 3rd (retry 2) | ~2 minutes | Retrying |
| 4th (retry 3) | ~10 minutes | Retrying |
| Final failure | — | Failed |

- `WebhookEvent.retryCount` is NOT used to gate Inngest retries — Inngest manages its own retry counter. The field can be updated by the processor if desired but is not load-bearing.
- A function run is marked failed (and triggers retry) if and only if the function throws. The processor must therefore `throw` when `result.success === false` — it currently returns the failure instead. The Inngest wrapper handles this conversion.

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/inngest/client.ts` | Inngest client singleton (shared by webhook worker and Remix app) |
| `app/inngest/functions.ts` | `shopify-webhook` Inngest function definition |
| `app/inngest/types.ts` | `ShopifyWebhookEventData` type |
| `app/routes/api/api.inngest.tsx` | Remix route that serves the Inngest handler |

## Files to Modify

| File | Change |
|------|--------|
| `app/services/webhook-worker.server.ts` | Replace fire-and-forget `.then()` block with `inngest.send()` call |
| `scripts/webhook-worker.ts` | Add startup log for `INNGEST_EVENT_KEY` env var presence |
| `package.json` | Add `inngest` dependency |
| `.env.example` (create) | Document `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `INNGEST_DEV` |

## Files NOT Modified

| File | Reason |
|------|--------|
| `app/services/webhooks/processor.server.ts` | Inngest function calls it unchanged |
| `app/services/webhooks/handlers/*.server.ts` | All handler files completely untouched |
| `app/routes/api/api.webhooks.pubsub.tsx` | Existing Pub/Sub route stays (not removed) |
| All Prisma models | No schema changes |

---

## Environment Variables

| Variable | Where used | Required in prod | Local dev |
|----------|-----------|-----------------|-----------|
| `INNGEST_EVENT_KEY` | Webhook worker — authenticates `inngest.send()` to Inngest Cloud | Yes | No (Dev Server accepts any) |
| `INNGEST_SIGNING_KEY` | Remix app — validates Inngest callbacks to `/api/inngest` | Yes | No (Dev Server skips signature check) |
| `INNGEST_DEV` | Both — set to `1` to route to local Dev Server | No | Yes |

Both the **webhook worker** and the **Remix app** import `app/inngest/client.ts`. Environment variable precedence: if `INNGEST_DEV=1`, the client uses `baseUrl: "http://localhost:8288"` (Inngest Dev Server). Otherwise it uses Inngest Cloud defaults.

---

## Local Development Setup

```bash
# Terminal 1 — Inngest Dev Server
npx inngest-cli@latest dev

# Terminal 2 — Remix app (functions registered at /api/inngest)
INNGEST_DEV=1 npm run dev

# Terminal 3 — Webhook worker
INNGEST_DEV=1 npm run webhook-worker

# Send a test webhook to the local worker
curl -X POST http://localhost:3001/webhooks \
  -H "X-Shopify-Topic: inventory_levels/update" \
  -H "X-Shopify-Shop-Domain: test.myshopify.com" \
  -H "X-Shopify-Hmac-Sha256: <computed>" \
  -d '{"inventory_item_id":123,"location_id":456,"available":10}'
```

Events appear in Inngest Dev Server UI at `http://localhost:8288`.

---

## Migration / Backward Compatibility Strategy

**Phase 1 (this implementation):** Inngest replaces the fire-and-forget `.then()` in the webhook worker. Direct processing stops. All webhook events flow through Inngest.

**Transition consideration:** Any `WebhookEvent` rows currently stuck at `processed: false` are NOT automatically replayed by Inngest (they predate the Inngest integration). They remain in the DB. If a backfill is needed, it is a separate one-off task (out of scope per BR).

**Rollback:** If Inngest integration needs to be reverted:
1. Restore the original `.then()` fire-and-forget block in `webhook-worker.server.ts`
2. Remove `inngest.send()` call
3. Remove `/api/inngest` route
The `WebhookEvent` table and all handlers are untouched — rollback takes ~10 minutes.

---

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|---------------|
| `tests/unit/inngest/client.test.ts` | Unit | Client initialises correctly; `INNGEST_DEV` switches base URL; graceful degradation when `INNGEST_EVENT_KEY` missing |
| `tests/unit/inngest/functions.test.ts` | Unit | `shopify-webhook` function throws when processor returns `success: false`; calls processor with reconstructed PubSubMessage; passes correct topic/shopDomain/webhookId |
| `tests/unit/services/webhook-worker-inngest.test.ts` | Unit | `inngest.send()` called before `res.end()`; 200 returned even when `inngest.send()` throws; correct event name and payload shape |
| `tests/integration/inngest-webhook-flow.test.ts` | Integration | Full flow: receive webhook → `inngest.send()` → function → processor → DB idempotency check → handler called |

### Behaviours to Test

Derived from PO acceptance criteria:

1. **Happy path** — valid webhook → `inngest.send()` called → 200 returned → function executes → `WebhookEvent.processed = true`
2. **Inngest unreachable** — `inngest.send()` throws → error logged → 200 still returned to Shopify
3. **Duplicate webhook** — same `webhookId` processed twice → second run returns early (idempotency) → handler not called twice
4. **Handler failure** — processor returns `{ success: false }` → Inngest function throws → Inngest retries
5. **Unknown topic** — topic not in processor's switch → processor returns default handler result → no crash
6. **Dev mode** — `INNGEST_DEV=1` → client `baseUrl` is `http://localhost:8288`
7. **Missing signing key** — `/api/inngest` rejects request with invalid signature → 401

### Mock Strategy
- **Mock:** `inngest.send()` (to verify call shape without hitting Inngest Cloud)
- **Mock:** `WebhookProcessor.processPubSubMessage()` in unit tests (to verify the function wires it correctly)
- **Mock:** Prisma DB client in unit tests
- **Do NOT mock:** The Inngest client initialisation logic itself (test real behaviour)
- **Do NOT mock:** The PubSubMessage reconstruction (verify the exact shape)

### TDD Exceptions (no tests required)
- `.env.example` file
- `package.json` dependency addition
- Startup log line in `scripts/webhook-worker.ts`
- Inngest serve route boilerplate in `api.inngest.tsx` (it is a framework adapter, not business logic)
