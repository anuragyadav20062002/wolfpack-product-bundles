# Architecture Decision Record: Centralized Auth Layer for API Routes

**Based on:** `00-BR.md`, `02-PO-requirements.md`

---

## Context

14 routes under `app/routes/api/` each call `authenticate.*` directly (or don't call it at
all). Auth logic, error handling, and logging are duplicated across files. Two routes ship
with no auth. There is no structural or automated enforcement.

The `/app/*` admin routes already use the Remix layout route guard pattern correctly via
`app/routes/app/app.tsx`. We need an equivalent for `/api/*` — but one that handles three
distinct auth tiers without restructuring URLs.

---

## Constraints

- Must not change any URL paths — storefront widget, Shopify app proxy, and billing
  callbacks are registered externally
- Must work within the Remix Vite + `@shopify/shopify-app-remix` stack — no Express layer
- Must not introduce new npm dependencies
- Must not touch `app/routes/app/` (already correct)

---

## Options Considered

### Option A: Single Remix Layout Route for `/api/*`
Create `app/routes/api/api.tsx` as a layout parent.

**Verdict:** ❌ Rejected

A layout loader runs once per request and cannot conditionally apply different auth
strategies. The three tiers (admin session, app proxy, internal secret) are mutually
exclusive and require different `authenticate.*` methods. A single layout would need
branching on URL prefix — this is fragile, non-obvious, and requires updating the layout
every time a new route tier is introduced. The pattern also doesn't match how the
`@shopify/shopify-app-remix` framework is designed to be used.

### Option B: Tiered Sub-namespace Layout Routes
Create `api.admin.tsx`, `api.proxy.tsx`, `api.internal.tsx` layouts, rename all routes.

**Verdict:** ❌ Rejected

Renaming routes changes URL paths (e.g., `/api/billing/create` → `/api/admin/billing/create`).
App proxy URLs are registered in the Shopify Partner Dashboard and the storefront widget
JS. Billing callback URLs are registered with Shopify's billing API. Changing them requires
coordinated updates across external systems and the deployed widget JS bundles in
`extensions/bundle-builder/assets/`. Risk of silent breakage is high.

### Option C: Auth Helper Functions in `app/lib/auth-guards.server.ts` ✅
Extract auth calls into typed helpers. Routes call the appropriate helper at the top.
A CI script enforces all routes declare their tier.

**Verdict:** ✅ Recommended

- Zero URL changes
- Zero routing structure changes
- Centralizes error formatting, logging, and edge case handling
- Types flow correctly (each helper returns the right shape for its tier)
- Mechanically identical to what routes do today — just DRYed and auditable
- Lint enforcement makes it structural without framework gymnastics

---

## Decision: Option C — Auth Helper Functions

---

## Design

### New File: `app/lib/auth-guards.server.ts`

```typescript
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { timingSafeEqual, createHash } from "crypto";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import type { Session } from "@shopify/shopify-api";

// ─── Admin Session Guard ──────────────────────────────────────────────────────
// Use on routes that require an authenticated Shopify admin session.
// Equivalent to: await authenticate.admin(request)
// Returns: { admin, session } - the admin GraphQL client and session object
export async function requireAdminSession(request: Request): Promise<{
  admin: AdminApiContext["admin"];
  session: Session;
}> {
  const { admin, session } = await authenticate.admin(request);
  return { admin, session };
}

// ─── App Proxy Guard ──────────────────────────────────────────────────────────
// Use on routes called via Shopify's app proxy (storefront widget → Shopify CDN → app).
// Equivalent to: await authenticate.public.appProxy(request)
// Returns: { session } - session.shop is the validated shop domain
export async function requireAppProxy(request: Request): Promise<{
  session: Session;
}> {
  const { session } = await authenticate.public.appProxy(request);
  return { session };
}

// ─── Internal Secret Guard ────────────────────────────────────────────────────
// Use on routes called by internal services (e.g., the Pub/Sub worker).
// Checks Authorization: Bearer <INTERNAL_WEBHOOK_SECRET> using constant-time comparison.
// Returns: null (ok to proceed) | Response (401, caller must return immediately)
export function requireInternalSecret(request: Request): Response | null {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;

  if (!secret) {
    console.warn(
      "[auth-guards] INTERNAL_WEBHOOK_SECRET is not set — rejecting all internal requests (fail-closed)"
    );
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const prefix = "Bearer ";

  if (!authHeader.startsWith(prefix)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const provided = authHeader.slice(prefix.length);

  // Constant-time comparison — prevents timing side-channel attacks
  try {
    const a = createHash("sha256").update(provided).digest();
    const b = createHash("sha256").update(secret).digest();
    if (!timingSafeEqual(a, b)) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Authorized — caller proceeds
}
```

**Why `timingSafeEqual` on hashes instead of raw strings?**
`timingSafeEqual` requires equal-length buffers. Hashing both sides ensures equal length
regardless of input length while preserving timing-safe comparison semantics.

---

### Route Migration Pattern

**Before (billing route):**
```typescript
import { authenticate } from "../../shopify.server";

export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);
  ...
}
```

**After:**
```typescript
import { requireAdminSession } from "../../lib/auth-guards.server";

export async function action({ request }) {
  const { admin, session } = await requireAdminSession(request);
  ...
}
```

**Before (webhooks route):**
```typescript
export async function action({ request }) {
  const body = await request.json();
  // no auth
  ...
}
```

**After:**
```typescript
import { requireInternalSecret } from "../../lib/auth-guards.server";

export async function action({ request }) {
  const authError = requireInternalSecret(request);
  if (authError) return authError;

  const body = await request.json();
  ...
}
```

