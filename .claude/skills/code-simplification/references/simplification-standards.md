# Simplification Standards — Remix + Shopify + Prisma

> Positive patterns to enforce. Use these as the "after" state when rewriting anti-patterns.

---

## Standard 1: Fail Fast at Boundaries, Trust Inside

**Principle:** Validate and narrow data exactly once — at the entry point of a function or route. Once past that check, treat the data as correct. Do not re-validate downstream.

**Boundary = the first point data enters your control:**
- Loader or action function body (for form data, URL params)
- Auth guard return value (for session/admin)
- Prisma query result (for DB data)

```typescript
// ✅ CORRECT: Validate once, then use freely
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const bundleId = params.bundleId;
  if (!bundleId) throw new Response("Missing bundleId", { status: 400 });

  const bundle = await db.bundle.findUnique({ where: { id: bundleId } });
  if (!bundle) throw new Response("Bundle not found", { status: 404 });

  // Inside here, bundle is guaranteed. No further null checks needed.
  return json({ bundle, steps: bundle.steps });
};

// ❌ WRONG: Re-checking conditions that were already validated
return json({
  id: bundle?.id ?? null,           // bundle cannot be null here
  steps: bundle?.steps ?? [],        // unnecessary optional chaining
  name: bundle?.name || "Unknown",   // hiding a real data problem
});
```

---

## Standard 2: Throw for Expected HTTP Errors, Return for Validation Errors

**Decision matrix:**

| Scenario | Pattern | Why |
|----------|---------|-----|
| Not authenticated (401) | `throw new Response(…, { status: 401 })` | Error boundary handles it |
| Resource not found (404) | `throw new Response(…, { status: 404 })` | Error boundary handles it |
| Forbidden (403) | `throw new Response(…, { status: 403 })` | Error boundary handles it |
| Form field missing/invalid | `return json({ errors: { field: "message" } }, { status: 400 })` | Preserve form state, show inline |
| DB/Shopify API failure | `throw new Response(…, { status: 500 })` | Unexpected — error boundary |
| Rate limit, external timeout | `throw new Response(…, { status: 503 })` | Retry at boundary, not here |

**Implementation:**
```typescript
// Throwing: stops execution, renders ErrorBoundary
if (!bundle) {
  throw new Response("Bundle not found", { status: 404 });
}

// Returning: preserves component, renders inline error
const errors: Record<string, string> = {};
if (!name) errors.name = "Bundle name is required";
if (Object.keys(errors).length > 0) {
  return json({ errors }, { status: 400 });
}
```

**Rule:** Never use throw for input validation — it will flood error tracking services with user typos.

---

## Standard 3: Auth Guards — Single Point of Entry

**Pattern established in this codebase (`app/lib/auth-guards.server.ts`):**

```typescript
// ✅ CORRECT: Use the guard, destructure, proceed
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await requireAdminSession(request);
  // admin and session are now typed and guaranteed
};

// ✅ CORRECT: Internal secret for webhooks
export const action = async ({ request }: ActionFunctionArgs) => {
  const authError = requireInternalSecret(request);
  if (authError) return authError;  // Returns 401 Response

  const body = await request.text(); // Safe to read after auth
};

// ❌ WRONG: Direct authenticate calls in routes (bypasses guard layer)
const { admin } = await authenticate.admin(request);
```

---

## Standard 4: Shopify Admin GraphQL — Consistent Response Handling

**Always check both error layers in this exact order:**

```typescript
const response = await admin.graphql(QUERY, { variables });
const data = await response.json();

// Layer 1: Transport errors (always present on failure)
if (data.errors?.length) {
  throw new Response(
    JSON.stringify({ error: data.errors[0].message }),
    { status: 500 }
  );
}

// Layer 2: Mutation user errors (only on mutations)
const userErrors = data.data?.productUpdate?.userErrors ?? [];
if (userErrors.length > 0) {
  // User errors = merchant data problem, not a server error
  return json({ success: false, error: userErrors[0].message }, { status: 422 });
}
```

**Rules:**
- Every mutation must check `userErrors`. No exceptions.
- Queries only need to check `data.errors`.
- Define GraphQL queries/mutations as `const` variables outside the function for readability.
- Name the query/mutation variable after what it does: `GET_BUNDLE_PRODUCT`, `UPDATE_PRODUCT_STATUS`.

---

## Standard 5: Prisma Queries — Explicit Select, No Overfetch

