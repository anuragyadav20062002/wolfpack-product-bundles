# SDE Implementation Plan: Inngest Durable Webhook Queue

## Overview

4 phases. Each phase: tests first (Red) → implementation (Green) → lint → commit.
Existing handler files are never touched. The Inngest function is a thin wrapper around
the unchanged `WebhookProcessor.processPubSubMessage()`.

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/inngest/client.test.ts` | Client init, INNGEST_DEV base URL switch, graceful degradation when key missing | Pending |
| `tests/unit/inngest/functions.test.ts` | Function throws on `success: false`; calls processor with correct PubSubMessage shape; passes shopDomain/topic/webhookId | Pending |
| `tests/unit/services/webhook-worker-inngest.test.ts` | `inngest.send()` called before `res.end()`; 200 returned even when `inngest.send()` throws; correct event payload shape | Pending |
| `tests/integration/inngest-webhook-flow.test.ts` | Full flow: webhook → send → function → processor → idempotency | Pending |

---

## Phase 1: Inngest client + types

**Tests (Red):** `tests/unit/inngest/client.test.ts`
**Implementation (Green):**
- `app/inngest/types.ts`
- `app/inngest/client.ts`

---

## Phase 2: Inngest function

**Tests (Red):** `tests/unit/inngest/functions.test.ts`
**Implementation (Green):** `app/inngest/functions.ts`

---

## Phase 3: Remix serve route

**Implementation (no tests — framework adapter boilerplate):** `app/routes/api/api.inngest.tsx`

---

## Phase 4: Webhook worker integration

**Tests (Red):** `tests/unit/services/webhook-worker-inngest.test.ts`
**Implementation (Green):** `app/services/webhook-worker.server.ts`

---

## Phase 5: Wiring + env docs

**Implementation:** `package.json`, `.env.example`, `scripts/webhook-worker.ts`

---

## Build & Verification Checklist

- [ ] All new tests pass (`npm test`)
- [ ] No regressions in existing tests
- [ ] TypeScript compiles without new errors
- [ ] Inngest Dev Server connects to `/api/inngest` locally
- [ ] Test webhook reaches function via Dev Server UI
- [ ] Backward-compatible — existing WebhookEvent idempotency intact

## Rollback Notes

Revert `webhook-worker.server.ts` to restore the `.then()` fire-and-forget block.
Remove `app/inngest/` directory and `app/routes/api/api.inngest.tsx`.
No DB migrations to undo.
