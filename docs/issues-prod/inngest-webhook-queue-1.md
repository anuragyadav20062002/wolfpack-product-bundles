# Issue: Inngest Durable Webhook Queue

**Issue ID:** inngest-webhook-queue-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

## Overview

Integrate Inngest as a durable event queue so failed webhook processing is automatically
retried. Webhook worker validates HMAC → `inngest.send()` → HTTP 200. Inngest calls back
to `/api/inngest` in the Remix app where the existing `WebhookProcessor` runs unchanged.

## Related Documentation

- `docs/inngest-webhook-queue/00-BR.md`
- `docs/inngest-webhook-queue/02-PO-requirements.md`
- `docs/inngest-webhook-queue/03-architecture.md`
- `docs/inngest-webhook-queue/04-SDE-implementation.md`

## Progress Log

### 2026-03-13 — Implemented (all phases)

- ✅ Phase 1: `app/inngest/types.ts` + `app/inngest/client.ts` + `tests/unit/inngest/client.test.ts`
- ✅ Phase 2: `app/inngest/functions.ts` + `tests/unit/inngest/functions.test.ts`
- ✅ Phase 3: `app/routes/api/api.inngest.tsx` (Inngest serve route, no tests — framework adapter)
- ✅ Phase 4: `app/services/webhook-worker.server.ts` — extracted `handleRequest`, swapped fire-and-forget for `inngest.send()`; `tests/unit/services/webhook-worker-inngest.test.ts`
- ✅ Phase 5: `scripts/webhook-worker.ts` startup log + `.env.example`
- 13 tests, 0 failures, 0 lint errors

## Phases Checklist

- [x] Phase 1: Inngest client + types (+ tests)
- [x] Phase 2: Inngest function (+ tests)
- [x] Phase 3: Remix serve route
- [x] Phase 4: Webhook worker integration (+ tests)
- [x] Phase 5: Wiring + env docs