```typescript
// ✅ CORRECT: Select exactly what you need
const bundle = await db.bundle.findUnique({
  where: { id: bundleId, shopId: session.shop }, // scope by shop for multi-tenancy
  select: {
    id: true,
    name: true,
    status: true,
    shopifyProductId: true,
    steps: {
      select: {
        id: true,
        name: true,
        minQuantity: true,
        maxQuantity: true,
        StepProduct: { select: { id: true, productId: true } },
      },
    },
  },
});

// ❌ WRONG: include with no select (fetches all columns)
const bundle = await db.bundle.findUnique({
  where: { id: bundleId },
  include: { steps: true, pricing: true },
});
```

**Rules:**
- Always scope queries by `shopId: session.shop` for multi-tenancy.
- Prefer `select` over `include` — include fetches all columns by default.
- Add `take` / `skip` for any list query (bundles, steps, products).

---

## Standard 6: Parallel Operations — Declare Failure Semantics Explicitly

```typescript
// If ALL must succeed (all critical):
await Promise.all([
  updateComponentMetafields(admin, productId, config),
  updateVariantMetafields(admin, productId, config),
]);
// Any failure throws — callers get a clear error

// If some can fail (mixed criticality):
const [required, optional] = await Promise.allSettled([
  updateComponentMetafields(admin, productId, config),   // critical
  updateStandardMetafields(admin, productId, meta),      // non-critical
]);

if (required.status === "rejected") {
  throw new Error(`Critical metafield update failed: ${required.reason}`);
}
if (optional.status === "rejected") {
  AppLogger.warn("Standard metafields skipped", {}, optional.reason);
}
```

**Rule:** Never mix `try/catch` inside some IIFEs of a `Promise.all` call without wrapping all of them consistently. Use `Promise.allSettled` when criticality differs.

---

## Standard 7: Function Size and Responsibility

**Target:** Any function that cannot be read without scrolling has too many responsibilities.

**Signs a function needs decomposition:**
- More than ~80 lines
- More than 2 levels of nesting
- Touches DB AND calls Shopify API AND builds a response
- Has a comment like `// STEP 4: ...` — steps belong in separate functions

**Decomposition template for route handlers:**
```typescript
// ✅ Route handler: thin orchestrator
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin, session } = await requireAdminSession(request);
  const formData = await request.formData();
  const input = parseBundleSaveInput(formData);          // validate + parse
  const result = await saveBundleWithSync(admin, session, params.bundleId, input);
  return json(result);
};

// Specialist functions, each independently testable:
function parseBundleSaveInput(formData: FormData): BundleSaveInput { ... }
async function saveBundleWithSync(admin, session, bundleId, input): Promise<SaveResult> { ... }
async function syncBundleToShopify(admin, bundle, status): Promise<void> { ... }
```

---

## Standard 8: Type Narrowing Over `as any`

**Use in order of preference:**

```typescript
// 1. Proper types (always preferred)
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
function doSomething(admin: AdminApiContext["admin"]) { ... }

// 2. Type guard (for unknown/dynamic data)
function isBundleConfig(v: unknown): v is BundleConfig {
  return typeof v === "object" && v !== null && "bundleId" in v;
}

// 3. instanceof (for Error objects)
const message = error instanceof Error ? error.message : String(error);

// 4. Unknown + assertion at boundary (for external API responses)
const data: unknown = await response.json();
if (!isBundleConfig(data)) {
  throw new Error("Unexpected API response shape");
}
// Now data is typed as BundleConfig

// 5. NEVER: as any, unless absolutely unavoidable in third-party interop
```

---

## Standard 9: Logging — AppLogger Always, Never `console.*`

| Use | When |
|-----|------|
| `AppLogger.debug` | Dev-only information (request payloads, computed values) |
| `AppLogger.info` | Notable business events (bundle created, token refreshed) |
| `AppLogger.warn` | Degraded operation (optional step failed, using default) |
| `AppLogger.error` | Failures that affect user outcome |

```typescript
// ✅ CORRECT: Structured, filterable, consistent
AppLogger.error("Failed to update bundle metafields", {
  component: "handlers.server",
  operation: "updateMetafields",
  bundleId,
  productId,
}, error);

// ❌ WRONG: Unstructured, unfilterable, inconsistent
console.log('[BUNDLE_CONFIG] ═══════ ERROR ═══════');
console.log('[BUNDLE_CONFIG] Failed to update:', error);
```

---

## Standard 10: Import Style — `node:` Protocol

All Node built-ins must use the `node:` protocol prefix (enforced by ESLint `unicorn/prefer-node-protocol`):

```typescript
import { createHash, timingSafeEqual } from "node:crypto";
import { PassThrough } from "node:stream";
import { execSync } from "node:child_process";
```

---

## Standard 11: App Bridge Web Component Props

App Bridge components (`<SaveBar>`, `<Modal>`, `<TitleBar>`, `<ContextualSaveBar>`) are DOM web components, not React components. They only accept their documented HTML attributes — passing undocumented props causes a console error and the prop is silently ignored.

