# Product Owner Requirements: Centralized Auth Layer for API Routes

**Based on:** `docs/centralized-auth-layer/00-BR.md`

---

## User Stories with Acceptance Criteria

---

### Story 1: Auth Helpers File

**As a** backend engineer
**I want** typed auth helper functions in a single file
**So that** I know exactly which function to call when creating a new API route, and auth behavior is consistent across all routes

**Acceptance Criteria:**
- [ ] Given `app/lib/auth-guards.server.ts` exists, when an engineer creates a new admin API route, they call `requireAdminSession(request)` and receive `{ session, admin }` typed correctly
- [ ] Given `app/lib/auth-guards.server.ts` exists, when an engineer creates a new app-proxy route, they call `requireAppProxy(request)` and receive `{ session, storefront }` typed correctly
- [ ] Given a request with a missing or invalid `Authorization` header hits an internal endpoint, when `requireInternalSecret(request)` is called, then it returns a JSON 401 response and the route never processes the payload
- [ ] Given a request with a valid `Authorization: Bearer <INTERNAL_WEBHOOK_SECRET>` header, when `requireInternalSecret(request)` is called, then it returns `null` (no error) and the route proceeds
- [ ] Given `INTERNAL_WEBHOOK_SECRET` is not set in environment, when the app starts, then a warning is logged (non-fatal, so existing behavior isn't broken if secret not yet configured)

---

### Story 2: Webhook Endpoint Protected

**As a** security-conscious operator
**I want** `/api/webhooks/pubsub` to reject requests that don't include the correct internal secret
**So that** an attacker cannot forge fake webhook events even if they discover the endpoint URL

**Acceptance Criteria:**
- [ ] Given a POST to `/api/webhooks/pubsub` without an `Authorization` header, then response is `401 Unauthorized` with JSON `{ "error": "Unauthorized" }`
- [ ] Given a POST to `/api/webhooks/pubsub` with a wrong Bearer token, then response is `401 Unauthorized`
- [ ] Given a POST to `/api/webhooks/pubsub` with correct Bearer token, then existing processing logic runs unchanged
- [ ] Given `INTERNAL_WEBHOOK_SECRET` is empty string or undefined, then the endpoint rejects ALL requests (fail-closed behavior) and logs a startup/request-time warning

---

### Story 3: All API Routes Use Helpers

**As a** security reviewer
**I want** every route in `app/routes/api/` to explicitly declare its auth tier
**So that** auth coverage can be confirmed with a grep/lint rather than manual code inspection

**Acceptance Criteria:**
- [ ] Given all `app/routes/api/*.tsx` files, when grepped for `requireAdminSession | requireAppProxy | requireInternalSecret | // auth: public`, then every file matches at least one
- [ ] Given `api.billing.*` routes, then they all call `requireAdminSession`
- [ ] Given `api.bundles.json` and `api.bundle.$bundleId.json`, then they call `requireAppProxy`
- [ ] Given `api.webhooks.pubsub`, then it calls `requireInternalSecret`
- [ ] Given `api.storefront-products` and `api.storefront-collections`, then they have `// auth: public` annotation (intentionally public, explicitly declared)
- [ ] Given `api.design-settings.$shopDomain`, then it calls `requireAppProxy` or validates shop exists in DB before returning data

---

### Story 4: CI Enforcement Script

**As a** team lead
**I want** the build to fail if a new api route ships without declaring its auth tier
**So that** the pattern is enforced without relying on code review alone

**Acceptance Criteria:**
- [ ] Given a `scripts/check-api-auth.sh` (or `.ts`) script exists, when run against the codebase, then it exits non-zero if any `app/routes/api/*.tsx` file does not contain a guard call or `// auth: public` annotation
- [ ] Given the script runs in CI (add to `package.json` scripts), when a PR adds a bare route with no auth declaration, then CI fails with a clear message identifying the offending file
- [ ] Given a legitimate public route with `// auth: public`, then the script passes without error

---

## UI/UX Specifications

This feature is backend-only — no UI changes. No Polaris components involved.

---

## Data Persistence

- No database schema changes
- One new environment variable: `INTERNAL_WEBHOOK_SECRET`
  - Format: any string, minimum 32 chars recommended
  - Should be set in `.env`, Fly.io/Render secrets, and documented in `.env.example`

---

## Backward Compatibility Requirements

- All existing API URLs must remain unchanged — no path renames
- Existing callers (Shopify app proxy, storefront widget, billing callbacks) continue to work
- Routes that currently have no auth (design-settings, storefront-products) must not break existing public callers after this change
  - `api.design-settings.$shopDomain` — design CSS is public data; auth check should be shop existence in DB (already happens), not a session check
  - `api.storefront-products` and `api.storefront-collections` — remain public by design with explicit annotation

---

## Out of Scope (explicit)

- `/app/*` admin routes — already protected, no change
- Cart transform extension (WASM) — not a web route
- Webhook HMAC verification on the Pub/Sub side (that is the worker's responsibility, tracked separately)
- Adding rate limiting (separate concern, separate issue)
- Auth for `api.design-settings.$shopDomain` beyond shop-existence check (CSS is non-sensitive data)