**Intentionally public routes (annotation pattern):**
```typescript
// auth: public — storefront widget fetches CSS directly in <link> tag; no session available
export async function loader({ request, params }) {
  ...
}
```

---

### New File: `scripts/check-api-auth.sh`

```bash
#!/usr/bin/env bash
# Verify every app/routes/api/*.tsx file declares its auth tier.
# Fails CI if any file has no guard call and no explicit '// auth: public' annotation.

set -e

ROUTES_DIR="app/routes/api"
FAILED=0

for file in "$ROUTES_DIR"/*.tsx; do
  if grep -qE \
    "requireAdminSession|requireAppProxy|requireInternalSecret|//\s*auth:\s*public" \
    "$file"; then
    continue
  fi
  echo "❌ MISSING AUTH DECLARATION: $file"
  FAILED=1
done

if [ "$FAILED" -eq 1 ]; then
  echo ""
  echo "Each file in $ROUTES_DIR must contain one of:"
  echo "  requireAdminSession(request)"
  echo "  requireAppProxy(request)"
  echo "  requireInternalSecret(request)"
  echo "  // auth: public"
  exit 1
fi

echo "✅ All API routes have declared auth tiers."
```

Add to `package.json`:
```json
"scripts": {
  "check:api-auth": "bash scripts/check-api-auth.sh"
}
```

---

## Files to Create / Modify

| File | Action | Change |
|------|--------|--------|
| `app/lib/auth-guards.server.ts` | **Create** | Three helper functions |
| `scripts/check-api-auth.sh` | **Create** | CI enforcement script |
| `package.json` | Modify | Add `check:api-auth` script |
| `app/routes/api/api.billing.create.tsx` | Modify | Replace `authenticate.admin` with `requireAdminSession` |
| `app/routes/api/api.billing.cancel.tsx` | Modify | Same |
| `app/routes/api/api.billing.confirm.tsx` | Modify | Same |
| `app/routes/api/api.billing.status.tsx` | Modify | Same |
| `app/routes/api/api.activate-cart-transform.tsx` | Modify | Same |
| `app/routes/api/api.check-cart-transform.tsx` | Modify | Same |
| `app/routes/api/api.check-bundles.tsx` | Modify | Same (if exists) |
| `app/routes/api/api.ensure-product-template.tsx` | Modify | Same |
| `app/routes/api/api.bundles.json.tsx` | Modify | Replace `authenticate.public.appProxy` with `requireAppProxy` |
| `app/routes/api/api.bundle.$bundleId[.]json.tsx` | Modify | Same |
| `app/routes/api/api.webhooks.pubsub.tsx` | Modify | Add `requireInternalSecret` at top |
| `app/routes/api/api.storefront-products.tsx` | Modify | Add `// auth: public` annotation |
| `app/routes/api/api.storefront-collections.tsx` | Modify | Add `// auth: public` annotation |
| `app/routes/api/api.design-settings.$shopDomain.tsx` | Modify | Add `// auth: public` annotation + note on why |
| `.env.example` (or equivalent) | Modify | Document `INTERNAL_WEBHOOK_SECRET` |

---

## Auth Tier Map (Final State)

| Route | Tier | Guard |
|-------|------|-------|
| `api.billing.*` (4 routes) | Admin session | `requireAdminSession` |
| `api.activate-cart-transform` | Admin session | `requireAdminSession` |
| `api.check-cart-transform` | Admin session | `requireAdminSession` |
| `api.ensure-product-template` | Admin session | `requireAdminSession` |
| `api.bundles.json` | App proxy | `requireAppProxy` |
| `api.bundle.$bundleId.json` | App proxy | `requireAppProxy` |
| `api.webhooks.pubsub` | Internal secret | `requireInternalSecret` |
| `api.storefront-products` | Public (intentional) | `// auth: public` |
| `api.storefront-collections` | Public (intentional) | `// auth: public` |
| `api.design-settings.$shopDomain` | Public (intentional) | `// auth: public` |

---

## Migration / Backward Compatibility Strategy

Each helper wraps the exact same `authenticate.*` call the route currently uses. There is
no behavior change for requests that are currently authorized. The only change is:
- Admin routes: error format becomes consistent (framework already handles redirect/401)
- Webhooks route: starts rejecting requests without the Authorization header (new behavior)
- Design settings: no change, just gets the annotation

Rollout order:
1. Create `auth-guards.server.ts` (no impact on running code)
2. Migrate admin routes (mechanical, safe)
3. Migrate app proxy routes (mechanical, safe)
4. Add annotations to public routes (no code change)
5. Add `requireInternalSecret` to webhooks route (this is the behavior change — coordinate with worker deployment to ensure the worker sends the header before this is deployed)

---

## Testing Approach

- **Unit:** `requireInternalSecret` — test missing header, wrong token, correct token, missing env var
- **Integration:** Each migrated route — verify a request with invalid session still gets 401/redirect
- **CI script:** Test that a bare route file fails the check, an annotated one passes
- **Manual:** Hit `/api/webhooks/pubsub` without Authorization header — should get 401

---

## Key Decision: `api.design-settings.$shopDomain` stays public

This route serves CSS variables (colors, fonts, spacing) via a `<link>` tag in the
storefront theme. The browser makes a direct GET request — there is no Shopify session
or app proxy signature available. Adding session-based auth here would break CSS loading
for every merchant's storefront. The data is non-sensitive design tokens. It stays public
with an explicit `// auth: public` annotation documenting this reasoning.