**Audit checklist for App Bridge components:**
```
<SaveBar>            Valid: id, open
                     ❌ NOT valid: discardConfirmation, onSave, onDiscard (these are React wrapper concepts)

<Modal>              Valid: id, variant ("base" | "small" | "large" | "max"), open
                     ❌ NOT valid: primaryAction, secondaryActions (Polaris Modal concepts)

<TitleBar>           Valid: title
                     ❌ NOT valid: breadcrumbs (must use slot="breadcrumbs")
```

**Correct SaveBar pattern:**
```tsx
<SaveBar id="bundle-save-bar" open={isDirty}>
  <button variant="primary" slot="save-action" onClick={handleSave}>Save</button>
  <button slot="discard-action" onClick={handleDiscard}>Discard</button>
</SaveBar>
```

**How to verify:** Open Chrome DevTools Console on the embedded admin page. Any `Unexpected value for attribute` message is an invalid prop. Zero console errors is the target.

---

## Standard 12: Live Verification with Chrome DevTools MCP

After applying any refactor fix, verify it on the running dev server before committing.

### Dev Server Log Spying

```bash
# Tail the running shopify app dev log
tail -f /tmp/shopify-dev.log

# Filter for errors only
tail -f /tmp/shopify-dev.log | grep -i "error\|warn\|prisma\|failed"

# Check if the dev server process is alive
pgrep -la "shopify app dev" || echo "Dev server not running"
```

### Chrome DevTools MCP Verification Workflow

For every fix that affects rendered UI or console output:

1. **Get console state before fix:**
```javascript
// In mcp__chrome-devtools__evaluate_script on the affected page:
// Returns all console errors from the current session
console.error.toString()
```

2. **Navigate to the affected route:**
```
mcp__chrome-devtools__navigate_page to the admin route
mcp__chrome-devtools__wait_for { "selector": "#app-content" }
```

3. **Check for console errors after fix:**
```
mcp__chrome-devtools__list_console_messages
// Filter for "error" level — target is 0 errors
```

4. **Spot-check API calls:**
```
mcp__chrome-devtools__list_network_requests
// Verify no unexpected 4xx/5xx on app proxy or admin API routes
```

5. **Verify widget behaviour (storefront):**
```javascript
// In Chrome DevTools console on the storefront page:
console.log(window.__BUNDLE_WIDGET_VERSION__)  // should match expected version
fetch('/cart.js').then(r => r.json()).then(console.log) // inspect cart state
```

### Shopify-Specific Console Patterns to Watch For

| Console message | Root cause |
|----------------|-----------|
| `Unexpected value for attribute "X" on <ui-Y>` | Invalid App Bridge web component prop (AP-11) |
| `Failed to execute 'postMessage' on 'DOMWindow'` | App Bridge modal in dev tunnel — dev-only, not a code bug |
| `PrismaClientKnownRequestError: Timed out fetching` | Expired Cloudflare tunnel / dead DB connection — restart dev server |
| `ReferenceError: X is not defined` (SSR stack trace) | Missing import in route file |
| `Error in PostgreSQL connection: Error { kind: Closed }` | Same as above — tunnel expired |
| `Throttled: Exceeded 40 calls per app per store per minute` | Admin GraphQL rate limit — add debounce or batch |

---

## Decision Framework: Should I Simplify This?

Answer these questions:

1. **Can I describe what this function does in one sentence?**
   - No → decompose it (Standard 7)

2. **Is this data validated more than once on the same code path?**
   - Yes → extract to a single normalisation function (Standard 1, AP-03)

3. **Does this catch block continue execution as if nothing happened?**
   - Yes → decide: is this failure critical or non-critical? Make it explicit (Standard 6)

4. **Is `as any` hiding a real type mismatch?**
   - Yes → find the correct type or define a minimal interface (Standard 8, AP-04)

5. **Is this a "try primary, catch, try secondary" pattern?**
   - Yes → identify root cause, fix at source, remove fallback (AP-01)

6. **Does this function do both DB writes AND Shopify API calls?**
   - Yes → extract to separate functions (Standard 7)

7. **Is `console.log` used here?**
   - Yes → replace with AppLogger (Standard 9)

---

## Checklist Before Marking a Simplification Complete

- [ ] No `as any` at module/function boundaries
- [ ] Every `catch` block either rethrows or explicitly handles partial failure
- [ ] No `console.log`/`console.error` — only AppLogger
- [ ] Validation runs once per logical boundary
- [ ] `Promise.all` vs `Promise.allSettled` chosen intentionally
- [ ] GraphQL mutations check `userErrors`
- [ ] Functions fit on screen (~80 lines) or are documented with why they're longer
- [ ] `npm run lint -- --max-warnings 9999` passes with 0 errors
