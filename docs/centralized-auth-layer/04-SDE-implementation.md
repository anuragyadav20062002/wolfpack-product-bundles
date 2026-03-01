# SDE Implementation Plan: Centralized Auth Layer for API Routes

**Based on:** `00-BR.md`, `02-PO-requirements.md`, `03-architecture.md`
**Issue:** `centralized-auth-layer-1`
**Approach:** TDD — tests written before implementation

---

## Overview

Create `app/lib/auth-guards.server.ts` with three typed guards, write a full test
suite first, then migrate all 14 API routes. Enforcement is via tests (not a CI script).

---

## Phase 1: Write Tests (TDD Red)

**File:** `tests/unit/lib/auth-guards.test.ts`

Tests to write before any implementation:

### `requireInternalSecret` (all novel logic lives here)
- ✅ Returns `null` when Authorization header matches `INTERNAL_WEBHOOK_SECRET`
- ✅ Returns 401 `Response` when Authorization header is missing
- ✅ Returns 401 when Authorization header has wrong token
- ✅ Returns 401 when `Authorization` scheme is not `Bearer`
- ✅ Returns 401 (fail-closed) when `INTERNAL_WEBHOOK_SECRET` is not set
- ✅ Uses constant-time comparison (timing-safe — verified via hash equality test)

### `requireAdminSession` (delegates to Shopify framework)
- ✅ Returns `{ admin, session }` when `authenticate.admin()` resolves
- ✅ Propagates thrown Response when `authenticate.admin()` throws (redirect/401)

### `requireAppProxy` (delegates to Shopify framework)
- ✅ Returns `{ session }` when `authenticate.public.appProxy()` resolves
- ✅ Propagates thrown Response when `authenticate.public.appProxy()` throws

### Webhook route integration (auth check fires before body parsing)
- ✅ `POST /api/webhooks/pubsub` with no Authorization → 401 before body touched
- ✅ `POST /api/webhooks/pubsub` with correct token → body is parsed and processed

---

## Phase 2: Implement `auth-guards.server.ts` (TDD Green)

**File:** `app/lib/auth-guards.server.ts`

Implement minimum code to make Phase 1 tests pass. See design in `03-architecture.md`.

---

## Phase 3: Migrate Admin-Tier Routes

Replace `authenticate.admin(request)` with `requireAdminSession(request)` in:

| File | Change |
|------|--------|
| `app/routes/api/api.billing.create.tsx` | `authenticate.admin` → `requireAdminSession` |
| `app/routes/api/api.billing.cancel.tsx` | Same |
| `app/routes/api/api.billing.confirm.tsx` | Same |
| `app/routes/api/api.billing.status.tsx` | Same |
| `app/routes/api/api.activate-cart-transform.tsx` | Same |
| `app/routes/api/api.check-cart-transform.tsx` | Same |
| `app/routes/api/api.ensure-product-template.tsx` | Same |

---

## Phase 4: Migrate App-Proxy-Tier Routes

Replace `authenticate.public.appProxy(request)` with `requireAppProxy(request)` in:

| File | Change |
|------|--------|
| `app/routes/api/api.bundles.json.tsx` | `authenticate.public.appProxy` → `requireAppProxy` |
| `app/routes/api/api.bundle.$bundleId[.]json.tsx` | Same |

---

## Phase 5: Add `requireInternalSecret` to Webhook Route

**File:** `app/routes/api/api.webhooks.pubsub.tsx`

Add at the top of `action()`, before any body parsing:
```typescript
const authError = requireInternalSecret(request);
if (authError) return authError;
```

This is a **behaviour change** — coordinate with the worker deployment to ensure
the worker sends `Authorization: Bearer <INTERNAL_WEBHOOK_SECRET>` before this ships.

---

## Phase 6: Annotate Public Routes

Add `// auth: public — <reason>` comment to loader functions in:

| File | Reason |
|------|--------|
| `app/routes/api/api.storefront-products.tsx` | Fetched by storefront widget directly |
| `app/routes/api/api.storefront-collections.tsx` | Fetched by storefront widget directly |
| `app/routes/api/api.design-settings.$shopDomain.tsx` | `<link>` tag — browser request, no session |

---

## Phase 7: Verification

```bash
# Run full test suite
npm run test:unit

# Check TypeScript compiles cleanly
npx remix vite:build

# Verify auth tier coverage by grep
grep -rn "requireAdminSession\|requireAppProxy\|requireInternalSecret\|auth: public" app/routes/api/
```

All 14 route files must appear in the grep output.

---

## Rollback Notes

- `requireAdminSession` and `requireAppProxy` are mechanical wrappers — reverting means
  swapping back to the direct `authenticate.*` call. No behaviour change.
- `requireInternalSecret` on the webhook route IS a behaviour change. To roll back,
  remove that one guard call. The worker must stop sending the Authorization header
  first (or the guard must be removed simultaneously with the worker deploy).

---

## Build & Verification Checklist

- [ ] All `auth-guards.test.ts` tests pass (green)
- [ ] TypeScript compiles without new errors
- [ ] All 14 `app/routes/api/*.tsx` files covered by grep
- [ ] `npm run test:unit` passes
